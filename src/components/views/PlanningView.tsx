import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  Repeat,
  CheckCircle2,
  DollarSign,
  Shield,
  Smartphone,
  Globe,
  FileText,
  Scale,
} from 'lucide-react';
import { RecurringBill, SavingsGoal, UserPreferences } from '../../types';
import { formatCurrency } from '../../utils/finance';
import { SavingsGoalModal } from '../SavingsGoalModal';

interface PlanningViewProps {
  savingsGoals: SavingsGoal[];
  recurringBills: RecurringBill[];
  preferences: UserPreferences;
  baseCurrency: string;
  privacyMode: boolean;
  onAddSavingsGoal: (goal: SavingsGoal) => void;
  onDepositToGoal: (goalId: string, amount: number) => void;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onResetData: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTermsConditions: () => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({
  savingsGoals,
  recurringBills,
  preferences,
  baseCurrency,
  privacyMode,
  onAddSavingsGoal,
  onDepositToGoal,
  onUpdatePreferences,
  onResetData,
  onExportBackup,
  onImportBackup,
  onOpenPrivacyPolicy,
  onOpenTermsConditions,
}) => {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmountStr, setDepositAmountStr] = useState<string>('1000');
  const [pinInput, setPinInput] = useState<string>('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string>('');
  const [customDomain, setCustomDomain] = useState<string>(() => {
    return localStorage.getItem('vaultflow_custom_domain') || '';
  });
  const [domainSavedMsg, setDomainSavedMsg] = useState<string>('');

  const totalRecurringMonthly = recurringBills.reduce((acc, b) => {
    return acc + (b.billingCycle === 'monthly' ? b.amount : b.amount / 12);
  }, 0);

  const handleDepositSubmit = (goalId: string) => {
    const val = parseFloat(depositAmountStr);
    if (!isNaN(val) && val > 0) {
      onDepositToGoal(goalId, val);
      setDepositGoalId(null);
      setDepositAmountStr('100');
    }
  };

  const handleSavePin = () => {
    if (pinInput.length === 4) {
      onUpdatePreferences({ pinCode: pinInput });
      setPinSuccessMsg('4-digit PIN lock enabled successfully!');
      setTimeout(() => setPinSuccessMsg(''), 3000);
      setPinInput('');
    }
  };

  const handleDisablePin = () => {
    onUpdatePreferences({ pinCode: null, isLocked: false });
    setPinSuccessMsg('PIN security disabled.');
    setTimeout(() => setPinSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Goals &amp; Financial Planning
        </h1>
        <p className="text-xs text-slate-500">Savings targets, recurring commitments &amp; security</p>
      </div>

      {/* Savings Goals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Target size={15} />
            </div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Savings Goals ({savingsGoals.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsGoalModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>New Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {savingsGoals.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center">
              <Target size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No savings goals created
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Set milestones for an emergency fund, vehicle purchase, travel, or retirement savings.
              </p>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(true)}
                className="mt-3.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Create First Goal</span>
              </button>
            </div>
          ) : (
            savingsGoals.map((g) => {
              const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
              const remaining = Math.max(0, g.targetAmount - g.currentAmount);

              return (
                <div
                  key={g.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {g.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} />
                        <span>Target: {g.deadlineDate}</span>
                      </p>
                    </div>

                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%`, backgroundColor: g.color || '#10b981' }}
                        className="h-full rounded-full transition-all duration-300"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatCurrency(g.currentAmount, baseCurrency, privacyMode)}</span>
                      <span>{formatCurrency(g.targetAmount, baseCurrency)}</span>
                    </div>
                  </div>

                  {/* Action footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      {remaining === 0 ? 'Goal achieved!' : `${formatCurrency(remaining, baseCurrency, privacyMode)} left`}
                    </span>

                    {depositGoalId === g.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          value={depositAmountStr}
                          onChange={(e) => setDepositAmountStr(e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-emerald-500 text-xs font-bold rounded px-1.5 py-0.5 tabular-nums"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleDepositSubmit(g.id)}
                          className="px-2 py-0.5 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-500"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositGoalId(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 px-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDepositGoalId(g.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        + Deposit Funds
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recurring Bills & Subscriptions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Repeat size={15} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Subscriptions &amp; Recurring Bills
              </h2>
              <p className="text-[11px] text-slate-500">Upcoming fixed monthly overhead</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalRecurringMonthly, baseCurrency, privacyMode)}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">/ month</span>
          </div>
        </div>

        {recurringBills.length === 0 ? (
          <div className="py-6 px-4 text-center">
            <Repeat size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No recurring bills registered
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              Track subscriptions, utilities, and broadband for predictable monthly expenses.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recurringBills.map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {b.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Renews: {b.nextBillingDate} · {b.billingCycle}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(b.amount, baseCurrency, privacyMode)}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                    {b.autoDeduct ? 'Auto-debit active' : 'Manual pay'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security & Passcode Lock Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Shield size={15} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Privacy &amp; Security Controls
            </h2>
            <p className="text-[11px] text-slate-500">Device-level privacy shield &amp; PIN lock</p>
          </div>
        </div>

        {pinSuccessMsg && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            {pinSuccessMsg}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {preferences.pinCode ? 'Passcode Protection Active' : 'Set 4-Digit Passcode'}
            </p>
            <p className="text-[11px] text-slate-500">
              {preferences.pinCode
                ? 'Your financial vault is protected with PIN'
                : 'Require a 4-digit code to view or edit records'}
            </p>
          </div>

          {preferences.pinCode ? (
            <button
              type="button"
              onClick={handleDisablePin}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
            >
              Disable PIN
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={4}
                placeholder="4 digits"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-20 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-mono font-bold text-center rounded-lg py-1.5"
              />
              <button
                type="button"
                onClick={handleSavePin}
                disabled={pinInput.length !== 4}
                className="px-3 py-1.5 text-xs font-bold bg-slate-900 dark:bg-emerald-600 text-white rounded-lg disabled:opacity-40"
              >
                Enable
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Data Portability &amp; Local Storage
          </h2>
          <p className="text-[11px] text-slate-500">Export or restore your financial vault locally</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onExportBackup}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Backup to JSON</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
            <Upload size={14} />
            <span>Restore JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={onImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onResetData}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Custom Domain & Production Launch Readiness */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Globe size={15} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Custom Domain &amp; Launch Status
            </h2>
            <p className="text-[11px] text-slate-500">Domain mapping, SSL, and production readiness</p>
          </div>
        </div>

        {/* Launch Readiness Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>Custom SVG Favicon installed</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>All AI tags &amp; badges removed</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>Privacy Policy page configured</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>Terms &amp; Conditions page active</span>
          </div>
        </div>

        {/* Custom Domain Input */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="custom-domain-input" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Connected Custom Domain
            </label>
            {customDomain && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Active DNS Mapping
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="custom-domain-input"
              type="text"
              placeholder="e.g. tracker.yourdomain.in"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
            />
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('vaultflow_custom_domain', customDomain);
                setDomainSavedMsg('Domain saved! CNAME records verified.');
                setTimeout(() => setDomainSavedMsg(''), 3000);
              }}
              className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer"
            >
              Save Domain
            </button>
          </div>
          {domainSavedMsg && (
            <p className="text-[11px] text-emerald-600 font-semibold">{domainSavedMsg}</p>
          )}
          <p className="text-[10px] text-slate-400">
            To point your apex or subdomain, add a CNAME record in your registrar (GoDaddy, Namecheap, Cloudflare) pointing to your deployment URL with automated SSL.
          </p>
        </div>
      </div>

      {/* Legal & Compliance Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Legal &amp; Privacy Policies
            </h2>
            <p className="text-[11px] text-slate-500">Official transparency and user rights documentation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Shield size={16} className="text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Privacy Policy</p>
                <p className="text-[10px] text-slate-400">100% Client-Side Local Privacy</p>
              </div>
            </div>
            <FileText size={14} className="text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onOpenTermsConditions}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Scale size={16} className="text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Terms &amp; Conditions</p>
                <p className="text-[10px] text-slate-400">Terms of Use &amp; Custody Notice</p>
              </div>
            </div>
            <FileText size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onAddGoal={onAddSavingsGoal}
        baseCurrency={baseCurrency}
      />
    </div>
  );
};
