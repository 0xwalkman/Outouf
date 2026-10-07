import Stripe from 'stripe';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assignedPriceDkk } from '../scripts/catalog-pricing.mjs';
import { listedSizes } from '../scripts/storefront-text.mjs';
import type { OrderLine } from './commerce-orders';
type CatalogProduct = { id: string; kind: string; title: string; brand: string; category: string; garment?: string; sizes?: string[]; sizeText?: string; priceDkk?: number };
let cache: { modified: number; products: Map<string, CatalogProduct> } | undefined;
export async function checkoutLine(input: { productId: string; size: string; quantity: number }, origin: string): Promise<OrderLine> {
  const file = resolve('public/catalog/catalog.json');
  const modified = (await stat(file)).mtimeMs;
  if (!cache || cache.modified !== modified) {
    const catalog = JSON.parse(await readFile(file, 'utf8')) as { products: CatalogProduct[] };
    cache = { modified, products: new Map(catalog.products.map(p => [p.id, p])) };
  }
  const product = cache.products.get(input.productId);
  if (!product || product.kind !== 'product') throw new Error('This product is unavailable.');
  const sizes: string[] = product.sizes || listedSizes(product.sizeText || '');
  const needsSize = ['Clothing', 'Shoes', 'Belts', 'Bed Sheets'].includes(product.category) || /\bring\b/i.test(product.garment || '');
  if ((sizes.length && !sizes.includes(input.size)) || (!sizes.length && (needsSize || input.size))) throw new Error('A confirmed size or volume is required before payment.');
  const price = assignedPriceDkk(product) ?? product.priceDkk;
  if (!Number.isFinite(price) || price! <= 0) throw new Error('This product does not have a confirmed price.');
  return { productId: product.id, title: product.title, brand: product.brand, size: input.size, quantity: input.quantity, unitAmount: Math.round(price! * 100), productUrl: `${origin}/?product=${encodeURIComponent(product.id)}` };
}
export function checkoutConfig() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  const origin = process.env.STORE_ORIGIN || '';
  const shipping = Number(process.env.SHIPPING_DKK);
  const countries = (process.env.SHIPPING_COUNTRIES || '').split(',').map(v => v.trim()).filter(Boolean);
  const ready = key.startsWith('sk_test_') && !!process.env.STRIPE_WEBHOOK_SECRET && /^https?:\/\//.test(origin) && process.env.SHIPPING_DKK !== undefined && Number.isFinite(shipping) && shipping >= 0 && countries.length > 0 && countries.every(c => /^[A-Z]{2}$/.test(c));
  return { ready, origin: origin.replace(/\/$/, ''), shipping: Math.round(shipping * 100), countries, key };
}
export function stripeClient() { return new Stripe(checkoutConfig().key); }
