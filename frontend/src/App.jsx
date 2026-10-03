import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import DashboardOverview from './components/DashboardOverview';
import EmployeeDashboard from './components/EmployeeDashboard';
import LedgerUploadModal from './components/LedgerUploadModal';
import LoginModal from './components/LoginModal';
import TransactionEditModal from './components/TransactionEditModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [userRole, setUserRole] = useState('manager'); // 'manager' | 'employee'
  const [currentUser, setCurrentUser] = useState(null); // Authenticated user session
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/dashboard/overview?user_role=${userRole}`);
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setDashboardData({
        metrics: {
          cashierBalance: 99350.00,
          monthlyTurnover: 171000.00,
          netMargin: 38.5,
          totalInflow: 171000.00,
          totalOutflow: 105100.00,
          pendingLedgersCount: 0
        },
        cashflow: [
          { date: '2026-09-22', inflow: 22000, outflow: 6600 },
          { date: '2026-09-23', inflow: 21500, outflow: 8800 },
          { date: '2026-09-24', inflow: 28000, outflow: 4800 },
          { date: '2026-09-25', inflow: 16500, outflow: 24700 },
          { date: '2026-09-26', inflow: 32000, outflow: 14300 },
          { date: '2026-09-27', inflow: 24500, outflow: 4450 },
          { date: '2026-09-28', inflow: 28500, outflow: 13350 }
        ],
        expenseBreakdown: [
          { category: 'Supplies', amount: 39800.0 },
          { category: 'Utilities', amount: 20450.0 },
          { category: 'Transport', amount: 10350.0 },
          { category: 'Refreshments', amount: 5200.0 },
          { category: 'Other', amount: 1000.0 }
        ],
        payrollAlerts: [
          { id: 'p1', employee_name: 'Kasun Fernando', base_salary: 65000.0, pay_day_of_month: 28, status: 'pending' },
          { id: 'p2', employee_name: 'Nimal Silva', base_salary: 58000.0, pay_day_of_month: 30, status: 'unpaid' }
        ],
        masterLedgers: [
          {
            id: 'l7',
            ledger_date: '2026-09-28',
            opening_balance: 84200.0,
            closing_balance: 99350.0,
            calculated_balance: 99350.0,
            discrepancy: 0.0,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            transactions: [
              { id: 't1', type: 'income', category: 'Sales', description: 'Counter Cash & Card Sales', amount: 28500.0, is_edited: false },
              { id: 't2', type: 'expense', category: 'Supplies', description: 'Store Inventory Purchase', amount: 7200.0, is_edited: false },
              { id: 't3', type: 'expense', category: 'Utilities', description: 'Water & Waste Disposal', amount: 3150.0, is_edited: false },
              { id: 't4', type: 'expense', category: 'Transport', description: 'Logistics Delivery Fee', amount: 3000.0, is_edited: false }
            ]
          }
        ],
        todayStatus: {
          date: '2026-09-28',
          is_uploaded: true,
          status: 'confirmed',
          cashier_balance: 99350.0,
          opening_balance: 84200.0,
          closing_balance: 99350.0,
          discrepancy: 0.0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userRole]);

  const handleLoginSuccess = (userPayload) => {
    setCurrentUser(userPayload);
    setUserRole(userPayload.role);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleStatusUpdate = async (ledgerId, status) => {
    try {
      await axios.post(`/api/ledger/${ledgerId}/status?status=${status}`);
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const cashierBalance = dashboardData?.metrics?.cashierBalance || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Navigation Header */}
      <Navbar
        cashierBalance={cashierBalance}
        userRole={userRole}
        setUserRole={setUserRole}
        user={currentUser}
        onLoginClick={() => setIsLoginOpen(true)}
        onLogoutClick={handleLogout}
        onUploadClick={() => setIsUploadOpen(true)}
        onRefresh={fetchDashboardData}
      />

      {/* Main Body Content */}
      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading daily ledger analytics...</p>
          </div>
        ) : (
          <>
            {userRole === 'manager' ? (
              <DashboardOverview
                metrics={dashboardData?.metrics || { cashierBalance: 0, monthlyTurnover: 0, netMargin: 0, totalInflow: 0, totalOutflow: 0, pendingLedgersCount: 0 }}
                cashflow={dashboardData?.cashflow || []}
                expenseBreakdown={dashboardData?.expenseBreakdown || []}
                payrollAlerts={dashboardData?.payrollAlerts || []}
                masterLedgers={dashboardData?.masterLedgers || []}
                onStatusUpdate={handleStatusUpdate}
                onEditTransaction={(tx) => setEditingTransaction(tx)}
              />
            ) : (
              <EmployeeDashboard
                todayStatus={dashboardData?.todayStatus || { date: new Date().toISOString().split('T')[0], is_uploaded: false, status: 'pending', cashier_balance: 0 }}
                onUploadClick={() => setIsUploadOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Ledger Upload Modal */}
      <LedgerUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchDashboardData}
      />

      {/* Telegram OTP Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Employee Transaction Correction & Audit Trail Modal */}
      <TransactionEditModal
        transaction={editingTransaction}
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        onSaveSuccess={fetchDashboardData}
      />
    </div>
  );
}
