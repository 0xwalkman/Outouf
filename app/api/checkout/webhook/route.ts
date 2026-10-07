import { stripeClient } from '../../../../lib/checkout';
import { getStoreOrder, recordPaidOrder } from '../../../../lib/commerce-orders';
import type Stripe from 'stripe';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook is not configured', { status: 503 });
  let event: Stripe.Event;
  try { event = stripeClient().webhooks.constructEvent(await request.text(), request.headers.get('stripe-signature') || '', secret); }
  catch { return new Response('Invalid signature', { status: 400 }); }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid') return Response.json({ received: true });
    const id = session.metadata?.orderId || '';
    const order = getStoreOrder(id);
    if (!order || session.currency !== 'dkk' || session.amount_total !== order.total || session.livemode) return new Response('Order validation failed', { status: 400 });
    const shipping = session.collected_information?.shipping_details;
    if (!shipping?.address) return new Response('Delivery address missing', { status: 400 });
    const a = shipping.address;
    recordPaidOrder(id, session.id, { paidAt: new Date(event.created * 1000).toISOString(), paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      email: session.customer_details?.email || '', phone: session.customer_details?.phone || '',
      delivery: { name: shipping.name || '', line1: a.line1 || '', line2: a.line2 || '', postalCode: a.postal_code || '', city: a.city || '', state: a.state || '', country: a.country || '' },
    });
  }
  return Response.json({ received: true });
}
