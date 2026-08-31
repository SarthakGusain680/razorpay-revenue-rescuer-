import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const MOCK_USERS = [
  { email: "rahul.sharma@gmail.com", phone: "+91-9876543210", type: "Returning" },
  { email: "priya.mehta@yahoo.com", phone: "+91-9123456789", type: "New" },
  { email: "amit.patel@hotmail.com", phone: "+91-9988776655", type: "Returning" },
  { email: "sneha.kumar@gmail.com", phone: "+91-9876512340", type: "New" },
];

const MOCK_CARTS = [
  { value: 2499, items: ["Wireless Earbuds", "Phone Case"] },
  { value: 8999, items: ["Running Shoes", "Sports Watch"] },
  { value: 1299, items: ["Coffee Maker"] },
  { value: 15999, items: ["Laptop Stand", "Mechanical Keyboard", "Mouse"] },
  { value: 5499, items: ["Bluetooth Speaker"] },
];

const MAX_MESSAGES = 2;

async function decideIntervention(cartValue: number, items: string[], customerType: string, messageCount: number) {
  return {
    action: cartValue > 5000 ? "offer_discount" : "send_whatsapp",
    reasoning: `Cart value Rs.${cartValue} suggests ${cartValue > 5000 ? "discount incentive" : "simple reminder"}.`,
    message_template: cartValue > 5000 
      ? `Hi! Complete your order now and get 10% off with code RESCUE10. Valid for 24 hours!`
      : `Hey! Your cart is waiting. Complete checkout securely with Razorpay.`,
    discount_code: cartValue > 5000 ? "RESCUE10" : null,
  };
}

async function runIntervention(cartId: number) {
  const countRows = await sql`SELECT COUNT(*)::int AS n FROM interventions WHERE cart_id = ${cartId} AND status = 'Sent'`;
  const sent = countRows[0].n as number;

  if (sent >= MAX_MESSAGES) {
    await sql`INSERT INTO interventions (cart_id, action_type, message_content, ai_reasoning, status) VALUES (${cartId}, 'stop', 'No message sent.', 'Stopping rule: max messages reached', 'Stopped')`;
    return { action: "stop" };
  }

  const cartRows = await sql`SELECT * FROM abandoned_carts WHERE id = ${cartId}`;
  const cart = cartRows[0];
  const decision = await decideIntervention(Number(cart.cart_value), cart.items as string[], cart.customer_type as string, sent);
  
  await sql`INSERT INTO interventions (cart_id, action_type, message_content, ai_reasoning, status) VALUES (${cartId}, ${decision.action}, ${decision.message_template}, ${decision.reasoning}, 'Sent')`;
  return decision;
}

export async function POST() {
  const results = [];
  
  for (let i = 0; i < 20; i++) {
    const user = MOCK_USERS[i % MOCK_USERS.length];
    const cart = MOCK_CARTS[i % MOCK_CARTS.length];
    
    const rows = await sql`
      INSERT INTO abandoned_carts (user_email, user_phone, cart_value, items, customer_type, status)
      VALUES (${user.email}, ${user.phone}, ${cart.value}, ${JSON.stringify(cart.items)}::jsonb, ${user.type}, 'Pending')
      RETURNING id
    `;
    const cartId = rows[0].id as number;
    
    await runIntervention(cartId);
    
    // Simulate: 60% recovery rate
    const recovered = Math.random() > 0.4;
    if (recovered) {
      await sql`UPDATE abandoned_carts SET status = 'Recovered' WHERE id = ${cartId}`;
    }
    
    results.push({ cart_id: cartId, recovered, value: cart.value });
  }
  
  const totalValue = results.reduce((sum, r) => sum + r.value, 0);
  const recoveredValue = results.filter(r => r.recovered).reduce((sum, r) => sum + r.value, 0);
  
  return Response.json({
    total_carts: results.length,
    total_value_at_risk: totalValue,
    total_recovered: recoveredValue,
    recovery_rate: Math.round((recoveredValue / totalValue) * 100),
    carts: results,
  });
}
