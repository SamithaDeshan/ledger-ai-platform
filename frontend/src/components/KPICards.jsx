import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function KPICards({ stats, onVerifyClick }) {
  const [period, setPeriod] = useState('today'); // today, weekly, monthly

  if (!stats) return null;

  const income = period === 'today' ? stats.today_income : period === 'weekly' ? stats.weekly_income : stats.monthly_income;
  const expense = period === 'today' ? stats.today_expense : period === 'weekly' ? stats.weekly_expense : stats.monthly_expense;
  const net = period === 'today' ? stats.today_net : period === 'weekly' ? stats.weekly_net : stats.monthly_net;

  return (
    <div className="space-y-4 mb-8">
      {/* Verification Warning Alert Banner if needed */}
      {stats.awaiting_verification_count > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-200">
                ⚠️ Low Confidence AI Extraction Detected! ({stats.awaiting_verification_count} item)
              </p>
              <p className="text-xs text-amber-400/80">
                Transaction #4 (බස් ගාස්තු / Transport) requires human verification before finalizing.
              </p>
            </div>
          </div>
          <button
            onClick={onVerifyClick}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
          >
            Verify in WhatsApp Sandbox →
          </button>
        </div>
      )}

      {/* Period Toggle Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          Financial Summary
        </h2>
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          {['today', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg capitalize transition ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            Rs. {income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Verified AI Income Sum</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 tracking-tight">
            Rs. {expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Categorized Expense Total</span>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Cash Flow</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold tracking-tight ${net >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
            Rs. {net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Automatically Recalculated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
