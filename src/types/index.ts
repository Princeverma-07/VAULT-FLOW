export type TransactionType = 'expense' | 'income' | 'transfer';

export type PaymentAccount = 'upi' | 'cash' | 'credit_card' | 'bank_account' | 'savings' | 'crypto';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rateToBaseUSD: number; // rate relative to 1 USD
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  color: string;
  type: 'expense' | 'income';
  budgetLimit?: number; // Monthly budget limit in base currency
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string; // ISO code, e.g., 'USD', 'EUR', 'JPY'
  convertedAmount: number; // calculated in user's base currency
  categoryId: string;
  account: PaymentAccount;
  date: string; // YYYY-MM-DD
  note?: string;
  merchant?: string;
  source?: string; // Optional income source (e.g. Salary, Freelance, Dividend, Gift)
  tags?: string[];
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  receiptAttached?: boolean;
}

export interface CategoryBudget {
  categoryId: string;
  monthlyLimit: number;
  rollover?: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadlineDate: string; // YYYY-MM-DD
  iconName: string;
  color: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  currency: string;
  categoryId: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  autoDeduct: boolean;
  iconName: string;
}

export interface UserPreferences {
  baseCurrency: string;
  privacyMode: boolean; // hide balances with dots
  pinCode: string | null; // e.g. "1234" or null if disabled
  isLocked: boolean;
  overallMonthlyBudget: number;
  monthlyBudgets?: Record<string, number>; // Persistent month-specific budgets: e.g. { '2026-10': 75000 }
  initialOpeningBalance?: number; // Starting account balance if configured
  safeDailyBudgetEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  isPhoneFrameView: boolean; // toggle phone preview frame or full-width
}
