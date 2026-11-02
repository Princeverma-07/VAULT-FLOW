import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  getSupabaseClient,
  getSupabaseConfig,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
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
  const [urlInput, setUrlInput] = useState(config.url);
  const [keyInput, setKeyInput] = useState(config.anonKey);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setConfig(cfg);
      setUrlInput(cfg.url);
      setKeyInput(cfg.anonKey);
      setStatusMessage(null);
      checkUserSession();
    }
  }, [isOpen]);

  const checkUserSession = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setUserEmail(null);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setUserEmail(data.session?.user?.email || null);
  };

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    if (!urlInput.trim() || !keyInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }
    saveSupabaseCredentials(urlInput.trim(), keyInput.trim());
    const updated = getSupabaseConfig();
    setConfig(updated);
    setStatusMessage({ type: 'success', text: 'Supabase credentials saved successfully.' });
    checkUserSession();
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setConfig(getSupabaseConfig());
    setUserEmail(null);
    setStatusMessage({ type: 'success', text: 'Supabase disconnected. Switched to Local Mode.' });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatusMessage({ type: 'error', text: 'Connect Supabase credentials first.' });
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
        setUserEmail(data.user?.email || null);
        setStatusMessage({ type: 'success', text: `Signed in as ${data.user?.email}` });
        
        // Auto-fetch remote data
        if (data.user?.id) {
          const remote = await fetchRemoteVaultData(data.user.id, categories, preferences);
          if (remote && remote.transactions.length > 0) {
            onApplyRemoteVault(remote);
            setStatusMessage({ type: 'success', text: 'Cloud data loaded into your vault!' });
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setUserEmail(data.user?.email || null);
        setStatusMessage({
          type: 'success',
          text: data.session ? 'Account created and signed in!' : 'Account registered! Please check email to verify.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Authentication failed' });
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
    setStatusMessage({ type: 'success', text: 'Signed out successfully.' });
  };

  const handlePushLocalDataToCloud = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) {
      setStatusMessage({ type: 'error', text: 'Sign in to upload your data to Supabase.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const res = await syncLocalVaultToSupabase(userId, {
      transactions,
      categories,
      savingsGoals,
      recurringBills,
      preferences,
    });

    setIsLoading(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Successfully synced ${transactions.length} transactions and settings to Supabase!`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Failed to sync data to Supabase.',
      });
    }
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
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cloud size={18} />
            </div>
            <div>
              <h2 id="supabase-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Supabase Cloud Database &amp; Sync
              </h2>
              <p className="text-[11px] text-slate-500">
                Multi-device persistent cloud storage with Row Level Security
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
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  config.isConfigured ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <span className="font-semibold text-slate-900 dark:text-white">
                {config.isConfigured ? 'Supabase Connected' : 'Local Storage Mode'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {config.source === 'env'
                ? '.env config'
                : config.source === 'storage'
                ? 'Custom credentials'
                : 'Offline'}
            </span>
          </div>

          {/* Alert / Feedback message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2 border text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Credentials Setup */}
          {!config.isConfigured ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Connect Supabase Project
                </span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Supabase Dashboard</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Enter your Supabase Project URL and Anon Public Key (from Project Settings &rarr; API) to enable real-time cloud persistence:
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzprojectid.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Anon / Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Key size={14} />
                <span>Save &amp; Connect Supabase</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Authenticated User or Login Form */}
              {userEmail ? (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider block">
                        Logged in as
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {userEmail}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                    >
                      Sign Out
                    </button>
                  </div>

                  {/* Sync Actions */}
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Sync your current local balance, {transactions.length} transactions, and budgets to your Supabase account:
                    </p>
                    <button
                      type="button"
                      onClick={handlePushLocalDataToCloud}
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                      <span>{isLoading ? 'Syncing...' : 'Upload & Sync Local Data to Cloud'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      {authMode === 'signin' ? 'Sign In to Sync' : 'Create Supabase Account'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-[11px]"
                    >
                      {authMode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    <LogIn size={14} />
                    <span>{isLoading ? 'Processing...' : authMode === 'signin' ? 'Sign In & Load Data' : 'Sign Up'}</span>
                  </button>
                </form>
              )}

              {/* Manage Connection Button */}
              {config.source === 'storage' && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-xs text-slate-400 hover:text-rose-500 underline cursor-pointer"
                  >
                    Disconnect Supabase Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
