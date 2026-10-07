# Payments and daily orders

The current implementation is a **Stripe test-mode, buy-now checkout** on each catalog product. It is not live payment processing or a replacement for the legacy account bag. A product requires confirmed size/volume options where applicable. Prices are looked up on the server, in DKK øre, and saved as immutable order line snapshots. Stripe collects customer contact and the delivery address. Only a signed, paid webhook with the expected currency and total marks an order paid. Repeated webhooks cannot create duplicate orders.

## Local configuration

Use Node.js 22.13+ with the Next.js runtime. This implementation uses Node SQLite and is **not compatible with the existing Cloudflare Worker deployment**. Before production, choose a persistent Node host or migrate order storage and export generation to the deployment platform. Back up the order database; do not put it on an ephemeral filesystem.

Set in the ignored `.env.local` file:

- `STRIPE_SECRET_KEY`: Stripe sandbox secret key (`sk_test_...`). Live keys are intentionally rejected.
- `STRIPE_WEBHOOK_SECRET`: signing secret for `/api/checkout/webhook`.
- `STORE_ORIGIN`: local URL now; the canonical HTTPS public store URL before launch.
- `SHIPPING_DKK`: agreed flat delivery fee, including zero if delivery is free. No implicit default.
- `SHIPPING_COUNTRIES`: comma-separated ISO country codes the store actually serves.
- `ORDER_ADMIN_TOKEN`: random secret of at least 32 characters. Enter only in the protected export form; it is not stored in the browser or URL.
- `ORDER_DATABASE_PATH`: optional persistent database path; defaults to `work/commerce/orders.sqlite` (ignored by Git).

Restart the development server after configuration. Forward Stripe sandbox events to `/api/checkout/webhook`. Complete a sandbox checkout and confirm the paid order appears in the export before any production activation. No real payment has been tested yet.

## Daily Excel download

Open `/admin/orders`, choose a payment date, enter the administrator key, and download Excel. The date uses **Europe/Copenhagen**, including daylight saving time. Only paid orders are included. Empty days export headers with no fabricated orders.

- **Orders**: one row per payment, order ID, paid timestamp, status, DKK subtotal, delivery fee, total paid, payment reference, name, email, phone, full delivery address.
- **Items**: one row per purchased product/size, product ID, title, brand, clickable direct product link, size/volume, quantity, unit price, line total, and delivery details.

Totals belong in Orders so multi-item orders are not double-counted. Customer text is written as string cells, never formulas. The export is an operational paid-orders report, not a tax invoice or refund ledger. Refund reconciliation, shipping status, customer confirmation emails, a multi-item checkout, production owner authentication, and live payment activation remain launch work.
