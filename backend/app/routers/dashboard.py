from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import Transaction
from app.schemas import DashboardSummaryOut, CategoryBreakdownOut
from app.financial_engine import calculate_dashboard_stats

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db), business_id: int = 1):
    return calculate_dashboard_stats(db, business_id)

@router.get("/category-breakdown", response_model=List[CategoryBreakdownOut])
def get_category_breakdown(db: Session = Depends(get_db), business_id: int = 1):
    results = db.query(
        Transaction.category,
        Transaction.transaction_type,
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("count")
    ).filter(
        Transaction.business_id == business_id,
        Transaction.is_deleted == False
    ).group_by(Transaction.category, Transaction.transaction_type).all()

    return [
        CategoryBreakdownOut(
            category=row.category,
            type=row.transaction_type,
            amount=round(float(row.total_amount), 2),
            count=int(row.count)
        )
        for row in results
    ]
