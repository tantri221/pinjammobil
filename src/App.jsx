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
import { Car, Clock, CheckCircle2, AlertCircle, AlertTriangle, ExternalLink } from 'lucide-react'

export default function App() {
  const [vehicles, setVehicles] = useState([])
  const [loans, setLoans] = useState([])
  const [dataSource, setDataSource] = useState('local')
  const [isTableMissing, setIsTableMissing] = useState(false)
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
    try {
      const [vRes, lRes] = await Promise.all([
        api.getVehicles(),
        api.getLoans()
      ])
      setVehicles(vRes.data || [])
      setLoans(lRes.data || [])
      setDataSource(vRes.source || 'local')
      setIsTableMissing(Boolean(vRes.isTableMissing))
    } catch (err) {
      console.error('Error loadData:', err)
      showToast('Gagal memuat data terbaru.', 'error')
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

  const { isConfigured } = getSupabaseConfig()

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
        supabaseStatus={isConfigured && dataSource === 'supabase'}
        isTableMissing={isTableMissing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLoanModal={() => handleOpenBorrowModal(null)}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Banner Table Missing Notification */}
        {isTableMissing && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Kunci Supabase Valid, namun Tabel Database Belum Dibuat:</span>
                <p className="text-amber-800 mt-0.5">
                  Tabel <code>vehicles</code> belum ada di Supabase Anda. Salin file <code>supabase-schema.sql</code> dan klik <strong>Run</strong> di SQL Editor Supabase agar database langsung aktif secara live!
                </p>
              </div>
            </div>
            <a
              href="https://supabase.com/dashboard/project/dvezfsggwmxbdglfudep/sql/new"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors shrink-0 inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Buka SQL Editor Supabase</span>
              <ExternalLink className="h-3 w-3" />
            </a>
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
          <p>© {new Date().getFullYear()} PinjamMobil. Arsitektur Modular & Desain Sederhana.</p>
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
