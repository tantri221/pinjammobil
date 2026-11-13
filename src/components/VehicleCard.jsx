import React from 'react'
import { Fuel, Gauge, Users, Key, Edit, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

export function VehicleCard({ vehicle, isAdmin = false, onBorrow, onEdit, onDelete }) {
  const statusConfig = {
    available: {
      label: 'Tersedia',
      variant: 'success',
      canBorrow: true
    },
    borrowed: {
      label: 'Sedang Dipinjam',
      variant: 'warning',
      canBorrow: false
    },
    maintenance: {
      label: 'Perawatan Unit',
      variant: 'danger',
      canBorrow: false
    }
  }

  const currentStatus = statusConfig[vehicle.status] || statusConfig.available

  return (
    <Card className="flex flex-col justify-between hover:shadow-md hover:border-zinc-300 transition-all duration-200 group">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                {vehicle.type || 'MPV'}
              </span>
              <CardTitle className="text-base font-bold text-zinc-900 mt-0.5">
                {vehicle.name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={currentStatus.variant}>
                {currentStatus.label}
              </Badge>
              
              {/* Quick actions for Edit / Delete (Admin Only) */}
              {isAdmin && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(vehicle)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                    title="Edit data kendaraan (Admin)"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(vehicle)}
                    className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus kendaraan (Admin)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-1">
            <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs bg-zinc-100 text-zinc-800 border border-zinc-200">
              {vehicle.license_plate}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Details specs */}
          <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-zinc-100">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              <span>Kapasitas {vehicle.capacity || 7} Kursi</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Gauge className="h-3.5 w-3.5 text-zinc-400" />
              <span>{(vehicle.mileage || 0).toLocaleString()} KM</span>
            </div>
          </div>

          {/* Fuel Level */}
          <div>
            <div className="flex justify-between items-center text-[11px] text-zinc-500 mb-1">
              <span className="flex items-center gap-1">
                <Fuel className="h-3 w-3" /> Level BBM
              </span>
              <span className="font-semibold text-zinc-700">{vehicle.fuel_level ?? 100}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  (vehicle.fuel_level ?? 100) > 40 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${vehicle.fuel_level ?? 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-2">
        <Button
          className="w-full text-xs h-9"
          variant={currentStatus.canBorrow ? 'default' : 'secondary'}
          disabled={!currentStatus.canBorrow}
          onClick={() => onBorrow(vehicle)}
        >
          {currentStatus.canBorrow ? (
            <>
              <Key className="h-3.5 w-3.5 mr-1.5" />
              Pinjam Unit Ini
            </>
          ) : (
            'Unit Tidak Tersedia'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
