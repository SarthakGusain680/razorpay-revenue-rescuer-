import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ cartId: string }> }
) {
  const { cartId } = await params;
  const rows = await sql`
    UPDATE abandoned_carts SET status = 'Recovered'
    WHERE id = ${Number(cartId)} RETURNING cart_value
  `;
  if (rows.length === 0)
    return Response.json({ detail: "Cart not found" }, { status: 404 });
  return Response.json({
    message: `Payment of Rs. ${rows[0].cart_value} recovered!`,
  });
}
