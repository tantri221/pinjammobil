import React from 'react'
import { Car, CheckCircle2, Clock, Wrench } from 'lucide-react'
import { Card, CardContent } from './ui/Card'

export function StatsCards({ vehicles = [], loans = [] }) {
  const total = vehicles.length
  const available = vehicles.filter(v => v.status === 'available').length
  const borrowed = vehicles.filter(v => v.status === 'borrowed').length
  const maintenance = vehicles.filter(v => v.status === 'maintenance').length

  const stats = [
    {
      title: 'Total Armada',
      value: total,
      desc: 'Unit terdaftar di sistem',
      icon: Car,
      color: 'text-zinc-900',
      bg: 'bg-zinc-100'
    },
    {
      title: 'Unit Tersedia',
      value: available,
      desc: 'Siap untuk dipinjam',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Sedang Beroperasi',
      value: borrowed,
      desc: 'Dalam status peminjaman',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      title: 'Perawatan / Servis',
      value: maintenance,
      desc: 'Tidak dapat dipinjam',
      icon: Wrench,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <Card key={idx} className="hover:border-zinc-300 transition-colors">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">{stat.title}</span>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                  {stat.value}
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">{stat.desc}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
