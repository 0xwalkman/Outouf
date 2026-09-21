"use client";
import { ArrowRight, ShoppingBag, UserRound, Wallet, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ArcWallet } from "./arc-wallet";
import "./commerce.css";
import "./account.css";
import "./catalog.css";
import "./live.css";

type Product = { id: string; title: string; category: string; priceUsdc: number };
type BagItem = Product & { quantity: number; active: number };
type Member = { name: string; email: string };
type Order = { id: string; status: string; amountUsdc: number };
const categories = ["Clothing", "Shoes", "Watches", "Bags", "Jewelry", "Perfume", "Scarves"];
const colors = ["lilac", "lemon", "mint", "peach", "sky", "rose", "lilac"];
const money = (micros: number) => (micros / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Service unavailable. Please try again.");
  return data;
}

export default function Home() {
  const [view, setView] = useState("shop");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<BagItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [bagError, setBagError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [notice, setNotice] = useState("Private preview · Arc testnet · Purchases are not enabled");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  async function loadCatalog() {
    setLoading(true); setCatalogError("");
    try { setProducts((await request<{ products: Product[] }>("/api/products")).products); }
    catch (error) { setCatalogError((error as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    void loadCatalog();
    request<{ user: Member | null }>("/api/account").then(async data => {
      setMember(data.user);
      if (data.user) {
        await Promise.all([
          request<{ items: BagItem[] }>("/api/cart").then(data => setCart(data.items)).catch(error => setBagError(error.message)),
          request<{ orders: Order[] }>("/api/orders").then(data => setOrders(data.orders)).catch(error => setOrderError(error.message))
        ]);
      }
    }).catch(error => setAccountError(error.message));
  }, []);

  async function saveBag(productId: string, quantity: number) {
    if (!member) { setView("account"); setNotice("Sign in to save your bag."); return; }
    setBusy(true); setBagError("");
    try {
      const result = await request<{ items: BagItem[] }>("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantity }) });
      setCart(result.items); setNotice(quantity ? "Your bag has been saved." : "Item removed from your bag.");
    } catch (error) { setBagError((error as Error).message); setNotice((error as Error).message); }
    finally { setBusy(false); }
  }

  const visible = products.filter(p => (category === "All" || p.category === category) && p.title.toLowerCase().includes(query.toLowerCase()));
  const browse = (selected = "All") => { setCategory(selected); setView("catalog"); };
  return <main className="site-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView("shop")}>OUTOUF</button>
      <nav aria-label="Main navigation" className="main-nav">
        {[["shop", "Shop"], ["community", "Community"], ["orders", "My orders"]].map(([id, label]) => <button key={id} aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}>{label}</button>)}
      </nav>
      <div className="header-actions">
        <button className="wallet-chip" onClick={() => setView("wallet")}><Wallet size={17} /> Arc wallet</button>
        <button className="round-button" aria-label="Account" onClick={() => setView("account")}><UserRound size={19} /></button>
        <button className="round-button cart" aria-label="Shopping bag" onClick={() => setView("cart")}><ShoppingBag size={19} />{cart.length > 0 && <b>{cart.reduce((n, p) => n + p.quantity, 0)}</b>}</button>
      </div>
    </header>
    <nav className="mobile-nav" aria-label="Mobile navigation">{["shop", "community", "orders"].map(id => <button key={id} onClick={() => setView(id)}>{id === "orders" ? "My orders" : id}</button>)}</nav>
    <div className="status-line" role="status">{notice}</div>
    {view === "shop" && <>
      <section className="hero"><img src="/outouf-hero.png" alt="Fashion accessories in a warm peach studio" /><div className="hero-copy"><p className="eyebrow">CURATED FOR YOUR NEXT LOOK</p><h1>Discover your<br /><strong>next piece.</strong></h1><p>Clothes, shoes, bags, watches, jewelry, perfume and scarves. A world of possibilities.</p><button className="primary-button" onClick={() => browse()}>EXPLORE THE COLLECTION <ArrowRight size={18} /></button></div></section>
      <section className="section-head"><h2>Find your style</h2><button onClick={() => browse()}>View catalog <ArrowRight size={16} /></button></section>
      <section className="category-grid" aria-label="Categories">{categories.map((name, index) => <article className={`category-card ${colors[index]}`} key={name}><div className="category-object" aria-hidden="true">✦</div><p>{name}</p><button aria-label={`Browse ${name}`} onClick={() => browse(name)}><ArrowRight size={17} /></button></article>)}</section>
      <section className="earn-banner"><div className="earn-portrait" aria-hidden="true">✦</div><div><p className="eyebrow">SHARE • EARN • GROW</p><h2>Style worth sharing.</h2><p>Our affiliate program is being built around one rule: rewards are released when an order is validated.</p></div><button className="primary-button" onClick={() => setView("community")}>DISCOVER THE PROGRAM <ArrowRight size={17} /></button></section>
    </>}
    {view === "catalog" && <section className="app-page">
      <div className="page-intro"><p className="eyebrow">THE COLLECTION</p><h1>Your next find.</h1><p>Browse products published to the OUTOUF catalog.</p></div>
      <label className="search-field">Search products<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name…" /></label>
      <div className="catalog-filters">{["All", ...categories].map(c => <button key={c} aria-pressed={category === c} className={category === c ? "selected" : ""} onClick={() => setCategory(c)}>{c}</button>)}</div>
      {loading ? <p role="status">Loading the collection…</p> : catalogError ? <div role="alert"><p>{catalogError}</p><button className="secondary-button" onClick={loadCatalog}>Retry catalog</button></div> : !visible.length ? <div className="empty-bag"><ShoppingBag size={32} /><h2>{products.length ? "No matching pieces" : "The collection is on its way"}</h2><p>{products.length ? "Try another category or search." : "Supplier products have not been published yet. No sample products are available for purchase."}</p></div> : <div className="catalog-grid">{visible.map(p => <article className="product-card" key={p.id}><div className={`product-art ${colors[Math.max(0, categories.indexOf(p.category))]}`}><span aria-hidden="true">✦</span></div><div className="product-info"><div><p>{p.title}</p><small>{p.category} · Image pending</small></div><strong>{money(p.priceUsdc)} USDC</strong></div><button className="add-button" disabled={busy} onClick={() => saveBag(p.id, (cart.find(c => c.id === p.id)?.quantity || 0) + 1)}>ADD TO BAG <Plus size={16} /></button></article>)}</div>}
    </section>}
    {view === "wallet" && <ArcWallet />}
    {view === "cart" && <section className="app-page"><div className="page-intro"><p className="eyebrow">YOUR SAVED BAG</p><h1>A little closer.</h1><p>Your bag is saved to your site account. Checkout is not live yet.</p></div>
      {bagError && <p role="alert">{bagError}</p>}
      {!member ? <button className="primary-button" onClick={() => setView("account")}>SIGN IN TO VIEW YOUR BAG</button> : !cart.length ? <div className="empty-bag"><ShoppingBag size={32} /><h2>Your bag is empty</h2><button className="primary-button" onClick={() => browse()}>EXPLORE THE COLLECTION</button></div> : <div className="cart-layout"><div className="cart-items">{cart.map(p => <article className="cart-item" key={p.id}><div><h2>{p.title}</h2><p>{p.active ? p.category : "Currently unavailable"}</p><strong>{money(p.priceUsdc)} USDC</strong></div><div className="quantity"><button disabled={busy} aria-label={`Decrease ${p.title}`} onClick={() => saveBag(p.id, p.quantity - 1)}><Minus size={15} /></button><b>{p.quantity}</b><button disabled={busy || p.quantity >= 99 || !p.active} aria-label={`Increase ${p.title}`} onClick={() => saveBag(p.id, p.quantity + 1)}><Plus size={15} /></button></div><button disabled={busy} className="remove" aria-label={`Remove ${p.title}`} onClick={() => saveBag(p.id, 0)}><Trash2 size={18} /></button></article>)}</div><aside className="checkout-card"><p className="eyebrow">ITEM SUBTOTAL</p><h2>{money(cart.reduce((n, p) => n + p.priceUsdc * p.quantity, 0))} USDC</h2><p>Shipping and final availability must be confirmed before payment.</p><button className="primary-button" disabled>CHECKOUT NOT YET ENABLED</button><p>No funds will be requested or transferred.</p></aside></div>}
    </section>}
    {view === "account" && <section className="app-page account-page"><div className="account-panel"><div className="account-mark">O</div><p className="eyebrow">YOUR OUTOUF ACCOUNT</p><h1>{member ? `Welcome, ${member.name}.` : "Make it yours."}</h1>{accountError && <p role="alert">{accountError}</p>}<p>{member ? "Your private preview uses your existing site login. Your saved bag belongs to this account." : "Use the site login to access your saved bag."}</p>{!member && <a className="primary-button" href="/signin-with-chatgpt?return_to=%2F">SIGN IN WITH CHATGPT</a>}<p>Google sign-in is not configured. Connecting a wallet does not sign you in or link it to your account.</p></div></section>}
    {view === "orders" && <section className="app-page"><div className="page-intro"><p className="eyebrow">YOUR PURCHASES</p><h1>My orders</h1><p>Only orders belonging to your account appear here.</p></div>{orderError ? <p role="alert">{orderError}</p> : !member ? <button className="primary-button" onClick={() => setView("account")}>SIGN IN TO VIEW ORDERS</button> : !orders.length ? <div className="empty-bag"><ShoppingBag size={32} /><h2>No orders yet</h2><p>Checkout is not enabled. There are no simulated purchases in this list.</p></div> : orders.map(o => <article className="activity-card" key={o.id}><h2>{o.id}</h2><p>{o.status}</p><strong>{money(o.amountUsdc)} USDC</strong></article>)}</section>}
    {view === "community" && <section className="app-page"><div className="page-intro"><p className="eyebrow">THE OUTOUF CIRCLE</p><h1>Good style travels.</h1><p>Share your discoveries. Build your community.</p></div><div className="community-grid"><article className="referral-card"><h2>Affiliate program</h2><p>Coming soon. Referral tracking, order validation and verified on-chain payouts must be connected before rewards can be earned.</p><p>No live referral link has been issued.</p></article><article className="rewards-card"><h2>Real activity only.</h2><p>Member posts and earnings will appear here when the community launches. No invented balances, members or returns.</p></article></div></section>}
    <footer className="preview-footer">OUTOUF · Private development preview · No live payments</footer>
  </main>;
}
