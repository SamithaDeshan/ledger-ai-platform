from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import AuditLog, Transaction
from app.schemas import AuditLogOut

router = APIRouter(prefix="/api/audit", tags=["Audit Logs"])

@router.get("/transaction/{tx_id}", response_model=List[AuditLogOut])
def get_transaction_audit_trail(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    logs = db.query(AuditLog).filter(
        AuditLog.transaction_id == tx_id
    ).order_by(AuditLog.timestamp.desc()).all()

    return logs

@router.get("/recent", response_model=List[AuditLogOut])
def get_recent_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
