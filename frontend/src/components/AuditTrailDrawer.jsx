import React from 'react';
import { X, History, User, MessageSquare, LayoutDashboard, Cpu, ArrowRight } from 'lucide-react';

export default function AuditTrailDrawer({ transaction, auditLogs, onClose }) {
  if (!transaction) return null;

  const getSourceIcon = (source) => {
    switch (source) {
      case 'WHATSAPP':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'DASHBOARD':
        return <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div>
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-md font-bold text-slate-100">Transaction Audit History</h3>
                <p className="text-xs text-slate-400">TX-#{transaction.id}: {transaction.original_description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Audit Timeline */}
          <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 pl-8">No modification records found.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="relative pl-8 group">
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-slate-900 border-2 border-purple-500/50 flex items-center justify-center shadow">
                    {getSourceIcon(log.change_source)}
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium">
                      Changed field: <strong className="text-indigo-300">{log.field_name}</strong>
                    </div>

                    {log.old_value && (
                      <div className="flex items-center gap-2 text-xs bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-rose-400 line-through font-mono text-[11px]">{log.old_value}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="text-emerald-400 font-bold font-mono text-[11px]">{log.new_value}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-900">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" /> {log.user_name}
                      </span>
                      <span className="italic text-slate-500">{log.reason || 'No reason provided'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Immutable Audit Trail • LedgerAI Compliance System
          </p>
        </div>
      </div>
    </div>
  );
}
