import os
from PIL import Image, ImageDraw, ImageFont

upload_dir = "/Users/SamithaDeshan/.gemini/antigravity/scratch/ledger-ai/backend/uploads"
os.makedirs(upload_dir, exist_ok=True)

def create_sample_ledger(filename, title, entries):
    # Create realistic aged paper canvas
    width, height = 700, 500
    img = Image.new("RGB", (width, height), color=(250, 248, 240))
    draw = ImageDraw.Draw(img)

    # Draw ledger blue grid lines & red margin
    for y in range(60, height, 45):
        draw.line([(30, y), (width - 30, y)], fill=(200, 215, 235), width=1)
    
    # Red left margin line
    draw.line([(180, 40), (180, height - 30)], fill=(240, 180, 180), width=2)
    # Right column divider line for amounts
    draw.line([(520, 40), (520, height - 30)], fill=(200, 215, 235), width=2)

    # Outer border
    draw.rectangle([(25, 25), (width - 25, height - 25)], outline=(180, 170, 150), width=2)

    # Title header
    draw.text((35, 30), title, fill=(40, 40, 70))
    draw.text((530, 30), "Amount (Rs)", fill=(40, 40, 70))

    y_offset = 75
    for desc, amt in entries:
        draw.text((45, y_offset), desc, fill=(30, 30, 90))
        draw.text((535, y_offset), f"{amt:,.2f}", fill=(180, 30, 30) if "15" not in str(amt) and "42" not in str(amt) and "28" not in str(amt) else (20, 120, 30))
        y_offset += 45

    img.save(os.path.join(upload_dir, filename))
    print(f"Generated sample ledger image: {filename}")

# Sample 1: Sinhala + Mixed
create_sample_ledger("sample_ledger_sinhala.png", "22/09/2026 - Daily Ledger", [
    ("විකුණුම් (Sales)", 15000.0),
    ("විදුලි බිල (Electricity)", 3500.0),
    ("Supplier Payment", 8000.0),
    ("බස් ගාස්තු (Transport)", 1200.0),
    ("Sales", 7500.0)
])

# Sample 2: English Printed
create_sample_ledger("sample_ledger_english.png", "22/09/2026 - Store Ledger", [
    ("Daily Sales", 42500.0),
    ("Rent Payment", 15000.0),
    ("Electricity Bill", 4200.0),
    ("Staff Salary", 12000.0)
])

# Sample 3: Mixed Sinhala/English
create_sample_ledger("sample_ledger_mixed.png", "22/09/2026 - Mixed Ledger", [
    ("විකුණුම්", 28000.0),
    ("Electricity බිල", 3500.0),
    ("සැපයුම්කරු", 9500.0),
    ("Transport", 1800.0)
])
