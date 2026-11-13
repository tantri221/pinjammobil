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
