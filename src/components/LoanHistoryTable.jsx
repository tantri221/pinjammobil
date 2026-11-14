import React, { useState, useMemo } from 'react'
import { 
  Clock, 
  MapPin, 
  Check, 
  CornerDownLeft, 
  Trash2, 
  XCircle, 
  CheckCircle2, 
  Car, 
  Ban, 
  AlertCircle,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { isTestDriveLoan } from '../lib/utils'

const getTodayDateString = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const addDaysToDateString = (dateStr, days) => {
  try {
    const parts = dateStr.split('-').map(Number)
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2])
    dateObj.setDate(dateObj.getDate() + days)
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, '0')
    const d = String(dateObj.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  } catch {
    return dateStr
  }
}

const formatIndonesianDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const parts = dateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

// Ekstrak representasi tanggal (YYYY-MM-DD) dari tanggal peminjaman (waktu mobil digunakan)
const extractUsageDateKey = (dateVal) => {
  if (!dateVal) return null
  
  const rawStr = String(dateVal).trim()
  const rawMatch = rawStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const localKey = `${y}-${m}-${day}`
      return { localKey, rawKey: rawMatch ? rawMatch[0] : localKey }
    }
  } catch {}

  if (rawMatch) {
    return { localKey: rawMatch[0], rawKey: rawMatch[0] }
  }
  return null
}

// Memeriksa apakah mobil digunakan pada tanggal target terpilih
// MURNI berdasarkan tanggal peminjaman (start_date / end_date), BUKAN tanggal input created_at
const isLoanUsedOnDate = (loan, targetDateKey) => {
  if (!targetDateKey) return true

  const startObj = extractUsageDateKey(loan.start_date)
  const endObj = extractUsageDateKey(loan.end_date) || startObj

  if (!startObj && !endObj) return false

  const target = targetDateKey.trim()

  const startLocal = startObj?.localKey
  const startRaw = startObj?.rawKey
  const endLocal = endObj?.localKey || startLocal
  const endRaw = endObj?.rawKey || startRaw

  // 1. Cocok pada tanggal mulai pakai mobil
  if (startLocal === target || startRaw === target) return true

  // 2. Cocok pada tanggal selesai pakai mobil
  if (endLocal === target || endRaw === target) return true

  // 3. Cocok jika tanggal target berada di dalam rentang pemakaian mobil
  if (startLocal && endLocal && startLocal <= target && target <= endLocal) return true
  if (startRaw && endRaw && startRaw <= target && target <= endRaw) return true

  return false
}

export function LoanHistoryTable({ 
  loans = [], 
  isAdmin = false, 
  currentUser = null, 
  onReturnVehicle, 
  onDeleteLoan,
  onCancelLoan 
}) {
  const [returningLoan, setReturningLoan] = useState(null)
  const [endMileage, setEndMileage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State Modal Pembatalan Pengajuan
  const [cancellingLoan, setCancellingLoan] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  // State Filter Harian & Tools Pilihan Tanggal
  const [selectedDate, setSelectedDate] = useState(getTodayDateString())
  const [filterMode, setFilterMode] = useState('daily') // 'daily' | 'all'
  const [searchQuery, setSearchQuery] = useState('')

  const todayDate = getTodayDateString()
  const yesterdayDate = addDaysToDateString(todayDate, -1)
  const tomorrowDate = addDaysToDateString(todayDate, 1)

  const handleNavigateDate = (delta) => {
    setSelectedDate(prev => addDaysToDateString(prev || todayDate, delta))
    setFilterMode('daily')
  }

  const handleSetToday = () => {
    setSelectedDate(todayDate)
    setFilterMode('daily')
  }

  const handleSetYesterday = () => {
    setSelectedDate(yesterdayDate)
    setFilterMode('daily')
  }

  const handleSetTomorrow = () => {
    setSelectedDate(tomorrowDate)
    setFilterMode('daily')
  }

  const filteredLoans = useMemo(() => {
    const list = loans.filter(loan => {
      // Filter strictly berdasarkan tanggal mobil digunakan (start_date / end_date)
      const matchesDate = filterMode === 'all' || isLoanUsedOnDate(loan, selectedDate)
      if (!matchesDate) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        (loan.borrower_name && loan.borrower_name.toLowerCase().includes(q)) ||
        (loan.vehicle_name && loan.vehicle_name.toLowerCase().includes(q)) ||
        (loan.license_plate && loan.license_plate.toLowerCase().includes(q)) ||
        (loan.division && loan.division.toLowerCase().includes(q)) ||
        (loan.purpose && loan.purpose.toLowerCase().includes(q)) ||
        (loan.destination && loan.destination.toLowerCase().includes(q))
      )
    })

    // Urutkan berdasarkan waktu penggunaan mobil terbaru ke terlama
    return list.sort((a, b) => {
      const dateA = new Date(a.start_date || a.created_at || 0).getTime()
      const dateB = new Date(b.start_date || b.created_at || 0).getTime()
      return dateB - dateA
    })
  }, [loans, filterMode, selectedDate, searchQuery])

  const handleOpenReturn = (loan) => {
    setReturningLoan(loan)
    setEndMileage(String(loan.start_mileage ? Number(loan.start_mileage) + 20 : 0))
  }

  const handleConfirmReturn = async (e) => {
    e.preventDefault()
    if (!returningLoan) return
    setIsSubmitting(true)
    try {
      await onReturnVehicle(returningLoan.id, returningLoan.vehicle_id, endMileage)
      setReturningLoan(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenCancel = (loan) => {
    setCancellingLoan(loan)
    setCancelReason('')
    setCancelError('')
  }

  const handleConfirmCancel = async (e) => {
    e.preventDefault()
    if (!cancellingLoan) return
    if (!cancelReason.trim()) {
      setCancelError('Mohon berikan alasan pembatalan pengajuan peminjaman.')
      return
    }

    setIsCancelling(true)
    setCancelError('')
    try {
      if (onCancelLoan) {
        const res = await onCancelLoan(cancellingLoan.id, cancellingLoan.vehicle_id, cancelReason)
        if (res && res.success === false) {
          setCancelError(res.error || 'Gagal membatalkan pengajuan.')
          return
        }
      }
      setCancellingLoan(null)
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return '-'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return isoString
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Header Tabel & Tools Filter Tanggal */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100/80 border border-sky-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {filterMode === 'daily' ? '📅 Penggunaan Mobil Harian' : '📋 Semua Riwayat'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {filterMode === 'daily' ? `Tanggal Pemakaian: ${formatIndonesianDate(selectedDate)}` : 'Seluruh Riwayat Transaksi'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1">
                Histori & Status Peminjaman Kendaraan
              </h3>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                {filterMode === 'daily' ? (
                  <>
                    Mobil Digunakan: <span className="font-bold text-sky-700">{filteredLoans.length}</span>
                    <span className="text-slate-400 font-normal"> / {loans.length} total</span>
                  </>
                ) : (
                  <>Total Transaksi: <span className="font-bold text-slate-800">{loans.length}</span></>
                )}
              </div>
            </div>
          </div>

          {/* Tools Pemilihan Tanggal & Filter */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Kelompok Kontrol Tanggal */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                <CalendarDays className="h-4 w-4 text-sky-600" />
                <span>Pilih Tanggal:</span>
              </span>

              {/* Navigasi Hari Sebelumnya / Input Tanggal / Hari Berikutnya */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleNavigateDate(-1)}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Hari sebelumnya"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value)
                      setFilterMode('daily')
                    }
                  }}
                  className="px-2 py-1 text-xs font-bold font-mono text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => handleNavigateDate(1)}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Hari berikutnya"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Shortcut Tombol Preset */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filterMode === 'daily' && selectedDate === todayDate
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Pilih hari ini"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={handleSetYesterday}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    filterMode === 'daily' && selectedDate === yesterdayDate
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Pilih kemarin"
                >
                  Kemarin
                </button>
                <button
                  type="button"
                  onClick={handleSetTomorrow}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    filterMode === 'daily' && selectedDate === tomorrowDate
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Pilih besok"
                >
                  Besok
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                  title="Tampilkan seluruh riwayat tanpa filter tanggal"
                >
                  Semua Riwayat
                </button>
              </div>
            </div>

            {/* Pencarian Teks */}
            <div className="relative min-w-[200px] max-w-xs w-full">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari peminjam / unit / plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Peminjam</th>
                <th className="py-3 px-4">Unit Mobil</th>
                <th className="py-3 px-4">Jadwal Pinjam</th>
                <th className="py-3 px-4">Tujuan / Keperluan</th>
                <th className="py-3 px-4">Status & Verifikasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <CalendarDays className="h-10 w-10 mx-auto mb-3 text-slate-300 stroke-1" />
                    <div className="font-bold text-slate-700 text-sm">
                      {filterMode === 'daily' 
                        ? `Tidak ada peminjaman mobil yang digunakan pada tanggal ${formatIndonesianDate(selectedDate)}`
                        : 'Tidak ada transaksi peminjaman yang cocok dengan filter.'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {filterMode === 'daily' 
                        ? 'Gunakan pemilih tanggal di atas untuk melihat tanggal penggunaan mobil yang lain, atau klik "Semua Riwayat" untuk melihat seluruh catatan.'
                        : 'Coba ubah kata kunci pencarian atau reset filter.'}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                      {filterMode === 'daily' && selectedDate !== todayDate && (
                        <button
                          type="button"
                          onClick={handleSetToday}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition cursor-pointer"
                        >
                          Lihat Hari Ini ({todayDate})
                        </button>
                      )}
                      {filterMode === 'daily' && (
                        <button
                          type="button"
                          onClick={() => setFilterMode('all')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Tampilkan Semua Riwayat ({loans.length})
                        </button>
                      )}
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Hapus Kata Kunci
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const isCompleted = loan.status === 'completed'
                  const isRejected = loan.status === 'rejected'
                  const isPending = loan.status === 'pending'
                  const isApproved = loan.status === 'approved'

                  // Izin pembatalan: Admin, GA, SPV, ADH, atau pemohon itu sendiri
                  const isMyLoan = currentUser?.name && loan.borrower_name?.toLowerCase() === currentUser.name.toLowerCase()
                  const canCancel = (isPending || isApproved) && (
                    isAdmin || 
                    ['ga', 'spv', 'adh'].includes(currentUser?.role?.toLowerCase()) || 
                    isMyLoan
                  )

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Peminjam */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{loan.borrower_name}</div>
                        <div className="text-[11px] text-slate-500">Divisi {loan.division}</div>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{loan.vehicle_name || 'Unit Mobil'}</span>
                          {isTestDriveLoan(loan, loan.vehicles) ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 border border-teal-300">
                              TEST DRIVE
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              OPERASIONAL
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {loan.license_plate || '-'}
                          </span>
                          {loan.start_fuel && (
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ⛽ {loan.start_fuel}
                            </span>
                          )}
                          {loan.buy_fuel === 'YA' && (
                            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">
                              +BBM Rp {loan.fuel_amount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Jadwal */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-600">
                          <span className="text-[10px] font-bold text-slate-400">Mulai:</span>
                          <span>{formatDate(loan.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <span className="text-[10px] font-bold text-slate-400">Kembali:</span>
                          <span>{formatDate(loan.end_date)}</span>
                        </div>
                      </td>

                      {/* Keperluan */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate" title={loan.purpose}>
                          {loan.purpose}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate mt-0.5" title={loan.destination}>
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{loan.destination}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="h-3 w-3 text-emerald-600" /> Selesai
                          </span>
                        ) : isPending ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="h-3 w-3 text-amber-600" /> Menunggu Persetujuan
                            </span>
                            {loan.approvals && (
                              <div className="flex items-center gap-1 text-[9px] font-bold">
                                <span 
                                  title="1. Verifikasi GA"
                                  className={`px-1.5 py-0.5 rounded ${
                                    loan.approvals.ga?.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                    loan.approvals.ga?.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  }`}
                                >
                                  GA {loan.approvals.ga?.status === 'approved' ? '✓' : loan.approvals.ga?.status === 'rejected' ? '✗' : '⏳'}
                                </span>
                                {isTestDriveLoan(loan, loan.vehicles) && (
                                  <span 
                                    title="2. Persetujuan SPV (Unit Test Drive)"
                                    className={`px-1.5 py-0.5 rounded ${
                                      loan.approvals.spv?.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                      loan.approvals.spv?.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-teal-50 text-teal-700 border border-teal-200'
                                    }`}
                                  >
                                    SPV {loan.approvals.spv?.status === 'approved' ? '✓' : loan.approvals.spv?.status === 'rejected' ? '✗' : '⏳'}
                                  </span>
                                )}
                                <span 
                                  title="3. Persetujuan ADH"
                                  className={`px-1.5 py-0.5 rounded ${
                                    loan.approvals.adh?.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                    loan.approvals.adh?.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}
                                >
                                  ADH {loan.approvals.adh?.status === 'approved' ? '✓' : loan.approvals.adh?.status === 'rejected' ? '✗' : '⏳'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="h-3 w-3 text-rose-600" /> Dibatalkan / Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Car className="h-3 w-3 text-blue-600" /> Sedang Dipinjam
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Tombol Kembalikan untuk yang Approved */}
                          {isApproved && (
                            <button
                              onClick={() => handleOpenReturn(loan)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <CornerDownLeft className="h-3 w-3" />
                              <span>Kembalikan</span>
                            </button>
                          )}

                          {/* Tombol Tools Pembatalan (Bagi yang pending atau approved) */}
                          {canCancel && (
                            <button
                              onClick={() => handleOpenCancel(loan)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Batalkan pengajuan peminjaman ini"
                            >
                              <Ban className="h-3 w-3" />
                              <span>Batalkan</span>
                            </button>
                          )}

                          {isCompleted && (
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                              {loan.end_mileage ? `${loan.end_mileage.toLocaleString()} KM` : '-'}
                            </span>
                          )}

                          {isRejected && (
                            <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                              Dibatalkan
                            </span>
                          )}

                          {/* Tombol Hapus (Admin) */}
                          {isAdmin && (
                            <button
                              onClick={() => onDeleteLoan(loan)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus transaksi ini permanen (Admin)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pengembalian Mobil (Style Legacy) */}
      <Modal
        isOpen={Boolean(returningLoan)}
        onClose={() => setReturningLoan(null)}
        title="Pengembalian Unit Mobil"
        description="Konfirmasi bahwa kendaraan telah dikembalikan dan masukkan angka odometer terakhir."
      >
        {returningLoan && (
          <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Peminjam:</span>
                <span className="font-bold text-slate-800">{returningLoan.borrower_name} ({returningLoan.division})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Unit:</span>
                <span className="font-bold text-slate-800">{returningLoan.vehicle_name} - {returningLoan.license_plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">KM Saat Berangkat:</span>
                <span className="font-mono font-bold text-sky-700">{(returningLoan.start_mileage || 0).toLocaleString()} KM</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                KM Akhir Speedometer <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={returningLoan.start_mileage || 0}
                placeholder="Masukkan angka KM terkini di dashboard mobil"
                value={endMileage}
                onChange={e => setEndMileage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Angka odometer ini akan otomatis memperbarui jarak tempuh armada di Supabase.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setReturningLoan(null)} 
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Selesaikan Pengembalian'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Batalkan Pengajuan Peminjaman */}
      <Modal
        isOpen={Boolean(cancellingLoan)}
        onClose={() => setCancellingLoan(null)}
        title="❌ Batalkan Pengajuan Peminjaman"
        description="Pengajuan peminjaman akan dibatalkan dan status armada akan dipulihkan menjadi tersedia."
        maxWidth="max-w-md"
      >
        {cancellingLoan && (
          <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs sm:text-sm">
            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Peminjam:</span>
                <span className="font-bold text-slate-800">{cancellingLoan.borrower_name} ({cancellingLoan.division})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Unit Armada:</span>
                <span className="font-bold text-slate-800">{cancellingLoan.vehicle_name} ({cancellingLoan.license_plate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Destinasi:</span>
                <span className="font-semibold text-slate-700">{cancellingLoan.destination || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Peruntukan:</span>
                <span className="font-medium text-slate-700">{cancellingLoan.purpose}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Pembatalan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Jadwal dinas di-reschedule / meeting dibatalkan / salah memilih unit armada..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-rose-500 outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setCancellingLoan(null)} 
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Kembali
              </button>
              <button 
                type="submit" 
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>{isCancelling ? 'Membatalkan...' : 'Konfirmasi Batalkan'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
