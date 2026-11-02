import React from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import { Category, Transaction } from '../types';
import { formatCurrency, generateCSV, formatMonthDisplay } from '../utils/finance';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  baseCurrency: string;
  selectedMonth: string;
  cashflow: {
    income: number;
    expense: number;
    netSavings: number;
    savingsRatePercent: number;
  };
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  baseCurrency,
  selectedMonth,
  cashflow,
}) => {
  if (!isOpen) return null;

  const monthTransactions = selectedMonth === 'all'
    ? transactions
    : transactions.filter((t) => t.date.startsWith(selectedMonth));

  const handleDownloadCSV = () => {
    const csvContent = generateCSV(monthTransactions, categories, baseCurrency);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vaultflow_statement_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Financial Statement
              </h2>
              <p className="text-xs text-slate-500">Period: {formatMonthDisplay(selectedMonth)}</p>
            </div>
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

        {/* Statement Printable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-slate-800 dark:text-slate-200 print:text-black">
          {/* Executive Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Income</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(cashflow.income, baseCurrency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Expenses</span>
              <span className="text-sm font-bold text-rose-500 dark:text-rose-400 tabular-nums">
                {formatCurrency(cashflow.expense, baseCurrency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Net Savings</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatCurrency(cashflow.netSavings, baseCurrency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Savings Rate</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {cashflow.savingsRatePercent}%
              </span>
            </div>
          </div>

          {/* Transactions table */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Itemized Records ({transactions.filter((t) => t.date.startsWith(selectedMonth)).length})
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Merchant / Note</th>
                    <th className="p-2.5">Account</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions
                    .filter((t) => t.date.startsWith(selectedMonth))
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono text-slate-500">{t.date}</td>
                        <td className="p-2.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {t.merchant || 'General'}
                          </p>
                          {t.note && <p className="text-[11px] text-slate-400">{t.note}</p>}
                        </td>
                        <td className="p-2.5 capitalize text-slate-500">{t.account.replace('_', ' ')}</td>
                        <td className={`p-2.5 text-right font-bold tabular-nums ${
                          t.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                        }`}>
                          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.convertedAmount, baseCurrency)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
