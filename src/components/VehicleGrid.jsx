import React, { useState } from 'react'
import { Search, Plus, Layers } from 'lucide-react'
import { VehicleCard } from './VehicleCard'

export function VehicleGrid({ vehicles = [], isAdmin = false, onBorrow, onAddVehicle, onEditVehicle, onDeleteVehicle }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.type && v.type.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const filterTabs = [
    { id: 'all', label: 'Semua Unit', count: vehicles.length },
    { id: 'available', label: 'Tersedia', count: vehicles.filter(v => v.status === 'available').length },
    { id: 'borrowed', label: 'Dipinjam', count: vehicles.filter(v => v.status === 'borrowed').length },
    { id: 'maintenance', label: 'Perawatan', count: vehicles.filter(v => v.status === 'maintenance').length }
  ]

  return (
    <section className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        
        {/* Status Filter Tabs (Style Legacy / Shadcn) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl max-w-fit overflow-x-auto border border-slate-300/60">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input & Add Vehicle Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari armada / no. polisi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition shadow-xs"
            />
          </div>

          {isAdmin && (
            <button
              onClick={onAddVehicle}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tambah Armada</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Vehicles */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isAdmin={isAdmin}
              onBorrow={onBorrow}
              onEdit={onEditVehicle}
              onDelete={onDeleteVehicle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl bg-white/70">
          <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Tidak ada armada yang sesuai filter.</p>
          <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau tab filter di atas.</p>
        </div>
      )}
    </section>
  )
}
