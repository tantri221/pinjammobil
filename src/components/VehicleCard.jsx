import React from 'react'
import { Fuel, Gauge, Users, Key, Edit, Trash2 } from 'lucide-react'

export function VehicleCard({ vehicle, isAdmin = false, onBorrow, onEdit, onDelete }) {
  const statusConfig = {
    available: {
      label: 'Tersedia',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      canBorrow: true
    },
    borrowed: {
      label: 'Sedang Dipinjam',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      canBorrow: false
    },
    maintenance: {
      label: 'Perawatan Unit',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      canBorrow: false
    }
  }

  const currentStatus = statusConfig[vehicle.status] || statusConfig.available

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
      <div>
        {/* Top Header Card */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {vehicle.type || 'MPV'}
            </span>
            <h3 className="text-base font-bold text-slate-800 mt-0.5 leading-snug">
              {vehicle.name}
            </h3>
            <div className="mt-1">
              <span className="inline-block px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-100 text-slate-700 border border-slate-300/80">
                {vehicle.license_plate}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${currentStatus.badgeClass}`}>
              {currentStatus.label}
            </span>

            {/* Admin Quick Action (Edit & Delete) */}
            {isAdmin && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(vehicle)}
                  className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                  title="Edit data kendaraan"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(vehicle)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Hapus kendaraan"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Specs & Fuel Info */}
        <div className="py-3 space-y-2.5 text-xs text-slate-600">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{vehicle.capacity || 7} Kursi</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Gauge className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-mono font-medium">{(vehicle.mileage || 0).toLocaleString()} KM</span>
            </div>
          </div>

          {/* Level BBM Bar */}
          <div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Fuel className="h-3 w-3 text-slate-400" /> Level BBM
              </span>
              <span className="font-bold text-slate-700">{vehicle.fuel_level ?? 100}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/60">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  (vehicle.fuel_level ?? 100) > 40 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${vehicle.fuel_level ?? 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Button Action */}
      <div className="pt-2">
        <button
          disabled={!currentStatus.canBorrow}
          onClick={() => onBorrow(vehicle)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
            currentStatus.canBorrow
              ? 'bg-sky-600 hover:bg-sky-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          {currentStatus.canBorrow ? (
            <>
              <Key className="h-3.5 w-3.5" />
              <span>Pinjam Unit Ini</span>
            </>
          ) : (
            <span>Unit Tidak Tersedia</span>
          )}
        </button>
      </div>
    </div>
  )
}
