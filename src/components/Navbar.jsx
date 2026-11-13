import React from 'react'
import { Car, Database, Plus, RefreshCw, Layers } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'

export function Navbar({ 
  supabaseStatus, 
  onOpenSettings, 
  onOpenLoanModal, 
  onRefresh, 
  isRefreshing 
}) {
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
                v2.0 Modular
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Sistem Peminjaman Kendaraan Operasional</p>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2.5">
          {/* Supabase status badge */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-white hover:bg-zinc-50 border-zinc-200 cursor-pointer"
            title="Klik untuk konfigurasi koneksi Supabase"
          >
            <div className={`h-2 w-2 rounded-full ${supabaseStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-zinc-600 hidden md:inline">Database:</span>
            <span className={supabaseStatus ? 'font-semibold text-emerald-700' : 'font-medium text-amber-700'}>
              {supabaseStatus ? 'Supabase Connected' : 'Local Storage Demo'}
            </span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 hidden sm:inline-flex"
            title="Muat ulang data"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-zinc-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button 
            size="sm" 
            onClick={() => onOpenLoanModal(null)}
            className="gap-1.5 text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Pinjam Mobil</span>
          </Button>
        </div>

      </div>
    </header>
  )
}
