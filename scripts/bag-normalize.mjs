import { englishText } from './storefront-text.mjs';

export function normalizeBag(album, brandRules) {
  const raw = (album.name || '').normalize('NFKC');
  const extra = [['Saint Laurent', /saint\s*laurent|\bysl\b/i], ['MCM', /\bmcm\b/i], ['Coach', /coach/i], ['Alaïa', /ala[iï]a/i], ['Goyard', /goyard/i], ['Montblanc', /montblanc/i], ['Hermès', /herm[eè]s/i], ['Bottega Veneta', /bottega/i]];
  const brand = [...extra, ...brandRules].find(([, rule]) => rule.test(raw))?.[0] || 'Other brands';
  const title = englishText(raw) || `${brand} Bag`;
  const line = (album.description || '').normalize('NFKC').match(/(?:size|尺寸|大小)\s*[:：]\s*([^\n]+)/i)?.[1] || '';
  const dimensions = englishText(line.replace(/^(?:size\s*[:：]\s*)+/i, '').replace(/[×*脳]/g, ' x ')).replace(/\s+/g, ' ').trim();
  const kind = /size\s*chart|尺码表/i.test(raw) ? 'size-chart' : /notice|通知|公告|联系方式/i.test(raw) ? 'reference' : 'product';
  return { id: `jygy2-${album.id}`, sourceId: String(album.id), supplier: 'jygy2', title, brand, category: 'Bags',
    dimensions, sizes: [], sizeText: '', sku: '', color: '', fitNote: '', description: dimensions ? `Supplier dimensions: ${dimensions}` : '',
    kind, priceUsdc: null, availability: 'unconfirmed', imageCount: album.photoNumber || 0 };
}
