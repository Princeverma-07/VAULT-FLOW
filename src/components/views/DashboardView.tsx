import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Receipt,
  PiggyBank,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Wallet,
  X,
} from 'lucide-react';
import { Category, Transaction, TransactionType } from '../../types';
import {
  calculateAvailableBalance,
  formatCurrency,
  getDaysInMonth,
  getAvailableMonthsList,
  formatMonthDisplay,
  getCurrentMonthKey,
} from '../../utils/finance';
import { CategoryIcon } from '../CategoryIcon';
import { ExpenseDonutChart } from '../charts/ExpenseDonutChart';

interface DashboardViewProps {
  transactions: Transaction[];
  categories: Category[];
  baseCurrency: string;
  privacyMode: boolean;
  selectedMonth: string; // 'YYYY-MM'
  onSelectMonth: (month: string) => void;
  monthlyBudget?: number;
  onUpdateMonthlyBudget?: (amount: number, month?: string) => void;
  onOpenQuickAdd: (initialType?: TransactionType) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  categories,
  baseCurrency,
  privacyMode,
  selectedMonth,
  onSelectMonth,
  monthlyBudget = 0,
  onUpdateMonthlyBudget,
  onOpenQuickAdd,
  onNavigateToTab,
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

  // Exact live formatted date (e.g. Mon, 2 Nov 2026)
  const todayFormatted = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Month label (e.g. November 2026)
  const monthName = formatMonthDisplay(selectedMonth);

  // Available months dynamically computed from transactions and current date
  const availableMonths = getAvailableMonthsList(transactions);

  // 1. Available Balance: cumulative real balance across all transactions (income - expense)
  const availableBalance = calculateAvailableBalance(transactions, baseCurrency);

  // 2. Selected Month Transactions: income vs expense
  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const monthIncomeTransactions = monthTransactions.filter((t) => t.type === 'income');
  const monthExpenseTransactions = monthTransactions.filter((t) => t.type === 'expense');

  let totalIncome = 0;
  for (const t of monthIncomeTransactions) {
    totalIncome += t.convertedAmount;
  }

  let totalExpense = 0;
  for (const t of monthExpenseTransactions) {
    totalExpense += t.convertedAmount;
  }

  const netMonthSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netMonthSavings / totalIncome) * 100)) : 0;

  // Category slices for donut
  const categorySpendingMap = new Map<string, number>();
  for (const t of monthExpenseTransactions) {
    categorySpendingMap.set(
      t.categoryId,
      (categorySpendingMap.get(t.categoryId) || 0) + t.convertedAmount
    );
  }

  const categorySlices = categories
    .filter((c) => categorySpendingMap.has(c.id))
    .map((c) => {
      const spent = categorySpendingMap.get(c.id) || 0;
      return {
        categoryId: c.id,
        categoryName: c.name,
        categoryColor: c.color,
        categoryIcon: c.iconName,
        totalSpent: spent,
        percentage: totalExpense > 0 ? Math.round((spent / totalExpense) * 1000) / 10 : 0,
        transactionCount: monthTransactions.filter((t) => t.categoryId === c.id && t.type === 'expense').length,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  // Recent 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Controls Bar: Month Picker & Quick Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Today: {todayFormatted}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview for <span className="font-semibold text-slate-800 dark:text-slate-200">{monthName}</span>
            {!isViewingCurrentMonth && (
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
          {/* Month selector dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs shadow-xs">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              aria-label="Select month"
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900">
                  {formatMonthDisplay(m, true)}{m === liveCurrentMonthKey ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Add Income Button */}
          <button
            type="button"
            onClick={() => onOpenQuickAdd('income')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Confirmation Message Feedback Toast / Banner */}
      {feedbackMessage && (
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-medium animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 p-0.5 rounded cursor-pointer"
            aria-label="Dismiss feedback"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2-column responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column on Desktop */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Hero Card: Total Available Balance */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl shadow-slate-950/10">
            <div className="relative z-10">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <Wallet size={14} className="text-emerald-400" />
                  <span>Available Balance</span>
                </div>
                <span className="font-mono text-emerald-400 font-semibold text-[11px]">Real Net Funds</span>
              </div>

              <div className="mt-2 mb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight tabular-nums">
                    {formatCurrency(availableBalance, baseCurrency, privacyMode)}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Accumulated liquid cash across all accounts &amp; entries
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenQuickAdd('income')}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-400/30 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Add Money</span>
                </button>
              </div>

              {/* Monthly Cashflow Sub-bar */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block">
                      Income ({monthName.split(' ')[0]})
                    </span>
                    <span className="text-sm font-bold text-white tabular-nums truncate block">
                      + {formatCurrency(totalIncome, baseCurrency, privacyMode)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <TrendingDown size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block">
                      Expenses ({monthName.split(' ')[0]})
                    </span>
                    <span className="text-sm font-bold text-white tabular-nums truncate block">
                      - {formatCurrency(totalExpense, baseCurrency, privacyMode)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Metrics: Total Expenses vs Total Income Received */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Metric 1: Total Expenses (Selected Month) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Expenses
                </span>
                <button
                  type="button"
                  onClick={() => onOpenQuickAdd('expense')}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              </div>

              <div>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight block">
                  - {formatCurrency(totalExpense, baseCurrency, privacyMode)}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {monthExpenseTransactions.length} expense record{monthExpenseTransactions.length === 1 ? '' : 's'} in {monthName.split(' ')[0]}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Daily Avg: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(currentDay > 0 ? totalExpense / currentDay : 0, baseCurrency, privacyMode)}</span>/day
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('transactions')}
                  className="font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Metric 2: Total Income Received (Selected Month) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Income Received
                </span>
                <button
                  type="button"
                  onClick={() => onOpenQuickAdd('income')}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              </div>

              <div>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight block">
                  + {formatCurrency(totalIncome, baseCurrency, privacyMode)}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {monthIncomeTransactions.length} income credit{monthIncomeTransactions.length === 1 ? '' : 's'} recorded in {monthName.split(' ')[0]}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Net Savings: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(netMonthSavings, baseCurrency, privacyMode)}</span>
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {savingsRate}% saved
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => onOpenQuickAdd('income')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 transition-all text-center group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Plus size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Add Income
              </span>
              <span className="text-[10px] text-slate-400">Credit balance</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenQuickAdd('expense')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 transition-all text-center group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <TrendingDown size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Record
              </span>
              <span className="text-[10px] text-slate-400">Add expense</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('budgets')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 transition-all text-center group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Receipt size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Budgets
              </span>
              <span className="text-[10px] text-slate-400">Plan limits</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('reports')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 transition-all text-center group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <TrendingUp size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Analytics
              </span>
              <span className="text-[10px] text-slate-400">View charts</span>
            </button>
          </div>
        </div>

        {/* Right Column on Desktop */}
        <div className="lg:col-span-5 space-y-6">
          {/* Spending Breakdown Donut Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Expense Distribution
                </h2>
                <p className="text-[11px] text-slate-500">Breakdown for {monthName}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('reports')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Details</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <ExpenseDonutChart
              slices={categorySlices.slice(0, 5)}
              baseCurrency={baseCurrency}
              isMasked={privacyMode}
            />
          </div>

          {/* Recent Activity List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Recent Transactions
                </h2>
                <p className="text-[11px] text-slate-500">Latest recorded financial entries</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('transactions')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Receipt size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No transactions recorded yet
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Add income or log your daily expenses to view your recent financial activity.
                </p>
                <div className="flex items-center justify-center gap-2 mt-3.5">
                  <button
                    type="button"
                    onClick={() => onOpenQuickAdd('income')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
                  >
                    <Plus size={13} />
                    <span>Add Income</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenQuickAdd('expense')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <TrendingDown size={13} />
                    <span>Record Expense</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CategoryIcon
                          iconName={cat?.iconName || 'HelpCircle'}
                          color={cat?.color}
                          size={16}
                          className="p-2 shrink-0"
                        />
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {tx.source || tx.merchant || cat?.name || 'General Transaction'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {tx.date} · {tx.account.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs font-bold tabular-nums ${
                            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(tx.convertedAmount, baseCurrency, privacyMode)}
                        </p>
                        {tx.currency !== baseCurrency && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            {tx.amount} {tx.currency}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
