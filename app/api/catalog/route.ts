import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { listedSizes, sizeValue } from '../../../scripts/storefront-text.mjs';
export const runtime = 'nodejs';
type Product = { id: string; title: string; brand: string; category: string; sku?: string; sizes?: string[]; sizeText?: string; [key: string]: unknown };
type Data = { products: Product[]; references: Product[]; complete: boolean };
let cached: { modified: number; data: Promise<Data> } | undefined;
async function catalog() {
 const path = resolve('public/catalog/catalog.json');
 const modified = (await stat(path)).mtimeMs;
 if (!cached || cached.modified !== modified) {
  const data = readFile(path, 'utf8').then(text => JSON.parse(text) as Data);
  cached = { modified, data };
  data.catch(() => { if (cached?.data === data) cached = undefined; });
 }
 return cached!.data;
}
const sizesOf = (p: Product): string[] => p.sizes || listedSizes(p.sizeText || '');
export async function GET(request: Request) {
 try {
  const data = await catalog();
  const params = new URL(request.url).searchParams;
  const id = params.get('product');
  if (id) {
   const product = data.products.find(p => p.id === id);
   if (!product) return Response.json({ error: 'Product not found.' }, { status: 404 });
   return Response.json({ product, references: (data.references || []).filter(r => r.category === product.category && (r.supplier || r.id.replace(/-\d+$/, "")) === (product.supplier || product.id.replace(/-\d+$/, "")) && (r.brand === product.brand || r.brand === "Other brands")) });
  }
  const category = params.get('category') || 'All', brand = params.get('brand') || '', size = params.get('size') || '';
  const query = (params.get('q') || '').toLowerCase().trim();
  const counts = new Map<string, number>(), sizes = new Set<string>(), categories = new Set<string>();
  const matches: Product[] = [];
  for (const p of data.products) {
   categories.add(p.category);
   if (category !== 'All' && p.category !== category) continue;
   counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
   if (brand && p.brand !== brand) continue;
   const options = sizesOf(p); options.forEach(s => sizes.add(s));
   if (size && !options.includes(size)) continue;
   if (query && !`${p.title} ${p.brand} ${p.sku || ''}`.toLowerCase().includes(query)) continue;
   matches.push(p);
  }
  const pages = Math.max(1, Math.ceil(matches.length / 24));
  const requested = Number(params.get('page'));
  const page = Math.min(pages, Number.isSafeInteger(requested) && requested > 0 ? requested : 1);
  return Response.json({ products: matches.slice((page - 1) * 24, page * 24), total: matches.length, page, pages, complete: data.complete, references: [], brands: [...counts].sort(([a],[b]) => a.localeCompare(b)), categories: [...categories].sort(), sizes: [...sizes].sort((a,b) => sizeValue(a)-sizeValue(b)) });
 } catch { return Response.json({ error: 'The collection could not be loaded. Please try again.' }, { status: 503 }); }
}
