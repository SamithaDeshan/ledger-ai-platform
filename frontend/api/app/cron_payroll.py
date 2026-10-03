import os
from datetime import datetime, date
from app.database import SessionLocal
from app.models import Payroll, User
import requests

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

def check_upcoming_payroll():
    """
    Scans the payroll table for active staff members whose pay_day_of_month is within 3 days.
    Generates notification alerts and optionally sends Telegram notifications to managers.
    """
    db = SessionLocal()
    alerts = []
    try:
        today = date.today()
        current_day = today.day
        
        employees = db.query(Payroll).all()
        managers = db.query(User).filter(User.role == "manager").all()
        manager_chat_ids = [m.telegram_user_id for m in managers if m.telegram_user_id]
        
        for emp in employees:
            if emp.status == "paid":
                continue
            
            # Days remaining until pay day
            days_due = emp.pay_day_of_month - current_day
            # Handle month boundary if needed
            if 0 <= days_due <= 3:
                alert_info = {
                    "id": emp.id,
                    "employee_name": emp.employee_name,
                    "base_salary": emp.base_salary,
                    "pay_day_of_month": emp.pay_day_of_month,
                    "days_remaining": days_due,
                    "status": emp.status,
                    "message": f"Salary due in {days_due} day(s) for {emp.employee_name} (Rs. {emp.base_salary:,.2f})"
                }
                alerts.append(alert_info)
                
                # If Telegram token is set and manager chat IDs exist, send message
                if TELEGRAM_TOKEN and manager_chat_ids:
                    for cid in manager_chat_ids:
                        text = (
                            f"🔔 *Payroll Reminder*\n"
                            f"👤 Employee: *{emp.employee_name}*\n"
                            f"💵 Base Salary: *Rs. {emp.base_salary:,.2f}*\n"
                            f"📅 Due Day of Month: *{emp.pay_day_of_month}* (In {days_due} days)\n"
                            f"Status: *{emp.status.upper()}*"
                        )
                        try:
                            requests.post(
                                f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                                json={"chat_id": cid, "text": text, "parse_mode": "Markdown"},
                                timeout=5
                            )
                        except Exception as e:
                            print(f"[Cron Payroll] Failed to send Telegram alert: {e}")

        return alerts
    finally:
        db.close()

if __name__ == "__main__":
    print("[Cron Payroll] Running daily payroll scan...")
    due_alerts = check_upcoming_payroll()
    print(f"[Cron Payroll] Found {len(due_alerts)} upcoming payroll reminders.")
    for a in due_alerts:
        print(f"  - {a['employee_name']}: Rs. {a['base_salary']} due on day {a['pay_day_of_month']}")
