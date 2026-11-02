import React, { useState, useEffect } from 'react';
import { X, Check, Sliders, AlertCircle } from 'lucide-react';
import { formatCurrency, formatMonthDisplay } from '../utils/finance';

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  month: string; // 'YYYY-MM'
  baseCurrency: string;
  onSave: (newBudget: number) => void;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  isOpen,
  onClose,
  currentBudget,
  month,
  baseCurrency,
  onSave,
}) => {
  const [budgetStr, setBudgetStr] = useState<string>(
    currentBudget > 0 ? currentBudget.toString() : ''
  );
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setBudgetStr(currentBudget > 0 ? currentBudget.toString() : '');
      setError('');
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const monthLabel = formatMonthDisplay(month);

  const handleQuickAdd = (increment: number) => {
    const current = parseFloat(budgetStr) || 0;
    const nextVal = Math.max(0, current + increment);
    setBudgetStr(nextVal.toString());
    setError('');
  };

  const handleSetPreset = (preset: number) => {
    setBudgetStr(preset.toString());
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetStr.trim() === '') {
      onSave(0);
      onClose();
      return;
    }

    const parsed = parseFloat(budgetStr);
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid monthly budget amount (₹0 or greater).');
      return;
    }

    onSave(Math.round(parsed));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-budget-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-sm mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sliders size={16} />
            </div>
            <div>
              <h2 id="edit-budget-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Monthly Budget
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Spending target for {monthLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Persistent Spending Cap:
            </span>{' '}
            Your monthly budget is your self-imposed expense limit. Setting or changing this budget will not alter your available balance or recorded income. Once saved, it remains active until you change it.
          </div>

          {/* Amount Input */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
            <label htmlFor="budget-amount-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Monthly Budget Amount (₹ Rupees)
            </label>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-3xl font-extrabold text-slate-400 dark:text-slate-500 font-mono select-none">
                ₹
              </span>
              <input
                id="budget-amount-input"
                type="number"
                step="500"
                min="0"
                placeholder="e.g. 50000"
                value={budgetStr}
                onChange={(e) => {
                  setBudgetStr(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                autoFocus
                className="w-48 text-3xl font-extrabold text-slate-900 dark:text-white bg-transparent text-center focus:outline-none tabular-nums placeholder:text-slate-300 dark:placeholder:text-slate-700"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Quick Adjustments:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '+₹1,000', add: 1000 },
                { label: '+₹5,000', add: 5000 },
                { label: '+₹10,000', add: 10000 },
                { label: '₹25,000', set: 25000 },
                { label: '₹50,000', set: 50000 },
                { label: '₹75,000', set: 75000 },
                { label: '₹1,00,000', set: 100000 },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => (item.add ? handleQuickAdd(item.add) : handleSetPreset(item.set!))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Saved Info */}
          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Currently Saved Budget:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {formatCurrency(currentBudget, baseCurrency)}
            </span>
          </div>

          {/* Action Buttons: Cancel and Save */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Check size={14} />
              <span>Save Budget</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
