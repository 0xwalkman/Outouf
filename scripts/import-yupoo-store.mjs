import fs from 'node:fs/promises';
import { storeOrigin, listing, albumDetails, storeProduct } from './yupoo-store.mjs';

const cache = 'work/yupoo/yupoo-store';
await fs.mkdir(`${cache}/pages`, { recursive: true });
await fs.mkdir(`${cache}/details`, { recursive: true });
await fs.mkdir('public/catalog/products', { recursive: true });
async function fetchText(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (error) { if (attempt === 3) throw error; await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); }
  }
}
async function page(n) {
  const file = `${cache}/pages/${n}.html`;
  try { return await fs.readFile(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const html = await fetchText(`${storeOrigin}/categories?page=${n}`);
  if (!listing(html).length) throw new Error(`Empty listing page ${n}`);
  await fs.writeFile(file, html); return html;
}
const first = await page(1);
const total = +(first.match(/in total\s+(\d+) albums/)?.[1] || 0);
const pages = Math.max(1, ...[...first.matchAll(/categories\?page=(\d+)/g)].map(m => +m[1]));
const albums = listing(first); let next = 2;
await Promise.all(Array.from({ length: 4 }, async () => { while (next <= pages) {
  const n = next++; albums.push(...listing(await page(n))); if (n % 10 === 0) console.log(`Listing ${n}/${pages}`);
} }));
const unique = [...new Map(albums.map(a => [a.id, a])).values()];
if (albums.length !== total) throw new Error(`Listing mismatch: ${albums.length}/${total}`);
// The landing page excludes whole departments. Traverse each linked top-level category.
const categories = [...first.matchAll(/class="showheader__link" title="([^"]+)" href="(https:\/\/www\.yupoo\.store\/categories\/\d+)"/g)];
const byId = new Map(unique.map(a => [a.id, a]));
for (const [, label, url] of categories) {
  const id = url.split('/').pop();
  const folder = `${cache}/category-${id}`; await fs.mkdir(folder, { recursive: true });
  async function categoryPage(n) {
    const file = `${folder}/${n}.html`;
    try { return await fs.readFile(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const html = await fetchText(url + '?page=' + n); await fs.writeFile(file, html); return html;
  }
  const head = await categoryPage(1);
  const count = +(head.match(/in total\s+(\d+) albums/)?.[1] || 0);
  const categoryPages = Math.ceil(count / 120); let cursor = 2;
  const found = listing(head);
  await Promise.all(Array.from({ length: 4 }, async () => { while (cursor <= categoryPages) found.push(...listing(await categoryPage(cursor++))); }));
  if (found.length !== count) throw new Error(`Category ${label}: ${found.length}/${count}`);
  for (const a of found) byId.set(a.id, { ...a, shoes: label === 'SHOES' || byId.get(a.id)?.shoes });
  console.log(`${label}: ${found.length} albums; ${byId.size} unique overall`);
}
unique.splice(0, unique.length, ...byId.values());
const totalUnique = unique.length;
console.log(`Read all ${totalUnique} unique albums. Preparing products.`);
await fs.writeFile('data/yupoo-store-albums.json', JSON.stringify(Object.fromEntries(unique.map(a => [a.id, a]))));
const hydrateLimit = process.argv.includes('--all-details') ? unique.length : 24;
let index = 0, completed = 0; const products = [], references = [], failures = [];
await Promise.all(Array.from({ length: 6 }, async () => { while (index < unique.length) {
  const album = unique[index++]; const file = `${cache}/details/${album.id}.json`;
  try {
    let detail;
    try { detail = JSON.parse(await fs.readFile(file, 'utf8')); } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      if (index <= hydrateLimit) {
        detail = albumDetails(await fetchText(`${storeOrigin}/albums/${album.id}?uid=1`));
        await fs.writeFile(file, JSON.stringify(detail));
      }
    }
    const product = storeProduct(album, detail);
    if (detail) await fs.writeFile(`public/catalog/products/${product.id}.json`, JSON.stringify(product));
    const { description, ...summary } = product; summary.images = product.images.slice(0, 1);
    (product.kind === 'product' ? products : references).push(summary);
  } catch (e) { failures.push({ id: album.id, error: e.message }); }
  if (++completed % 2000 === 0) console.log(`Products ${completed}/${totalUnique}; failures ${failures.length}`);
} }));
await fs.writeFile(`${cache}/report.json`, JSON.stringify({ total: totalUnique, imported: products.length, references: references.length, failures, detailsOnDemand: products.filter(p => p.galleryPending).length, confirmedMissingSizes: products.filter(p => !p.galleryPending && !p.sizes.length).length }));
if (failures.length) throw new Error(`${failures.length} detail failures; cached progress retained. Re-run to retry.`);
const file = 'public/catalog/catalog.json';
const existing = JSON.parse(await fs.readFile(file, 'utf8'));
const importedAt = new Date().toISOString();
existing.sources['yupoo-store'] = { importedAt, complete: true, totalAlbums: totalUnique, processedAlbums: unique.length, skippedAlbums: 0, unlistedAlbums: 0 };
existing.products = [...existing.products.filter(p => p.supplier !== 'yupoo-store'), ...products];
existing.products.sort((a, b) => a.brand.localeCompare(b.brand) || Number(b.sourceId) - Number(a.sourceId));
existing.references = [...existing.references.filter(p => p.supplier !== 'yupoo-store'), ...references];
for (const field of ['totalAlbums', 'processedAlbums', 'skippedAlbums']) existing[field] = Object.values(existing.sources).reduce((sum, source) => sum + source[field], 0);
existing.importedAt = importedAt; existing.complete = Object.values(existing.sources).every(s => s.complete);
await fs.writeFile(file + '.tmp', JSON.stringify(existing)); await fs.rename(file + '.tmp', file);
console.log(`Imported ${products.length} products and ${references.length} references.`);
