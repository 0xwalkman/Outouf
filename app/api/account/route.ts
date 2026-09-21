import { getChatGPTUser } from "../../chatgpt-auth";
export async function GET() {
  const user = await getChatGPTUser();
  return Response.json({ user: user ? { name: user.displayName, email: user.email } : null,
    googleEnabled: false }, { headers: { "Cache-Control": "no-store" } });
}
