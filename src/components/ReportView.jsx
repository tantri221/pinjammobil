import React, { useState, useMemo } from 'react'
import { 
  Fuel, 
  BarChart3, 
  Car, 
  Calendar, 
  Printer, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Sparkles,
  CheckCircle2,
  PieChart
} from 'lucide-react'

export function ReportView({ loans = [], vehicles = [] }) {
  // Filter Periode: 'all' | 'this_month' | 'last_month' | 'this_year'
  const [period, setPeriod] = useState('all')

  // Filter Pinjaman Berdasarkan Periode Terpilih
  const filteredLoans = useMemo(() => {
    // Abaikan pinjaman yang ditolak (rejected)
    const validLoans = loans.filter(l => l.status !== 'rejected')
    if (period === 'all') return validLoans

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0 - 11

    return validLoans.filter(l => {
      if (!l.start_date) return false
      const d = new Date(l.start_date)
      if (isNaN(d.getTime())) return false

      if (period === 'this_month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth
      }
      if (period === 'last_month') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1)
        return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth()
      }
      if (period === 'this_year') {
        return d.getFullYear() === currentYear
      }
      return true
    })
  }, [loans, period])

  // 1. DATA REKAP PEMBELIAN BBM PER UNIT KENDARAAN
  const vehicleFuelStats = useMemo(() => {
    return vehicles.map(v => {
      // Cocokkan peminjaman untuk kendaraan ini
      const vLoans = filteredLoans.filter(l => 
        String(l.vehicle_id) === String(v.id) ||
        (l.license_plate && v.license_plate && l.license_plate.trim().toUpperCase() === v.license_plate.trim().toUpperCase())
      )

      // Total pembelian BBM untuk unit ini
      const totalFuelCost = vLoans.reduce((sum, l) => sum + (Number(l.fuel_cost) || 0), 0)
      const tripCount = vLoans.length

      return {
        id: v.id,
        name: v.name,
        license_plate: v.license_plate,
        type: v.type || 'Mobil Operasional',
        tripCount,
        totalFuelCost,
        currentFuel: v.fuel_level ?? 100
      }
    }).sort((a, b) => b.totalFuelCost - a.totalFuelCost || b.tripCount - a.tripCount)
  }, [vehicles, filteredLoans])

  // Grand Total BBM Seluruh Armada
  const grandTotalFuelCost = useMemo(() => {
    return vehicleFuelStats.reduce((sum, v) => sum + v.totalFuelCost, 0)
  }, [vehicleFuelStats])

  const grandTotalTrips = useMemo(() => {
    return vehicleFuelStats.reduce((sum, v) => sum + v.tripCount, 0)
  }, [vehicleFuelStats])

  // 2. DATA INTENSITAS PENGGUNAAN BERDASARKAN PERUNTUKAN
  const purposeStats = useMemo(() => {
    const totalLoansCount = filteredLoans.length
    if (totalLoansCount === 0) return []

    const counts = {}
    const fuelPerPurpose = {}

    filteredLoans.forEach(l => {
      const p = (l.purpose || 'Lain-lain / Khusus').trim()
      counts[p] = (counts[p] || 0) + 1
      fuelPerPurpose[p] = (fuelPerPurpose[p] || 0) + (Number(l.fuel_cost) || 0)
    })

    const result = Object.keys(counts).map(purposeName => {
      const count = counts[purposeName]
      const percentage = Math.round((count / totalLoansCount) * 100)
      const totalFuel = fuelPerPurpose[purposeName] || 0
      return {
        purpose: purposeName,
        count,
        percentage,
        totalFuel
      }
    })

    // Urutkan dari intensitas terbanyak
    return result.sort((a, b) => b.count - a.count)
  }, [filteredLoans])

  // Format Mata Uang Rupiah
  const formatRupiah = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID')
  }

  // Cetak Dokumen Laporan
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Laporan Penggunaan Armada & Rekap BBM
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi total pembelian BBM per unit kendaraan dan intensitas penggunaan berdasarkan peruntukan.
          </p>
        </div>

        {/* Action Controls: Filter Periode & Cetak */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Semua Periode</option>
              <option value="this_month">Bulan Ini</option>
              <option value="last_month">Bulan Lalu</option>
              <option value="this_year">Tahun Ini</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Cetak atau simpan laporan ke PDF"
          >
            <Printer className="h-3.5 w-3.5 text-sky-400" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Ringkasan Eksekutif */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
            <Fuel className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Pembelian BBM
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {formatRupiah(grandTotalFuelCost)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Akumulasi pembelian seluruh unit
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0 border border-sky-100">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Penggunaan (Trip)
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {grandTotalTrips} <span className="text-xs font-semibold text-slate-500">Perjalanan</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Rata-rata: {grandTotalTrips > 0 ? formatRupiah(Math.round(grandTotalFuelCost / grandTotalTrips)) : 'Rp 0'} / trip
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-100">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Peruntukan Terbanyak
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5 truncate">
              {purposeStats[0]?.purpose || 'Belum ada data'}
            </div>
            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
              {purposeStats[0] ? `${purposeStats[0].count} trip (${purposeStats[0].percentage}%)` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TABEL REKAP PEMBELIAN BBM PER UNIT KENDARAAN */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                1. Rekap Pembelian BBM per Unit Kendaraan
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Total akumulasi biaya pembelian BBM yang diinput pada formulir peminjaman untuk masing-masing unit.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            {vehicleFuelStats.length} Unit Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Unit Kendaraan</th>
                <th className="py-3 px-4 text-center">Nomor Polisi</th>
                <th className="py-3 px-4 text-center">Total Dipakai</th>
                <th className="py-3 px-4 text-right">Total Pembelian BBM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicleFuelStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data unit armada kendaraan.
                  </td>
                </tr>
              ) : (
                vehicleFuelStats.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 text-xs sm:text-sm">
                        {v.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {v.type}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {v.license_plate}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-slate-700">
                        {v.tripCount} kali
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono font-bold text-xs sm:text-sm ${
                        v.totalFuelCost > 0 ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {formatRupiah(v.totalFuelCost)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Footer Grand Total */}
            <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-950">
              <tr>
                <td colSpan={3} className="py-3.5 px-4 text-left font-black tracking-wide uppercase text-xs">
                  TOTAL KESELURUHAN SELURUH ARMADA
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-black text-xs text-sky-300">
                  {grandTotalTrips} kali
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-400">
                  {formatRupiah(grandTotalFuelCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABEL INTENSITAS PENGGUNAAN BERDASARKAN PERUNTUKAN */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                2. Intensitas Penggunaan Berdasarkan Peruntukan Peminjaman
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis frekuensi peminjaman dan porsi kebutuhan operasional kendaraan kantor.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
            {filteredLoans.length} Total Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Peruntukan / Keperluan</th>
                <th className="py-3 px-4 text-center w-28">Jumlah Dipakai</th>
                <th className="py-3 px-4 text-center w-24">Porsi (%)</th>
                <th className="py-3 px-4">Visual Distribusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purposeStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada riwayat peminjaman pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                purposeStats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {item.purpose}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-slate-800">
                        {item.count}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">kali</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                        {item.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden max-w-xs">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0 ? 'bg-sky-600' :
                              idx === 1 ? 'bg-emerald-500' :
                              idx === 2 ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.max(item.percentage, 4)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {item.count} trip
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Footer Total */}
            {purposeStats.length > 0 && (
              <tfoot className="bg-slate-50 text-slate-700 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-left uppercase text-xs">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-xs text-slate-900">
                    {filteredLoans.length} kali
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-xs text-slate-900">
                    100%
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-normal italic">
                    Seluruh keperluan peminjaman armada terdata
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  )
}
