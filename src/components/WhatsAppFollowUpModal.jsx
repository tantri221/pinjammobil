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
  Clock, 
  AlertCircle, 
  ExternalLink,
  Settings,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  Lock
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
  stage = 'ga', // 'ga' | 'spv' | 'adh'
  picContacts,
  onSendWaFollowUp,
  onOpenEditPicContacts
}) {
  const [customNote, setCustomNote] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Pastikan target stage yang digunakan (default: 'ga')
  const currentStage = stage || 'ga'

  // Data PIC spesifik untuk tahapan ini
  const targetPic = useMemo(() => {
    if (currentStage === 'spv') {
      return {
        stage: 'spv',
        stepNumber: '2',
        roleTitle: 'Supervisor (SPV)',
        stageActionName: 'Persetujuan SPV (Unit Test Drive)',
        name: picContacts?.spv?.name || 'PIC Supervisor',
        phone: picContacts?.spv?.phone || '',
        formattedPhone: formatWhatsAppPhone(picContacts?.spv?.phone)
      }
    }
    if (currentStage === 'adh') {
      return {
        stage: 'adh',
        stepNumber: '3',
        roleTitle: 'Administration Head (ADH)',
        stageActionName: 'Otorisasi Final ADH',
        name: picContacts?.adh?.name || 'PIC Administration Head',
        phone: picContacts?.adh?.phone || '',
        formattedPhone: formatWhatsAppPhone(picContacts?.adh?.phone)
      }
    }
    return {
      stage: 'ga',
      stepNumber: '1',
      roleTitle: 'General Affairs (GA)',
      stageActionName: 'Verifikasi Ketersediaan Armada GA',
      name: picContacts?.ga?.name || 'PIC General Affairs',
      phone: picContacts?.ga?.phone || '',
      formattedPhone: formatWhatsAppPhone(picContacts?.ga?.phone)
    }
  }, [currentStage, picContacts])

  // Cek apakah pesan WA follow up untuk tahapan ini sudah pernah dikirim (Maksimal 1 kali)
  const sentInfo = useMemo(() => {
    if (!loan) return { isSent: false, sentAt: null, sentBy: null }
    const stageApproval = loan.approvals?.[currentStage] || {}
    let sentAt = stageApproval.wa_sent_at || null
    let sentBy = stageApproval.wa_sent_by || null

    if (!sentAt) {
      try {
        const localSent = localStorage.getItem(`pinjammobil_wa_sent_${loan.id}_${currentStage}`)
        if (localSent) {
          sentAt = localSent
          sentBy = 'Sistem Lokal'
        }
      } catch (e) {}
    }

    return {
      isSent: Boolean(sentAt),
      sentAt,
      sentBy
    }
  }, [loan, currentStage])

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

  // Generate teks pesan WhatsApp yang rapi dan profesional khusus untuk PIC ini
  const generatedMessage = useMemo(() => {
    if (!loan) return ''

    const isTD = isTestDriveLoan(loan, loan.vehicles)

    let msg = `*FOLLOW UP VERIFIKASI & PERSETUJUAN PINJAM MOBIL*\n`
    msg += `Sistem Informasi PinjamMobil Operasional\n\n`
    msg += `Halo ${targetPic.name || targetPic.roleTitle},\n`
    msg += `Mohon kesediaannya untuk memproses pengajuan peminjaman kendaraan berikut yang saat ini sedang menunggu *${targetPic.stageActionName}*:\n\n`
    msg += `📋 *Rincian Pengajuan Tiket:*\n`
    msg += `• *Nama Peminjam:* ${loan.borrower_name || '-'} (Divisi ${loan.division || '-'})\n`
    msg += `• *Unit Armada:* ${loan.vehicle_name || 'Mobil'} (${loan.license_plate || '-'})${isTD ? ' [Unit Test Drive]' : ''}\n`
    msg += `• *Peruntukan:* ${loan.purpose || '-'}\n`
    msg += `• *Kota / Tujuan:* ${loan.destination || '-'}\n`
    msg += `• *Jadwal Pakai:* ${formatDate(loan.start_date)} s/d ${formatDate(loan.end_date)}\n`
    
    if (loan.buy_fuel === 'YA') {
      msg += `• *Pengajuan BBM:* YA (Rp ${loan.fuel_amount || '100.000'})\n`
    }

    if (customNote.trim()) {
      msg += `• *Catatan Tambahan:* ${customNote.trim()}\n`
    }

    msg += `\nMohon untuk membuka aplikasi web PinjamMobil dan memproses verifikasi / persetujuan tiket tersebut.\n\n`
    msg += `Terima kasih atas bantuan dan kerjasamanya. 🙏`

    return msg
  }, [loan, targetPic, customNote])

  if (!loan) return null

  const handleExecuteSendWhatsApp = async () => {
    if (sentInfo.isSent) return

    if (!targetPic.formattedPhone) {
      if (onOpenEditPicContacts) {
        onOpenEditPicContacts()
      }
      return
    }

    setIsSending(true)
    try {
      // 1. Catat bahwa WA follow up telah dikirim ke database Supabase (Maksimal 1 kali)
      if (onSendWaFollowUp) {
        await onSendWaFollowUp(loan.id, currentStage)
      }

      // 2. Buka jendela WhatsApp
      const url = `https://api.whatsapp.com/send?phone=${targetPic.formattedPhone}&text=${encodeURIComponent(generatedMessage)}`
      window.open(url, '_blank')

      // 3. Tutup modal setelah jeda singkat
      setTimeout(() => {
        onClose()
      }, 600)
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isTD = isTestDriveLoan(loan, loan.vehicles)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📲 Follow Up WhatsApp: ${targetPic.roleTitle}`}
      description={`Kirim pesan pengingat ke PIC ${targetPic.roleTitle} untuk memproses ${targetPic.stageActionName}`}
      maxWidth="max-w-xl"
    >
      <div className="p-6 space-y-4">
        
        {/* Banner Peringatan jika sudah pernah dikirim (Batas 1 Kali) */}
        {sentInfo.isSent ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-800">
                Pesan Follow Up WhatsApp Sudah Pernah Dikirim (1x)
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Pengingat untuk tahapan ini telah dikirim pada{' '}
                <strong>{formatDate(sentInfo.sentAt)}</strong>
                {sentInfo.sentBy ? ` oleh ${sentInfo.sentBy}` : ''}. Pengiriman WA follow up dibatasi 1 kali saja agar tidak terjadi pengiriman berulang.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Status: Menunggu {targetPic.stageActionName}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300">
              Batas: 1 Kali Kirim
            </span>
          </div>
        )}

        {/* Kartu Informasi PIC Tujuan (Khusus untuk tahapan ini saja, tanpa tab PIC lain) */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Penerima Follow Up • Tahap {targetPic.stepNumber}
                </span>
                <h4 className="text-sm font-bold text-white">{targetPic.name}</h4>
              </div>
            </div>

            {onOpenEditPicContacts && (
              <button
                type="button"
                onClick={onOpenEditPicContacts}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition"
              >
                <Settings className="w-3 h-3" />
                <span>Ubah No WA</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Nomor WhatsApp PIC:</span>
            {targetPic.phone ? (
              <span className="font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                {targetPic.phone}
              </span>
            ) : (
              <span className="text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                Belum Diatur
              </span>
            )}
          </div>
        </div>

        {/* Warning jika nomor WA belum diatur */}
        {!targetPic.phone && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Nomor WhatsApp untuk <strong>{targetPic.roleTitle}</strong> belum diisi.</span>
            </div>
            {onOpenEditPicContacts && (
              <button
                type="button"
                onClick={onOpenEditPicContacts}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer"
              >
                Isi Nomor Sekarang
              </button>
            )}
          </div>
        )}

        {/* Ringkasan Singkat Tiket Peminjaman */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Peminjam:</span>
            <span className="font-bold text-slate-900">{loan.borrower_name} ({loan.division})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Unit Mobil:</span>
            <span className="font-bold text-slate-900">{loan.vehicle_name} ({loan.license_plate}){isTD ? ' [Test Drive]' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Jadwal Pakai:</span>
            <span className="font-medium text-slate-800">{formatDate(loan.start_date)} - {formatDate(loan.end_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Tujuan / Keperluan:</span>
            <span className="font-medium text-slate-800">{loan.destination} ({loan.purpose})</span>
          </div>
        </div>

        {/* Input Catatan Tambahan (Opsional) */}
        {!sentInfo.isSent && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan untuk PIC (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: Dokumen fisik sudah kami lampirkan di meja GA..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        )}

        {/* Preview Pesan WhatsApp */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preview Pesan WhatsApp:</span>
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

          <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-mono whitespace-pre-wrap text-slate-700 max-h-36 overflow-y-auto leading-relaxed select-all">
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
          
          {sentInfo.isSent ? (
            <button
              type="button"
              disabled
              className="px-5 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed border border-slate-300"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Pesan WA Sudah Dikirim (Batas 1 Kali)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecuteSendWhatsApp}
              disabled={isSending || !targetPic.phone}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Memproses...' : `Kirim Pesan WhatsApp (${targetPic.roleTitle.split(' ')[0]})`}</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </button>
          )}
        </div>

      </div>
    </Modal>
  )
}
