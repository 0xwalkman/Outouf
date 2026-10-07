import fs from 'node:fs/promises';
import { assignedPriceDkk, priceGroup } from './catalog-pricing.mjs';

const file = 'public/catalog/catalog.json';
const catalog = JSON.parse(await fs.readFile(file, 'utf8'));
const counts = {};
for (const product of catalog.products) {
  const price = assignedPriceDkk(product);
  if (price == null) continue;
  product.priceDkk = price;
  product.priceCurrency = 'DKK';
  product.priceSource = 'user-assigned';
  const group = priceGroup(product);
  counts[group] = (counts[group] || 0) + 1;
}
await fs.writeFile(file + '.tmp', JSON.stringify(catalog));
await fs.rename(file + '.tmp', file);
console.log(JSON.stringify(counts));
