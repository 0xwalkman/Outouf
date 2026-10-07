import fs from 'node:fs/promises';
const categories = [
 ['5327686','Messika'], ['4300040','David Yurman'], ['4334674','Chopard'],
 ['3709419','Versace'], ['3567316','Chrome Hearts'], ['3507771','Saint Laurent'],
 ['3812530','Rolex'], ['5280869','Givenchy'], ['2943447','Gucci'],
 ['3894192','Vivienne Westwood'], ['4846139','HEFANG'], ['3438460','Hermès'],
 ['3709446','Valentino'], ['3888255','Balenciaga'], ['4061856','Dolce & Gabbana'],
 ['3745114','Qeelin'], ['3349592','Louis Vuitton'], ['3769196','Prada'],
 ['3791709',"Goro's"], ['2978182','AHKAH'], ['2943483','Piaget'],
 ['3340526',null,null,'size-chart'], ['3340538',null,null,'reference'], ['3446035',null,null,'reference'],
];
const metadata = {};
await fs.mkdir('work/yupoo/351164/categories', { recursive: true });
let next = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < categories.length) {
    const [id, brand, garment, kind] = categories[next++];
    let pages = 1;
    for (let page = 1; page <= pages; page++) {
      const file = `work/yupoo/351164/categories/${id}-${page}.html`;
      let html;
      try { html = await fs.readFile(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (!html) {
        const response = await fetch(`https://351164.x.yupoo.com/categories/${id}?page=${page}`, { signal: AbortSignal.timeout(30000), redirect: 'error' });
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
await fs.writeFile('data/351164-metadata.mjs', 'export default ' + JSON.stringify(metadata) + ';\n');
console.log(`Categorized ${Object.keys(metadata).length} albums.`);
