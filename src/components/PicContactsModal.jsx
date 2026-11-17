import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { 
  PhoneCall, 
  User, 
  Save, 
  Check, 
  AlertCircle, 
  MessageCircle, 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  HelpCircle,
  Sparkles
} from 'lucide-react'

export function PicContactsModal({
  isOpen,
  onClose,
  initialContacts,
  onSaveContacts
}) {
  const [contacts, setContacts] = useState({
    ga: { role: 'ga', title: 'General Affairs (GA)', name: '', phone: '' },
    spv: { role: 'spv', title: 'Supervisor (SPV)', name: '', phone: '' },
    adh: { role: 'adh', title: 'Administration Head (ADH)', name: '', phone: '' }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (isOpen && initialContacts) {
      setContacts({
        ga: { 
          role: 'ga', 
          title: 'General Affairs (GA)', 
          name: initialContacts.ga?.name || 'PIC General Affairs', 
          phone: initialContacts.ga?.phone || '' 
        },
        spv: { 
          role: 'spv', 
          title: 'Supervisor (SPV)', 
          name: initialContacts.spv?.name || 'PIC Supervisor', 
          phone: initialContacts.spv?.phone || '' 
        },
        adh: { 
          role: 'adh', 
          title: 'Administration Head (ADH)', 
          name: initialContacts.adh?.name || 'PIC Administration Head', 
          phone: initialContacts.adh?.phone || '' 
        }
      })
      setError('')
      setSuccessMsg('')
    }
  }, [isOpen, initialContacts])

  const handleChange = (role, field, value) => {
    setContacts(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    setIsSubmitting(true)
    try {
      const res = await onSaveContacts(contacts)
      if (res?.success) {
        setSuccessMsg('Kontak WhatsApp PIC berhasil disimpan!')
        setTimeout(() => {
          onClose()
        }, 1200)
      } else {
        setError(res?.error || 'Gagal menyimpan kontak PIC.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola Kontak WhatsApp PIC Otorisasi"
      description="Atur nama dan nomor WhatsApp PIC untuk follow up proses verifikasi dan persetujuan peminjaman armada"
      maxWidth="max-w-xl"
    >
      <div className="p-6 space-y-5">
        {/* Banner Penjelasan Alur */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold shrink-0 mt-0.5">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>ALUR FOLLOW UP WHATSAPP BERJENJANG</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                Auto-Routing
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Nomor WhatsApp yang didaftarkan di sini akan digunakan oleh tombol <strong>"Follow Up WA"</strong> untuk mengirim pesan pengingat langsung ke PIC yang bertugas pada tahapan verifikasi yang sedang berjalan.
            </p>
          </div>
        </div>

        {/* Notifikasi Error / Sukses */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* PIC 1: General Affairs (GA) */}
          <div className="p-4 rounded-xl border border-indigo-200/90 bg-indigo-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">PIC General Affairs (GA)</h4>
                  <p className="text-[10px] text-slate-500">Tahap 1: Verifikasi awal ketersediaan semua armada</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                Wajib Semua Unit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama PIC GA
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso (GA)"
                    value={contacts.ga.name}
                    onChange={(e) => handleChange('ga', 'name', e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp PIC GA <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <PhoneCall className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-600" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={contacts.ga.phone}
                    onChange={(e) => handleChange('ga', 'phone', e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PIC 2: Supervisor (SPV) */}
          <div className="p-4 rounded-xl border border-teal-200/90 bg-teal-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">PIC Supervisor (SPV)</h4>
                  <p className="text-[10px] text-slate-500">Tahap 2: Persetujuan khusus peminjaman unit Test Drive</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                Khusus Test Drive
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama PIC SPV
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hendra Gunawan (SPV)"
                    value={contacts.spv.name}
                    onChange={(e) => handleChange('spv', 'name', e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp PIC SPV <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <PhoneCall className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-600" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081987654321"
                    value={contacts.spv.phone}
                    onChange={(e) => handleChange('spv', 'phone', e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PIC 3: Administration Head (ADH) */}
          <div className="p-4 rounded-xl border border-purple-200/90 bg-purple-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">PIC Administration Head (ADH)</h4>
                  <p className="text-[10px] text-slate-500">Tahap 3: Otorisasi final sebelum kendaraan dapat keluar</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                Otorisasi Akhir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama PIC ADH
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ibu Rina (ADH)"
                    value={contacts.adh.name}
                    onChange={(e) => handleChange('adh', 'name', e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp PIC ADH <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <PhoneCall className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-600" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081345678901"
                    value={contacts.adh.phone}
                    onChange={(e) => handleChange('adh', 'phone', e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Tips: Nomor dapat dimasukkan dengan awalan 08... atau 628... Sistem akan otomatis menyesuaikan format tautan wa.me.
          </p>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Nomor WA PIC'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
