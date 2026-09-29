import React from 'react';
import { X, Image as ImageIcon, CheckCircle, AlertTriangle } from 'lucide-react';

export default function LedgerViewerModal({ transaction, onClose }) {
  if (!transaction) return null;

  const imageUrl = transaction.source_image_reference
    ? `http://localhost:8000${transaction.source_image_reference.startsWith('/') ? '' : '/'}${transaction.source_image_reference}`
    : 'http://localhost:8000/uploads/sample_ledger_sinhala.png';

  let bbox = { x: 25, y: 125, w: 310, h: 40 };
  try {
    if (transaction.bounding_box) {
      bbox = JSON.parse(transaction.bounding_box);
    }
  } catch (e) {
    // default
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-3xl p-6 relative border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-100">Original Physical Ledger Photograph</h3>
            </div>
            <p className="text-xs text-slate-400">
              Transaction #{transaction.id}: <span className="text-indigo-300 font-semibold">{transaction.original_description}</span> (Rs. {transaction.amount.toLocaleString()})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Container with AI Target Bounding Box Crop */}
        <div className="relative w-full h-[380px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-2">
          <img
            src={imageUrl}
            alt="Original Ledger Photograph"
            className="max-h-full max-w-full object-contain rounded-lg"
          />

          {/* AI Extraction Highlight Overlay Box */}
          <div
            className="absolute border-2 border-indigo-400 bg-indigo-500/20 rounded-md pointer-events-none shadow-lg shadow-indigo-500/50 flex items-center justify-end pr-2"
            style={{
              left: `${bbox.x}px`,
              top: `${bbox.y}px`,
              width: `${bbox.w}px`,
              height: `${bbox.h}px`,
            }}
          >
            <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow">
              AI Vision Target ({transaction.confidence_score}%)
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Extracted Language: <strong className="text-slate-200 capitalize">{transaction.language}</strong></span>
          </div>
          <div>
            <span>Confidence Level: <strong className={transaction.confidence_score >= 85 ? 'text-emerald-400' : 'text-amber-400'}>{transaction.confidence_score}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
