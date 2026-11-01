import React, { useState } from 'react';
import { formatCurrency } from '../../utils/finance';
import { CategoryIcon } from '../CategoryIcon';

interface DonutSlice {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  totalSpent: number;
  percentage: number;
  transactionCount: number;
}

interface ExpenseDonutChartProps {
  slices: DonutSlice[];
  baseCurrency: string;
  isMasked?: boolean;
}

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  slices,
  baseCurrency,
  isMasked = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalExpense = slices.reduce((acc, s) => acc + s.totalSpent, 0);

  if (slices.length === 0 || totalExpense === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          No expense transactions recorded for this period.
        </p>
      </div>
    );
  }

  // Generate SVG arcs for Donut
  const radius = 80;
  const strokeWidth = 26;
  const center = 105;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const arcSegments = slices.map((slice, index) => {
    const fraction = slice.totalSpent / totalExpense;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += fraction;

    return {
      ...slice,
      index,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Donut graphic */}
      <div className="relative flex items-center justify-center py-2">
        <svg
          viewBox="0 0 210 210"
          className="w-48 h-48 -rotate-90 transform transition-transform"
          aria-label="Expense Breakdown Donut Chart"
        >
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {/* Slices */}
          {arcSegments.map((arc) => {
            const isHovered = hoveredIndex === arc.index;
            return (
              <circle
                key={arc.categoryId}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={arc.categoryColor}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={arc.strokeDashoffset}
                className="transition-all duration-200 cursor-pointer hover:opacity-90"
                onMouseEnter={() => setHoveredIndex(arc.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === arc.index ? null : arc.index)}
              />
            );
          })}
        </svg>

        {/* Center Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {activeSlice ? (
            <>
              <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                {activeSlice.categoryName}
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatCurrency(activeSlice.totalSpent, baseCurrency, isMasked)}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {activeSlice.percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">
                Total Expenses
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatCurrency(totalExpense, baseCurrency, isMasked)}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {slices.length} categories
              </span>
            </>
          )}
        </div>
      </div>

      {/* Category breakdown item list */}
      <div className="space-y-2.5">
        {slices.map((slice, idx) => {
          const isSelected = hoveredIndex === idx;
          return (
            <button
              key={slice.categoryId}
              type="button"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(isSelected ? null : idx)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${
                isSelected
                  ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-300 dark:ring-slate-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <CategoryIcon
                  iconName={slice.categoryIcon}
                  color={slice.categoryColor}
                  size={16}
                  className="p-1.5"
                />
                <div className="min-w-0 truncate">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {slice.categoryName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {slice.transactionCount} {slice.transactionCount === 1 ? 'transaction' : 'transactions'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(slice.totalSpent, baseCurrency, isMasked)}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  {slice.percentage}%
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
