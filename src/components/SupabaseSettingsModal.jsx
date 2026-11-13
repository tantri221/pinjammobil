import React, { useState } from 'react'
import { Database, Check, ExternalLink, Copy } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase'

export function SupabaseSettingsModal({ isOpen, onClose, onConfigSaved }) {
  const currentConfig = getSupabaseConfig()
  const [url, setUrl] = useState(currentConfig.url)
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey)
  const [copied, setCopied] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    saveSupabaseConfig(url, anonKey)
    onConfigSaved()
    onClose()
  }

  const handleCopySchema = () => {
    const schemaGuide = `Lihat file 'supabase-schema.sql' di dalam proyek Anda. Salin seluruh kodenya dan tempel di Supabase Dashboard -> SQL Editor -> Run.`
    navigator.clipboard?.writeText(schemaGuide)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfigurasi Database Supabase"
      description="Aplikasi ini 100% menggunakan database cloud PostgreSQL dari Supabase."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        
        {/* Banner Info */}
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-600 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-zinc-900">
            <Database className="h-4 w-4 text-zinc-700" />
            <span>Koneksi Supabase Proyek Anda:</span>
          </div>
          <p className="text-zinc-500">
            Dapatkan Project URL dan Publishable/Anon API Key dari dashboard <a href="https://supabase.com/dashboard/project/dvezfsggwmxbdglfudep" target="_blank" rel="noreferrer" className="text-zinc-900 underline font-medium inline-flex items-center">Supabase Project Settings <ExternalLink className="h-3 w-3 ml-0.5" /></a>
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Project URL
            </label>
            <Input
              type="url"
              required
              placeholder="https://your-project-id.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Publishable / Anon API Key
            </label>
            <Input
              type="text"
              required
              placeholder="sb_publishable_... atau eyJhbGci..."
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" size="sm">
              Simpan & Hubungkan
            </Button>
          </div>
        </form>

        {/* SQL Schema Notice */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Skema Database: <code className="text-[11px] bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-700">supabase-schema.sql</code></span>
          <a 
            href="https://supabase.com/dashboard/project/dvezfsggwmxbdglfudep/sql/new"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-900 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Buka SQL Editor</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

      </div>
    </Modal>
  )
}
