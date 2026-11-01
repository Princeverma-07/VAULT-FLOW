import React from 'react';
import { LayoutDashboard, ArrowLeftRight, PieChart, BarChart3, Target, Plus } from 'lucide-react';

export type TabId = 'home' | 'transactions' | 'budgets' | 'reports' | 'planning';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickAdd,
}) => {
  const tabs = [
    { id: 'home' as TabId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as TabId, label: 'Activity', icon: ArrowLeftRight },
    { id: 'budgets' as TabId, label: 'Budgets', icon: PieChart },
    { id: 'reports' as TabId, label: 'Reports', icon: BarChart3 },
    { id: 'planning' as TabId, label: 'Goals', icon: Target },
  ];

  return (
    <>
      {/* Elevated Action Button (modern squircle, no pill shape) */}
      <button
        type="button"
        onClick={onOpenQuickAdd}
        aria-label="Record new transaction"
        title="Add Transaction"
        className="fixed bottom-20 right-5 z-40 w-13 h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center transition-all cursor-pointer group"
      >
        <Plus size={26} strokeWidth={2.6} className="group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Mobile Ergonomic Bottom Bar */}
      <nav
        aria-label="Main Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe shadow-lg shadow-slate-900/5"
      >
        <div className="max-w-lg mx-auto px-2 flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-label={tab.label}
                className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
