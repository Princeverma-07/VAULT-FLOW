import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Local storage fallback keys for backward compatibility
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
 * Resolves Supabase configuration primarily from environment variables:
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 * Falls back to localStorage only if env vars are not set.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  // 1. Primary: Environment variables configured (Works across all devices: mobile, laptop, tablet)
  if (
    envUrl &&
    envKey &&
    !envUrl.includes('your-project') &&
    !envKey.includes('your-anon-key')
  ) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  // 2. Secondary fallback: Locally saved credentials (if user entered them previously)
  try {
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
  } catch (e) {
    // LocalStorage might be disabled or restricted in private browsing
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
}

/**
 * Returns a singleton instance of the Supabase Client.
 * Automatically initialized upon website load when environment variables are set.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  // Return cached client if config matches
  if (cachedClient && lastUsedUrl === config.url && lastUsedKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'moneymax_auth_token',
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
 * Checks connection health with the remote Supabase project
 */
export async function checkSupabaseHealth(): Promise<{
  isOnline: boolean;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      isOnline: false,
      message: 'Supabase is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    // Quick test against auth service
    const { error } = await client.auth.getSession();
    if (error) {
      return {
        isOnline: false,
        message: `Supabase Auth error: ${error.message}`,
      };
    }
    return {
      isOnline: true,
      message: 'Supabase cloud database is connected and healthy.',
    };
  } catch (err: any) {
    return {
      isOnline: false,
      message: err.message || 'Cannot reach Supabase servers. Check network connection.',
    };
  }
}

/**
 * Saves Supabase credentials locally for development or manual override
 */
export function saveSupabaseCredentials(url: string, anonKey: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON_KEY, anonKey.trim());
    cachedClient = null; // force re-instantiation
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

/**
 * Disconnects locally saved Supabase credentials
 */
export function clearSupabaseCredentials(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON_KEY);
    cachedClient = null;
  } catch (e) {
    console.warn('Could not clear localStorage:', e);
  }
}
