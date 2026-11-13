import React, { useState, useMemo } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Car, 
  Calendar, 
  MapPin, 
  Check, 
  X, 
  Info,
  CheckSquare,
  Wrench,
  Building,
  UserCheck
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

  // Action Modal State (Verifikasi / Setujui / Tolak)
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

  // Filter loans
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const approvals = loan.approvals || {
        ga: { status: 'pending' },
        spv: { status: 'pending' },
        adh: { status: 'pending' }
      }
      const isTD = isTestDriveLoan(loan, loan.vehicles)

      // Tab filter
      // 1. GA: Semua armada
      if (activeSubTab === 'ga') {
        if (statusFilter === 'pending' && approvals.ga?.status !== 'pending') return false
        if (statusFilter === 'approved' && approvals.ga?.status !== 'approved') return false
        if (statusFilter === 'rejected' && approvals.ga?.status !== 'rejected') return false
      } 
      // 2. SPV: KHUSUS armada/unit TEST DRIVE
      else if (activeSubTab === 'spv') {
        if (!isTD) return false // Unit non-test drive tidak perlu persetujuan SPV
        if (statusFilter === 'pending' && approvals.spv?.status !== 'pending') return false
        if (statusFilter === 'approved' && approvals.spv?.status !== 'approved') return false
        if (statusFilter === 'rejected' && approvals.spv?.status !== 'rejected') return false
      } 
      // 3. ADH: Semua armada
      else if (activeSubTab === 'adh') {
        if (statusFilter === 'pending' && approvals.adh?.status !== 'pending') return false
        if (statusFilter === 'approved' && approvals.adh?.status !== 'approved') return false
        if (statusFilter === 'rejected' && approvals.adh?.status !== 'rejected') return false
      } 
      // 4. Semua Riwayat
      else if (activeSubTab === 'all') {
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

  // Counts
  const stats = useMemo(() => {
    let gaPending = 0
    let spvPending = 0
    let adhPending = 0
    let fullyApproved = 0

    loans.forEach(l => {
      const app = l.approvals || { ga: {}, spv: {}, adh: {} }
      const isTD = isTestDriveLoan(l, l.vehicles)
      if (app.ga?.status === 'pending') gaPending++
      if (isTD && app.spv?.status === 'pending') spvPending++
      if (app.adh?.status === 'pending') adhPending++
      if (l.status === 'approved' || l.status === 'completed') fullyApproved++
    })

    return { gaPending, spvPending, adhPending, fullyApproved }
  }, [loans])

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

  // Check if current user has permission to approve stage
  const canApproveStage = (stage) => {
    if (isAdmin) return true
    if (stage === 'ga' && isGA) return true
    if (stage === 'spv' && isSPV) return true
    if (stage === 'adh' && isADH) return true
    return false
  }

  const getStageBadge = (stageObj) => {
    const status = stageObj?.status || 'pending'
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Check className="h-3 w-3 text-emerald-600" /> Disetujui
        </span>
      )
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <X className="h-3 w-3 text-rose-600" /> Ditolak
        </span>
      )
    }
    if (status === 'not_required') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/80 text-slate-300 border border-slate-600">
          ⏩ Tidak Diperlukan
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
        <Clock className="h-3 w-3 text-amber-600" /> Menunggu
      </span>
    )
  }

  return (
    <div className="space-y-5">
      
      {/* Header Pusat Verifikasi */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Workflow Otorisasi Terintegrasi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Verifikasi & Persetujuan Peminjaman
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Alur Berjenjang: <strong>1. Verifikasi GA</strong> (semua armada) ➔ <strong>2. Persetujuan SPV</strong> (khusus armada/unit TEST DRIVE) ➔ <strong>3. Persetujuan ADH</strong> (semua unit).
          </p>
        </div>

        {/* User Identity Pills */}
        <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white text-sm">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-xs">
            <div className="font-bold text-white">{currentUser?.name}</div>
            <div className="text-sky-300 font-mono text-[10px] uppercase">
              Wewenang: {currentUser?.role?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() => { setActiveSubTab('ga'); setStatusFilter('pending'); }}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            activeSubTab === 'ga' 
              ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" />
              <span>1. Verifikasi GA</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {stats.gaPending} Menunggu
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.gaPending}</span>
            <span className="text-xs text-slate-500">Semua armada dicek GA</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveSubTab('spv'); setStatusFilter('pending'); }}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            activeSubTab === 'spv' 
              ? 'bg-teal-50/90 border-teal-300 ring-2 ring-teal-500/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              <span>2. Persetujuan SPV</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200">
              {stats.spvPending} Menunggu
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.spvPending}</span>
            <span className="text-xs text-slate-500">Khusus unit TEST DRIVE</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveSubTab('adh'); setStatusFilter('pending'); }}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            activeSubTab === 'adh' 
              ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-500/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5" />
              <span>3. Persetujuan ADH</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-200">
              {stats.adhPending} Menunggu
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.adhPending}</span>
            <span className="text-xs text-slate-500">Otorisasi final semua unit</span>
          </div>
        </button>

        <button
          onClick={() => { setActiveSubTab('all'); setStatusFilter('all'); }}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            activeSubTab === 'all' 
              ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Siap Jalan / Selesai</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {stats.fullyApproved} Unit
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.fullyApproved}</span>
            <span className="text-xs text-slate-500">Total peminjaman disetujui</span>
          </div>
        </button>
      </div>

      {/* Navigasi Sub-Tab Utama (1. GA -> 2. SPV -> 3. ADH -> Semua) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            
            {/* Tab 1: Verifikasi GA */}
            <button
              onClick={() => setActiveSubTab('ga')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'ga'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>1. Verifikasi GA (Semua Armada)</span>
              {stats.gaPending > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeSubTab === 'ga' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {stats.gaPending}
                </span>
              )}
            </button>

            {/* Tab 2: Persetujuan SPV (Khusus Test Drive) */}
            <button
              onClick={() => setActiveSubTab('spv')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'spv'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>2. Persetujuan SPV (Khusus Test Drive)</span>
              {stats.spvPending > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeSubTab === 'spv' ? 'bg-teal-800 text-white' : 'bg-teal-100 text-teal-700'
                }`}>
                  {stats.spvPending}
                </span>
              )}
            </button>

            {/* Tab 3: Persetujuan ADH */}
            <button
              onClick={() => setActiveSubTab('adh')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'adh'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>3. Persetujuan ADH (Semua Unit)</span>
              {stats.adhPending > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeSubTab === 'adh' ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-700'
                }`}>
                  {stats.adhPending}
                </span>
              )}
            </button>

            {/* Tab 4: Semua Riwayat */}
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Semua Riwayat Pengajuan</span>
            </button>
          </div>

          {/* Quick Filter Status */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">Filter:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 font-semibold outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="pending">⏳ Menunggu</option>
              <option value="approved">✅ Disetujui</option>
              <option value="rejected">❌ Ditolak</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama peminjam, armada, plat nomor, tujuan dinas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-sky-500 outline-none"
          />
        </div>

        {/* Informasi Wewenang Tab Aktif */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-600 shrink-0" />
            <span>
              {activeSubTab === 'ga' && 'Tahap 1: Verifikasi GA untuk SEMUA armada kendaraan operasional (pemeriksaan teknis armada, kelayakan fisik unit, dan verifikasi pembelian BBM).'}
              {activeSubTab === 'spv' && 'Tahap 2: Persetujuan SPV KHUSUS untuk armada/unit TEST DRIVE. Armada operasional umum tidak memerlukan persetujuan SPV dan langsung diteruskan ke persetujuan ADH.'}
              {activeSubTab === 'adh' && 'Tahap 3: Persetujuan ADH (Admin Head) untuk SEMUA unit sebagai otorisasi final pemakaian kendaraan kantor (setelah verifikasi GA, dan SPV jika unit Test Drive).'}
              {activeSubTab === 'all' && 'Monitoring menyeluruh riwayat persetujuan: 1. Verifikasi GA (semua armada) ➔ 2. Persetujuan SPV (khusus Test Drive) ➔ 3. Otorisasi Final ADH (semua unit).'}
            </span>
          </div>

          <div className="hidden sm:block text-[11px] font-bold text-slate-500">
            Ditemukan {filteredLoans.length} pengajuan
          </div>
        </div>

        {/* Daftar Kartu / List Pengajuan */}
        {filteredLoans.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="font-bold text-slate-700 text-sm">Tidak ada pengajuan pada tab ini</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeSubTab === 'spv' 
                ? 'Semua unit Test Drive telah diproses atau saat ini belum ada pengajuan armada Test Drive.'
                : 'Semua pengajuan telah diproses atau tidak ada data yang cocok dengan filter pencarian Anda.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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

              // Kesiapan tahap (Sequential readiness)
              const isGaApproved = approvals.ga?.status === 'approved'
              const isSpvApproved = !isTD || approvals.spv?.status === 'approved' || approvals.spv?.status === 'not_required'
              const isReadyForSpv = isGaApproved
              const isReadyForAdh = isGaApproved && isSpvApproved

              return (
                <div 
                  key={loan.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs space-y-4"
                >
                  {/* Top Bar Card: Peminjam & Status Keseluruhan */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm">
                        {loan.borrower_name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex flex-wrap items-center gap-2">
                          <span>{loan.borrower_name}</span>
                          <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Divisi {loan.division}
                          </span>
                          {isTD ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                              🏷️ Unit Test Drive (Wajib SPV)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                              🚗 Operasional Umum (Bypass SPV ➔ ADH)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>ID Tiket #{loan.id}</span>
                          <span>•</span>
                          <span>Diajukan: {formatDate(loan.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Overall Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Status Akhir:</span>
                      {isCompleted ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Selesai Digunakan
                        </span>
                      ) : isRejected ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" /> Ditolak
                        </span>
                      ) : isFullyApproved ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5 text-sky-600" /> Disetujui Penuh (Siap Jalan)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-amber-600" /> Proses Verifikasi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detail Peminjaman (Mobil, Jadwal, Tujuan) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
                        <Car className="h-3.5 w-3.5 text-sky-600" />
                        <span>Armada Kendaraan</span>
                      </div>
                      <div className="font-bold text-slate-900 mt-1">{loan.vehicle_name || 'Unit Mobil'}</div>
                      <div className="font-mono text-[11px] font-bold text-slate-600 mt-0.5">
                        Plat: {loan.license_plate || '-'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Jadwal Penggunaan</span>
                      </div>
                      <div className="text-slate-800 font-semibold mt-1">Mulai: {formatDate(loan.start_date)}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">Sampai: {formatDate(loan.end_date)}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Destinasi & Peruntukan</span>
                      </div>
                      <div className="font-bold text-slate-900 mt-1 truncate" title={loan.destination}>
                        {loan.destination || '-'}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate mt-0.5 font-medium" title={loan.purpose}>
                        {loan.purpose}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-slate-400 text-[10px] font-bold uppercase flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Info className="h-3.5 w-3.5 text-purple-600" />
                          <span>KM & BBM Awal</span>
                        </span>
                        {loan.start_fuel && (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                            ⛽ {loan.start_fuel}
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-bold text-slate-900 mt-1 flex items-center justify-between">
                        <span>{loan.start_mileage?.toLocaleString('id-ID') || 0} KM</span>
                        {loan.buy_fuel === 'YA' ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                            Beli BBM: Rp {loan.fuel_amount}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            Beli BBM: Tidak
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 truncate" title={loan.displayNotes || loan.notes}>
                        {loan.displayNotes || loan.notes?.split('__APPROVAL_DATA__:')[0]?.trim() || 'Tidak ada catatan tambahan'}
                      </div>
                    </div>
                  </div>

                  {/* VISUAL 3-STAGE PIPELINE: 1. GA ➔ 2. SPV (khusus Test Drive) ➔ 3. ADH */}
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center justify-between">
                      <span>Alur Persetujuan: 1. GA (Semua) ➔ 2. SPV (Khusus Test Drive) ➔ 3. ADH (Semua)</span>
                      <span className="text-sky-400 font-mono font-bold">
                        {isTD ? '3 Tahap (Unit Test Drive)' : '2 Tahap (Non-Test Drive)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      
                      {/* TAHAP 1: GA (Semua Armada) */}
                      <div className={`p-3 rounded-lg border text-xs ${
                        approvals.ga?.status === 'approved'
                          ? 'bg-indigo-950/40 border-indigo-700/60 text-indigo-200'
                          : approvals.ga?.status === 'rejected'
                          ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-indigo-400" />
                            <span>1. Verifikasi GA</span>
                          </span>
                          {getStageBadge(approvals.ga)}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {approvals.ga?.by ? (
                            <>Oleh: <strong>{approvals.ga.by}</strong></>
                          ) : (
                            <span className="text-amber-300 font-medium">Menunggu pemeriksaan kesiapan armada</span>
                          )}
                        </div>
                        {approvals.ga?.note && (
                          <div className="mt-1 text-[10px] text-slate-400 bg-slate-950/50 p-1.5 rounded">
                            "{approvals.ga.note}"
                          </div>
                        )}
                      </div>

                      {/* TAHAP 2: SPV (Khusus Unit TEST DRIVE) */}
                      {isTD ? (
                        <div className={`p-3 rounded-lg border text-xs ${
                          approvals.spv?.status === 'approved'
                            ? 'bg-teal-950/40 border-teal-700/60 text-teal-200'
                            : approvals.spv?.status === 'rejected'
                            ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-teal-400" />
                              <span>2. Persetujuan SPV</span>
                            </span>
                            {getStageBadge(approvals.spv)}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {approvals.spv?.by ? (
                              <>Oleh: <strong>{approvals.spv.by}</strong></>
                            ) : isReadyForSpv ? (
                              <span className="text-teal-300 font-medium">Siap diproses oleh Supervisor (SPV)</span>
                            ) : (
                              <span className="text-slate-400 italic">Menunggu Verifikasi GA selesai</span>
                            )}
                          </div>
                          {approvals.spv?.note && (
                            <div className="mt-1 text-[10px] text-slate-400 bg-slate-950/50 p-1.5 rounded">
                              "{approvals.spv.note}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg border border-slate-700/70 bg-slate-800/40 text-slate-400 text-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold flex items-center gap-1.5 text-slate-300">
                              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                              <span>2. Persetujuan SPV</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/80 text-slate-300 border border-slate-600">
                              ⏩ Tidak Diperlukan
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Bukan unit Test Drive. Otomatis dilewati, langsung ke otorisasi ADH.
                          </div>
                        </div>
                      )}

                      {/* TAHAP 3: ADH (Semua Unit) */}
                      <div className={`p-3 rounded-lg border text-xs ${
                        approvals.adh?.status === 'approved'
                          ? 'bg-purple-950/40 border-purple-700/60 text-purple-200'
                          : approvals.adh?.status === 'rejected'
                          ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-purple-400" />
                            <span>3. Persetujuan ADH</span>
                          </span>
                          {getStageBadge(approvals.adh)}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {approvals.adh?.by ? (
                            <>Oleh: <strong>{approvals.adh.by}</strong></>
                          ) : isReadyForAdh ? (
                            <span className="text-purple-300 font-medium">Siap otorisasi final Admin Head (ADH)</span>
                          ) : (
                            <span className="text-slate-400 italic">
                              {isTD ? 'Menunggu GA & SPV disetujui' : 'Menunggu GA disetujui'}
                            </span>
                          )}
                        </div>
                        {approvals.adh?.note && (
                          <div className="mt-1 text-[10px] text-slate-400 bg-slate-950/50 p-1.5 rounded">
                            "{approvals.adh.note}"
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* ACTION CONTROLS (Role, Sequence & Tab Aware) */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {activeSubTab === 'ga' && (
                        <span>Tahap aktif: <strong>1. Verifikasi General Affairs (GA)</strong></span>
                      )}
                      {activeSubTab === 'spv' && (
                        <span>Tahap aktif: <strong>2. Persetujuan Supervisor (SPV - Khusus Test Drive)</strong></span>
                      )}
                      {activeSubTab === 'adh' && (
                        <span>Tahap aktif: <strong>3. Otorisasi Final Admin Head (ADH)</strong></span>
                      )}
                      {activeSubTab === 'all' && (
                        <span>Semua status otorisasi unit peminjaman</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* AKSI PADA TAB GA */}
                      {activeSubTab === 'ga' && (
                        canApproveStage('ga') ? (
                          approvals.ga?.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(loan, 'ga', 'approved')}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Verifikasi Armada (GA)</span>
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(loan, 'ga', 'rejected')}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Tolak (GA)</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-500">
                              Tahap GA: {approvals.ga?.status === 'approved' ? 'Telah Disetujui' : 'Telah Ditolak'}
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Hanya General Affairs (GA) atau Admin yang dapat memverifikasi tahap ini
                          </span>
                        )
                      )}

                      {/* AKSI PADA TAB SPV */}
                      {activeSubTab === 'spv' && (
                        !isTD ? (
                          <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl">
                            ⏩ Unit bukan Test Drive (tidak memerlukan persetujuan SPV)
                          </span>
                        ) : canApproveStage('spv') ? (
                          !isReadyForSpv && !isAdmin ? (
                            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                              ⏳ Harap menunggu Verifikasi GA selesai terlebih dahulu
                            </span>
                          ) : approvals.spv?.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(loan, 'spv', 'approved')}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Setujui Unit Test Drive (SPV)</span>
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(loan, 'spv', 'rejected')}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Tolak (SPV)</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-500">
                              Tahap SPV: {approvals.spv?.status === 'approved' ? 'Telah Disetujui' : 'Telah Ditolak'}
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Hanya Supervisor (SPV) atau Admin yang dapat menyetujui tahap ini
                          </span>
                        )
                      )}

                      {/* AKSI PADA TAB ADH */}
                      {activeSubTab === 'adh' && (
                        canApproveStage('adh') ? (
                          !isReadyForAdh && !isAdmin ? (
                            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                              ⏳ Menunggu penyelesaian {approvals.ga?.status !== 'approved' ? 'Verifikasi GA' : ''}{isTD && approvals.spv?.status !== 'approved' ? (approvals.ga?.status !== 'approved' ? ' & ' : '') + 'Persetujuan SPV' : ''} terlebih dahulu
                            </span>
                          ) : approvals.adh?.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(loan, 'adh', 'approved')}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Otorisasi Final (ADH)</span>
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(loan, 'adh', 'rejected')}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Tolak (ADH)</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-500">
                              Tahap ADH: {approvals.adh?.status === 'approved' ? 'Telah Disetujui' : 'Telah Ditolak'}
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Hanya Admin Head (ADH) atau Admin yang dapat mengotorisasi tahap ini
                          </span>
                        )
                      )}

                      {/* AKSI PADA TAB SEMUA RIWAYAT */}
                      {activeSubTab === 'all' && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {canApproveStage('ga') && approvals.ga?.status === 'pending' && (
                            <button
                              onClick={() => handleOpenActionModal(loan, 'ga', 'approved')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                            >
                              Verifikasi GA
                            </button>
                          )}
                          {isTD && canApproveStage('spv') && approvals.spv?.status === 'pending' && (
                            <button
                              onClick={() => handleOpenActionModal(loan, 'spv', 'approved')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
                            >
                              Setujui SPV (TD)
                            </button>
                          )}
                          {canApproveStage('adh') && approvals.adh?.status === 'pending' && (
                            <button
                              onClick={() => handleOpenActionModal(loan, 'adh', 'approved')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                            >
                              Otorisasi ADH
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

      </div>

      {/* MODAL KONFIRMASI PERSETUJUAN / PENOLAKAN */}
      <Modal
        isOpen={Boolean(selectedLoan)}
        onClose={() => setSelectedLoan(null)}
        title={
          actionType === 'approved' 
            ? `✅ Konfirmasi Persetujuan (${actionStage?.toUpperCase()})` 
            : `❌ Konfirmasi Penolakan (${actionStage?.toUpperCase()})`
        }
        description={`Proses otorisasi oleh ${currentUser?.name} sebagai ${currentUser?.role?.toUpperCase()}.`}
        maxWidth="max-w-md"
      >
        {selectedLoan && (
          <form onSubmit={handleSubmitAction} className="space-y-4 text-xs sm:text-sm">
            
            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Peminjam:</span>
                <span className="font-bold text-slate-800">{selectedLoan.borrower_name} ({selectedLoan.division})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit Mobil:</span>
                <span className="font-bold text-slate-800">{selectedLoan.vehicle_name} ({selectedLoan.license_plate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori Armada:</span>
                <span className="font-bold text-slate-800">
                  {isTestDriveLoan(selectedLoan, selectedLoan.vehicles) 
                    ? '🏷️ Unit TEST DRIVE' 
                    : '🚗 Unit Operasional Umum'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destinasi:</span>
                <span className="font-semibold text-slate-700">{selectedLoan.destination}</span>
              </div>
              {actionStage === 'ga' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Pengajuan Beli BBM (GA):</span>
                  <span className={`font-bold ${selectedLoan.buy_fuel === 'YA' ? 'text-amber-700' : 'text-slate-600'}`}>
                    {selectedLoan.buy_fuel === 'YA' ? `YA (Rp ${selectedLoan.fuel_amount})` : 'TIDAK'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Tahap Otorisasi:</span>
                <span className="font-bold text-sky-700">
                  {actionStage === 'ga' && '1. Verifikasi Armada (General Affairs - GA)'}
                  {actionStage === 'spv' && '2. Persetujuan Atasan (Supervisor - SPV)'}
                  {actionStage === 'adh' && '3. Otorisasi Final (Admin Head - ADH)'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {actionType === 'approved' 
                  ? 'Catatan Persetujuan (Opsional)' 
                  : 'Alasan Penolakan (Wajib Diisi)'}
              </label>
              <textarea
                rows={3}
                required={actionType === 'rejected'}
                placeholder={
                  actionType === 'approved'
                    ? 'Contoh: Armada siap jalan, kondisi baik, BBM full...'
                    : 'Contoh: Jadwal bertabrakan dengan agenda customer lain / mohon reschedule...'
                }
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer ${
                  actionType === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting 
                  ? 'Memproses...' 
                  : actionType === 'approved' 
                  ? 'Konfirmasi Disetujui' 
                  : 'Konfirmasi Tolak Pengajuan'}
              </button>
            </div>

          </form>
        )}
      </Modal>

    </div>
  )
}
