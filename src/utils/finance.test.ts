import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertCurrency,
  formatCurrency,
  calculateSafeToSpendToday,
  calculateBudgetStatus,
  calculateMonthlyCashflow,
  calculateCategorySpending,
  calculateAvailableBalance,
  getEffectiveMonthlyBudget,
  SUPPORTED_CURRENCIES,
} from './finance';
import { Category, Transaction } from '../types';

test('convertCurrency correctly converts when rates are provided and maintains INR identity', () => {
  const testCurrencies = [
    { code: 'USD', symbol: '$', name: 'USD', rateToBaseUSD: 1.0 },
    { code: 'EUR', symbol: '€', name: 'EUR', rateToBaseUSD: 0.92 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToBaseUSD: 86.5 },
  ];
  // 100 USD to EUR (rate 0.92) -> 92
  const eur = convertCurrency(100, 'USD', 'EUR', testCurrencies);
  assert.equal(eur, 92);

  // 92 EUR to USD -> 92 / 0.92 = 100
  const usd = convertCurrency(92, 'EUR', 'USD', testCurrencies);
  assert.equal(usd, 100);

  // Same currency returns exact amount
  assert.equal(convertCurrency(5000, 'INR', 'INR'), 5000);
});

test('formatCurrency handles Rupee symbol, en-IN formatting, masking, and decimals', () => {
  assert.equal(formatCurrency(125000, 'INR'), '₹1,25,000');
  assert.equal(formatCurrency(1250.5, 'INR'), '₹1,250.50');
  assert.equal(formatCurrency(100, 'INR', true), '••••••');
  assert.equal(formatCurrency(-4500, 'INR'), '-₹4,500');
});

test('calculateSafeToSpendToday distributes remaining budget evenly across days', () => {
  // Monthly budget 1000, spent 400 = 600 remaining. Day 11 of 30 => remaining days = 30 - 11 + 1 = 20.
  // 600 / 20 = 30 per day
  const result = calculateSafeToSpendToday(1000, 400, 11, 30);
  assert.equal(result.remainingBudget, 600);
  assert.equal(result.remainingDays, 20);
  assert.equal(result.safeDaily, 30);
  assert.equal(result.isOverBudget, false);

  // Over budget case
  const overResult = calculateSafeToSpendToday(1000, 1100, 15, 30);
  assert.equal(overResult.isOverBudget, true);
  assert.equal(overResult.safeDaily, 0);
  assert.equal(overResult.remainingBudget, -100);
});

test('calculateBudgetStatus classifies safe, warning, and danger', () => {
  assert.deepEqual(calculateBudgetStatus(300, 1000), {
    percent: 30,
    remaining: 700,
    status: 'safe',
  });

  assert.deepEqual(calculateBudgetStatus(850, 1000), {
    percent: 85,
    remaining: 150,
    status: 'warning',
  });

  assert.deepEqual(calculateBudgetStatus(1050, 1000), {
    percent: 100,
    remaining: -50,
    status: 'danger',
  });
});

test('calculateMonthlyCashflow computes total income, expense, net savings, and savings rate', () => {
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'income',
      amount: 40000,
      currency: 'INR',
      convertedAmount: 40000,
      categoryId: 'cat_salary',
      account: 'bank_account',
      date: '2026-10-01',
    },
    {
      id: '2',
      type: 'expense',
      amount: 12000,
      currency: 'INR',
      convertedAmount: 12000,
      categoryId: 'cat_rent',
      account: 'bank_account',
      date: '2026-10-02',
    },
    {
      id: '3',
      type: 'expense',
      amount: 3000,
      currency: 'INR',
      convertedAmount: 3000,
      categoryId: 'cat_food',
      account: 'credit_card',
      date: '2026-10-05',
    },
    {
      id: '4',
      type: 'expense',
      amount: 5000,
      currency: 'INR',
      convertedAmount: 5000,
      categoryId: 'cat_other',
      account: 'cash',
      date: '2026-09-28', // Different month! Should be excluded
    },
  ];

  const cashflow = calculateMonthlyCashflow(transactions, '2026-10', 'INR', SUPPORTED_CURRENCIES);
  assert.equal(cashflow.income, 40000);
  assert.equal(cashflow.expense, 15000);
  assert.equal(cashflow.netSavings, 25000);
  // (25000 / 40000) * 100 = 62.5% -> 63%
  assert.equal(cashflow.savingsRatePercent, 63);
});

test('calculateCategorySpending aggregates and sorts categories by spend descending', () => {
  const categories: Category[] = [
    { id: 'food', name: 'Food & Dining', iconName: 'Utensils', color: '#10b981', type: 'expense' },
    { id: 'rent', name: 'Housing & Rent', iconName: 'Home', color: '#6366f1', type: 'expense' },
  ];

  const transactions: Transaction[] = [
    { id: '1', type: 'expense', amount: 1500, currency: 'INR', convertedAmount: 1500, categoryId: 'food', account: 'credit_card', date: '2026-10-02' },
    { id: '2', type: 'expense', amount: 500, currency: 'INR', convertedAmount: 500, categoryId: 'food', account: 'cash', date: '2026-10-04' },
    { id: '3', type: 'expense', amount: 12000, currency: 'INR', convertedAmount: 12000, categoryId: 'rent', account: 'bank_account', date: '2026-10-01' },
  ];

  const breakdown = calculateCategorySpending(transactions, '2026-10', 'INR', categories, SUPPORTED_CURRENCIES);
  assert.equal(breakdown.length, 2);
  assert.equal(breakdown[0].categoryId, 'rent');
  assert.equal(breakdown[0].totalSpent, 12000);
  assert.equal(breakdown[1].categoryId, 'food');
  assert.equal(breakdown[1].totalSpent, 2000);
  assert.equal(breakdown[1].transactionCount, 2);
});

test('calculateAvailableBalance correctly calculates cumulative balance from multiple income additions and expenses', () => {
  const txs: Transaction[] = [
    { id: '1', type: 'income', amount: 1000, currency: 'INR', convertedAmount: 1000, categoryId: 'cat_salary', account: 'bank_account', date: '2026-10-01' },
    { id: '2', type: 'expense', amount: 200, currency: 'INR', convertedAmount: 200, categoryId: 'cat_dining', account: 'upi', date: '2026-10-05' },
    { id: '3', type: 'income', amount: 500, currency: 'INR', convertedAmount: 500, categoryId: 'cat_freelance', account: 'bank_account', date: '2026-10-10' },
  ];

  // Available balance: 1000 - 200 + 500 = 1300
  const balance = calculateAvailableBalance(txs, 'INR');
  assert.equal(balance, 1300);
});

test('getEffectiveMonthlyBudget retrieves month-specific budget or falls back to overall budget', () => {
  const prefs = {
    overallMonthlyBudget: 5000,
    monthlyBudgets: {
      '2026-10': 6000,
    },
  };

  assert.equal(getEffectiveMonthlyBudget(prefs, '2026-10'), 6000);
  assert.equal(getEffectiveMonthlyBudget(prefs, '2026-11'), 5000);
});

test('Requirement #6 full lifecycle: Day 1 income, Day 5 expense, Day 10 income, Day 15 budget edit', () => {
  let budget = 5000;
  const txs: Transaction[] = [];

  // Day 1: receive ₹1,000. Budget stays ₹5,000
  txs.push({
    id: 'd1',
    type: 'income',
    amount: 1000,
    currency: 'INR',
    convertedAmount: 1000,
    categoryId: 'cat_freelance',
    account: 'bank_account',
    date: '2026-10-01',
    source: 'Freelance Advance',
  });

  let availableBalance = calculateAvailableBalance(txs, 'INR');
  let monthCashflow = calculateMonthlyCashflow(txs, '2026-10', 'INR');
  assert.equal(budget, 5000, 'Monthly budget remains 5000');
  assert.equal(monthCashflow.income, 1000, 'Monthly income is 1000');
  assert.equal(availableBalance, 1000, 'Available balance is 1000');

  // Day 5: spend ₹200. Remaining balance updates, budget remains ₹5,000
  txs.push({
    id: 'd5',
    type: 'expense',
    amount: 200,
    currency: 'INR',
    convertedAmount: 200,
    categoryId: 'cat_dining',
    account: 'upi',
    date: '2026-10-05',
    merchant: 'Cafe',
  });

  availableBalance = calculateAvailableBalance(txs, 'INR');
  monthCashflow = calculateMonthlyCashflow(txs, '2026-10', 'INR');
  const safeDaily = calculateSafeToSpendToday(budget, monthCashflow.expense, 5, 31);
  assert.equal(budget, 5000, 'Monthly budget still 5000');
  assert.equal(monthCashflow.expense, 200, 'Monthly expense is 200');
  assert.equal(availableBalance, 800, 'Available balance decreased by 200 to 800');
  assert.equal(safeDaily.remainingBudget, 4800, 'Remaining budget is 4800');

  // Day 10: receive another ₹500. Total income increases by 500, monthly budget stays ₹5,000
  txs.push({
    id: 'd10',
    type: 'income',
    amount: 500,
    currency: 'INR',
    convertedAmount: 500,
    categoryId: 'cat_bonus',
    account: 'upi',
    date: '2026-10-10',
    source: 'Gift',
  });

  availableBalance = calculateAvailableBalance(txs, 'INR');
  monthCashflow = calculateMonthlyCashflow(txs, '2026-10', 'INR');
  assert.equal(budget, 5000, 'Monthly budget stays 5000 despite new income');
  assert.equal(monthCashflow.income, 1500, 'Total income increased to 1500');
  assert.equal(availableBalance, 1300, 'Available balance is now 1300');

  // Day 15: manually change monthly budget to ₹6,000
  budget = 6000;
  // Available balance and income are unchanged!
  assert.equal(budget, 6000, 'New budget is 6000');
  assert.equal(monthCashflow.income, 1500, 'Income still 1500');
  assert.equal(availableBalance, 1300, 'Available balance still 1300');
  const safeDailyUpdated = calculateSafeToSpendToday(budget, monthCashflow.expense, 15, 31);
  assert.equal(safeDailyUpdated.remainingBudget, 5800, 'Remaining budget is 6000 - 200 = 5800');
});

test('Clean zero state: handles empty transactions and zero budget without division by zero or errors', () => {
  const emptyTxs: Transaction[] = [];
  const balance = calculateAvailableBalance(emptyTxs, 'INR');
  assert.equal(balance, 0, 'Empty transactions yield 0 balance');

  const cashflow = calculateMonthlyCashflow(emptyTxs, '2026-10', 'INR');
  assert.equal(cashflow.income, 0);
  assert.equal(cashflow.expense, 0);
  assert.equal(cashflow.netSavings, 0);
  assert.equal(cashflow.savingsRatePercent, 0);

  const budgetStatus = calculateBudgetStatus(0, 0);
  assert.equal(budgetStatus.percent, 0);
  assert.equal(budgetStatus.remaining, 0);
  assert.equal(budgetStatus.status, 'safe');

  const safeDaily = calculateSafeToSpendToday(0, 0, 1, 31);
  assert.equal(safeDaily.safeDaily, 0);
  assert.equal(safeDaily.remainingBudget, 0);
  assert.equal(safeDaily.isOverBudget, true);
});

