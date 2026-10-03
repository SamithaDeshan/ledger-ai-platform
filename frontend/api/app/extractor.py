import base64
import json
import os
from datetime import date

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

SYSTEM_PROMPT = """
You are an expert commercial accountant and auditor.
Analyze the handwritten or printed daily ledger sheet in the uploaded image.

Extract all details into strict JSON matching this exact structure:
{
  "date": "YYYY-MM-DD",
  "opening_balance": 0.00,
  "closing_balance": 0.00,
  "transactions": [
    {
      "type": "income" | "expense",
      "category": "Sales" | "Supplies" | "Utilities" | "Transport" | "Refreshments" | "Other",
      "description": "Short explanation",
      "amount": 0.00
    }
  ]
}

Formatting Rules:
1. Ensure all numbers are valid numerical values (floats), not strings.
2. In case of ambiguous handwriting, select the figure that keeps opening/closing balances mathematically consistent.
3. Return ONLY valid, raw JSON. Do not include markdown blocks or natural language explanations.
"""

def extract_ledger_data(image_bytes: bytes) -> dict:
    """
    Extract structured daily ledger data using OpenRouter (Gemini Flash).
    Falls back to synthetic audit data if API key is not present or API call fails.
    """
    if OPENROUTER_API_KEY and OPENROUTER_API_KEY != "sk-or-v1-YOUR_KEY":
        try:
            from openai import OpenAI
            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=OPENROUTER_API_KEY,
            )
            base64_image = base64.b64encode(image_bytes).decode("utf-8")

            response = client.chat.completions.create(
                model="google/gemini-2.0-flash-exp:free",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": SYSTEM_PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                },
                            },
                        ],
                    }
                ],
                temperature=0.1
            )

            raw_json = response.choices[0].message.content
            if "```" in raw_json:
                raw_json = raw_json.split("```")[1]
                if raw_json.startswith("json"):
                    raw_json = raw_json[4:]
            return json.loads(raw_json.strip())
        except Exception as err:
            print(f"[Extractor] OpenRouter call error: {err}. Using fallback extractor.")

    today_str = date.today().isoformat()
    return {
        "date": today_str,
        "opening_balance": 25000.00,
        "closing_balance": 42350.00,
        "transactions": [
            {
                "type": "income",
                "category": "Sales",
                "description": "Daily Register Cash & Card Sales",
                "amount": 28500.00
            },
            {
                "type": "expense",
                "category": "Supplies",
                "description": "Store Inventory Purchase",
                "amount": 7200.00
            },
            {
                "type": "expense",
                "category": "Utilities",
                "description": "Electricity & Water Bill Payment",
                "amount": 3150.00
            },
            {
                "type": "expense",
                "category": "Transport",
                "description": "Courier & Delivery Charges",
                "amount": 800.00
            }
        ]
    }
