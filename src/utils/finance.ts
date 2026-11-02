import { Category, Currency, Transaction } from '../types';

export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_CURRENCY_SYMBOL = '₹';

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToBaseUSD: 1.0 },
];

/**
 * Converts an amount from one currency to another using the pegged rates.
 */
export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string,
  currencies: Currency[] = SUPPORTED_CURRENCIES
): number {
  if (fromCode === toCode || amount === 0) return amount;
  const from = currencies.find((c) => c.code === fromCode);
  const to = currencies.find((c) => c.code === toCode);
  if (!from || !to) return amount;

  const amountInBase = amount / from.rateToBaseUSD;
  const converted = amountInBase * to.rateToBaseUSD;
  return Math.round(converted * 100) / 100;
}

/**
 * Formats a numeric amount with the Indian Rupee symbol (₹) and Indian Numbering System (en-IN).
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'INR',
  isMasked: boolean = false
): string {
  if (isMasked) return '••••••';

  const symbol = '₹';
  const absAmount = Math.abs(amount);
  const hasDecimals = absAmount % 1 !== 0;

  const formattedNum = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  if (amount < 0) {
    return `-${symbol}${formattedNum}`;
  }
  return `${symbol}${formattedNum}`;
}

/**
 * Computes safe-to-spend allowance for the current day based on monthly remaining budget.
 */
export function calculateSafeToSpendToday(
  monthlyBudget: number,
  totalSpentThisMonth: number,
  currentDayOfMonth: number,
  totalDaysInMonth: number
): {
  safeDaily: number;
  remainingBudget: number;
  remainingDays: number;
  isOverBudget: boolean;
} {
  const remainingBudget = monthlyBudget - totalSpentThisMonth;
  const remainingDays = Math.max(1, totalDaysInMonth - currentDayOfMonth + 1);

  if (remainingBudget <= 0) {
    return {
      safeDaily: 0,
      remainingBudget,
      remainingDays,
      isOverBudget: true,
    };
  }

  const safeDaily = Math.round((remainingBudget / remainingDays) * 100) / 100;
  return {
    safeDaily,
    remainingBudget,
    remainingDays,
    isOverBudget: false,
  };
}

/**
 * Evaluates budget progress and warning states
 */
export function calculateBudgetStatus(spent: number, limit: number): {
  percent: number;
  remaining: number;
  status: 'safe' | 'warning' | 'danger';
} {
  if (limit <= 0) {
    return { percent: 0, remaining: 0, status: 'safe' };
  }
  const percent = Math.min(100, Math.round((spent / limit) * 100));
  const remaining = limit - spent;

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (spent > limit) {
    status = 'danger';
  } else if (percent >= 80) {
    status = 'warning';
  }

  return { percent, remaining, status };
}

/**
 * Calculates total income, expenses, net savings, and savings rate for a given month.
 */
export function calculateMonthlyCashflow(
  transactions: Transaction[],
  yearMonth: string, // 'YYYY-MM'
  baseCurrency: string,
  currencies: Currency[] = SUPPORTED_CURRENCIES
): {
  income: number;
  expense: number;
  netSavings: number;
  savingsRatePercent: number;
} {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (!t.date.startsWith(yearMonth)) continue;
    const converted = convertCurrency(t.amount, t.currency, baseCurrency, currencies);
    if (t.type === 'income') {
      income += converted;
    } else if (t.type === 'expense') {
      expense += converted;
    }
  }

  const netSavings = income - expense;
  const savingsRatePercent = income > 0 ? Math.max(0, Math.round((netSavings / income) * 100)) : 0;

  return {
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    netSavings: Math.round(netSavings * 100) / 100,
    savingsRatePercent,
  };
}

/**
 * Computes category breakdown for expenses in a month.
 */
export function calculateCategorySpending(
  transactions: Transaction[],
  yearMonth: string,
  baseCurrency: string,
  categories: Category[],
  currencies: Currency[] = SUPPORTED_CURRENCIES
): Array<{
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  totalSpent: number;
  percentage: number;
  transactionCount: number;
}> {
  const spendingMap = new Map<string, { total: number; count: number }>();
  let grandTotal = 0;

  for (const t of transactions) {
    if (!t.date.startsWith(yearMonth) || t.type !== 'expense') continue;
    const converted = convertCurrency(t.amount, t.currency, baseCurrency, currencies);
    const existing = spendingMap.get(t.categoryId) || { total: 0, count: 0 };
    spendingMap.set(t.categoryId, {
      total: existing.total + converted,
      count: existing.count + 1,
    });
    grandTotal += converted;
  }

  const result = categories
    .filter((cat) => spendingMap.has(cat.id))
    .map((cat) => {
      const data = spendingMap.get(cat.id)!;
      const percentage = grandTotal > 0 ? Math.round((data.total / grandTotal) * 1000) / 10 : 0;
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        categoryIcon: cat.iconName,
        totalSpent: Math.round(data.total * 100) / 100,
        percentage,
        transactionCount: data.count,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  return result;
}

/**
 * Generates CSV string for export
 */
export function generateCSV(
  transactions: Transaction[],
  categories: Category[],
  baseCurrency: string,
  currencies: Currency[] = SUPPORTED_CURRENCIES
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = ['Date', 'Type', 'Category', 'Merchant', 'Note', 'Amount', 'Currency', `Converted (${baseCurrency})`, 'Account'];

  const rows = transactions.map((t) => {
    const converted = convertCurrency(t.amount, t.currency, baseCurrency, currencies);
    const catName = categoryMap.get(t.categoryId) || 'Uncategorized';
    return [
      t.date,
      t.type.toUpperCase(),
      `"${catName.replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.currency,
      converted.toFixed(2),
      t.account,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Helper to get days in month
 */
export function getDaysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates current total available balance across all accounts and transactions.
 * Total Available Balance = Initial Opening Balance + All Income - All Expenses.
 * Transfers between user accounts do not alter total net available balance.
 */
export function calculateAvailableBalance(
  transactions: Transaction[],
  baseCurrency: string = DEFAULT_CURRENCY,
  initialOpeningBalance: number = 0,
  currencies: Currency[] = SUPPORTED_CURRENCIES
): number {
  let balance = initialOpeningBalance;
  for (const t of transactions) {
    const converted = convertCurrency(t.amount, t.currency, baseCurrency, currencies);
    if (t.type === 'income') {
      balance += converted;
    } else if (t.type === 'expense') {
      balance -= converted;
    }
  }
  return Math.round(balance * 100) / 100;
}

/**
 * Returns the effective monthly budget for a given month.
 * Uses month-specific budget if set; otherwise falls back to overallMonthlyBudget or 75000.
 */
export function getEffectiveMonthlyBudget(
  preferences: { overallMonthlyBudget?: number; monthlyBudgets?: Record<string, number> },
  yearMonth: string
): number {
  if (preferences.monthlyBudgets && typeof preferences.monthlyBudgets[yearMonth] === 'number') {
    return preferences.monthlyBudgets[yearMonth];
  }
  return typeof preferences.overallMonthlyBudget === 'number' ? preferences.overallMonthlyBudget : 0;
}

/**
 * Returns the current month key in 'YYYY-MM' format based on local system time.
 */
export function getCurrentMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns formatted month display string e.g. "November 2026" or "Nov 2026"
 */
export function formatMonthDisplay(yearMonth: string, short: boolean = false): string {
  const parts = yearMonth.split('-');
  if (parts.length === 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    if (!isNaN(y) && !isNaN(m)) {
      const d = new Date(y, m, 1);
      return d.toLocaleDateString('en-US', {
        month: short ? 'short' : 'long',
        year: 'numeric',
      });
    }
  }
  return yearMonth;
}

/**
 * Computes a list of available months for selection:
 * Includes current month, recent months, and all months from recorded transactions.
 */
export function getAvailableMonthsList(
  transactions: Transaction[] = [],
  baseDate: Date = new Date(),
  pastMonthsCount: number = 4
): string[] {
  const monthSet = new Set<string>();

  // Add past N months from base date
  for (let i = 0; i <= pastMonthsCount; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    monthSet.add(getCurrentMonthKey(d));
  }

  // Add next month for forward budget planning
  const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
  monthSet.add(getCurrentMonthKey(nextMonth));

  // Add any transaction months
  for (const t of transactions) {
    if (t.date && t.date.length >= 7) {
      monthSet.add(t.date.substring(0, 7));
    }
  }

  return Array.from(monthSet).sort().reverse();
}


