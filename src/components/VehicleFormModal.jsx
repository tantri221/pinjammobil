import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input, Select } from './ui/Input'

export function VehicleFormModal({ isOpen, onClose, vehicleToEdit = null, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    classification: 'Kendaraan Oprasional / Aset',
    type: 'MPV',
    status: 'available',
    capacity: 7,
    fuel_level: 100,
    mileage: 0
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (vehicleToEdit) {
      setFormData({
        name: vehicleToEdit.name || '',
        license_plate: vehicleToEdit.license_plate || '',
        classification: vehicleToEdit.classification || 'Kendaraan Oprasional / Aset',
        type: vehicleToEdit.type || 'MPV',
        status: vehicleToEdit.status || 'available',
        capacity: vehicleToEdit.capacity || 7,
        fuel_level: vehicleToEdit.fuel_level ?? 100,
        mileage: vehicleToEdit.mileage ?? 0
      })
    } else {
      setFormData({
        name: '',
        license_plate: '',
        classification: 'Kendaraan Oprasional / Aset',
        type: 'MPV',
        status: 'available',
        capacity: 7,
        fuel_level: 100,
        mileage: 0
      })
    }
  }, [vehicleToEdit, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData, vehicleToEdit ? vehicleToEdit.id : null)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicleToEdit ? "Edit Data Kendaraan" : "Tambah Armada Baru"}
      description="Kelola informasi armada kendaraan operasional kantor."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Nama Kendaraan <span className="text-red-500">*</span>
          </label>
          <Input
            required
            placeholder="Contoh: INNOVA ZENIX HYBRID"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Nomor Polisi <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="Contoh: B 1234 KRO"
              className="uppercase font-mono font-bold"
              value={formData.license_plate}
              onChange={e => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Klasifikasi Kendaraan <span className="text-red-500">*</span>
            </label>
            <Select
              required
              value={formData.classification}
              onChange={e => setFormData({ ...formData, classification: e.target.value })}
              className="font-semibold text-slate-800"
            >
              <option value="Kendaraan Test Drive">Kendaraan Test Drive</option>
              <option value="Kendaraan Oprasional / Aset">Kendaraan Oprasional / Aset</option>
              <option value="Kendaraan AST">Kendaraan AST</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Tipe Kendaraan
            </label>
            <Select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="MPV">MPV</option>
              <option value="SUV">SUV</option>
              <option value="Sedan">Sedan</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Commercial">Commercial / Pick-up</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Status Unit
            </label>
            <Select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="available">Tersedia</option>
              <option value="borrowed">Sedang Dipinjam</option>
              <option value="maintenance">Perawatan/Servis</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Odometer Terkini (KM)
            </label>
            <Input
              type="number"
              min="0"
              value={formData.mileage}
              onChange={e => setFormData({ ...formData, mileage: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Kapasitas Penumpang (Kursi)
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={e => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : (vehicleToEdit ? 'Simpan Perubahan' : 'Tambah Armada')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
