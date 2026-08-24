import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const MAX_MESSAGES = 2;

const SYSTEM_PROMPT = `
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
`;

async function decideIntervention(
  cartValue: number,
  items: string[],
  customerType: string,
  messageCount: number
) {
  const userPrompt = `
Cart Value: Rs. ${cartValue}
Items: ${items.join(", ")}
Customer Type: ${customerType}
Messages already sent: ${messageCount}
Decide the best next intervention.
`;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error("Groq error " + res.status);
    const data = await res.json();
    let raw: string = data.choices[0].message.content.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/```/g, "").replace(/^json/, "").trim();
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      action: "send_whatsapp",
      reasoning: `AI service unavailable. Using safe fallback template. (${String(e)})`,
      message_template:
        "Hi! We noticed you left something in your cart. Complete your payment securely with Razorpay anytime.",
      discount_code: null,
    };
  }
}

async function runIntervention(cartId: number) {
  const countRows = await sql`
    SELECT COUNT(*)::int AS n FROM interventions
    WHERE cart_id = ${cartId} AND status = 'Sent'
  `;
  const sent = countRows[0].n as number;

  if (sent >= MAX_MESSAGES) {
    const reasoning = `STOPPING RULE: User already received ${sent} messages. Sending more would violate anti-spam compliance. Escalated to human review.`;
    await sql`
      INSERT INTO interventions (cart_id, action_type, message_content, ai_reasoning, status)
      VALUES (${cartId}, 'stop', 'No message sent.', ${reasoning}, 'Stopped')
    `;
    return { action: "stop", reasoning };
  }

  const cartRows = await sql`SELECT * FROM abandoned_carts WHERE id = ${cartId}`;
  const cart = cartRows[0];
  const decision = await decideIntervention(
    Number(cart.cart_value),
    cart.items as string[],
    cart.customer_type as string,
    sent
  );

  await sql`
    INSERT INTO interventions (cart_id, action_type, message_content, ai_reasoning, status)
    VALUES (${cartId}, ${decision.action ?? "send_whatsapp"}, ${decision.message_template ?? ""}, ${decision.reasoning ?? ""}, 'Sent')
  `;
  return decision;
}

export async function POST(req: Request) {
  const body = await req.json();
  const rows = await sql`
    INSERT INTO abandoned_carts (user_email, user_phone, cart_value, items, customer_type, status)
    VALUES (${body.user_email}, ${body.user_phone}, ${body.cart_value}, ${JSON.stringify(body.items)}::jsonb, ${body.customer_type ?? "New"}, 'Pending')
    RETURNING id
  `;
  const cartId = rows[0].id as number;
  const decision = await runIntervention(cartId);
  return Response.json({ cart_id: cartId, ai_decision: decision });
}
