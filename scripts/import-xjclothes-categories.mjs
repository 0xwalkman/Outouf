import fs from 'node:fs/promises';
const categories = [
 ['4982531', null, 'Boxer Briefs'], ['4980501', null, 'Socks'],
 ['5092348', null, 'Bathrobe'], ['5108855', 'Victoria’s Secret', 'Lingerie'],
];
const metadata = {};
await fs.mkdir('work/yupoo/hhhhhh789-123/categories', { recursive: true });
let next = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < categories.length) {
    const [id, brand, garment, kind] = categories[next++];
    let pages = 1;
    for (let page = 1; page <= pages; page++) {
      const file = `work/yupoo/hhhhhh789-123/categories/${id}-${page}.html`;
      let html;
      try { html = await fs.readFile(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (!html) {
        const response = await fetch(`https://hhhhhh789-123.x.yupoo.com/categories/${id}?page=${page}`, { signal: AbortSignal.timeout(30000), redirect: 'error' });
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
await fs.writeFile('data/hhhhhh789-123-metadata.mjs', 'export default ' + JSON.stringify(metadata) + ';\n');
console.log(`Categorized ${Object.keys(metadata).length} albums.`);
