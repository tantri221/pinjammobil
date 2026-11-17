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

/**
 * Memeriksa apakah tiket peminjaman adalah milik akun pengguna tertentu.
 * Mencocokkan ID akun, username, atau nama peminjam secara fleksibel.
 */
export function isLoanOwnedByUser(loan, user) {
  if (!loan || !user) return false

  const userId = user.id
  const userName = (user.name || '').trim().toLowerCase()
  const userUsername = (user.username || '').trim().toLowerCase()

  const borrowerId = loan.borrower_user_id || loan.user_id
  const borrowerName = (loan.borrower_name || '').trim().toLowerCase()
  const borrowerUsername = (loan.borrower_username || '').trim().toLowerCase()

  // 1. Cocokkan ID pengguna
  if (borrowerId && userId && String(borrowerId) === String(userId)) return true

  // 2. Cocokkan Username
  if (userUsername && borrowerUsername && borrowerUsername === userUsername) return true

  // 3. Cocokkan Nama Peminjam
  if (userName && borrowerName && (borrowerName === userName || borrowerName.includes(userName) || userName.includes(borrowerName))) return true

  return false
}

