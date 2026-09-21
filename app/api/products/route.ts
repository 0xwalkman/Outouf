import { getDatabase } from "../../../db";
import { unavailable } from "../../../lib/http";

export async function GET() {
  try {
    const result = await getDatabase().prepare(
      "SELECT id,title,category,price_usdc AS priceUsdc FROM products WHERE active = 1 ORDER BY category,title LIMIT 500"
    ).all();
    return Response.json({ products: result.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return unavailable(error); }
}
