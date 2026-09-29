from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import LedgerUpload, Transaction, Business
from app.ocr_engine import process_ledger_image
from app.audit_engine import log_transaction_creation
from app.config import UPLOAD_DIR
import os
import shutil

router = APIRouter(prefix="/api/ledger", tags=["Ledger Uploads"])

@router.post("/upload")
async def upload_ledger(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ocr_res = process_ledger_image(file_path, filename=file.filename)

    upload = LedgerUpload(
        business_id=1,
        image_url=f"/uploads/{file.filename}",
        ledger_date=ocr_res["ledger_date"],
        detected_language=ocr_res["detected_language"],
        processing_status="completed"
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    created_txs = []
    for tx_data in ocr_res["transactions"]:
        tx = Transaction(
            business_id=1,
            ledger_upload_id=upload.id,
            transaction_date=tx_data["transaction_date"],
            original_description=tx_data["original_description"],
            language=tx_data["language"],
            transaction_type=tx_data["transaction_type"],
            category=tx_data["category"],
            amount=tx_data["amount"],
            confidence_score=tx_data["confidence_score"],
            verification_status=tx_data["verification_status"],
            source_image_reference=f"/uploads/{file.filename}",
            bounding_box=tx_data["bounding_box"]
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)

        log_transaction_creation(db, tx, change_source="DASHBOARD")
        created_txs.append(tx)

    return {
        "upload_id": upload.id,
        "image_url": upload.image_url,
        "detected_language": upload.detected_language,
        "transactions_count": len(created_txs),
        "transactions": created_txs
    }

@router.get("/uploads/{upload_id}")
def get_upload_details(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(LedgerUpload).filter(LedgerUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Ledger upload not found")
    return upload
