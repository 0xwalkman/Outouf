import { z } from 'zod';
import { sameOrigin } from '../../../lib/http';
import { checkoutConfig, checkoutLine, stripeClient } from '../../../lib/checkout';
import { attachSession, savePendingOrder } from '../../../lib/commerce-orders';
import type Stripe from 'stripe';
export const runtime = 'nodejs';
export async function GET() {
  return Response.json({ ready: checkoutConfig().ready, mode: 'test' }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const config = checkoutConfig();
  if (!config.ready) return Response.json({ error: 'Payments are being set up. No charge has been made.' }, { status: 503 });
  const input = z.object({ productId: z.string().max(100), size: z.string().max(100), quantity: z.number().int().min(1).max(20) }).safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: 'Choose a valid product, size and quantity.' }, { status: 400 });
  let item;
  try { item = await checkoutLine(input.data, config.origin); } catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  const id = crypto.randomUUID();
  const subtotal = item.unitAmount * item.quantity;
  savePendingOrder({ id, createdAt: new Date().toISOString(), status: 'pending', currency: 'DKK', items: [item], subtotal, shipping: config.shipping, total: subtotal + config.shipping });
  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: 'payment', client_reference_id: id, metadata: { orderId: id },
      line_items: [{ price_data: { currency: 'dkk', unit_amount: item.unitAmount, product_data: { name: item.title, description: item.size ? `Size / Volume: ${item.size}` : undefined } }, quantity: item.quantity }],
      shipping_address_collection: { allowed_countries: config.countries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] },
      phone_number_collection: { enabled: true },
      shipping_options: [{ shipping_rate_data: { display_name: 'Delivery', type: 'fixed_amount', fixed_amount: { amount: config.shipping, currency: 'dkk' } } }],
      success_url: `${config.origin}/?payment=received`, cancel_url: item.productUrl,
    }, { idempotencyKey: id });
    attachSession(id, session.id);
    return Response.json({ url: session.url });
  } catch { return Response.json({ error: 'Payment could not be started. Please try again.' }, { status: 502 }); }
}
