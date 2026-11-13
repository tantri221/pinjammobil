import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input, Select } from './ui/Input'
import { Lock, UserCheck, ShieldAlert, Key, User, Mail, Sparkles } from 'lucide-react'

export function AuthModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  isRegistrationAllowed = false,
  onLogin, 
  onRegister 
}) {
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'register'
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Register form state
  const [regData, setRegData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    division: 'Sales'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('')
    }
  }, [isOpen, activeTab])

  const handleQuickFill = (u, p) => {
    setLoginIdentifier(u)
    setLoginPassword(p)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await onLogin(loginIdentifier, loginPassword)
      if (res.success) {
        onLoginSuccess(res.user)
        onClose()
      } else {
        setErrorMessage(res.error || 'Username atau password salah.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await onRegister(regData)
      if (res.success) {
        onLoginSuccess(res.user)
        onClose()
      } else {
        setErrorMessage(res.error || 'Gagal mendaftar.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Akun Pengguna"
      description="Masuk untuk meminjam mobil atau mengelola armada kendaraan."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        
        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <span>Daftar Akun</span>
            {!isRegistrationAllowed && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-100 text-zinc-500 font-normal">
                Nonaktif
              </span>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMessage}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Username atau Email
              </label>
              <Input
                required
                placeholder="admin atau admin@pinjammobil.com"
                value={loginIdentifier}
                onChange={e => setLoginIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Kata Sandi
              </label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
            </div>

            {/* Quick Fill Default Users Helper */}
            <div className="pt-1">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1.5 font-medium">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Pilihan Akun Cepat (Bawaan):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'password123')}
                  className="p-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left text-xs transition-colors cursor-pointer"
                >
                  <div className="font-bold text-zinc-800 flex items-center gap-1">
                    👑 Role Admin
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">admin / password123</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('staff', 'password123')}
                  className="p-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left text-xs transition-colors cursor-pointer"
                >
                  <div className="font-bold text-zinc-800 flex items-center gap-1">
                    👤 Role Staff
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">staff / password123</div>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex justify-end">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Memeriksa...' : 'Masuk ke Aplikasi'}
              </Button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <div>
            {!isRegistrationAllowed ? (
              <div className="py-6 px-4 text-center space-y-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="h-10 w-10 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800 text-sm">Pendaftaran Ditutup</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                    Secara default, pendaftaran akun baru dinonaktifkan oleh Administrator untuk keamanan kantor.
                  </p>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Silakan login dengan akun <strong>Admin</strong> untuk mengaktifkan fitur registrasi ini di menu Pengaturan Pengguna.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActiveTab('login')}
                  className="mt-2 text-xs"
                >
                  Kembali ke Halaman Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>Pendaftaran dibuka oleh Admin. Akun baru akan memiliki role <strong>Staff</strong>.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="Contoh: Ahmad Fauzi"
                    value={regData.name}
                    onChange={e => setRegData({ ...regData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="ahmadf"
                      value={regData.username}
                      onChange={e => setRegData({ ...regData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Divisi
                    </label>
                    <Select
                      value={regData.division}
                      onChange={e => setRegData({ ...regData, division: e.target.value })}
                    >
                      <option value="Sales">Sales</option>
                      <option value="Admin">Admin</option>
                      <option value="Servis">Servis</option>
                      <option value="IT Support">IT Support</option>
                      <option value="Operasional">Operasional</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Email Kantor <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="ahmad@kantor.com"
                    value={regData.email}
                    onChange={e => setRegData({ ...regData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={regData.password}
                    onChange={e => setRegData({ ...regData, password: e.target.value })}
                  />
                </div>

                <div className="pt-2 border-t border-zinc-100 flex justify-end">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Mendaftarkan...' : 'Daftar Akun Baru'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </Modal>
  )
}
