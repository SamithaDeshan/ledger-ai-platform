from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import WhatsAppMessageIn, WhatsAppResponseOut
from app.whatsapp_service import handle_incoming_whatsapp_message

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp"])

@router.post("/webhook", response_model=WhatsAppResponseOut)
def whatsapp_webhook(payload: WhatsAppMessageIn, db: Session = Depends(get_db)):
    res = handle_incoming_whatsapp_message(
        db=db,
        message_text=payload.message_text,
        image_url=payload.image_url,
        phone_number=payload.from_number
    )

    detected_txs = res.get("detected_transactions", [])
    
    return WhatsAppResponseOut(
        message=res["message"],
        ledger_upload_id=res.get("ledger_upload_id"),
        detected_transactions=detected_txs,
        requires_verification=res.get("requires_verification", False)
    )
