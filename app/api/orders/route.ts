import { getChatGPTUser } from "../../chatgpt-auth";
import { getDatabase } from "../../../db";
import { unavailable } from "../../../lib/http";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to view orders." }, { status: 401 });
  try {
    const result = await getDatabase().prepare(
      "SELECT id, status, amount_usdc AS amountUsdc, created_at AS createdAt FROM orders WHERE buyer_id = ? ORDER BY created_at DESC LIMIT 100"
    ).bind(user.userId).all();
    return Response.json({ orders: result.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return unavailable(error); }
}
