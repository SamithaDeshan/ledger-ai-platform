import React, { useState } from 'react';
import { KeyRound, Send, ShieldCheck, UserCheck, AlertTriangle, Loader2, CheckCircle2, Lock } from 'lucide-react';
import axios from 'axios';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [step, setStep] = useState(1); // 1: Enter ID, 2: Enter OTP
  const [telegramId, setTelegramId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpInfo, setOtpInfo] = useState(null);

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!telegramId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/request-otp', {
        telegram_user_id: parseInt(telegramId)
      });
      setOtpInfo(res.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to dispatch OTP. Make sure your Telegram ID is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/verify-otp', {
        telegram_user_id: parseInt(telegramId),
        otp_code: otpCode.trim()
      });
      
      if (res.data.authenticated) {
        onLoginSuccess(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card max-w-md w-full p-6 space-y-6 relative border-indigo-500/30">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-white">LedgerAI OTP Security Login</h3>
          <p className="text-xs text-slate-400">Authenticate via Telegram Bot One-Time Password</p>
        </div>

        {/* Step 1: Telegram ID Input */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Enter Your Telegram User ID
              </label>
              <input
                type="number"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="e.g. 123456789 or 987654321"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Accounts: <span className="text-indigo-400 cursor-pointer font-mono" onClick={() => setTelegramId('123456789')}>123456789 (Owner)</span> • <span className="text-emerald-400 cursor-pointer font-mono" onClick={() => setTelegramId('7596195250')}>7596195250 (Nethsara)</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send OTP Code to Telegram
            </button>
          </form>
        )}

        {/* Step 2: Enter 6-Digit OTP Code */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {otpInfo && (
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-indigo-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  OTP Dispatched to Telegram Chat
                </p>
                <p className="text-slate-400 text-[11px]">
                  User: <strong>{otpInfo.user_name}</strong> ({otpInfo.role.toUpperCase()})
                </p>
                {otpInfo.demo_code && (
                  <p className="text-emerald-400 font-mono text-[11px] pt-1 border-t border-indigo-500/20">
                    🔑 Offline Demo OTP Code: <strong>{otpInfo.demo_code}</strong>
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="e.g. 584920"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-3 rounded-xl border border-slate-700"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Verify & Log In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
