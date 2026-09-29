import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, History, CheckCircle2, Loader2, Edit3 } from 'lucide-react';
import axios from 'axios';

export default function TransactionEditModal({ transaction, isOpen, onClose, onSaveSuccess }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Sales');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount || '');
      setCategory(transaction.category || 'Sales');
      setDescription(transaction.description || '');
      setType(transaction.type || 'expense');
      setReason('');
      setError(null);
      fetchAuditLogs(transaction.id);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const fetchAuditLogs = async (txId) => {
    try {
      const res = await axios.get(`/api/transactions/${txId}/audit-logs`);
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.put(`/api/transactions/${transaction.id}`, {
        amount: parseFloat(amount),
        category,
        description,
        type,
        reason: reason || 'Employee manual correction of AI misread entry',
        changed_by: 'Cashier Employee'
      });

      setLoading(false);
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Failed to update entry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card max-w-lg w-full p-6 space-y-5 relative border-indigo-500/30 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            Correct AI Extracted Transaction Entry
          </h3>
          <p className="text-xs text-slate-400">
            Fix AI vision misread values. Changes will recalculate closing balance & record audit log.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="income">Income (+)</option>
                <option value="expense">Expense (-)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Sales">Sales</option>
                <option value="Supplies">Supplies</option>
                <option value="Utilities">Utilities</option>
                <option value="Transport">Transport</option>
                <option value="Refreshments">Refreshments</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Description / Item Name</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Electricity Bill or Store Inventory Restock"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Amount (Rs.)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Reason for AI Correction</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. AI misread digit '3' as '8'"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              Logs ({auditLogs.length})
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save & Log Audit Change
            </button>
          </div>
        </form>

        {/* Audit Log History Drawer */}
        {showLogs && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 mt-4">
            <h4 className="font-bold text-xs text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Audit Trail Log History
            </h4>
            {auditLogs.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold text-slate-200">{log.user_name}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300">
                      Changed <span className="text-indigo-400 font-semibold">{log.field_name}</span> from <span className="line-through text-rose-400">{log.old_value}</span> to <span className="text-emerald-400 font-bold">{log.new_value}</span>
                    </div>
                    {log.reason && (
                      <div className="text-slate-500 italic">"{log.reason}"</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic text-xs">No prior corrections logged for this item.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
