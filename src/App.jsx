import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { VehicleGrid } from './components/VehicleGrid'
import { LoanHistoryTable } from './components/LoanHistoryTable'
import { ApprovalCenter } from './components/ApprovalCenter'
import { SecurityCheck } from './components/SecurityCheck'
import { LoanFormModal } from './components/LoanFormModal'
import { VehicleFormModal } from './components/VehicleFormModal'
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal'
import { UserManagementModal } from './components/UserManagementModal'
import { SecurityCodesModal } from './components/SecurityCodesModal'
import { ProfileModal } from './components/ProfileModal'
import { LoginPage } from './components/LoginPage'
import { api } from './services/api'
import { Car, AlertTriangle, RefreshCw, Plus, Layers, Clock } from 'lucide-react'

const AUTH_USER_KEY = 'pinjammobil_auth_user'

export default function App() {
  // Session User
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [vehicles, setVehicles] = useState([])
  const [loans, setLoans] = useState([])
  const [supabaseError, setSupabaseError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRegistrationAllowed, setIsRegistrationAllowed] = useState(false)
  
  // Navigation Tabs: 'vehicles' | 'loans'
  const [activeTab, setActiveTab] = useState('vehicles')

  // Modals
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [isSecurityCodesOpen, setIsSecurityCodesOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [securityCodes, setSecurityCodes] = useState([])

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const isAdmin = currentUser?.role === 'admin'
  const canManageVehicles = ['admin', 'ga', 'adh'].includes(currentUser?.role)
  const canManageLoans = ['admin', 'ga', 'adh', 'spv'].includes(currentUser?.role)

  const loadData = useCallback(async () => {
    if (!currentUser) return
    setIsRefreshing(true)
    setSupabaseError(null)
    try {
      const [vRes, lRes, regStatus, secCodes] = await Promise.all([
        api.getVehicles(),
        api.getLoans(),
        api.getRegistrationStatus(),
        api.getSecurityCodes()
      ])

      setIsRegistrationAllowed(regStatus)
      if (Array.isArray(secCodes)) {
        setSecurityCodes(secCodes)
      }

      if (vRes.error) {
        setSupabaseError(vRes.error)
      } else {
        setVehicles(vRes.data || [])
      }

      if (lRes.error && !vRes.error) {
        setSupabaseError(lRes.error)
      } else if (!vRes.error) {
        setLoans(lRes.data || [])
      }
    } catch (err) {
      console.error('Error loadData:', err)
      setSupabaseError(err.message || 'Gagal terhubung ke database Supabase.')
    } finally {
      setIsRefreshing(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser, loadData])

  // --- Auth & User Management Handlers ---
  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    const roleLabels = {
      admin: 'Administrator IT',
      ga: 'General Affairs (GA)',
      spv: 'Supervisor (SPV)',
      adh: 'Administration Head (ADH)',
      staff: 'Staff'
    }
    showToast(`Selamat datang, ${user.name}! (${roleLabels[user.role] || 'Staff'})`)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem(AUTH_USER_KEY)
    showToast('Anda telah keluar dari sistem.')
  }

  const handleToggleRegistration = async (newStatus) => {
    const res = await api.setRegistrationStatus(newStatus)
    if (res.success) {
      setIsRegistrationAllowed(newStatus)
      showToast(newStatus ? 'Pendaftaran akun publik DIBUKA.' : 'Pendaftaran akun publik DITUTUP.')
    } else {
      showToast(res.error || 'Gagal mengubah status pendaftaran.', 'error')
    }
  }

  const handleCreateUser = async (userData) => {
    const res = await api.createUser(userData)
    if (res.success) {
      showToast(`Pengguna "${res.user?.name || userData.name}" (@${res.user?.username || userData.username}) berhasil ditambahkan!`)
      return { success: true }
    } else {
      showToast(res.error || 'Gagal menambahkan akun pengguna.', 'error')
      return { success: false, error: res.error }
    }
  }

  const handleUpdateUser = async (userId, userData) => {
    const res = await api.updateUser(userId, userData)
    if (res.success) {
      showToast('Data akun pengguna berhasil diperbarui!')
      // Jika admin mengedit akun miliknya sendiri, sinkronkan sesi lokal
      if (currentUser?.id === userId) {
        const updatedSelf = { ...currentUser, ...userData }
        delete updatedSelf.password
        setCurrentUser(updatedSelf)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedSelf))
      }
      return { success: true }
    } else {
      showToast(res.error || 'Gagal memperbarui data akun.', 'error')
      return { success: false, error: res.error }
    }
  }

  const handleDeleteUser = async (userId) => {
    const res = await api.deleteUser(userId)
    if (res.success) {
      showToast('Pengguna berhasil dihapus.')
    } else {
      showToast(res.error || 'Gagal menghapus pengguna.', 'error')
    }
  }

  const handleUpdateProfile = async (profileData) => {
    if (!currentUser?.id) return { success: false, error: 'Sesi pengguna tidak valid.' }
    const res = await api.updateProfile(currentUser.id, profileData)
    if (res.success) {
      setCurrentUser(res.user)
      showToast('Profil akun berhasil diperbarui!')
      return { success: true }
    } else {
      showToast(res.error || 'Gagal memperbarui profil.', 'error')
      return { success: false, error: res.error }
    }
  }

  // --- Vehicle CRUD Handlers ---
  const handleOpenAddVehicle = () => {
    if (!canManageVehicles) {
      showToast('Hanya Administrator atau General Affairs (GA) yang dapat menambah armada.', 'error')
      return
    }
    setEditingVehicle(null)
    setIsVehicleModalOpen(true)
  }

  const handleOpenEditVehicle = (vehicle) => {
    if (!canManageVehicles) {
      showToast('Hanya Administrator atau General Affairs (GA) yang dapat mengubah armada.', 'error')
      return
    }
    setEditingVehicle(vehicle)
    setIsVehicleModalOpen(true)
  }

  const handleSubmitVehicle = async (formData, vehicleId) => {
    if (vehicleId) {
      const res = await api.updateVehicle(vehicleId, formData)
      if (res.success) {
        showToast('Data armada berhasil diperbarui!')
        loadData()
      } else {
        showToast(res.error || 'Gagal memperbarui armada.', 'error')
      }
    } else {
      const res = await api.createVehicle(formData)
      if (res.success) {
        showToast('Armada baru berhasil ditambahkan!')
        loadData()
      } else {
        showToast(res.error || 'Gagal menambahkan armada.', 'error')
      }
    }
  }

  const handleDeleteVehicle = async (vehicle) => {
    if (!canManageVehicles) {
      showToast('Hanya Administrator atau General Affairs (GA) yang dapat menghapus armada.', 'error')
      return
    }
    if (!window.confirm(`Yakin ingin menghapus unit "${vehicle.name} (${vehicle.license_plate})"?`)) return
    const res = await api.deleteVehicle(vehicle.id)
    if (res.success) {
      showToast('Unit kendaraan berhasil dihapus!')
      loadData()
    } else {
      showToast(res.error || 'Gagal menghapus armada.', 'error')
    }
  }

  // --- Loan CRUD Handlers ---
  const handleOpenBorrowModal = (vehicle = null) => {
    setSelectedVehicle(vehicle)
    setIsLoanModalOpen(true)
  }

  const handleSubmitLoan = async (formData) => {
    const res = await api.createLoan(formData)
    if (res.success) {
      showToast('Peminjaman mobil berhasil didaftarkan!')
      loadData()
    } else {
      showToast(res.error || 'Gagal mendaftarkan peminjaman.', 'error')
    }
  }

  const handleReturnVehicle = async (loanId, vehicleId, endMileage) => {
    const res = await api.returnVehicle(loanId, vehicleId, endMileage)
    if (res.success) {
      showToast('Unit kendaraan telah dikembalikan dan siap dipinjam kembali.')
      loadData()
    } else {
      showToast(res.error || 'Gagal memproses pengembalian.', 'error')
    }
  }

  const handleDeleteLoan = async (loan) => {
    if (!isAdmin) return
    if (!window.confirm(`Hapus transaksi peminjaman untuk "${loan.borrower_name}"?`)) return
    const res = await api.deleteLoan(loan.id)
    if (res.success) {
      showToast('Transaksi peminjaman berhasil dihapus!')
      loadData()
    } else {
      showToast(res.error || 'Gagal menghapus transaksi.', 'error')
    }
  }

  const handleCancelLoan = async (loanId, vehicleId, reason) => {
    const res = await api.cancelLoan(loanId, vehicleId, currentUser, reason)
    if (res.success) {
      showToast('Pengajuan peminjaman berhasil dibatalkan.')
      loadData()
      return { success: true }
    } else {
      showToast(res.error || 'Gagal membatalkan pengajuan peminjaman.', 'error')
      return { success: false, error: res.error }
    }
  }

  const handleUpdateApproval = async (loanId, stage, action, approverUser, note) => {
    const res = await api.updateLoanApproval(loanId, stage, action, approverUser, note)
    if (res.success) {
      const stageNames = { ga: 'Verifikasi GA', spv: 'Persetujuan SPV', adh: 'Persetujuan ADH' }
      showToast(`${stageNames[stage]} berhasil: ${action === 'approved' ? 'DISETUJUI' : 'DITOLAK'}`)
      loadData()
      return { success: true }
    } else {
      showToast(res.error || 'Gagal memproses persetujuan.', 'error')
      return { success: false, error: res.error }
    }
  }

  const handleSecurityGateOut = async (loanId, gateData, securityUser) => {
    const res = await api.recordSecurityGateOut(loanId, gateData, securityUser)
    if (res.success) {
      showToast('Armada resmi tercatat keluar pos security.')
      loadData()
      return { success: true }
    } else {
      showToast(res.error || 'Gagal mencatat mobil keluar.', 'error')
      return { success: false, error: res.error }
    }
  }

  const handleSecurityGateIn = async (loanId, vehicleId, gateData, securityUser) => {
    const res = await api.recordSecurityGateIn(loanId, vehicleId, gateData, securityUser)
    if (res.success) {
      showToast('Armada telah kembali di pos security & siap digunakan berikutnya.')
      loadData()
      return { success: true }
    } else {
      showToast(res.error || 'Gagal mencatat mobil kembali.', 'error')
      return { success: false, error: res.error }
    }
  }

  // WAJIB LOGIN DULU
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  const availableCount = vehicles.filter(v => v.status === 'available').length
  const borrowedCount = vehicles.filter(v => v.status === 'borrowed').length
  const securityPendingCount = loans.filter(l => {
    const sec = l.security || {}
    return l.status === 'approved' && sec.gate_status !== 'in'
  }).length

  return (
    <div className="min-h-screen bg-[#f0f4f8] py-5 px-3 sm:px-6 lg:px-8 text-slate-800 font-sans selection:bg-sky-600 selection:text-white">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Container Utama Aplikasi (2 Kolom Persis Gaya HTML Legacy) */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
        
        {/* KOLOM KIRI: SIDEBAR MENU UTAMA */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenLoanModal={() => handleOpenBorrowModal(null)}
          onOpenSecurityCodes={() => setIsSecurityCodesOpen(true)}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onOpenEditProfile={() => setIsProfileModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
          loanCount={loans.filter(l => l.status !== 'completed').length}
          vehicleCount={vehicles.length}
          pendingApprovalCount={loans.filter(l => l.status === 'pending').length}
          securityPendingCount={securityPendingCount}
        />

        {/* KOLOM KANAN: KONTEN UTAMA (75% LEBAR) */}
        <main className="w-full lg:w-3/4 flex-1 min-w-0 space-y-6">
          
          {/* Header Card Konten Kanan (Identik dengan Legacy) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                    <span>Database Supabase Live</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1.5">
                  {activeTab === 'vehicles' && 'Status Ketersediaan & Armada Mobil'}
                  {activeTab === 'loans' && 'Histori & Transaksi Peminjaman Unit'}
                  {activeTab === 'approvals' && 'Pusat Verifikasi & Persetujuan'}
                  {activeTab === 'security' && 'Pos Pengecekan Security'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {activeTab === 'vehicles' && 'Daftar armada kendaraan operasional yang tersedia beserta status terkini.'}
                  {activeTab === 'loans' && 'Catatan seluruh transaksi peminjaman kendaraan aktif maupun selesai.'}
                  {activeTab === 'approvals' && 'Alur otorisasi berjenjang: 1. Verifikasi GA (semua armada) ➔ 2. Persetujuan SPV (khusus Test Drive) ➔ 3. Persetujuan ADH (semua unit).'}
                  {activeTab === 'security' && 'Pemeriksaan fisik, kilometer, serta serah terima kunci untuk Mobil Keluar & Mobil Kembali di pos gerbang.'}
                </p>
              </div>

              {/* Quick Stat Badges (Style Legacy) */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-center shadow-xs">
                  <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Sedang Dipinjam</div>
                  <div className="text-base font-bold text-amber-600">{borrowedCount}</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-center shadow-xs">
                  <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Unit Tersedia</div>
                  <div className="text-base font-bold text-emerald-600">{availableCount}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-center shadow-xs">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Armada</div>
                  <div className="text-base font-bold text-slate-700">{vehicles.length}</div>
                </div>

                <button
                  onClick={loadData}
                  disabled={isRefreshing}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
                  title="Muat ulang data Supabase"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Error Banner jika ada kendala database */}
            {supabaseError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>{supabaseError}</span>
                </div>
                <button
                  onClick={loadData}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-xs shrink-0 cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: DAFTAR ARMADA MOBIL */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    🚘 Daftar Kendaraan Tersedia & Status Unit
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {availableCount} Unit Siap Pakai
                  </span>
                </div>
                <div className="text-xs text-slate-500 hidden sm:block">
                  Alur Otorisasi: <span className="font-semibold text-sky-700">1. Verifikasi GA ➔ 2. SPV (Test Drive) ➔ 3. Otorisasi ADH</span>
                </div>
              </div>

              <VehicleGrid
                vehicles={vehicles}
                isAdmin={canManageVehicles}
                onBorrow={handleOpenBorrowModal}
                onAddVehicle={handleOpenAddVehicle}
                onEditVehicle={handleOpenEditVehicle}
                onDeleteVehicle={handleDeleteVehicle}
              />
            </div>
          )}

          {/* TAB 2: HISTORI PEMINJAMAN */}
          {activeTab === 'loans' && (
            <LoanHistoryTable
              loans={loans}
              isAdmin={canManageLoans}
              currentUser={currentUser}
              onReturnVehicle={handleReturnVehicle}
              onDeleteLoan={handleDeleteLoan}
              onCancelLoan={handleCancelLoan}
            />
          )}

          {/* TAB 3: VERIFIKASI & PERSETUJUAN (GA, SPV, ADH) */}
          {activeTab === 'approvals' && (
            <ApprovalCenter
              loans={loans}
              currentUser={currentUser}
              onUpdateApproval={handleUpdateApproval}
              onRefresh={loadData}
            />
          )}

          {/* TAB 4: PENGECEKAN SECURITY (MOBIL KELUAR & MOBIL KEMBALI) */}
          {activeTab === 'security' && (
            <SecurityCheck
              loans={loans}
              currentUser={currentUser}
              securityCodes={securityCodes}
              onGateOut={handleSecurityGateOut}
              onGateIn={handleSecurityGateIn}
              onRefresh={loadData}
            />
          )}

        </main>
      </div>

      {/* Modals */}
      <LoanFormModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        currentUser={currentUser}
        selectedVehicle={selectedVehicle}
        availableVehicles={vehicles.filter(v => v.status === 'available')}
        onSubmit={handleSubmitLoan}
      />

      <VehicleFormModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        vehicleToEdit={editingVehicle}
        onSubmit={handleSubmitVehicle}
      />

      <SupabaseSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={loadData}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={currentUser}
        isRegistrationAllowed={isRegistrationAllowed}
        onToggleRegistration={handleToggleRegistration}
        onLoadUsers={() => api.getUsers()}
        onCreateUser={handleCreateUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      <SecurityCodesModal
        isOpen={isSecurityCodesOpen}
        onClose={() => setIsSecurityCodesOpen(false)}
        onSaved={loadData}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
      />

    </div>
  )
}
