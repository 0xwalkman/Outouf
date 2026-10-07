import { normalizeAlbum } from './yupoo-normalize.mjs';
import { clothingSizes } from './clothing-normalize.mjs';
import { englishText, listedSizes } from './storefront-text.mjs';

export const storeOrigin = 'https://www.yupoo.store';
export function decode(value = '') {
  return value.replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : +n))
    .replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
export function validStoreImage(url) {
  return /^https:\/\/img-cdn\.yupoo\.store\/(?:p\/)?(?:\d{2}|\d{4})\/\d{2}\/\d{2}\/[a-f0-9]\/[a-f0-9]\/[a-f0-9]+\.(?:jpg|jpeg|png|webp)$/i.test(url);
}
export function storeImage(url) {
  return validStoreImage(url) ? '/api/store-image?path=' + encodeURIComponent(new URL(url).pathname) : '';
}
export function listing(html) {
  return [...html.matchAll(/<a\s+class="album__main"([\s\S]*?)<\/a>/g)].map(([, card]) => ({
    id: card.match(/href="\/albums\/(\d+)/)?.[1],
    name: decode(card.match(/title="([^"]*)"/)?.[1]),
    cover: decode(card.match(/data-src="([^"]*)"/)?.[1]),
    photoNumber: +(card.match(/album__photonumber">(\d+)/)?.[1] || 0),
  })).filter(a => a.id && validStoreImage(a.cover));
}
export function albumDetails(html) {
  const block = html.match(/showalbumheader__gallerysubtitle[^>]*>([\s\S]*?)<div style=/)?.[1] || '';
  const description = decode(block.replace(/<[^>]*>/g, '\n')).trim();
  const images = [...new Set([...html.matchAll(/data-origin-src="([^"]+)"/g)].map(m => decode(m[1])).filter(validStoreImage))];
  if (!html.includes('showalbumheader__gallerytitle') || !images.length) throw new Error('Invalid product detail');
  return { description, images };
}
export function storeSizes(text, shoes) {
  const plainNumbers = text.trim().replace(/^(?:EU\s*)?(?:sizes?\s*:?)?\s*/i, '');
  const numericList = /^\d{1,2}(?:\.5|[⅓⅔½])?(?:[\s,;/]+\d{1,2}(?:\.5|[⅓⅔½])?)*$/.test(plainNumbers);
  if (shoes) return listedSizes(text.match(/(?:sizes?|尺码)\s*[:：]?\s*([^\n]+)/i)?.[1] || (numericList ? plainNumbers : ''));
  if (numericList) return [...new Set(plainNumbers.split(/[\s,;/]+/))];
  return clothingSizes('', text, true);
}
export function storeProduct(album, detail = {}) {
  const name = englishText(album.name);
  const text = detail.description || '';
  const shoes = album.shoes || /\b(?:shoes?|sneakers?|boots?|sandals?|slippers?|air force|air max|dunk|jordan \d|yeezy)\b/i.test(name);
  const base = normalizeAlbum({ ...album, description: text });
  let sizes = storeSizes(text, shoes);
  // Kids' numeric sizes are explicit, not an inferred continuous range.
  const kids = [...text.matchAll(/\b(\d{2})\s*\(\s*(\d{1,2}\s*[-–]\s*\d{1,2})\s*Y\s*\)/gi)].map(m => m[1]);
  if (kids.length) sizes = [...new Set(kids)];
  const stem = url => url.replace(/\.[^.]+$/, '');
  const lead = (detail.images || []).find(url => stem(url) === stem(album.cover)) || album.cover;
  const images = [...new Set([storeImage(lead), ...(detail.images || []).map(storeImage)].filter(Boolean))];
  const kind = /size\s*(?:chart|guide)/i.test(name) ? 'size-chart' : 'product';
  return { ...base, id: 'yupoo-store-' + album.id, sourceId: String(album.id), supplier: 'yupoo-store',
    title: name || 'Sportswear', brand: base.brand, category: shoes ? 'Shoes' : 'Clothing', sizes, sizeText: sizes.join(', '),
    description: kids.length ? 'Children’s sizes: ' + englishText(text) : '', fitNote: '', sku: '', color: '', kind,
    images, imageCount: detail.images ? images.length : album.photoNumber, galleryPending: !detail.images };
}
