import React, { useState, useEffect } from 'react'
import { Lock, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react'
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
    api.getRegistrationStatus().then(status => {
      setIsRegistrationAllowed(status)
    })
  }, [])

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
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-sky-600 selection:text-white">
      
      {/* Box Dialog Login (Persis Gaya Legacy) */}
      <div className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
        
        {/* Header Biru Gelap / Slate-900 (Identitas Asli Legacy) */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center gap-3.5 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-2xl shrink-0">
            🚗
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
              Sistem Operasional Kantor
            </span>
            <h1 className="text-base font-bold text-white mt-1 leading-snug">
              Aplikasi Peminjaman Kendaraan
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Silakan masuk dengan akun resmi Anda
            </p>
          </div>
        </div>

        {/* Body Form Putih */}
        <div className="bg-white p-6 sm:p-7">
          
          {/* Tab Masuk vs Daftar */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'login'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>Daftar Akun</span>
              {!isRegistrationAllowed && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                  Tutup
                </span>
              )}
            </button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username atau Email
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masukkan username atau email Anda"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi Anda"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-sm cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Memeriksa Kredensial...' : 'Masuk ke Aplikasi'}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <div>
              {!isRegistrationAllowed ? (
                <div className="py-6 px-4 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="h-10 w-10 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Pendaftaran Akun Ditutup</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Pendaftaran akun baru saat ini dinonaktifkan oleh Administrator untuk keamanan operasional kantor.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600">
                    Silakan hubungi Administrator IT untuk mendapatkan akun Anda.
                  </div>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="mt-1 text-xs text-sky-600 font-bold hover:underline cursor-pointer"
                  >
                    Kembali ke Menu Login →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Pendaftaran dibuka oleh Admin. Role baru: <strong>Staff</strong>.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Fauzi"
                      value={regData.name}
                      onChange={e => setRegData({ ...regData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ahmadf"
                        value={regData.username}
                        onChange={e => setRegData({ ...regData, username: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Divisi
                      </label>
                      <select
                        value={regData.division}
                        onChange={e => setRegData({ ...regData, division: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:border-sky-500 outline-none"
                      >
                        <option value="Sales">Sales</option>
                        <option value="Admin">Admin</option>
                        <option value="Servis">Servis</option>
                        <option value="IT Support">IT Support</option>
                        <option value="Operasional">Operasional</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Kantor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ahmad@kantor.com"
                      value={regData.email}
                      onChange={e => setRegData({ ...regData, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kata Sandi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={regData.password}
                      onChange={e => setRegData({ ...regData, password: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-sm cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isLoading ? 'Mendaftarkan...' : 'Daftar Akun Baru'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4">
        © {new Date().getFullYear()} Aplikasi Peminjaman Kendaraan Operasional • Supabase Cloud
      </p>

    </div>
  )
}
