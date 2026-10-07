import metadata from '../data/jifan01-metadata.mjs';
import { normalizeClothing } from './clothing-normalize.mjs';

export function normalizeBelt(album, brandRules) {
  const rawTitle = (album.name || '').normalize('NFKC');
  const raw = rawTitle + '\n' + (album.description || '').normalize('NFKC');
  const product = normalizeClothing(album, brandRules, 'jifan01');
  const source = metadata[String(album.id)] || {};
  const aliases = [['Gucci', /G家|双G|Guc-i|Gu-ci|GG Marmont/i], ['Louis Vuitton', /路.?威登|驴家|Lo.is\s*Vui.t.n/i], ['Loewe', /L意威/], ['Montblanc', /万B龙|万宝龙|montblanc/i], ['Stefano Ricci', /史D芬|史蒂芬/i], ['Versace', /F思哲/]];
  const brand = source.brand || aliases.find(([, pattern]) => pattern.test(raw))?.[0] || product.brand;
  const kind = /尺码表|size\s*chart/i.test(rawTitle) ? 'size-chart' : source.kind || (/包装|礼盒/.test(rawTitle) && !/皮带|腰带/.test(rawTitle) ? 'reference' : 'product');
  // Widths and supplier stock codes must never become belt-length variants.
  const sizes = new Set();
  for (const match of raw.matchAll(/(?:尺码|sizes?)\s*[:：]?\s*([\d\s,、/\-–—~]+)/gi)) {
    if (/\d\s*[-–—~]\s*\d/.test(match[1])) continue;
    for (const value of match[1].match(/\d+/g) || []) if (+value >= 60 && +value <= 160) sizes.add(value);
  }
  const widthMatch = raw.match(/(?:宽度(?:尺寸)?|宽)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(cm|厘米|mm|毫米)/i) || raw.match(/(\d+(?:\.\d+)?)\s*(cm|厘米|mm|毫米)\s*宽/i);
  const width = widthMatch ? Number(widthMatch[1]) / (/mm|毫米/i.test(widthMatch[2]) ? 10 : 1) : null;
  const validWidth = width && width > 0 && width <= 10 ? width : null;
  const title = [brand === 'Other brands' ? '' : brand, kind === 'size-chart' ? 'Belt Size Guide' : kind === 'reference' ? 'Belt Packaging Guide' : 'Belt'].filter(Boolean).join(' ');
  return { ...product, brand, title, category: 'Belts', garment: 'Belt', kind, sizes: [...sizes].sort((a, b) => +a - +b), sizeText: [...sizes].join(', '), fitNote: '', description: validWidth ? `Belt width: ${validWidth} cm.` : '' };
}
