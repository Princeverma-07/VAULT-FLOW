import React from 'react';
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  Smartphone,
  Maximize2,
  Lock,
  Cloud,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../utils/finance';
import { MoneyMaxLogo } from './MoneyMaxLogo';

interface HeaderProps {
  baseCurrency: string;
  onSelectCurrency: (code: string) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  onLockApp: () => void;
  hasPin: boolean;
  onOpenCloudSync?: () => void;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  baseCurrency,
  onSelectCurrency,
  privacyMode,
  onTogglePrivacy,
  isDarkMode,
  onToggleDarkMode,
  isPhoneFrame,
  onTogglePhoneFrame,
  onLockApp,
  hasPin,
  onOpenCloudSync,
  isCloudConnected,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <MoneyMaxLogo size="md" />
        </div>

        {/* Action & Utility Controls Zone */}
        <div className="flex items-center gap-2">
          {/* Dedicated Indian Rupee (₹) Currency Marker */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
            <span>₹</span>
            <span>INR</span>
          </div>

          {/* Privacy Mask Toggle */}
          <button
            type="button"
            onClick={onTogglePrivacy}
            aria-label={privacyMode ? 'Show sensitive balances' : 'Hide sensitive balances'}
            title={privacyMode ? 'Show balances' : 'Hide balances'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Phone Frame Toggle (Preview as Mobile device vs Fullscreen) */}
          <button
            type="button"
            onClick={onTogglePhoneFrame}
            aria-label={isPhoneFrame ? 'Expand to responsive desktop view' : 'Simulate mobile phone frame'}
            title={isPhoneFrame ? 'Desktop view' : 'Mobile phone frame'}
            className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isPhoneFrame ? <Maximize2 size={16} /> : <Smartphone size={16} />}
          </button>

          {/* Cloud Sync Button */}
          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              aria-label="Supabase Cloud Sync"
              title={isCloudConnected ? 'Supabase Connected' : 'Connect Supabase'}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Cloud size={16} />
              {isCloudConnected && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
              )}
            </button>
          )}

          {/* App Lock Button */}
          {hasPin && (
            <button
              type="button"
              onClick={onLockApp}
              aria-label="Lock App with PIN"
              title="Lock Vault"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Lock size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
