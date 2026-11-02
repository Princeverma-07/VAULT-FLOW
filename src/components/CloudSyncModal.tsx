import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  RefreshCw,
  LogIn,
  LogOut,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  Laptop,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getSupabaseClient,
  getSupabaseConfig,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  checkSupabaseHealth,
} from '../lib/supabase';
import { syncLocalVaultToSupabase, fetchRemoteVaultData } from '../services/supabaseService';
import { Category, RecurringBill, SavingsGoal, Transaction, UserPreferences } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  recurringBills: RecurringBill[];
  preferences: UserPreferences;
  onApplyRemoteVault: (vault: {
    transactions: Transaction[];
    categories: Category[];
    savingsGoals: SavingsGoal[];
    recurringBills: RecurringBill[];
    preferences: UserPreferences;
  }) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  savingsGoals,
  recurringBills,
  preferences,
  onApplyRemoteVault,
}) => {
  const [config, setConfig] = useState(getSupabaseConfig());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [manualUrl, setManualUrl] = useState(config.url);
  const [manualKey, setManualKey] = useState(config.anonKey);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getSupabaseConfig();
      setConfig(currentConfig);
      setManualUrl(currentConfig.url);
      setManualKey(currentConfig.anonKey);
      setStatusMessage(null);
      checkSessionAndHealth();
    }
  }, [isOpen]);

  const checkSessionAndHealth = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setUserEmail(null);
      setUserId(null);
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatusMessage({ type: 'error', text: `Session error: ${error.message}` });
        setUserEmail(null);
        setUserId(null);
        return;
      }

      if (data.session?.user) {
        setUserEmail(data.session.user.email || 'Authenticated User');
        setUserId(data.session.user.id);
      } else {
        setUserEmail(null);
        setUserId(null);
      }
    } catch (err: any) {
      console.warn('Session check warning:', err);
      setUserEmail(null);
      setUserId(null);
    }
  };

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatusMessage({
        type: 'error',
        text: 'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
      });
      return;
    }

    if (!authEmail.trim() || !authPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter both email and password.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) throw error;

        const currentUserId = data.user?.id;
        setUserEmail(data.user?.email || null);
        setUserId(currentUserId || null);
        setStatusMessage({ type: 'success', text: `Signed in as ${data.user?.email}. Syncing data...` });

        // Auto-fetch remote data from Supabase cloud database
        if (currentUserId) {
          const remote = await fetchRemoteVaultData(currentUserId, categories, preferences);
          if (remote && remote.transactions && remote.transactions.length > 0) {
            onApplyRemoteVault(remote);
            setStatusMessage({
              type: 'success',
              text: `Synced! Loaded ${remote.transactions.length} transactions from Supabase cloud.`,
            });
          } else if (transactions.length > 0) {
            // First time sync for this user: automatically push existing local records so no data is lost!
            setStatusMessage({
              type: 'info',
              text: `Signed in! Syncing ${transactions.length} local records to your new cloud vault...`,
            });
            const pushRes = await syncLocalVaultToSupabase(currentUserId, {
              transactions,
              categories,
              savingsGoals,
              recurringBills,
              preferences,
            });
            if (pushRes.success) {
              setStatusMessage({
                type: 'success',
                text: `Connected! Successfully uploaded ${transactions.length} records to your Supabase cloud database.`,
              });
            }
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) throw error;

        if (data.session && data.user) {
          setUserEmail(data.user.email || null);
          setUserId(data.user.id);
          setStatusMessage({
            type: 'success',
            text: 'Account created! Initializing your cloud vault...',
          });

          // Upload current records to new account
          if (transactions.length > 0) {
            await syncLocalVaultToSupabase(data.user.id, {
              transactions,
              categories,
              savingsGoals,
              recurringBills,
              preferences,
            });
          }
        } else {
          setStatusMessage({
            type: 'info',
            text: 'Account registered! Please check your email inbox to confirm your account, then sign in.',
          });
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Authentication failed. Please verify credentials.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUserEmail(null);
    setUserId(null);
    setStatusMessage({ type: 'success', text: 'Signed out. Operating in offline/local mode.' });
  };

  const handleManualSyncNow = async () => {
    if (!userId) return;
    setIsSyncing(true);
    setStatusMessage(null);

    try {
      // 1. Fetch remote changes
      const remote = await fetchRemoteVaultData(userId, categories, preferences);
      if (remote && remote.transactions && remote.transactions.length > 0) {
        onApplyRemoteVault(remote);
      }

      // 2. Push any local state
      const res = await syncLocalVaultToSupabase(userId, {
        transactions,
        categories,
        savingsGoals,
        recurringBills,
        preferences,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Everything in sync! Updated across your mobile and laptop devices.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Sync encountered an issue.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveManualOverride = () => {
    if (!manualUrl.trim() || !manualKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Enter both URL and Key for manual override.' });
      return;
    }
    saveSupabaseCredentials(manualUrl.trim(), manualKey.trim());
    const updated = getSupabaseConfig();
    setConfig(updated);
    setStatusMessage({ type: 'success', text: 'Custom credentials saved. Re-initializing...' });
    checkSessionAndHealth();
  };

  const handleClearManualOverride = () => {
    clearSupabaseCredentials();
    setConfig(getSupabaseConfig());
    setUserEmail(null);
    setUserId(null);
    setStatusMessage({ type: 'info', text: 'Reset to environment variables mode.' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Cloud size={19} />
            </div>
            <div>
              <h2 id="supabase-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Supabase Cloud Database &amp; Sync
              </h2>
              <p className="text-[11px] text-slate-500">
                Seamless multi-device sync across Mobile &amp; Laptop
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Connection Status Indicator */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  config.isConfigured
                    ? userEmail
                      ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                      : 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {config.isConfigured
                    ? userEmail
                      ? 'Live Cloud Sync Active'
                      : 'Supabase Cloud Connected'
                    : 'Pending Environment Setup'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {userEmail
                    ? `Signed in as ${userEmail}`
                    : config.isConfigured
                    ? 'Ready for email sign in / sign up'
                    : 'Configure VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
              <Laptop size={14} className="text-slate-400" />
              <span>&harr;</span>
              <Smartphone size={14} className="text-slate-400" />
            </div>
          </div>

          {/* Feedback / Alert messages */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2 border text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : statusMessage.type === 'info'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600 mt-0.5" />
              ) : statusMessage.type === 'info' ? (
                <ShieldCheck size={15} className="shrink-0 text-blue-600 mt-0.5" />
              ) : (
                <AlertCircle size={15} className="shrink-0 text-rose-500 mt-0.5" />
              )}
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* User Logged In Zone */}
          {userEmail ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-white">Active Account</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    RLS Secured
                  </span>
                </div>

                <div className="text-xs">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 break-all">{userEmail}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your records sync automatically whenever you add or edit transactions on any device.
                  </p>
                </div>

                {/* Vault Sync Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40 text-center text-[11px]">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl">
                    <span className="block font-black text-slate-900 dark:text-white text-sm">{transactions.length}</span>
                    <span className="text-slate-400 text-[10px]">Transactions</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl">
                    <span className="block font-black text-slate-900 dark:text-white text-sm">{categories.length}</span>
                    <span className="text-slate-400 text-[10px]">Categories</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl">
                    <span className="block font-black text-slate-900 dark:text-white text-sm">{savingsGoals.length + recurringBills.length}</span>
                    <span className="text-slate-400 text-[10px]">Goals &amp; Bills</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleManualSyncNow}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-700 dark:text-slate-300 hover:text-rose-600 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* User Not Logged In: Fast Email Sign In / Sign Up */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                {authMode === 'signin'
                  ? 'Sign in with your email to load your transactions and budgets across mobile, laptop, or tablet.'
                  : 'Register a new account to isolate and encrypt your data with Row Level Security.'}
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <LogIn size={14} />
                  )}
                  <span>
                    {isLoading
                      ? 'Connecting...'
                      : authMode === 'signin'
                      ? 'Sign In & Load Cloud Data'
                      : 'Create Account & Start Sync'}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* Privacy & Security Note */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-500">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Row Level Security ensures your transactions can only be read or edited by your authenticated account. Your device PIN lock remains strictly local to this device.
            </p>
          </div>

          {/* Collapsible Advanced / Dev Override Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer py-1"
            >
              <span>Advanced / Development Settings</span>
              {showAdvancedConfig ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showAdvancedConfig && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-[11px]">
                <p className="text-slate-500">
                  {config.source === 'env'
                    ? 'Using production environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY). All connected devices share this cloud configuration automatically.'
                    : 'Environment variables not detected. You can test a custom Supabase URL and Key for this browser only:'}
                </p>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                    VITE_SUPABASE_URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyz.supabase.co"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                    VITE_SUPABASE_ANON_KEY
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1Ni..."
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveManualOverride}
                    className="px-3 py-1 bg-slate-900 dark:bg-emerald-600 text-white rounded-lg font-semibold hover:opacity-90 cursor-pointer"
                  >
                    Save Override
                  </button>
                  {config.source === 'storage' && (
                    <button
                      type="button"
                      onClick={handleClearManualOverride}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 cursor-pointer"
                    >
                      Clear Override
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
