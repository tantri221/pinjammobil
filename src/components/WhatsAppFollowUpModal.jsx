import React, { useState, useMemo } from 'react'
import { Modal } from './ui/Modal'
import { 
  MessageCircle, 
  Send, 
  PhoneCall, 
  User, 
  Car, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Settings,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react'
import { isTestDriveLoan } from '../lib/utils'

export function formatWhatsAppPhone(phone) {
  if (!phone) return ''
  let cleaned = String(phone).replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned
  }
  return cleaned
}

export function WhatsAppFollowUpModal({
  isOpen,
  onClose,
  loan,
  picContacts,
  onOpenEditPicContacts
}) {
  const [selectedStage, setSelectedStage] = useState('auto')
  const [customNote, setCustomNote] = useState('')
  const [copied, setCopied] = useState(false)

  // Tentukan tahap yang sedang aktif/menunggu verifikasi
  const activeStageInfo = useMemo(() => {
    if (!loan) return null

    const approvals = loan.approvals || {
      ga: { status: 'pending' },
      spv: { status: 'pending' },
      adh: { status: 'pending' }
    }
    const isTD = isTestDriveLoan(loan, loan.vehicles)

    // 1. GA masih pending
    if (approvals.ga?.status === 'pending') {
      return {
        stage: 'ga',
        label: 'Verifikasi GA',
        roleTitle: 'General Affairs (GA)',
        description: 'Tahap 1: Verifikasi ketersediaan armada',
        contact: picContacts?.ga
      }
    }

    // 2. SPV masih pending (khusus Test Drive)
    if (isTD && approvals.ga?.status === 'approved' && approvals.spv?.status === 'pending') {
      return {
        stage: 'spv',
        label: 'Persetujuan SPV',
        roleTitle: 'Supervisor (SPV)',
        description: 'Tahap 2: Persetujuan peminjaman unit Test Drive',
        contact: picContacts?.spv
      }
    }

    // 3. ADH masih pending (tahap akhir)
    const gaDone = approvals.ga?.status === 'approved'
    const spvDone = !isTD || approvals.spv?.status === 'approved' || approvals.spv?.status === 'not_required'
    if (gaDone && spvDone && approvals.adh?.status === 'pending') {
      return {
        stage: 'adh',
        label: 'Otorisasi ADH',
        roleTitle: 'Administration Head (ADH)',
        description: 'Tahap 3: Otorisasi final peminjaman kendaraan',
        contact: picContacts?.adh
      }
    }

    // Default jika sudah selesai atau lainnya
    return {
      stage: 'ga',
      label: 'Verifikasi GA',
      roleTitle: 'General Affairs (GA)',
      description: 'Tahap 1: Verifikasi armada',
      contact: picContacts?.ga
    }
  }, [loan, picContacts])

  // Tahap yang sedang dipilih pengguna (default mengikuti tahap aktif saat ini)
  const currentTargetStage = selectedStage === 'auto' ? (activeStageInfo?.stage || 'ga') : selectedStage

  const targetPic = useMemo(() => {
    if (currentTargetStage === 'spv') {
      return {
        stage: 'spv',
        roleTitle: 'Supervisor (SPV)',
        name: picContacts?.spv?.name || 'Bapak/Ibu SPV',
        phone: picContacts?.spv?.phone || '',
        formattedPhone: formatWhatsAppPhone(picContacts?.spv?.phone)
      }
    }
    if (currentTargetStage === 'adh') {
      return {
        stage: 'adh',
        roleTitle: 'Administration Head (ADH)',
        name: picContacts?.adh?.name || 'Bapak/Ibu ADH',
        phone: picContacts?.adh?.phone || '',
        formattedPhone: formatWhatsAppPhone(picContacts?.adh?.phone)
      }
    }
    return {
      stage: 'ga',
      roleTitle: 'General Affairs (GA)',
      name: picContacts?.ga?.name || 'Bapak/Ibu GA',
      phone: picContacts?.ga?.phone || '',
      formattedPhone: formatWhatsAppPhone(picContacts?.ga?.phone)
    }
  }, [currentTargetStage, picContacts])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  // Generate template pesan WhatsApp yang rapi dan terstruktur
  const generatedMessage = useMemo(() => {
    if (!loan) return ''

    const isTD = isTestDriveLoan(loan, loan.vehicles)
    const stageName = currentTargetStage === 'ga' 
      ? 'Verifikasi General Affairs (GA)' 
      : currentTargetStage === 'spv' 
        ? 'Persetujuan Supervisor (SPV)' 
        : 'Otorisasi Administration Head (ADH)'

    let msg = `*FOLLOW UP PENGAJUAN PINJAM MOBIL*\n`
    msg += `Sistem PinjamMobil Operasional\n\n`
    msg += `Halo ${targetPic.name || targetPic.roleTitle},\n`
    msg += `Mohon bantuannya untuk memproses pengajuan peminjaman kendaraan berikut yang saat ini sedang menunggu *${stageName}*:\n\n`
    msg += `📋 *Rincian Pengajuan:*\n`
    msg += `• *Peminjam:* ${loan.borrower_name || '-'} (Divisi ${loan.division || '-'})\n`
    msg += `• *Armada:* ${loan.vehicle_name || 'Mobil'} (${loan.license_plate || '-'})${isTD ? ' [Unit Test Drive]' : ''}\n`
    msg += `• *Keperluan:* ${loan.purpose || '-'}\n`
    msg += `• *Tujuan:* ${loan.destination || '-'}\n`
    msg += `• *Jadwal Pakai:* ${formatDate(loan.start_date)} s/d ${formatDate(loan.end_date)}\n`
    
    if (loan.buy_fuel === 'YA') {
      msg += `• *Pengajuan BBM:* YA (Rp ${loan.fuel_amount || '100.000'})\n`
    }

    if (customNote.trim()) {
      msg += `• *Catatan Tambahan:* ${customNote.trim()}\n`
    }

    msg += `\nMohon kesediaannya untuk membuka web aplikasi PinjamMobil dan memproses verifikasi / persetujuan tiket tersebut.\n\n`
    msg += `Terima kasih atas bantuan dan kerjasamanya. 🙏`

    return msg
  }, [loan, targetPic, currentTargetStage, customNote])

  if (!loan) return null

  const handleSendWhatsApp = () => {
    if (!targetPic.formattedPhone) {
      if (onOpenEditPicContacts) {
        onOpenEditPicContacts()
      }
      return
    }

    const url = `https://api.whatsapp.com/send?phone=${targetPic.formattedPhone}&text=${encodeURIComponent(generatedMessage)}`
    window.open(url, '_blank')
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isTD = isTestDriveLoan(loan, loan.vehicles)
  const approvals = loan.approvals || { ga: {}, spv: {}, adh: {} }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📲 Kirim WhatsApp Follow Up Persetujuan"
      description="Kirim pesan pengingat langsung ke nomor WhatsApp PIC sesuai alur verifikasi yang sedang berjalan"
      maxWidth="max-w-2xl"
    >
      <div className="p-6 space-y-5">
        
        {/* Ringkasan Tiket Peminjaman */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-sm space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{loan.borrower_name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">
                Divisi {loan.division}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                <Car className="w-3.5 h-3.5" />
                {loan.vehicle_name} ({loan.license_plate})
              </span>
            </div>
            
            {/* Status Aktif Saat Ini */}
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Sedang Menunggu: {activeStageInfo?.label || 'Verifikasi'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{formatDate(loan.start_date)} s/d {formatDate(loan.end_date)}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{loan.destination} ({loan.purpose})</span>
            </div>
          </div>
        </div>

        {/* Pemilihan PIC Tujuan Sesuai Alur Verifikasi */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Pilih PIC Tujuan Follow Up:</span>
              <span className="text-[10px] font-normal text-slate-500">(Auto-Routing sesuai alur)</span>
            </label>

            {onOpenEditPicContacts && (
              <button
                type="button"
                onClick={onOpenEditPicContacts}
                className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>Atur No WA PIC</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Tab PIC 1: GA */}
            <button
              type="button"
              onClick={() => setSelectedStage('ga')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                currentTargetStage === 'ga'
                  ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded">
                    Tahap 1 • GA
                  </span>
                  {approvals.ga?.status === 'approved' ? (
                    <span className="text-[9px] font-bold text-emerald-700">✓ Selesai</span>
                  ) : approvals.ga?.status === 'rejected' ? (
                    <span className="text-[9px] font-bold text-rose-700">✗ Ditolak</span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-700 animate-pulse">⏳ Menunggu</span>
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 mt-1 truncate">
                  {picContacts?.ga?.name || 'PIC General Affairs'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                  {picContacts?.ga?.phone ? `WA: ${picContacts.ga.phone}` : '⚠️ No WA Belum Diatur'}
                </div>
              </div>
            </button>

            {/* Tab PIC 2: SPV */}
            <button
              type="button"
              onClick={() => setSelectedStage('spv')}
              disabled={!isTD}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                !isTD
                  ? 'opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed'
                  : currentTargetStage === 'spv'
                    ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                    Tahap 2 • SPV
                  </span>
                  {!isTD ? (
                    <span className="text-[9px] text-slate-400">Non-TD</span>
                  ) : approvals.spv?.status === 'approved' ? (
                    <span className="text-[9px] font-bold text-emerald-700">✓ Selesai</span>
                  ) : approvals.spv?.status === 'rejected' ? (
                    <span className="text-[9px] font-bold text-rose-700">✗ Ditolak</span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-700 animate-pulse">⏳ Menunggu</span>
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 mt-1 truncate">
                  {picContacts?.spv?.name || 'PIC Supervisor'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                  {!isTD ? 'Dilewati (Non-TD)' : picContacts?.spv?.phone ? `WA: ${picContacts.spv.phone}` : '⚠️ No WA Belum Diatur'}
                </div>
              </div>
            </button>

            {/* Tab PIC 3: ADH */}
            <button
              type="button"
              onClick={() => setSelectedStage('adh')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                currentTargetStage === 'adh'
                  ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded">
                    Tahap 3 • ADH
                  </span>
                  {approvals.adh?.status === 'approved' ? (
                    <span className="text-[9px] font-bold text-emerald-700">✓ Selesai</span>
                  ) : approvals.adh?.status === 'rejected' ? (
                    <span className="text-[9px] font-bold text-rose-700">✗ Ditolak</span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-700 animate-pulse">⏳ Menunggu</span>
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 mt-1 truncate">
                  {picContacts?.adh?.name || 'PIC Admin Head'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                  {picContacts?.adh?.phone ? `WA: ${picContacts.adh.phone}` : '⚠️ No WA Belum Diatur'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Warning jika nomor WA belum diatur */}
        {!targetPic.phone && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Nomor WhatsApp untuk <strong>{targetPic.roleTitle}</strong> belum diisi.</span>
            </div>
            {onOpenEditPicContacts && (
              <button
                type="button"
                onClick={onOpenEditPicContacts}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer"
              >
                Isi Nomor Sekarang
              </button>
            )}
          </div>
        )}

        {/* Input Catatan Tambahan (Opsional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Tambahan untuk PIC (Opsional):
          </label>
          <input
            type="text"
            placeholder="Contoh: Klien sudah menunggu di lobby, mohon approval segera..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {/* Preview Pesan WhatsApp */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preview Teks Pesan WhatsApp:</span>
            </span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono whitespace-pre-wrap text-slate-700 max-h-40 overflow-y-auto leading-relaxed select-all">
            {generatedMessage}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            Tutup
          </button>
          
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Pesan WhatsApp ({targetPic.roleTitle.split(' ')[0]})</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </button>
        </div>

      </div>
    </Modal>
  )
}
