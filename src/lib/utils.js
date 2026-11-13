import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Memeriksa apakah peminjaman atau unit kendaraan adalah armada TEST DRIVE.
 * Penentu utama adalah Klasifikasi Kendaraan yang ditetapkan oleh Administrator
 * (tidak dikunci berdasarkan nama armada atau plat nomor).
 */
export function isTestDriveLoan(loan, vehicle = null) {
  if (!loan && !vehicle) return false

  // 1. Klasifikasi kendaraan yang ditentukan oleh Administrator
  const classification = String(
    loan?.classification || 
    loan?.vehicles?.classification || 
    vehicle?.classification || 
    ''
  ).toLowerCase()

  if (classification.includes('test drive')) return true

  // 2. Peruntukan peminjaman jika khusus untuk Test Drive Pelanggan
  const purpose = String(loan?.purpose || '').toLowerCase()
  if (purpose.includes('test drive')) return true

  return false
}

