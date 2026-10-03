import io
import os
from datetime import datetime
from app.extractor import extract_ledger_data
from app.database import SessionLocal
from app.models import Ledger, Transaction, User

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ALLOWED_USER_IDS = {123456789, 987654321, 555123456, 7596195250}

def save_staged_ledger_to_db(staged: dict, telegram_user_id: int = 123456789):
    """
    Persists staged ledger data and itemized transactions into PostgreSQL/SQLite database.
    """
    db = SessionLocal()
    try:
        raw = staged["raw"]
        ledger_date = raw.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
        
        # Check user
        user = db.query(User).filter(User.telegram_user_id == telegram_user_id).first()
        user_id = user.id if user else None

        # Upsert ledger
        existing_ledger = db.query(Ledger).filter(Ledger.ledger_date == ledger_date).first()
        if existing_ledger:
            ledger = existing_ledger
            ledger.opening_balance = staged["opening"]
            ledger.closing_balance = staged["closing"]
            ledger.calculated_balance = staged["calculated"]
            ledger.discrepancy = staged["discrepancy"]
            ledger.status = "confirmed" if staged["discrepancy"] == 0 else "pending"
            ledger.updated_at = datetime.utcnow()
            # Clear old transactions
            db.query(Transaction).filter(Transaction.ledger_id == ledger.id).delete()
        else:
            ledger = Ledger(
                ledger_date=ledger_date,
                uploaded_by=user_id,
                opening_balance=staged["opening"],
                closing_balance=staged["closing"],
                calculated_balance=staged["calculated"],
                discrepancy=staged["discrepancy"],
                status="confirmed" if staged["discrepancy"] == 0 else "pending"
            )
            db.add(ledger)
            db.commit()
            db.refresh(ledger)

        # Create transactions
        for tx in raw.get("transactions", []):
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
            "id": ledger.id,
            "ledger_date": ledger.ledger_date,
            "opening_balance": ledger.opening_balance,
            "closing_balance": ledger.closing_balance,
            "calculated_balance": ledger.calculated_balance,
            "discrepancy": ledger.discrepancy,
            "status": ledger.status
        }
    except Exception as e:
        db.rollback()
        print(f"[DB Error] Failed to commit staged ledger: {e}")
        raise e
    finally:
        db.close()

# Python Telegram Bot setup
try:
    from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
    from telegram.ext import (
        Application,
        CommandHandler,
        MessageHandler,
        CallbackQueryHandler,
        filters,
        ContextTypes
    )

    async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            "👋 Welcome to the Daily Ledger Automation Bot.\n"
            "Send a clear photo of today's ledger sheet to begin processing."
        )

    async def handle_ledger_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        if ALLOWED_USER_IDS and user_id not in ALLOWED_USER_IDS:
            await update.message.reply_text("⛔ Unauthorized. Your Telegram ID is not registered.")
            return

        progress_msg = await update.message.reply_text("📥 Image received. Analyzing ledger entries with Gemini Flash...")

        photo_file = await update.message.photo[-1].get_file()
        image_stream = io.BytesIO()
        await photo_file.download_to_memory(out=image_stream)
        image_bytes = image_stream.getvalue()

        try:
            data = extract_ledger_data(image_bytes)
        except Exception as err:
            await progress_msg.edit_text(f"❌ Failed to extract data: {str(err)}")
            return

        total_income = sum(float(t["amount"]) for t in data.get("transactions", []) if t.get("type") == "income")
        total_expense = sum(float(t["amount"]) for t in data.get("transactions", []) if t.get("type") == "expense")
        opening = float(data.get("opening_balance", 0.0))
        reported_closing = float(data.get("closing_balance", 0.0))

        calculated_closing = opening + total_income - total_expense
        discrepancy = reported_closing - calculated_closing

        context.user_data["staged_ledger"] = {
            "raw": data,
            "opening": opening,
            "income": total_income,
            "expense": total_expense,
            "closing": reported_closing,
            "calculated": calculated_closing,
            "discrepancy": discrepancy
        }

        status_flag = "✅ Matched" if discrepancy == 0 else f"⚠️ Discrepancy: Rs. {discrepancy:,.2f}"

        summary = (
            f"📋 *Extracted Ledger Summary*\n"
            f"📅 Date: `{data.get('date', 'N/A')}`\n"
            f"💵 Opening Cash: `Rs. {opening:,.2f}`\n"
            f"📈 Total Inflows: `+Rs. {total_income:,.2f}`\n"
            f"📉 Total Outflows: `-Rs. {total_expense:,.2f}`\n"
            f"💰 Expected Balance: `Rs. {calculated_closing:,.2f}`\n"
            f"📝 Cashier Count: `Rs. {reported_closing:,.2f}`\n"
            f"🔍 Status: *{status_flag}*\n\n"
            f"Confirm submission to dashboard?"
        )

        keyboard = [
            [
                InlineKeyboardButton("✅ Confirm & Save", callback_data="save_ledger"),
                InlineKeyboardButton("❌ Discard", callback_data="discard_ledger")
            ]
        ]
        await progress_msg.edit_text(summary, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

    async def handle_callback_decision(update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        if query.data == "save_ledger":
            staged = context.user_data.get("staged_ledger")
            if not staged:
                await query.edit_message_text("⚠️ Session expired. Please re-upload photo.")
                return
            
            try:
                save_staged_ledger_to_db(staged, update.effective_user.id)
                context.user_data.pop("staged_ledger", None)
                await query.edit_message_text("✅ Successfully saved and committed to Web Dashboard.")
            except Exception as e:
                await query.edit_message_text(f"❌ Error saving to database: {e}")
        
        elif query.data == "discard_ledger":
            context.user_data.pop("staged_ledger", None)
            await query.edit_message_text("❌ Record discarded. Please snap a clearer picture and try again.")

    def run_telegram_bot():
        if not TELEGRAM_TOKEN:
            print("[Telegram Bot] TELEGRAM_BOT_TOKEN environment variable not set. Bot polling disabled.")
            return
        app = Application.builder().token(TELEGRAM_TOKEN).build()
        app.add_handler(CommandHandler("start", start_command))
        app.add_handler(MessageHandler(filters.PHOTO, handle_ledger_photo))
        app.add_handler(CallbackQueryHandler(handle_callback_decision))
        print("[Telegram Bot] Starting polling...")
        app.run_polling()

except ImportError:
    def run_telegram_bot():
        print("[Telegram Bot] python-telegram-bot library not installed.")

if __name__ == "__main__":
    run_telegram_bot()
