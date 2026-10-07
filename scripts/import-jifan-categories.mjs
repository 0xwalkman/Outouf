import fs from 'node:fs/promises';
const categories = [
 ['3130169','Chrome Hearts'], ['3123469','Versace'], ['2879384','Stefano Ricci'],
 ['3145454','Montblanc'], ['3152231','Dior'], ['3351433','Burberry'], ['3417235','Prada'],
 ['3123640',null,null,'reference'],
];
const metadata = {};
await fs.mkdir('work/yupoo/jifan01/categories', { recursive: true });
let next = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < categories.length) {
    const [id, brand, garment, kind] = categories[next++];
    let pages = 1;
    for (let page = 1; page <= pages; page++) {
      const file = `work/yupoo/jifan01/categories/${id}-${page}.html`;
      let html;
      try { html = await fs.readFile(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (!html) {
        const response = await fetch(`https://jifan01.x.yupoo.com/categories/${id}?page=${page}`, { signal: AbortSignal.timeout(30000), redirect: 'error' });
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
await fs.writeFile('data/jifan01-metadata.mjs', 'export default ' + JSON.stringify(metadata) + ';\n');
console.log(`Categorized ${Object.keys(metadata).length} albums.`);
