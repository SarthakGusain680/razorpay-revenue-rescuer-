import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const carts = await sql`SELECT * FROM abandoned_carts ORDER BY id DESC`;
  const interventions = await sql`SELECT * FROM interventions ORDER BY id ASC`;

  const byCart: Record<number, any[]> = {};
  for (const iv of interventions) {
    if (!byCart[iv.cart_id as number]) byCart[iv.cart_id as number] = [];
    byCart[iv.cart_id as number].push({
      action: iv.action_type,
      message: iv.message_content,
      reasoning: iv.ai_reasoning,
      status: iv.status,
    });
  }

  const recovered = carts.filter((c) => c.status === "Recovered");
  return Response.json({
    total_abandoned: carts.length,
    total_recovered_count: recovered.length,
    total_money_recovered: recovered.reduce(
      (s: number, c: any) => s + Number(c.cart_value),
      0
    ),
    carts: carts.map((c) => ({
      id: c.id,
      user_email: c.user_email,
      cart_value: c.cart_value,
      items: c.items,
      status: c.status,
      interventions: byCart[c.id as number] ?? [],
    })),
  });
}
