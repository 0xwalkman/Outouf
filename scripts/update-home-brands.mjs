import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('public/catalog/catalog.json','utf8'));
const brands=[...new Set(catalog.products.filter(p=>p.kind==='product').map(p=>p.brand))].filter(b=>b&&b!=='Other brands').sort((a,b)=>a.localeCompare(b));
fs.writeFileSync('data/home-brands.json',JSON.stringify(brands,null,2)+'\n');
console.log(`Published ${brands.length} named brands from every category.`);
