import React, { useState, useEffect, useCallback } from 'react'
import { Navbar } from './components/Navbar'
import { StatsCards } from './components/StatsCards'
import { VehicleGrid } from './components/VehicleGrid'
import { LoanHistoryTable } from './components/LoanHistoryTable'
import { LoanFormModal } from './components/LoanFormModal'
import { VehicleFormModal } from './components/VehicleFormModal'
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal'
import { api } from './services/api'
import { getSupabaseConfig } from './lib/supabase'
import { Car, Clock, CheckCircle2, AlertCircle, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'

export default function App() {
  const [vehicles, setVehicles] = useState([])
  const [loans, setLoans] = useState([])
  const [supabaseError, setSupabaseError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('vehicles') // 'vehicles' | 'loans'

  // Modals
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = useCallback(async () => {
    setIsRefreshing(true)
    setSupabaseError(null)
    try {
      const [vRes, lRes] = await Promise.all([
        api.getVehicles(),
        api.getLoans()
      ])

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
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- Vehicle CRUD Handlers ---
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null)
    setIsVehicleModalOpen(true)
  }

  const handleOpenEditVehicle = (vehicle) => {
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
    if (!window.confirm(`Hapus riwayat peminjaman untuk "${loan.borrower_name}"?`)) return
    const res = await api.deleteLoan(loan.id)
    if (res.success) {
      showToast('Riwayat peminjaman berhasil dihapus!')
      loadData()
    } else {
      showToast(res.error || 'Gagal menghapus riwayat.', 'error')
    }
  }

  const isConnected = !supabaseError

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-zinc-900 border-zinc-800 text-white'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header / Navbar */}
      <Navbar
        isConnected={isConnected}
        errorMessage={supabaseError}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLoanModal={() => handleOpenBorrowModal(null)}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Banner Supabase Error or Permission Issue */}
        {supabaseError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Database Supabase Mengembalikan Pesan:</span>
                <p className="font-mono text-[11px] text-rose-800 mt-0.5 bg-rose-100/60 px-2 py-1 rounded inline-block">
                  {supabaseError}
                </p>
                <p className="text-rose-700 mt-1">
                  Jika pesan berupa <em>"permission denied"</em> atau <em>"table not found"</em>, jalankan ulang script <strong>supabase-schema.sql</strong> di SQL Editor Supabase untuk memberikan hak akses publik ke tabel.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadData}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Coba Lagi</span>
              </button>
              <a
                href="https://supabase.com/dashboard/project/dvezfsggwmxbdglfudep/sql/new"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Buka SQL Editor</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <StatsCards vehicles={vehicles} loans={loans} />

        {/* Main Navigation Tabs */}
        <div className="border-b border-zinc-200 pb-0 flex items-center justify-between">
          <div className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'vehicles'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Car className="h-4 w-4" />
              <span>Katalog Armada Kendaraan ({vehicles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('loans')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'loans'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Histori Peminjaman</span>
              {loans.filter(l => l.status !== 'completed').length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-zinc-100 text-zinc-700 font-bold border border-zinc-200">
                  {loans.filter(l => l.status !== 'completed').length} Aktif
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Section */}
        {activeTab === 'vehicles' ? (
          <VehicleGrid
            vehicles={vehicles}
            onBorrow={handleOpenBorrowModal}
            onAddVehicle={handleOpenAddVehicle}
            onEditVehicle={handleOpenEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        ) : (
          <LoanHistoryTable
            loans={loans}
            onReturnVehicle={handleReturnVehicle}
            onDeleteLoan={handleDeleteLoan}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} PinjamMobil. Murni Database Supabase.</p>
          <div className="flex items-center gap-4 text-zinc-500">
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-zinc-900 cursor-pointer">
              Konfigurasi Supabase
            </button>
            <span>•</span>
            <button onClick={() => window.open('legacy/index.html', '_blank')} className="hover:text-zinc-900 cursor-pointer">
              Versi Monolitik Lama
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoanFormModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
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
    </div>
  )
}
