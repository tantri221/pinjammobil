import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input, Select } from './ui/Input'
import { 
  GitBranch, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Wrench,
  UserCheck,
  Building,
  Sliders,
  Check
} from 'lucide-react'

export function VehicleFormModal({ isOpen, onClose, vehicleToEdit = null, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    classification: 'Kendaraan Oprasional / Aset',
    type: 'MPV',
    status: 'available',
    capacity: 7,
    fuel_level: 100,
    mileage: 0,
    approval_flow: {
      ga: true,
      spv: false,
      adh: true
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (vehicleToEdit) {
      let flow = vehicleToEdit.approval_flow
      if (typeof flow === 'string') {
        try { flow = JSON.parse(flow) } catch (e) {}
      }
      if (!flow || typeof flow !== 'object') {
        const isTD = String(vehicleToEdit.classification || '').toLowerCase().includes('test drive')
        flow = { ga: true, spv: isTD, adh: true }
      }

      setFormData({
        name: vehicleToEdit.name || '',
        license_plate: vehicleToEdit.license_plate || '',
        classification: vehicleToEdit.classification || 'Kendaraan Oprasional / Aset',
        type: vehicleToEdit.type || 'MPV',
        status: vehicleToEdit.status || 'available',
        capacity: vehicleToEdit.capacity || 7,
        fuel_level: vehicleToEdit.fuel_level ?? 100,
        mileage: vehicleToEdit.mileage ?? 0,
        approval_flow: {
          ga: flow.ga !== false,
          spv: Boolean(flow.spv),
          adh: flow.adh !== false
        }
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
        mileage: 0,
        approval_flow: {
          ga: true,
          spv: false,
          adh: true
        }
      })
    }
    setValidationError('')
  }, [vehicleToEdit, isOpen])

  // Menangani perubahan klasifikasi secara otomatis menyesuaikan preset awal
  const handleClassificationChange = (newClassification) => {
    const isTestDrive = newClassification.toLowerCase().includes('test drive')
    setFormData(prev => ({
      ...prev,
      classification: newClassification,
      approval_flow: {
        ...prev.approval_flow,
        spv: isTestDrive ? true : prev.approval_flow.spv
      }
    }))
  }

  // Toggle checklist tahapan persetujuan
  const handleToggleStage = (stage) => {
    setValidationError('')
    setFormData(prev => {
      const current = prev.approval_flow || { ga: true, spv: false, adh: true }
      const nextValue = !current[stage]
      
      const gaActive = stage === 'ga' ? nextValue : current.ga
      const spvActive = stage === 'spv' ? nextValue : current.spv
      const adhActive = stage === 'adh' ? nextValue : current.adh

      if (!gaActive && !spvActive && !adhActive) {
        setValidationError('Minimal 1 tahapan verifikasi atau persetujuan harus diaktifkan.')
        return prev
      }

      return {
        ...prev,
        approval_flow: {
          ga: gaActive,
          spv: spvActive,
          adh: adhActive
        }
      }
    })
  }

  // Terapkan pilihan preset cepat
  const applyPreset = (presetKey) => {
    setValidationError('')
    let newFlow = { ga: true, spv: false, adh: true }
    if (presetKey === 'lengkap') {
      newFlow = { ga: true, spv: true, adh: true }
    } else if (presetKey === 'standar') {
      newFlow = { ga: true, spv: false, adh: true }
    } else if (presetKey === 'ga_only') {
      newFlow = { ga: true, spv: false, adh: false }
    } else if (presetKey === 'adh_only') {
      newFlow = { ga: false, spv: false, adh: true }
    }
    setFormData(prev => ({ ...prev, approval_flow: newFlow }))
  }

  // Mengetahui preset mana yang aktif saat ini
  const currentPreset = useMemo(() => {
    const f = formData.approval_flow || {}
    if (f.ga && !f.spv && f.adh) return 'standar'
    if (f.ga && f.spv && f.adh) return 'lengkap'
    if (f.ga && !f.spv && !f.adh) return 'ga_only'
    if (!f.ga && !f.spv && f.adh) return 'adh_only'
    return 'custom'
  }, [formData.approval_flow])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validasi alur persetujuan: tidak boleh kosong semua
    const f = formData.approval_flow || {}
    if (!f.ga && !f.spv && !f.adh) {
      setValidationError('Minimal 1 tahapan verifikasi atau persetujuan harus diaktifkan.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData, vehicleToEdit ? vehicleToEdit.id : null)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const flow = formData.approval_flow || { ga: true, spv: false, adh: true }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicleToEdit ? "Edit Data Kendaraan" : "Tambah Armada Baru"}
      description="Kelola informasi armada kendaraan operasional serta alur verifikasi & persetujuannya."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs sm:text-sm max-h-[78vh] overflow-y-auto">
        
        {/* ============================================================ */}
        {/* 1. INFORMASI UTAMA KENDARAAN */}
        {/* ============================================================ */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            Informasi Unit Armada
          </h4>

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
                onChange={e => handleClassificationChange(e.target.value)}
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
        </div>

        {/* ============================================================ */}
        {/* 2. EDIT ALUR VERIFIKASI & PERSETUJUAN KENDARAAN */}
        {/* ============================================================ */}
        <div className="pt-2 border-t border-slate-200/80 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                Alur Verifikasi & Persetujuan
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Atur tahapan yang wajib dilewati peminjam saat mengajukan peminjaman unit armada ini.
              </p>
            </div>

            {/* Status Preset Saat Ini */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
              {currentPreset === 'standar' && 'Preset: Standar 2-Tahap'}
              {currentPreset === 'lengkap' && 'Preset: Lengkap 3-Tahap'}
              {currentPreset === 'ga_only' && 'Preset: Hanya GA'}
              {currentPreset === 'adh_only' && 'Preset: Hanya ADH'}
              {currentPreset === 'custom' && 'Alur Kustom'}
            </span>
          </div>

          {/* Quick Presets Buttons */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-400" />
              Pilihan Cepat Alur:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => applyPreset('standar')}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer text-center ${
                  currentPreset === 'standar'
                    ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                GA → ADH (Standar)
              </button>

              <button
                type="button"
                onClick={() => applyPreset('lengkap')}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer text-center ${
                  currentPreset === 'lengkap'
                    ? 'bg-teal-50 border-teal-400 text-teal-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                GA → SPV → ADH (Lengkap)
              </button>

              <button
                type="button"
                onClick={() => applyPreset('ga_only')}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer text-center ${
                  currentPreset === 'ga_only'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Hanya GA (Cepat)
              </button>

              <button
                type="button"
                onClick={() => applyPreset('adh_only')}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer text-center ${
                  currentPreset === 'adh_only'
                    ? 'bg-purple-50 border-purple-400 text-purple-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Hanya ADH
              </button>
            </div>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Interactive Stage Checklist Cards */}
          <div className="space-y-2">
            
            {/* 1. TAHAP 1: VERIFIKASI GA */}
            <div 
              onClick={() => handleToggleStage('ga')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                flow.ga
                  ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-200 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={flow.ga}
                  onChange={() => {}} // controlled by parent div onClick
                  className="mt-1 h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      1. Verifikasi General Affairs (GA)
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200">
                      Pemeriksaan Armada
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Pengecekan ketersediaan unit armada, kondisi fisik, dan jadwal pemakaian kendaraan oleh tim General Affairs.
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  flow.ga 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {flow.ga ? <Check className="w-3 h-3 text-emerald-700" /> : null}
                  {flow.ga ? 'Aktif' : 'Dilewati'}
                </span>
              </div>
            </div>

            {/* 2. TAHAP 2: PERSETUJUAN SPV */}
            <div 
              onClick={() => handleToggleStage('spv')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                flow.spv
                  ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-200 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={flow.spv}
                  onChange={() => {}} // controlled by parent div onClick
                  className="mt-1 h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      2. Persetujuan Supervisor (SPV)
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-teal-100 text-teal-800 border border-teal-200">
                      Rekomendasi / Test Drive
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Persetujuan izin dari Supervisor / atasan langsung (diwajibkan untuk unit Test Drive atau armada khusus).
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  flow.spv 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {flow.spv ? <Check className="w-3 h-3 text-emerald-700" /> : null}
                  {flow.spv ? 'Aktif' : 'Dilewati'}
                </span>
              </div>
            </div>

            {/* 3. TAHAP 3: OTORISASI ADH */}
            <div 
              onClick={() => handleToggleStage('adh')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                flow.adh
                  ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-200 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={flow.adh}
                  onChange={() => {}} // controlled by parent div onClick
                  className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      3. Otorisasi Administration Head (ADH)
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      Otorisasi Final
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Persetujuan otorisasi final dari ADH sebelum serah terima kunci kepada peminjam dan security pos keluar.
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  flow.adh 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {flow.adh ? <Check className="w-3 h-3 text-emerald-700" /> : null}
                  {flow.adh ? 'Aktif' : 'Dilewati'}
                </span>
              </div>
            </div>

          </div>

          {/* Live Preview Alur Persetujuan Kendaraan */}
          <div className="p-3 bg-slate-900 rounded-xl text-white space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Simulasi Alur Verifikasi & Persetujuan:
            </span>
            <div className="flex items-center flex-wrap gap-1.5 text-xs">
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-medium">
                Pemohon
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />

              <span className={`px-2 py-1 rounded font-bold ${
                flow.ga 
                  ? 'bg-sky-600 text-white' 
                  : 'bg-slate-800 text-slate-500 line-through'
              }`}>
                1. GA {flow.ga ? '' : '(Bypass)'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />

              <span className={`px-2 py-1 rounded font-bold ${
                flow.spv 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-slate-800 text-slate-500 line-through'
              }`}>
                2. SPV {flow.spv ? '' : '(Bypass)'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />

              <span className={`px-2 py-1 rounded font-bold ${
                flow.adh 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-800 text-slate-500 line-through'
              }`}>
                3. ADH {flow.adh ? '' : '(Bypass)'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />

              <span className="px-2 py-1 rounded bg-emerald-700 text-emerald-100 font-bold">
                Security (Pos Keluar)
              </span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
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
