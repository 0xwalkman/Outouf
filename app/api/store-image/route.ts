import { validStoreImage } from '../../../scripts/yupoo-store.mjs';

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') || '';
  const url = 'https://img-cdn.yupoo.store' + path;
  if (!validStoreImage(url)) return new Response('Invalid image', { status: 400 });
  try {
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { Referer: 'https://www.yupoo.store/' } });
    const type = response.headers.get('content-type') || '';
    if (!response.ok || !type.startsWith('image/')) return new Response('Image unavailable', { status: 502 });
    return new Response(response.body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Image temporarily unavailable', { status: 502 }); }
}
