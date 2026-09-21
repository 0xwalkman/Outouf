export function unavailable(error: unknown) {
  console.error("OUTOUF storage request failed", error);
  return Response.json({ error: "This service is temporarily unavailable. Please try again." }, { status: 503 });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}
