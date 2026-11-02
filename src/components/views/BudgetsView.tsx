import React, { useState } from 'react';
import {
  PieChart,
  Sliders,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Category, Transaction } from '../../types';
import {
  calculateBudgetStatus,
  formatCurrency,
  getDaysInMonth,
  getAvailableMonthsList,
  formatMonthDisplay,
  getCurrentMonthKey,
} from '../../utils/finance';
import { CategoryIcon } from '../CategoryIcon';

interface BudgetsViewProps {
  transactions: Transaction[];
  categories: Category[];
  baseCurrency: string;
  privacyMode: boolean;
  selectedMonth: string;
  onSelectMonth?: (month: string) => void;
  monthlyBudget?: number;
  onUpdateMonthlyBudget?: (amount: number, month?: string) => void;
  onOpenCategoryManager: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  transactions,
  categories,
  baseCurrency,
  privacyMode,
  selectedMonth,
  onSelectMonth,
  monthlyBudget,
  onUpdateMonthlyBudget,
  onOpenCategoryManager,
}) => {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDays = getDaysInMonth(year, month - 1);
  const now = new Date();
  
  const liveCurrentMonthKey = getCurrentMonthKey();
  const isViewingCurrentMonth = selectedMonth === liveCurrentMonthKey;
  const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;
  const isFutureMonth = now.getFullYear() < year || (now.getFullYear() === year && now.getMonth() + 1 < month);
  const currentDay = isCurrentMonth ? now.getDate() : isFutureMonth ? 1 : totalDays;
  const remainingDays = Math.max(1, totalDays - currentDay + 1);

  const monthName = formatMonthDisplay(selectedMonth);
  const availableMonths = getAvailableMonthsList(transactions);

  // Month transactions
  const monthExpenses = transactions.filter(
    (t) => t.date.startsWith(selectedMonth) && t.type === 'expense'
  );

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

  const totalCategoryBudgeted = budgetedCategories.reduce((sum, c) => sum + c.limit, 0);
  const totalCategorySpent = budgetedCategories.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Planning
          </h1>
          <p className="text-xs text-slate-500">
            Cycle: <span className="font-semibold text-slate-800 dark:text-slate-200">{monthName}</span>
            {!isViewingCurrentMonth && onSelectMonth && (
              <button
                type="button"
                onClick={() => onSelectMonth(liveCurrentMonthKey)}
                className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                (Jump to Current Month)
              </button>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onSelectMonth && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs shadow-xs">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                aria-label="Select budget cycle month"
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="bg-white dark:bg-slate-900">
                    {formatMonthDisplay(m, true)}{m === liveCurrentMonthKey ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Sliders size={14} />
            <span>Edit Limits</span>
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-medium">
          {feedbackMessage}
        </div>
      )}

      {/* Category Budgets Overview Summary Card */}
      {budgetedCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Category Limits
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-1 block">
                {formatCurrency(totalCategoryBudgeted, baseCurrency)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Across {budgetedCategories.length} active spending categor{budgetedCategories.length === 1 ? 'y' : 'ies'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Category Spending
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight mt-1 block">
                {formatCurrency(totalCategorySpent, baseCurrency, privacyMode)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {totalCategoryBudgeted > 0
                  ? `${Math.round((totalCategorySpent / totalCategoryBudgeted) * 100)}% of category caps utilized`
                  : 'Tracked in selected cycle'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Remaining Allowance
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight mt-1 block">
                {formatCurrency(Math.max(0, totalCategoryBudgeted - totalCategorySpent), baseCurrency, privacyMode)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {remainingDays} days left in cycle
              </span>
            </div>
          </div>
        </div>
      )}

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
                      {Math.max(0, cat.limit - cat.spent > 0 ? Math.round(((cat.limit - cat.spent) / remainingDays) * 100) / 100 : 0)}{' '}
                      {baseCurrency}/day
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
