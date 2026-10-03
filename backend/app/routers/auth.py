import random
import os
import requests
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, OTPToken

router = APIRouter(prefix="/api/auth", tags=["auth"])

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

class OTPRequest(BaseModel):
    telegram_user_id: int

class OTPVerify(BaseModel):
    telegram_user_id: int
    otp_code: str

@router.post("/request-otp")
def request_otp(payload: OTPRequest, db: Session = Depends(get_db)):
    """
    Generates a 6-digit OTP for the given Telegram User ID.
    Dispatches the OTP via Telegram Bot message to the user.
    """
    telegram_id = payload.telegram_user_id

    # Check if user is registered in users table or allowed list
    user = db.query(User).filter(User.telegram_user_id == telegram_id).first()
    if not user:
        # Auto register demo account if in default allowed list for convenience
        if telegram_id in {123456789, 987654321, 555123456, 7596195250}:
            role = "manager" if telegram_id == 123456789 else "employee"
            if telegram_id == 7596195250:
                name = "Nethsara"
            elif role == "manager":
                name = "Owner (Sarah)"
            else:
                name = "Cashier Employee"
            user = User(telegram_user_id=telegram_id, full_name=name, role=role)
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Telegram User ID is not registered in the system."
            )

    # Generate random 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # Invalidate previous unused tokens for user
    db.query(OTPToken).filter(
        OTPToken.telegram_user_id == telegram_id,
        OTPToken.is_used == False
    ).update({"is_used": True})

    # Save new OTP Token
    token_entry = OTPToken(
        telegram_user_id=telegram_id,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False
    )
    db.add(token_entry)
    db.commit()

    # Send OTP via Telegram Bot API if token set
    telegram_sent = False
    if TELEGRAM_TOKEN:
        try:
            msg = (
                f"🔐 *LedgerAI Login OTP*\n"
                f"Your 6-digit verification code is: `{otp_code}`\n"
                f"Valid for 5 minutes. Do not share this code."
            )
            res = requests.post(
                f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                json={"chat_id": telegram_id, "text": msg, "parse_mode": "Markdown"},
                timeout=5
            )
            telegram_sent = res.status_code == 200
        except Exception as e:
            print(f"[OTP Auth] Failed to dispatch Telegram message: {e}")

    return {
        "message": f"OTP dispatched to Telegram ID {telegram_id}",
        "telegram_sent": telegram_sent,
        "demo_code": otp_code, # Expose for easy testing when offline
        "user_name": user.full_name,
        "role": user.role
    }

@router.post("/verify-otp")
def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    """
    Validates 6-digit OTP and authenticates user session.
    """
    token_entry = db.query(OTPToken).filter(
        OTPToken.telegram_user_id == payload.telegram_user_id,
        OTPToken.otp_code == payload.otp_code,
        OTPToken.is_used == False
    ).first()

    if not token_entry:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP code."
        )

    if datetime.utcnow() > token_entry.expires_at:
        token_entry.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OTP code has expired. Please request a new code."
        )

    # Mark as used
    token_entry.is_used = True
    db.commit()

    user = db.query(User).filter(User.telegram_user_id == payload.telegram_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": "OTP Verification Successful",
        "authenticated": True,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "role": user.role,
            "telegram_user_id": user.telegram_user_id
        }
    }
