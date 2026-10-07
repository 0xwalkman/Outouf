import fs from 'node:fs/promises';
const categories = [
  ['5150077', 'Prada'], ['5150063', 'Versace'], ['5149996', 'Dior'],
  ['5149994', 'Fendi'], ['5149993', 'Chanel'], ['5149992', 'Burberry'],
  ['5149991', 'Louis Vuitton'], ['5149986', 'Gucci'],
  ['5213030', null, 'Yoga Wear'], ['4455145', null, 'Beach Shorts'],
  ['4144640', null, 'Bikini'], ['4692540', null, null, 'size-chart'],
];
const metadata = {};
await fs.mkdir('work/yupoo/doufuyi/categories', { recursive: true });
let next = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < categories.length) {
    const [id, brand, garment, kind] = categories[next++];
    let pages = 1;
    for (let page = 1; page <= pages; page++) {
      const file = `work/yupoo/doufuyi/categories/${id}-${page}.html`;
      let html;
      try { html = await fs.readFile(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (!html) {
        const response = await fetch(`https://doufuyi.x.yupoo.com/categories/${id}?page=${page}`, { signal: AbortSignal.timeout(30000), redirect: 'error' });
        if (!response.ok) throw new Error(`Category ${id} page ${page} unavailable`);
        html = await response.text();
        await fs.writeFile(file, html);
      }
      pages = Number(html.match(/in total\s+(\d+)\s+pages/)?.[1] || 1);
      for (const match of html.matchAll(/href="\/albums\/(\d+)\?/g)) {
        const entry = metadata[match[1]] ||= {};
        if (brand) entry.brand = brand;
        if (garment) entry.garment = garment;
        if (kind) entry.kind = kind;
      }
    }
    console.log(`Read category ${id}: ${pages} pages`);
  }
}));
await fs.writeFile('data/doufuyi-metadata.mjs', 'export default ' + JSON.stringify(metadata) + ';\n');
console.log(`Categorized ${Object.keys(metadata).length} albums.`);
