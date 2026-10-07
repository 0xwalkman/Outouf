import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type OrderLine = { productId: string; title: string; brand: string; size: string; quantity: number; unitAmount: number; productUrl: string };
export type StoreOrder = {
  id: string; createdAt: string; paidAt?: string; status: 'pending' | 'paid'; currency: 'DKK';
  items: OrderLine[]; subtotal: number; shipping: number; total: number;
  sessionId?: string; paymentId?: string; email?: string; phone?: string;
  delivery?: { name: string; line1: string; line2: string; city: string; postalCode: string; state: string; country: string };
};
let database: DatabaseSync | undefined;
function db() {
  if (!database) {
    const path = resolve(process.env.ORDER_DATABASE_PATH || 'work/commerce/orders.sqlite');
    mkdirSync(dirname(path), { recursive: true });
    database = new DatabaseSync(path);
    database.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS checkout_orders (id TEXT PRIMARY KEY, session_id TEXT UNIQUE, data TEXT NOT NULL)');
  }
  return database;
}
export function savePendingOrder(order: StoreOrder) {
  db().prepare('INSERT INTO checkout_orders(id,data) VALUES (?,?)').run(order.id, JSON.stringify(order));
}
export function getStoreOrder(id: string): StoreOrder | undefined {
  const row = db().prepare('SELECT data FROM checkout_orders WHERE id=?').get(id);
  return row ? JSON.parse(String(row.data)) : undefined;
}
export function attachSession(id: string, sessionId: string) {
  db().prepare('UPDATE checkout_orders SET session_id=? WHERE id=? AND (session_id IS NULL OR session_id=?)').run(sessionId, id, sessionId);
}
export function recordPaidOrder(id: string, sessionId: string, update: Partial<StoreOrder>) {
  const database = db();
  database.exec('BEGIN IMMEDIATE');
  try {
    const row = database.prepare('SELECT data,session_id FROM checkout_orders WHERE id=?').get(id);
    if (!row || (row.session_id && row.session_id !== sessionId)) throw new Error('Order session mismatch');
    const order: StoreOrder = JSON.parse(String(row.data));
    if (order.status !== 'paid') database.prepare('UPDATE checkout_orders SET session_id=?,data=? WHERE id=?').run(sessionId, JSON.stringify({ ...order, ...update, id, sessionId, status: 'paid' }), id);
    database.exec('COMMIT');
  } catch (error) { database.exec('ROLLBACK'); throw error; }
}
export function copenhagenDay(date: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}
export function paidOrdersForDay(day: string): StoreOrder[] {
  return db().prepare('SELECT data FROM checkout_orders').all().map(row => JSON.parse(String(row.data)) as StoreOrder)
    .filter(order => order.status === 'paid' && order.paidAt && copenhagenDay(order.paidAt) === day);
}
