"use client";
import { ArrowRight, ShoppingBag, UserRound, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import "./commerce.css";
import "./account.css";
import "./catalog.css";
import "./live.css";
import { SupplierCatalog } from "./supplier-catalog";
import { HomeEditorial } from "./home-editorial";

type Product = { id: string; title: string; category: string; priceUsdc: number };
type BagItem = Product & { quantity: number; active: number };
type Member = { name: string; email: string };
type Order = { id: string; status: string; amountUsdc: number };
const money = (micros: number) => (micros / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Service unavailable. Please try again.");
  return data;
}

export default function Home() {
  const [view, setView] = useState("shop");
  const [cart, setCart] = useState<BagItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [accountError, setAccountError] = useState("");
  const [bagError, setBagError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [notice, setNotice] = useState("Private preview · Purchases are not enabled");
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.has('product') || query.has('brand') || query.has('search')) setView('catalog');
    if (query.get('payment') === 'received') setNotice('Checkout completed. Payment confirmation is being processed.');
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

  const browse = (selected = "All") => { setCategory(selected); setView("catalog"); };
  return <main className={`site-shell ${view === "shop" ? "home-shell" : ""}`}>
    <header className="topbar">
      <button className="brand" onClick={() => setView("shop")}>OUTOUF</button>
      <nav aria-label="Main navigation" className="main-nav">
        {[["shop", "Shop"], ["community", "Community"], ["orders", "My orders"]].map(([id, label]) => <button key={id} aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}>{label}</button>)}
      </nav>
      <div className="header-actions">
        <button className="round-button" aria-label="Account" onClick={() => setView("account")}><UserRound size={19} /></button>
        <button className="round-button cart" aria-label="Shopping bag" onClick={() => setView("cart")}><ShoppingBag size={19} />{cart.length > 0 && <b>{cart.reduce((n, p) => n + p.quantity, 0)}</b>}</button>
      </div>
    </header>
    <nav className="mobile-nav" aria-label="Mobile navigation">{["shop", "community", "orders"].map(id => <button key={id} onClick={() => setView(id)}>{id === "orders" ? "My orders" : id}</button>)}</nav>
    <div className="status-line" role="status">{notice}</div>
    {view === "shop" && <HomeEditorial browse={browse} navigate={setView} />}
    {view === "catalog" && <SupplierCatalog initialCategory={category} />}
    {view === "cart" && <section className="app-page"><div className="page-intro"><p className="eyebrow">YOUR SAVED BAG</p><h1>A little closer.</h1><p>Your bag is saved to your site account. Checkout is not live yet.</p></div>
      {bagError && <p role="alert">{bagError}</p>}
      {!member ? <button className="primary-button" onClick={() => setView("account")}>SIGN IN TO VIEW YOUR BAG</button> : !cart.length ? <div className="empty-bag"><ShoppingBag size={32} /><h2>Your bag is empty</h2><button className="primary-button" onClick={() => browse()}>EXPLORE THE COLLECTION</button></div> : <div className="cart-layout"><div className="cart-items">{cart.map(p => <article className="cart-item" key={p.id}><div><h2>{p.title}</h2><p>{p.active ? p.category : "Currently unavailable"}</p><strong>{money(p.priceUsdc)} USDC</strong></div><div className="quantity"><button disabled={busy} aria-label={`Decrease ${p.title}`} onClick={() => saveBag(p.id, p.quantity - 1)}><Minus size={15} /></button><b>{p.quantity}</b><button disabled={busy || p.quantity >= 99 || !p.active} aria-label={`Increase ${p.title}`} onClick={() => saveBag(p.id, p.quantity + 1)}><Plus size={15} /></button></div><button disabled={busy} className="remove" aria-label={`Remove ${p.title}`} onClick={() => saveBag(p.id, 0)}><Trash2 size={18} /></button></article>)}</div><aside className="checkout-card"><p className="eyebrow">ITEM SUBTOTAL</p><h2>{money(cart.reduce((n, p) => n + p.priceUsdc * p.quantity, 0))} USDC</h2><p>Shipping and final availability must be confirmed before payment.</p><button className="primary-button" disabled>CHECKOUT NOT YET ENABLED</button><p>No funds will be requested or transferred.</p></aside></div>}
    </section>}
    {view === "account" && <section className="app-page account-page"><div className="account-panel"><div className="account-mark">O</div><p className="eyebrow">YOUR OUTOUF ACCOUNT</p><h1>{member ? `Welcome, ${member.name}.` : "Make it yours."}</h1>{accountError && <p role="alert">{accountError}</p>}<p>{member ? "Your private preview uses your existing site login. Your saved bag belongs to this account." : "Use the site login to access your saved bag."}</p>{!member && <a className="primary-button" href="/signin-with-chatgpt?return_to=%2F">SIGN IN WITH CHATGPT</a>}<p>Google sign-in is not configured.</p></div></section>}
    {view === "orders" && <section className="app-page"><div className="page-intro"><p className="eyebrow">YOUR PURCHASES</p><h1>My orders</h1><p>Only orders belonging to your account appear here.</p></div>{orderError ? <p role="alert">{orderError}</p> : !member ? <button className="primary-button" onClick={() => setView("account")}>SIGN IN TO VIEW ORDERS</button> : !orders.length ? <div className="empty-bag"><ShoppingBag size={32} /><h2>No orders yet</h2><p>Checkout is not enabled. There are no simulated purchases in this list.</p></div> : orders.map(o => <article className="activity-card" key={o.id}><h2>{o.id}</h2><p>{o.status}</p><strong>{money(o.amountUsdc)} USDC</strong></article>)}</section>}
    {view === "community" && <section className="app-page"><div className="page-intro"><p className="eyebrow">THE OUTOUF CIRCLE</p><h1>Good style travels.</h1><p>Share your discoveries. Build your community.</p></div><div className="community-grid"><article className="referral-card"><h2>Affiliate program</h2><p>The affiliate program is not available in this preview. Referrals and rewards are not active.</p><p>No live referral link has been issued.</p></article><article className="rewards-card"><h2>Real activity only.</h2><p>Member posts and earnings will appear here when the community launches. No invented balances, members or returns.</p></article></div></section>}
    <footer className="preview-footer">OUTOUF · Private development preview · No live payments</footer>
  </main>;
}
