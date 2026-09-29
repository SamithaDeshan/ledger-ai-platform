from sqlalchemy.orm import Session
from app.models import AuditLog, Transaction
from datetime import datetime
from typing import Optional

def log_transaction_creation(db: Session, transaction: Transaction, change_source: str = "AI"):
    audit = AuditLog(
        transaction_id=transaction.id,
        user_name="System AI",
        action="CREATE",
        field_name="All",
        old_value=None,
        new_value=f"Amount: Rs. {transaction.amount:,.2f} | Category: {transaction.category}",
        reason="Initial AI Ledger Extraction",
        change_source=change_source,
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

def log_transaction_verification(db: Session, transaction: Transaction, user_name: str = "Business Owner", change_source: str = "WHATSAPP"):
    audit = AuditLog(
        transaction_id=transaction.id,
        user_name=user_name,
        action="VERIFY",
        field_name="verification_status",
        old_value=transaction.verification_status,
        new_value="Verified",
        reason="User confirmed transaction details",
        change_source=change_source,
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

def log_transaction_update(
    db: Session,
    transaction: Transaction,
    field_name: str,
    old_value: str,
    new_value: str,
    user_name: str = "Business Owner",
    reason: str = "AI extraction correction",
    change_source: str = "DASHBOARD"
):
    if str(old_value) == str(new_value):
        return
        
    audit = AuditLog(
        transaction_id=transaction.id,
        user_name=user_name,
        action="UPDATE",
        field_name=field_name,
        old_value=str(old_value),
        new_value=str(new_value),
        reason=reason,
        change_source=change_source,
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

def log_transaction_deletion(db: Session, transaction: Transaction, user_name: str = "Business Owner", reason: str = "Deleted by user"):
    audit = AuditLog(
        transaction_id=transaction.id,
        user_name=user_name,
        action="DELETE",
        field_name="is_deleted",
        old_value="False",
        new_value="True",
        reason=reason,
        change_source="DASHBOARD",
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
