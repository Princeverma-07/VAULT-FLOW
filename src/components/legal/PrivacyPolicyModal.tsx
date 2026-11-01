import React from 'react';
import { X, Shield, CheckCircle2, Lock, HardDrive, EyeOff } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <h2 id="privacy-policy-title" className="text-base font-bold text-slate-900 dark:text-white">
                Privacy Policy
              </h2>
              <p className="text-xs text-slate-500">Effective Date: November 1, 2026</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Policy Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Privacy Guarantee Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 size={16} />
              <span>Core Commitment: 100% Client-Side Private Storage</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              VaultFlow is designed from the ground up to respect your financial privacy. Your income, expenses, budgets, notes, and merchant names never leave your web browser. There are no remote tracking databases, no ad networks, and no external analytics.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive size={15} className="text-emerald-600" />
              1. Information We Do Not Collect
            </h3>
            <p>
              Unlike traditional banking and fintech aggregators, VaultFlow does not require an account, email address, phone number, or bank credentials. We do not transmit or store:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Bank login credentials, account numbers, or OTP codes.</li>
              <li>Personal identity documentation (PAN, Aadhaar, Passport).</li>
              <li>Location telemetry or IP-based geolocation tracking.</li>
              <li>Financial records or transaction histories on any central server.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock size={15} className="text-emerald-600" />
              2. How Your Data is Stored
            </h3>
            <p>
              All transactions, categories, savings goals, recurring bills, and user preferences are saved locally inside your browser using standard W3C Web Storage (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">localStorage</code>).
            </p>
            <p>
              This means you retain complete physical custody of your records. When you clear your browser cache or site data, your records are deleted from your machine unless you have exported a JSON backup.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <EyeOff size={15} className="text-emerald-600" />
              3. Zero Third-Party Sharing &amp; Telemetry
            </h3>
            <p>
              We do not sell, rent, monetize, or disclose your financial information. No third-party analytics SDKs, advertising cookies, behavioral fingerprinting, or tracking pixels are included in VaultFlow.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              4. Data Portability &amp; Right to Erase
            </h3>
            <p>
              You have the right to extract or permanently delete your data at any moment:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li><strong>JSON Export:</strong> Download a full, unencrypted backup of all your records via the Planning tab.</li>
              <li><strong>CSV Export:</strong> Export your itemized records to CSV for spreadsheet software.</li>
              <li><strong>Complete Erase:</strong> Click "Clear All Data" in the Planning tab to purge all stored records immediately.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              5. Contact &amp; Questions
            </h3>
            <p>
              If you have any questions regarding this Privacy Policy or your data security, please refer to your self-hosted instance settings or the documentation repository.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            VaultFlow Local Privacy Standard
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
