import fs from 'node:fs/promises';
const root = 'work/yupoo/jmshop88';
const html = await fs.readFile(`${root}/categories-all.html`, 'utf8');
const categories = [...new Map([...html.matchAll(/<a[^>]+href=["']([^"']*categories\/(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/g)].map(m => [m[2], m[3].replace(/<[^>]*>/g, '').trim()])).entries()].filter(([, label]) => /[\p{L}\p{N}]/u.test(label));
const metadata = {};
await fs.mkdir(`${root}/categories`, { recursive: true });
function category(label) {
  if (/床單/.test(label)) return 'Bed Sheets';
  if (/鞋/.test(label)) return 'Shoes';
  if (/包包|手拿包|錢夾|錢包/.test(label)) return 'Bags';
  if (/皮帶/.test(label)) return 'Belts';
  if (/手表/.test(label)) return 'Watches';
  if (/香水/.test(label)) return 'Perfume';
  if (/飾品/.test(label)) return 'Jewelry';
  if (/絲巾|圍巾披巾/.test(label)) return 'Scarves';
  if (/配件/.test(label) && /帽|領帶|雨傘|墨鏡/.test(label)) return 'Accessories';
  return 'Clothing';
}
let cursor = 0;
await Promise.all(Array.from({ length: 3 }, async () => { while (cursor < categories.length) {
  const [id, label] = categories[cursor++]; let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const file = `${root}/categories/${id}-${page}.html`; let body;
    try { body = await fs.readFile(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (!body) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const r = await fetch(`https://jmshop88.x.yupoo.com/categories/${id}?page=${page}`, { redirect: 'error', signal: AbortSignal.timeout(30000) });
          if (!r.ok) throw new Error(`HTTP ${r.status}`); body = await r.text(); break;
        } catch (e) { if (attempt === 2) throw e; }
      }
      await fs.writeFile(file, body);
    }
    pages = +(body.match(/in total\s+(\d+)\s+pages/)?.[1] || 1);
    for (const m of body.matchAll(/href="\/albums\/(\d+)\?/g)) metadata[m[1]] = { category: category(label), sourceCategory: id };
  }
  console.log(`Category ${id}: ${pages} pages`);
} }));
await fs.writeFile('data/jmshop88-metadata.mjs', 'export default ' + JSON.stringify(metadata) + ';\n');
console.log(`Categorized ${Object.keys(metadata).length} albums.`);
