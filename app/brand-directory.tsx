'use client';
import { useState } from 'react';
import brands from '../data/home-brands.json';
export function BrandDirectory() {
 const [query,setQuery]=useState('');
 const normal=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
 const matching=brands.filter(b=>normal(b).includes(normal(query)));
 return <section className="brand-directory" id="brands" aria-labelledby="brands-heading"><div className="editorial-heading"><div><p className="editorial-kicker">REPLICA STYLES. EVERY CATEGORY.</p><h2 id="brands-heading">Find your favorite brand styles.</h2></div><label>Find a brand<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search all brands" /></label></div><p className="brand-count" role="status">{matching.length} of {brands.length} brands</p><div className="brand-links">{matching.map(brand=><a href={`/?brand=${encodeURIComponent(brand)}`} key={brand}>{brand}<span aria-hidden="true">↗</span></a>)}</div>{!matching.length&&<p>No matching brands. Try another name.</p>}</section>;
}
