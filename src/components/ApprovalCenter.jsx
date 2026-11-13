import React, { useState, useMemo } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Car, 
  Calendar, 
  MapPin, 
  Check, 
  X, 
  AlertCircle, 
  Fuel, 
  FileText,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Building,
  Wrench
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { isTestDriveLoan } from '../lib/utils'

export function ApprovalCenter({ 
  loans = [], 
  currentUser, 
  onUpdateApproval,
  onRefresh 
}) {
  // Sub-tabs: 'ga' | 'spv' | 'adh' | 'all'
  const [activeSubTab, setActiveSubTab] = useState('ga')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'approved' | 'rejected'

  // Modal State
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [actionStage, setActionStage] = useState(null) // 'ga' | 'spv' | 'adh'
  const [actionType, setActionType] = useState('approved') // 'approved' | 'rejected'
  const [actionNote, setActionNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')

  const userRole = currentUser?.role?.toLowerCase()
  const isAdmin = userRole === 'admin'
  const isGA = userRole === 'ga' || isAdmin
  const isSPV = userRole === 'spv' || isAdmin
  const isADH = userRole === 'adh' || isAdmin

  // Permissions helper
  const canApproveStage = (stage) => {
    if (isAdmin) return true
    if (stage === 'ga' && isGA) return true
    if (stage === 'spv' && isSPV) return true
    if (stage === 'adh' && isADH) return true
    return false
  }

  // Hitung jumlah antrean (pending counts)
  const stats = useMemo(() => {
    let gaPending = 0
    let spvPending = 0
    let adhPending = 0
    let totalPending = 0

    loans.forEach(l => {
      const app = l.approvals || { ga: {}, spv: {}, adh: {} }
      const isTD = isTestDriveLoan(l, l.vehicles)
      if (app.ga?.status === 'pending') gaPending++
      if (isTD && app.spv?.status === 'pending') spvPending++
      if (app.adh?.status === 'pending') adhPending++
      if (l.status === 'pending') totalPending++
    })

    return { gaPending, spvPending, adhPending, totalPending }
  }, [loans])

  // Filter daftar peminjaman
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const approvals = loan.approvals || {
        ga: { status: 'pending' },
        spv: { status: 'pending' },
        adh: { status: 'pending' }
      }
      const isTD = isTestDriveLoan(loan, loan.vehicles)

      // Tab filter
      if (activeSubTab === 'ga') {
        if (statusFilter === 'pending' && approvals.ga?.status !== 'pending') return false
        if (statusFilter === 'approved' && approvals.ga?.status !== 'approved') return false
        if (statusFilter === 'rejected' && approvals.ga?.status !== 'rejected') return false
      } else if (activeSubTab === 'spv') {
        if (!isTD) return false // Non-test drive bypass SPV
        if (statusFilter === 'pending' && approvals.spv?.status !== 'pending') return false
        if (statusFilter === 'approved' && approvals.spv?.status !== 'approved') return false
        if (statusFilter === 'rejected' && approvals.spv?.status !== 'rejected') return false
      } else if (activeSubTab === 'adh') {
        if (statusFilter === 'pending' && approvals.adh?.status !== 'pending') return false
        if (statusFilter === 'approved' && approvals.adh?.status !== 'approved') return false
        if (statusFilter === 'rejected' && approvals.adh?.status !== 'rejected') return false
      } else if (activeSubTab === 'all') {
        if (statusFilter === 'pending' && loan.status !== 'pending') return false
        if (statusFilter === 'approved' && loan.status !== 'approved' && loan.status !== 'completed') return false
        if (statusFilter === 'rejected' && loan.status !== 'rejected') return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchBorrower = loan.borrower_name?.toLowerCase().includes(q)
        const matchVehicle = loan.vehicle_name?.toLowerCase().includes(q)
        const matchPlate = loan.license_plate?.toLowerCase().includes(q)
        const matchDivision = loan.division?.toLowerCase().includes(q)
        const matchDestination = loan.destination?.toLowerCase().includes(q)
        if (!matchBorrower && !matchVehicle && !matchPlate && !matchDivision && !matchDestination) {
          return false
        }
      }

      return true
    })
  }, [loans, activeSubTab, statusFilter, searchQuery])

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

  const handleOpenActionModal = (loan, stage, type) => {
    setSelectedLoan(loan)
    setActionStage(stage)
    setActionType(type)
    setActionNote('')
    setActionError('')
  }

  const handleSubmitAction = async (e) => {
    e.preventDefault()
    if (!selectedLoan || !actionStage) return

    if (actionType === 'rejected' && !actionNote.trim()) {
      setActionError('Mohon berikan alasan penolakan agar pemohon mengetahui keterangannya.')
      return
    }

    setIsSubmitting(true)
    setActionError('')
    try {
      const res = await onUpdateApproval(
        selectedLoan.id,
        actionStage,
        actionType,
        currentUser,
        actionNote
      )
      if (res.success) {
        setSelectedLoan(null)
      } else {
        setActionError(res.error || 'Gagal memperbarui status persetujuan.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step Status Pill Component
  const renderStepPill = (label, stageObj, isOptional = false) => {
    const status = stageObj?.status || 'pending'
    
    if (isOptional && status === 'not_required') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-500 border border-slate-200">
          <span className="font-semibold text-slate-600">{label}:</span>
          <span className="text-[11px]">Dilewati (Non-TD)</span>
        </div>
      )
    }

    if (status === 'approved') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{label}:</span>
          <span className="text-emerald-700 font-medium">Disetujui</span>
          {stageObj?.by && <span className="text-[10px] text-emerald-600/80">({stageObj.by})</span>}
        </div>
      )
    }

    if (status === 'rejected') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200">
          <X className="h-3.5 w-3.5 text-rose-600 shrink-0" />
          <span className="font-semibold">{label}:</span>
          <span className="text-rose-700 font-medium">Ditolak</span>
          {stageObj?.by && <span className="text-[10px] text-rose-600/80">({stageObj.by})</span>}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <span className="font-semibold">{label}:</span>
        <span className="text-amber-700 font-medium">Menunggu</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      
      {/* Top Bar: Navigasi Sub-Tab Bersih & Ringkas */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Pills Navigasi Tab */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('ga')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'ga'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Verifikasi GA</span>
            {stats.gaPending > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSubTab === 'ga' ? 'bg-sky-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {stats.gaPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('spv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'spv'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Persetujuan SPV (Test Drive)</span>
            {stats.spvPending > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSubTab === 'spv' ? 'bg-sky-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {stats.spvPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('adh')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'adh'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Persetujuan ADH</span>
            {stats.adhPending > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSubTab === 'adh' ? 'bg-sky-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {stats.adhPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Semua Riwayat</span>
          </button>
        </div>

        {/* User Role Badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
          <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
          <span>Wewenang: <strong className="text-slate-800 uppercase">{currentUser?.role || 'Staff'}</strong></span>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama peminjam, mobil, plat nomor, tujuan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-sky-500 focus:bg-white bg-slate-50/50 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium outline-none cursor-pointer"
        >
          <option value="all">Semua Status</option>
          <option value="pending">⏳ Menunggu</option>
          <option value="approved">✅ Disetujui</option>
          <option value="rejected">❌ Ditolak</option>
        </select>
      </div>

      {/* List Kartu Pengajuan */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
          <CheckCircle2 className="h-8 w-8 mx-auto text-slate-300" />
          <div className="font-semibold text-slate-700 text-sm">Tidak ada pengajuan pada kategori ini</div>
          <p className="text-xs text-slate-400">
            Semua antrean telah diproses atau tidak ada data yang cocok dengan pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLoans.map(loan => {
            const approvals = loan.approvals || {
              ga: { status: 'pending' },
              spv: { status: 'pending' },
              adh: { status: 'pending' }
            }

            const isTD = isTestDriveLoan(loan, loan.vehicles)
            const isCompleted = loan.status === 'completed'
            const isRejected = loan.status === 'rejected'
            const isFullyApproved = loan.status === 'approved' || isCompleted

            const isGaApproved = approvals.ga?.status === 'approved'
            const isSpvApproved = !isTD || approvals.spv?.status === 'approved' || approvals.spv?.status === 'not_required'
            const isReadyForSpv = isGaApproved
            const isReadyForAdh = isGaApproved && isSpvApproved

            return (
              <div 
                key={loan.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition shadow-xs space-y-3"
              >
                {/* Header Kartu: Peminjam, Mobil, & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{loan.borrower_name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      {loan.division}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <Car className="h-3.5 w-3.5 text-sky-600" />
                      {loan.vehicle_name} ({loan.license_plate})
                    </span>
                    {isTD ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        Test Drive
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Operasional
                      </span>
                    )}
                  </div>

                  {/* Badge Status Keseluruhan */}
                  <div>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Selesai
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="h-3 w-3" /> Ditolak
                      </span>
                    ) : isFullyApproved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        <Check className="h-3 w-3" /> Disetujui Penuh
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3 w-3" /> Menunggu Otorisasi
                      </span>
                    )}
                  </div>
                </div>

                {/* Detail Singkat: Jadwal, Tujuan, BBM, Catatan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Jadwal:</span>
                      <span className="font-medium text-slate-800">{formatDate(loan.start_date)} - {formatDate(loan.end_date)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400 text-[10px] block">Tujuan & Keperluan:</span>
                      <span className="font-medium text-slate-800 truncate block" title={`${loan.destination} - ${loan.purpose}`}>
                        {loan.destination} ({loan.purpose})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Info BBM & KM Awal:</span>
                      <span className="font-medium text-slate-800">
                        {loan.start_mileage?.toLocaleString('id-ID') || 0} KM
                        {loan.buy_fuel === 'YA' && (
                          <span className="ml-1 text-amber-700 font-semibold">• Beli Rp {loan.fuel_amount}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400 text-[10px] block">Catatan Pemohon:</span>
                      <span className="font-medium text-slate-700 truncate block" title={loan.displayNotes || loan.notes}>
                        {loan.displayNotes || loan.notes?.split('__APPROVAL_DATA__:')[0]?.trim() || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Tahapan 3-Step Alur Sederhana */}
                <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  
                  {/* Step Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {renderStepPill('1. GA', approvals.ga)}
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:block" />
                    {renderStepPill('2. SPV', approvals.spv, !isTD)}
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:block" />
                    {renderStepPill('3. ADH', approvals.adh)}
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    
                    {/* Aksi Tab GA */}
                    {activeSubTab === 'ga' && (
                      canApproveStage('ga') ? (
                        approvals.ga?.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleOpenActionModal(loan, 'ga', 'approved')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Verifikasi (GA)</span>
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(loan, 'ga', 'rejected')}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Tolak</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            GA: {approvals.ga?.status === 'approved' ? 'Telah Disetujui' : 'Telah Ditolak'}
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Khusus GA / Admin</span>
                      )
                    )}

                    {/* Aksi Tab SPV */}
                    {activeSubTab === 'spv' && (
                      !isTD ? (
                        <span className="text-[11px] text-slate-400">Unit Non-TD (Bypass SPV)</span>
                      ) : canApproveStage('spv') ? (
                        !isReadyForSpv && !isAdmin ? (
                          <span className="text-[11px] text-amber-600 font-medium">Menunggu Verifikasi GA</span>
                        ) : approvals.spv?.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleOpenActionModal(loan, 'spv', 'approved')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Setujui (SPV)</span>
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(loan, 'spv', 'rejected')}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Tolak</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            SPV: {approvals.spv?.status === 'approved' ? 'Telah Disetujui' : 'Telah Ditolak'}
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Khusus SPV / Admin</span>
                      )
                    )}

                    {/* Aksi Tab ADH */}
                    {activeSubTab === 'adh' && (
                      canApproveStage('adh') ? (
                        !isReadyForAdh && !isAdmin ? (
                          <span className="text-[11px] text-amber-600 font-medium">
                            Menunggu tahap sebelumnya selesai
                          </span>
                        ) : approvals.adh?.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleOpenActionModal(loan, 'adh', 'approved')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Setujui (ADH)</span>
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(loan, 'adh', 'rejected')}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Tolak</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            ADH: {approvals.adh?.status === 'approved' ? 'Telah Disetujui' : 'Telah Ditolak'}
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Khusus ADH / Admin</span>
                      )
                    )}

                    {/* Aksi Tab Semua Riwayat */}
                    {activeSubTab === 'all' && (
                      <div className="flex items-center gap-1.5">
                        {canApproveStage('ga') && approvals.ga?.status === 'pending' && (
                          <button
                            onClick={() => handleOpenActionModal(loan, 'ga', 'approved')}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                          >
                            Verifikasi GA
                          </button>
                        )}
                        {isTD && canApproveStage('spv') && approvals.spv?.status === 'pending' && (
                          <button
                            onClick={() => handleOpenActionModal(loan, 'spv', 'approved')}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                          >
                            Setujui SPV
                          </button>
                        )}
                        {canApproveStage('adh') && approvals.adh?.status === 'pending' && (
                          <button
                            onClick={() => handleOpenActionModal(loan, 'adh', 'approved')}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                          >
                            Setujui ADH
                          </button>
                        )}
                      </div>
                    )}

                  </div>

                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Modal Konfirmasi Persetujuan / Penolakan */}
      <Modal
        isOpen={Boolean(selectedLoan)}
        onClose={() => setSelectedLoan(null)}
        title={
          actionType === 'approved' 
            ? `Konfirmasi Persetujuan (${actionStage?.toUpperCase()})` 
            : `Konfirmasi Penolakan (${actionStage?.toUpperCase()})`
        }
        description={`Otorisasi oleh ${currentUser?.name || 'User'} (${currentUser?.role?.toUpperCase() || 'Staff'}).`}
        maxWidth="max-w-md"
      >
        {selectedLoan && (
          <form onSubmit={handleSubmitAction} className="space-y-4 text-xs sm:text-sm">
            {actionError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Peminjam:</span>
                <span className="font-semibold text-slate-800">{selectedLoan.borrower_name} ({selectedLoan.division})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Armada:</span>
                <span className="font-semibold text-slate-800">{selectedLoan.vehicle_name} ({selectedLoan.license_plate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destinasi:</span>
                <span className="font-semibold text-slate-700">{selectedLoan.destination}</span>
              </div>
              {actionStage === 'ga' && selectedLoan.buy_fuel === 'YA' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Beli BBM (GA):</span>
                  <span className="font-bold text-amber-700">Rp {selectedLoan.fuel_amount}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {actionType === 'approved' 
                  ? 'Catatan Persetujuan (Opsional)' 
                  : 'Alasan Penolakan (Wajib Diisi)'}
              </label>
              <textarea
                rows={3}
                required={actionType === 'rejected'}
                placeholder={
                  actionType === 'approved'
                    ? 'Armada siap digunakan...'
                    : 'Tuliskan alasan penolakan...'
                }
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                  actionType === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting 
                  ? 'Memproses...' 
                  : actionType === 'approved' 
                  ? 'Ya, Setujui' 
                  : 'Ya, Tolak'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  )
}
