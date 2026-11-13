import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Users, Shield, User, Trash2, Check, Power, AlertCircle } from 'lucide-react'

export function UserManagementModal({ 
  isOpen, 
  onClose, 
  currentUser,
  isRegistrationAllowed,
  onToggleRegistration,
  onLoadUsers,
  onUpdateRole,
  onDeleteUser
}) {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTogglingReg, setIsTogglingReg] = useState(false)

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

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin'
    await onUpdateRole(userId, newRole)
    fetchUsers()
  }

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.')
      return
    }
    if (!window.confirm(`Yakin ingin menghapus user "${u.name}" (${u.username})?`)) return
    await onDeleteUser(u.id)
    fetchUsers()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola Pengguna & Pengaturan Registrasi"
      description="Halaman otoritas khusus Administrator IT untuk mengatur akses pengguna."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-xs sm:text-sm">
        
        {/* Registration Toggle Setting Card */}
        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
              <Power className={`h-4 w-4 ${isRegistrationAllowed ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>Status Fitur Registrasi Publik</span>
              <Badge variant={isRegistrationAllowed ? 'success' : 'secondary'} className="text-[10px]">
                {isRegistrationAllowed ? 'AKTIF (DIBUKA)' : 'MATI (DITUTUP)'}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {isRegistrationAllowed 
                ? 'Siapapun dapat mendaftarkan akun baru melalui tombol "Daftar Akun" di halaman login.' 
                : 'Pendaftaran akun baru ditutup. Hanya Admin yang dapat mengelola atau memberikan akun.'}
            </p>
          </div>

          <Button
            size="sm"
            variant={isRegistrationAllowed ? 'destructive' : 'default'}
            disabled={isTogglingReg}
            onClick={handleToggle}
            className="shrink-0 text-xs h-9"
          >
            {isRegistrationAllowed ? 'Tutup Pendaftaran' : 'Buka Pendaftaran'}
          </Button>
        </div>

        {/* User List Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>Daftar Pengguna ({users.length})</span>
            </h4>
          </div>

          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Nama & Username</th>
                    <th className="py-2.5 px-3">Email & Divisi</th>
                    <th className="py-2.5 px-3">Role Akses</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-400 text-xs">
                        {isLoading ? 'Memuat daftar pengguna...' : 'Tidak ada data pengguna.'}
                      </td>
                    </tr>
                  ) : (
                    users.map(u => {
                      const isMe = u.id === currentUser?.id
                      const isAdmin = u.role === 'admin'
                      return (
                        <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-zinc-900 flex items-center gap-1">
                              {u.name}
                              {isMe && (
                                <span className="text-[10px] px-1 rounded bg-zinc-100 text-zinc-600 font-normal">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400">@{u.username}</div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div>{u.email}</div>
                            <div className="text-[11px] text-zinc-400">{u.division}</div>
                          </td>

                          <td className="py-2.5 px-3">
                            <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-[10px]">
                              {isAdmin ? '👑 Admin' : '👤 Staff'}
                            </Badge>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isMe && (
                                <>
                                  <button
                                    onClick={() => handleRoleChange(u.id, u.role)}
                                    className="px-2 py-1 rounded text-[11px] font-medium border border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer"
                                    title="Ubah wewenang role user ini"
                                  >
                                    {isAdmin ? 'Ubah ke Staff' : 'Jadikan Admin'}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(u)}
                                    className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus akun pengguna ini"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
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
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>

      </div>
    </Modal>
  )
}
