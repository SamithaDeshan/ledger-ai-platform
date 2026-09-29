import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

export default function FinancialCharts({ stats, categoryBreakdown }) {
  if (!stats) return null;

  const barData = [
    { name: 'Today', Income: stats.today_income, Expense: stats.today_expense },
    { name: 'Weekly', Income: stats.weekly_income, Expense: stats.weekly_expense },
    { name: 'Monthly', Income: stats.monthly_income, Expense: stats.monthly_expense },
  ];

  const expenseCategories = categoryBreakdown
    ? categoryBreakdown.filter((item) => item.type === 'Expense')
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Income vs Expense Bar Chart */}
      <div className="glass-card p-6">
        <h3 className="text-md font-bold text-slate-100 mb-4 flex items-center justify-between">
          <span>Income vs Expense Overview</span>
          <span className="text-xs text-slate-400 font-normal">Real-time Recalculated</span>
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `Rs.${v/1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                }}
                formatter={(value) => [`Rs. ${value.toLocaleString()}`, '']}
              />
              <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Category Breakdown Donut Chart */}
      <div className="glass-card p-6">
        <h3 className="text-md font-bold text-slate-100 mb-4 flex items-center justify-between">
          <span>Expense Category Distribution</span>
          <span className="text-xs text-slate-400 font-normal">Standardized Categories</span>
        </h3>
        <div className="h-64 flex items-center justify-center">
          {expenseCategories.length === 0 ? (
            <div className="text-slate-500 text-sm">No expense records available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Amount']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
