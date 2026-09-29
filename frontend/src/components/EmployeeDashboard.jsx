import React from 'react';
import { CheckCircle2, Clock, UploadCloud, Send, ShieldCheck, DollarSign, AlertTriangle } from 'lucide-react';

export default function EmployeeDashboard({ todayStatus, onUploadClick }) {
  const isUploaded = todayStatus?.is_uploaded;
  const status = todayStatus?.status || 'pending';
  const balance = todayStatus?.cashier_balance || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Top Welcome Banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Cashier Counter Interface</span>
            <h2 className="text-2xl font-extrabold text-white mt-1">Today's Ledger & Balance Status</h2>
            <p className="text-xs text-slate-400 mt-1">Kasun Fernando • Cashier Terminal #01</p>
          </div>
          <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl px-6 py-3 shadow-lg text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Drawer Balance Counter
            </span>
            <span className="text-3xl font-black text-emerald-400">
              Rs. {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Single Card View for Employee */}
      <div className="glass-card p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Daily Upload Confirmation</h3>
            <p className="text-xs text-slate-400">Verification status for date: <span className="text-indigo-400 font-semibold">{todayStatus?.date}</span></p>
          </div>

          <div>
            {isUploaded ? (
              <span className="badge badge-status-verified text-sm px-4 py-1.5">
                <CheckCircle2 className="w-4 h-4" /> Daily Sheet Uploaded
              </span>
            ) : (
              <span className="badge badge-status-ai text-sm px-4 py-1.5">
                <Clock className="w-4 h-4" /> Pending Today's Upload
              </span>
            )}
          </div>
        </div>

        {/* Upload Status Card Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 block uppercase">Opening Cash</span>
            <span className="text-lg font-bold text-slate-200 mt-1 block">
              Rs. {(todayStatus?.opening_balance || 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 block uppercase">Cashier Closing Count</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">
              Rs. {(todayStatus?.closing_balance || 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 block uppercase">Audit Formula Match</span>
            {todayStatus?.discrepancy === 0 ? (
              <span className="text-emerald-400 font-bold text-sm mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 0.00 Discrepancy
              </span>
            ) : (
              <span className="text-amber-400 font-bold text-sm mt-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Discrepancy: Rs. {(todayStatus?.discrepancy || 0).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Upload Action CTA */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white">Snap & Upload Today's Ledger Sheet</h4>
            <p className="text-xs text-slate-400">
              Upload photo directly here or via your Telegram Bot. Gemini Flash will automatically extract and verify your closing balance.
            </p>
          </div>
          <button
            onClick={onUploadClick}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Photo Now
          </button>
        </div>

        {/* Telegram Submission Guide */}
        <div className="border-t border-slate-800 pt-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            Telegram Bot Submission Instructions
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
            <li>Open your official company Telegram app and search for <strong className="text-indigo-400">@LedgerAIBot</strong>.</li>
            <li>Snap a clear picture of the physical ledger sheet showing Opening Cash, Inflows, Outflows, and Closing Balance.</li>
            <li>Send the photo in chat. Gemini 2.0 Flash will extract all figures into strict JSON in under 3 seconds.</li>
            <li>Click <strong className="text-emerald-400">✅ Confirm & Save</strong> on the Telegram inline keyboard to commit directly to this dashboard.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
