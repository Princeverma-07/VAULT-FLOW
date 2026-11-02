import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  CreditCard,
  Building2,
  Wallet,
  PiggyBank,
  TrendingUp,
  Percent,
  Smartphone,
} from 'lucide-react';
import { Category, PaymentAccount, Transaction } from '../../types';
import {
  calculateCategorySpending,
  calculateMonthlyCashflow,
  formatCurrency,
  getAvailableMonthsList,
  formatMonthDisplay,
} from '../../utils/finance';
import { CashflowTrendChart } from '../charts/CashflowTrendChart';
import { ExpenseDonutChart } from '../charts/ExpenseDonutChart';
import { IncomeExpenseBarChart } from '../charts/IncomeExpenseBarChart';
import { ExportReportModal } from '../ExportReportModal';

interface ReportsViewProps {
  transactions: Transaction[];
  categories: Category[];
  baseCurrency: string;
  privacyMode: boolean;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  categories,
  baseCurrency,
  privacyMode,
  selectedMonth,
  onSelectMonth,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Available months dynamically computed from transactions
  const allMonths = getAvailableMonthsList(transactions);
  const months = allMonths.includes(selectedMonth)
    ? allMonths.slice(0, 4)
    : [selectedMonth, ...allMonths.filter((m) => m !== selectedMonth)].slice(0, 4);

  // Cashflow for selected month
  const cashflow = calculateMonthlyCashflow(transactions, selectedMonth, baseCurrency);

  // Category breakdown for selected month
  const categorySlices = calculateCategorySpending(
    transactions,
    selectedMonth,
    baseCurrency,
    categories
  );

  // Spending by payment method
  const accountSpendingMap: Record<PaymentAccount, number> = {
    upi: 0,
    credit_card: 0,
    bank_account: 0,
    cash: 0,
    savings: 0,
    crypto: 0,
  };

  const monthExpenses = transactions.filter(
    (t) => t.date.startsWith(selectedMonth) && t.type === 'expense'
  );

  for (const t of monthExpenses) {
    if (t.account in accountSpendingMap) {
      accountSpendingMap[t.account] += t.convertedAmount;
    }
  }

  const totalExpense = cashflow.expense;

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports &amp; Analytics
          </h1>
          <p className="text-xs text-slate-500">Visual financial data &amp; spending breakdowns</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {months.map((m) => {
              const isSelected = selectedMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMonth(m)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {formatMonthDisplay(m, true)}
                </button>
              );
            })}
          </div>

          {/* Statement Export Modal trigger */}
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <FileText size={14} />
            <span>Statement</span>
          </button>
        </div>
      </div>

      {/* KPI 4-Card Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Income</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
            {formatCurrency(cashflow.income, baseCurrency, privacyMode)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Expense</span>
          <span className="text-base font-bold text-rose-500 dark:text-rose-400 tabular-nums mt-0.5 block">
            {formatCurrency(cashflow.expense, baseCurrency, privacyMode)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Cashflow</span>
          <span className={`text-base font-bold tabular-nums mt-0.5 block ${
            cashflow.netSavings >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'
          }`}>
            {formatCurrency(cashflow.netSavings, baseCurrency, privacyMode)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Savings Rate</span>
          <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
            {cashflow.savingsRatePercent}%
          </span>
        </div>
      </div>

      {/* Cumulative Cashflow Area Trend Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Spending &amp; Income Trajectory ({selectedMonth})
          </h2>
          <p className="text-[11px] text-slate-500">Cumulative day-by-day cashflow progression</p>
        </div>

        <CashflowTrendChart
          transactions={transactions}
          yearMonth={selectedMonth}
          baseCurrency={baseCurrency}
          isMasked={privacyMode}
        />
      </div>

      {/* Expense Donut Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Category Breakdown ({selectedMonth})
          </h2>
          <p className="text-[11px] text-slate-500">Share of monthly expense by category</p>
        </div>

        <ExpenseDonutChart
          slices={categorySlices}
          baseCurrency={baseCurrency}
          isMasked={privacyMode}
        />
      </div>

      {/* Multi-month comparison */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Month-over-Month Velocity
          </h2>
          <p className="text-[11px] text-slate-500">Side-by-side comparison of recent quarters</p>
        </div>

        <IncomeExpenseBarChart
          transactions={transactions}
          baseCurrency={baseCurrency}
          isMasked={privacyMode}
          selectedMonth={selectedMonth}
        />
      </div>

      {/* Spending by Payment Account Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Payment Method Allocation
          </h2>
          <p className="text-[11px] text-slate-500">Spending channels utilized this cycle</p>
        </div>

        <div className="space-y-3">
          {[
            { id: 'upi', label: 'UPI (GPay / PhonePe / Paytm)', icon: Smartphone, amount: accountSpendingMap.upi },
            { id: 'bank_account', label: 'Bank Direct / NetBanking', icon: Building2, amount: accountSpendingMap.bank_account },
            { id: 'credit_card', label: 'Credit Cards', icon: CreditCard, amount: accountSpendingMap.credit_card },
            { id: 'cash', label: 'Cash & Physical', icon: Wallet, amount: accountSpendingMap.cash },
            { id: 'savings', label: 'Savings Reserve', icon: PiggyBank, amount: accountSpendingMap.savings },
          ].map((acc) => {
            const Icon = acc.icon;
            const pct = totalExpense > 0 ? Math.round((acc.amount / totalExpense) * 100) : 0;

            return (
              <div key={acc.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{acc.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(acc.amount, baseCurrency, privacyMode)}
                    </span>
                    <span className="text-[11px] text-slate-400 w-9 text-right tabular-nums">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-slate-800 dark:bg-slate-300 rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statement Export Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        transactions={transactions}
        categories={categories}
        baseCurrency={baseCurrency}
        selectedMonth={selectedMonth}
        cashflow={cashflow}
      />
    </div>
  );
};
