import React, { useState } from 'react';
import {
  PieChart,
  Sliders,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { Category, Transaction } from '../../types';
import {
  calculateBudgetStatus,
  calculateSafeToSpendToday,
  formatCurrency,
  getDaysInMonth,
} from '../../utils/finance';
import { CategoryIcon } from '../CategoryIcon';
import { EditBudgetModal } from '../EditBudgetModal';

interface BudgetsViewProps {
  transactions: Transaction[];
  categories: Category[];
  baseCurrency: string;
  privacyMode: boolean;
  selectedMonth: string;
  monthlyBudget: number;
  onUpdateMonthlyBudget: (amount: number, month?: string) => void;
  onOpenCategoryManager: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  transactions,
  categories,
  baseCurrency,
  privacyMode,
  selectedMonth,
  monthlyBudget,
  onUpdateMonthlyBudget,
  onOpenCategoryManager,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [rolloverEnabled, setRolloverEnabled] = useState(true);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDays = getDaysInMonth(year, month - 1);
  const now = new Date();
  const currentDay = now.getMonth() + 1 === month ? now.getDate() : Math.min(20, totalDays);

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Month transactions
  const monthExpenses = transactions.filter(
    (t) => t.date.startsWith(selectedMonth) && t.type === 'expense'
  );

  const totalExpense = monthExpenses.reduce((sum, t) => sum + t.convertedAmount, 0);

  // Safe daily
  const safeDaily = calculateSafeToSpendToday(
    monthlyBudget,
    totalExpense,
    currentDay,
    totalDays
  );

  const totalBudgetStatus = calculateBudgetStatus(totalExpense, monthlyBudget);

  // Category spending vs budget limit
  const categorySpendMap = new Map<string, number>();
  for (const t of monthExpenses) {
    categorySpendMap.set(
      t.categoryId,
      (categorySpendMap.get(t.categoryId) || 0) + t.convertedAmount
    );
  }

  const budgetedCategories = categories
    .filter((c) => c.type === 'expense' && (c.budgetLimit || 0) > 0)
    .map((c) => {
      const spent = categorySpendMap.get(c.id) || 0;
      const limit = c.budgetLimit || 0;
      const status = calculateBudgetStatus(spent, limit);
      return {
        ...c,
        spent,
        limit,
        status,
      };
    })
    .sort((a, b) => b.status.percent - a.status.percent);

  const handleSaveBudget = (newLimit: number) => {
    onUpdateMonthlyBudget(newLimit, selectedMonth);
    setFeedbackMessage(`Monthly budget successfully updated to ${formatCurrency(newLimit, baseCurrency)} for ${monthName}.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Planning
          </h1>
          <p className="text-xs text-slate-500">Plan monthly caps &amp; manage spending pacing</p>
        </div>

        <button
          type="button"
          onClick={onOpenCategoryManager}
          className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
        >
          <Sliders size={14} />
          <span>Edit Limits</span>
        </button>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-medium">
          {feedbackMessage}
        </div>
      )}

      {/* Master Monthly Budget Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Monthly Spending Cap ({monthName})
            </span>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatCurrency(monthlyBudget, baseCurrency)}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg"
              >
                <span>Edit Budget</span>
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Safe Allowance</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(safeDaily.safeDaily, baseCurrency, privacyMode)}
            </span>
            <span className="text-[10px] text-slate-400 block">/ day remaining</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Spent: {formatCurrency(totalExpense, baseCurrency, privacyMode)}</span>
            <span>
              Remaining: {formatCurrency(safeDaily.remainingBudget, baseCurrency, privacyMode)}
            </span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, totalBudgetStatus.percent)}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                totalBudgetStatus.status === 'danger'
                  ? 'bg-rose-500'
                  : totalBudgetStatus.status === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{totalBudgetStatus.percent}% spent</span>
            <span>{safeDaily.remainingDays} days left in cycle</span>
          </div>
        </div>

        {/* Rollover notice */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Info size={14} className="text-slate-400" />
            <span>Budget Rollover (Carry over unspent surplus)</span>
          </div>
          <button
            type="button"
            onClick={() => setRolloverEnabled(!rolloverEnabled)}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              rolloverEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                rolloverEnabled ? 'left-4.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Category Budgets List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Category Spending Limits ({budgetedCategories.length})
          </h2>
          <span className="text-[11px] text-slate-500">Live progress tracking</span>
        </div>

        <div className="space-y-3">
          {budgetedCategories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center">
              <PieChart size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No category spending limits set
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Set individual monthly budget caps for categories like Rent, Groceries, Dining, and Shopping to keep your spending on track.
              </p>
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="mt-3.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-95 transition-opacity"
              >
                <Sliders size={13} />
                <span>Configure Category Limits</span>
              </button>
            </div>
          ) : (
            budgetedCategories.map((cat) => {
              const isDanger = cat.status.status === 'danger';
              const isWarning = cat.status.status === 'warning';

              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CategoryIcon
                        iconName={cat.iconName}
                        color={cat.color}
                        size={16}
                        className="p-1.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {cat.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Budget: {formatCurrency(cat.limit, baseCurrency)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isDanger ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(cat.spent, baseCurrency, privacyMode)}
                      </span>
                      <span className="text-[10px] text-slate-400 block tabular-nums">
                        {cat.status.percent}% used
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, cat.status.percent)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    {isDanger ? (
                      <span className="text-rose-500 font-semibold flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Over by {formatCurrency(cat.spent - cat.limit, baseCurrency)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(cat.status.remaining, baseCurrency, privacyMode)} left
                      </span>
                    )}
                    <span className="text-slate-400">
                      {Math.max(0, cat.limit - cat.spent > 0 ? Math.round(((cat.limit - cat.spent) / safeDaily.remainingDays) * 100) / 100 : 0)}{' '}
                      {baseCurrency}/day
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Budget Modal */}
      <EditBudgetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentBudget={monthlyBudget}
        month={selectedMonth}
        baseCurrency={baseCurrency}
        onSave={handleSaveBudget}
      />
    </div>
  );
};
