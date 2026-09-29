import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.extractor import extract_ledger_data
from app.bot import save_staged_ledger_to_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    db = TestingSessionLocal()
    try:
        from app.models import User, Ledger, Transaction
        if db.query(Ledger).count() == 0:
            l = Ledger(ledger_date="2026-09-29", opening_balance=10000.0, closing_balance=15000.0, calculated_balance=15000.0, status="confirmed")
            db.add(l)
            db.commit()
            db.refresh(l)

            t = Transaction(ledger_id=l.id, type="income", category="Sales", description="Test Sales", amount=5000.0)
            db.add(t)
            db.commit()
    finally:
        db.close()


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "operational"

def test_dashboard_overview_api():
    response = client.get("/api/dashboard/overview?user_role=manager")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "cashflow" in data
    assert "expenseBreakdown" in data
    assert "masterLedgers" in data

def test_extractor_and_formula_verification():
    extracted = extract_ledger_data(b"fake_image_bytes")
    assert "date" in extracted
    assert "opening_balance" in extracted
    assert "closing_balance" in extracted
    assert "transactions" in extracted

    inflows = sum(t["amount"] for t in extracted["transactions"] if t["type"] == "income")
    outflows = sum(t["amount"] for t in extracted["transactions"] if t["type"] == "expense")
    calc_closing = extracted["opening_balance"] + inflows - outflows
    discrepancy = extracted["closing_balance"] - calc_closing

    # Verify staged commit
    staged = {
        "raw": extracted,
        "opening": extracted["opening_balance"],
        "income": inflows,
        "expense": outflows,
        "closing": extracted["closing_balance"],
        "calculated": calc_closing,
        "discrepancy": discrepancy
    }

    ledger = save_staged_ledger_to_db(staged, 123456789)
    assert ledger["opening_balance"] == extracted["opening_balance"]
    assert ledger["closing_balance"] == extracted["closing_balance"]

def test_otp_authentication_flow():
    # 1. Request OTP
    res_req = client.post("/api/auth/request-otp", json={"telegram_user_id": 123456789})
    assert res_req.status_code == 200
    otp_data = res_req.json()
    assert "demo_code" in otp_data
    code = otp_data["demo_code"]

    # 2. Verify OTP
    res_ver = client.post("/api/auth/verify-otp", json={"telegram_user_id": 123456789, "otp_code": code})
    assert res_ver.status_code == 200
    assert res_ver.json()["authenticated"] == True
    assert res_ver.json()["user"]["role"] == "manager"

def test_transaction_edit_and_audit_log():
    # Fetch overview to get a transaction ID
    res_overview = client.get("/api/dashboard/overview?user_role=manager")
    master_ledgers = res_overview.json()["masterLedgers"]
    assert len(master_ledgers) > 0
    tx = master_ledgers[0]["transactions"][0]

    # Edit transaction
    res_edit = client.put(f"/api/transactions/{tx['id']}", json={
        "amount": tx["amount"] + 500.0,
        "reason": "Corrected misread digit",
        "changed_by": "Cashier Employee"
    })
    assert res_edit.status_code == 200
    assert res_edit.json()["is_edited"] == True

    # Fetch audit logs
    res_logs = client.get(f"/api/transactions/{tx['id']}/audit-logs")
    assert res_logs.status_code == 200
    logs = res_logs.json()
    assert len(logs) > 0
    assert logs[0]["user_name"] == "Cashier Employee"
    assert logs[0]["field_name"] == "amount"

