import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input, Select } from './ui/Input'

export function LoanFormModal({ isOpen, onClose, currentUser = null, selectedVehicle, availableVehicles = [], onSubmit }) {
  const [formData, setFormData] = useState({
    borrower_name: '',
    division: 'Sales',
    vehicle_id: '',
    start_mileage: '',
    start_fuel: '100%',
    buy_fuel: 'TIDAK',
    fuel_amount: '100.000',
    purpose: 'Test Drive Pelanggan',
    destination: '',
    start_date: '',
    end_date: '',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize dates and preselected vehicle & user profile
  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const end = new Date(now.getTime() + 4 * 3600000) // +4 hours

      const toLocalISO = (d) => {
        const offset = d.getTimezoneOffset() * 60000
        return new Date(d.getTime() - offset).toISOString().slice(0, 16)
      }

      const defaultVehicle = selectedVehicle || availableVehicles[0]
      const defaultFuel = defaultVehicle?.fuel_level != null ? `${defaultVehicle.fuel_level}%` : '100%'

      setFormData(prev => ({
        ...prev,
        borrower_name: currentUser?.name || prev.borrower_name || '',
        division: currentUser?.division || prev.division || 'Sales',
        vehicle_id: defaultVehicle ? String(defaultVehicle.id) : '',
        start_mileage: defaultVehicle ? String(defaultVehicle.mileage || 0) : '',
        start_fuel: defaultFuel,
        buy_fuel: 'TIDAK',
        fuel_amount: '100.000',
        start_date: toLocalISO(now),
        end_date: toLocalISO(end)
      }))
    }
  }, [isOpen, selectedVehicle, availableVehicles, currentUser])

  const handleVehicleChange = (e) => {
    const vId = e.target.value
    const found = availableVehicles.find(v => String(v.id) === String(vId))
    setFormData(prev => ({
      ...prev,
      vehicle_id: vId,
      start_mileage: found ? String(found.mileage || 0) : prev.start_mileage,
      start_fuel: found?.fuel_level != null ? `${found.fuel_level}%` : prev.start_fuel
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.vehicle_id) {
      alert('Pilih unit kendaraan yang tersedia.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Peminjaman Kendaraan"
      description="Isi detail peminjaman armada operasional di bawah ini."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        
        {/* Nama & Divisi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Nama Peminjam <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="Contoh: Budi Santoso"
              value={formData.borrower_name}
              onChange={e => setFormData({ ...formData, borrower_name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Divisi <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.division}
              onChange={e => setFormData({ ...formData, division: e.target.value })}
            >
              <option value="Sales">Sales</option>
              <option value="Admin">Admin</option>
              <option value="Servis">Servis</option>
              <option value="IT Support">IT Support</option>
              <option value="Operasional">Operasional</option>
              <option value="Manajemen">Manajemen / Direksi</option>
            </Select>
          </div>
        </div>

        {/* Pilihan Kendaraan */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Unit Kendaraan <span className="text-red-500">*</span>
          </label>
          <Select
            required
            value={formData.vehicle_id}
            onChange={handleVehicleChange}
          >
            {availableVehicles.length === 0 ? (
              <option value="" disabled>Tidak ada unit tersedia</option>
            ) : (
              availableVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.license_plate}) • Level BBM: {v.fuel_level ?? 100}%
                </option>
              ))
            )}
          </Select>
        </div>

        {/* Kondisi KM Awal & BBM Awal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              KM Awal Speedometer <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              required
              placeholder="KM Awal"
              value={formData.start_mileage}
              onChange={e => setFormData({ ...formData, start_mileage: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Kondisi BBM Awal <span className="text-red-500">*</span>
            </label>
            <Select
              required
              value={formData.start_fuel}
              onChange={e => setFormData({ ...formData, start_fuel: e.target.value })}
            >
              <option value="100%">Full Tank (100%)</option>
              <option value="75%">3/4 Tank (75%)</option>
              <option value="50%">1/2 Tank (50%)</option>
              <option value="25%">1/4 Tank (25%)</option>
              <option value="10%">Res / Hampir Habis (10%)</option>
            </Select>
          </div>
        </div>

        {/* Input Pengajuan Beli BBM (YA / TIDAK) & Pilihan Nominal */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Pengajuan Beli BBM? <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Pilih YA jika operasional memerlukan pembelian bahan bakar (dikelola langsung oleh General Affairs / GA).
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, buy_fuel: 'TIDAK', fuel_amount: '' })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  formData.buy_fuel === 'TIDAK'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                TIDAK
              </button>
              <button
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  buy_fuel: 'YA', 
                  fuel_amount: formData.fuel_amount || '100.000' 
                })}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  formData.buy_fuel === 'YA'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                YA
              </button>
            </div>
          </div>

          {/* Input Nominal Pembelian BBM jika pilihannya YA */}
          {formData.buy_fuel === 'YA' && (
            <div className="pt-2.5 border-t border-slate-200 animate-in fade-in duration-200 space-y-1">
              <label className="block text-xs font-bold text-emerald-800">
                Nominal Pembelian BBM <span className="text-red-500">*</span>
              </label>
              <Select
                required
                value={formData.fuel_amount}
                onChange={e => setFormData({ ...formData, fuel_amount: e.target.value })}
                className="bg-white border-emerald-300 text-emerald-950 font-bold"
              >
                <option value="50.000">Rp 50.000</option>
                <option value="100.000">Rp 100.000</option>
                <option value="150.000">Rp 150.000</option>
                <option value="200.000">Rp 200.000</option>
                <option value="250.000">Rp 250.000</option>
                <option value="300.000">Rp 300.000</option>
                <option value="350.000">Rp 350.000</option>
                <option value="400.000">Rp 400.000</option>
              </Select>
              <p className="text-[11px] text-emerald-700">
                Pengajuan pembelian BBM ini ditangani langsung oleh General Affairs (GA) dan tidak memerlukan persetujuan SPV/ADH.
              </p>
            </div>
          )}
        </div>

        {/* Peruntukan & Tujuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Peruntukan Peminjaman <span className="text-red-500">*</span>
            </label>
            <Select
              required
              value={formData.purpose}
              onChange={e => setFormData({ ...formData, purpose: e.target.value })}
            >
              <option value="Test Drive Pelanggan">Test Drive Pelanggan</option>
              <option value="Movex">Movex</option>
              <option value="Emergency Servis">Emergency Servis</option>
              <option value="Antar Sparepart">Antar Sparepart</option>
              <option value="Kirim Faktur / BPKB/ Dokumen lainnya">Kirim Faktur / BPKB/ Dokumen lainnya</option>
              <option value="Oprasional ke Bank">Oprasional ke Bank</option>
              <option value="Lain-lain / Khusus">Lain-lain / Khusus</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Kota / Lokasi Tujuan <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="Contoh: BSD City, Tangerang"
              value={formData.destination}
              onChange={e => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>
        </div>

        {/* Tanggal Mulai & Estimasi Selesai */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Waktu Mulai Pinjam <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              required
              value={formData.start_date}
              onChange={e => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Estimasi Pengembalian <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              required
              value={formData.end_date}
              onChange={e => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>

        {/* Catatan Tambahan */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <Input
            placeholder="Kondisi fisik, rute khusus, atau kebutuhan supir"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Konfirmasi Peminjaman'}
          </Button>
        </div>

      </form>
    </Modal>
  )
}
