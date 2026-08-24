import { sql } from "../../../../lib/db";
import { runIntervention } from "../../../../lib/logic";

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