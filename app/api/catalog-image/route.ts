import { imageSupplier } from "../../../scripts/yupoo-sources.mjs";

export async function GET(request: Request) {
  const imagePath = new URL(request.url).searchParams.get("path") || "";
  const supplier = imageSupplier(imagePath);
  if (!supplier) {
    return new Response("Invalid image", { status: 400 });
  }
  try {
    const response = await fetch(`https://photo.yupoo.com${imagePath}`, {
      redirect: "error", signal: AbortSignal.timeout(20000),
      headers: { Referer: `https://${supplier}.x.yupoo.com/`, "User-Agent": "Mozilla/5.0" },
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.startsWith("image/")) return new Response("Image unavailable", { status: 502 });
    return new Response(response.body, { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Image temporarily unavailable", { status: 502 }); }
}
