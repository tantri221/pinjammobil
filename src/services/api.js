import { getSupabase } from '../lib/supabase'

export const api = {
  // ==========================================
  // 1. VEHICLES CRUD (MURNI SUPABASE)
  // ==========================================
  
  // READ
  async getVehicles() {
    const supabase = getSupabase()
    if (!supabase) {
      return { 
        data: [], 
        error: 'Klien Supabase belum terkonfigurasi. Pastikan URL dan API Key telah diisi.' 
      }
    }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('Supabase getVehicles error:', error)
        return { data: [], error: error.message || 'Gagal memuat data dari Supabase.' }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Unexpected error getVehicles:', err)
      return { data: [], error: err.message || 'Terjadi kesalahan koneksi.' }
    }
  },

  // CREATE
  async createVehicle(vehicleData) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          name: vehicleData.name,
          license_plate: vehicleData.license_plate,
          type: vehicleData.type || 'MPV',
          status: vehicleData.status || 'available',
          capacity: Number(vehicleData.capacity) || 7,
          fuel_level: Number(vehicleData.fuel_level) || 100,
          mileage: Number(vehicleData.mileage) || 0
        }])
        .select()

      if (error) throw error
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Supabase createVehicle error:', err)
      return { success: false, error: err.message }
    }
  },

  // UPDATE
  async updateVehicle(id, updates) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Supabase updateVehicle error:', err)
      return { success: false, error: err.message }
    }
  },

  // DELETE
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
  // 2. LOANS CRUD (MURNI SUPABASE)
  // ==========================================

  // READ
  async getLoans() {
    const supabase = getSupabase()
    if (!supabase) {
      return { data: [], error: 'Klien Supabase belum terkonfigurasi.' }
    }

    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*, vehicles(name, license_plate)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase getLoans error:', error)
        return { data: [], error: error.message || 'Gagal memuat pinjaman.' }
      }

      const formatted = (data || []).map(item => ({
        ...item,
        vehicle_name: item.vehicles?.name || item.vehicle_name,
        license_plate: item.vehicles?.license_plate || item.license_plate
      }))

      return { data: formatted, error: null }
    } catch (err) {
      console.error('Unexpected error getLoans:', err)
      return { data: [], error: err.message }
    }
  },

  // CREATE
  async createLoan(loanData) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const payload = {
        vehicle_id: Number(loanData.vehicle_id),
        borrower_name: loanData.borrower_name,
        division: loanData.division,
        purpose: loanData.purpose,
        destination: loanData.destination,
        start_date: loanData.start_date,
        end_date: loanData.end_date,
        start_mileage: Number(loanData.start_mileage || 0),
        status: 'approved',
        notes: loanData.notes || ''
      }

      const { data, error } = await supabase
        .from('loans')
        .insert([payload])
        .select()

      if (error) throw error

      // Update status armada menjadi borrowed
      await supabase
        .from('vehicles')
        .update({ status: 'borrowed' })
        .eq('id', loanData.vehicle_id)

      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Supabase createLoan error:', err)
      return { success: false, error: err.message }
    }
  },

  // UPDATE (Kembalikan Mobil)
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

  // DELETE LOAN
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
  }
}
