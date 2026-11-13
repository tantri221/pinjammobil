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
  async getVehicles() {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('id', { ascending: true })

        if (!error && data && data.length > 0) {
          return { data, source: 'supabase' }
        }
      } catch (err) {
        console.warn('Gagal memuat data dari Supabase, beralih ke local storage:', err)
      }
    }

    const localVehicles = getLocalData(LOCAL_VEHICLES_KEY, INITIAL_VEHICLES)
    return { data: localVehicles, source: 'local' }
  },

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
      } catch (err) {
        console.warn('Gagal memuat data pinjaman dari Supabase, beralih ke local storage:', err)
      }
    }

    const localLoans = getLocalData(LOCAL_LOANS_KEY, INITIAL_LOANS)
    return { data: localLoans, source: 'local' }
  },

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

        if (!error) {
          // Update status kendaraan menjadi borrowed
          await supabase
            .from('vehicles')
            .update({ status: 'borrowed' })
            .eq('id', loanData.vehicle_id)

          return { success: true, data: data[0], source: 'supabase' }
        }
      } catch (err) {
        console.error('Error createLoan Supabase:', err)
      }
    }

    // Fallback Local Storage
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

    const updatedLoans = [newLoan, ...loans]
    setLocalData(LOCAL_LOANS_KEY, updatedLoans)

    // Update vehicle status locally
    const updatedVehicles = vehicles.map(v => 
      v.id === Number(loanData.vehicle_id) ? { ...v, status: 'borrowed' } : v
    )
    setLocalData(LOCAL_VEHICLES_KEY, updatedVehicles)

    return { success: true, data: newLoan, source: 'local' }
  },

  async returnVehicle(loanId, vehicleId, endMileage) {
    const supabase = getSupabase()
    if (supabase) {
      try {
        await supabase
          .from('loans')
          .update({ 
            status: 'completed',
            end_mileage: Number(endMileage)
          })
          .eq('id', loanId)

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
      }
    }

    // Local Storage
    const loans = getLocalData(LOCAL_LOANS_KEY, INITIAL_LOANS)
    const vehicles = getLocalData(LOCAL_VEHICLES_KEY, INITIAL_VEHICLES)

    const updatedLoans = loans.map(l => 
      l.id === loanId ? { ...l, status: 'completed', end_mileage: Number(endMileage) } : l
    )
    setLocalData(LOCAL_LOANS_KEY, updatedLoans)

    if (vehicleId) {
      const updatedVehicles = vehicles.map(v => 
        v.id === Number(vehicleId) 
          ? { ...v, status: 'available', mileage: Number(endMileage) || v.mileage } 
          : v
      )
      setLocalData(LOCAL_VEHICLES_KEY, updatedVehicles)
    }

    return { success: true, source: 'local' }
  }
}
