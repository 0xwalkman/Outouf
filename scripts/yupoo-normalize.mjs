import { listedSizes, englishTitle, englishText } from './storefront-text.mjs';
import { imageSupplier } from './yupoo-sources.mjs';
import { normalizeClothing } from './clothing-normalize.mjs';
import doufuyiMetadata from '../data/doufuyi-metadata.mjs';
import xjMetadata from '../data/hhhhhh789-123-metadata.mjs';
import { normalizeBelt } from './belt-normalize.mjs';
import { normalizeJewelry } from './jewelry-normalize.mjs';
import { normalizeFootball } from './football-normalize.mjs';
import { normalizeBag } from './bag-normalize.mjs';
import { normalizeMixed } from './mixed-normalize.mjs';

const brandRules = [
  ['Jordan', /\bjordan\b|\bAJ\s*\d|乔丹/i], ['UGG', /\bugg\b/i], ['New Balance', /new\s*balance|\bNB\b/i],
  ['Crocs', /crocs|corcs|卡骆驰/i], ['Nike', /nike|air\s*max|\bNK\b|耐克|空军|登月|科比|詹姆斯|皮蓬|喷泡|阿甘|华夫|\bACG\b|\bSB系列/i],
  ['Adidas', /adidas|\bAD\b|addis|adizero|alphabounce|阿迪|椰子|yeezy/i], ['ASICS', /asics|亚瑟士/i], ['On', /昂跑|\bOn\b|cloudmonster|cloudsurfer|cloudtilt/i],
  ['HOKA', /hoka/i], ['Salomon', /salomon|萨洛蒙/i], ['Puma', /puma|彪马/i], ['Converse', /converse|匡威/i],
  ['Timberland', /timberland|天伯伦|天博伦/i], ['Alexander McQueen', /mcqueen|麦昆/i], ['Gucci', /gucci|古驰/i],
  ['Dior', /dior|迪奥/i], ['Chanel', /chanel|香奈儿/i], ['Louis Vuitton', /louis\s*vuitton|路易威登|\bLV\b/i],
  ['Balenciaga', /balenciaga|巴黎/i], ['Rick Owens', /rick\s*owens|\bRO系列/i], ['Moncler', /moncler|盟可睐/i],
  ['Brooks', /brooks|布鲁克斯/i], ['Keen', /\bkeen\b|科恩/i], ['Mizuno', /mizuno|美津浓/i], ['Norda', /norda|诺达/i],
  ['Saucony', /saucony|索康尼/i], ['Lacoste', /lacoste|鳄鱼牌/i], ['CAT', /\bCAT\b/i], ['Fila', /fila|斐乐/i],
  ['Descente', /descente|迪桑特/i], ['Vanness', /vanness|吴建豪/i], ['MLB', /\bMLB\b/i], ['The North Face', /north\s*face|北面/i],
  ["Arc’teryx", /arc.?teryx|始祖鸟/i], ['Prada', /prada|普拉达/i], ['Fendi', /fendi|芬迪/i], ['Ecco', /ecco|爱步/i], ['Alo', /\balo\b/i],
  ['Grounds', /\bgrounds\b/i], ['DC Shoes', /\bDC\s*Shoes\b/i], ['Onitsuka Tiger', /onitsuka|鬼塚虎/i],
  ['Birkenstock', /birkenstock|博肯|勃肯/i], ['Lululemon', /lululemon|露露乐蒙/i], ['Kolon Sport', /kolon|可隆/i],
  ['Off-White', /off[-\s]*white|\bOW\b/i], ['Loewe', /loewe|罗意威/i], ['Balmain', /balmain|巴尔曼/i],
  ['Golden Goose', /golden\s*goose|\bGGDB\b/i], ['SMILEREPUBLIC', /smilerepublic/i], ['Kailas', /kailas|凯乐石/i],
  ['Under Armour', /under\s*armour|安德玛/i], ['Crispi', /crispi/i], ['Lanvin', /lanvin|浪凡/i],
  ['Valentino', /valentino|华伦天奴/i], ['Hermès', /hermes|爱马仕/i], ['Autry', /autry/i], ['Veja', /veja|维佳/i],
  ['Mammut', /mammut|猛犸象/i], ['Amiri', /amiri|埃米尔/i], ['Lowa', /\blowa\b/i], ['Miu Miu', /miu\s*miu|缪缪/i],
  ['Loro Piana', /loro\s*piana/i], ['Altra', /\baltra\b/i], ['Bottega Veneta', /botteg[a*]\s*venet|\bBV\d/i],
  ['Dries Van Noten', /dries\s*van\s*noten/i], ['Celine', /celine|赛琳/i], ['Zegna', /zegna|杰尼亚/i],
  ['BAPE', /\bbape\b|bathing\s*ape/i], ['Champion', /champion/i], ['Maison Margiela', /maison\s*margiela|马吉拉/i],
  ['Dr. Martens', /dr\.?\s*martens|马汀博士|马丁博士/i], ['Givenchy', /givenchy|纪梵希/i],
];

export function normalizeAlbum(album, supplier = 'cf1688') {
 if (supplier === 'jmshop88') return normalizeMixed(album, brandRules);
 if (supplier === 'jygy2') return normalizeBag(album, brandRules);
 if (supplier === 'qiumishijie') return normalizeFootball(album, brandRules);
 if (supplier === '351164') return normalizeJewelry(album, brandRules);
 if (supplier === 'jifan01') return normalizeBelt(album, brandRules);
 if (supplier === 'hhhhhh789-123') {
   const product = normalizeClothing(album, brandRules, supplier);
   const metadata = xjMetadata[String(album.id)] || {};
   const source = (album.name || '') + '\n' + (album.description || '');
   product.brand = metadata.brand || (/\bCK\b/i.test(source) ? 'Calvin Klein' : /\bBOSS\b/i.test(source) ? 'BOSS' : product.brand);
   product.garment = metadata.garment || product.garment;
   product.title = [product.brand === 'Other brands' ? '' : product.brand, product.kind === 'size-chart' ? 'Size Guide' : product.garment].filter(Boolean).join(' ');
   return product;
 }
 if (supplier === 'doufuyi') {
   const product = normalizeClothing(album, brandRules, supplier);
   const metadata = doufuyiMetadata[String(album.id)] || {};
   product.brand = metadata.brand || product.brand;
   product.garment = metadata.garment || (product.garment === 'Clothing' ? 'Swimwear' : product.garment);
   product.kind = metadata.kind || product.kind;
   product.title = [product.brand === 'Other brands' ? '' : product.brand, product.kind === 'size-chart' ? 'Size Guide' : product.garment].filter(Boolean).join(' ');
   return product;
 }
 if (['mujichaopaia', '888xm888', 'alina-fashion-store2'].includes(supplier)) return normalizeClothing(album, brandRules, supplier);
 const rawTitle = (album.name || '').normalize('NFKC');
 const description = album.description || '';
 const brand = brandRules.find(([, rule]) => rule.test(rawTitle))?.[0] || 'Other brands';
 const sizeText = description.match(/(?:尺码|碼數|码数|尺寸|sizes?)\s*[:：]?\s*([^\n]+)/i)?.[1]?.trim() || '';
 const sku = englishText(description.match(/(?:货号|款号|SKU)\s*[:：]\s*([^\s\n]+)/i)?.[1] || '');
 const colorNames = { '栗色': 'Chestnut', '黑色': 'Black', '白色': 'White', '灰色': 'Grey', '棕色': 'Brown', '沙色': 'Sand', '米色': 'Beige', '蓝色': 'Blue', '绿色': 'Green', '红色': 'Red', '粉色': 'Pink', '银色': 'Silver', '香槟金': 'Champagne', '菜籽色': 'Mustard', '白灰色': 'White / grey', '黄铜绿色': 'Brass green' };
 const colorRaw = rawTitle.match(/[-—【]([^】\n]+)】?$/)?.[1] || '';
 const color = colorNames[colorRaw] || '';
 const kind = /尺码对照表|尺码表|size\s*chart/i.test(rawTitle) ? 'size-chart' : /集合图|渠道特供】$/.test(rawTitle) ? 'reference' : 'product';
 const title = englishTitle(rawTitle, brand, sku, kind, color);
 const sizes = listedSizes(sizeText);
 const fitNote = /偏小.*(?:大一码|大一号)/.test(sizeText) ? 'Runs small. Consider one size up.' : '';
 const publicDescription = [sku ? `Style: ${sku}` : '', color ? `Color: ${color}` : '', fitNote].filter(Boolean).join('\n');
 return {id:supplier+'-'+album.id,sourceId:String(album.id),supplier,title,brand,category:'Shoes',sizeText:sizes.join(', '),sizes,fitNote,sku,color,description:publicDescription,priceUsdc:null,availability:'unconfirmed',kind,imageCount:album.photoNumber || 0};
}
export function imageUrl(sourcePath) {
 if (!imageSupplier(sourcePath)) return '';
 return '/api/catalog-image?path=' + encodeURIComponent(sourcePath);
}
