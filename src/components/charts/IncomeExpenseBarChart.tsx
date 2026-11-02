import React from 'react';
import { Transaction } from '../../types';
import {
  calculateMonthlyCashflow,
  formatCurrency,
  getCurrentMonthKey,
  formatMonthDisplay,
} from '../../utils/finance';

interface IncomeExpenseBarChartProps {
  transactions: Transaction[];
  baseCurrency: string;
  isMasked?: boolean;
  selectedMonth?: string;
}

export const IncomeExpenseBarChart: React.FC<IncomeExpenseBarChartProps> = ({
  transactions,
  baseCurrency,
  isMasked = false,
  selectedMonth,
}) => {
  // Compute the 3 consecutive months ending with selectedMonth or current month
  const targetKey = selectedMonth || getCurrentMonthKey();
  const [tYear, tMonth] = targetKey.split('-').map((v) => parseInt(v, 10));

  const months = [-2, -1, 0].map((offset) => {
    const d = new Date(tYear, tMonth - 1 + offset, 1);
    const key = getCurrentMonthKey(d);
    const label = formatMonthDisplay(key, true);
    return { key, label };
  });

  const monthData = months.map((m) => {
    const cf = calculateMonthlyCashflow(transactions, m.key, baseCurrency);
    return {
      ...m,
      income: cf.income,
      expense: cf.expense,
      net: cf.netSavings,
      rate: cf.savingsRatePercent,
    };
  });

  const maxVal = Math.max(
    ...monthData.map((d) => Math.max(d.income, d.expense)),
    1000
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-400">Monthly Comparisons</span>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            <span>Expense</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {monthData.map((m) => {
          const incHeight = Math.max(8, Math.round((m.income / maxVal) * 110));
          const expHeight = Math.max(8, Math.round((m.expense / maxVal) * 110));

          return (
            <div
              key={m.key}
              className="flex flex-col items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800"
            >
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {m.label}
              </span>

              {/* Bars container */}
              <div className="h-32 flex items-end justify-center gap-2 w-full pb-1 border-b border-slate-200 dark:border-slate-800">
                {/* Income bar */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-slate-400">
                    {formatCurrency(m.income, baseCurrency, isMasked)}
                  </span>
                  <div
                    style={{ height: `${incHeight}px` }}
                    className="w-4 bg-emerald-500 rounded-t-md transition-all duration-300 hover:brightness-110"
                    title={`Income: ${m.income}`}
                  />
                </div>

                {/* Expense bar */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-slate-400">
                    {formatCurrency(m.expense, baseCurrency, isMasked)}
                  </span>
                  <div
                    style={{ height: `${expHeight}px` }}
                    className="w-4 bg-rose-500 rounded-t-md transition-all duration-300 hover:brightness-110"
                    title={`Expense: ${m.expense}`}
                  />
                </div>
              </div>

              {/* Net footer */}
              <div className="mt-2 text-center w-full">
                <span className="text-[10px] text-slate-400 block">Net Saved</span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    m.net >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(m.net, baseCurrency, isMasked)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
