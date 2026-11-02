import React, { useState } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Download,
  Calendar,
  CreditCard,
  Plus,
  Tag,
  ArrowUpDown,
} from 'lucide-react';
import { Category, PaymentAccount, Transaction, TransactionType } from '../../types';
import { formatCurrency, generateCSV, getAvailableMonthsList, formatMonthDisplay } from '../../utils/finance';
import { CategoryIcon } from '../CategoryIcon';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  baseCurrency: string;
  privacyMode: boolean;
  onDeleteTransaction: (id: string) => void;
  onOpenQuickAdd: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  baseCurrency,
  privacyMode,
  onDeleteTransaction,
  onOpenQuickAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | 'all'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'

  // Extract available months dynamically
  const availableMonths = getAvailableMonthsList(transactions);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (selectedAccount !== 'all' && t.account !== selectedAccount) return false;
    if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) return false;
    if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMerchant = (t.merchant || '').toLowerCase().includes(q);
      const matchNote = (t.note || '').toLowerCase().includes(q);
      const matchTags = (t.tags || []).some((tg) => tg.toLowerCase().includes(q));
      const cat = categories.find((c) => c.id === t.categoryId);
      const matchCat = (cat?.name || '').toLowerCase().includes(q);
      if (!matchMerchant && !matchNote && !matchTags && !matchCat) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Aggregate totals of filtered transactions
  let totalFilteredIncome = 0;
  let totalFilteredExpense = 0;
  for (const t of filteredTransactions) {
    if (t.type === 'income') totalFilteredIncome += t.convertedAmount;
    if (t.type === 'expense') totalFilteredExpense += t.convertedAmount;
  }

  const handleExportCSV = () => {
    const csvContent = generateCSV(filteredTransactions, categories, baseCurrency);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `moneymax_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Export Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Activity &amp; Transactions
          </h1>
          <p className="text-xs text-slate-500">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'} matching criteria
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by merchant, note, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type Segmented buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['all', 'expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  selectedType === t
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            aria-label="Filter by month"
            className="bg-slate-100 dark:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthDisplay(m, true)}
              </option>
            ))}
          </select>

          {/* Account selector */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value as any)}
            aria-label="Filter by payment account"
            className="bg-slate-100 dark:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Accounts</option>
            <option value="upi">UPI (GPay/PhonePe)</option>
            <option value="bank_account">Bank / NetBanking</option>
            <option value="credit_card">Credit Card</option>
            <option value="cash">Cash</option>
            <option value="savings">Savings</option>
          </select>

          {/* Category selector */}
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            aria-label="Filter by category"
            className="bg-slate-100 dark:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtered Summary Strip */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs font-medium">
        <span className="text-slate-600 dark:text-slate-400">
          Net View:
        </span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
            + {formatCurrency(totalFilteredIncome, baseCurrency, privacyMode)}
          </span>
          <span className="text-rose-500 dark:text-rose-400 font-semibold tabular-nums">
            - {formatCurrency(totalFilteredExpense, baseCurrency, privacyMode)}
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No transactions recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Your activity feed is empty. Record your first income credit or expense to get started.
            </p>
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Record First Transaction</span>
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-medium">No transactions match your current filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedAccount('all');
                setSelectedCategoryId('all');
                setSelectedMonth('all');
              }}
              className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon
                    iconName={cat?.iconName || 'HelpCircle'}
                    color={cat?.color}
                    size={18}
                    className="p-2 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {tx.merchant || cat?.name || 'General Transaction'}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{tx.date}</span>
                      <span>·</span>
                      <span className="capitalize">{tx.account.replace('_', ' ')}</span>
                      {tx.note && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[140px] italic">{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-xs font-bold tabular-nums ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
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

                  {/* Delete Action button */}
                  <button
                    type="button"
                    onClick={() => onDeleteTransaction(tx.id)}
                    aria-label={`Delete transaction from ${tx.merchant || cat?.name}`}
                    title="Delete record"
                    className="opacity-40 group-hover:opacity-100 hover:text-rose-500 text-slate-400 p-1.5 rounded-lg transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
