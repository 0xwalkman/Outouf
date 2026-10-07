import metadata from '../data/jmshop88-metadata.mjs';
import bedding from '../data/jmshop88-bedding.mjs';
import { normalizeClothing } from './clothing-normalize.mjs';
import { normalizeBelt } from './belt-normalize.mjs';
import { jewelrySizes } from './jewelry-normalize.mjs';
import { englishText, englishTitle, listedSizes } from './storefront-text.mjs';

const traditional = { 衣:'衣', 衛:'卫', 連:'连', 長:'长', 短:'短', 領:'领', 襯:'衬', 針:'针', 織:'织', 褲:'裤', 絨:'绒', 馬:'马', 夾:'夹', 圍:'围', 絲:'丝', 碼:'码', 數:'数', 尺:'尺', 號:'号', 鏈:'链', 項:'项', 飾:'饰', 錶:'表', 錢:'钱', 夾:'夹', 體:'体', 運:'运', 動:'动', 鞋:'鞋', 套:'套', 兩:'两', 頂:'顶', 單:'单', 純:'纯', 線:'线' };
export function normalizeMixed(album, brandRules) {
  const convert = text => (text || '').normalize('NFKC').replace(/[\p{Script=Han}]/gu, c => traditional[c] || c);
  const name = convert(album.name), description = convert(album.description), raw = name + '\n' + description;
  const existingBed = bedding[String(album.id)];
  if (existingBed) return { ...existingBed, imageCount: album.photoNumber || existingBed.imageCount };
  const extra = [['Moschino', /moschino/i], ['Balmain', /balmain/i], ['Hermès', /herm[eè]s/i], ['Rolex', /rolex|劳力士|勞力士/i], ['Omega', /omega|歐米茄|欧米茄/i], ['Patek Philippe', /patek|百达翡丽|百達翡麗/i], ['Audemars Piguet', /audemars|愛彼|爱彼/i], ['Cartier', /cartier|卡地亚|卡地亞/i], ['Coach', /coach/i], ['MCM', /\bmcm/i], ['Goyard', /goyard/i], ['Montblanc', /montblanc/i]];
  const rules = [...extra, ...brandRules];
  let p = normalizeClothing({ ...album, name, description }, rules, 'jmshop88');
  let category = metadata[String(album.id)]?.category;
  if (/鑰匙扣|钥匙扣|掛飾|挂饰/.test(name)) category = 'Accessories';
  if (!category) {
    category = /香水/.test(name) ? 'Perfume' : /皮带|皮帶|腰带/.test(name) ? 'Belts' : /手表/.test(name) ? 'Watches' : /鞋/.test(name) ? 'Shoes' : /钱包|手提包|手拿包|背包|包包/.test(name) ? 'Bags' : /围巾|披肩|丝巾/.test(name) ? 'Scarves' : /项链|戒指|耳环|手链/.test(name) ? 'Jewelry' : 'Clothing';
  }
  if (category === 'Perfume' && p.brand === 'Other brands') {
    const label = name.match(/^[A-Za-z][A-Za-z &'’.-]+/)?.[0]?.trim();
    if (label) p.brand = /克雷德|\bcreed\b/i.test(raw) ? 'Creed' : label;
  }
  if (category === 'Watches') {
    const watchBrands = [['Vacheron Constantin', /vacheron|江[詩诗斯]丹[頓顿]/i], ['Panerai', /panerai|沛[納纳]海/i], ['IWC', /iwc|萬國|万国/i], ['Roger Dubuis', /roger\s*dubuis|羅傑杜彼/i], ['Hublot', /hublot|宇舶/i], ['Breguet', /breguet|寶璣|宝玑/i], ['Blancpain', /blancpain|寶珀|宝珀/i], ['Richard Mille', /richard\s*mille/i], ['Jaeger-LeCoultre', /jaeger|積家|积家/i], ['Breitling', /breitling|百年靈|百年灵/i], ['TAG Heuer', /heuer|泰格豪雅/i], ['Tudor', /tudor|帝舵/i], ['Welder', /welder/i], ['Tissot', /tissot|天梭/i], ['Longines', /longines|浪琴/i], ['Casio', /casio|卡西歐|卡西欧/i], ['Seiko', /seiko|精工/i], ['Citizen', /citizen|西鐵城|西铁城/i]];
    p.brand = watchBrands.find(([, rule]) => rule.test(raw))?.[0] || p.brand;
  }
  if (category === 'Shoes') {
    const range = raw.match(/(?:尺码|码数|size[s]?)\s*[:：]?\s*([^\n]+)/i)?.[1] || name.match(/(?<!\d)(?:[3-4]\d)\s*[-–]\s*(?:[3-4]\d)(?!\d)/)?.[0] || '';
    p.sizes = listedSizes(range.replace(/\b(?:DM|S)\w+$/i, ''));
    p.title = englishTitle(name.replace(/\b(?:DM|S)\d*[A-Z]*\d{3,}\b/gi, ''), p.brand, '', p.kind, '');
    p.garment = 'Shoes';
  } else if (category === 'Bags') {
    p.sizes = [];
    const dims = raw.match(/(?:尺寸|大小|size[s]?)\s*[:：-]?\s*((?:[WLHD]?\s*\d+(?:\.\d+)?\s*(?:cm)?\s*[x×*]\s*){1,2}[WLHD]?\s*\d+(?:\.\d+)?\s*(?:cm)?)/i)?.[1];
    p.dimensions = dims ? englishText(dims.replace(/[×*]/g, ' x ')) : '';
    p.garment = /钱包|錢包|钱夹/.test(name) ? 'Wallet' : /背包/.test(name) ? 'Backpack' : 'Bag';
    p.title = `${p.brand} ${p.garment}`;
  } else if (category === 'Belts') {
    p = { ...p, ...normalizeBelt({ ...album, name, description }, rules) };
  } else if (category !== 'Clothing') {
    const type = category === 'Jewelry' ? (/戒指/.test(name) ? 'Ring' : /项链/.test(name) ? 'Necklace' : /耳/.test(name) ? 'Earrings' : /手/.test(name) ? 'Bracelet' : 'Jewelry')
      : category === 'Accessories' ? (/鑰匙扣|钥匙扣/.test(name) ? 'Keyring' : /掛飾|挂饰/.test(name) ? 'Bag Charm' : /墨鏡|太陽鏡|眼鏡/.test(raw) ? 'Sunglasses' : /帽/.test(name) ? 'Hat' : /傘/.test(name) ? 'Umbrella' : /领帶|領帶/.test(raw) ? 'Tie' : 'Accessory')
      : category === 'Watches' ? 'Watch' : category === 'Perfume' ? 'Perfume' : 'Scarf';
    p.garment = type; p.title = `${p.brand} ${type}`;
    p.sizes = category === 'Jewelry' ? jewelrySizes(raw, type) : [];
    if (category === 'Perfume') p.sizes = [...new Set([...raw.matchAll(/(?<!\d)(\d{1,3})\s*ml\b/gi)].map(m => m[1] + ' ml'))];
  } else {
    if (/泳|沙灘|沙滩/.test(name)) p.garment = 'Swimwear';
    else if (/内褲|內褲|内裤|內裤/.test(name)) p.garment = 'Underwear';
    else if (/袜|襪/.test(name)) p.garment = 'Socks';
    p.title = `${p.brand === 'Other brands' ? '' : p.brand + ' '}${p.garment}`;
  }
  return { ...p, id: `jmshop88-${album.id}`, sourceId: String(album.id), supplier: 'jmshop88', category, sizeText: p.sizes.join(', ') };
}
