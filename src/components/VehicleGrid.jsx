import React, { useState } from 'react'
import { Search, Filter, Layers } from 'lucide-react'
import { VehicleCard } from './VehicleCard'
import { Input } from './ui/Input'

export function VehicleGrid({ vehicles = [], onBorrow }) {
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
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl max-w-fit overflow-x-auto">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/70 text-zinc-600">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Cari armada / no. polisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onBorrow={onBorrow}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-white/50">
          <Layers className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-600">Tidak ada armada yang sesuai filter.</p>
          <p className="text-xs text-zinc-400 mt-0.5">Coba ubah kata kunci pencarian atau tab filter.</p>
        </div>
      )}
    </section>
  )
}
