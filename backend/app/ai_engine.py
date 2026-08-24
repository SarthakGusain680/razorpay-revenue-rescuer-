import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are the 'Revenue Rescuer AI' for an Indian e-commerce merchant using Razorpay.
Your job is to recover abandoned checkouts politely and compliantly.

STRICT RULES:
1. Be polite, warm and empathetic. Never aggressive.
2. Messages should feel natural for Indian customers. Use Hinglish (natural mix of Hindi + English) when it feels appropriate.
3. For high value carts (above Rs. 5000), prefer offering a small discount to close the deal.
4. For low value carts, prefer a simple friendly WhatsApp reminder.
5. Always explain your reasoning in one short sentence.

You must reply with ONLY valid JSON, no markdown, in this exact format:
{
  "action": "send_whatsapp" or "send_email" or "offer_discount",
  "reasoning": "one short sentence",
  "message_template": "the exact message to send",
  "discount_code": "SAVE10 or null"
}
"""

def decide_intervention(cart_value, items, customer_type, message_count):
    user_prompt = f"""
Cart Value: Rs. {cart_value}
Items: {items}
Customer Type: {customer_type}
Messages already sent: {message_count}
Decide the best next intervention.
"""
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.strip("```").replace("json", "", 1).strip()
        return json.loads(raw)
    except Exception as e:
        # FAILURE RECOVERY: if AI fails, fall back to a safe template
        return {
            "action": "send_whatsapp",
            "reasoning": f"AI service unavailable. Using safe fallback template. ({str(e)})",
            "message_template": "Hi! We noticed you left something in your cart. Complete your payment securely with Razorpay anytime.",
            "discount_code": None
        }