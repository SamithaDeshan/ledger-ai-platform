from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    full_name: str
    role: str = "employee" # manager or employee
    is_active: bool = True
    telegram_user_id: Optional[int] = None

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionBase(BaseModel):
    type: str # income or expense
    category: str
    description: Optional[str] = None
    amount: float

class TransactionCreate(TransactionBase):
    ledger_id: str

class TransactionOut(TransactionBase):
    id: str
    ledger_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Ledger Schemas
class LedgerBase(BaseModel):
    ledger_date: str
    opening_balance: float = 0.0
    closing_balance: float = 0.0
    calculated_balance: float = 0.0
    discrepancy: float = 0.0
    status: str = "pending"

class LedgerCreate(LedgerBase):
    image_storage_url: Optional[str] = None

class LedgerOut(LedgerBase):
    id: str
    uploaded_by: Optional[str] = None
    image_storage_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    transactions: List[TransactionOut] = []

    class Config:
        from_attributes = True

# Payroll Schemas
class PayrollBase(BaseModel):
    employee_name: str
    base_salary: float
    pay_day_of_month: int
    last_paid_date: Optional[str] = None
    status: str = "unpaid"

class PayrollOut(PayrollBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Metrics Schemas
class DashboardMetricsOut(BaseModel):
    cashierBalance: float
    monthlyTurnover: float
    netMargin: float
    totalInflow: float
    totalOutflow: float
    pendingLedgersCount: int

class CashflowPointOut(BaseModel):
    date: str
    inflow: float
    outflow: float

class ExpenseBreakdownOut(BaseModel):
    category: str
    amount: float

class DashboardOverviewOut(BaseModel):
    metrics: DashboardMetricsOut
    cashflow: List[CashflowPointOut]
    expenseBreakdown: List[ExpenseBreakdownOut]
    payrollAlerts: List[PayrollOut]
    masterLedgers: List[LedgerOut]
    todayStatus: dict

