import React, { useState } from 'react';
import { Transaction } from '../../types';
import { convertCurrency, formatCurrency, getDaysInMonth } from '../../utils/finance';

interface CashflowTrendChartProps {
  transactions: Transaction[];
  yearMonth: string; // 'YYYY-MM'
  baseCurrency: string;
  isMasked?: boolean;
}

export const CashflowTrendChart: React.FC<CashflowTrendChartProps> = ({
  transactions,
  yearMonth,
  baseCurrency,
  isMasked = false,
}) => {
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = getDaysInMonth(year, month - 1);

  // Daily totals
  const dailyIncome = new Array(daysInMonth + 1).fill(0);
  const dailyExpense = new Array(daysInMonth + 1).fill(0);

  for (const t of transactions) {
    if (!t.date.startsWith(yearMonth)) continue;
    const day = parseInt(t.date.split('-')[2], 10);
    const converted = convertCurrency(t.amount, t.currency, baseCurrency);
    if (t.type === 'income') {
      dailyIncome[day] += converted;
    } else if (t.type === 'expense') {
      dailyExpense[day] += converted;
    }
  }

  // Cumulative series
  const cumulativeExpense = new Array(daysInMonth + 1).fill(0);
  const cumulativeIncome = new Array(daysInMonth + 1).fill(0);

  for (let d = 1; d <= daysInMonth; d++) {
    cumulativeExpense[d] = cumulativeExpense[d - 1] + dailyExpense[d];
    cumulativeIncome[d] = cumulativeIncome[d - 1] + dailyIncome[d];
  }

  const maxVal = Math.max(
    ...cumulativeIncome,
    ...cumulativeExpense,
    100
  );

  // SVG dimensions
  const width = 360;
  const height = 180;
  const paddingX = 24;
  const paddingY = 24;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const getX = (day: number) => paddingX + ((day - 1) / (daysInMonth - 1)) * chartW;
  const getY = (val: number) => height - paddingY - (val / maxVal) * chartH;

  // Build SVG path strings
  let expensePath = '';
  let incomePath = '';
  let expenseArea = `M ${getX(1)} ${height - paddingY}`;
  let incomeArea = `M ${getX(1)} ${height - paddingY}`;

  for (let d = 1; d <= daysInMonth; d++) {
    const x = getX(d);
    const yExp = getY(cumulativeExpense[d]);
    const yInc = getY(cumulativeIncome[d]);

    if (d === 1) {
      expensePath += `M ${x} ${yExp}`;
      incomePath += `M ${x} ${yInc}`;
    } else {
      expensePath += ` L ${x} ${yExp}`;
      incomePath += ` L ${x} ${yInc}`;
    }

    expenseArea += ` L ${x} ${yExp}`;
    incomeArea += ` L ${x} ${yInc}`;
  }

  expenseArea += ` L ${getX(daysInMonth)} ${height - paddingY} Z`;
  incomeArea += ` L ${getX(daysInMonth)} ${height - paddingY} Z`;

  const inspectDay = activeDay !== null ? activeDay : daysInMonth;

  return (
    <div className="flex flex-col gap-4">
      {/* Top summary display */}
      <div className="flex items-center justify-between text-xs px-1">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Day {inspectDay} cumulative:</span>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              + {formatCurrency(cumulativeIncome[inspectDay], baseCurrency, isMasked)}
            </span>
            <span className="font-semibold text-rose-500 dark:text-rose-400 tabular-nums">
              - {formatCurrency(cumulativeExpense[inspectDay], baseCurrency, isMasked)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Expense</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 overflow-visible"
          onMouseLeave={() => setActiveDay(null)}
        >
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-200 dark:text-slate-800"
          />
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeWidth="1"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* Area Fills */}
          <path d={incomeArea} fill="url(#incomeGrad)" />
          <path d={expenseArea} fill="url(#expenseGrad)" />

          {/* Stroke Lines */}
          <path
            d={incomePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={expensePath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive vertical cursor scrubber */}
          {activeDay !== null && (
            <g>
              <line
                x1={getX(activeDay)}
                y1={paddingY}
                x2={getX(activeDay)}
                y2={height - paddingY}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(activeDay)}
                cy={getY(cumulativeIncome[activeDay])}
                r="4"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={getX(activeDay)}
                cy={getY(cumulativeExpense[activeDay])}
                r="4"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Invisible hover capture slices */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const x = getX(d);
            const sliceW = chartW / daysInMonth;
            return (
              <rect
                key={d}
                x={x - sliceW / 2}
                y={0}
                width={sliceW}
                height={height}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActiveDay(d)}
                onTouchStart={() => setActiveDay(d)}
              />
            );
          })}
        </svg>

        {/* X Axis labels */}
        <div className="flex justify-between px-3 text-[10px] text-slate-400 font-mono mt-1">
          <span>Day 1</span>
          <span>Day 10</span>
          <span>Day 20</span>
          <span>Day {daysInMonth}</span>
        </div>
      </div>
    </div>
  );
};
