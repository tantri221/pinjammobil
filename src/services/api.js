import { getSupabase } from '../lib/supabase'
import { isTestDriveLoan } from '../lib/utils'

export const api = {
  isTestDriveUnit(loan, vehicle = null) {
    return isTestDriveLoan(loan, vehicle)
  },
  // ==========================================
  // 1. VEHICLES CRUD
  // ==========================================
  
  async getVehicles() {
    const supabase = getSupabase()
    if (!supabase) return { data: [], error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error

      const formatted = (data || []).map(v => ({
        ...v,
        classification: v.classification || 'Kendaraan Oprasional / Aset'
      }))

      return { data: formatted, error: null }
    } catch (err) {
      console.error('Supabase getVehicles error:', err)
      return { data: [], error: err.message || 'Gagal memuat kendaraan.' }
    }
  },

  async createVehicle(vehicleData) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const payload = {
        name: vehicleData.name,
        license_plate: vehicleData.license_plate,
        type: vehicleData.type || 'MPV',
        classification: vehicleData.classification || 'Kendaraan Oprasional / Aset',
        status: vehicleData.status || 'available',
        capacity: Number(vehicleData.capacity) || 7,
        fuel_level: Number(vehicleData.fuel_level) || 100,
        mileage: Number(vehicleData.mileage) || 0
      }

      let { data, error } = await supabase
        .from('vehicles')
        .insert([payload])
        .select()

      if (error && (error.code === '42703' || String(error.message).includes('classification'))) {
        delete payload.classification
        const retry = await supabase.from('vehicles').insert([payload]).select()
        data = retry.data
        error = retry.error
      }

      if (error) throw error
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Supabase createVehicle error:', err)
      return { success: false, error: err.message }
    }
  },

  async updateVehicle(id, updates) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      let { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()

      if (error && (error.code === '42703' || String(error.message).includes('classification'))) {
        const fallbackUpdates = { ...updates }
        delete fallbackUpdates.classification
        const retry = await supabase
          .from('vehicles')
          .update(fallbackUpdates)
          .eq('id', id)
          .select()
        data = retry.data
        error = retry.error
      }

      if (error) throw error
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Supabase updateVehicle error:', err)
      return { success: false, error: err.message }
    }
  },

  async deleteVehicle(id) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('Supabase deleteVehicle error:', err)
      return { success: false, error: err.message }
    }
  },

  // ==========================================
  // 2. LOANS CRUD
  // ==========================================

  parseLoanApprovals(loan) {
    const isTD = isTestDriveLoan(loan, loan?.vehicles)

    let approvalData = {
      ga: { status: 'pending', by: null, at: null, note: '' },
      spv: isTD 
        ? { status: 'pending', by: null, at: null, note: '' }
        : { status: 'not_required', by: 'Sistem', at: null, note: 'Khusus Armada Test Drive (Dilewati)' },
      adh: { status: 'pending', by: null, at: null, note: '' }
    }

    if (loan.approval_spv) approvalData.spv.status = loan.approval_spv
    if (loan.approval_ga) approvalData.ga.status = loan.approval_ga
    if (loan.approval_adh) approvalData.adh.status = loan.approval_adh

    if (loan.notes) {
      try {
        if (loan.notes.includes('__APPROVAL_DATA__:')) {
          const jsonPart = loan.notes.split('__APPROVAL_DATA__:')[1]
          const parsed = JSON.parse(jsonPart)
          approvalData = { ...approvalData, ...parsed }
        } else if (loan.notes.trim().startsWith('{') && loan.notes.trim().endsWith('}')) {
          const parsed = JSON.parse(loan.notes)
          if (parsed.approvals) {
            approvalData = { ...approvalData, ...parsed.approvals }
          }
        }
      } catch (e) {
        // fallback
      }
    }

    // Jika BUKAN unit Test Drive, pastikan status SPV adalah not_required jika masih pending
    if (!isTD && (!approvalData.spv || approvalData.spv.status === 'pending')) {
      approvalData.spv = {
        status: 'not_required',
        by: 'Sistem',
        at: null,
        note: 'Khusus Armada Test Drive (Dilewati)'
      }
    }

    if (loan.status === 'completed' || loan.status === 'approved') {
      if (approvalData.ga.status === 'pending') approvalData.ga.status = 'approved'
      if (isTD && approvalData.spv?.status === 'pending') approvalData.spv.status = 'approved'
      if (approvalData.adh.status === 'pending') approvalData.adh.status = 'approved'
    }

    return approvalData
  },

  parseSecurityData(loan) {
    let secData = {
      gate_status: 'standby', // 'standby' (siap keluar) | 'out' (sedang di luar) | 'in' (telah kembali)
      out_time: null,
      out_km: loan.start_mileage || 0,
      out_by: null,
      out_notes: '',
      in_time: null,
      in_km: loan.end_mileage || null,
      in_by: null,
      in_notes: '',
      in_fuel: null
    }

    if (loan.notes && loan.notes.includes('__SECURITY_DATA__:')) {
      try {
        const secPart = loan.notes.split('__SECURITY_DATA__:')[1].split('__APPROVAL_DATA__:')[0]
        const parsed = JSON.parse(secPart.trim())
        secData = { ...secData, ...parsed }
      } catch (e) {}
    } else {
      if (loan.status === 'completed') {
        secData.gate_status = 'in'
        secData.in_km = loan.end_mileage
      } else if (loan.status === 'approved') {
        secData.gate_status = 'standby'
      }
    }

    return secData
  },

  async getLoans() {
    const supabase = getSupabase()
    if (!supabase) return { data: [], error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      let { data, error } = await supabase
        .from('loans')
        .select('*, vehicles(name, license_plate, type, classification)')
        .order('created_at', { ascending: false })

      if (error && (error.code === '42703' || String(error.message).includes('classification') || String(error.message).includes('vehicles_1.classification'))) {
        const fallback = await supabase
          .from('loans')
          .select('*, vehicles(name, license_plate, type)')
          .order('created_at', { ascending: false })
        data = fallback.data
        error = fallback.error
      }

      if (error) throw error

      const formatted = (data || []).map(item => {
        const fuelMatch = item.notes?.match(/\[BBM Awal:\s*([^\]]+)\]/i)
        const start_fuel = fuelMatch ? fuelMatch[1].trim() : (item.start_fuel || '')

        const buyFuelMatch = item.notes?.match(/\[Beli BBM:\s*([^\]]+)\]/i)
        const buyFuelRaw = buyFuelMatch ? buyFuelMatch[1].trim() : ''
        const buy_fuel = buyFuelRaw.startsWith('YA') ? 'YA' : 'TIDAK'
        const fuel_amount = buyFuelRaw.includes('- Rp') ? buyFuelRaw.split('- Rp')[1].trim() : ''

        let cleanNote = item.notes?.split('__APPROVAL_DATA__:')[0]?.split('__SECURITY_DATA__:')[0]?.trim() || ''
        cleanNote = cleanNote
          .replace(/\[BBM Awal:\s*[^\]]+\]/gi, '')
          .replace(/\[Beli BBM:\s*[^\]]+\]/gi, '')
          .trim()

        const isTD = isTestDriveLoan(item, item.vehicles)

        return {
          ...item,
          vehicle_name: item.vehicles?.name || item.vehicle_name,
          license_plate: item.vehicles?.license_plate || item.license_plate,
          vehicle_type: item.vehicles?.type || item.vehicle_type,
          classification: item.vehicles?.classification || item.classification || 'Kendaraan Oprasional / Aset',
          is_test_drive: isTD,
          start_fuel,
          buy_fuel,
          fuel_amount,
          displayNotes: cleanNote,
          approvals: this.parseLoanApprovals(item),
          security: this.parseSecurityData(item)
        }
      })

      return { data: formatted, error: null }
    } catch (err) {
      console.error('Supabase getLoans error:', err)
      return { data: [], error: err.message }
    }
  },

  async createLoan(loanData) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      // Periksa apakah armada adalah unit TEST DRIVE berdasarkan klasifikasi yang ditentukan Administrator
      let isTD = isTestDriveLoan(loanData)
      if (!isTD && loanData.vehicle_id) {
        try {
          let { data: vData, error: vErr } = await supabase
            .from('vehicles')
            .select('name, license_plate, type, classification')
            .eq('id', loanData.vehicle_id)
            .single()

          if (vErr && (vErr.code === '42703' || String(vErr.message).includes('classification'))) {
            const fallback = await supabase
              .from('vehicles')
              .select('name, license_plate, type')
              .eq('id', loanData.vehicle_id)
              .single()
            vData = fallback.data
          }

          if (vData && isTestDriveLoan(null, vData)) {
            isTD = true
          }
        } catch (vErr) {
          console.warn('Gagal cek status test drive kendaraan:', vErr)
        }
      }

      // Alur otorisasi berjenjang:
      // 1. Verifikasi GA: semua armada
      // 2. Persetujuan SPV: khusus unit TEST DRIVE (untuk non-test drive otomatis not_required)
      // 3. Persetujuan ADH: semua unit
      const initialApprovals = {
        ga: { status: 'pending', by: null, at: null, note: '' },
        spv: isTD
          ? { status: 'pending', by: null, at: null, note: '' }
          : { status: 'not_required', by: 'Sistem', at: new Date().toISOString(), note: 'Khusus Armada Test Drive (Dilewati)' },
        adh: { status: 'pending', by: null, at: null, note: '' }
      }

      const userNote = (loanData.notes || '').trim()
      const fuelPrefix = loanData.start_fuel ? `[BBM Awal: ${loanData.start_fuel}]` : ''
      const buyFuelPrefix = loanData.buy_fuel === 'YA' 
        ? `[Beli BBM: YA - Rp ${loanData.fuel_amount || '100.000'}]` 
        : `[Beli BBM: TIDAK]`

      const combinedUserNote = [fuelPrefix, buyFuelPrefix, userNote].filter(Boolean).join(' ')

      const notesWithApproval = combinedUserNote
        ? `${combinedUserNote}\n\n__APPROVAL_DATA__:${JSON.stringify(initialApprovals)}`
        : `__APPROVAL_DATA__:${JSON.stringify(initialApprovals)}`

      const payload = {
        vehicle_id: Number(loanData.vehicle_id),
        borrower_name: loanData.borrower_name,
        division: loanData.division,
        purpose: loanData.purpose,
        destination: loanData.destination,
        start_date: loanData.start_date,
        end_date: loanData.end_date,
        start_mileage: Number(loanData.start_mileage || 0),
        status: 'pending',
        notes: notesWithApproval
      }

      const { data, error } = await supabase
        .from('loans')
        .insert([payload])
        .select()

      if (error) throw error

      // Update level BBM di armada jika diinput
      if (loanData.start_fuel && loanData.vehicle_id) {
        const numericFuel = parseInt(loanData.start_fuel, 10)
        if (!isNaN(numericFuel)) {
          await supabase
            .from('vehicles')
            .update({ fuel_level: numericFuel })
            .eq('id', loanData.vehicle_id)
        }
      }

      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Supabase createLoan error:', err)
      return { success: false, error: err.message }
    }
  },

  async updateLoanApproval(loanId, stage, action, approverUser, note = '') {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      let { data: loan, error: fetchErr } = await supabase
        .from('loans')
        .select('*, vehicles(name, license_plate, type, classification)')
        .eq('id', loanId)
        .single()

      if (fetchErr && (fetchErr.code === '42703' || String(fetchErr.message).includes('classification') || String(fetchErr.message).includes('vehicles_1.classification'))) {
        const fallback = await supabase
          .from('loans')
          .select('*, vehicles(name, license_plate, type)')
          .eq('id', loanId)
          .single()
        loan = fallback.data
        fetchErr = fallback.error
      }

      if (fetchErr || !loan) {
        return { success: false, error: 'Data peminjaman tidak ditemukan.' }
      }

      const isTD = isTestDriveLoan(loan, loan.vehicles)
      const currentApprovals = this.parseLoanApprovals(loan)
      currentApprovals[stage] = {
        status: action,
        by: approverUser?.name || 'Otorisator',
        role: approverUser?.role || 'staff',
        at: new Date().toISOString(),
        note: (note || '').trim()
      }

      // Hitung status keseluruhan
      // Aturan alur:
      // - Verifikasi GA untuk semua armada
      // - Persetujuan SPV khusus untuk armada/unit TEST DRIVE
      // - Persetujuan ADH untuk semua armada
      let newOverallStatus = 'pending'
      if (
        currentApprovals.ga?.status === 'rejected' ||
        (isTD && currentApprovals.spv?.status === 'rejected') ||
        currentApprovals.adh?.status === 'rejected'
      ) {
        newOverallStatus = 'rejected'
      } else if (
        currentApprovals.ga?.status === 'approved' &&
        (!isTD || currentApprovals.spv?.status === 'approved' || currentApprovals.spv?.status === 'not_required') &&
        currentApprovals.adh?.status === 'approved'
      ) {
        newOverallStatus = 'approved'
      }

      const currentSec = this.parseSecurityData(loan)
      let baseNote = (loan.notes || '')
        .split('__SECURITY_DATA__:')[0]
        .split('__APPROVAL_DATA__:')[0]
        .trim()

      let newNotes = baseNote
      if (loan.notes && loan.notes.includes('__SECURITY_DATA__:')) {
        newNotes += (newNotes ? '\n\n' : '') + `__SECURITY_DATA__:${JSON.stringify(currentSec)}`
      }
      newNotes += (newNotes ? '\n\n' : '') + `__APPROVAL_DATA__:${JSON.stringify(currentApprovals)}`

      const payload = {
        status: newOverallStatus,
        notes: newNotes
      }

      const { error: updateErr } = await supabase
        .from('loans')
        .update(payload)
        .eq('id', loanId)

      if (updateErr) throw updateErr

      // Sinkronkan status armada
      if (loan.vehicle_id) {
        if (newOverallStatus === 'approved') {
          await supabase
            .from('vehicles')
            .update({ status: 'borrowed' })
            .eq('id', loan.vehicle_id)
        } else if (newOverallStatus === 'rejected') {
          await supabase
            .from('vehicles')
            .update({ status: 'available' })
            .eq('id', loan.vehicle_id)
        }
      }

      return { 
        success: true, 
        overallStatus: newOverallStatus, 
        approvals: currentApprovals 
      }
    } catch (err) {
      console.error('Update approval error:', err)
      return { success: false, error: err.message || 'Gagal memproses persetujuan.' }
    }
  },

  async returnVehicle(loanId, vehicleId, endMileage) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { error: loanErr } = await supabase
        .from('loans')
        .update({ 
          status: 'completed',
          end_mileage: Number(endMileage)
        })
        .eq('id', loanId)

      if (loanErr) throw loanErr

      if (vehicleId) {
        await supabase
          .from('vehicles')
          .update({ 
            status: 'available',
            mileage: Number(endMileage)
          })
          .eq('id', vehicleId)
      }

      return { success: true }
    } catch (err) {
      console.error('Supabase returnVehicle error:', err)
      return { success: false, error: err.message }
    }
  },

  async recordSecurityGateOut(loanId, gateData, securityUser) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { data: loan, error: fetchErr } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single()

      if (fetchErr || !loan) {
        return { success: false, error: 'Data peminjaman tidak ditemukan.' }
      }

      const currentSec = this.parseSecurityData(loan)
      currentSec.gate_status = 'out'
      currentSec.out_time = new Date().toISOString()
      currentSec.out_km = Number(gateData.out_km || loan.start_mileage || 0)
      currentSec.out_by = securityUser?.name || 'Petugas Security'
      currentSec.out_notes = (gateData.out_notes || '').trim()

      const currentApprovals = this.parseLoanApprovals(loan)

      let baseNote = (loan.notes || '')
        .split('__SECURITY_DATA__:')[0]
        .split('__APPROVAL_DATA__:')[0]
        .trim()

      let newNotes = baseNote
      newNotes += (newNotes ? '\n\n' : '') + `__SECURITY_DATA__:${JSON.stringify(currentSec)}`
      newNotes += `\n\n__APPROVAL_DATA__:${JSON.stringify(currentApprovals)}`

      const payload = {
        notes: newNotes,
        start_mileage: currentSec.out_km
      }

      const { error: updateErr } = await supabase
        .from('loans')
        .update(payload)
        .eq('id', loanId)

      if (updateErr) throw updateErr

      if (loan.vehicle_id) {
        await supabase
          .from('vehicles')
          .update({ status: 'borrowed' })
          .eq('id', loan.vehicle_id)
      }

      return { success: true, data: currentSec }
    } catch (err) {
      console.error('recordSecurityGateOut error:', err)
      return { success: false, error: err.message || 'Gagal mencatat mobil keluar.' }
    }
  },

  async recordSecurityGateIn(loanId, vehicleId, gateData, securityUser) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { data: loan, error: fetchErr } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single()

      if (fetchErr || !loan) {
        return { success: false, error: 'Data peminjaman tidak ditemukan.' }
      }

      const currentSec = this.parseSecurityData(loan)
      currentSec.gate_status = 'in'
      currentSec.in_time = new Date().toISOString()
      currentSec.in_km = Number(gateData.in_km || 0)
      currentSec.in_by = securityUser?.name || 'Petugas Security'
      currentSec.in_notes = (gateData.in_notes || '').trim()
      if (gateData.in_fuel) currentSec.in_fuel = gateData.in_fuel

      const currentApprovals = this.parseLoanApprovals(loan)

      let baseNote = (loan.notes || '')
        .split('__SECURITY_DATA__:')[0]
        .split('__APPROVAL_DATA__:')[0]
        .trim()

      let newNotes = baseNote
      newNotes += (newNotes ? '\n\n' : '') + `__SECURITY_DATA__:${JSON.stringify(currentSec)}`
      newNotes += `\n\n__APPROVAL_DATA__:${JSON.stringify(currentApprovals)}`

      const payload = {
        status: 'completed',
        end_mileage: currentSec.in_km,
        notes: newNotes
      }

      const { error: loanErr } = await supabase
        .from('loans')
        .update(payload)
        .eq('id', loanId)

      if (loanErr) throw loanErr

      if (vehicleId || loan.vehicle_id) {
        const vId = vehicleId || loan.vehicle_id
        const vUpdate = {
          status: 'available',
          mileage: currentSec.in_km
        }
        if (gateData.fuel_level !== undefined && gateData.fuel_level !== null) {
          vUpdate.fuel_level = Number(gateData.fuel_level)
        }
        await supabase
          .from('vehicles')
          .update(vUpdate)
          .eq('id', vId)
      }

      return { success: true, data: currentSec }
    } catch (err) {
      console.error('recordSecurityGateIn error:', err)
      return { success: false, error: err.message || 'Gagal mencatat mobil kembali.' }
    }
  },

  async cancelLoan(loanId, vehicleId, cancelledBy, reason = '') {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { data: loan, error: fetchErr } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single()

      if (fetchErr || !loan) {
        return { success: false, error: 'Data peminjaman tidak ditemukan.' }
      }

      const currentApprovals = this.parseLoanApprovals(loan)
      const cancelNote = `[Dibatalkan oleh ${cancelledBy?.name || 'Pengguna'} (${cancelledBy?.role?.toUpperCase() || 'USER'})]: ${reason || 'Pengajuan dibatalkan.'}`
      
      // Update stages with cancel note
      if (currentApprovals.ga?.status === 'pending') {
        currentApprovals.ga.status = 'rejected'
        currentApprovals.ga.note = reason || 'Pengajuan dibatalkan'
      }
      if (currentApprovals.spv?.status === 'pending') {
        currentApprovals.spv.status = 'rejected'
        currentApprovals.spv.note = reason || 'Pengajuan dibatalkan'
      }
      if (currentApprovals.adh?.status === 'pending') {
        currentApprovals.adh.status = 'rejected'
        currentApprovals.adh.note = reason || 'Pengajuan dibatalkan'
      }

      const baseNote = loan.notes && loan.notes.includes('__APPROVAL_DATA__:')
        ? loan.notes.split('__APPROVAL_DATA__:')[0].trim()
        : (loan.notes || '').trim()

      const newBaseNote = baseNote ? `${baseNote}\n${cancelNote}` : cancelNote
      const newNotes = `${newBaseNote}\n\n__APPROVAL_DATA__:${JSON.stringify(currentApprovals)}`

      const { error: updateErr } = await supabase
        .from('loans')
        .update({
          status: 'rejected',
          notes: newNotes
        })
        .eq('id', loanId)

      if (updateErr) throw updateErr

      // Kembalikan status armada menjadi available jika sebelumnya borrowed
      const vId = vehicleId || loan.vehicle_id
      if (vId) {
        await supabase
          .from('vehicles')
          .update({ status: 'available' })
          .eq('id', vId)
      }

      return { success: true }
    } catch (err) {
      console.error('Supabase cancelLoan error:', err)
      return { success: false, error: err.message || 'Gagal membatalkan peminjaman.' }
    }
  },

  async deleteLoan(id) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('Supabase deleteLoan error:', err)
      return { success: false, error: err.message }
    }
  },

  // ==========================================
  // 3. AUTHENTICATION & SETTINGS
  // ==========================================

  async getRegistrationStatus() {
    const supabase = getSupabase()
    if (!supabase) return false

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'allow_registration')
        .single()

      if (error || !data) return false
      return data.value === 'true'
    } catch (err) {
      console.warn('Gagal membaca allow_registration:', err)
      return false
    }
  },

  async setRegistrationStatus(enabled) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'allow_registration',
          value: enabled ? 'true' : 'false',
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      return { success: true, enabled }
    } catch (err) {
      console.error('Gagal memperbarui status registrasi:', err)
      return { success: false, error: err.message }
    }
  },

  async getSecurityCodes() {
    const defaultCodes = [
      { id: 1, slot: 'Security 1', name: 'Petugas Security 1', code: '1111', shift: 'Shift Pagi (07:00 - 15:00)', isActive: true },
      { id: 2, slot: 'Security 2', name: 'Petugas Security 2', code: '2222', shift: 'Shift Pagi (07:00 - 15:00)', isActive: true },
      { id: 3, slot: 'Security 3', name: 'Petugas Security 3', code: '3333', shift: 'Shift Sore (15:00 - 23:00)', isActive: true },
      { id: 4, slot: 'Security 4', name: 'Petugas Security 4', code: '4444', shift: 'Shift Sore (15:00 - 23:00)', isActive: true },
      { id: 5, slot: 'Security 5', name: 'Petugas Security 5', code: '5555', shift: 'Shift Malam (23:00 - 07:00)', isActive: true },
      { id: 6, slot: 'Security 6', name: 'Petugas Security 6', code: '6666', shift: 'Shift Malam (23:00 - 07:00)', isActive: true },
    ]

    const supabase = getSupabase()
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'security_codes')
          .single()

        if (!error && data?.value) {
          const parsed = JSON.parse(data.value)
          if (Array.isArray(parsed) && parsed.length === 6) {
            localStorage.setItem('pinjammobil_security_codes', JSON.stringify(parsed))
            return parsed
          }
        }
      }
    } catch (err) {
      console.warn('Gagal membaca security_codes dari Supabase:', err)
    }

    try {
      const saved = localStorage.getItem('pinjammobil_security_codes')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 6) return parsed
      }
    } catch (e) {}

    return defaultCodes
  },

  async saveSecurityCodes(codes) {
    const supabase = getSupabase()
    try {
      localStorage.setItem('pinjammobil_security_codes', JSON.stringify(codes))

      if (supabase) {
        await supabase
          .from('app_settings')
          .upsert({
            key: 'security_codes',
            value: JSON.stringify(codes),
            updated_at: new Date().toISOString()
          })
      }

      return { success: true, data: codes }
    } catch (err) {
      console.error('saveSecurityCodes error:', err)
      return { success: false, error: err.message }
    }
  },

  async login(identifier, password) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      const cleanId = identifier.trim().toLowerCase()
      const digitsOnly = cleanId.replace(/[^0-9]/g, '')
      const phoneEmail = digitsOnly ? `${digitsOnly}@pinjammobil.local` : ''

      let orFilter = `username.eq.${cleanId},email.eq.${cleanId}`
      if (phoneEmail) {
        orFilter += `,email.eq.${phoneEmail}`
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, email, name, role, division, password')
        .or(orFilter)
        .single()

      if (error || !data) {
        return { success: false, error: 'Username, nomor HP, atau email tidak ditemukan.' }
      }

      if (data.password !== password) {
        return { success: false, error: 'Kata sandi salah.' }
      }

      const { password: _, ...userSession } = data
      const isPhoneEmail = userSession.email && userSession.email.endsWith('@pinjammobil.local')
      const phone = isPhoneEmail ? userSession.email.replace('@pinjammobil.local', '') : ''
      const userObj = {
        ...userSession,
        phone,
        displayContact: isPhoneEmail ? phone : userSession.email
      }

      return { success: true, user: userObj }
    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: err.message || 'Gagal login.' }
    }
  },

  // Registrasi Publik (Terikat status toggle allow_registration)
  async register(userData) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      const isAllowed = await this.getRegistrationStatus()
      if (!isAllowed) {
        return { 
          success: false, 
          error: 'Pendaftaran akun baru saat ini DINONAKTIFKAN oleh Administrator.' 
        }
      }

      return await this.createUser(userData)
    } catch (err) {
      console.error('Register error:', err)
      return { success: false, error: err.message || 'Gagal mendaftar akun baru.' }
    }
  },

  // Tambah User Baru oleh Admin (Bebas wewenang role, tanpa terikat toggle registrasi publik)
  async createUser(userData) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      const cleanPhone = userData.phone ? userData.phone.trim().replace(/[^0-9+]/g, '') : ''
      const emailValue = userData.email?.trim() 
        ? userData.email.trim().toLowerCase()
        : (cleanPhone ? `${cleanPhone}@pinjammobil.local` : `${userData.username.trim().toLowerCase()}@pinjammobil.local`)

      const payload = {
        name: userData.name.trim(),
        username: userData.username.trim().toLowerCase(),
        email: emailValue,
        password: userData.password ? userData.password.trim() : 'password123',
        division: userData.division || 'Operasional',
        role: userData.role || 'staff'
      }

      const { data, error } = await supabase
        .from('app_users')
        .insert([payload])
        .select('id, username, email, name, role, division')
        .single()

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Username atau nomor HP / email sudah digunakan oleh user lain.' }
        }
        if (error.code === '23514') {
          return { 
            success: false, 
            error: 'Database Supabase memerlukan pembaruan batasan role. Silakan jalankan query di Supabase SQL Editor: ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_role_check; ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check CHECK (role IN (\'admin\', \'staff\', \'ga\', \'spv\', \'adh\'));' 
          }
        }
        throw error
      }

      const isPhoneEmail = data.email && data.email.endsWith('@pinjammobil.local')
      const phone = isPhoneEmail ? data.email.replace('@pinjammobil.local', '') : ''
      const userObj = {
        ...data,
        phone,
        displayContact: isPhoneEmail ? phone : data.email
      }

      return { success: true, user: userObj }
    } catch (err) {
      console.error('Create user error:', err)
      return { success: false, error: err.message || 'Gagal menambahkan akun pengguna.' }
    }
  },

  async getUsers() {
    const supabase = getSupabase()
    if (!supabase) return { data: [], error: 'Klien Supabase belum siap.' }

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, email, name, role, division, created_at')
        .order('id', { ascending: true })

      if (error) throw error

      const formatted = (data || []).map(u => {
        const isPhoneEmail = u.email && u.email.endsWith('@pinjammobil.local')
        const phone = isPhoneEmail ? u.email.replace('@pinjammobil.local', '') : ''
        return {
          ...u,
          phone,
          displayContact: isPhoneEmail ? phone : u.email
        }
      })

      return { data: formatted, error: null }
    } catch (err) {
      return { data: [], error: err.message }
    }
  },

  // Edit / Update Akun Pengguna Penuh (Admin Only)
  async updateUser(userId, userData) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      const cleanPhone = userData.phone ? userData.phone.trim().replace(/[^0-9+]/g, '') : ''
      const emailValue = userData.email?.trim() 
        ? userData.email.trim().toLowerCase()
        : (cleanPhone ? `${cleanPhone}@pinjammobil.local` : undefined)

      const payload = {
        name: userData.name,
        username: userData.username.trim().toLowerCase(),
        division: userData.division,
        role: userData.role
      }

      if (emailValue) {
        payload.email = emailValue
      }

      if (userData.password && userData.password.trim() !== '') {
        payload.password = userData.password.trim()
      }

      const { data, error } = await supabase
        .from('app_users')
        .update(payload)
        .eq('id', userId)
        .select()

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Username atau nomor HP / email sudah digunakan oleh user lain.' }
        }
        if (error.code === '23514') {
          return { 
            success: false, 
            error: 'Database Supabase memerlukan pembaruan batasan role. Silakan jalankan query di Supabase SQL Editor: ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_role_check; ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check CHECK (role IN (\'admin\', \'staff\', \'ga\', \'spv\', \'adh\'));' 
          }
        }
        throw error
      }

      const isPhoneEmail = data[0]?.email && data[0].email.endsWith('@pinjammobil.local')
      const phone = isPhoneEmail ? data[0].email.replace('@pinjammobil.local', '') : ''

      return { 
        success: true, 
        user: { 
          ...data[0], 
          phone, 
          displayContact: isPhoneEmail ? phone : data[0]?.email 
        } 
      }
    } catch (err) {
      console.error('Update user error:', err)
      return { success: false, error: err.message || 'Gagal memperbarui data pengguna.' }
    }
  },

  async updateUserRole(userId, newRole) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },

  async deleteUser(userId) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }
}
