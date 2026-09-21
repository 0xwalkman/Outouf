import { getChatGPTUser } from "../../chatgpt-auth";
import { getDatabase } from "../../../db";
import { sameOrigin, unavailable } from "../../../lib/http";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to access your bag." }, { status: 401 });
  try {
    const result = await getDatabase().prepare(`SELECT c.product_id AS id, c.quantity, p.title,
      p.category, p.price_usdc AS priceUsdc, p.active FROM cart_items c
      JOIN products p ON p.id = c.product_id WHERE c.user_id = ? ORDER BY c.updated_at DESC`)
      .bind(user.userId).all();
    return Response.json({ items: result.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return unavailable(error); }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to save your bag." }, { status: 401 });
  let parsed: unknown;
  try { parsed = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const body = parsed as { productId?: unknown; quantity?: unknown } | null;
  if (!body || typeof body.productId !== "string" || !body.productId.length || body.productId.length > 100 ||
      typeof body.quantity !== "number" || !Number.isInteger(body.quantity) || body.quantity < 0 || body.quantity > 99) {
    return Response.json({ error: "Choose a product and a quantity from 0 to 99." }, { status: 400 });
  }
  try {
    const db = getDatabase();
    if (body.quantity === 0) {
      await db.prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?").bind(user.userId, body.productId).run();
    } else {
      const result = await db.prepare(`INSERT INTO cart_items (id,user_id,product_id,quantity,updated_at)
        SELECT ?,?,id,?,? FROM products WHERE id = ? AND active = 1
        ON CONFLICT(user_id,product_id) DO UPDATE SET quantity=excluded.quantity,updated_at=excluded.updated_at`)
        .bind(crypto.randomUUID(), user.userId, body.quantity, Date.now(), body.productId).run();
      if (!result.meta.changes) return Response.json({ error: "This product is no longer available." }, { status: 409 });
    }
    return GET();
  } catch (error) { return unavailable(error); }
}
