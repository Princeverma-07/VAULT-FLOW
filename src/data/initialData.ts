import { Category, RecurringBill, SavingsGoal, Transaction, UserPreferences } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'cat_housing', name: 'Housing & Rent', iconName: 'Home', color: '#6366f1', type: 'expense', budgetLimit: 0 },
  { id: 'cat_groceries', name: 'Groceries & Mart', iconName: 'ShoppingCart', color: '#10b981', type: 'expense', budgetLimit: 0 },
  { id: 'cat_dining', name: 'Dining & Food Delivery', iconName: 'Utensils', color: '#f59e0b', type: 'expense', budgetLimit: 0 },
  { id: 'cat_transport', name: 'Fuel & Metro Transit', iconName: 'Car', color: '#06b6d4', type: 'expense', budgetLimit: 0 },
  { id: 'cat_utilities', name: 'Bills, Wi-Fi & Power', iconName: 'Zap', color: '#8b5cf6', type: 'expense', budgetLimit: 0 },
  { id: 'cat_shopping', name: 'Shopping & E-Commerce', iconName: 'ShoppingBag', color: '#ec4899', type: 'expense', budgetLimit: 0 },
  { id: 'cat_health', name: 'Health & Fitness', iconName: 'HeartPulse', color: '#ef4444', type: 'expense', budgetLimit: 0 },
  { id: 'cat_entertainment', name: 'Entertainment & OTT', iconName: 'Film', color: '#14b8a6', type: 'expense', budgetLimit: 0 },
  { id: 'cat_travel', name: 'Travel & Trips', iconName: 'Plane', color: '#3b82f6', type: 'expense', budgetLimit: 0 },
  { id: 'cat_other_exp', name: 'Miscellaneous', iconName: 'HelpCircle', color: '#64748b', type: 'expense', budgetLimit: 0 },

  // Income Categories
  { id: 'cat_salary', name: 'Monthly Salary', iconName: 'Briefcase', color: '#059669', type: 'income' },
  { id: 'cat_freelance', name: 'Freelance & Consulting', iconName: 'Laptop', color: '#0d9488', type: 'income' },
  { id: 'cat_investments', name: 'Mutual Funds & Dividends', iconName: 'TrendingUp', color: '#4f46e5', type: 'income' },
  { id: 'cat_bonus', name: 'Festival Bonus & Gifts', iconName: 'Gift', color: '#d97706', type: 'income' },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

export const INITIAL_RECURRING_BILLS: RecurringBill[] = [];

export const INITIAL_USER_PREFERENCES: UserPreferences = {
  baseCurrency: 'INR',
  privacyMode: false,
  pinCode: null,
  isLocked: false,
  overallMonthlyBudget: 0,
  monthlyBudgets: {},
  safeDailyBudgetEnabled: true,
  theme: 'light',
  isPhoneFrameView: false,
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];
