import { timingSafeEqual } from 'node:crypto';
import { paidOrdersForDay } from '../../../../../lib/commerce-orders';
import { orderWorkbook } from '../../../../../lib/order-workbook';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const expected = process.env.ORDER_ADMIN_TOKEN;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  if (!expected || expected.length < 32 || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return Response.json({ error: 'Administrator access required.' }, { status: 401 });
  const day = new URL(request.url).searchParams.get('date') || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) return Response.json({ error: 'Choose a valid date.' }, { status: 400 });
  const output = await orderWorkbook(paidOrdersForDay(day), day);
  return new Response(new Uint8Array(output), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="outouf-orders-${day}.xlsx"`, 'Cache-Control': 'private, no-store' } });
}
