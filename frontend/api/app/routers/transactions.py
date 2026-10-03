from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Transaction, Ledger, AuditLog

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

class TransactionUpdatePayload(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None # income or expense
    reason: Optional[str] = "Employee manual correction from dashboard"
    changed_by: Optional[str] = "Cashier Employee"

@router.put("/{tx_id}")
def update_transaction(tx_id: str, payload: TransactionUpdatePayload, db: Session = Depends(get_db)):
    """
    Updates an itemized transaction (e.g. fixing AI misread amount or category).
    Appends entry to audit_logs table and dynamically updates parent ledger expected balance & discrepancy.
    """
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction entry not found")

    ledger = db.query(Ledger).filter(Ledger.id == tx.ledger_id).first()

    changes = []
    
    if payload.amount is not None and payload.amount != tx.amount:
        changes.append(("amount", str(tx.amount), str(payload.amount)))
        tx.amount = payload.amount
        
    if payload.category is not None and payload.category != tx.category:
        changes.append(("category", tx.category, payload.category))
        tx.category = payload.category

    if payload.description is not None and payload.description != tx.description:
        changes.append(("description", tx.description or "", payload.description))
        tx.description = payload.description

    if payload.type is not None and payload.type != tx.type:
        changes.append(("type", tx.type, payload.type))
        tx.type = payload.type

    if not changes:
        return {"message": "No changes detected", "transaction_id": tx_id}

    tx.is_edited = True

    # Record Audit Logs
    for field_name, old_val, new_val in changes:
        log_entry = AuditLog(
            transaction_id=tx.id,
            user_name=payload.changed_by or "Cashier Employee",
            action="UPDATE",
            field_name=field_name,
            old_value=old_val,
            new_value=new_val,
            reason=payload.reason,
            change_source="DASHBOARD",
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)

    db.commit()

    # Recalculate parent ledger formula
    if ledger:
        txs = db.query(Transaction).filter(Transaction.ledger_id == ledger.id).all()
        inflow = sum(t.amount for t in txs if t.type == "income")
        outflow = sum(t.amount for t in txs if t.type == "expense")
        calc_closing = ledger.opening_balance + inflow - outflow
        disc = ledger.closing_balance - calc_closing

        ledger.calculated_balance = calc_closing
        ledger.discrepancy = disc
        if disc == 0:
            ledger.status = "confirmed"
        ledger.updated_at = datetime.utcnow()
        db.commit()

    return {
        "message": "Transaction updated and audit log recorded",
        "transaction_id": tx.id,
        "is_edited": True,
        "changes_count": len(changes),
        "updated_ledger": {
            "id": ledger.id if ledger else None,
            "calculated_balance": ledger.calculated_balance if ledger else 0,
            "discrepancy": ledger.discrepancy if ledger else 0,
            "status": ledger.status if ledger else "pending"
        }
    }

@router.get("/{tx_id}/audit-logs")
def get_transaction_audit_logs(tx_id: str, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).filter(AuditLog.transaction_id == tx_id).order_by(AuditLog.timestamp.desc()).all()
    return [
        {
            "id": l.id,
            "transaction_id": l.transaction_id,
            "user_name": l.user_name,
            "action": l.action,
            "field_name": l.field_name,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "reason": l.reason,
            "change_source": l.change_source,
            "timestamp": l.timestamp.isoformat()
        } for l in logs
    ]
