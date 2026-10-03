import React from 'react';
import { ShieldCheck, UserCheck, UploadCloud, RefreshCw, Layers, Lock, LogOut } from 'lucide-react';

export default function Navbar({ cashierBalance, userRole, setUserRole, user, onLoginClick, onLogoutClick, onUploadClick, onRefresh }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Ledger<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">AI</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Gemini Vision
              </span>
            </h1>
            <p className="text-xs text-slate-400">Automated Daily Ledger Processing & Audit Logs</p>
          </div>
        </div>

        {/* Right Section: Balance, Role Switcher, OTP Auth, Upload */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cashier Balance Pill */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl px-4 py-2 flex items-center gap-3 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Cashier Drawer Balance
              </span>
              <span className="text-base font-extrabold text-emerald-400">
                Rs. {cashierBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setUserRole('manager')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                userRole === 'manager'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Manager View
            </button>
            <button
              onClick={() => setUserRole('employee')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                userRole === 'employee'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Cashier / Employee
            </button>
          </div>

          {/* OTP Authentication State */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-300 font-semibold">{user.full_name}</span>
              <button
                onClick={onLogoutClick}
                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-indigo-500/30 transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              Login
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Upload Ledger Button */}
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Ledger Sheet
          </button>
        </div>
      </div>
    </header>
  );
}
