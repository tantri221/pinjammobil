import React, { useState, useMemo } from 'react'
import { Modal } from './ui/Modal'
import { 
  AlertTriangle, 
  Trash2, 
  RotateCcw, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Ban,
  Check,
  Sparkles,
  Info
} from 'lucide-react'

export function ResetLoanHistoryModal({
  isOpen,
  onClose,
  loans = [],
  onResetLoans
}) {
  const [resetMode, setResetMode] = useState('completed') // 'completed' | 'date' | 'all'
  const [targetDate, setTargetDate] = useState(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })
  const [confirmInput, setConfirmInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Ringkasan data
  const finishedLoans = useMemo(() => {
    return loans.filter(l => l.status === 'completed' || l.status === 'rejected')
  }, [loans])

  const activeLoans = useMemo(() => {
    return loans.filter(l => l.status === 'approved' || l.status === 'pending')
  }, [loans])

  const loansOnTargetDate = useMemo(() => {
    if (!targetDate) return []
    const target = targetDate.trim()
    return loans.filter(l => {
      const rawStart = String(l.start_date || '').trim()
      const rawEnd = String(l.end_date || rawStart).trim()
      const startMatch = rawStart.match(/^(\d{4})-(\d{2})-(\d{2})/)
      const endMatch = rawEnd.match(/^(\d{4})-(\d{2})-(\d{2})/)
      const sKey = startMatch ? startMatch[0] : ''
      const eKey = endMatch ? endMatch[0] : sKey

      if (sKey === target || eKey === target) return true
      if (sKey && eKey && sKey <= target && target <= eKey) return true
      return false
    })
  }, [loans, targetDate])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (resetMode === 'all') {
      if (confirmInput.trim().toUpperCase() !== 'RESET') {
        setError('Ketik kata "RESET" dengan huruf kapital untuk mengonfirmasi reset total.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      let res
      if (resetMode === 'all') {
        res = await onResetLoans({ mode: 'all' })
      } else if (resetMode === 'completed') {
        if (finishedLoans.length === 0) {
          setError('Tidak ada transaksi dengan status Selesai atau Ditolak untuk dibersihkan.')
          setIsSubmitting(false)
          return
        }
        res = await onResetLoans({ mode: 'completed' })
      } else if (resetMode === 'date') {
        const ids = loansOnTargetDate.map(l => l.id)
        if (ids.length === 0) {
          setError(`Tidak ditemukan transaksi peminjaman pada tanggal ${targetDate}.`)
          setIsSubmitting(false)
          return
        }
        res = await onResetLoans({ mode: 'selected', loanIds: ids, targetDate })
      }

      if (res?.success) {
        setConfirmInput('')
        onClose()
      } else {
        setError(res?.error || 'Gagal menghapus riwayat peminjaman.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kendala pada server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tools Hapus & Reset Histori Peminjaman"
      description="Menu Khusus Administrator IT untuk pembersihan atau reset basis data transaksi"
      maxWidth="max-w-xl"
    >
      <div className="p-6 space-y-5">
        {/* Banner Hak Akses Administrator */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 font-bold shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>HAK AKSES ADMINISTRATOR IT</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30 font-mono">
                  Superuser
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tindakan pada menu ini akan menghapus data transaksi peminjaman dari Supabase.
              </p>
            </div>
          </div>
        </div>

        {/* Ringkasan Statistik Data Saat Ini */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Riwayat</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{loans.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Semua Tiket</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Sedang Aktif</div>
            <div className="text-lg font-black text-amber-800 mt-0.5">{activeLoans.length}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Pending/Approved</div>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Tuntas / Selesai</div>
            <div className="text-lg font-black text-emerald-800 mt-0.5">{finishedLoans.length}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Arsip Riwayat</div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Tindakan Reset / Penghapusan Data:
            </label>

            {/* Opsi 1: Hapus Selesai & Ditolak Saja */}
            <label 
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                resetMode === 'completed'
                  ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="resetMode"
                value="completed"
                checked={resetMode === 'completed'}
                onChange={() => setResetMode('completed')}
                className="mt-0.5 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Bersihkan Riwayat Selesai & Ditolak Saja (Direkomendasikan)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {finishedLoans.length} Data
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hanya menghapus arsip peminjaman yang sudah selesai dikembalikan atau ditolak. Peminjaman yang sedang aktif berjalan tetap aman.
                </p>
              </div>
            </label>

            {/* Opsi 2: Hapus Berdasarkan Tanggal Tertentu */}
            <label 
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                resetMode === 'date'
                  ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="resetMode"
                value="date"
                checked={resetMode === 'date'}
                onChange={() => setResetMode('date')}
                className="mt-0.5 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Hapus Peminjaman Pada Tanggal Tertentu
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {loansOnTargetDate.length} Data Terpilih
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menghapus seluruh transaksi mobil yang digunakan pada tanggal spesifik di bawah ini.
                </p>

                {resetMode === 'date' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Tanggal Penggunaan:</span>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="px-2.5 py-1 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <span className="text-xs text-slate-500">
                      ({formatIndonesianDate(targetDate)})
                    </span>
                  </div>
                )}
              </div>
            </label>

            {/* Opsi 3: Reset Total Semua Riwayat */}
            <label 
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                resetMode === 'all'
                  ? 'border-rose-500 bg-rose-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="resetMode"
                value="all"
                checked={resetMode === 'all'}
                onChange={() => setResetMode('all')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Reset Total Seluruh Riwayat Peminjaman
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {loans.length} Semua Data
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menghapus 100% catatan riwayat peminjaman kendaraan di database, dan memulihkan status seluruh armada mobil menjadi "Tersedia" (Siap Pakai).
                </p>

                {resetMode === 'all' && (
                  <div className="mt-3 pt-3 border-t border-rose-200/80 space-y-2">
                    <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Konfirmasi Pengamanan:</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Ketik kata <span className="font-mono font-bold text-rose-700 bg-rose-100 px-1 py-0.2 rounded border border-rose-300">RESET</span> pada kotak di bawah untuk melanjutkan:
                    </p>
                    <input
                      type="text"
                      placeholder="Ketik RESET"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase tracking-wider"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (resetMode === 'all' && confirmInput.trim().toUpperCase() !== 'RESET')}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 ${
                resetMode === 'all'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {isSubmitting 
                  ? 'Memproses...' 
                  : resetMode === 'all' 
                    ? 'Eksekusi Reset Total' 
                    : resetMode === 'date' 
                      ? `Hapus Data (${loansOnTargetDate.length})`
                      : `Bersihkan Selesai (${finishedLoans.length})`
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
