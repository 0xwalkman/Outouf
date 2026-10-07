// Only source-supported sizes are offered. Half sizes are expanded when stated.
export function listedSizes(raw = '') {
  const half = /(?:含|带)?半码|[（(]半[）)]|half\s*sizes?/i.test(raw) && !/不含半|无半/.test(raw);
  const main = raw.replace(/<[^>]*>/g, ' ').split(/[（(【\n]/)[0];
  const values = new Set();
  const add = size => {
    const value = parseFloat(size);
    if (value >= 15 && value <= 55) values.add(size.replace(/½/g, '.5'));
  };
  for (const match of main.matchAll(/(\d+(?:\.\d+)?)\s*[-–—~至到]\s*(\d+(?:\.\d+)?)/g)) {
    const start = +match[1], end = +match[2];
    if (start < 15 || end > 55 || start > end) continue;
    add(String(start)); add(String(end));
    for (let size = Math.ceil(start * (half ? 2 : 1)) / (half ? 2 : 1); size <= end; size += half ? .5 : 1) add(String(size));
  }
  const withoutRanges = main.replace(/\d+(?:\.\d+)?\s*[-–—~至到]\s*\d+(?:\.\d+)?/g, ' ');
  for (const match of withoutRanges.matchAll(/\d+(?:\.\d+|[⅓⅔½])?/g)) add(match[0]);
  return [...values].sort((a, b) => sizeValue(a) - sizeValue(b));
}
export function sizeValue(size) {
  if (size.startsWith('US ')) return parseFloat(size.slice(3));
  const alpha = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];
  if (alpha.includes(size)) return alpha.indexOf(size) - 100;
  if (size === 'One size') return 1000;
  return parseFloat(size) + (size.includes('⅓') ? 1/3 : size.includes('⅔') ? 2/3 : 0);
}
export function englishText(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/[^\p{Script=Latin}\p{N}\s.,'’&+()/\-:]/gu, ' ').replace(/\s+/g, ' ').trim();
}
export function englishTitle(raw, brand, sku, kind, color) {
  if (kind === 'size-chart') return `${brand} Size Guide`;
  if (kind === 'reference') return brand === 'Other brands' ? 'Collection Guide' : `${brand} Collection Guide`;
  const translated = raw
    .replace(/【[^】]*(?:版|CF|臻选|甄选|纯原|顶级)[^】]*】/g, ' ')
    .replace(/佐拉芭蕾平底/g, ' Zora Ballet Flats ')
    .replace(/玛丽珍/g, ' Mary Jane ')
    .replace(/贝莉迷你/g, ' Bailey Mini ')
    .replace(/贝莉超短靴/g, ' Bailey Ankle Boots ')
    .replace(/空军一号/g, ' Air Force 1 ');
  // Keep brand/model wording, dropping untranslated supplier marketing fragments.
  const chunks = translated.split(/[\p{Script=Han}]+/u).map(englishText)
    .filter(s => /[A-Za-z]{2}/.test(s) && !/^(?:CF|GX|PK|LJR|OG|ZP|TOP|VIP|SS|NEW)$/i.test(s));
  let title = chunks.slice(0, 2).join(' ').replace(/\s+/g, ' ').replace(/^[\s\-.,:/]+|[\s\-.,:/]+$/g, '');
  if (!title) title = brand === 'Other brands' ? 'Footwear' : `${brand} Footwear`;
  if (title.length > 100) title = title.slice(0, 100).replace(/\s+\S*$/, '');
  if (color && !title.toLowerCase().includes(color.toLowerCase())) title += ` — ${color}`;
  if (/Footwear$/.test(title) && sku) title += ` ${sku}`;
  return title;
}
