import { createClient } from '@supabase/supabase-js'

const STORAGE_KEY_URL = 'pinjammobil_supabase_url'
const STORAGE_KEY_ANON = 'pinjammobil_supabase_anon_key'

export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const localUrl = localStorage.getItem(STORAGE_KEY_URL)
  const localKey = localStorage.getItem(STORAGE_KEY_ANON)

  const url = localUrl || envUrl || ''
  const anonKey = localKey || envKey || ''

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('your-project-id') &&
    !anonKey.includes('your-anon-key')
  )

  return { url, anonKey, isConfigured }
}

export function saveSupabaseConfig(url, anonKey) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim())
  else localStorage.removeItem(STORAGE_KEY_URL)

  if (anonKey) localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim())
  else localStorage.removeItem(STORAGE_KEY_ANON)
}

let supabaseInstance = null

export function getSupabase() {
  const { url, anonKey, isConfigured } = getSupabaseConfig()
  if (!isConfigured) return null

  if (!supabaseInstance || supabaseInstance.supabaseUrl !== url) {
    supabaseInstance = createClient(url, anonKey)
  }
  return supabaseInstance
}
