import React, { useState, useEffect } from 'react'
import { Car, Lock, UserCheck, Shield, Sparkles, Key, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { Input, Select } from './ui/Input'
import { api } from '../services/api'

export function LoginPage({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'register'
  
  // Login form
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Register form
  const [regData, setRegData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    division: 'Sales'
  })

  const [isRegistrationAllowed, setIsRegistrationAllowed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Check registration status from Supabase
    api.getRegistrationStatus().then(status => {
      setIsRegistrationAllowed(status)
    })
  }, [])

  const handleQuickLoginAdmin = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await api.login('admin', 'password123')
      if (res.success) {
        onLoginSuccess(res.user)
      } else {
        setErrorMessage(res.error || 'Gagal login admin.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLoginStaff = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await api.login('staff', 'password123')
      if (res.success) {
        onLoginSuccess(res.user)
      } else {
        setErrorMessage(res.error || 'Gagal login staff.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await api.login(identifier, password)
      if (res.success) {
        onLoginSuccess(res.user)
      } else {
        setErrorMessage(res.error || 'Username atau kata sandi salah.')
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
      const res = await api.register(regData)
      if (res.success) {
        onLoginSuccess(res.user)
      } else {
        setErrorMessage(res.error || 'Gagal mendaftar.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-zinc-900 selection:text-white">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md mb-3">
          <Car className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">PinjamMobil</h1>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Sistem Informasi & Peminjaman Kendaraan Operasional Kantor. Masuk untuk mengakses aplikasi.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-zinc-200/80">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-200 px-6 pt-4">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'login'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <span>Daftar Akun</span>
              {!isRegistrationAllowed && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-500 font-normal">
                  Tutup
                </span>
              )}
            </button>
          </div>

          <CardContent className="p-6 pt-5">
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB: LOGIN */}
            {activeTab === 'login' && (
              <div className="space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Username atau Email
                    </label>
                    <Input
                      required
                      placeholder="Masukkan username atau email"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-xs h-10 mt-1" disabled={isLoading}>
                    {isLoading ? 'Memeriksa Kredensial...' : 'Masuk ke Sistem'}
                  </Button>
                </form>

                {/* Quick 1-Click Access Buttons */}
                <div className="pt-4 border-t border-zinc-100">
                  <div className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Akses Cepat Sekali Klik:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Admin 1-Click */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleQuickLoginAdmin}
                      className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/90 text-left transition-all group cursor-pointer hover:border-zinc-300 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-zinc-900 flex items-center gap-1">
                          👑 Login Admin
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-white font-semibold">
                          1-Klik
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">admin / password123</div>
                    </button>

                    {/* Staff 1-Click */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleQuickLoginStaff}
                      className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/90 text-left transition-all group cursor-pointer hover:border-zinc-300 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-zinc-900 flex items-center gap-1">
                          👤 Login Staff
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-semibold">
                          1-Klik
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">staff / password123</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REGISTER */}
            {activeTab === 'register' && (
              <div>
                {!isRegistrationAllowed ? (
                  <div className="py-6 px-4 text-center space-y-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <div className="h-10 w-10 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-800 text-sm">Pendaftaran Akun Ditutup</h4>
                      <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                        Pendaftaran akun baru saat ini <strong>dinonaktifkan</strong> oleh Administrator untuk keamanan kantor.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-600">
                      Silakan masuk menggunakan akun <strong>Admin</strong> atau <strong>Staff</strong> yang sudah disediakan.
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveTab('login')}
                      className="mt-1 text-xs"
                    >
                      Kembali ke Menu Login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Pendaftaran dibuka oleh Admin. Role baru: <strong>Staff</strong>.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        placeholder="Contoh: Rian Pratama"
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
                          placeholder="rianp"
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
                        placeholder="rian@kantor.com"
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

                    <Button type="submit" className="w-full text-xs h-10 mt-2" disabled={isLoading}>
                      {isLoading ? 'Mendaftarkan...' : 'Daftar Akun Baru'}
                    </Button>
                  </form>
                )}
              </div>
            )}

          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-zinc-400 mt-4">
          © {new Date().getFullYear()} PinjamMobil • Dilindungi Otentikasi Supabase
        </p>
      </div>
    </div>
  )
}
