import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Memeriksa apakah peminjaman atau unit kendaraan adalah armada/unit TEST DRIVE.
 * Kriteria:
 * 1. Nama kendaraan mengandung kata 'test' atau 'testdrive' atau 'test drive'
 * 2. Plat nomor mengandung / berakhiran 'td' (contoh: B 1024 TD)
 * 3. Tipe kendaraan mengandung 'test'
 * 4. Peruntukan peminjaman adalah 'Test Drive Pelanggan'
 */
export function isTestDriveLoan(loan, vehicle = null) {
  if (!loan && !vehicle) return false

  const classification = String(
    loan?.classification || 
    loan?.vehicles?.classification || 
    vehicle?.classification || 
    ''
  ).toLowerCase()

  if (classification.includes('test drive')) return true

  const name = String(loan?.vehicle_name || loan?.vehicles?.name || vehicle?.name || '').toLowerCase()
  const plate = String(loan?.license_plate || loan?.vehicles?.license_plate || vehicle?.license_plate || '').toLowerCase()
  const purpose = String(loan?.purpose || '').toLowerCase()
  const type = String(loan?.type || loan?.vehicles?.type || vehicle?.type || '').toLowerCase()

  if (name.includes('test') || name.includes('testdrive')) return true
  if (plate.endsWith('td') || plate.includes(' td') || plate.includes('td ')) return true
  if (purpose.includes('test drive')) return true
  if (type.includes('test')) return true

  return false
}

