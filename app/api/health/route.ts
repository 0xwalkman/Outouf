import { sql } from "drizzle-orm";
import { getDb } from "../../../db";

export async function GET() {
  try {
    await getDb().run(sql`select 1`);
    return Response.json({ ok: true, database: "available" });
  } catch {
    return Response.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
