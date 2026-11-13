import React, { useState, useMemo } from 'react'
import { 
  ShieldCheck, 
  Car, 
  Calendar, 
  MapPin, 
  Clock, 
  Check, 
  X, 
  Search, 
  CheckCircle2, 
  Fuel, 
  FileText, 
  Gauge, 
  UserCheck, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  KeyRound,
  History,
  Info
} from 'lucide-react'
import { Modal } from './ui/Modal'

export function SecurityCheck({
  loans = [],
  currentUser,
  onGateOut,
  onGateIn,
  onRefresh
}) {
  // Sub-menu: 'out' (Mobil Keluar) | 'in' (Mobil Kembali) | 'history' (Riwayat)
  const [activeSubTab, setActiveSubTab] = useState('out')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State untuk Mobil Keluar (Gate Out)
  const [outModalLoan, setOutModalLoan] = useState(null)
  const [outKm, setOutKm] = useState('')
  const [outCondition, setOutCondition] = useState('Bodi mulus, lampu & spion normal, perlengkapan aman')
  const [outKeyHanded, setOutKeyHanded] = useState(true)
  const [outNotes, setOutNotes] = useState('')
  const [isSubmittingOut, setIsSubmittingOut] = useState(false)
  const [outError, setOutError] = useState('')

  // Modal State untuk Mobil Kembali (Gate In)
  const [inModalLoan, setInModalLoan] = useState(null)
  const [inKm, setInKm] = useState('')
  const [inFuel, setInFuel] = useState('100')
  const [inCondition, setInCondition] = useState('Kondisi bodi baik, tidak ada kerusakan baru, interior bersih')
  const [inKeyReceived, setInKeyReceived] = useState(true)
  const [inNotes, setInNotes] = useState('')
  const [isSubmittingIn, setIsSubmittingIn] = useState(false)
  const [inError, setInError] = useState('')

  // Kelompokkan data peminjaman
  const loansReadyForOut = useMemo(() => {
    return loans.filter(l => {
      // Syarat Mobil Keluar:
      // Status sudah disetujui penuh (approved) dan belum check-out
      const sec = l.security || {}
      return l.status === 'approved' && sec.gate_status !== 'out' && sec.gate_status !== 'in'
    })
  }, [loans])

  const loansCurrentlyOut = useMemo(() => {
    return loans.filter(l => {
      // Syarat Mobil Kembali:
      // Sudah check out atau status approved yang sedang berjalan
      const sec = l.security || {}
      return (l.status === 'approved' && sec.gate_status === 'out') || 
             (l.status === 'approved' && sec.gate_status !== 'in')
    })
  }, [loans])

  const loansHistory = useMemo(() => {
    return loans.filter(l => {
      const sec = l.security || {}
      return sec.gate_status === 'in' || l.status === 'completed' || sec.out_time
    })
  }, [loans])

  // Filter berdasarkan sub-tab aktif dan pencarian
  const displayLoans = useMemo(() => {
    let source = []
    if (activeSubTab === 'out') source = loansReadyForOut
    else if (activeSubTab === 'in') source = loansCurrentlyOut
    else source = loansHistory

    if (!searchQuery.trim()) return source

    const q = searchQuery.toLowerCase()
    return source.filter(l => {
      const matchBorrower = l.borrower_name?.toLowerCase().includes(q)
      const matchVehicle = l.vehicle_name?.toLowerCase().includes(q)
      const matchPlate = l.license_plate?.toLowerCase().includes(q)
      const matchDivision = l.division?.toLowerCase().includes(q)
      const matchDestination = l.destination?.toLowerCase().includes(q)
      return matchBorrower || matchVehicle || matchPlate || matchDivision || matchDestination
    })
  }, [activeSubTab, loansReadyForOut, loansCurrentlyOut, loansHistory, searchQuery])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Buka modal keluar
  const handleOpenOutModal = (loan) => {
    setOutModalLoan(loan)
    setOutKm(String(loan.start_mileage || 0))
    setOutCondition('Bodi mulus, lampu & spion normal, perlengkapan aman')
    setOutKeyHanded(true)
    setOutNotes('')
    setOutError('')
  }

  // Submit konfirmasi keluar
  const handleSubmitOut = async (e) => {
    e.preventDefault()
    if (!outModalLoan) return

    if (!outKeyHanded) {
      setOutError('Mohon konfirmasi bahwa kunci kontak dan STNK telah diserahkan ke peminjam.')
      return
    }

    setIsSubmittingOut(true)
    setOutError('')

    try {
      const gateData = {
        out_km: Number(outKm) || 0,
        out_notes: `[Kondisi Fisik: ${outCondition}] ${outNotes ? `[Catatan: ${outNotes}]` : ''}`.trim()
      }

      const res = await onGateOut(outModalLoan.id, gateData, currentUser)
      if (res.success) {
        setOutModalLoan(null)
      } else {
        setOutError(res.error || 'Gagal mencatat mobil keluar.')
      }
    } finally {
      setIsSubmittingOut(false)
    }
  }

  // Buka modal kembali
  const handleOpenInModal = (loan) => {
    setInModalLoan(loan)
    const baseKm = loan.security?.out_km || loan.start_mileage || 0
    setInKm(String(Number(baseKm) + 10)) // estimasi awal +10 KM
    setInFuel('100')
    setInCondition('Kondisi bodi baik, tidak ada kerusakan baru, interior bersih')
    setInKeyReceived(true)
    setInNotes('')
    setInError('')
  }

  // Submit konfirmasi kembali
  const handleSubmitIn = async (e) => {
    e.preventDefault()
    if (!inModalLoan) return

    const baseKm = inModalLoan.security?.out_km || inModalLoan.start_mileage || 0
    if (Number(inKm) < Number(baseKm)) {
      setInError(`Kilometer masuk (${inKm} KM) tidak boleh lebih kecil dari KM saat keluar (${baseKm} KM).`)
      return
    }

    if (!inKeyReceived) {
      setInError('Mohon pastikan kunci kontak dan STNK telah diterima kembali di pos security.')
      return
    }

    setIsSubmittingIn(true)
    setInError('')

    try {
      const gateData = {
        in_km: Number(inKm),
        in_fuel: `${inFuel}%`,
        fuel_level: Number(inFuel),
        in_notes: `[Kondisi Fisik: ${inCondition}] [Level BBM: ${inFuel}%] ${inNotes ? `[Catatan: ${inNotes}]` : ''}`.trim()
      }

      const res = await onGateIn(inModalLoan.id, inModalLoan.vehicle_id, gateData, currentUser)
      if (res.success) {
        setInModalLoan(null)
      } else {
        setInError(res.error || 'Gagal mencatat mobil kembali.')
      }
    } finally {
      setIsSubmittingIn(false)
    }
  }

  return (
    <div className="space-y-4">
      
      {/* Top Navigasi Sub-Menu: Mobil Keluar & Mobil Kembali */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Pills Menu */}
        <div className="flex flex-wrap items-center gap-1.5">
          
          {/* Sub-menu 1: Mobil Keluar */}
          <button
            onClick={() => setActiveSubTab('out')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'out'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Mobil Keluar (Gate Out)</span>
            {loansReadyForOut.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'out' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {loansReadyForOut.length}
              </span>
            )}
          </button>

          {/* Sub-menu 2: Mobil Kembali */}
          <button
            onClick={() => setActiveSubTab('in')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'in'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Mobil Kembali (Gate In)</span>
            {loansCurrentlyOut.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'in' ? 'bg-sky-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {loansCurrentlyOut.length}
              </span>
            )}
          </button>

          {/* Sub-menu 3: Riwayat Pos Security */}
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Riwayat Pos Security</span>
          </button>

        </div>

        {/* Petugas Bertugas Identity Badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
          <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
          <span>Pos Security: <strong className="text-slate-800">{currentUser?.name || 'Petugas'}</strong></span>
        </div>

      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari armada, plat nomor, nama peminjam, destinasi..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-sky-500 focus:bg-white bg-slate-50/50 outline-none"
        />
      </div>

      {/* Konten Utama */}
      {displayLoans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
          <CheckCircle2 className="h-8 w-8 mx-auto text-slate-300" />
          <div className="font-semibold text-slate-700 text-sm">
            {activeSubTab === 'out' && 'Tidak ada mobil yang menunggu pemeriksaan keluar gerbang'}
            {activeSubTab === 'in' && 'Tidak ada armada yang sedang berada di luar kantor saat ini'}
            {activeSubTab === 'history' && 'Belum ada catatan riwayat pos security'}
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeSubTab === 'out' && 'Mobil yang telah disetujui penuh oleh manajemen (GA, SPV jika Test Drive, ADH) akan otomatis muncul di sini siap diperiksa keluar.'}
            {activeSubTab === 'in' && 'Semua armada dinas kantor sedang berada di area parkir perusahaan.'}
            {activeSubTab === 'history' && 'Daftar armada yang keluar masuk pos security akan terdata di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayLoans.map(loan => {
            const sec = loan.security || {}
            const isOut = sec.gate_status === 'out'
            const isIn = sec.gate_status === 'in' || loan.status === 'completed'

            return (
              <div
                key={loan.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition shadow-xs space-y-3"
              >
                {/* Header Kartu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{loan.borrower_name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Divisi {loan.division}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <Car className="h-3.5 w-3.5 text-sky-600" />
                      {loan.vehicle_name} ({loan.license_plate})
                    </span>
                    {loan.is_test_drive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        Test Drive
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Operasional
                      </span>
                    )}
                  </div>

                  {/* Badge Status Pos Gerbang */}
                  <div>
                    {isIn ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="h-3 w-3" /> Mobil Telah Kembali
                      </span>
                    ) : isOut ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <ArrowUpRight className="h-3 w-3" /> Sedang di Luar Kantor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        <Clock className="h-3 w-3" /> Disetujui (Siap Keluar)
                      </span>
                    )}
                  </div>
                </div>

                {/* Detail Informasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Jadwal Penggunaan:</span>
                      <span className="font-medium text-slate-800">{formatDate(loan.start_date)} - {formatDate(loan.end_date)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400 text-[10px] block">Tujuan & Keperluan:</span>
                      <span className="font-medium text-slate-800 truncate block" title={`${loan.destination} (${loan.purpose})`}>
                        {loan.destination} ({loan.purpose})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Kilometer:</span>
                      <span className="font-medium text-slate-800">
                        {sec.out_km ? `${sec.out_km.toLocaleString('id-ID')} KM (Keluar)` : `${(loan.start_mileage || 0).toLocaleString('id-ID')} KM`}
                        {sec.in_km ? ` ➔ ${sec.in_km.toLocaleString('id-ID')} KM (Masuk)` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Info BBM:</span>
                      <span className="font-medium text-slate-800">
                        {loan.buy_fuel === 'YA' ? `Beli Rp ${loan.fuel_amount}` : 'Tidak Beli BBM'}
                        {sec.in_fuel ? ` • Kembali: ${sec.in_fuel}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Log Petugas Security Jika Ada */}
                {(sec.out_time || sec.in_time) && (
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
                    {sec.out_time && (
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                        Keluar: <strong>{formatDate(sec.out_time)}</strong> oleh <em>{sec.out_by || 'Security'}</em>
                      </span>
                    )}
                    {sec.in_time && (
                      <span className="flex items-center gap-1">
                        <ArrowDownLeft className="h-3 w-3 text-sky-600" />
                        Kembali: <strong>{formatDate(sec.in_time)}</strong> oleh <em>{sec.in_by || 'Security'}</em>
                      </span>
                    )}
                    {sec.out_notes && (
                      <span className="text-slate-400 italic">
                        "{sec.out_notes}"
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Bar Aksi Pos Security */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    {activeSubTab === 'out' && (
                      <span>Pemeriksaan kondisi fisik & KM armada sebelum keluar gerbang.</span>
                    )}
                    {activeSubTab === 'in' && (
                      <span>Pemeriksaan KM akhir & penerimaan kunci saat mobil kembali ke pos.</span>
                    )}
                    {activeSubTab === 'history' && (
                      <span>Status peminjaman: <strong>{loan.status === 'completed' ? 'Selesai Digunakan' : 'Sedang Aktif'}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tombol Catat Mobil Keluar */}
                    {activeSubTab === 'out' && !isOut && !isIn && (
                      <button
                        onClick={() => handleOpenOutModal(loan)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>Pemeriksaan Mobil Keluar</span>
                      </button>
                    )}

                    {/* Tombol Catat Mobil Kembali */}
                    {activeSubTab === 'in' && !isIn && (
                      <button
                        onClick={() => handleOpenInModal(loan)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                        <span>Pemeriksaan Mobil Kembali</span>
                      </button>
                    )}

                    {activeSubTab === 'history' && (
                      <span className="text-xs font-semibold text-slate-400">
                        {isIn ? 'Pengecekan Lengkap (Out & In)' : 'Sedang di luar'}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* MODAL 1: CATAT MOBIL KELUAR (GATE OUT) */}
      <Modal
        isOpen={Boolean(outModalLoan)}
        onClose={() => setOutModalLoan(null)}
        title="Pemeriksaan Pos Security: Mobil Keluar (Gate Out)"
        description="Lakukan pengecekan fisik dan kilometer sebelum kendaraan dinas keluar gerbang kantor."
        maxWidth="max-w-md"
      >
        {outModalLoan && (
          <form onSubmit={handleSubmitOut} className="space-y-4 text-xs sm:text-sm">
            {outError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{outError}</span>
              </div>
            )}

            {/* Ringkasan Mobil & Peminjam */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Peminjam:</span>
                <span className="font-semibold text-slate-800">{outModalLoan.borrower_name} ({outModalLoan.division})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Armada Mobil:</span>
                <span className="font-bold text-slate-800">{outModalLoan.vehicle_name} ({outModalLoan.license_plate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tujuan:</span>
                <span className="font-medium text-slate-700">{outModalLoan.destination}</span>
              </div>
            </div>

            {/* Input KM Keluar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kilometer Keluar Pos Gerbang (KM)
              </label>
              <input
                type="number"
                required
                min={0}
                value={outKm}
                onChange={e => setOutKm(e.target.value)}
                placeholder="Contoh: 45020"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-emerald-500 font-mono font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Sesuaikan dengan angka odometer terkini pada dashboard mobil saat keluar.
              </span>
            </div>

            {/* Kondisi Fisik saat Keluar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pemeriksaan Fisik Kendaraan saat Keluar
              </label>
              <select
                value={outCondition}
                onChange={e => setOutCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-none font-medium"
              >
                <option value="Bodi mulus, lampu & spion normal, perlengkapan aman">
                  ✅ Kondisi Baik (Bodi mulus, lampu & spion normal)
                </option>
                <option value="Ada lecet/goresan minor sebelum berangkat (tercatat di pos)">
                  ⚠️ Ada Lecet/Goresan Minor (Sudah Tercatat)
                </option>
                <option value="Kondisi kotor / perlu cuci setelah kembali">
                  ℹ️ Kondisi Eksterior Berdebu / Standar
                </option>
              </select>
            </div>

            {/* Checklist Serah Terima Kunci & STNK */}
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
              <label className="flex items-start gap-2 text-xs font-semibold text-emerald-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={outKeyHanded}
                  onChange={e => setOutKeyHanded(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Kunci kontak mobil & STNK telah diserahkan kepada peminjam.</span>
              </label>
            </div>

            {/* Catatan Tambahan Security */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Petugas Security (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Berangkat 3 penumpang, perlengkapan lengkap..."
                value={outNotes}
                onChange={e => setOutNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOutModalLoan(null)}
                disabled={isSubmittingOut}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingOut}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>{isSubmittingOut ? 'Menyimpan...' : 'Konfirmasi Mobil Keluar'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: CATAT MOBIL KEMBALI (GATE IN) */}
      <Modal
        isOpen={Boolean(inModalLoan)}
        onClose={() => setInModalLoan(null)}
        title="Pemeriksaan Pos Security: Mobil Kembali (Gate In)"
        description="Lakukan pencatatan kilometer akhir dan pemeriksaan saat armada kembali ke kantor."
        maxWidth="max-w-md"
      >
        {inModalLoan && (
          <form onSubmit={handleSubmitIn} className="space-y-4 text-xs sm:text-sm">
            {inError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{inError}</span>
              </div>
            )}

            {/* Ringkasan Mobil & KM Awal */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Peminjam:</span>
                <span className="font-semibold text-slate-800">{inModalLoan.borrower_name} ({inModalLoan.division})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Armada Mobil:</span>
                <span className="font-bold text-slate-800">{inModalLoan.vehicle_name} ({inModalLoan.license_plate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">KM saat Keluar Gerbang:</span>
                <span className="font-mono font-bold text-slate-900">
                  {(inModalLoan.security?.out_km || inModalLoan.start_mileage || 0).toLocaleString('id-ID')} KM
                </span>
              </div>
            </div>

            {/* Input KM Kembali & Hitung Jarak Tempuh */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Kilometer Kembali di Pos Gerbang (KM)
                </label>
                {Number(inKm) >= Number(inModalLoan.security?.out_km || inModalLoan.start_mileage || 0) && (
                  <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Jarak: {(Number(inKm) - Number(inModalLoan.security?.out_km || inModalLoan.start_mileage || 0)).toLocaleString('id-ID')} KM
                  </span>
                )}
              </div>
              <input
                type="number"
                required
                min={Number(inModalLoan.security?.out_km || inModalLoan.start_mileage || 0)}
                value={inKm}
                onChange={e => setInKm(e.target.value)}
                placeholder="Contoh: 45150"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-sky-500 font-mono font-bold outline-none"
              />
            </div>

            {/* Level BBM saat Kembali */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kondisi Level BBM saat Kembali
              </label>
              <select
                value={inFuel}
                onChange={e => setInFuel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-none font-medium"
              >
                <option value="100">⛽ Full (100%)</option>
                <option value="75">⛽ 3/4 Tangki (75%)</option>
                <option value="50">⛽ 1/2 Tangki (50%)</option>
                <option value="25">⛽ 1/4 Tangki (25%)</option>
                <option value="15">⚠️ Cadangan / Perlu Isi Ulang (15%)</option>
              </select>
            </div>

            {/* Kondisi Fisik saat Kembali */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pemeriksaan Fisik Kendaraan saat Kembali
              </label>
              <select
                value={inCondition}
                onChange={e => setInCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white outline-none font-medium"
              >
                <option value="Kondisi bodi baik, tidak ada kerusakan baru, interior bersih">
                  ✅ Kondisi Baik (Bodi aman, tidak ada kerusakan baru)
                </option>
                <option value="Terdapat lecet/kerusakan baru (laporkan ke GA)">
                  ⚠️ Terdapat Lecet / Kerusakan Baru (Harap lapor GA)
                </option>
                <option value="Kondisi kotor / perlu pencucian armada">
                  ℹ️ Interior / Eksterior Kotor (Perlu Cuci)
                </option>
              </select>
            </div>

            {/* Checklist Penerimaan Kunci & STNK */}
            <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-200">
              <label className="flex items-start gap-2 text-xs font-semibold text-sky-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inKeyReceived}
                  onChange={e => setInKeyReceived(e.target.checked)}
                  className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Kunci kontak mobil & STNK telah diterima kembali oleh pos security.</span>
              </label>
            </div>

            {/* Catatan Tambahan Security */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Petugas Security (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Mobil parkir di slot B-03, kondisi rapi..."
                value={inNotes}
                onChange={e => setInNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-sky-500 outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setInModalLoan(null)}
                disabled={isSubmittingIn}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingIn}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                <span>{isSubmittingIn ? 'Menyimpan...' : 'Konfirmasi Mobil Kembali'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  )
}
