import React, { useState } from 'react';
import { X, Plus, PiggyBank, Target } from 'lucide-react';
import { SavingsGoal } from '../types';
import { formatDateISO } from '../utils/finance';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goal: SavingsGoal) => void;
  baseCurrency: string;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  onAddGoal,
  baseCurrency,
}) => {
  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [initialSavedStr, setInitialSavedStr] = useState('0');
  const [deadline, setDeadline] = useState(
    formatDateISO(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000))
  );
  const [color, setColor] = useState('#10b981');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseFloat(targetAmountStr) || 0;
    const currentAmount = parseFloat(initialSavedStr) || 0;
    if (!name.trim() || targetAmount <= 0) return;

    onAddGoal({
      id: `goal_${Date.now()}`,
      name: name.trim(),
      targetAmount,
      currentAmount,
      currency: baseCurrency,
      deadlineDate: deadline,
      iconName: 'Target',
      color,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="savings-modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PiggyBank size={18} />
            </div>
            <h2 id="savings-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              New Savings Goal
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Goal Title
            </label>
            <input
              type="text"
              placeholder="e.g. Dream Vacation, New Car Fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Amount ({baseCurrency})
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="5000"
                value={targetAmountStr}
                onChange={(e) => setTargetAmountStr(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currently Saved
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={initialSavedStr}
                onChange={(e) => setInitialSavedStr(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Create Savings Goal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
