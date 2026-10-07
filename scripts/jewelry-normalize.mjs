import metadata from '../data/351164-metadata.mjs';
import { normalizeClothing } from './clothing-normalize.mjs';

export function jewelrySizes(raw, type) {
  if (type !== 'Ring') return [];
  const sizes = new Set();
  const isUS = /美号|美码|US\s*(?:size|码)/i.test(raw);
  for (const match of raw.matchAll(/(?:码数|尺码|圈号|戒围|戒指尺寸|美码|美号|sizes?)\s*[:：]?\s*(?:(?:美号|美码)[,，:：]?\s*)?([\d\s.,、/\-–—~号]+)/gi)) {
    const value = match[1].trim();
    let values;
    if (/^[4-9]{3,6}$/.test(value)) values = value.split('');
    else if (/^\d{1,2}(?:\.\d{1,2}){2,}$/.test(value)) values = value.split('.');
    else if (/^\d+(?:\.\d+)?\s*[-–—~]\s*\d+(?:\.\d+)?$/.test(value)) continue;
    else values = value.match(/\d+(?:\.\d+)?/g) || [];
    for (const size of values) if (+size >= 1 && +size <= 35) sizes.add((isUS ? 'US ' : '') + size);
  }
  return [...sizes].sort((a, b) => parseFloat(a.replace('US ', '')) - parseFloat(b.replace('US ', '')));
}

export function normalizeJewelry(album, brandRules) {
  const name = (album.name || '').normalize('NFKC');
  const raw = name + '\n' + (album.description || '').normalize('NFKC');
  const base = normalizeClothing(album, brandRules, '351164');
  const source = metadata[String(album.id)] || {};
  const brandAliases = [
    ['Louis Vuitton', /驴家|\bLV|路易登/i], ['Gucci', /古奇|\bGucci/i],
    ['Cartier', /cartier|卡地亚|卡D亚/i], ['Van Cleef & Arpels', /van\s*cleef|梵克雅宝|梵克|\bVCA\b/i],
    ['Bulgari', /bvlgari|bulgari|宝格丽|宝G丽/i], ['Tiffany & Co.', /tiffany|蒂芙尼/i],
    ['Chaumet', /chaumet|尚美/i], ['Swarovski', /swarovski|施华洛世奇/i],
    ['Messika', /messika|梅西卡/i], ['Chopard', /chopard|肖邦/i], ['Piaget', /piaget|伯爵/i],
    ['Vivienne Westwood', /vivienne\s*westwood|西太后/i], ['David Yurman', /david\s*yurman|大卫雅曼/i],
    ['Qeelin', /qeelin|麒麟/i], ['HEFANG', /hefang|何方/i], ['Rolex', /rolex|劳力士/i],
  ];
  const brand = source.brand || brandAliases.find(([, pattern]) => pattern.test(raw))?.[0] || base.brand;
  const kinds = [['套装|三件套', 'Jewelry Set'], ['耳钉|耳环|耳坠|耳夹|earrings?', 'Earrings'], ['项链|necklace', 'Necklace'], ['戒指|指环|ring\\b', 'Ring'], ['手链|手镯|手绳|手串|皮绳|bracelet|bangle', 'Bracelet'], ['胸针|brooch', 'Brooch'], ['脚链|anklet', 'Anklet'], ['吊坠|pendant', 'Pendant'], ['手表|腕表|watch', 'Watch'], ['眼镜|sunglasses', 'Sunglasses'], ['发夹|发箍|发圈', 'Hair Accessory'], ['钥匙扣|keychain', 'Keychain']];
  const detect = text => kinds.find(([pattern]) => new RegExp(pattern, 'i').test(text))?.[1];
  const type = source.garment || detect(name) || detect(raw) || 'Jewelry';
  const category = type === 'Watch' ? 'Watches' : ['Sunglasses', 'Hair Accessory', 'Keychain'].includes(type) ? 'Accessories' : 'Jewelry';
  const kind = source.kind || (/尺寸表|尺码表|size\s*chart/i.test(name) ? 'size-chart' : /包装盒|包装袋|集合图/.test(name) ? 'reference' : 'product');
  const title = [brand === 'Other brands' ? '' : brand, kind === 'size-chart' ? 'Size Guide' : kind === 'reference' ? 'Collection Guide' : type].filter(Boolean).join(' ');
  const sizes = jewelrySizes(raw, type);
  return { ...base, brand, title, category, garment: type, kind, sizes, sizeText: sizes.join(', '), fitNote: '', description: '' };
}
