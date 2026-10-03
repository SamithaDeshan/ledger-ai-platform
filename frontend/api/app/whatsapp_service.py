from sqlalchemy.orm import Session
from app.models import LedgerUpload, Transaction, Business
from app.ocr_engine import process_ledger_image
from app.audit_engine import log_transaction_creation, log_transaction_update, log_transaction_verification
import re

def handle_incoming_whatsapp_message(db: Session, message_text: str = None, image_url: str = None, phone_number: str = "+94771234567") -> dict:
    # Ensure default business exists
    business = db.query(Business).filter(Business.phone_number == phone_number).first()
    if not business:
        business = Business(name="Samitha Retail Stores", phone_number=phone_number)
        db.add(business)
        db.commit()
        db.refresh(business)

    # Scenario A: User uploaded a ledger photograph
    if image_url or (message_text and ("photo" in message_text.lower() or "ledger" in message_text.lower() or "image" in message_text.lower())):
        img_ref = image_url if image_url else "sample_ledger_sinhala.png"
        
        ocr_result = process_ledger_image(img_ref, filename=img_ref)
        
        upload = LedgerUpload(
            business_id=business.id,
            image_url=img_ref,
            ledger_date=ocr_result["ledger_date"],
            detected_language=ocr_result["detected_language"],
            processing_status="completed"
        )
        db.add(upload)
        db.commit()
        db.refresh(upload)

        tx_models = []
        low_conf_found = False
        total_income = 0.0
        total_expense = 0.0

        for tx_data in ocr_result["transactions"]:
            tx = Transaction(
                business_id=business.id,
                ledger_upload_id=upload.id,
                transaction_date=tx_data["transaction_date"],
                original_description=tx_data["original_description"],
                language=tx_data["language"],
                transaction_type=tx_data["transaction_type"],
                category=tx_data["category"],
                amount=tx_data["amount"],
                confidence_score=tx_data["confidence_score"],
                verification_status=tx_data["verification_status"],
                source_image_reference=img_ref,
                bounding_box=tx_data["bounding_box"]
            )
            db.add(tx)
            db.commit()
            db.refresh(tx)
            
            log_transaction_creation(db, tx, change_source="AI")
            tx_models.append(tx)

            if tx.transaction_type == "Income":
                total_income += tx.amount
            else:
                total_expense += tx.amount

            if tx.verification_status == "Awaiting Verification":
                low_conf_found = True

        net_bal = total_income - total_expense
        
        reply_lines = [
            "LedgerAI 🤖\n",
            f"📅 {ocr_result['ledger_date']}\n",
            f"ආදායම: Rs. {total_income:,.2f}",
            f"වියදම: Rs. {total_expense:,.2f}",
            f"ශුද්ධය: Rs. {net_bal:,.2f}\n",
            f"Transactions: {len(tx_models)}\n"
        ]

        if low_conf_found:
            reply_lines.append("⚠️ Transaction එකක් verify කරන්න අවශ්යයි.\n")
            reply_lines.append("Reply 'CONFIRM' or send correction e.g. 'Transport 500'")
        else:
            reply_lines.append("✅ සියලුම Transactions සාර්ථකව Dashboard එකට එකතු කරන ලදී.")

        return {
            "message": "\n".join(reply_lines),
            "ledger_upload_id": upload.id,
            "detected_transactions": tx_models,
            "requires_verification": low_conf_found
        }

    # Scenario B: User sends text correction command (e.g., "CONFIRM" or "Electricity 3500")
    if message_text:
        text_clean = message_text.strip()
        
        # Confirm command
        if text_clean.upper() == "CONFIRM":
            unverified = db.query(Transaction).filter(
                Transaction.business_id == business.id,
                Transaction.verification_status == "Awaiting Verification",
                Transaction.is_deleted == False
            ).all()

            for tx in unverified:
                tx.verification_status = "Verified"
                log_transaction_verification(db, tx, change_source="WHATSAPP")

            db.commit()

            return {
                "message": "LedgerAI 🤖\n\n✅ සියලුම Transactions සාර්ථකව Verify කරන ලදී. Dashboard එක Update විය.",
                "requires_verification": False
            }

        # Value edit command (e.g. "Electricity 3500" or "Transport 500")
        match = re.search(r'([a-zA-Z\u0D80-\u0DFF\s]+)\s+(\d+[\.,]?\d*)', text_clean)
        if match:
            target_desc_query = match.group(1).strip().lower()
            new_amt = float(match.group(2).replace(',', ''))

            # Find matching recent transaction
            recent_txs = db.query(Transaction).filter(
                Transaction.business_id == business.id,
                Transaction.is_deleted == False
            ).order_by(Transaction.id.desc()).limit(10).all()

            matched_tx = None
            for tx in recent_txs:
                if (target_desc_query in tx.original_description.lower() or 
                    target_desc_query in tx.category.lower() or 
                    tx.original_description.lower() in target_desc_query):
                    matched_tx = tx
                    break

            if matched_tx:
                old_amt = matched_tx.amount
                matched_tx.amount = new_amt
                matched_tx.verification_status = "Modified"
                
                log_transaction_update(
                    db=db,
                    transaction=matched_tx,
                    field_name="amount",
                    old_value=f"{old_amt:,.2f}",
                    new_value=f"{new_amt:,.2f}",
                    user_name="Business Owner",
                    reason="WhatsApp correction text",
                    change_source="WHATSAPP"
                )
                db.commit()

                return {
                    "message": f"LedgerAI 🤖\n\nUpdated successfully! ✏️\n\n{matched_tx.category}\nPrevious: Rs. {old_amt:,.2f}\nUpdated: Rs. {new_amt:,.2f}\n\nDashboard recalculated automatically!",
                    "requires_verification": False
                }

    return {
        "message": "LedgerAI 🤖\n\nකරුණාකර ඔබගේ දෛනික Ledger සටහනේ ඡායාරූපයක් එවන්න.",
        "requires_verification": False
    }
