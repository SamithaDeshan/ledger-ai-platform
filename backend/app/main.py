from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
import os
import json

from app.database import engine, Base, get_db, SessionLocal
from app.models import User, Ledger, Transaction, Payroll
from app.config import UPLOAD_DIR
from app.extractor import extract_ledger_data
from app.cron_payroll import check_upcoming_payroll

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Daily Ledger Processing & Analytics API",
    description="Backend API for Multimodal Vision Ledger Digitization, Reconciliation, Telegram Bot, & Analytics Dashboard",
    version="2.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def seed_initial_data():
    db = SessionLocal()
    try:
        # 1. Seed Users
        if db.query(User).count() == 0:
            mgr = User(
                telegram_user_id=123456789,
                full_name="Sarah Perera (Manager)",
                role="manager",
                is_active=True
            )
            emp = User(
                telegram_user_id=987654321,
                full_name="Kasun Fernando (Cashier)",
                role="employee",
                is_active=True
            )
            db.add_all([mgr, emp])
            db.commit()

        # 2. Seed Payroll if empty
        if db.query(Payroll).count() == 0:
            staff_payroll = [
                Payroll(employee_name="Kasun Fernando", base_salary=65000.0, pay_day_of_month=28, status="pending"),
                Payroll(employee_name="Nimal Silva", base_salary=58000.0, pay_day_of_month=30, status="unpaid"),
                Payroll(employee_name="Kamani Jayasinghe", base_salary=45000.0, pay_day_of_month=5, status="paid"),
            ]
            db.add_all(staff_payroll)
            db.commit()

        # 3. Seed Ledgers & Transactions if empty
        if db.query(Ledger).count() == 0:
            today = date.today()
            sample_dates = [(today - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
            
            user = db.query(User).filter(User.role == "employee").first()
            user_id = user.id if user else None

            sample_data = [
                {
                    "date": sample_dates[0],
                    "opening": 20000.0,
                    "closing": 35400.0,
                    "txs": [
                        ("income", "Sales", "Counter cash sales", 22000.0),
                        ("expense", "Supplies", "Paper & Packaging purchase", 4200.0),
                        ("expense", "Refreshments", "Staff tea & snacks", 2400.0)
                    ]
                },
                {
                    "date": sample_dates[1],
                    "opening": 35400.0,
                    "closing": 48100.0,
                    "txs": [
                        ("income", "Sales", "Daily Retail Sales", 21500.0),
                        ("expense", "Utilities", "Internet & Telephone Bill", 5800.0),
                        ("expense", "Transport", "Stock Delivery Van Fuel", 3000.0)
                    ]
                },
                {
                    "date": sample_dates[2],
                    "opening": 48100.0,
                    "closing": 62300.0,
                    "txs": [
                        ("income", "Sales", "Bulk Wholesaler Order", 28000.0),
                        ("expense", "Supplies", "Cleaning & Sanitizing Supplies", 3800.0),
                        ("expense", "Other", "Minor Hardware Repair", 1000.0)
                    ]
                },
                {
                    "date": sample_dates[3],
                    "opening": 62300.0,
                    "closing": 54100.0,
                    "txs": [
                        ("income", "Sales", "Evening Store Sales", 16500.0),
                        ("expense", "Supplies", "Vendor Raw Material Restock", 21200.0),
                        ("expense", "Transport", "Courier charges", 3500.0)
                    ]
                },
                {
                    "date": sample_dates[4],
                    "opening": 54100.0,
                    "closing": 71800.0,
                    "txs": [
                        ("income", "Sales", "Weekend Promotional Sales", 32000.0),
                        ("expense", "Utilities", "Electricity Bill", 11500.0),
                        ("expense", "Refreshments", "Staff Lunch", 2800.0)
                    ]
                },
                {
                    "date": sample_dates[5],
                    "opening": 71800.0,
                    "closing": 84200.0,
                    "txs": [
                        ("income", "Sales", "Retail Counter Sales", 24500.0),
                        ("expense", "Supplies", "Stationery & Receipt Rolls", 3600.0),
                        ("expense", "Transport", "Local Dispatch Fare", 850.0)
                    ]
                },
                {
                    "date": sample_dates[6], # Today
                    "opening": 84200.0,
                    "closing": 99350.0,
                    "txs": [
                        ("income", "Sales", "Counter Cash & Card Sales", 28500.0),
                        ("expense", "Supplies", "Store Inventory Purchase", 7200.0),
                        ("expense", "Utilities", "Water & Waste Disposal", 3150.0),
                        ("expense", "Transport", "Logistics Delivery Fee", 3000.0)
                    ]
                }
            ]

            for s in sample_data:
                tot_inc = sum(tx[3] for tx in s["txs"] if tx[0] == "income")
                tot_exp = sum(tx[3] for tx in s["txs"] if tx[0] == "expense")
                calc_closing = s["opening"] + tot_inc - tot_exp
                disc = s["closing"] - calc_closing

                ledger = Ledger(
                    ledger_date=s["date"],
                    uploaded_by=user_id,
                    opening_balance=s["opening"],
                    closing_balance=s["closing"],
                    calculated_balance=calc_closing,
                    discrepancy=disc,
                    status="confirmed" if disc == 0 else "pending"
                )
                db.add(ledger)
                db.commit()
                db.refresh(ledger)

                for tx in s["txs"]:
                    t = Transaction(
                        ledger_id=ledger.id,
                        type=tx[0],
                        category=tx[1],
                        description=tx[2],
                        amount=tx[3]
                    )
                    db.add(t)
                db.commit()

    finally:
        db.close()

@app.get("/")
def root():
    return {
        "system": "Daily Ledger Automation & Analytics API",
        "status": "operational",
        "vision_engine": "Gemini 2.0 Flash via OpenRouter",
        "telegram_bot": "Active"
    }

from app.routers import auth, transactions as transactions_router

# Include Routers
app.include_router(auth.router)
app.include_router(transactions_router.router)

@app.get("/api/dashboard/overview")
def get_dashboard_overview(user_role: str = "manager", db: Session = Depends(get_db)):
    # 1. Fetch ledgers sorted by date
    ledgers = db.query(Ledger).order_by(Ledger.ledger_date.asc()).all()
    
    # Latest ledger for cashier balance
    latest_ledger = ledgers[-1] if ledgers else None
    cashier_balance = latest_ledger.closing_balance if latest_ledger else 0.0
    
    # 2. Inflow / Outflow trend data
    cashflow = []
    total_turnover = 0.0
    total_income_all = 0.0
    total_expense_all = 0.0
    
    for l in ledgers:
        txs = db.query(Transaction).filter(Transaction.ledger_id == l.id).all()
        inflow = sum(t.amount for t in txs if t.type == "income")
        outflow = sum(t.amount for t in txs if t.type == "expense")
        cashflow.append({
            "date": l.ledger_date,
            "inflow": inflow,
            "outflow": outflow,
            "closing": l.closing_balance
        })
        total_turnover += inflow
        total_income_all += inflow
        total_expense_all += outflow

    # Net Margin Calculation
    net_margin = round(((total_income_all - total_expense_all) / total_income_all * 100), 1) if total_income_all > 0 else 0.0

    # 3. Expense category breakdown
    expense_txs = db.query(Transaction).filter(Transaction.type == "expense").all()
    cat_map = {}
    for tx in expense_txs:
        cat_map[tx.category] = cat_map.get(tx.category, 0.0) + tx.amount

    expense_breakdown = [{"category": k, "amount": round(v, 2)} for k, v in cat_map.items()]

    # 4. Payroll Alerts (Salaries due within 3 days or unpaid)
    today_day = date.today().day
    payroll_records = db.query(Payroll).all()
    payroll_alerts = []
    for p in payroll_records:
        if p.status in ["unpaid", "pending"]:
            payroll_alerts.append({
                "id": p.id,
                "employee_name": p.employee_name,
                "base_salary": p.base_salary,
                "pay_day_of_month": p.pay_day_of_month,
                "status": p.status
            })

    # 5. Master Ledgers list with transactions
    master_ledgers = []
    for l in reversed(ledgers):
        txs = db.query(Transaction).filter(Transaction.ledger_id == l.id).all()
        master_ledgers.append({
            "id": l.id,
            "ledger_date": l.ledger_date,
            "opening_balance": l.opening_balance,
            "closing_balance": l.closing_balance,
            "calculated_balance": l.calculated_balance,
            "discrepancy": l.discrepancy,
            "status": l.status,
            "created_at": l.created_at.isoformat(),
            "transactions": [
                {
                    "id": t.id,
                    "type": t.type,
                    "category": t.category,
                    "description": t.description,
                    "amount": t.amount,
                    "is_edited": t.is_edited or False
                } for t in txs
            ]
        })

    # 6. Today's upload status for Cashier / Employee
    today_str = date.today().isoformat()
    today_ledger = db.query(Ledger).filter(Ledger.ledger_date == today_str).first()
    today_status = {
        "date": today_str,
        "is_uploaded": today_ledger is not None,
        "status": today_ledger.status if today_ledger else "pending",
        "cashier_balance": cashier_balance,
        "opening_balance": today_ledger.opening_balance if today_ledger else cashier_balance,
        "closing_balance": today_ledger.closing_balance if today_ledger else cashier_balance,
        "discrepancy": today_ledger.discrepancy if today_ledger else 0.0
    }

    return {
        "metrics": {
            "cashierBalance": cashier_balance,
            "monthlyTurnover": total_turnover,
            "netMargin": net_margin,
            "totalInflow": total_income_all,
            "totalOutflow": total_expense_all,
            "pendingLedgersCount": sum(1 for l in ledgers if l.status == "pending")
        },
        "cashflow": cashflow,
        "expenseBreakdown": expense_breakdown,
        "payrollAlerts": payroll_alerts,
        "masterLedgers": master_ledgers,
        "todayStatus": today_status
    }

@app.post("/api/ledger/upload")
async def upload_ledger_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Simulates / processes image upload via Multimodal Vision (Gemini Flash via OpenRouter),
    runs formula verification, and records ledger entry.
    """
    contents = await file.read()
    
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(contents)

    data = extract_ledger_data(contents)
    
    opening = float(data.get("opening_balance", 0.0))
    closing = float(data.get("closing_balance", 0.0))
    txs = data.get("transactions", [])

    total_income = sum(float(t.get("amount", 0.0)) for t in txs if t.get("type") == "income")
    total_expense = sum(float(t.get("amount", 0.0)) for t in txs if t.get("type") == "expense")
    
    calculated_closing = opening + total_income - total_expense
    discrepancy = closing - calculated_closing
    ledger_date = data.get("date", date.today().isoformat())

    existing = db.query(Ledger).filter(Ledger.ledger_date == ledger_date).first()
    if existing:
        ledger = existing
        ledger.opening_balance = opening
        ledger.closing_balance = closing
        ledger.calculated_balance = calculated_closing
        ledger.discrepancy = discrepancy
        ledger.status = "confirmed" if discrepancy == 0 else "pending"
        ledger.image_storage_url = f"/uploads/{file.filename}"
        db.query(Transaction).filter(Transaction.ledger_id == ledger.id).delete()
    else:
        ledger = Ledger(
            ledger_date=ledger_date,
            opening_balance=opening,
            closing_balance=closing,
            calculated_balance=calculated_closing,
            discrepancy=discrepancy,
            status="confirmed" if discrepancy == 0 else "pending",
            image_storage_url=f"/uploads/{file.filename}"
        )
        db.add(ledger)
        db.commit()
        db.refresh(ledger)

    for tx in txs:
        t = Transaction(
            ledger_id=ledger.id,
            type=tx.get("type", "expense").lower(),
            category=tx.get("category", "Other"),
            description=tx.get("description", ""),
            amount=float(tx.get("amount", 0.0))
        )
        db.add(t)
    db.commit()

    return {
        "message": "Ledger extracted and saved successfully",
        "ledger_id": ledger.id,
        "extracted": data,
        "verification": {
            "opening": opening,
            "inflows": total_income,
            "outflows": total_expense,
            "calculated_closing": calculated_closing,
            "reported_closing": closing,
            "discrepancy": discrepancy,
            "status": ledger.status
        }
    }

@app.post("/api/ledger/{ledger_id}/status")
def update_ledger_status(ledger_id: str, status: str, db: Session = Depends(get_db)):
    ledger = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if not ledger:
        raise HTTPException(status_code=404, detail="Ledger not found")
    ledger.status = status
    db.commit()
    return {"message": f"Ledger status updated to {status}", "id": ledger_id, "status": status}

@app.get("/api/payroll/alerts")
def get_payroll_alerts():
    return check_upcoming_payroll()
