import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys for local fallback
const STORAGE_KEY_URL = 'vf_supabase_url';
const STORAGE_KEY_ANON_KEY = 'vf_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'none';
}

/**
 * Resolves Supabase URL and Anon Key from environment variables or localStorage
 */
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  // Valid environment configuration
  if (envUrl && envKey && !envUrl.includes('your-project') && !envKey.includes('your-anon-key')) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  // Fallback to locally saved credentials (entered via UI)
  const storedUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
  const storedKey = (localStorage.getItem(STORAGE_KEY_ANON_KEY) || '').trim();

  if (storedUrl && storedKey) {
    return {
      url: storedUrl,
      anonKey: storedKey,
      isConfigured: true,
      source: 'storage',
    };
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
}

/**
 * Returns a singleton instance of the Supabase Client
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (cachedClient && lastUsedUrl === config.url && lastUsedKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    lastUsedUrl = config.url;
    lastUsedKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Saves Supabase credentials locally for instant UI connection
 */
export function saveSupabaseCredentials(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_ANON_KEY, anonKey.trim());
  cachedClient = null; // force re-instantiation
}

/**
 * Disconnects Supabase credentials
 */
export function clearSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON_KEY);
  cachedClient = null;
}
