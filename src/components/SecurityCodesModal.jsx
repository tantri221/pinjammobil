import React, { useState, useEffect } from 'react'
import { 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  AlertCircle, 
  Save, 
  Clock, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Lock
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { api } from '../services/api'

const DEFAULT_CODES = [
  { id: 1, slot: 'Security 1', name: 'Petugas Security 1', code: '1111', shift: 'Shift Pagi (07:00 - 15:00)', isActive: true },
  { id: 2, slot: 'Security 2', name: 'Petugas Security 2', code: '2222', shift: 'Shift Pagi (07:00 - 15:00)', isActive: true },
  { id: 3, slot: 'Security 3', name: 'Petugas Security 3', code: '3333', shift: 'Shift Sore (15:00 - 23:00)', isActive: true },
  { id: 4, slot: 'Security 4', name: 'Petugas Security 4', code: '4444', shift: 'Shift Sore (15:00 - 23:00)', isActive: true },
  { id: 5, slot: 'Security 5', name: 'Petugas Security 5', code: '5555', shift: 'Shift Malam (23:00 - 07:00)', isActive: true },
  { id: 6, slot: 'Security 6', name: 'Petugas Security 6', code: '6666', shift: 'Shift Malam (23:00 - 07:00)', isActive: true },
]

export function SecurityCodesModal({ isOpen, onClose, onSaved }) {
  const [codes, setCodes] = useState(DEFAULT_CODES)
  const [showCodes, setShowCodes] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadCodes()
    }
  }, [isOpen])

  const loadCodes = async () => {
    setIsLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const data = await api.getSecurityCodes()
      if (Array.isArray(data) && data.length === 6) {
        setCodes(data)
      } else {
        setCodes(DEFAULT_CODES)
      }
    } catch (err) {
      console.error(err)
      setError('Gagal memuat kode security.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleShowCode = (id) => {
    setShowCodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleChangeField = (id, field, value) => {
    setCodes(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const handleGenerateRandomCode = (id) => {
    // Generate 4-digit numeric code
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString()
    handleChangeField(id, 'code', randomPin)
    // Otomatis perlihatkan kodenya agar admin tahu
    setShowCodes(prev => ({ ...prev, [id]: true }))
  }

  const handleResetDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh kode 6 security kembali ke pengaturan awal pabrik?')) {
      setCodes(DEFAULT_CODES)
      setShowCodes({})
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    // Validasi semua 6 slot memiliki nama dan kode
    for (let i = 0; i < codes.length; i++) {
      const item = codes[i]
      if (!item.name || !item.name.trim()) {
        setError(`Nama petugas untuk ${item.slot} tidak boleh kosong.`)
        return
      }
      if (!item.code || !item.code.trim()) {
        setError(`Kode security untuk ${item.slot} tidak boleh kosong.`)
        return
      }
      if (item.code.trim().length < 3) {
        setError(`Kode security untuk ${item.slot} minimal 3 karakter/angka.`)
        return
      }
    }

    setIsSaving(true)
    try {
      const res = await api.saveSecurityCodes(codes)
      if (res.success) {
        setSuccessMsg('Kode 6 Security berhasil disimpan!')
        if (onSaved) onSaved(codes)
        setTimeout(() => {
          onClose()
        }, 1200)
      } else {
        setError(res.error || 'Gagal menyimpan kode security.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola Kode Security (6 Petugas / Pos)"
      description="Atur nama petugas, kode PIN otorisasi pintu keluar-masuk, dan regu jaga untuk 6 security."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Info Banner */}
        <div className="p-3 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center gap-2">
                <span>Otoritas 6 Kode Security</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  {codes.filter(c => c.isActive).length} Pos Aktif
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Kode ini digunakan oleh petugas saat melakukan konfirmasi <strong>Mobil Keluar</strong> & <strong>Mobil Kembali</strong> di pos gerbang.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefault}
            className="text-[11px] font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Reset ke kode awal (1111 s/d 6666)"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
        </div>

        {/* Notifikasi Error / Sukses */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 6 Grid Kartu Security */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {codes.map((item, idx) => {
            const isVisible = Boolean(showCodes[item.id])

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition shadow-xs space-y-2.5 ${
                  item.isActive 
                    ? 'bg-white border-slate-200 hover:border-slate-300' 
                    : 'bg-slate-50 border-slate-200/60 opacity-60'
                }`}
              >
                {/* Header Slot Security */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                      #{item.id}
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      {item.slot}
                    </span>
                  </div>

                  {/* Toggle Aktif / Nonaktif */}
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={e => handleChangeField(item.id, 'isActive', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{item.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </label>
                </div>

                {/* Input Nama Petugas */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Nama Petugas / Identitas
                  </label>
                  <input
                    type="text"
                    required
                    value={item.name}
                    onChange={e => handleChangeField(item.id, 'name', e.target.value)}
                    placeholder={`Nama ${item.slot}`}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold focus:border-sky-500 outline-none"
                  />
                </div>

                {/* Input Kode Security PIN */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Lock className="h-3 w-3 text-slate-400" />
                      <span>Kode Security / PIN</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleGenerateRandomCode(item.id)}
                      className="text-[10px] text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
                      title="Buat PIN acak 4 digit"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Acak PIN</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      required
                      value={item.code}
                      onChange={e => handleChangeField(item.id, 'code', e.target.value)}
                      placeholder="Contoh: 1234"
                      className="w-full pl-2.5 pr-8 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold tracking-wider focus:border-sky-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleShowCode(item.id)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={isVisible ? 'Sembunyikan kode' : 'Lihat kode'}
                    >
                      {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Input Regu / Shift Jaga */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Regu / Shift Jaga
                  </label>
                  <select
                    value={item.shift}
                    onChange={e => handleChangeField(item.id, 'shift', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 outline-none font-medium"
                  >
                    <option value="Shift Pagi (07:00 - 15:00)">🌅 Shift Pagi (07:00 - 15:00)</option>
                    <option value="Shift Sore (15:00 - 23:00)">🌇 Shift Sore (15:00 - 23:00)</option>
                    <option value="Shift Malam (23:00 - 07:00)">🌙 Shift Malam (23:00 - 07:00)</option>
                    <option value="Shift Fleksibel / Semua Waktu">🕒 Shift Fleksibel / 24 Jam</option>
                  </select>
                </div>

              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400">
            Total 6 Slot Security Pos Gerbang
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}</span>
            </button>
          </div>
        </div>

      </form>
    </Modal>
  )
}
