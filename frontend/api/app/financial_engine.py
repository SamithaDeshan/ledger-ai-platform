from typing import Dict, Tuple, List
from sqlalchemy.orm import Session
from app.models import Transaction
from datetime import datetime, timedelta

# Category Mapping Rules
CATEGORY_MAP: Dict[str, Tuple[str, str]] = {
    # Sinhala Income
    "විකුණුම්": ("Sales", "Income"),
    "භාණ්ඩ විකිණීම": ("Sales", "Income"),
    "සේවා ආදායම": ("Service Income", "Income"),
    "වෙනත් ආදායම්": ("Other Income", "Income"),
    
    # English Income
    "sales": ("Sales", "Income"),
    "cash sales": ("Sales", "Income"),
    "service income": ("Service Income", "Income"),
    "other income": ("Other Income", "Income"),

    # Sinhala Expenses
    "විදුලි බිල": ("Electricity", "Expense"),
    "විදුලි": ("Electricity", "Expense"),
    "විදුලි වියදම": ("Electricity", "Expense"),
    "සැපයුම්කරු": ("Supplier", "Expense"),
    "සැපයුම්කරු ගෙවීම": ("Supplier", "Expense"),
    "ප්රවාහනය": ("Transport", "Expense"),
    "ප්රවාහන වියදම්": ("Transport", "Expense"),
    "බස් ගාස්තු": ("Transport", "Expense"),
    "කුලී": ("Rent", "Expense"),
    "ගොඩනැගිලි කුලිය": ("Rent", "Expense"),
    "වැටුප්": ("Salary", "Expense"),
    "සේවක වැටුප්": ("Salary", "Expense"),
    "ජල බිල": ("Water", "Expense"),
    "නඩත්තු": ("Maintenance", "Expense"),
    "ඉන්ටර්නෙට්": ("Internet", "Expense"),
    "දුරකථන": ("Telephone", "Expense"),

    # English Expenses
    "electricity": ("Electricity", "Expense"),
    "electricity bill": ("Electricity", "Expense"),
    "supplier": ("Supplier", "Expense"),
    "supplier payment": ("Supplier", "Expense"),
    "transport": ("Transport", "Expense"),
    "bus fare": ("Transport", "Expense"),
    "rent": ("Rent", "Expense"),
    "salary": ("Salary", "Expense"),
    "water": ("Water", "Expense"),
    "maintenance": ("Maintenance", "Expense"),
    "internet": ("Internet", "Expense"),
    "telephone": ("Telephone", "Expense"),
    "stock purchase": ("Stock Purchase", "Expense")
}

def standardize_category(description: str, default_type: str = "Expense") -> Tuple[str, str]:
    clean_desc = description.strip().lower()
    
    for key, (std_cat, std_type) in CATEGORY_MAP.items():
        if key in clean_desc or clean_desc in key:
            return std_cat, std_type

    # Fallback heuristics
    if "sale" in clean_desc or "income" in clean_desc or "විකුණ" in clean_desc or "ආදාය" in clean_desc:
        return "Sales", "Income"
    
    return "Other", default_type

def calculate_dashboard_stats(db: Session, business_id: int = 1) -> dict:
    active_txs = db.query(Transaction).filter(
        Transaction.business_id == business_id,
        Transaction.is_deleted == False
    ).all()

    today_str = datetime.now().strftime("%d/%m/%Y")
    current_date = datetime.now()
    
    today_inc = 0.0
    today_exp = 0.0
    weekly_inc = 0.0
    weekly_exp = 0.0
    monthly_inc = 0.0
    monthly_exp = 0.0
    awaiting_ver_count = 0

    for tx in active_txs:
        if tx.verification_status == "Awaiting Verification":
            awaiting_ver_count += 1
            
        amt = tx.amount
        is_inc = tx.transaction_type == "Income"

        # Check date string matches
        tx_date_str = tx.transaction_date.strip()
        
        # Parse transaction date if possible
        tx_dt = None
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
            try:
                tx_dt = datetime.strptime(tx_date_str, fmt)
                break
            except ValueError:
                pass
        
        # Today
        if tx_date_str == today_str or (tx_dt and tx_dt.date() == current_date.date()):
            if is_inc:
                today_inc += amt
            else:
                today_exp += amt
        
        # Weekly (within last 7 days)
        if tx_dt and (current_date - tx_dt).days <= 7:
            if is_inc:
                weekly_inc += amt
            else:
                weekly_exp += amt
        else: # Default include all in current month/weekly context if date format varies
            if is_inc:
                weekly_inc += amt
            else:
                weekly_exp += amt

        # Monthly
        if is_inc:
            monthly_inc += amt
        else:
            monthly_exp += amt

    return {
        "today_income": round(today_inc, 2),
        "today_expense": round(today_exp, 2),
        "today_net": round(today_inc - today_exp, 2),
        "weekly_income": round(weekly_inc, 2),
        "weekly_expense": round(weekly_exp, 2),
        "weekly_net": round(weekly_inc - weekly_exp, 2),
        "monthly_income": round(monthly_inc, 2),
        "monthly_expense": round(monthly_exp, 2),
        "monthly_net": round(monthly_inc - monthly_exp, 2),
        "total_transactions": len(active_txs),
        "awaiting_verification_count": awaiting_ver_count
    }
