import React from 'react'
import { 
  Car, 
  BarChart3, 
  Layers, 
  Clock, 
  Plus, 
  Users, 
  Database, 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  CheckSquare,
  KeyRound
} from 'lucide-react'

export function Sidebar({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenLoanModal,
  onOpenSecurityCodes,
  onOpenUserManagement,
  onOpenSettings,
  onLogout,
  loanCount = 0,
  vehicleCount = 0,
  pendingApprovalCount = 0,
  securityPendingCount = 0
}) {
  const isAdmin = currentUser?.role === 'admin'
  const initial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'

  const userRole = currentUser?.role?.toLowerCase()
  let roleTitle = 'STAFF / PEMINJAM'
  let roleBadgeClass = 'bg-sky-500/20 text-sky-300 border-sky-400/30'

  if (userRole === 'admin') {
    roleTitle = 'ADMINISTRATOR IT'
    roleBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-400/30'
  } else if (userRole === 'ga') {
    roleTitle = 'GENERAL AFFAIRS (GA)'
    roleBadgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
  } else if (userRole === 'spv') {
    roleTitle = 'SUPERVISOR (SPV)'
    roleBadgeClass = 'bg-teal-500/20 text-teal-300 border-teal-400/30'
  } else if (userRole === 'adh') {
    roleTitle = 'ADMIN HEAD (ADH)'
    roleBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-400/30'
  } else if (userRole === 'security') {
    roleTitle = 'PETUGAS SECURITY'
    roleBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
  }

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-slate-900 text-slate-100 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header Sidebar */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold text-sm shrink-0">
              🚗
            </div>
            <div className="truncate">
              <div className="text-xs font-bold tracking-wide text-white">MENU UTAMA</div>
              <div className="text-[11px] text-slate-400">PinjamMobil v2.0</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
            MODULAR
          </span>
        </div>

        {/* Informasi Akun Aktif di Sidebar (Style Legacy) */}
        <div className="p-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm border border-sky-400/40">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-white truncate">{currentUser?.name || 'Pengguna'}</div>
              <div className="text-xs text-slate-400 truncate">Divisi {currentUser?.division || 'Operasional'}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeClass}`}>
                  {roleTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Indikator Sesi Supabase Live */}
          <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Status Koneksi:</span>
            </span>
            <span className="font-mono font-bold text-emerald-300">Supabase Live</span>
          </div>
        </div>

        {/* Menu Navigasi Utama */}
        <div className="p-3 space-y-2 text-xs">
          
          {/* Menu 1: Status & Histori Utama */}
          <button
            type="button"
            onClick={() => setActiveTab('vehicles')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>Status & Armada Mobil</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono">
              {vehicleCount}
            </span>
          </button>

          {/* Menu 2: Histori Peminjaman */}
          <button
            type="button"
            onClick={() => setActiveTab('loans')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${
              activeTab === 'loans'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Histori Peminjaman</span>
            </div>
            {loanCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-200 border border-sky-400/30 font-mono">
                {loanCount}
              </span>
            )}
          </button>

          {/* Menu 3: Verifikasi & Persetujuan (GA, SPV, ADH) */}
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span>Verifikasi & Persetujuan</span>
            </div>
            {pendingApprovalCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black shadow-xs">
                {pendingApprovalCount}
              </span>
            )}
          </button>

          {/* Menu 4: Pengecekan Security (Mobil Keluar & Mobil Kembali) */}
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${
              activeTab === 'security'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Pengecekan Security</span>
            </div>
            {securityPendingCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black shadow-xs">
                {securityPendingCount}
              </span>
            )}
          </button>

          {/* Quick Action: Tambah Pinjam Baru */}
          <button
            type="button"
            onClick={() => onOpenLoanModal(null)}
            className="w-full text-left px-3.5 py-2.5 rounded-xl font-semibold transition text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/60 hover:text-white flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Input Peminjaman Baru</span>
            </div>
            <span className="text-xs">➕</span>
          </button>

          {/* Menu Khusus Admin IT */}
          {isAdmin && (
            <div className="pt-2 space-y-1.5">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Menu Administrator
              </div>

              {/* Kelola Kode Security (6 Petugas / Pos) */}
              <button
                type="button"
                onClick={onOpenSecurityCodes}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-semibold transition text-emerald-200 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/60 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-emerald-400" />
                  <span>Kelola Kode Security</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  6 Pos
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenUserManagement}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-semibold transition text-indigo-200 bg-indigo-950/40 border border-indigo-800/60 hover:bg-indigo-900/60 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Kelola User & Registrasi</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
              </button>
            </div>
          )}

          {/* Pengaturan Database Supabase */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full text-left px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition flex items-center gap-2 cursor-pointer text-[11px]"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Pengaturan Database</span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer Logout Button (Style Legacy) */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <button
          type="button"
          onClick={onLogout}
          className="w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Keluar (Logout)</span>
        </button>
      </div>

    </aside>
  )
}
