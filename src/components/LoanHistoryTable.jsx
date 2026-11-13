import React, { useState } from 'react'
import { CheckCircle2, Clock, MapPin, Check, CornerDownLeft, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'

export function LoanHistoryTable({ loans = [], onReturnVehicle, onDeleteLoan }) {
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-zinc-900">
              Histori & Status Peminjaman
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              Daftar transaksi peminjaman kendaraan yang aktif maupun selesai
            </p>
          </div>
          <Badge variant="secondary" className="font-normal text-xs">
            {loans.length} Transaksi
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-y border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Kendaraan</th>
                  <th className="py-3 px-4">Jadwal Pinjam</th>
                  <th className="py-3 px-4">Tujuan / Keperluan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                      Belum ada data peminjaman kendaraan tercatat.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => {
                    const isCompleted = loan.status === 'completed'
                    return (
                      <tr key={loan.id} className="hover:bg-zinc-50/80 transition-colors">
                        
                        {/* Peminjam */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-900">{loan.borrower_name}</div>
                          <div className="text-[11px] text-zinc-400">{loan.division}</div>
                        </td>

                        {/* Unit */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-zinc-900">{loan.vehicle_name || 'Unit Mobil'}</div>
                          <div className="font-mono text-[10px] text-zinc-500">{loan.license_plate || '-'}</div>
                        </td>

                        {/* Jadwal */}
                        <td className="py-3 px-4 space-y-0.5">
                          <div className="flex items-center gap-1 text-zinc-600">
                            <span className="text-[10px] font-medium text-zinc-400">Mulai:</span>
                            <span>{formatDate(loan.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-600">
                            <span className="text-[10px] font-medium text-zinc-400">Selesai:</span>
                            <span>{formatDate(loan.end_date)}</span>
                          </div>
                        </td>

                        {/* Keperluan */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-zinc-800 truncate" title={loan.purpose}>
                            {loan.purpose}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate" title={loan.destination}>
                            <MapPin className="h-3 w-3 shrink-0" />
                            {loan.destination}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isCompleted ? (
                            <Badge variant="outline" className="text-zinc-500 border-zinc-200">
                              <Check className="h-3 w-3 mr-1 text-emerald-600" /> Selesai
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              <Clock className="h-3 w-3 mr-1" /> Sedang Dipinjam
                            </Badge>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isCompleted ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReturn(loan)}
                                className="text-xs h-7 gap-1"
                              >
                                <CornerDownLeft className="h-3 w-3" />
                                Kembalikan
                              </Button>
                            ) : (
                              <span className="text-[11px] text-zinc-400">
                                {loan.end_mileage ? `${loan.end_mileage.toLocaleString()} KM` : '-'}
                              </span>
                            )}

                            <button
                              onClick={() => onDeleteLoan(loan)}
                              className="p-1 text-zinc-300 hover:text-rose-600 rounded transition-colors"
                              title="Hapus riwayat pinjaman ini"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Pengembalian Mobil */}
      <Modal
        isOpen={Boolean(returningLoan)}
        onClose={() => setReturningLoan(null)}
        title="Pengembalian Unit Mobil"
        description="Konfirmasi bahwa kendaraan telah dikembalikan dan masukkan angka odometer terakhir."
      >
        {returningLoan && (
          <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Peminjam:</span>
                <span className="font-semibold text-zinc-800">{returningLoan.borrower_name} ({returningLoan.division})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Unit:</span>
                <span className="font-semibold text-zinc-800">{returningLoan.vehicle_name} - {returningLoan.license_plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">KM Saat Berangkat:</span>
                <span className="font-mono font-medium text-zinc-700">{(returningLoan.start_mileage || 0).toLocaleString()} KM</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                KM Akhir Speedometer <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                required
                min={returningLoan.start_mileage || 0}
                placeholder="Masukkan angka KM terkini di dashboard mobil"
                value={endMileage}
                onChange={e => setEndMileage(e.target.value)}
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Angka ini akan memperbarui status total jarak tempuh armada di sistem.
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReturningLoan(null)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Selesaikan Peminjaman'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
