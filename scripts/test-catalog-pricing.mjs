import assert from 'node:assert/strict';
import { assignedPriceDkk, basePriceDkk } from './catalog-pricing.mjs';

const product = (category, brand, title, extra = {}) => ({ kind: 'product', category, brand, title, ...extra });
const shoe = product('Shoes', 'Adidas', 'Adidas F50 PRO TF');
assert.equal(assignedPriceDkk({ ...shoe, id: 'seller-a', title: shoe.title + ' Green' }), assignedPriceDkk({ ...shoe, id: 'seller-b', title: shoe.title + ' Purple' }));
for (const [category, garment, min, max] of [
  ['Shoes', 'Shoes', 600, 800], ['Clothing', 'T-Shirt', 1, 800],
  ['Belts', 'Belt', 300, 500], ['Accessories', 'Hat', 300, 500],
  ['Accessories', 'Sunglasses', 300, 1000], ['Jewelry', 'Ring', 1, 3000],
]) for (let n = 0; n < 100; n++) {
  const p = product(category, 'Brand', `Model ${n} ${garment}`, { garment });
  const price = assignedPriceDkk(p), base = basePriceDkk(p);
  assert(price >= min && price <= max);
  assert.equal(price % 10, 9);
  assert(Math.abs(price / base - 1) <= 0.051);
}
const bag = product('Bags', 'Prada', 'Prada Bag');
const bagPrices = [18, 23, 28, 33, 38, 45].map(n => assignedPriceDkk({ ...bag, dimensions: `${n} x 10 x 5` }));
assert(bagPrices.every((p, i) => p >= 1980 && p <= 3500 && (!i || p > bagPrices[i - 1])));
assert(assignedPriceDkk(product('Watches', 'Rolex', 'Rolex Watch')) > assignedPriceDkk(product('Watches', 'Coach', 'Coach Watch')));
assert.equal(assignedPriceDkk({ ...shoe, kind: 'size-chart' }), null);
assert.equal(basePriceDkk(product('Accessories', 'Brand', 'Tie')), 300);
assert.equal(basePriceDkk(product('Accessories', 'Brand', 'Bag Charm')), 250);
console.log('Retail endings, model consistency, price limits, bag sizes and watch tiers passed.');
