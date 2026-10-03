import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if os.getenv("VERCEL"):
    DATABASE_URL = "sqlite:////tmp/ledger_ai.db"
    UPLOAD_DIR = "/tmp/uploads"
else:
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'ledger_ai.db')}")
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "85.0"))

os.makedirs(UPLOAD_DIR, exist_ok=True)
