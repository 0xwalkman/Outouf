'use client';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import products from '../data/home-edit.json';
import './shoe-showcase.css';
import './brand-showcase.css';
export function ShoeShowcase() {
 const [index,setIndex]=useState(0);
 const touchStart=useRef<number|null>(null);
 const product=products[index];
 const move=(direction:number)=>setIndex(v=>(v+direction+products.length)%products.length);
 return <section className="brand-showcase" aria-label="Featured products across all categories" aria-roledescription="carousel" tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}}} onTouchStart={e=>{touchStart.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touchStart.current!==null){const d=e.changedTouches[0].clientX-touchStart.current;if(Math.abs(d)>50)move(d<0?1:-1);touchStart.current=null;}}}>
 <nav className="showcase-category-tabs" aria-label="Featured categories">{products.map((p,i)=><button key={p.id} aria-pressed={i===index} onClick={()=>setIndex(i)}>{p.category}</button>)}</nav>
 <a className="brand-showcase-item" key={product.id} href={`/?product=${encodeURIComponent(product.id)}`} aria-label={`View ${product.title}`}><img src={`/brand-cutouts/${product.id}.png`} alt={product.title}/><h1 aria-live="polite">{product.brand}</h1></a>
 <div className="brand-showcase-controls"><button onClick={()=>move(-1)} aria-label="Previous featured product"><ArrowLeft size={20}/></button><span>{index+1} / {products.length}</span><button onClick={()=>move(1)} aria-label="Next featured product"><ArrowRight size={20}/></button><a href="#brands">All brands ↗</a></div></section>;
}
