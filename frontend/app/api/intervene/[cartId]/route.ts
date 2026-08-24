import { sql } from "@/lib/db";
import { runIntervention } from "@/lib/logic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ cartId: string }> }
) {
  const { cartId } = await params;
  const rows = await sql`SELECT id FROM abandoned_carts WHERE id = ${Number(cartId)}`;
  if (rows.length === 0)
    return Response.json({ detail: "Cart not found" }, { status: 404 });
  const decision = await runIntervention(Number(cartId));
  return Response.json(decision);
}