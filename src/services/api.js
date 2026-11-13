import { getSupabase, getSupabaseConfig } from '../lib/supabase'
import { INITIAL_VEHICLES, INITIAL_LOANS } from '../data/defaultData'

const LOCAL_VEHICLES_KEY = 'pinjammobil_local_vehicles'
const LOCAL_LOANS_KEY = 'pinjammobil_local_loans'

function getLocalData(key, fallback) {
  const data = localStorage.getItem(key)
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
  try {
    return JSON.parse(data)
  } catch (e) {
    return fallback
  }
}

function setLocalData(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const api = {
  // ==========================================
  // 1. VEHICLES CRUD
  // ==========================================
  
  // READ
  async getVehicles() {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('id', { ascending: true })

        if (!error && data) {
          return { data, source: 'supabase', error: null }
        }
        if (error) {
          console.warn('Supabase getVehicles error:', error.message)
          const isTableMissing = error.code === 'PGRST205' || error.message?.includes('schema cache')
          return { 
            data: getLocalData(LOCAL_VEHICLES_KEY, INITIAL_VEHICLES), 
            source: 'local',
            isTableMissing,
            errorMessage: error.message
          }
        }
      } catch (err) {
        console.warn('Gagal memuat kendaraan dari Supabase, fallback ke lokal:', err)
      }
    }

    return { data: getLocalData(LOCAL_VEHICLES_KEY, INITIAL_VEHICLES), source: 'local', error: null }
  },

  // CREATE
  async createVehicle(vehicleData) {
    const supabase = getSupabase()
    if (supabase) {
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

        if (!error && data) {
          return { success: true, data: data[0], source: 'supabase' }
        }
        if (error) throw error
      } catch (err) {
        console.error('Supabase createVehicle error:', err)
        return { success: false, error: err.message }
      }
    }

    // Local fallback
    const vehicles = getLocalData(LOCAL_VEHICLES_KEY, INITIAL_VEHICLES)
    const newVehicle = {
      id: Date.now(),
      ...vehicleData,
      capacity: Number(vehicleData.capacity) || 7,
      fuel_level: Number(vehicleData.fuel_level) || 100,
      mileage: Number(vehicleData.mileage) || 0,
      status: vehicleData.status || 'available'
    }
    const updated = [...vehicles, newVehicle]
    setLocalData(LOCAL_VEHICLES_KEY, updated)
    return { success: true, data: newVehicle, source: 'local' }
  },

  // UPDATE
  async updateVehicle(id, updates) {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .update(updates)
          .eq('id', id)
          .select()

        if (!error && data) {
          return { success: true, data: data[0], source: 'supabase' }
        }
        if (error) throw error
      } catch (err) {
        console.error('Supabase updateVehicle error:', err)
        return { success: false, error: err.message }
      }
    }

    // Local fallback
    const vehicles = getLocalData(LOCAL_VEHICLES_KEY, INITIAL_VEHICLES)
    const updated = vehicles.map(v => v.id === id ? { ...v, ...updates } : v)
    setLocalData(LOCAL_VEHICLES_KEY, updated)
    return { success: true, source: 'local' }
  },

  // DELETE
  async deleteVehicle(id) {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', id)

        if (!error) return { success: true, source: 'supabase' }
        if (error) throw error
      } catch (err) {
        console.error('Supabase deleteVehicle error:', err)
        return { success: false, error: err.message }
      }
    }

    // Local fallback
    const vehicles = getLocalData(LOCAL_VEHICLES_KEY, INITIAL_VEHICLES)
    const updated = vehicles.filter(v => v.id !== id)
    setLocalData(LOCAL_VEHICLES_KEY, updated)
    return { success: true, source: 'local' }
  },

  // ==========================================
  // 2. LOANS CRUD
  // ==========================================

  // READ
  async getLoans() {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('loans')
          .select('*, vehicles(name, license_plate)')
          .order('created_at', { ascending: false })

        if (!error && data) {
          const formatted = data.map(item => ({
            ...item,
            vehicle_name: item.vehicles?.name || item.vehicle_name,
            license_plate: item.vehicles?.license_plate || item.license_plate
          }))
          return { data: formatted, source: 'supabase' }
        }
        if (error) console.error('Supabase getLoans error:', error.message)
      } catch (err) {
        console.warn('Gagal memuat pinjaman dari Supabase, fallback ke lokal:', err)
      }
    }

    return { data: getLocalData(LOCAL_LOANS_KEY, INITIAL_LOANS), source: 'local' }
  },

  // CREATE
  async createLoan(loanData) {
    const supabase = getSupabase()
    if (supabase) {
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

        if (!error && data) {
          await supabase
            .from('vehicles')
            .update({ status: 'borrowed' })
            .eq('id', loanData.vehicle_id)

          return { success: true, data: data[0], source: 'supabase' }
        }
        if (error) throw error
      } catch (err) {
        console.error('Error createLoan Supabase:', err)
        return { success: false, error: err.message }
      }
    }

    // Local fallback
    const loans = getLocalData(LOCAL_LOANS_KEY, INITIAL_LOANS)
    const vehicles = getLocalData(LOCAL_VEHICLES_KEY, INITIAL_VEHICLES)
    const vehicle = vehicles.find(v => v.id === Number(loanData.vehicle_id))

    const newLoan = {
      id: Date.now(),
      ...loanData,
      vehicle_name: vehicle?.name || 'Unit Kendaraan',
      license_plate: vehicle?.license_plate || '-',
      status: 'approved',
      created_at: new Date().toISOString()
    }

    setLocalData(LOCAL_LOANS_KEY, [newLoan, ...loans])
    setLocalData(LOCAL_VEHICLES_KEY, vehicles.map(v => 
      v.id === Number(loanData.vehicle_id) ? { ...v, status: 'borrowed' } : v
    ))

    return { success: true, data: newLoan, source: 'local' }
  },

  // UPDATE (Kembalikan Mobil)
  async returnVehicle(loanId, vehicleId, endMileage) {
    const supabase = getSupabase()
    if (supabase) {
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
        return { success: true, source: 'supabase' }
      } catch (err) {
        console.error('Error returnVehicle Supabase:', err)
        return { success: false, error: err.message }
      }
    }

    // Local fallback
    const loans = getLocalData(LOCAL_LOANS_KEY, INITIAL_LOANS)
    const vehicles = getLocalData(LOCAL_VEHICLES_KEY, INITIAL_VEHICLES)

    setLocalData(LOCAL_LOANS_KEY, loans.map(l => 
      l.id === loanId ? { ...l, status: 'completed', end_mileage: Number(endMileage) } : l
    ))

    if (vehicleId) {
      setLocalData(LOCAL_VEHICLES_KEY, vehicles.map(v => 
        v.id === Number(vehicleId) 
          ? { ...v, status: 'available', mileage: Number(endMileage) || v.mileage } 
          : v
      ))
    }

    return { success: true, source: 'local' }
  },

  // DELETE LOAN
  async deleteLoan(id) {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase
          .from('loans')
          .delete()
          .eq('id', id)

        if (!error) return { success: true, source: 'supabase' }
        if (error) throw error
      } catch (err) {
        console.error('Supabase deleteLoan error:', err)
        return { success: false, error: err.message }
      }
    }

    // Local fallback
    const loans = getLocalData(LOCAL_LOANS_KEY, INITIAL_LOANS)
    setLocalData(LOCAL_LOANS_KEY, loans.filter(l => l.id !== id))
    return { success: true, source: 'local' }
  }
}
