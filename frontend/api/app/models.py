import uuid
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    telegram_user_id = Column(BigInteger, unique=True, nullable=True, index=True)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="employee") # 'manager' or 'employee'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ledgers = relationship("Ledger", back_populates="uploader")

class Ledger(Base):
    __tablename__ = "ledgers"

    id = Column(String, primary_key=True, default=generate_uuid)
    ledger_date = Column(String, nullable=False, unique=True, index=True) # YYYY-MM-DD
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=True)
    image_storage_url = Column(Text, nullable=True)
    opening_balance = Column(Float, nullable=False, default=0.0)
    closing_balance = Column(Float, nullable=False, default=0.0)
    calculated_balance = Column(Float, nullable=False, default=0.0)
    discrepancy = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="pending") # pending, confirmed, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    uploader = relationship("User", back_populates="ledgers")
    transactions = relationship("Transaction", back_populates="ledger", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    ledger_id = Column(String, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(10), nullable=False) # income or expense
    category = Column(String(60), nullable=False, index=True) # Sales, Supplies, Utilities, Transport, Refreshments, Other
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ledger = relationship("Ledger", back_populates="transactions")
    audit_logs = relationship("AuditLog", back_populates="transaction", cascade="all, delete-orphan")

class OTPToken(Base):
    __tablename__ = "otp_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    telegram_user_id = Column(BigInteger, nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Payroll(Base):
    __tablename__ = "payroll"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_name = Column(String(120), nullable=False)
    base_salary = Column(Float, nullable=False)
    pay_day_of_month = Column(Integer, nullable=False) # 1 - 31
    last_paid_date = Column(String, nullable=True) # YYYY-MM-DD
    status = Column(String(20), nullable=False, default="unpaid") # paid, unpaid, pending
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=True)
    user_name = Column(String, default="Manager")
    action = Column(String, nullable=False) # CREATE, UPDATE, DELETE
    field_name = Column(String, nullable=True)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    change_source = Column(String, default="DASHBOARD")
    timestamp = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="audit_logs")

