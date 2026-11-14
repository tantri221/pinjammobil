import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { User, Mail, Phone, Briefcase, Lock, Eye, EyeOff, Shield, AlertCircle, Check, Save } from 'lucide-react'

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile
}) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    division: 'Operasional',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (isOpen && currentUser) {
      // Determine clean email (if it's not the internal dummy @pinjammobil.local)
      const isInternalEmail = currentUser.email && currentUser.email.endsWith('@pinjammobil.local')
      const initialEmail = isInternalEmail ? '' : (currentUser.email || '')
      const initialPhone = currentUser.phone || (isInternalEmail ? currentUser.email.replace('@pinjammobil.local', '') : '')

      setFormData({
        name: currentUser.name || '',
        username: currentUser.username || '',
        phone: initialPhone,
        email: initialEmail,
        division: currentUser.division || 'Operasional',
        password: '',
        confirmPassword: ''
      })
      setShowPassword(false)
      setError('')
      setSuccessMsg('')
    }
  }, [isOpen, currentUser])

  if (!currentUser) return null

  const roleLabels = {
    admin: 'Administrator IT',
    ga: 'General Affairs (GA)',
    spv: 'Supervisor (SPV)',
    adh: 'Administration Head (ADH)',
    security: 'Petugas Security',
    staff: 'Staff Operasional'
  }

  const roleBadges = {
    admin: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    ga: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
    spv: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    adh: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    security: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    staff: 'bg-slate-500/20 text-slate-300 border-slate-400/30'
  }

  const initial = (formData.name || currentUser.name || 'U').charAt(0).toUpperCase()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!formData.name.trim()) {
      setError('Nama lengkap tidak boleh kosong.')
      return
    }

    if (!formData.username.trim()) {
      setError('Username login tidak boleh kosong.')
      return
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        setError('Kata sandi baru minimal 6 karakter.')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Konfirmasi kata sandi baru tidak cocok.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        division: formData.division.trim()
      }

      if (formData.password.trim()) {
        payload.password = formData.password.trim()
      }

      const res = await onUpdateProfile(payload)
      if (res?.success) {
        setSuccessMsg('Profil akun Anda berhasil diperbarui!')
        setTimeout(() => {
          onClose()
        }, 1200)
      } else {
        setError(res?.error || 'Gagal memperbarui profil.')
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
      title="Edit Profil Akun"
      description="Perbarui informasi profil dan kata sandi akun Anda"
      maxWidth="max-w-xl"
    >
      <div className="p-6 space-y-5">
        {/* Profile Header Card */}
        <div className="bg-slate-900 rounded-xl p-4 text-white flex items-center gap-4 border border-slate-800 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-sky-600 flex items-center justify-center font-bold text-xl text-white shrink-0 shadow-md border-2 border-sky-400/40">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-white truncate">{formData.name || currentUser.name}</h3>
            <p className="text-xs text-slate-400 truncate">@{formData.username || currentUser.username} • Divisi {formData.division || currentUser.division}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleBadges[currentUser.role] || roleBadges.staff}`}>
                {roleLabels[currentUser.role] || 'Staff Operasional'}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-slate-400" />
                Role Sistem
              </span>
            </div>
          </div>
        </div>

        {/* Error / Success Notifications */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama Lengkap Anda"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">@</span>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Divisi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Divisi / Departemen
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  list="division-profile-options"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  placeholder="Contoh: Operasional, Sales, GA"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <datalist id="division-profile-options">
                  <option value="Operasional" />
                  <option value="General Affairs" />
                  <option value="Sales" />
                  <option value="Marketing" />
                  <option value="Finance & Accounting" />
                  <option value="Human Resources" />
                  <option value="Information Technology" />
                  <option value="Logistik" />
                  <option value="Security" />
                </datalist>
              </div>
            </div>

            {/* Nomor Telepon / WA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email (Opsional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@perusahaan.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section Ganti Password */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Ganti Kata Sandi (Opsional)
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Kosongkan kedua kolom kata sandi jika tidak berniat mengganti password.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
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
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
