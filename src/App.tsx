import React, { useState, useEffect } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_RECURRING_BILLS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_TRANSACTIONS,
  INITIAL_USER_PREFERENCES,
} from './data/initialData';
import { Category, RecurringBill, SavingsGoal, Transaction, TransactionType, UserPreferences } from './types';
import { convertCurrency, getEffectiveMonthlyBudget, SUPPORTED_CURRENCIES } from './utils/finance';
import { Header } from './components/Header';
import { BottomNav, TabId } from './components/BottomNav';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { BudgetsView } from './components/views/BudgetsView';
import { ReportsView } from './components/views/ReportsView';
import { PlanningView } from './components/views/PlanningView';
import { QuickAddModal } from './components/QuickAddModal';
import { PinLockModal } from './components/PinLockModal';
import { CategoryManageModal } from './components/CategoryManageModal';
import { PrivacyPolicyModal } from './components/legal/PrivacyPolicyModal';
import { TermsConditionsModal } from './components/legal/TermsConditionsModal';

export default function App() {
  // Clean user state without any demo data
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('vf_clean_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('vf_clean_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CATEGORIES;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('vf_clean_goals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_SAVINGS_GOALS;
  });

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
    const saved = localStorage.getItem('vf_clean_recurring');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_RECURRING_BILLS;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('vf_clean_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.overallMonthlyBudget === 75000) {
          parsed.overallMonthlyBudget = 0;
          parsed.monthlyBudgets = {};
        }
        if (parsed.baseCurrency === 'INR') return parsed;
      } catch (e) {}
    }
    return INITIAL_USER_PREFERENCES;
  });

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<TransactionType>('expense');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isTermsConditionsOpen, setIsTermsConditionsOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('vf_clean_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('vf_clean_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('vf_clean_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem('vf_clean_recurring', JSON.stringify(recurringBills));
  }, [recurringBills]);

  useEffect(() => {
    localStorage.setItem('vf_clean_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Dark mode effect
  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Handlers
  const handleSelectCurrency = (newBase: string) => {
    // Recalculate converted amounts of all transactions to new base currency
    const updated = transactions.map((t) => ({
      ...t,
      convertedAmount: convertCurrency(t.amount, t.currency, newBase, SUPPORTED_CURRENCIES),
    }));
    setTransactions(updated);
    setPreferences((prev) => ({ ...prev, baseCurrency: newBase }));
  };

  const handleTogglePrivacy = () => {
    setPreferences((prev) => ({ ...prev, privacyMode: !prev.privacyMode }));
  };

  const handleToggleDarkMode = () => {
    setPreferences((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleTogglePhoneFrame = () => {
    setPreferences((prev) => ({
      ...prev,
      isPhoneFrameView: !prev.isPhoneFrameView,
    }));
  };

  const handleLockApp = () => {
    if (preferences.pinCode) {
      setPreferences((prev) => ({ ...prev, isLocked: true }));
    }
  };

  const handleUnlockApp = () => {
    setPreferences((prev) => ({ ...prev, isLocked: false }));
  };

  const handleAddTransaction = (newTxData: Omit<Transaction, 'id' | 'convertedAmount'>) => {
    const convertedAmount = convertCurrency(
      newTxData.amount,
      newTxData.currency,
      preferences.baseCurrency,
      SUPPORTED_CURRENCIES
    );

    const newTx: Transaction = {
      ...newTxData,
      id: `tx_${Date.now()}`,
      convertedAmount,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenQuickAdd = (type: TransactionType = 'expense') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  };

  const handleUpdateMonthlyBudget = (limit: number, targetMonth?: string) => {
    const monthKey = targetMonth || selectedMonth;
    setPreferences((prev) => ({
      ...prev,
      overallMonthlyBudget: limit,
      monthlyBudgets: {
        ...(prev.monthlyBudgets || {}),
        [monthKey]: limit,
      },
    }));
  };

  const handleUpdateCategoryBudget = (catId: string, limit: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, budgetLimit: limit } : c))
    );
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const handleAddSavingsGoal = (newGoal: SavingsGoal) => {
    setSavingsGoals((prev) => [...prev, newGoal]);
  };

  const handleDepositToGoal = (goalId: string, amount: number) => {
    setSavingsGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      )
    );
    // Also record a savings transfer transaction
    handleAddTransaction({
      type: 'transfer',
      amount,
      currency: preferences.baseCurrency,
      categoryId: 'cat_investments',
      account: 'savings',
      date: new Date().toISOString().split('T')[0],
      merchant: 'Goal Savings Deposit',
      note: `Contribution toward savings goal`,
    });
  };

  const handleResetData = () => {
    if (window.confirm('Clear all transactions, budgets, and savings goals? This will reset the app to an empty clean slate.')) {
      setTransactions([]);
      setCategories(INITIAL_CATEGORIES);
      setSavingsGoals([]);
      setRecurringBills([]);
      setPreferences(INITIAL_USER_PREFERENCES);
      localStorage.clear();
      localStorage.setItem('vaultflow_demo_purged_v1', 'true');
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      transactions,
      categories,
      savingsGoals,
      recurringBills,
      preferences,
      version: 1,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vaultflow_backup_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
        if (data.savingsGoals && Array.isArray(data.savingsGoals)) {
          setSavingsGoals(data.savingsGoals);
        }
        if (data.recurringBills && Array.isArray(data.recurringBills)) {
          setRecurringBills(data.recurringBills);
        }
        if (data.preferences) {
          setPreferences(data.preferences);
        }
        alert('Vault successfully restored from backup file!');
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center transition-colors">
      {/* PIN Lock Screen if locked */}
      {preferences.pinCode && preferences.isLocked && (
        <PinLockModal
          isOpen={true}
          correctPin={preferences.pinCode}
          onUnlock={handleUnlockApp}
        />
      )}

      {/* Main Container - either responsive full width or simulated mobile device */}
      <div
        className={`w-full min-h-screen flex flex-col transition-all duration-300 ${
          preferences.isPhoneFrameView
            ? 'max-w-[420px] my-4 rounded-[42px] border-[8px] border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 relative ring-1 ring-slate-700/50'
            : 'max-w-5xl bg-white dark:bg-slate-900 shadow-sm'
        }`}
      >
        {/* Simulated Mobile Status Bar (Visible in phone frame view) */}
        {preferences.isPhoneFrameView && (
          <div className="pt-2 px-6 pb-1 bg-white dark:bg-slate-900 flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-200 select-none border-b border-slate-100 dark:border-slate-800/60">
            <span>9:41</span>
            {/* Dynamic Island pill */}
            <div className="w-20 h-4 bg-slate-900 dark:bg-black rounded-full mx-auto" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px]">5G</span>
              <div className="w-5 h-2.5 border border-slate-800 dark:border-slate-200 rounded-sm p-0.5">
                <div className="w-3 h-full bg-slate-800 dark:bg-slate-200 rounded-xs" />
              </div>
            </div>
          </div>
        )}

        {/* Top Header */}
        <Header
          baseCurrency={preferences.baseCurrency}
          onSelectCurrency={handleSelectCurrency}
          privacyMode={preferences.privacyMode}
          onTogglePrivacy={handleTogglePrivacy}
          isDarkMode={preferences.theme === 'dark'}
          onToggleDarkMode={handleToggleDarkMode}
          isPhoneFrame={preferences.isPhoneFrameView}
          onTogglePhoneFrame={handleTogglePhoneFrame}
          onLockApp={handleLockApp}
          hasPin={Boolean(preferences.pinCode)}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {activeTab === 'home' && (
            <DashboardView
              transactions={transactions}
              categories={categories}
              baseCurrency={preferences.baseCurrency}
              privacyMode={preferences.privacyMode}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              monthlyBudget={getEffectiveMonthlyBudget(preferences, selectedMonth)}
              onUpdateMonthlyBudget={handleUpdateMonthlyBudget}
              onOpenQuickAdd={handleOpenQuickAdd}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              categories={categories}
              baseCurrency={preferences.baseCurrency}
              privacyMode={preferences.privacyMode}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              transactions={transactions}
              categories={categories}
              baseCurrency={preferences.baseCurrency}
              privacyMode={preferences.privacyMode}
              selectedMonth={selectedMonth}
              monthlyBudget={getEffectiveMonthlyBudget(preferences, selectedMonth)}
              onUpdateMonthlyBudget={handleUpdateMonthlyBudget}
              onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              categories={categories}
              baseCurrency={preferences.baseCurrency}
              privacyMode={preferences.privacyMode}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
            />
          )}

          {activeTab === 'planning' && (
            <PlanningView
              savingsGoals={savingsGoals}
              recurringBills={recurringBills}
              preferences={preferences}
              baseCurrency={preferences.baseCurrency}
              privacyMode={preferences.privacyMode}
              onAddSavingsGoal={handleAddSavingsGoal}
              onDepositToGoal={handleDepositToGoal}
              onUpdatePreferences={(p) => setPreferences((prev) => ({ ...prev, ...p }))}
              onResetData={handleResetData}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
              onOpenTermsConditions={() => setIsTermsConditionsOpen(true)}
            />
          )}
        </main>

        {/* Quiet, Clean Unboxed Footer with Legal Links */}
        <footer className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mb-16">
          <span>VaultFlow Personal Finance (INR)</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsPrivacyPolicyOpen(true)}
              className="hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setIsTermsConditionsOpen(true)}
              className="hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
          </div>
        </footer>

        {/* Bottom Ergonomic Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
        />
      </div>

      {/* Quick Add Transaction Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddTransaction={handleAddTransaction}
        categories={categories}
        baseCurrency={preferences.baseCurrency}
        initialType={quickAddType}
      />

      {/* Category & Budget Limit Manager Modal */}
      <CategoryManageModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategoryBudget={handleUpdateCategoryBudget}
        baseCurrency={preferences.baseCurrency}
      />

      {/* Privacy Policy Legal Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />

      {/* Terms & Conditions Legal Modal */}
      <TermsConditionsModal
        isOpen={isTermsConditionsOpen}
        onClose={() => setIsTermsConditionsOpen(false)}
      />
    </div>
  );
}
