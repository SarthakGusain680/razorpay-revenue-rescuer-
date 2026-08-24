from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from . import models
from .database import engine, Base, get_db
from .ai_engine import decide_intervention


app = FastAPI(title="Razorpay Revenue Rescuer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_MESSAGES = 2

class CartPayload(BaseModel):
    user_email: str
    user_phone: str
    cart_value: float
    items: List[str]
    customer_type: str = "New"

def run_intervention(cart: models.AbandonedCart, db: Session):
    sent = db.query(models.Intervention).filter(
        models.Intervention.cart_id == cart.id,
        models.Intervention.status == "Sent"
    ).count()

    if sent >= MAX_MESSAGES:
        intervention = models.Intervention(
            cart_id=cart.id,
            action_type="stop",
            message_content="No message sent.",
            ai_reasoning=f"STOPPING RULE: User already received {sent} messages. Sending more would violate anti-spam compliance. Escalated to human review.",
            status="Stopped"
        )
        db.add(intervention)
        db.commit()
        return {"action": "stop", "reasoning": intervention.ai_reasoning}

    decision = decide_intervention(cart.cart_value, cart.items, cart.customer_type, sent)

    intervention = models.Intervention(
        cart_id=cart.id,
        action_type=decision.get("action", "send_whatsapp"),
        message_content=decision.get("message_template", ""),
        ai_reasoning=decision.get("reasoning", ""),
        status="Sent"
    )
    db.add(intervention)
    db.commit()
    return decision

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Recovery Engine is online and ready."}

@app.post("/webhook/abandoned-cart")
def abandoned_cart(payload: CartPayload, db: Session = Depends(get_db)):
    cart = models.AbandonedCart(
        user_email=payload.user_email,
        user_phone=payload.user_phone,
        cart_value=payload.cart_value,
        items=payload.items,
        customer_type=payload.customer_type, 
        status="Pending"
    )
    db.add(cart)
    db.commit()
    db.refresh(cart)
    decision = run_intervention(cart, db)
    return {"cart_id": cart.id, "ai_decision": decision}

@app.post("/api/intervene/{cart_id}")
def intervene(cart_id: int, db: Session = Depends(get_db)):
    cart = db.query(models.AbandonedCart).filter_by(id=cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    return run_intervention(cart, db)

@app.post("/api/recover/{cart_id}")
def recover(cart_id: int, db: Session = Depends(get_db)):
    cart = db.query(models.AbandonedCart).filter_by(id=cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    cart.status = "Recovered"
    db.commit()
    return {"message": f"Payment of Rs. {cart.cart_value} recovered!"}

@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    carts = db.query(models.AbandonedCart).order_by(models.AbandonedCart.id.desc()).all()
    recovered = [c for c in carts if c.status == "Recovered"]
    result = []
    for c in carts:
        interventions = db.query(models.Intervention).filter_by(cart_id=c.id).all()
        result.append({
            "id": c.id,
            "user_email": c.user_email,
            "cart_value": c.cart_value,
            "items": c.items,
            "status": c.status,
            "interventions": [
                {"action": i.action_type, "message": i.message_content,
                 "reasoning": i.ai_reasoning, "status": i.status}
                for i in interventions
            ]
        })
    return {
        "total_abandoned": len(carts),
        "total_recovered_count": len(recovered),
        "total_money_recovered": sum(c.cart_value for c in recovered),
        "carts": result
    }