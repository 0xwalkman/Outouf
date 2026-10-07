'use client';
import { useEffect, useState } from 'react';
export function ProductCheckout({ productId, size, selectable }: { productId: string; size: string; selectable: boolean }) {
  const [ready, setReady] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/checkout').then(r => r.json() as Promise<{ ready: boolean }>).then(data => setReady(data.ready === true)).catch(() => {}); }, []);
  async function pay() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, size, quantity }) });
      const result = await response.json() as { error?: string; url?: string };
      if (!response.ok) throw new Error(result.error || 'Payment could not be started.');
      if (!result.url || new URL(result.url).origin !== 'https://checkout.stripe.com') throw new Error('Invalid checkout destination.');
      window.location.assign(result.url);
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }
  return <div><label>Quantity <input aria-label="Quantity" type="number" min={1} max={20} value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ width: 70, padding: 8 }} /></label><p><button className="primary-button" disabled={!ready || !selectable || busy || !Number.isInteger(quantity) || quantity < 1 || quantity > 20} onClick={pay}>{busy ? 'Opening checkout…' : ready ? 'CHECKOUT — TEST MODE' : 'Payments being set up'}</button></p>{!selectable && <p>Select a confirmed size or volume before checkout.</p>}<p>Delivery address and final total are confirmed at checkout.</p>{error && <p role="alert">{error}</p>}</div>;
}
