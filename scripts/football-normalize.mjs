import { listedSizes, englishTitle } from './storefront-text.mjs';

export function normalizeFootball(album, brandRules) {
  const raw = (album.name || '').normalize('NFKC');
  const brand = /joma|卓玛/i.test(raw) ? 'Joma' : brandRules.find(([, rule]) => rule.test(raw))?.[0] || 'Other brands';
  // Extract only explicit shoe-size ranges, never model numbers such as F50.
  const rangePattern = /(?<!\d)([2-4]\d(?:\.5)?)\s*[-–—~至到]+\s*([2-4]\d(?:\.5)?)(?!\d)/g;
  const ranges = [...raw.matchAll(rangePattern)].filter(m => +m[1] <= +m[2]);
  const sizeLists = ranges.map(m => listedSizes(`${m[1]}-${m[2]}`));
  // Conflicting supplier ranges offer only the sizes common to both.
  const sizes = sizeLists.length ? sizeLists[0].filter(size => sizeLists.every(list => list.includes(size))) : [];
  const kind = /尺码表|尺码对照表|size\s*chart/i.test(raw) ? 'size-chart' : 'product';
  const accessory = /鞋袋|鞋包|鞋盒/.test(raw);
  let model = raw.replace(rangePattern, ' ').replace(/\([^)]*\)/g, ' ');
  const modelStart = model.search(/\b(?:Nike|Adidas|New\s*Balance|Puma|Mizuno|Asics|Joma)\b/i);
  if (modelStart >= 0) model = model.slice(modelStart);
  let title = englishTitle(model, brand, '', kind, '');
  if (title === 'Footwear' || title === `${brand} Footwear`) title = `${brand === 'Other brands' ? '' : brand + ' '}Football Boots`;
  if (accessory) title = `${brand === 'Other brands' ? '' : brand + ' '}Shoe Bag`;
  return { id: `qiumishijie-${album.id}`, sourceId: String(album.id), supplier: 'qiumishijie', title, brand,
    category: accessory ? 'Accessories' : 'Shoes', sizes: accessory ? [] : sizes, sizeText: accessory ? '' : sizes.join(', '),
    fitNote: '', sku: '', color: '', description: '', priceUsdc: null, availability: 'unconfirmed', kind, imageCount: album.photoNumber || 0 };
}
