import { sql } from "./db";
import { decideIntervention } from "./ai";

const MAX_MESSAGES = 2;

export async function runIntervention(cartId: number) {
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
