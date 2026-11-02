import React, { useState } from 'react';
import { X, Plus, Check, Trash2 } from 'lucide-react';
import { Category } from '../types';
import { formatCurrency } from '../utils/finance';
import { CategoryIcon } from './CategoryIcon';

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onUpdateCategoryBudget: (categoryId: string, newLimit: number) => void;
  baseCurrency: string;
}

const AVAILABLE_ICONS = [
  'Home', 'ShoppingCart', 'Utensils', 'Car', 'Zap', 'ShoppingBag',
  'HeartPulse', 'Film', 'Plane', 'Coffee', 'Dumbbell', 'Music',
  'BookOpen', 'PiggyBank', 'Gift', 'Briefcase', 'Laptop', 'TrendingUp'
];

const PRESET_COLORS = [
  '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6', '#64748b'
];

export const CategoryManageModal: React.FC<CategoryManageModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategoryBudget,
  baseCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'create'>('budgets');
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [iconName, setIconName] = useState('Coffee');
  const [color, setColor] = useState('#10b981');
  const [budgetLimitStr, setBudgetLimitStr] = useState('');

  if (!isOpen) return null;

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCategory: Category = {
      id: `cat_custom_${Date.now()}`,
      name: name.trim(),
      iconName,
      color,
      type,
      budgetLimit: parseFloat(budgetLimitStr) || undefined,
    };

    onAddCategory(newCategory);
    setName('');
    setBudgetLimitStr('');
    setActiveTab('budgets');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="category-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              Category &amp; Budget Manager
            </h2>
            <p className="text-xs text-slate-500">Customize categories and monthly allowances</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('budgets')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'budgets'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Category Budgets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              activeTab === 'create'
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Plus size={14} />
            <span>New Category</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'budgets' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Set monthly spending limits for each category to track progress:
              </p>
              {categories
                .filter((c) => c.type === 'expense')
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon iconName={cat.iconName} color={cat.color} size={16} className="p-1.5" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          {baseCurrency}
                        </span>
                        <input
                          type="number"
                          min="0"
                          placeholder="No limit"
                          value={cat.budgetLimit && cat.budgetLimit > 0 ? cat.budgetLimit : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value));
                            onUpdateCategoryBudget(cat.id, val);
                          }}
                          className="w-24 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
                        />
                      </div>
                      {onDeleteCategory && cat.id.startsWith('cat_custom_') && (
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete custom category"
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pet Care, Subscriptions, Coffee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                      type === 'expense'
                        ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                      type === 'income'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIconName(ic)}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                        iconName === ic
                          ? 'bg-slate-900 text-white dark:bg-emerald-600'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CategoryIcon iconName={ic} color={iconName === ic ? '#ffffff' : color} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color Accent
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {type === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Budget Target ({baseCurrency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150"
                    value={budgetLimitStr}
                    onChange={(e) => setBudgetLimitStr(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
