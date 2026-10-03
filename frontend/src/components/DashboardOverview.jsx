import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Percent,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  Edit3,
  Check
} from 'lucide-react';

const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DashboardOverview({
  metrics = { cashierBalance: 0, monthlyTurnover: 0, netMargin: 0, totalInflow: 0, totalOutflow: 0, pendingLedgersCount: 0 },
  cashflow = [],
  expenseBreakdown = [],
  payrollAlerts = [],
  masterLedgers = [],
  onStatusUpdate,
  onEditTransaction
}) {
  const [expandedLedger, setExpandedLedger] = useState(null);

  const toggleExpand = (id) => {
    setExpandedLedger(expandedLedger === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards (Manager View Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cashier Balance Card */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cashier Drawer Balance</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">
                Rs. {metrics.cashierBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Live reconciled counter cash total</p>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60"></div>
        </div>

        {/* Monthly Turnover */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Turnover</p>
              <h3 className="text-2xl font-extrabold text-white mt-2">
                Rs. {metrics.monthlyTurnover.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Gross revenue across daily ledgers</p>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60"></div>
        </div>

        {/* Net Operating Margin */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Operating Margin</p>
              <h3 className="text-2xl font-extrabold text-indigo-400 mt-2">
                {metrics.netMargin}%
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Overall net profitability margin</p>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60"></div>
        </div>

        {/* Pending Staff Salaries */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Staff Salaries</p>
              <h3 className="text-2xl font-extrabold text-amber-400 mt-2">
                {payrollAlerts.length} Due Soon
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Payroll due within 3 days</p>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60"></div>
        </div>
      </div>

      {/* Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inflow vs Outflow Trend */}
        <div className="glass-card p-6 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Inflow vs Outflow Trend</h3>
              <p className="text-xs text-slate-400">Daily financial trajectory & operating cashflow</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Inflows
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Outflows
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(val) => `Rs. ${Number(val).toLocaleString()}`}
                />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} fill="url(#inflowGrad)" />
                <Area type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} fill="url(#outflowGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Expense Category Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution of operational spending</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {expenseBreakdown.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(val) => `Rs. ${Number(val).toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {expenseBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                ></span>
                <span className="text-slate-300 truncate">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salary Reminders Banner */}
      {payrollAlerts.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-amber-500 bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>Upcoming Staff Payroll Reminders</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {payrollAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">{alert.employee_name}</span>
                  <span className="text-slate-400">Pay Day: Day {alert.pay_day_of_month} of month</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-amber-400 text-sm">
                    Rs. {alert.base_salary.toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-300/80 block mt-0.5">
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Master Ledgers & Reconciliation Table */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Daily Master Ledgers & Audit Reconciliation
            </h3>
            <p className="text-xs text-slate-400">Verified cashbook logs and automated formula checks</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
            {masterLedgers.length} Records Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Opening</th>
                <th className="py-3 px-4">Cashier Count</th>
                <th className="py-3 px-4">Calculated</th>
                <th className="py-3 px-4">Discrepancy</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {masterLedgers.map((l) => {
                const isDiscrepant = l.discrepancy !== 0;
                const isExpanded = expandedLedger === l.id;

                return (
                  <React.Fragment key={l.id}>
                    <tr className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-2 text-white font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {l.ledger_date}
                      </td>
                      <td className="py-3.5 px-4 font-mono">Rs. {l.opening_balance.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        Rs. {l.closing_balance.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-indigo-300">
                        Rs. {l.calculated_balance.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {isDiscrepant ? (
                          <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            Rs. {l.discrepancy.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-400">Rs. 0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {l.status === 'confirmed' && (
                          <span className="badge badge-status-verified">
                            <CheckCircle2 className="w-3 h-3" /> Confirmed
                          </span>
                        )}
                        {l.status === 'pending' && (
                          <span className="badge badge-status-ai">
                            <AlertTriangle className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {l.status === 'rejected' && (
                          <span className="badge badge-expense">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => toggleExpand(l.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 inline-flex items-center gap-1 text-[11px]"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Items ({l.transactions?.length || 0})
                        </button>
                        {l.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onStatusUpdate(l.id, 'confirmed')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-[11px] shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onStatusUpdate(l.id, 'rejected')}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-[11px] shadow-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>

                    {/* Itemized Transactions Breakdown Row with Employee Edit Trigger */}
                    {isExpanded && (
                      <tr className="bg-slate-950/60 border-b border-slate-800">
                        <td colSpan={7} className="p-4">
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-xs text-indigo-300 uppercase tracking-wider">
                                Itemized Transactions Breakdown for {l.ledger_date}
                              </h4>
                              <span className="text-[10px] text-slate-400">Click Edit to correct AI misread numbers</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {l.transactions && l.transactions.length > 0 ? (
                                l.transactions.map((tx) => (
                                  <div
                                    key={tx.id}
                                    className={`p-3 rounded-lg border flex justify-between items-center ${
                                      tx.type === 'income'
                                        ? 'bg-emerald-950/20 border-emerald-500/20'
                                        : 'bg-rose-950/20 border-rose-500/20'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-200 block">{tx.description}</span>
                                        {tx.is_edited && (
                                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                            Employee Corrected
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                        {tx.category} • {tx.type}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`font-bold font-mono text-sm ${
                                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                                        }`}
                                      >
                                        {tx.type === 'income' ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                                      </span>
                                      <button
                                        onClick={() => onEditTransaction(tx)}
                                        className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
                                        title="Correct AI Extraction Error"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-500 italic text-xs">No itemized entries found.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
