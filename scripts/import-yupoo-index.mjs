import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { normalizeAlbum, imageUrl } from './yupoo-normalize.mjs';
import { suppliers } from './yupoo-sources.mjs';

const supplier = process.argv.find(arg => arg.startsWith('--supplier='))?.split('=')[1] || 'cf1688';
if (!Object.hasOwn(suppliers, supplier)) throw new Error('Unknown supplier');
const config = suppliers[supplier];
const password = process.env[config.passwordEnv] || '';
if (!password && !config.public) throw new Error(`Set ${config.passwordEnv} before importing.`);
const origin = `https://${supplier}.x.yupoo.com`;
const cache = path.resolve(config.cache, 'api-pages');
const output = path.resolve('public/catalog');
await fs.mkdir(cache, { recursive: true });
await fs.mkdir(path.join(output, 'products'), { recursive: true });
await fs.mkdir('data', { recursive: true });
async function save(file, data) { await fs.writeFile(file + '.tmp', JSON.stringify(data)); await fs.rename(file + '.tmp', file); }
async function loadPage(page) {
  const file = path.join(cache, `${page}.json`);
  if (!process.argv.includes('--refresh')) { try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${origin}/api/web/users/${config.userId}/albums?page=${page}&password=${encodeURIComponent(password)}`, { signal: AbortSignal.timeout(45000), redirect: 'error', headers: { 'User-Agent': 'Mozilla/5.0', Referer: origin + '/' } });
    if (response.status === 429 || response.status >= 500) { await response.body?.cancel(); await new Promise(r => setTimeout(r, (attempt + 1) * 5000)); continue; }
    const result = await response.json();
    if (!response.ok || !Array.isArray(result.data?.list)) throw new Error(`Catalog page ${page} unavailable (HTTP ${response.status}).`);
    await save(file, result.data); return result.data;
  }
  throw new Error(`Catalog page ${page} unavailable after retries.`);
}
const first = await loadPage(1);
const pages = Math.ceil(first.total / first.pageSize);
const albums = [...first.list]; let next = 2; let fetched = 1;
console.log(`Importing ${first.total} albums from ${pages} pages.`);
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next <= pages) { const page = next++; const data = await loadPage(page); albums.push(...data.list); fetched++; if (fetched % 10 === 0) console.log(`Read ${fetched}/${pages} pages`); }
}));
const products = []; const references = []; const skipped = [];
if (process.argv.includes('--cache-only')) { console.log('Supplier pages cached.'); process.exit(0); }
const unique = [...new Map(albums.map(album => [album.id, album])).values()];
// Some suppliers count albums that their listing never returns. Verify the end
// rather than leaving a completed traversal permanently marked as importing.
const unlistedAlbums = Math.max(0, first.total - unique.length);
const listingComplete = unique.length === albums.length && (unique.length === first.total || (unlistedAlbums > 0 && (await loadPage(pages + 1)).list.length === 0));
let albumNext = 0;
await Promise.all(Array.from({ length: 12 }, async () => { while (albumNext < unique.length) {
  const album = unique[albumNext++];
  const cover = imageUrl(album.cover);
  if (!cover || !album.photoNumber) { skipped.push({ id: album.id, reason: 'No product photos' }); continue; }
  const normalized = normalizeAlbum(album, supplier);
  let previous;
  if (!config.remoteOnly) try { previous = JSON.parse(await fs.readFile(path.join(output, 'products', normalized.id + '.json'), 'utf8')); } catch {}
  const local = previous?.images?.length >= album.photoNumber && previous.images.every(src => src.startsWith('/catalog/images/'));
  // The supplier's cover is the product overview; gallery order can start with a close-up.
  const localCover = '/catalog/images/' + createHash('sha256').update('https://photo.yupoo.com' + album.cover).digest('hex').slice(0, 24) + path.extname(album.cover);
  const lead = local && previous.images.includes(localCover) ? localCover : cover;
  const images = local ? [...new Set([lead, ...previous.images])] : [lead];
  const detail = { ...normalized, images, galleryPending: !local };
  if (!config.remoteOnly && JSON.stringify(previous) !== JSON.stringify(detail)) await save(path.join(output, 'products', detail.id + '.json'), detail);
  const { description, ...summary } = detail;
  summary.images = detail.images.slice(0, 1);
  (detail.kind === 'product' ? products : references).push(summary);
} }));
products.sort((a, b) => a.brand.localeCompare(b.brand) || Number(b.sourceId) - Number(a.sourceId));
const report = { importedAt: new Date().toISOString(), complete: listingComplete, totalAlbums: first.total, processedAlbums: unique.length, skippedAlbums: skipped.length, unlistedAlbums };
let existing = { products: [], references: [], sources: {} };
try { existing = JSON.parse(await fs.readFile(path.join(output, 'catalog.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sources = existing.sources || (existing.products.length ? { cf1688: { complete: existing.complete, totalAlbums: existing.totalAlbums, processedAlbums: existing.processedAlbums, skippedAlbums: existing.skippedAlbums } } : {});
sources[supplier] = report;
const mergedProducts = [...existing.products.filter(p => !p.id.startsWith(supplier + '-')), ...products];
mergedProducts.sort((a, b) => a.brand.localeCompare(b.brand) || Number(b.sourceId) - Number(a.sourceId));
const combined = { importedAt: report.importedAt, sources, complete: Object.values(sources).every(s => s.complete), totalAlbums: Object.values(sources).reduce((n, s) => n + s.totalAlbums, 0), processedAlbums: Object.values(sources).reduce((n, s) => n + s.processedAlbums, 0), skippedAlbums: Object.values(sources).reduce((n, s) => n + s.skippedAlbums, 0), products: mergedProducts, references: [...existing.references.filter(p => !p.id.startsWith(supplier + '-')), ...references] };
// Allowlist for the gallery endpoint: only albums actually imported from this seller.
await save(supplier === 'cf1688' ? 'data/supplier-album-ids.json' : `data/${supplier}-album-ids.json`, unique.map(a => String(a.id)));
await save(path.join(output, 'catalog.json'), combined);
await save(path.join(config.cache, 'index-report.json'), { total: first.total, unique: unique.length, unlistedAlbums, products: products.length, references: references.length, skipped, brandCounts: products.reduce((counts, product) => { counts[product.brand] = (counts[product.brand] || 0) + 1; return counts; }, {}), missingSizes: products.filter(p => !p.sizeText).length });
console.log(`Imported ${products.length} products and ${references.length} reference albums; skipped ${skipped.length} empty/video-only entries.`);
if (unlistedAlbums) console.log(`Supplier total includes ${unlistedAlbums} albums not returned by its listing; recorded in the import report.`);
if (!report.complete) { console.error('Catalog count changed during import; refresh before considering the import complete.'); process.exitCode = 1; }
