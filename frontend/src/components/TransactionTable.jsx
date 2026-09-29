import React, { useState } from 'react';
import {
  Search, Filter, Edit3, Image, History, Trash2, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle, ShieldAlert
} from 'lucide-react';

export default function TransactionTable({
  transactions,
  onEdit,
  onViewLedger,
  onViewHistory,
  onDelete
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Client-side filtering for fast dynamic response
  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.original_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transaction_date.includes(searchTerm);

    const matchesLang = langFilter === 'all' || tx.language === langFilter;
    const matchesType = typeFilter === 'all' || tx.transaction_type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || tx.verification_status.toLowerCase().includes(statusFilter.toLowerCase());

    return matchesSearch && matchesLang && matchesType && matchesStatus;
  });

  const getLanguageBadge = (lang) => {
    switch (lang) {
      case 'si':
        return <span className="badge badge-lang-si">Sinhala 🇱🇰</span>;
      case 'en':
        return <span className="badge badge-lang-en">English 🇬🇧</span>;
      default:
        return <span className="badge badge-lang-mixed">Mixed 🔀</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Awaiting Verification':
        return (
          <span className="badge badge-status-awaiting">
            <AlertCircle className="w-3 h-3" /> Awaiting Verification
          </span>
        );
      case 'Verified':
        return (
          <span className="badge badge-status-verified">
            <CheckCircle className="w-3 h-3" /> Verified
          </span>
        );
      case 'Modified':
        return (
          <span className="badge badge-status-modified">
            <Edit3 className="w-3 h-3" /> Modified
          </span>
        );
      default:
        return (
          <span className="badge badge-status-ai">
            <ShieldAlert className="w-3 h-3" /> AI Extracted
          </span>
        );
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Digitized Transactions</h2>
          <p className="text-xs text-slate-400">Original Sinhala & English ledger records with AI verification</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:flex-none min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Language Filter */}
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Languages (All)</option>
            <option value="si">Sinhala</option>
            <option value="en">English</option>
            <option value="mixed">Mixed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Type (All)</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Status (All)</option>
            <option value="awaiting">Awaiting Verification</option>
            <option value="verified">Verified</option>
            <option value="modified">Modified</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Original Description</th>
              <th className="py-3 px-4">Language</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Standard Category</th>
              <th className="py-3 px-4 text-right">Amount (Rs)</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-500">
                  No matching transactions found
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr
                  key={tx.id}
                  className={`hover:bg-slate-800/40 transition ${
                    tx.verification_status === 'Awaiting Verification'
                      ? 'bg-amber-500/5'
                      : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-medium text-slate-300">{tx.transaction_date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                    {tx.original_description}
                  </td>
                  <td className="py-3.5 px-4">{getLanguageBadge(tx.language)}</td>
                  <td className="py-3.5 px-4">
                    {tx.transaction_type === 'Income' ? (
                      <span className="badge badge-income">
                        <ArrowUpRight className="w-3 h-3" /> Income
                      </span>
                    ) : (
                      <span className="badge badge-expense">
                        <ArrowDownLeft className="w-3 h-3" /> Expense
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-medium text-slate-300">
                      {tx.category}
                    </span>
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-extrabold text-sm ${
                      tx.transaction_type === 'Income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    Rs. {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(tx.verification_status)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition"
                        title="Edit Transaction"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onViewLedger(tx)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                        title="View Original Ledger Photo"
                      >
                        <Image className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onViewHistory(tx)}
                        className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition"
                        title="View Audit History"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDelete(tx.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        title="Soft Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
