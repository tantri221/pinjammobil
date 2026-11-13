import { getSupabase } from '../lib/supabase'

export const api = {
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
      return { data: data || [], error: null }
    } catch (err) {
      console.error('Supabase getVehicles error:', err)
      return { data: [], error: err.message || 'Gagal memuat kendaraan.' }
    }
  },

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

  async getLoans() {
    const supabase = getSupabase()
    if (!supabase) return { data: [], error: 'Klien Supabase belum terkonfigurasi.' }

    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*, vehicles(name, license_plate)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formatted = (data || []).map(item => ({
        ...item,
        vehicle_name: item.vehicles?.name || item.vehicle_name,
        license_plate: item.vehicles?.license_plate || item.license_plate
      }))

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

  async login(identifier, password) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, email, name, role, division, password')
        .or(`username.eq.${identifier},email.eq.${identifier}`)
        .single()

      if (error || !data) {
        return { success: false, error: 'Username atau email tidak ditemukan.' }
      }

      if (data.password !== password) {
        return { success: false, error: 'Kata sandi salah.' }
      }

      const { password: _, ...userSession } = data
      return { success: true, user: userSession }
    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: err.message || 'Gagal login.' }
    }
  },

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

      const { data, error } = await supabase
        .from('app_users')
        .insert([{
          username: userData.username.trim().toLowerCase(),
          email: userData.email.trim().toLowerCase(),
          password: userData.password,
          name: userData.name,
          role: 'staff',
          division: userData.division || 'Operasional'
        }])
        .select('id, username, email, name, role, division')
        .single()

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Username atau email tersebut sudah terdaftar.' }
        }
        throw error
      }

      return { success: true, user: data }
    } catch (err) {
      console.error('Register error:', err)
      return { success: false, error: err.message || 'Gagal mendaftar akun baru.' }
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
      return { data: data || [], error: null }
    } catch (err) {
      return { data: [], error: err.message }
    }
  },

  // Edit / Update Akun Pengguna Penuh (Admin Only)
  async updateUser(userId, userData) {
    const supabase = getSupabase()
    if (!supabase) return { success: false, error: 'Klien Supabase belum siap.' }

    try {
      const payload = {
        name: userData.name,
        username: userData.username.trim().toLowerCase(),
        email: userData.email.trim().toLowerCase(),
        division: userData.division,
        role: userData.role
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
          return { success: false, error: 'Username atau email sudah digunakan oleh user lain.' }
        }
        throw error
      }

      return { success: true, user: data[0] }
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
