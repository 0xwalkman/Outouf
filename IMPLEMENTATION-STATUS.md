# OUTOUF implementation status

## Implemented
- Database-backed public catalog (active products only; supplier references stay private).
- Account-scoped persistent bag with quantity validation, same-origin writes and active-product checks.
- Account-scoped order history, read-only.
- Existing Sites login is used accurately; this is not Google authentication.
- Injected browser-wallet connection to Arc testnet, balance read using native 18-decimal USDC units, account/network-change invalidation. No transactions or signatures requested.
- Responsive storefront, all seven categories, search and loading/error/empty states.

## Required before commerce launch
- Import approved supplier catalog with product variants, images, stock, pricing and fulfillment details. Catalog currently contains no seeded products.
- Google authentication supported by the hosting architecture.
- Protected admin roles and order management, shipping, cancellations, refunds.
- Audited payment contract, server-authorized quotes, wallet-to-account verification, transaction verification and idempotent order creation.
- Referral attribution, payout retry/reconciliation, duplicate-payment protection and order-validation authorization.
- Card on-ramp partner approval and configuration; partner eligibility and verification requirements still apply.
- Real community storage, consent-based earnings visibility, moderation and privacy/terms.

The contract in contracts/OutoufCheckout.sol is an unaudited draft and is NOT integrated, deployed or approved for funds. Do not use it for live checkout.

Prices in database commerce fields are integer USDC micro-units (1 USDC = 1,000,000). Native Arc wallet balances use 18 decimals; these representations must not be confused.

## Verification
Run node scripts/test-commerce.mjs for SQLite migration and account-isolation tests.
Run npx tsc --noEmit --incremental false and npm run build.
Live wallet approval requires a browser wallet and user interaction. No live transfers have been tested.
