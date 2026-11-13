import React, { useState } from 'react'
import { Database, Check, AlertCircle, Copy, ExternalLink } from 'lucide-react'
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

  const handleResetToDemo = () => {
    saveSupabaseConfig('', '')
    setUrl('')
    setAnonKey('')
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
      title="Konfigurasi Koneksi Database Supabase"
      description="Hubungkan aplikasi ini secara langsung ke database PostgreSQL Supabase Anda."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        
        {/* Banner Info */}
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-600 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-zinc-900">
            <Database className="h-4 w-4 text-zinc-700" />
            <span>Cara Mendapatkan Kunci Supabase:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-zinc-500 pl-1">
            <li>Buka dashboard proyek Anda di <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-zinc-900 underline font-medium inline-flex items-center">supabase.com <ExternalLink className="h-3 w-3 ml-0.5" /></a></li>
            <li>Pilih menu <strong>Project Settings → API</strong>.</li>
            <li>Salin <strong>Project URL</strong> dan <strong>anon/public API Key</strong>.</li>
          </ol>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Project URL
            </label>
            <Input
              type="url"
              placeholder="https://your-project-id.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Anon / Public API Key
            </label>
            <Input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-zinc-100">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={handleResetToDemo}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              Reset ke Demo Mode (Lokal)
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Tutup
              </Button>
              <Button type="submit" size="sm">
                Simpan & Hubungkan
              </Button>
            </div>
          </div>
        </form>

        {/* SQL Schema Notice */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Skema Database: <code className="text-[11px] bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-700">supabase-schema.sql</code></span>
          <button 
            type="button" 
            onClick={handleCopySchema}
            className="text-zinc-700 hover:text-zinc-950 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Tersalin' : 'Info SQL'}
          </button>
        </div>

      </div>
    </Modal>
  )
}
