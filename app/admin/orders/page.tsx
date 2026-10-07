'use client';
import { useState } from 'react';
export default function OrderExports() {
  const [day, setDay] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/admin/orders/export?date=${day}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(((await response.json()) as { error?: string }).error || 'Export failed.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `outouf-orders-${day}.xlsx`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Excel file downloaded. Orders are grouped by payment date in Copenhagen time.');
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 700, margin: '40px auto', padding: 28, background: '#fffaf5', color: '#16334a', borderRadius: 20, fontFamily: 'Arial, sans-serif', lineHeight: 1.7 }}><a href="/">← Outouf</a><h1>Daily order export</h1><p>Download paid orders with delivery details and a separate item list for packing and sourcing.</p><form onSubmit={e => { e.preventDefault(); void download(); }} style={{ display: 'grid', gap: 16 }}><label>Payment date (Copenhagen)<input style={{ display: 'block', padding: 12, border: '1px solid #8293a1', borderRadius: 8, background: 'white', color: '#16334a' }} aria-label="Payment date" type="date" required value={day} onChange={e => setDay(e.target.value)} /></label><label>Administrator key<input style={{ display: 'block', width: '100%', padding: 12, border: '1px solid #8293a1', borderRadius: 8, background: 'white', color: '#16334a' }} aria-label="Administrator key" type="password" required autoComplete="off" value={token} onChange={e => setToken(e.target.value)} /></label><button style={{ padding: 16, background: '#16334a', color: 'white', borderRadius: 10 }} disabled={busy}>{busy ? 'Preparing…' : 'Download Excel'}</button></form><p role="status">{message}</p><p>Includes order and payment references, customer contact, complete delivery address, product links, selected sizes, quantities, and prices in DKK.</p></main>;
}
