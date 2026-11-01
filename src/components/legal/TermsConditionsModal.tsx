import React from 'react';
import { X, FileText, AlertCircle, Scale, Check } from 'lucide-react';

interface TermsConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsConditionsModal: React.FC<TermsConditionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-conditions-title"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Scale size={18} />
            </div>
            <div>
              <h2 id="terms-conditions-title" className="text-base font-bold text-slate-900 dark:text-white">
                Terms &amp; Conditions
              </h2>
              <p className="text-xs text-slate-500">Last Revised: November 1, 2026</p>
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

        {/* Terms Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <p className="font-semibold text-slate-900 dark:text-white">
              Plain-Language Overview
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              VaultFlow is a personal financial ledger and budget estimation application. By using this software, you agree that you maintain custody of your own records and understand that calculations are mathematical aids, not regulated financial or tax advice.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Permitted Personal Use
            </h3>
            <p>
              VaultFlow is provided for your personal money management, expense tracking, and budget planning. You may record transactions, create custom spending categories, set budget targets, and export reports for your own use.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-500" />
              2. Not Professional Financial or Tax Advice
            </h3>
            <p>
              The metrics displayed in VaultFlow (such as "Safe-to-Spend Today", savings rates, category allowances, and cashflow projections) are algorithmic estimates based solely on the data you enter. They do not constitute investment advice, banking services, or certified chartered accountancy. Always consult a certified financial planner or tax advisor for statutory filings.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              3. Custody of Records &amp; Backup Responsibility
            </h3>
            <p>
              Because VaultFlow operates client-side without remote servers, you are solely responsible for creating regular data backups. We recommend utilizing the built-in "Backup to JSON" feature before clearing browser storage or switching devices.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              4. Disclaimer of Warranties
            </h3>
            <p>
              VaultFlow is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. In no event shall the authors or copyright holders be liable for any direct, indirect, incidental, or consequential damages arising from the use of or inability to use this application.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              5. Modifications to Terms
            </h3>
            <p>
              We reserve the right to revise these Terms &amp; Conditions as the application evolves. Continued usage of VaultFlow following updates signifies acceptance of the modified terms.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            VaultFlow Terms of Service
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer"
          >
            Accept &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
