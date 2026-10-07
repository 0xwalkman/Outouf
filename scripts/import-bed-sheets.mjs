import fs from 'node:fs/promises';
import { normalizeAlbum, imageUrl } from './yupoo-normalize.mjs';
import { assignedPriceDkk } from './catalog-pricing.mjs';

const origin = 'https://jmshop88.x.yupoo.com';
const cache = 'work/yupoo/jmshop88';
await fs.mkdir(`${cache}/details`, { recursive: true });
async function get(url) {
  const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000), headers: { Referer: origin + '/', 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`Supplier HTTP ${r.status}`);
  return r;
}
const html = await (await get(origin + '/categories/3019121')).text();
const count = +(html.match(/in total\s+(\d+) albums/)?.[1] || 0);
const ids = [...new Set([...html.matchAll(/href="\/albums\/(\d+)[^"]*"/g)].map(m => m[1]))];
if (!count || ids.length !== count) throw new Error(`Category incomplete: ${ids.length}/${count}. Pagination needs checking.`);

export function beddingProduct(album) {
  const raw = `${album.name || ''} ${album.description || ''}`.normalize('NFKC');
  const rules = [['Burberry', /burberry|bbr|巴寶莉|巴宝莉/i], ['Versace', /versace|\bver|範思哲|范思哲/i], ['Chrome Hearts', /chrome\s*hearts|克羅心|克罗心/i], ['MCM', /\bmcm/i], ['Hermès', /herm[eè]s/i], ['Gucci', /gucc/i]];
  const base = normalizeAlbum(album);
  const brand = rules.find(([, pattern]) => pattern.test(raw))?.[0] || base.brand;
  const garment = /四件套/.test(raw) ? '4-Piece Bedding Set' : /毛毯/.test(raw) ? 'Blanket' : /浴巾|毛巾/.test(raw) ? 'Towel Set' : 'Bed Sheets';
  const pair = '(\\d+(?:\\.\\d+)?)\\s*[x×*]\\s*(\\d+(?:\\.\\d+)?)';
  const measurement = label => raw.match(new RegExp(label + '\\s*[:：]?\\s*' + pair, 'i'))?.slice(1).join(' × ') || '';
  const sheet = measurement('床[單单]'), duvet = measurement('被套'), pillow = measurement('枕套'), blanket = measurement('(?:尺寸|size)');
  const dimensions = sheet || blanket;
  const description = [sheet && `Bed sheet: ${sheet}`, duvet && `Duvet cover: ${duvet}`, pillow && `Pillowcases: ${pillow}`, blanket && `Blanket: ${blanket}`].filter(Boolean).join('\n');
  return { ...base, id: `jmshop88-${album.id}`, sourceId: String(album.id), supplier: 'jmshop88', brand,
    title: `${brand === 'Other brands' ? '' : brand + ' '}${garment}`, category: 'Bed Sheets', garment, dimensions,
    description, sizes: dimensions ? [dimensions] : [], sizeText: dimensions, sku: '', color: '', fitNote: '', kind: 'product' };
}
const products = []; let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (cursor < ids.length) {
  const id = ids[cursor++]; const file = `${cache}/details/${id}.json`;
  let data;
  try { data = JSON.parse(await fs.readFile(file, 'utf8')); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const first = (await (await get(`${origin}/api/web/albums/${id}/show?uid=1&page=1`)).json()).data;
    if (!first?.albumInfo || !Array.isArray(first.list)) throw new Error(`Invalid album ${id}`);
    data = first;
    for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) {
      const more = (await (await get(`${origin}/api/web/albums/${id}/show?uid=1&page=${page}`)).json()).data;
      data.list.push(...more.list);
    }
    await fs.writeFile(file, JSON.stringify(data));
  }
  const product = beddingProduct(data.albumInfo);
  product.images = [...new Set([imageUrl(data.albumInfo.cover), ...data.list.filter(p => p.type === 'photo').map(p => imageUrl(p.path))].filter(Boolean))];
  if (!product.images.length) throw new Error(`No photos in ${id}`);
  product.imageCount = product.images.length; product.galleryPending = false;
  const price = assignedPriceDkk(product); if (price != null) { product.priceDkk = price; product.priceCurrency = 'DKK'; product.priceSource = 'user-assigned'; }
  await fs.writeFile(`public/catalog/products/${product.id}.json`, JSON.stringify(product));
  const { description, ...summary } = product; summary.images = product.images.slice(0, 1); products.push(summary);
} }));
const file = 'public/catalog/catalog.json'; const catalog = JSON.parse(await fs.readFile(file, 'utf8'));
catalog.products = [...catalog.products.filter(p => !(p.supplier === 'jmshop88' && p.category === 'Bed Sheets')), ...products];
catalog.products.sort((a, b) => a.brand.localeCompare(b.brand) || Number(b.sourceId) - Number(a.sourceId));
if (!catalog.sources.jmshop88 || catalog.sources.jmshop88.totalAlbums <= count) catalog.sources.jmshop88 = { importedAt: new Date().toISOString(), complete: true, categoryId: '3019121', totalAlbums: count, processedAlbums: ids.length, skippedAlbums: 0 };
for (const field of ['totalAlbums', 'processedAlbums', 'skippedAlbums']) catalog[field] = Object.values(catalog.sources).reduce((sum, s) => sum + s[field], 0);
catalog.complete = Object.values(catalog.sources).every(s => s.complete);
await fs.writeFile(file + '.tmp', JSON.stringify(catalog)); await fs.rename(file + '.tmp', file);
console.log(`Imported ${products.length} Bed Sheets products with full galleries.`);
