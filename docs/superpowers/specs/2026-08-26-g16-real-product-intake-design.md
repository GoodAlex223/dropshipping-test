# G16 — Real-Product Intake: Design Spec

**Date**: 2026-08-26
**Status**: Approved (user, 2026-08-26) — pending implementation plan
**Branch**: `feat/g16-real-product-intake` (from `main` @ `ab8b1df`)
**Source**: WEEKLY.md G16 (🔵 User, 2 members, 4 SP as planned — **revised upward in §8**) — user-raised 2026-08-20 when the client delivered the first 3 real products ahead of the TASK-056 ask
**Program context**: `2026-07-14-mirox-shop-program-design.md` (Mirox rebrand + Ukraine launch). Depends on TASK-056 item 1 (domain) for the production image URL, and carries the item-14 branded-goods constraint into code.

## Problem

WEEKLY planned G16 as a pair session: dry-run the admin product-creation path, then
enter the client's 3 real products together and verify them end-to-end. The prep
step found that **the admin product-creation path cannot carry a real product**, so
the session as planned could not have happened.

### 1. The admin panel can create a product row and nothing else

`src/components/admin/ProductForm.tsx` renders exactly 14 fields: name, slug,
shortDesc, description, price, comparePrice, costPrice, sku, stock, brand, barcode,
mpn, categoryId, isActive, isFeatured. Missing, and needed by every real product:

- **Images.** `src/components/admin/ImageUploader.tsx` exists, is exported from the
  admin barrel, and has **zero consumers** — nothing under `src/app/(admin)/`
  renders it. Its supporting APIs are complete (`POST/DELETE /api/admin/upload` for
  presigned URLs; `GET/POST/PUT /api/admin/products/[id]/images` and
  `DELETE .../images/[imageId]` for persistence), and G13 fully translated its
  `admin.imageUploader` catalog namespace. The component is ready; it lacks a mount
  point and a persistence wrapper.
- **Variants.** No UI, and no API at all — there is no `/api/admin/products/[id]/variants`
  route. Sizes and colours can only be written by `prisma/seed-data/products.ts` or
  direct DB access.
- **`styleGroup`.** Not in the form, and not in `productBaseSchema`
  (`src/lib/validations/index.ts`), so colourway sibling linking is unreachable from
  admin.

### 2. No image storage backend exists in any environment

`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` and
`AWS_CLOUDFRONT_URL` are all absent from `.env`; every existing product image is a
committed `public/images/products/*.png`. The presigned-upload path in
`src/lib/s3.ts` has never had a bucket to talk to.

### 3. The trademark is in the imagery, not just the metadata

The three products are Palm Angels / Polo Ralph Lauren / Lacoste goods, almost
certainly replicas (memory: `real-products-are-third-party-branded`). The standing
ruling was "do NOT write these brand names into the Google Shopping feed", which
implied omitting the `brand` field would suffice. Reading the 25 delivered photos
falsifies that: "Palm Angels" is embroidered across the chest in **every** зіп-худі
photo, the полузамок carries visible POLO RALPH LAUREN neck tags and the embroidered
pony, and the backpack has embossed Lacoste hardware and hang tags. An image-bearing
feed item is a counterfeit-policy exposure regardless of which text fields are set.

Meanwhile `src/app/feed/google-shopping.xml/route.ts` selects
`where: { isActive: true }` with **no opt-out mechanism** — these products would
enter the public feed automatically the moment they went live.

### 4. Two of the three products have no category

The tree is Одяг → {Худі, Футболки, Лонгсліви, Олімпійки, Штани} and
Аксесуари → {Кепки}. A knit half-zip sweater and a backpack have no home.

### 5. Two colour values would silently vanish

`COLOR_SWATCH_CLASSES` in `src/lib/product-display.ts` contains only `Чорний` and
`Білий`. `ProductCard`, `filter-bar.tsx` and the PDP swatch row all filter colour
values through `value in COLOR_SWATCH_CLASSES`, so `Бежевий` and `Темно-синій`
chips would disappear without any error — the project's recurring silent-drop class.

### 6. Three products are seven catalog rows

A colourway must be its own `Product`. `CartItem` carries a single optional
`variantId` (used for size) plus a display-only `color?: string`; `OrderItem`
likewise carries one `variantId` and a `variantInfo` string. Colour rides no cart
dimension, so expressing colourways as extra `Колір` variants on one product would
produce orders that never record which colour was bought. The established model —
one `Product` per colourway, siblings linked by `styleGroup`, exactly one `Колір`
variant each (TASK-037) — is architecturally required, not merely conventional.

### 7. Known gap carried in from WEEKLY

`src/components/ui/textarea.tsx` is a plain function component with no
`React.forwardRef`, while `src/components/ui/input.tsx` uses it. On React 18
(`react@^18.3.1`) the `ref` that `register()` passes is dropped, so react-hook-form
cannot focus an invalid description or shortDesc field.

## Decisions

All ruled by the user during the 2026-08-26 brainstorm.

| #   | Decision          | Ruling                                                                                                                                                                                  |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Deliverable       | **Close the admin gap first.** The intake path must work for the client, not just for us — not a code-path workaround with the gaps filed.                                              |
| 2   | Storage backend   | **Cloudflare R2.** S3-compatible, so `s3.ts` needs only an endpoint and both upload routes stay untouched.                                                                              |
| 3   | Feed handling     | **Per-product `excludeFromFeed` flag** — explicit, auditable, per-product in admin, and survives someone later filling in the brand field. Not a brand allowlist, not category-derived. |
| 4   | Photo allocation  | **Group flat-lays go in every sibling's gallery**, so all 7 rows have 3+ images and card hover-swap works everywhere.                                                                   |
| 5   | Categories        | **Add Одяг → Светри and Аксесуари → Рюкзаки.** Every product sits on a leaf.                                                                                                            |
| 6   | Зіп-худі category | **Олімпійки** — the photos show a hoodless stand-collar track jacket; category follows the garment, not the client's «зіп-худі» wording.                                                |
| 7   | Brand naming      | **Descriptive names, `brand` left NULL.** Keeps trademarks out of `<h1>`, `<title>`, OG cards and JSON-LD, and matches the client's own emoji-masked Telegram copy.                     |
| 8   | Environment       | **Local first, then prod via the deployed admin UI** — the local pass verifies, the prod pass is the real rehearsal of the client's path.                                               |
| 9   | Placeholders      | **Deactivate the 8 seeded products at intake — in prod only**, as an admin action.                                                                                                      |

## Design

### §1 Storage & upload path

`src/lib/s3.ts` gains one optional setting. R2 speaks SigV4 S3, so:

```ts
const endpoint = process.env.S3_ENDPOINT || undefined;

new S3Client({
  // R2 ignores region and expects "auto"; real AWS keeps the existing default.
  region: process.env.AWS_REGION || (endpoint ? "auto" : "us-east-1"),
  endpoint,
  forcePathStyle: Boolean(endpoint),
  credentials: { accessKeyId: ..., secretAccessKey: ... },
})
```

Both `/api/admin/upload` handlers, `getPresignedUploadUrl`, `deleteFromS3` and
`getKeyFromUrl` are unchanged. Path-style vs virtual-host addressing is **verified
against a real R2 bucket at implementation time**, not assumed — if virtual-host
works, `forcePathStyle` is dropped.

**Env contract stays single, not forked.** Add `S3_ENDPOINT`; keep the existing
`AWS_*` names as the credential slots. `.env.example`'s currently-commented `R2_*`
block is **replaced** by a note that R2 credentials go in the `AWS_*` vars with
`S3_ENDPOINT` set — one contract rather than two half-contracts.

`next.config.mjs` needs no change: `images.remotePatterns` already allows
`hostname: "**"`.

**Public-URL constraint (accepted, not solved here).** R2 public access is either the
`r2.dev` URL — which Cloudflare rate-limits and documents as unsuitable for
production — or a custom domain bound to the bucket. No domain exists yet
(TASK-056 item 1, still 📨). `AWS_CLOUDFRONT_URL` therefore points at the `r2.dev`
URL initially and is swapped to `img.<domain>` when the domain lands, on the same
pre-authorized chain as `EMAIL_FROM`. A dependent row is added to the TASK-056
tracking table under item 1.

### §2 Schema & data model

One migration, three changes:

1. `Product.excludeFromFeed Boolean @default(false)` — added to `productBaseSchema`,
   surfaced as an admin `Switch`, and applied in the feed query's `where`. The
   default means no existing product changes behaviour.
2. Categories **Светри** (parent Одяг) and **Рюкзаки** (parent Аксесуари) — added to
   `prisma/seed-data/categories.ts` for local, created through the existing admin
   categories UI in prod.
3. `COLOR_SWATCH_CLASSES` gains `Бежевий` and `Темно-синій`.

The migration reaches production through `scripts/vercel-build.sh` →
`prisma migrate deploy` (against `DIRECT_URL`), the only path that applies
migrations to prod.

### §3 Admin surfaces

**`ProductForm`** gains two fields and one fix:

- `styleGroup` — plain text input with helper text ("products sharing this value are
  the same garment in other colours").
- `excludeFromFeed` — a `Switch` alongside `isActive` / `isFeatured`.
- `Textarea` wrapped in `React.forwardRef`, matching `Input`, closing §Problem 7.

No routing change is needed: `onSubmit` already redirects to
`/admin/products/${savedProduct.id}` on create, so the create → edit → attach flow
exists today.

**Edit page** gains two self-contained sections below the form, each talking only to
its own API:

- **`ProductImagesSection`** — mounts the existing `ImageUploader`. Loads with
  `GET /products/[id]/images`, persists adds with `POST`, order with `PUT`, removals
  with `DELETE .../[imageId]`. All four routes already exist; this is purely a
  consumer plus a persistence wrapper.
- **`ProductVariantsSection`** — new component over a new
  `GET/POST/PATCH/DELETE /api/admin/products/[id]/variants` route. Each row is
  _name → value → stock_.

The variant editor's load-bearing decision: **`name` is a `Select` over
`VARIANT_NAMES`, never a free-text input**, and the API validates
`z.enum([VARIANT_NAMES.size, VARIANT_NAMES.color])`. A hand-typed `"Size"` — which
would silently break every storefront variant lookup and both catalog facets —
becomes unenterable rather than merely discouraged. This is the
`stated-conventions-are-not-controls` lesson applied: the guard is in the procedure
as executed, not in a note.

Deliberately **not** exposed: per-variant `price` and `sku`. Both columns are
nullable, nothing in the catalog sets them, and adding inputs later is trivial (YAGNI).

New catalog keys live under `admin.*`, **UA-only**, per the G13 ruling that admin is
an internal tool and RU falls back to UA through the deep-merge.

### §4 Catalog data

Seven rows. SKUs start at **MRX-101** so real stock is visually distinct from the
MRX-001…008 demo series.

| SKU     | Name                            | Category  | styleGroup          | Колір       | Sizes       | Images                       |
| ------- | ------------------------------- | --------- | ------------------- | ----------- | ----------- | ---------------------------- |
| MRX-101 | Олімпійка з лампасами, чорна    | Олімпійки | `olimpiyka-lampasy` | Чорний      | S–XL        | 3                            |
| MRX-102 | Олімпійка з лампасами, біла     | Олімпійки | `olimpiyka-lampasy` | Білий       | S–XL        | 4 (incl. the only back view) |
| MRX-103 | Светр на блискавці, чорний      | Светри    | `svetr-blyskavka`   | Чорний      | S–XL        | 3                            |
| MRX-104 | Светр на блискавці, білий       | Светри    | `svetr-blyskavka`   | Білий       | S–XL        | 3                            |
| MRX-105 | Светр на блискавці, темно-синій | Светри    | `svetr-blyskavka`   | Темно-синій | S–XL        | 3                            |
| MRX-106 | Светр на блискавці, бежевий     | Светри    | `svetr-blyskavka`   | Бежевий     | S–XL        | 6                            |
| MRX-107 | Рюкзак з екошкіри, чорний       | Рюкзаки   | —                   | Чорний      | Один розмір | 10                           |

Prices 1749 / 1579 / 1649 ₴. **No `comparePrice`** — the client quoted no crossed-out
price, so no sale badge renders, which is correct.

**Photo source mapping** (files in `docs/real_products/`, gitignored, 4.1 MB):

- зіп-худі: `p1` білий worn front · `p2` чорний collar detail · `p3` білий flat front ·
  `p4` чорний flat front · `p5` білий flat **back** · `p6` both-colour group.
  → MRX-102 gets p1, p3, p5, p6; MRX-101 gets p4, p2, p6.
- полузамок: `p1` білий worn · `p2` темно-синій worn · `p3` бежевий worn ·
  `p4` чорний worn · `p5`, `p6`, `p9` бежевий details · `p7`, `p8` four-colour group
  flat-lays. → each colourway gets its own worn shot plus p7 + p8; MRX-106
  additionally gets p5, p6, p9.
- ранець: all 10 to MRX-107; coverage is complete (front / worn / interior / details).

The 25 source files upload once each; shared group shots are referenced by several
products. Re-uploading a duplicate object is acceptable — a media library is not
worth building for this.

The backpack takes a «Один розмір» size variant per the existing cap precedent,
which keeps it outside `SIZE_ORDER` so `showSizePicker` renders no picker. Its
45 × 31 × 15 cm dimensions go in the description.

**Descriptions** derive from the three `tg_channel_description.txt` files with brand
names stripped: material, season, cuffs, hardware, dimensions. The line
**«Всі бірки - присутні» does not go on the site** — it is replica-seller register
and interacts badly with the unanswered item 14.

**Stock quantities were never asked for.** The client listed sizes in stock but no
counts. Seed a nominal 5 per size (10 for the backpack), set `Product.stock` to the
sum, and **add a row to the TASK-056 tracking table** rather than inventing numbers
silently.

**Placeholder deactivation is prod-only, performed through the admin UI, never as a
code change.** The 8 seeded products stay active locally so E2E and the
`getNewArrivals` / `getFeaturedProducts` tests keep passing. Since
`getFeaturedProducts` filters `isActive: true, isFeatured: true`, at least a few real
rows must be flagged `isFeatured` or the production homepage rail empties.

### §5 Verification

**New unit tests:**

- `tests/unit/admin-product-variants-api.test.ts` — 401 unauthenticated, 403
  non-admin, 404 unknown product, CRUD success paths, and specifically that a
  hand-typed `"Size"` is **rejected with 400**. The guard is proven to fail before it
  is trusted (`guards-need-teeth-and-token-layer-coverage`).
- Feed exclusion — a product with `excludeFromFeed: true` is absent from the XML
  while its siblings remain.
- `s3.ts` endpoint configuration, with and without `S3_ENDPOINT` set.
- `Textarea` ref regression — the forwarded ref lands on the DOM node.

Pre-commit runs the full unit suite locally, so every existing suite must stay green.
E2E is untouched by design (local seed data stays active).

**Pair-session checklist**, run locally against all 7 rows after intake:

- PDP: gallery renders, sibling colourway swatches navigate across the styleGroup,
  size picker shows S–XL for garments and nothing for the backpack.
- Catalog: new Светри / Рюкзаки facet rows appear, Бежевий and Темно-синій chips
  render, size + colour filters return the right rows.
- Search returns the new products.
- Cart → COD checkout completes for one garment and the backpack.
- Google feed: the 7 new rows are **absent**; the 8 placeholders still validate
  (`validateFeedItemSafe` drops nothing unexpectedly).
- Sitemap contains the 7 slugs; each PDP's OG image renders.
- Card hover-swap works on every row (all have ≥ 2 images).

A light visual check on the new facet rows and colour chips — **not** a full
visual-gate round, since no design handoff covers admin screens.

## Out of scope

- Per-variant pricing and SKUs (nullable, unused, trivial to add later).
- A media library / image reuse across products.
- Size charts and the `SizePicker` formula replacement (TASK-045, blocked on client
  item 12).
- Back-view photos for MRX-101 and the three thin полузамок colourways (client item
  9); the group flat-lays cover the hover-swap requirement in the meantime.
- The оригінал/репліка positioning ruling (client item 14); §Decision 7 is the safe
  interim, revisited when the client answers.
- Payment gateway work (TASK-048) — deferred until the client asks.

## Risks & open items

| Risk                                                     | Handling                                                                                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2 `r2.dev` URL is rate-limited and not production-grade | Accepted interim; swap to `img.<domain>` on the pre-authorized chain when item 1 lands. Tracked as a TASK-056 dependent row.                                          |
| Scope exceeds the planned 4 SP                           | Recorded in §8 below; the SP revision is surfaced to the user, not absorbed silently.                                                                                 |
| Prod `db:seed` becomes destruction once real data lands  | Already a standing landmine (WEEKLY, memory). Reinforced by §4: prod deactivation is an admin action, and the re-seed runbook is retired for prod from intake onward. |
| Path-style vs virtual-host addressing on R2              | Verified against a real bucket during implementation; the spec does not assume.                                                                                       |
| Stock counts are invented                                | Nominal values, explicitly flagged, plus a TASK-056 tracking row.                                                                                                     |

## §8 Effort revision

WEEKLY plans G16 at **4 SP** for "prep + pair session". Decision 1 (close the admin
gap first) converts it into a feature group: R2 wiring, a schema migration, two form
fields, one new API route, two new admin components, a UI primitive fix, catalog data
for 7 rows, and four new test suites. Realistic size is **8–10 SP**. The WEEKLY entry
and Summary Table are updated when the implementation plan is written; the overflow is
surfaced for the user's scheduling call rather than absorbed.
