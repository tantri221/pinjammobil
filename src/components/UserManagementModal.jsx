import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Users, Shield, User, Trash2, Edit3, Power, Key, Sparkles, Check, AlertCircle, UserPlus } from 'lucide-react'

export function UserManagementModal({ 
  isOpen, 
  onClose, 
  currentUser,
  isRegistrationAllowed,
  onToggleRegistration,
  onLoadUsers,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}) {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTogglingReg, setIsTogglingReg] = useState(false)

  // Add user state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const initialAddFormData = {
    name: '',
    username: '',
    phone: '',
    division: 'Sales',
    role: 'staff',
    password: 'password123'
  }
  const [addFormData, setAddFormData] = useState(initialAddFormData)
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)
  const [addError, setAddError] = useState('')

  // Edit user state
  const [editingUser, setEditingUser] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    phone: '',
    division: 'Sales',
    role: 'staff',
    password: ''
  })
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await onLoadUsers()
      setUsers(res.data || [])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      setEditingUser(null)
      setIsAddModalOpen(false)
    }
  }, [isOpen])

  const handleToggle = async () => {
    setIsTogglingReg(true)
    try {
      await onToggleRegistration(!isRegistrationAllowed)
    } finally {
      setIsTogglingReg(false)
    }
  }

  const handleOpenAdd = () => {
    setAddFormData(initialAddFormData)
    setAddError('')
    setIsAddModalOpen(true)
  }

  const handleSaveAdd = async (e) => {
    e.preventDefault()
    setIsSubmittingAdd(true)
    setAddError('')
    try {
      const res = await onCreateUser(addFormData)
      if (res.success) {
        setIsAddModalOpen(false)
        fetchUsers()
      } else {
        setAddError(res.error || 'Gagal menambahkan akun pengguna.')
      }
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  const handleOpenEdit = (u) => {
    setEditingUser(u)
    const userPhone = u.phone || (u.email && u.email.endsWith('@pinjammobil.local') ? u.email.replace('@pinjammobil.local', '') : (u.displayContact || u.email || ''))
    setEditFormData({
      name: u.name || '',
      username: u.username || '',
      phone: userPhone,
      division: u.division || 'Sales',
      role: u.role || 'staff',
      password: ''
    })
    setEditError('')
  }

  const handleSetDefaultPassword = () => {
    setEditFormData(prev => ({ ...prev, password: 'password123' }))
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingUser) return
    setIsSubmittingEdit(true)
    setEditError('')
    try {
      const res = await onUpdateUser(editingUser.id, editFormData)
      if (res.success) {
        setEditingUser(null)
        fetchUsers()
      } else {
        setEditError(res.error || 'Gagal memperbarui pengguna.')
      }
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.')
      return
    }
    if (!window.confirm(`Yakin ingin menghapus user "${u.name}" (@${u.username})?`)) return
    await onDeleteUser(u.id)
    fetchUsers()
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Kelola Pengguna & Registrasi"
        description="Otoritas Administrator IT untuk mengubah akun pengguna dan pengaturan pendaftaran."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 text-xs sm:text-sm">
          
          {/* Card Pengaturan Status Registrasi Publik */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <Power className={`h-4 w-4 ${isRegistrationAllowed ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Status Fitur Registrasi Publik</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isRegistrationAllowed 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {isRegistrationAllowed ? 'AKTIF (DIBUKA)' : 'MATI (DITUTUP)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isRegistrationAllowed 
                  ? 'Siapapun dapat mendaftarkan akun baru melalui menu "Daftar Akun" di halaman login.' 
                  : 'Pendaftaran ditutup. Hanya Admin yang dapat mengelola atau memberikan akun user.'}
              </p>
            </div>

            <button
              disabled={isTogglingReg}
              onClick={handleToggle}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 ${
                isRegistrationAllowed 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isRegistrationAllowed ? 'Tutup Pendaftaran' : 'Buka Pendaftaran'}
            </button>
          </div>

          {/* Daftar Pengguna */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-sky-600" />
                <span>Daftar Akun Pengguna ({users.length})</span>
              </h4>
              <button
                onClick={handleOpenAdd}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Tambah Akun User</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-3.5">Nama & Username</th>
                      <th className="py-3 px-3.5">Kontak & Divisi</th>
                      <th className="py-3 px-3.5">Wewenang Role</th>
                      <th className="py-3 px-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-medium">
                          {isLoading ? 'Memuat daftar pengguna...' : 'Tidak ada data pengguna.'}
                        </td>
                      </tr>
                    ) : (
                      users.map(u => {
                        const isMe = u.id === currentUser?.id
                        const isAdmin = u.role === 'admin'
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isMe && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 border border-sky-200">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">@{u.username}</div>
                            </td>

                            <td className="py-3 px-3.5">
                              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                                {u.phone ? (
                                  <span className="font-mono text-sky-800">📱 {u.phone}</span>
                                ) : u.displayContact ? (
                                  <span className="font-mono text-slate-800">
                                    {u.displayContact.startsWith('08') || u.displayContact.startsWith('+') ? `📱 ${u.displayContact}` : `✉️ ${u.displayContact}`}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">{u.email}</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">Divisi {u.division}</div>
                            </td>

                            <td className="py-3 px-3.5">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isAdmin 
                                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                                  : 'bg-sky-50 text-sky-700 border-sky-300'
                              }`}>
                                {isAdmin ? '👑 Admin' : '👤 Staff'}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Tombol Edit Akun */}
                                <button
                                  onClick={() => handleOpenEdit(u)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition flex items-center gap-1 cursor-pointer"
                                  title="Edit data akun pengguna ini"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>

                                {/* Tombol Hapus User */}
                                {!isMe && (
                                  <button
                                    onClick={() => handleDelete(u)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                    title="Hapus akun pengguna"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>

        </div>
      </Modal>

      {/* DIALOG POPUP: EDIT AKUN PENGGUNA (STYLE LEGACY) */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="🔑 Edit Data Akun Pengguna"
        description="Otoritas Administrator IT untuk mengubah profil, wewenang role, atau reset password user."
        maxWidth="max-w-md"
      >
        {editingUser && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
            
            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editFormData.name}
                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.username}
                  onChange={e => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Divisi
                </label>
                <select
                  value={editFormData.division}
                  onChange={e => setEditFormData({ ...editFormData, division: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:border-sky-500 outline-none"
                >
                  <option value="Sales">Sales</option>
                  <option value="Admin">Admin</option>
                  <option value="Servis">Servis</option>
                  <option value="IT Support">IT Support</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Manajemen">Manajemen / Direksi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor HP / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={editFormData.phone}
                onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Role / Wewenang
              </label>
              <select
                value={editFormData.role}
                onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:border-sky-500 outline-none font-bold"
              >
                <option value="staff">👤 Staff / Peminjam</option>
                <option value="admin">👑 Administrator IT</option>
              </select>
            </div>

            {/* Reset Password Field */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Reset Kata Sandi Baru (Opsional)
                </label>
                <button
                  type="button"
                  onClick={handleSetDefaultPassword}
                  className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
                >
                  ⚡ Set Default (password123)
                </button>
              </div>
              <input
                type="text"
                placeholder="Kosongkan jika tidak ingin mengubah sandi"
                value={editFormData.password}
                onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Isi kolom ini hanya jika user lupa kata sandi atau ingin di-reset.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={isSubmittingEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition cursor-pointer"
              >
                {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan Akun'}
              </button>
            </div>

          </form>
        )}
      </Modal>

      {/* DIALOG POPUP: TAMBAH AKUN PENGGUNA BARU */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="➕ Tambah Akun Pengguna Baru"
        description="Administrator dapat membuatkan akun user Staff maupun Admin secara langsung."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs sm:text-sm">
          {addError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={addFormData.name}
              onChange={e => setAddFormData({ ...addFormData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="budi_s"
                value={addFormData.username}
                onChange={e => setAddFormData({ ...addFormData, username: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Divisi
              </label>
              <select
                value={addFormData.division}
                onChange={e => setAddFormData({ ...addFormData, division: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:border-sky-500 outline-none"
              >
                <option value="Sales">Sales</option>
                <option value="Admin">Admin</option>
                <option value="Servis">Servis</option>
                <option value="IT Support">IT Support</option>
                <option value="Operasional">Operasional</option>
                <option value="Manajemen">Manajemen / Direksi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor HP / WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="Contoh: 081234567890"
              value={addFormData.phone}
              onChange={e => setAddFormData({ ...addFormData, phone: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Role / Wewenang
            </label>
            <select
              value={addFormData.role}
              onChange={e => setAddFormData({ ...addFormData, role: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:border-sky-500 outline-none font-bold"
            >
              <option value="staff">👤 Staff / Peminjam</option>
              <option value="admin">👑 Administrator IT</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Kata Sandi Awal <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAddFormData(prev => ({ ...prev, password: 'password123' }))}
                className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
              >
                ⚡ Default (password123)
              </button>
            </div>
            <input
              type="text"
              required
              value={addFormData.password}
              onChange={e => setAddFormData({ ...addFormData, password: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-sky-500 outline-none font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Kata sandi awal yang diberikan ke pengguna untuk login pertama kali.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmittingAdd}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingAdd}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition cursor-pointer"
            >
              {isSubmittingAdd ? 'Menambahkan...' : 'Tambah Akun'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
