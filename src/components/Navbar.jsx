import React from 'react'
import { Car, Database, Plus, RefreshCw, LogIn, LogOut, Users, Shield } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'

export function Navbar({ 
  isConnected, 
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenUserManagement,
  onOpenSettings, 
  onOpenLoanModal, 
  onRefresh, 
  isRefreshing 
}) {
  const isAdmin = currentUser?.role === 'admin'

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xs">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-zinc-900">PinjamMobil</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                Supabase Live
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Sistem Peminjaman Kendaraan Operasional</p>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Supabase status badge */}
          <button
            onClick={onOpenSettings}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isConnected 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
            }`}
            title="Klik untuk konfigurasi kunci Supabase"
          >
            <div className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`} />
            <span>{isConnected ? 'Supabase Live' : 'Supabase Error'}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 hidden sm:inline-flex"
            title="Muat ulang data dari Supabase"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-zinc-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* User Session / Auth Controls */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Admin shortcut: Manage users */}
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOpenUserManagement}
                  className="h-8 text-xs gap-1.5 border-zinc-200 hidden sm:inline-flex"
                  title="Kelola pengguna dan setting registrasi"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Kelola User</span>
                </Button>
              )}

              {/* User badge */}
              <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs">
                <span className="font-semibold text-zinc-900 max-w-[110px] truncate">{currentUser.name}</span>
                <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0 uppercase">
                  {currentUser.role === 'admin' ? 'Admin IT' : (currentUser.role || 'Staff')}
                </Badge>
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAuth}
              className="h-8 text-xs gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Masuk / Login</span>
            </Button>
          )}

          <Button 
            size="sm" 
            onClick={() => onOpenLoanModal(null)}
            className="gap-1.5 text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pinjam Mobil</span>
            <span className="sm:hidden">Pinjam</span>
          </Button>
        </div>

      </div>
    </header>
  )
}
