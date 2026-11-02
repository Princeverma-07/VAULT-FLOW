import React, { useState } from 'react';
import {
  X,
  Plus,
  Camera,
  Check,
  Calendar,
  CreditCard,
  Building2,
  Wallet as WalletIcon,
  PiggyBank,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { Category, PaymentAccount, Transaction, TransactionType } from '../types';
import { convertCurrency, formatDateISO, formatCurrency, SUPPORTED_CURRENCIES } from '../utils/finance';
import { CategoryIcon } from './CategoryIcon';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'convertedAmount'>) => void;
  categories: Category[];
  baseCurrency: string;
  initialType?: TransactionType;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  categories,
  baseCurrency,
  initialType = 'expense',
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(baseCurrency);
  const [categoryId, setCategoryId] = useState<string>('');
  const [account, setAccount] = useState<PaymentAccount>('bank_account');
  const [date, setDate] = useState<string>(formatDateISO(new Date()));
  const [merchant, setMerchant] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [receiptAttached, setReceiptAttached] = useState<boolean>(false);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setAccount(initialType === 'income' ? 'bank_account' : 'upi');
      setCategoryId('');
      setAmountStr('');
      setMerchant('');
      setSource('');
      setNote('');
      setReceiptAttached(false);
      setReceiptFileName('');
      setErrorMessage('');
      setDate(formatDateISO(new Date()));
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  // Filter categories by selected type
  const availableCategories = categories.filter((c) =>
    type === 'transfer' ? true : c.type === type
  );

  // Set default category if not selected or invalid for this type
  const currentCategory = availableCategories.find((c) => c.id === categoryId) || availableCategories[0];
  const activeCategoryId = currentCategory?.id || '';

  const parsedAmount = parseFloat(amountStr) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than ₹0.');
      return;
    }

    const effectiveMerchant = type === 'income' 
      ? (source.trim() || merchant.trim() || undefined)
      : (merchant.trim() || undefined);

    onAddTransaction({
      type,
      amount: parsedAmount,
      currency: selectedCurrency,
      categoryId: activeCategoryId,
      account,
      date,
      merchant: effectiveMerchant,
      source: type === 'income' ? (source.trim() || undefined) : undefined,
      note: note.trim() || undefined,
      receiptAttached,
    });

    // Reset & close
    setAmountStr('');
    setMerchant('');
    setSource('');
    setNote('');
    setReceiptAttached(false);
    setErrorMessage('');
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptAttached(true);
      setReceiptFileName(file.name);
      if (!note.trim()) {
        setNote(`Receipt: ${file.name}`);
      }
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptAttached(false);
    setReceiptFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-sm mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="quick-add-title" className="text-base font-bold text-slate-900 dark:text-white">
              {type === 'income' ? 'Add Money / Record Income' : 'Record Transaction'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {type === 'income'
                ? 'Credit funds to your Available Balance'
                : 'Log spending against monthly limits'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Transaction Type Segmented Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Income / Add Money
            </button>
            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setCategoryId('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'transfer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Income Informational Note */}
          {type === 'income' && (
            <div className="px-3.5 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <span className="font-bold">Flexible Income:</span> Add money anytime in any amount. New funds increase your Total Available Balance and Monthly Total Income without altering your saved Monthly Budget limit.
            </div>
          )}

          {/* Amount Input Box (Rupees Only) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <label htmlFor="transaction-amount-input" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Amount (₹ Rupees)
            </label>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-3xl font-extrabold text-slate-400 dark:text-slate-500 font-mono select-none">
                ₹
              </span>

              {/* Amount numeric input */}
              <input
                id="transaction-amount-input"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMessage('');
                }}
                autoFocus
                required
                className="w-48 text-3xl font-extrabold text-slate-900 dark:text-white bg-transparent text-center focus:outline-none tabular-nums placeholder:text-slate-300 dark:placeholder:text-slate-700"
              />
            </div>

            {/* Quick Rupee amount chips */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              {['100', '500', '1000', '2000'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setAmountStr(chip)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                >
                  +₹{chip}
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-500 font-medium text-center">{errorMessage}</p>
          )}

          {/* Category Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
              {availableCategories.map((cat) => {
                const isSelected = cat.id === activeCategoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CategoryIcon iconName={cat.iconName} color={cat.color} size={18} className="p-1 mb-1" />
                    <span className="text-[11px] font-medium leading-tight truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account / Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Account / Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'upi' as PaymentAccount, label: 'UPI (GPay/PhonePe)', icon: Smartphone },
                { id: 'bank_account' as PaymentAccount, label: 'Bank / NetBanking', icon: Building2 },
                { id: 'credit_card' as PaymentAccount, label: 'Credit Card', icon: CreditCard },
                { id: 'cash' as PaymentAccount, label: 'Cash', icon: WalletIcon },
                { id: 'savings' as PaymentAccount, label: 'Savings', icon: PiggyBank },
              ].map((acc) => {
                const isSelected = account === acc.id;
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccount(acc.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date, Merchant / Source & Note Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-date-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <div className="relative">
                <input
                  id="tx-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tx-source-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {type === 'income' ? 'Income Source / From (Optional)' : 'Merchant / Payee (Optional)'}
              </label>
              <input
                id="tx-source-input"
                type="text"
                placeholder={type === 'income' ? 'e.g. Tech Salary, Client payment, Bonus' : 'e.g. Starbucks, Uber, Netflix'}
                value={type === 'income' ? source : merchant}
                onChange={(e) => {
                  if (type === 'income') {
                    setSource(e.target.value);
                  } else {
                    setMerchant(e.target.value);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Quick Income Source Suggestions if type is income */}
          {type === 'income' && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Quick Sources:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Monthly Salary', 'Freelance Project', 'Client Retainer', 'Mutual Fund Dividend', 'Festival Bonus', 'Gift', 'Rental Yield', 'Cashback'].map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSource(src)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="tx-note-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note / Reference (Optional)
            </label>
            <input
              id="tx-note-input"
              type="text"
              placeholder={type === 'income' ? 'e.g. NEFT transfer reference, October invoice' : 'e.g. Team lunch, weekend groceries'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Real Receipt / Bill Attachment Affordance */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Camera size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {receiptAttached ? receiptFileName || 'Receipt File Attached' : 'Attach Bill or Receipt'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {receiptAttached ? 'Image / PDF receipt saved' : 'Optional document proof for your records'}
                </p>
              </div>
            </div>

            {receiptAttached ? (
              <button
                type="button"
                onClick={handleRemoveReceipt}
                className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus size={13} />
                <span>Upload</span>
              </button>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>
                {type === 'income'
                  ? 'Add Income to Balance'
                  : type === 'transfer'
                  ? 'Record Account Transfer'
                  : 'Save Expense'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
