# vinext-starter

## Outouf supplier catalog (local preview)

The local catalog importer is `scripts/import-yupoo-index.mjs`. It imports the
cf1688 shoe and mujichaopaia clothing catalogs into `public/catalog/`, with a resumable source cache and an audit
report under ignored `work/yupoo/`. It does not use Apify or an AI API.

Set `YUPOO_PASSWORD` in the process environment, then run:

```sh
node scripts/import-yupoo-index.mjs
```

For clothing, set `YUPOO_CLOTHING_PASSWORD` in ignored `.env.local`, then run
`node --env-file=.env.local scripts/import-yupoo-index.mjs --supplier=mujichaopaia`.
Each import replaces only that supplier's entries and preserves the other supplier.
The additional clothing supplier `888xm888` uses `YUPOO_888XM888_PASSWORD`
and `--supplier=888xm888`. Numeric ranges without an explicit list of sizes
are shown as a range requiring confirmation for this supplier.
The public Alina catalog uses `--supplier=alina-fashion-store2` and needs no
password. Its compact SML labels are expanded and numeric product codes remain
searchable as style numbers.
Doufuyi is public swimwear. Run `node scripts/import-doufuyi-categories.mjs`
to refresh its brand/type mapping, then import with `--supplier=doufuyi`.
Size-chart albums are kept outside the shopping grid; sizes are not inferred
from unreviewed photos.
The public XJ Clothes catalog uses `--supplier=hhhhhh789-123`.
Run `node scripts/import-xjclothes-categories.mjs` first to map its underwear,
socks, bathrobes, and lingerie categories.
Jifan's public belt catalog uses `--supplier=jifan01`; prepare category metadata
with `node scripts/import-jifan-categories.mjs`. Belt widths are descriptive
measurements, not selectable lengths. Packaging and size guides are references.
The public jewelry supplier `351164` uses `--supplier=351164`, after
`node scripts/import-351164-categories.mjs`. It separates Jewelry, Watches,
and Accessories; only explicit ring-size lists become variants, preserving
US labels when stated. Supplier material/purity claims are not imported as verified facts.
Run imports sequentially. Clothing galleries load directly on demand, avoiding
hundreds of thousands of individual static detail files. The canceled mujixieye
shoe supplier is not enabled. Clothing sizes are parsed from explicit text;
sizes present only inside photos require review and are not guessed.

Use `--refresh` to fetch a fresh supplier snapshot; otherwise the import resumes
from cached listing pages. Set the same variable in ignored `.env.local` for the
Next.js local preview's product-gallery endpoint. Never commit catalog passwords.

The importer preserves distinct supplier album IDs even when their titles match,
because those entries can represent different colors or supplier versions. It
separates size charts and reference albums, reports empty albums and missing sizes,
and leaves ambiguous brands under Other brands. Prices and stock are unconfirmed;
these entries are browsing previews, not purchasable inventory.

Full galleries load on demand through an allowlisted supplier endpoint. Photos
are served through `/api/catalog-image`, restricted to the configured suppliers' image paths.
Except for already downloaded sample albums, photos still depend on the supplier;
they are not an independent permanent archive. Generated catalog files are ignored
by Git. Before hosted deployment, copy catalog data and media into D1/R2 and
configure the gallery secret if keeping the supplier-backed gallery workflow.

A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git is required only for publishing

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Whenever reopening or moving a checkout, run `node <plugin-root>/scripts/configure-execution-profile.mjs` before project commands. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

On managed Linux, use `sites-preview start` only for requested browser QA. The project's dev script runs Vite and accepts the supervisor's `--host 0.0.0.0 --port 4173 --strictPort` arguments. The internal browser uses `http://terminal.local:4173/`; it is not a user-facing URL. The supervisor owns the preview lifecycle. The ignored local profile survives the supervisor's cleared process environment.

The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, apply each pending migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform the one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)

## Yupoo Store catalog

`node --max-old-space-size=4096 scripts/import-yupoo-store.mjs` imports the public
`www.yupoo.store` catalog, traversing each top-level category and deduplicating
album IDs. It preserves existing suppliers. Listing and detail caches live in
`work/yupoo/yupoo-store`; run with `--all-details` to prefetch every gallery and
index every available size for collection-wide filtering.

By default, recent products have cached details; other galleries and sizes load
on opening a product through the allowlisted supplier endpoint. Those loaded
sizes become available in the current collection's size filter. Images stream
through a proxy restricted to the seller's image CDN. No prices or stock are
inferred, and purchases remain disabled in the local preview.

### Assigned DKK retail prices

`node scripts/assign-catalog-prices.mjs` assigns stable, varied retail prices by
normalized model (shared across color variants). These are user-assigned prices, not verified supplier costs or a
120% supplier markup. Shoes are DKK 600–800 and ordinary clothing stays under DKK 800, swimwear
under DKK 500, jewelry under DKK 3,000, and padded/down outerwear is DKK 1,200.
Unspecified categories retain their existing price status. The storefront uses
the same pricing rules for newly imported products and preserves a displayed
price while supplier photos and sizes load. Re-run the script after imports to
materialize those prices in the catalog JSON.


Bag supplier `jygy2` is imported with `node scripts/import-yupoo-index.mjs --supplier=jygy2`.
Bag measurements are displayed as dimensions, not selectable clothing sizes.
Assigned bag prices use the longest listed dimension: up to 20 cm = DKK 1,980;
25 = 2,250; 30 = 2,500; 35 = 2,800; 40 = 3,100; above 40 = 3,500.
Missing or unusable dimensions receive DKK 2,700. Unlabelled supplier bag
measurements are treated as centimetres for pricing. Re-run the price assignment
script after reimporting to persist prices in the catalog.

Bed Sheets uses only jmshop88 category 3019121. Refresh with
`node scripts/import-bed-sheets.mjs`; it validates category counts and saves full
galleries locally as product metadata. Towels and blankets retain their product
types within the requested Bed Sheets category. Component measurements are
kept separate; duvet and pillow measurements are not separate purchase sizes.
All products in Bed Sheets have the user-specified fixed price of DKK 2,500.

For the full mixed jmshop88 catalog, cache the supplier index, run
`node scripts/import-jmshop-categories.mjs`, then
`node scripts/import-yupoo-index.mjs --supplier=jmshop88` and
`node scripts/assign-catalog-prices.mjs`. The category map separates clothing,
bags, belts, watches, perfume, jewelry, scarves, accessories, and bedding.
Existing bedding metadata is preserved in `data/jmshop88-bedding.mjs`.
The bedding-only refresh preserves other jmshop88 categories.

Additional assigned prices: belts and hats DKK 300–500 per normalized model;
sunglasses DKK 300/500/750/1,000 by brand tier; umbrellas DKK 280; keyrings
(including keychains) DKK 250; scarves DKK 300; perfume DKK 450. Watches use
DKK 5,000 for the high-end brand list in `catalog-pricing.mjs`, DKK 4,000 otherwise.
Unspecified ties and miscellaneous accessories keep their existing price status.

Retail pricing refinement: the earlier price points now act as base prices.
A stable model-based adjustment of approximately ±4% produces prices ending in
9 kr, rounded within ±5% of the base and clipped to all category limits. Shoes
remain at least DKK 600; bag size tiers and watch brand tiers remain intact.
Matching models and color variants share prices; bag sizes may differ.
This supersedes the earlier fixed display prices. Verify with
`node scripts/test-catalog-pricing.mjs`.
