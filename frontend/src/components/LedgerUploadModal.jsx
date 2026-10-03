import React, { useState } from 'react';
import { X, Upload, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function LedgerUploadModal({ isOpen, onClose, onUploadSuccess, currentUser }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (currentUser?.id) {
      formData.append('uploaded_by_id', currentUser.id);
    }

    try {
      const res = await axios.post('/api/ledger/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(res.data);
      setLoading(false);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Failed to extract ledger sheet. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card max-w-xl w-full p-6 space-y-6 relative border-indigo-500/30 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Upload Ledger Sheet (Gemini Flash Vision)
          </h3>
          <p className="text-xs text-slate-400">
            Multimodal AI will digitize handwritten/printed records and verify closing balance formulas.
          </p>
        </div>

        {/* Dropzone or Preview */}
        <div className="space-y-4">
          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-56 flex items-center justify-center">
              <img src={previewUrl} alt="Ledger Preview" className="max-h-56 object-contain" />
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); setResult(null); }}
                className="absolute top-2 right-2 bg-slate-900/90 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700"
              >
                Change Photo
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 bg-slate-900/50 hover:bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center space-y-3 group">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-200 block">Click or Drag photo of physical ledger</span>
                <span className="text-xs text-slate-500">Supports JPG, PNG, WEBP images</span>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Upload Action */}
        {selectedFile && !result && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Ledger with Gemini Flash...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extract & Verify Ledger
              </>
            )}
          </button>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Extraction Result Summary */}
        {result && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Extraction Completed Successfully
              </span>
              <span className="text-xs text-slate-400 font-mono">Date: {result.extracted?.date}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block uppercase">Opening Cash</span>
                <span className="font-bold text-slate-200">Rs. {result.verification?.opening?.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block uppercase">Reported Closing</span>
                <span className="font-bold text-emerald-400">Rs. {result.verification?.reported_closing?.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block uppercase">Calculated Balance</span>
                <span className="font-bold text-indigo-300">Rs. {result.verification?.calculated_closing?.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block uppercase">Discrepancy</span>
                <span className={`font-bold ${result.verification?.discrepancy === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Rs. {result.verification?.discrepancy?.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 rounded-xl border border-slate-700 mt-2"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
