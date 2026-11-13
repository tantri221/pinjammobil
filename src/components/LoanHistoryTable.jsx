import React, { useState } from 'react'
import { Clock, MapPin, Check, CornerDownLeft, Trash2, XCircle, CheckCircle2, Car } from 'lucide-react'
import { Modal } from './ui/Modal'

export function LoanHistoryTable({ loans = [], isAdmin = false, currentUser = null, onReturnVehicle, onDeleteLoan }) {
  const [returningLoan, setReturningLoan] = useState(null)
  const [endMileage, setEndMileage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Info */}
        <div className="p-5 flex flex-row items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Histori & Status Peminjaman Kendaraan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh transaksi peminjaman unit operasional
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {loans.length} Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Peminjam</th>
                <th className="py-3 px-4">Kendaraan</th>
                <th className="py-3 px-4">Jadwal Pinjam</th>
                <th className="py-3 px-4">Tujuan / Keperluan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                    Belum ada data peminjaman kendaraan yang tercatat di database Supabase.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const isCompleted = loan.status === 'completed'
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Peminjam */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{loan.borrower_name}</div>
                        <div className="text-[11px] text-slate-500">Divisi {loan.division}</div>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{loan.vehicle_name || 'Unit Mobil'}</div>
                        <div className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded max-w-fit mt-0.5 border border-slate-200">
                          {loan.license_plate || '-'}
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
                        ) : loan.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-600" /> Menunggu Persetujuan
                          </span>
                        ) : loan.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="h-3 w-3 text-rose-600" /> Ditolak
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
                          {loan.status === 'approved' ? (
                            <button
                              onClick={() => handleOpenReturn(loan)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <CornerDownLeft className="h-3 w-3" />
                              <span>Kembalikan</span>
                            </button>
                          ) : isCompleted ? (
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                              {loan.end_mileage ? `${loan.end_mileage.toLocaleString()} KM` : '-'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              {loan.status === 'rejected' ? 'Pengajuan dibatalkan' : 'Menunggu otorisasi'}
                            </span>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => onDeleteLoan(loan)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus transaksi ini (Admin)"
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
    </>
  )
}
