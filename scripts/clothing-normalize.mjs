const alphaSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];
const canonicalSize = value => value.toUpperCase().replace(/^2XL$/, 'XXL').replace(/^XXXL$/, '3XL');

export function clothingSizes(title = '', description = '', strictNumericRanges = false) {
  const text = (description + '\n' + title).normalize('NFKC').replace(/(?<![A-Za-z])(?:XS)?SML(?:XL(?:XXL)?)?(?![A-Za-z])/gi, value => (value.toUpperCase().match(/XXL|XL|XS|S|M|L/g) || []).join(' '));
  const values = new Set();
  for (const match of text.matchAll(/(?:尺码|码数|sizes?)\s*[:：]?\s*(\d{1,2}(?:[.、/]\d{1,2}){2,})/gi)) match[1].split(/[.、/]/).forEach(size => { if (+size <= 60) values.add(size); });
  const token = '(?:XXXL|XXL|XXS|[2-6]XL|XL|XS|S|M|L)';
  for (const match of text.matchAll(new RegExp(`(?<![A-Za-z0-9])(${token})\\s*[-–—~至到]\\s*(${token})(?![A-Za-z0-9])`, 'gi'))) {
    const start = alphaSizes.indexOf(canonicalSize(match[1])), end = alphaSizes.indexOf(canonicalSize(match[2]));
    if (start >= 0 && end >= start) alphaSizes.slice(start, end + 1).forEach(size => values.add(size));
  }
  // Sizes must appear in an explicit size line, size list, or measurement-table row.
  for (const line of text.split(/\n/)) {
    const tokens = [...line.matchAll(new RegExp(`(?<![A-Za-z0-9])(${token})(?![A-Za-z0-9])`, 'gi'))];
    if (/(?:尺码|码数|尺寸|size)/i.test(line) || tokens.length >= 2 || new RegExp(`^\\s*${token}\\s+\\d`, 'i').test(line)) tokens.forEach(m => values.add(canonicalSize(m[1])));
    const numeric = line.match(/(?:尺码|码数|尺寸|sizes?)\s*[:：]?\s*([\d\s,、/\-–—~]+)/i)?.[1]?.trim();
    if (numeric) {
      const nums = numeric.match(/\d+/g) || [];
      const range = /^(\d+)\s*[-–—~]\s*(\d+)$/.exec(numeric);
      if (range && +range[1] >= 24 && +range[2] <= 60 && +range[1] <= +range[2]) {
        if (!strictNumericRanges) for (let n = +range[1]; n <= +range[2]; n++) values.add(String(n));
      } else nums.filter(n => +n >= 0 && +n <= 60).forEach(n => values.add(n));
    }
  }
  if (/(?:均码|one\s*size)/i.test(text)) values.add('One size');
  return [...values].sort((a, b) => {
    const rank = size => alphaSizes.includes(size) ? alphaSizes.indexOf(size) - 100 : size === 'One size' ? 1000 : Number(size);
    return rank(a) - rank(b);
  });
}

const clothingBrands = [
  ['Zimmermann', /zimmermann/], ['Pucci', /\bpucci\b/], ['Max Mara', /max\s*mara/],
  ['AMI Paris', /ami\s*paris/], ['Acne Studios', /acne\s*studios/], ['WE11DONE', /we11done/],
  ['Canada Goose', /canada\s*goose|加拿大鹅|大鹅/], ['Comme des Garçons', /comme\s*des\s*gar[cç]ons|川久保玲/],
  ['Chrome Hearts', /chrome\s*hearts|克罗心|克罗/], ['Moncler', /moncler|蒙口|盟可|蒙(?:羽绒|短袖|长袖|卫衣|外套|毛衣|长裤|马甲)/],
  ['Burberry', /burberry|巴宝莉|巴宝|博柏利/], ['Prada', /prada|普拉达|普(?:毛衣|卫衣|外套|羽绒)/],
  ['Dior', /dior|迪奥|(?:^|[^a-z])di(?:卫衣|外套|长裤|短袖|毛衣)/],
  ['Saint Laurent', /saint\s*laurent|\bysl\b|圣罗兰/], ['Versace', /versace|范思哲/],
  ['Dolce & Gabbana', /dolce|d&g|杜嘉班纳/], ['Balenciaga', /balenciaga|巴黎世家|巴黎/],
  ['Celine', /celine|赛琳|思琳/], ['Gucci', /gucci|古驰|古奇/], ['Hermès', /herm[eè]s|爱马仕/],
  ['Louis Vuitton', /louis\s*vuitton|lv(?=短袖|长袖|外套|卫衣|长裤|毛衣|羽绒|套装)|\blv\b|路易威登/], ['Ralph Lauren', /ralph\s*lauren|raiph\s*lauren|拉夫劳伦/],
  ['Thom Browne', /thom\s*browne|汤姆布朗/], ['Armani', /armani|阿玛尼/], ['Tom Ford', /tom\s*ford/],
  ['Gallery Dept.', /gallery\s*(?:dept)?/], ['Fear of God', /fear\s*of\s*god|essentials/],
  ['Stone Island', /stone\s*island|石头岛/], ['Stüssy', /st[uü]ssy|斯图西/],
  ['Supreme', /supreme/], ['Palace', /palace/], ['Palm Angels', /palm\s*angels|棕榈天使/],
  ['Hellstar', /hellstar/], ['Corteiz', /corteiz|恶魔岛/], ['Sp5der', /sp5der/],
  ['Purple Brand', /purple\s*brand/], ['Denim Tears', /denim\s*tears/], ['Represent', /represent/],
  ['Diesel', /diesel/], ['Dsquared2', /dsquared/], ['Evisu', /evisu|福神/],
  ['Calvin Klein', /calvin\s*klein/], ["Levi’s", /levi['’]?s|李维斯/],
  ['Kapital', /kapital/], ['Needles', /needles/], ['Oakley', /oakley/], ['Ksubi', /ksubi/],
  ['Enfants Riches Déprimés', /enfants\s*riches|\berd\b|忧郁的富二代/],
  ['Jacquemus', /jacquemus/], ['Marine Serre', /marine\s*serre/], ['Ganni', /ganni/],
  ['Askyurself', /askyurself/], ['ADWYSD', /adwysd/], ['Arte Antwerp', /arte\s*antwerp/],
  ['Brain Dead', /brain\s*dead/], ['Heron Preston', /heron\s*preston/], ['RIPNDIP', /ripndip/],
  ['Uniqlo', /uniqlo|优衣库/], ['Gap', /\bgap\b/], ['Courrèges', /courreges|courrèges/],
];

export function normalizeClothing(album, baseRules, supplier = 'mujichaopaia') {
  const rawTitle = (album.name || '').normalize('NFKC');
  const description = (album.description || '').normalize('NFKC');
  const rules = [...clothingBrands, ...baseRules];
  const expandBrand = text => supplier === 'alina-fashion-store2' ? text.replace(/\bCh(?:ane?|a)\*|小香|Coco女孩/gi, 'Chanel ').replace(/\bMiu(?:mi)?\*|\bMiu(?=\d)/gi, 'Miu Miu ').replace(/\bDio\*/gi, 'Dior ').replace(/\bPrad\*/gi, 'Prada ').replace(/\bGucc\*/gi, 'Gucci ').replace(/\bLoro\s*Pi(?:a)?\*?/gi, 'Loro Piana ').replace(/\bLoe\*/gi, 'Loewe ').replace(/\bZimm\*/gi, 'Zimmermann ').replace(/\bPuc\*/gi, 'Pucci ').replace(/\bBBR\b/gi, 'Burberry ') : text;
  const findBrand = text => rules.find(([, regex]) => new RegExp(regex.source, 'i').test(expandBrand(text)))?.[0];
  const brand = findBrand(rawTitle) || findBrand(description) || 'Other brands';
  const types = [['羽绒|down jacket|puffer', 'Down Jacket'], ['棉服|padded jacket', 'Padded Jacket'], ['连帽|hoodie', 'Hoodie'], ['卫衣|sweatshirt', 'Sweatshirt'], ['毛衣|针织|sweater|knitwear', 'Knitwear'], ['牛仔裤|jeans', 'Jeans'], ['短裤|shorts', 'Shorts'], ['长裤|trousers|pants', 'Trousers'], ['套装|tracksuit', 'Matching Set'], ['风衣|trench', 'Trench Coat'], ['大衣|coat', 'Coat'], ['马甲|vest|gilet', 'Vest'], ['夹克|外套|jacket', 'Jacket'], ['短袖|t-shirt|tee\\b', 'T-Shirt'], ['衬衫|\\bshirt\\b', 'Shirt'], ['长袖', 'Long-Sleeve Top'], ['连衣裙|dress', 'Dress'], ['半裙|skirt', 'Skirt']];
  const typeFrom = text => types.find(([pattern]) => new RegExp(pattern, 'i').test(text))?.[1];
  const primaryDescription = supplier === 'alina-fashion-store2' ? description.split(/[。！!✨🤍]/u)[0].slice(0, 140) : description;
  const garment = typeFrom(rawTitle) || (supplier === 'alina-fashion-store2' && /套装|两件套/.test(primaryDescription) ? 'Matching Set' : typeFrom(primaryDescription)) || (/裤/.test(primaryDescription) ? 'Trousers' : /开衫|针织/.test(primaryDescription) ? 'Knitwear' : /泳衣/.test(primaryDescription) ? 'Swimwear' : /上衣/.test(primaryDescription) ? 'Top' : 'Clothing');
  const strictNumericRanges = supplier !== 'mujichaopaia';
  const sizes = clothingSizes(rawTitle, description, strictNumericRanges);
  const kind = /尺码表|size\s*chart/i.test(rawTitle) ? 'size-chart' : /每日发货|发货实拍|放假通知|公告|付款方式|联系方式/.test(rawTitle) ? 'reference' : 'product';
  const title = [brand === 'Other brands' ? '' : brand, kind === 'size-chart' ? 'Size Guide' : kind === 'reference' ? 'Supplier Information' : garment].filter(Boolean).join(' ');
  const range = description.match(/(?:尺码|码数|尺寸|sizes?)\s*[:：]?\s*(\d{2})\s*[-–—~]\s*(\d{2})/i);
  const fitNote = strictNumericRanges && !sizes.length && range ? `Supplier size range: ${range[1]}–${range[2]}. Individual sizes need confirmation.` : '';
  const sku = supplier === 'alina-fashion-store2' && /^\d{4,12}$/.test(rawTitle) ? rawTitle : '';
  return { id: supplier + '-' + album.id, sourceId: String(album.id), supplier, title, brand, category: 'Clothing', garment, sizes, sizeText: sizes.join(', '), sku, color: '', fitNote, description: '', priceUsdc: null, availability: 'unconfirmed', kind, imageCount: album.photoNumber || 0 };
}
