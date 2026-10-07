"use client";

import { useEffect, useRef, useState } from "react";
import "./supplier-catalog.css";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { listedSizes } from "../scripts/storefront-text.mjs";
import { retailPriceLabel } from "../scripts/catalog-pricing.mjs";
import { ProductCheckout } from './product-checkout';

type Product = {
  id: string; title: string; brand: string; category: string; sizeText: string;
  sku: string; images: string[]; imageCount?: number; description?: string; color?: string;
  galleryPending?: boolean; sizes?: string[]; fitNote?: string; supplier?: string;
  priceDkk?: number; garment?: string;
  dimensions?: string;
  kind: "product" | "size-chart" | "reference";
};
type Catalog = { products: Product[]; references: Product[]; complete: boolean; total: number; page: number; pages: number; brands: [string, number][]; categories: string[]; sizes: string[] };


function productSizes(product: Product): string[] { return product.sizes || listedSizes(product.sizeText); }
function needsSize(product: Product): boolean { return ['Clothing', 'Shoes', 'Belts', 'Bed Sheets'].includes(product.category) || /\bring\b/i.test(product.garment || ''); }
function optionLabel(product: Product): string { return product.category === 'Perfume' ? 'Volume' : 'Size'; }
function optionSummary(product: Product): string {
  if (product.category === 'Bags') return product.dimensions ? `Dimensions: ${product.dimensions}` : 'Dimensions not provided';
  const count = productSizes(product).length;
  if (count) return `${count} ${optionLabel(product).toLowerCase()} option${count === 1 ? '' : 's'}`;
  if (needsSize(product)) return product.galleryPending ? 'View product for size details' : 'Size information not provided';
  return product.garment || product.category;
}
function productSupplier(product: Product): string { return product.supplier || product.id.replace(/-\d+$/, ""); }

export function SupplierCatalog({ initialCategory = "All" }: { initialCategory?: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Product | null>(null);
  const [references, setReferences] = useState<Product[]>([]);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const requestSerial = useRef(0);
  const [initialized, setInitialized] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision(n => n + 1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBrand(params.get('brand') || ''); setQuery(params.get('search') || ''); setInitialized(true);
    const id = params.get('product');
    if (!id) return;
    const controller = new AbortController();
    fetch('/api/catalog?product=' + encodeURIComponent(id), { signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error('Product could not be loaded.'); return r.json() as Promise<{ product: Product; references: Product[] }>; })
      .then(data => setSelected(data.product))
      .catch(e => { if(e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!initialized) return;
    const controller = new AbortController();
    const serial = ++requestSerial.current;
    setLoading(true); setError('');
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ category, brand, size, q: query, page: String(page) });
        const response = await fetch('/api/catalog?' + params, { signal: controller.signal });
        if (!response.ok) throw new Error('The collection could not be loaded. Please try again.');
        const data = await response.json() as Catalog;
        if (serial === requestSerial.current && !controller.signal.aborted) setCatalog(data);
      } catch (e) { if (!controller.signal.aborted && serial === requestSerial.current) setError((e as Error).message); }
      finally { if (!controller.signal.aborted && serial === requestSerial.current) setLoading(false); }
    }, query ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [initialized, category, brand, size, query, page, revision]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setReferences([]);
    fetch('/api/catalog?product=' + encodeURIComponent(selected.id), { signal: controller.signal })
      .then(r => { if(!r.ok) throw new Error('Reference lookup failed'); return r.json() as Promise<{ product: Product; references: Product[] }>; })
      .then(data => setReferences(data.references || []))
      .catch(() => {});
    return () => controller.abort();
  }, [selected?.id]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setDetailLoading(true); setDetailError("");
    fetch(selected.galleryPending ? `/api/supplier-products/${encodeURIComponent(selected.id)}` : `/catalog/products/${encodeURIComponent(selected.id)}.json`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error("Product details could not be loaded."); return r.json() as Promise<Product>; })
      .then(async (detail: Product) => {
        if (detail.galleryPending) {
          const response = await fetch(`/api/supplier-products/${encodeURIComponent(detail.id)}`, { signal: controller.signal });
          if (!response.ok) throw new Error("The supplier gallery could not be loaded. Please try again.");
          detail = await response.json() as Product;
        }
        setSelected(current => current?.id === detail.id ? { ...detail, priceDkk: current.priceDkk } : current);
        // Keep newly loaded sizes available to the collection's size filter.
        if (detail.supplier === 'yupoo-store') setCatalog(current => current ? { ...current, products: current.products.map(product => product.id === detail.id ? { ...product, sizes: detail.sizes, sizeText: detail.sizeText } : product) } : current);
      })
      .catch(cause => { if (cause.name !== "AbortError") setDetailError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selected?.id]);

  const brands = catalog?.brands || [];
  const filtered = catalog?.products || [];
  const filterSizes = catalog?.sizes || [];
  const pages = catalog?.pages || 1;
  const currentPage = catalog?.page || 1;
  const reset = () => { setQuery(""); setBrand(""); setSize(""); setCategory("All"); setPage(1); };
  const open = (product: Product) => { setSelected(product); setPhoto(0); setSelectedSize(""); };

  if (selected) return <section className="app-page supplier-catalog">
    <button className="secondary-button" onClick={() => setSelected(null)}>Back to collection</button>
    <div className="supplier-detail">
      <div>
        <div className="supplier-main-photo"><img src={selected.images[photo] || selected.images[0]} alt={`${selected.title}, photo ${photo + 1}`} /></div>
        <div className="supplier-thumbnails" aria-label="Product photos">{selected.images.map((image, i) => <button key={image} aria-label={`View photo ${i + 1}`} aria-pressed={photo === i} onClick={() => setPhoto(i)}><img src={image} alt="" loading="lazy" /></button>)}</div>
      </div>
      <div className="supplier-description">
        <p className="eyebrow">{selected.brand} · Replica</p><h1>{selected.title}</h1><p>Replica product — not an original branded item.</p><p>Free worldwide shipping.</p>
        {selected.sku && <p className="supplier-muted">Style {selected.sku}</p>}
        {selected.color && <p>Color: {selected.color}</p>}
        {selected.kind === "product" && <>
          <p className="supplier-price">{retailPriceLabel(selected)}</p>
          {(selected.category === 'Bags' || productSizes(selected).length > 0 || needsSize(selected)) && <h2 id="product-size-heading">{selected.category === 'Bags' ? 'Dimensions' : `Choose your ${optionLabel(selected).toLowerCase()}`}</h2>}
          {selected.category === 'Bags' ? <p>{selected.dimensions || 'Dimensions not provided by the supplier'}</p> : productSizes(selected).length ? <RadioGroup aria-labelledby="product-size-heading" value={selectedSize} onValueChange={setSelectedSize} className="supplier-size-options">
            {productSizes(selected).map(option => <div className="supplier-size-option" key={option}>
              <RadioGroupItem id={`size-${selected.id}-${option}`} value={option} aria-label={`${optionLabel(selected)} ${option}`} className="supplier-size-radio" />
              <label htmlFor={`size-${selected.id}-${option}`}>{option}</label>
            </div>)}
          </RadioGroup> : needsSize(selected) ? <p className="supplier-muted">{detailLoading ? 'Loading sizes…' : 'The supplier has not provided size options for this item.'}</p> : null}
          {selectedSize && <p className="supplier-size-selection" role="status">Selected {optionLabel(selected).toLowerCase()}: <strong>{selectedSize}</strong></p>}
          {selected.fitNote && <p className="supplier-muted">{selected.fitNote}</p>}
          <ProductCheckout key={selected.id} productId={selected.id} size={selectedSize} selectable={productSizes(selected).length > 0 ? !!selectedSize : !needsSize(selected)} />
        </>}
        {detailLoading && <p role="status">Loading all photos…</p>}
        {detailError && <p role="alert">{detailError}</p>}
        {selected.description && <details className="supplier-original"><summary>Product details</summary><p>{selected.description}</p></details>}
        {selected.kind === "product" && references.filter(p => p.kind === "size-chart" && p.category === selected.category && productSupplier(p) === productSupplier(selected) && (p.brand === selected.brand || p.brand === "Other brands")).map((chart, index) => <button className="secondary-button supplier-chart-link" key={chart.id} onClick={() => open(chart)}>{chart.brand === "Other brands" ? `View size guide ${index + 1}` : `View ${chart.brand} size chart`}</button>)}
      </div>
    </div>
  </section>;

  return <section className="app-page supplier-catalog">
    <div className="supplier-heading"><div className="page-intro"><p className="eyebrow">THE COLLECTION</p><h1>Your next find.</h1><p>Shop replicas by brand and size. Free worldwide shipping.</p></div><button className="secondary-button" onClick={refresh} disabled={loading}>Refresh collection</button></div>
    {catalog && !catalog.complete && <p className="supplier-import-note" role="status">The collection is being added. {catalog.total.toLocaleString()} products are ready to browse.</p>}
    <div className="supplier-toolbar">
      <label>Search<input type="search" placeholder="Brand, model or style number" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></label>
      <label>Brand<select value={brand} onChange={e => { setBrand(e.target.value); setSize(""); setPage(1); }}><option value="">All brands</option>{brands.map(([name, count]) => <option value={name} key={name}>{name} ({count})</option>)}</select></label>
      <label>Category<select value={category} onChange={e => { setCategory(e.target.value); setBrand(""); setSize(""); setPage(1); }}><option>All</option>{(catalog?.categories || []).map(c => <option key={c}>{c}</option>)}</select></label>
      {filterSizes.length > 0 && <label>{category === 'Perfume' ? 'Volume' : 'Size'}<select value={size} onChange={e => { setSize(e.target.value); setPage(1); }}><option value="">{category === 'Perfume' ? 'All volumes' : 'All sizes'}</option>{filterSizes.map(option => <option value={option} key={option}>{option}</option>)}</select></label>}
    </div>
    <div className="supplier-results"><p>{(catalog?.total || 0).toLocaleString()} products{brand ? ` · ${brand}` : ""}</p><button onClick={reset}>Clear filters</button></div>
    {loading ? <p role="status">Loading the collection…</p> : error ? <p role="alert">{error}</p> : !filtered.length ? <div className="empty-bag"><h2>No matching pieces</h2><p>Try another brand, size or search.</p><button className="secondary-button" onClick={reset}>View all products</button></div> : <>
      <div className="catalog-grid">{filtered.map(product => <article className="product-card supplier-card" key={product.id}>
        <button className="supplier-image-button" onClick={() => open(product)} aria-label={`View ${product.title}`}><img src={product.images[0]} alt={product.title} loading="lazy" /><span>{product.imageCount} photos</span></button>
        <div className="supplier-card-copy"><p className="supplier-brand">{product.brand} · Replica</p><h2><button onClick={() => open(product)}>{product.title}</button></h2><p className="supplier-muted">{optionSummary(product)}</p><p className="supplier-muted">{retailPriceLabel(product)}</p></div>
      </article>)}</div>
      <nav className="supplier-pagination" aria-label="Catalog pages"><button className="secondary-button" disabled={loading || currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pages}</span><button className="secondary-button" disabled={loading || currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></nav>
    </>}
  </section>;
}

