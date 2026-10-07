import albumIds from "../../../../data/supplier-album-ids.json";
import clothingIds from "../../../../data/mujichaopaia-album-ids.json";
import xmIds from "../../../../data/888xm888-album-ids.json";
import alinaIds from "../../../../data/alina-fashion-store2-album-ids.json";
import doufuyiIds from "../../../../data/doufuyi-album-ids.json";
import xjIds from "../../../../data/hhhhhh789-123-album-ids.json";
import beltIds from "../../../../data/jifan01-album-ids.json";
import jewelryIds from "../../../../data/351164-album-ids.json";
import footballIds from "../../../../data/qiumishijie-album-ids.json";
import bagIds from "../../../../data/jygy2-album-ids.json";
import mixedIds from "../../../../data/jmshop88-album-ids.json";
import storeAlbums from "../../../../data/yupoo-store-albums.json";
import { storeOrigin, albumDetails, storeProduct } from "../../../../scripts/yupoo-store.mjs";
import { suppliers } from "../../../../scripts/yupoo-sources.mjs";
import { normalizeAlbum, imageUrl } from "../../../../scripts/yupoo-normalize.mjs";

const allowed = { jmshop88: new Set<string>(mixedIds), jygy2: new Set<string>(bagIds), qiumishijie: new Set<string>(footballIds), cf1688: new Set<string>(albumIds), mujichaopaia: new Set<string>(clothingIds), '888xm888': new Set<string>(xmIds), 'alina-fashion-store2': new Set<string>(alinaIds), doufuyi: new Set<string>(doufuyiIds), 'hhhhhh789-123': new Set<string>(xjIds), jifan01: new Set<string>(beltIds), '351164': new Set<string>(jewelryIds) };
type Photo = { type: string; path: string };
type AlbumData = { albumInfo: Parameters<typeof normalizeAlbum>[0]; list: Photo[]; total: number; pageSize: number };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeMatch = /^yupoo-store-(\d+)$/.exec(id);
  if (storeMatch) {
    const album = (storeAlbums as Record<string, { id: string; name: string; cover: string; photoNumber: number; shoes?: boolean }>)[storeMatch[1]];
    if (!album) return Response.json({ error: "Product not found" }, { status: 404 });
    try {
      const response = await fetch(`${storeOrigin}/albums/${album.id}?uid=1`, { redirect: 'error', signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('Gallery unavailable');
      return Response.json(storeProduct(album, albumDetails(await response.text())), { headers: { 'Cache-Control': 'private, max-age=300' } });
    } catch { return Response.json({ error: 'The supplier gallery is temporarily unavailable. Please try again.' }, { status: 502 }); }
  }
  const match = /^(jmshop88|jygy2|cf1688|mujichaopaia|888xm888|alina-fashion-store2|doufuyi|hhhhhh789-123|jifan01|351164|qiumishijie)-(\d+)$/.exec(id);
  if (!match) return Response.json({ error: "Product not found" }, { status: 404 });
  const supplier = match[1] as keyof typeof allowed;
  const sourceId = match[2];
  if (!allowed[supplier].has(sourceId)) return Response.json({ error: "Product not found" }, { status: 404 });
  const origin = `https://${supplier}.x.yupoo.com`;
  const config = suppliers[supplier];
  const password = process.env[config.passwordEnv] || '';
  if (!password && !("public" in config && config.public)) return Response.json({ error: "Product galleries are not configured." }, { status: 503 });
  try {
    async function load(page: number): Promise<AlbumData> {
      const response = await fetch(`${origin}/api/web/albums/${sourceId}/show?uid=1&page=${page}&password=${encodeURIComponent(password!)}`, {
        redirect: "error", signal: AbortSignal.timeout(20000), headers: { Referer: origin + '/', "User-Agent": "Mozilla/5.0" },
      });
      if (!response.ok) throw new Error("Gallery unavailable");
      const result = await response.json() as { data: AlbumData };
      if (!result.data?.albumInfo || !Array.isArray(result.data.list)) throw new Error("Invalid gallery");
      return result.data;
    }
    const first = await load(1);
    const photos = [...first.list];
    for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) photos.push(...(await load(page)).list);
    const images = [...new Set([imageUrl(first.albumInfo.cover), ...photos.filter(p => p.type === "photo").map(p => imageUrl(p.path))].filter(Boolean))];
    return Response.json({ ...normalizeAlbum(first.albumInfo, supplier), images, imageCount: images.length, galleryPending: false }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch { return Response.json({ error: "The supplier gallery is temporarily unavailable. Please try again." }, { status: 502 }); }
}
