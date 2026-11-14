import React, { useState, useEffect } from 'react'
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Save, 
  CheckCircle2, 
  RotateCcw,
  Sparkles
} from 'lucide-react'
import { Modal } from './ui/Modal'
import { api } from '../services/api'

const DEFAULT_CODES = [
  { id: 1, slot: 'Security 1', name: 'Security 1', code: '1111' },
  { id: 2, slot: 'Security 2', name: 'Security 2', code: '2222' },
  { id: 3, slot: 'Security 3', name: 'Security 3', code: '3333' },
  { id: 4, slot: 'Security 4', name: 'Security 4', code: '4444' },
  { id: 5, slot: 'Security 5', name: 'Security 5', code: '5555' },
  { id: 6, slot: 'Security 6', name: 'Security 6', code: '6666' },
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
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString()
    handleChangeField(id, 'code', randomPin)
    setShowCodes(prev => ({ ...prev, [id]: true }))
  }

  const handleResetDefault = () => {
    if (window.confirm('Reset seluruh nama dan kode 6 security kembali ke pengaturan awal (1111 - 6666)?')) {
      setCodes(DEFAULT_CODES)
      setShowCodes({})
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    // Validasi semua 6 security terisi
    for (let i = 0; i < codes.length; i++) {
      const item = codes[i]
      if (!item.name || !item.name.trim()) {
        setError(`Nama untuk Security ${item.id} tidak boleh kosong.`)
        return
      }
      if (!item.code || !item.code.trim()) {
        setError(`Kode unik untuk Security ${item.id} tidak boleh kosong.`)
        return
      }
      if (item.code.trim().length < 3) {
        setError(`Kode unik untuk Security ${item.id} minimal 3 karakter/angka.`)
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
        }, 1000)
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
      title="Kelola Kode Security"
      description="Atur nama dan kode unik untuk 6 orang petugas security."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Info Ringkas */}
        <div className="p-3 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">
                Daftar 6 Petugas Security
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Kode unik digunakan security saat konfirmasi <strong>Mobil Keluar</strong> & <strong>Mobil Kembali</strong> di pos gerbang.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefault}
            className="text-[11px] font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Reset ke kode awal (1111 - 6666)"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Awal</span>
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

        {/* Header Tabel Mini (Khusus Tampilan Desktop) */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Pos Security</div>
          <div className="col-span-5">Nama Security</div>
          <div className="col-span-4">Kode Unik (PIN)</div>
        </div>

        {/* 6 Baris Petugas Security */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {codes.map((item) => {
            const isVisible = Boolean(showCodes[item.id])

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-2 sm:gap-3"
              >
                {/* Pos Security */}
                <div className="sm:col-span-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                    #{item.id}
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {item.slot || `Security ${item.id}`}
                  </span>
                </div>

                {/* Input Nama Security */}
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase sm:hidden mb-0.5">
                    Nama Security
                  </label>
                  <input
                    type="text"
                    required
                    value={item.name}
                    onChange={e => handleChangeField(item.id, 'name', e.target.value)}
                    placeholder={`Nama Security ${item.id}`}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:border-sky-500 outline-none"
                  />
                </div>

                {/* Input Kode Unik */}
                <div className="sm:col-span-4">
                  <div className="flex items-center justify-between sm:hidden mb-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Kode Unik
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGenerateRandomCode(item.id)}
                      className="text-[10px] text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Acak</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      required
                      value={item.code}
                      onChange={e => handleChangeField(item.id, 'code', e.target.value)}
                      placeholder="Kode Unik"
                      className="w-full pl-2.5 pr-8 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold tracking-wider text-slate-900 focus:border-sky-500 outline-none"
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

              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400">
            Total 6 Petugas Security
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
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Kode Security'}</span>
            </button>
          </div>
        </div>

      </form>
    </Modal>
  )
}
