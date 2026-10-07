// User-assigned retail prices, unrelated to supplier costs. Stable per model.
export function priceGroup(product) {
  if (product.kind !== 'product') return null;
  const type = `${product.garment || ''} ${product.title || ''}`;
  if (product.category === 'Watches') return 'watches';
  if (product.category === 'Perfume') return 'perfume';
  if (product.category === 'Belts') return 'belts';
  if (product.category === 'Scarves') return 'scarves';
  if (product.category === 'Accessories') {
    if (/\bkey\s*(?:ring|chain)s?\b/i.test(type)) return 'keyrings';
    if (/\bumbrella\b/i.test(type)) return 'umbrellas';
    if (/\bsunglasses\b/i.test(type)) return 'sunglasses';
    if (/\b(?:hat|cap|beanie)\b/i.test(type)) return 'hats';
    if (/\bbag charm\b/i.test(type)) return 'keyrings';
    if (product.supplier !== '351164') return 'accessories';
  }
  if (product.category === 'Bed Sheets') return 'bedding';
  if (product.category === 'Bags') return 'bags';
  if (product.category === 'Shoes') return 'shoes';
  const text = `${product.title || ''} ${product.garment || ''}`;
  if (/swim|bikini|bathing|beachwear/i.test(text) || product.supplier === 'doufuyi') return 'swimwear';
  if (product.category === 'Jewelry' || product.supplier === '351164') return 'jewelry';
  if (product.category === 'Clothing') {
    if (/\b(?:padded|puffer|down|oversized|large|big)\b.*\b(?:vest|gilet|jacket|coat)\b/i.test(text)) return 'large-outerwear';
    return 'clothing';
  }
  return null;
}
export function pricingModelKey(product) {
  let model = (product.title || product.garment || '').normalize('NFKC').toLowerCase();
  // Supplier IDs and color-specific style codes do not define a different model.
  if (product.sku) model = model.split(product.sku.toLowerCase()).join(' ');
  model = model.replace(/\s+[-–—]\s*[a-z]{0,4}\d{3,}[a-z\d-]*\s*$/i, ' ');
  model = model.replace(/\b(?:black|white|grey|gray|red|blue|green|yellow|orange|purple|pink|brown|beige|cream|navy|burgundy|maroon|wine|khaki|olive|silver|gold|golden|platinum|ivory|tan|turquoise|teal|violet|lilac|lavender|coral|peach|mint|sand|chestnut|light|dark|royal|neon|volt|multicolou?r)\b/g, ' ');
  model = model.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  return `${priceGroup(product)}|${(product.brand || '').toLowerCase()}|${model}`;
}
export function basePriceDkk(product) {
  const group = priceGroup(product);
  if (!group) return null;
  const fixed = { perfume: 450, scarves: 300, umbrellas: 280, keyrings: 250, accessories: 300 };
  if (Object.hasOwn(fixed, group)) return fixed[group];
  const brand = (product.brand || '').toLowerCase();
  if (group === 'watches') {
    const highEnd = ['rolex', 'patek philippe', 'audemars piguet', 'cartier', 'omega', 'vacheron constantin', 'panerai', 'iwc', 'roger dubuis', 'hublot', 'breguet', 'blancpain', 'richard mille', 'jaeger-lecoultre', 'breitling', 'tag heuer', 'tudor', 'louis vuitton', 'hermès'];
    return highEnd.includes(brand) ? 5000 : 4000;
  }
  if (group === 'sunglasses') {
    if (['cartier', 'chrome hearts', 'hermès', 'chanel', 'louis vuitton'].includes(brand)) return 1000;
    if (['armani', 'lacoste', 'oakley'].includes(brand)) return 500;
    return brand === 'other brands' || !brand ? 300 : 750;
  }
  if (group === 'bedding') return 2500;
  if (group === 'bags') {
    let dimensions = product.dimensions || '';
    // Some supplier listings separate all three whole measurements with dots.
    if (/^\d+\.\d+\.\d+(?:cm)?$/i.test(dimensions.trim())) dimensions = dimensions.replace(/\./g, ' x ');
    const measurements = (dimensions.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (measurements.length < 2) return 2700;
    const scale = /\bmm\b/i.test(dimensions) ? 0.1 : /inch|inches|\bin\b/i.test(dimensions) ? 2.54 : 1;
    const longest = Math.max(...measurements) * scale;
    if (!(longest > 0 && longest <= 200)) return 2700;
    return longest <= 20 ? 1980 : longest <= 25 ? 2250 : longest <= 30 ? 2500 : longest <= 35 ? 2800 : longest <= 40 ? 3100 : 3500;
  }
  if (group === 'large-outerwear') return 1200;
  const ranges = { belts: [300, 50, 5], hats: [300, 50, 5], shoes: [600, 50, 5], clothing: [199, 50, 13], swimwear: [299, 50, 5], jewelry: [499, 250, 11] };
  const [start, step, count] = ranges[group];
  let hash = 2166136261;
  for (const char of pricingModelKey(product)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return start + (hash % count) * step;
}
export function assignedPriceDkk(product) {
  const base = basePriceDkk(product);
  if (base == null) return null;
  const group = priceGroup(product);
  const limits = {
    shoes: [600, 800], clothing: [1, 800], swimwear: [1, 500],
    jewelry: [1, 3000], bags: [1980, 3500], belts: [300, 500],
    hats: [300, 500], sunglasses: [300, 1000],
    'large-outerwear': [1, 1200], bedding: [1, 2500], watches: [1, 5000],
  };
  const [floor, ceiling] = limits[group] || [1, Infinity];
  // Small model-based variations stay stable across refreshes, sellers and colors.
  let hash = 2166136261;
  for (const char of `retail-v1|${pricingModelKey(product)}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const target = base * (1 + ((hash % 81) - 40) / 1000);
  // Bound retail rounding too: 600 must become at least 609, never 599.
  const lowest = Math.ceil((Math.max(floor, base * 0.95) - 9) / 10) * 10 + 9;
  const highest = Math.floor((Math.min(ceiling, base * 1.05) - 9) / 10) * 10 + 9;
  return Math.max(lowest, Math.min(highest, Math.round((target - 9) / 10) * 10 + 9));
}
export function retailPriceLabel(product) {
  const price = assignedPriceDkk(product) ?? product.priceDkk;
  return price == null ? 'Price on request' : `${new Intl.NumberFormat('da-DK').format(price)} kr.`;
}
