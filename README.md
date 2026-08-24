---
title: Revenue Rescuer Backend
sdk: docker
app_port: 7860
---

LIVE AT :  https://razorpay-revenue-rescuer.vercel.app

# ⚡ Revenue Rescuer

Track 03 — AI Revenue Recovery | Razorpay Buildathon 2026

Lost revenue, recovered. An AI agent that detects abandoned checkouts,
intervenes politely, and wins the money back — every action bounded,
compliant, and explained.

Live demo: (paste your Vercel URL here after deployment)

## The Problem

Most e-commerce checkouts are abandoned. For merchants on Razorpay that is
revenue silently dying: a payment fails, a cart is left, a subscription
lapses. Humans cannot chase every cart in real time. A bounded, explainable
AI agent can.

## The Solution

Revenue Rescuer closes the loop end-to-end:

1. Detect — a webhook flags an abandoned checkout in real time.
2. Diagnose — the AI analyses cart value, items and customer history.
3. Intervene — a polite, personalised Hinglish nudge (discount only when it earns it).
4. Recover — payments are tracked and recovered money is measured across the batch.

## How We Meet The Bar

- Measured money recovered — the dashboard reports live ₹ recovered across the batch.
- Compliant escalation — polite → incentive → stop. Never aggressive.
- Stopping rules — hard-coded cap of 2 messages per user. The 3rd attempt is
  refused and escalated to a human. The AI is deliberately NOT trusted with this.
- Audit trail — every intervention stores the action, the exact message,
  and the AI's reasoning.

## AI Judgment: where we use AI, and where we don't

- Choosing intervention type and writing the message: LLM (Groq) — needs empathy and nuance.
- Stopping rules and message caps: plain code — safety must be deterministic.
- Money totals and metrics: SQL — math must be exact, not generated.

## Failure Recovery

- If the LLM provider errors or times out, the agent falls back to a safe
  polite template and logs the degradation in the audit trail.
- If the backend cold-starts, the frontend shows a graceful
  "waking up" state instead of an error screen.

## Tech Stack (100% free tiers)

Frontend: Next.js + Tailwind (Vercel)
Backend: Python + FastAPI (Koyeb)
Database: Neon Postgres
AI: Groq

## Run Locally

Backend:
cd backend
python -m venv venv
venv\Scripts\activate   (Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload

Frontend:
cd frontend
npm install
npm run dev

backend/.env needs:
DATABASE_URL=your_neon_url
GROQ_API_KEY=your_groq_key
