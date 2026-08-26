# G16 — Real-Product Intake Implementation Plan

**Last Updated**: 2026-08-26
**Task**: G16 (WEEKLY [G16](../WEEKLY.md#g16-real-product-intake-pair-session-batch)) · user-raised 2026-08-20
**Branch**: `feat/g16-real-product-intake`
**Status**: IN PROGRESS 2026-08-26 — spec approved, Tasks 1-10 implemented, Tasks 11-13 outstanding
**Spec**: [2026-08-26-g16-real-product-intake-design.md](../../superpowers/specs/2026-08-26-g16-real-product-intake-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin product path able to carry a real product (images, variants, colourway
link, feed opt-out) on Cloudflare R2 storage, then intake the client's first 3 real products as 7
catalog rows — locally first, then in production through the deployed admin UI.

**Architecture:** Three backend seams (`s3.ts` endpoint config, one additive migration +
`productBaseSchema`, a new variants API mirroring the existing images API) and three admin-UI
seams (two `ProductForm` fields, a `ProductImagesSection` that finally mounts the orphaned
`ImageUploader`, a `ProductVariantsSection` whose variant-name control is a `Select` over
`VARIANT_NAMES`). The feed gains a `where: { excludeFromFeed: false }` guard. Catalog data is
entered through the admin UI in both environments (the spec's Decision 8 — the prod pass is the
client's rehearsal); only the two new categories and two swatch classes are code.

**Tech Stack:** Next.js 14 App Router · Prisma 6 / PostgreSQL · Zod 4 · react-hook-form ·
next-intl (admin namespace, UA-only) · `@aws-sdk/client-s3` v3 against Cloudflare R2 · Vitest +
RTL · shadcn/ui.

## Global Constraints

(copied from the spec; every task's requirements include these)

- Variant names are the DATA values `VARIANT_NAMES.size = "Розмір"` / `VARIANT_NAMES.color = "Колір"` from `src/lib/variant-names.ts`; **the API rejects anything else with 400 and the UI never offers a free-text name input**.
- New admin catalog keys go under `admin.*` in `messages/uk.json` **only** — RU has no `admin.*` by G13 decision (`tests/unit/i18n-catalogs.test.ts` fails if `admin` appears in `ru.json`).
- Env contract is single: R2 credentials live in the existing `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` / `AWS_CLOUDFRONT_URL` slots plus the new `S3_ENDPOINT`. No `R2_*` variables.
- `brand` stays NULL on the 7 real rows; product names are descriptive (no trademark strings anywhere in name/description/alt text).
- `excludeFromFeed` defaults to `false` at the DB so no existing product changes behaviour; the 7 real rows are entered with it **on**.
- Per-variant `price` / `sku` are NOT exposed (YAGNI).
- Placeholder deactivation is a **prod-only admin action** — never a code or seed change; local seed data stays active so E2E keeps passing.
- `prisma/seed.ts` must never run against prod again once real data lands (it deletes the whole catalog tree).
- Every commit must pass lint-staged (eslint --fix + prettier); the full unit suite runs in CI (`npm run test:run`), **not** in pre-commit — run it yourself before every commit. (Correction to spec §5, which says pre-commit runs the suite: `.husky/pre-commit` is `npx lint-staged` only.)
- Docs freshness (`tests/unit/docs-freshness.test.ts`): every `.md` under `docs/` needs a `docs/README.md` row; a bumped `**Last Updated**` needs the index row bumped in the same commit; prettier must be idempotent on every touched markdown file.

## Established facts the tasks rely on

- Local DB is reachable at `postgres:5432` (`pg_isready` OK), so `prisma migrate dev` works here.
- Zod 4 applies `.default(false)` **even under `.partial()`** (verified: `z.object({a: z.boolean().default(false)}).partial().parse({})` → `{a:false}`). Therefore `excludeFromFeed` must be declared `.optional()` with **no default** in `productBaseSchema`, or every partial PUT would silently reset it to `false` and re-enter the product into the feed. (The existing `isActive`/`isFeatured` defaults have this latent quirk today — masked because `ProductForm` always sends both. Out of scope; file as 🟤 at close-out.)
- `next.config.mjs` already allows `hostname: "**"` for remote images — no change for R2 URLs.
- `ProductVariant` has no `onDelete` on its `OrderItem`/`CartItem` relations, so deleting a referenced variant is an FK error — the DELETE route must refuse with 400 first.
- `tests/unit/seed-data.test.ts` asserts every seed image exists under `public/` and that `styleGroup` links exactly the Худі pair — which is why the 7 real rows are **not** seed data.
- `tests/unit/no-bright-colors.test.ts` does not scan `src/lib/product-display.ts`, and arbitrary hex values are not numbered bright-hue utilities — the two new swatch classes are safe.

## File map

| File                                                                                                       | Change                                                      | Task |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---- |
| `docs/README.md`, `docs/planning/WEEKLY.md`, `docs/planning/TODO.md`                                       | plan index row; G16 SP revision; two TASK-056 tracking rows | 1    |
| `src/components/ui/textarea.tsx`                                                                           | wrap in `React.forwardRef`                                  | 2    |
| `tests/unit/textarea-ref.test.tsx`                                                                         | new                                                         | 2    |
| `src/lib/s3.ts`, `.env.example`                                                                            | `S3_ENDPOINT` support; storage block rewritten              | 3    |
| `tests/unit/s3.test.ts`                                                                                    | new                                                         | 3    |
| `prisma/schema.prisma`, `prisma/migrations/<ts>_add_product_exclude_from_feed/`                            | `Product.excludeFromFeed`                                   | 4    |
| `src/lib/validations/index.ts`                                                                             | `styleGroup`, `excludeFromFeed` on `productBaseSchema`      | 4    |
| `src/app/api/admin/products/route.ts`, `.../[id]/route.ts`                                                 | write both fields through                                   | 4    |
| `tests/unit/admin-products-api.test.ts`                                                                    | new                                                         | 4    |
| `src/app/feed/google-shopping.xml/route.ts`                                                                | `excludeFromFeed: false` in `where`                         | 5    |
| `tests/unit/google-shopping-route.test.ts`                                                                 | new                                                         | 5    |
| `src/components/admin/ProductForm.tsx`, `src/app/(admin)/admin/products/[id]/page.tsx`, `messages/uk.json` | two fields + keys; `Product` interfaces                     | 6    |
| `tests/unit/product-form.test.tsx`                                                                         | new                                                         | 6    |
| `src/app/api/admin/products/[id]/variants/route.ts`, `.../[variantId]/route.ts`                            | new GET/POST · PATCH/DELETE                                 | 7    |
| `src/lib/validations/index.ts`                                                                             | `productVariantSchema`, `productVariantUpdateSchema`        | 7    |
| `tests/unit/admin-product-variants-api.test.ts`                                                            | new                                                         | 7    |
| `src/components/admin/ProductVariantsSection.tsx`, `index.ts`, `messages/uk.json`                          | new component + `admin.productVariants` keys                | 8    |
| `tests/unit/product-variants-section.test.tsx`                                                             | new                                                         | 8    |
| `src/components/admin/image-diff.ts`, `ProductImagesSection.tsx`, `index.ts`, `messages/uk.json`           | pure diff helper + section + `admin.productImages` keys     | 9    |
| `tests/unit/image-diff.test.ts`, `tests/unit/product-images-section.test.tsx`                              | new                                                         | 9    |
| `src/app/(admin)/admin/products/[id]/page.tsx`                                                             | mount both sections                                         | 8, 9 |
| `prisma/seed-data/categories.ts`, `src/lib/product-display.ts`, `tests/unit/product-display.test.ts`       | Светри/Рюкзаки; Бежевий/Темно-синій                         | 10   |
| (no code) local R2 verification + local intake + checklist                                                 | pair session                                                | 11   |
| (no code) PR, merge, Vercel env, prod intake, placeholder deactivation                                     | pair session                                                | 12   |
| planning docs                                                                                              | close-out                                                   | 13   |

Task order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13. Tasks 2, 3 and 10 have no
code dependencies on each other and can be dispatched in parallel if desired; 5, 6, 7 depend on
4; 8 depends on 7; 9 depends on 6 (edit-page interface).

---

### Task 1: Plan plumbing + effort revision

**Files:**

- Modify: `docs/README.md` (Implementation Plans table, header `**Last Updated**`)
- Modify: `docs/planning/WEEKLY.md` (G16 section header line, Summary Table row + Total, header date)
- Modify: `docs/planning/TODO.md` (TASK-056 tracking table, header date)

**Interfaces:** none (docs only).

- [ ] **Step 1: Index this plan**

In `docs/README.md`, replace the `_(no active plans)_` placeholder row of the Implementation Plans table with:

```markdown
| [2026-08-26_g16-real-product-intake.md](planning/plans/2026-08-26_g16-real-product-intake.md) | G16 — Real-product intake (admin gap + R2 + 7 rows) | IN PROGRESS | 2026-08-26 |
```

The README's `**Last Updated**` is already `2026-08-26`; leave it.

- [ ] **Step 2: Revise G16's effort in WEEKLY.md**

Change the G16 section's second line from `**4 SP**` to:

```markdown
🔵 User · catalog/data · **4 SP → revised 9 SP (spec §8, 2026-08-26)** · Mon (can pull forward to Fri if the user is available)
```

Directly under the blockquote, add one line:

```markdown
> **Effort revision (2026-08-26, spec §8)**: the prep step found the admin path cannot carry a real product (no image/variant UI, no storage backend, no `styleGroup` field, no feed opt-out). Decision 1 (close the admin gap first) makes this a feature group — realistic 8–10 SP, booked as 9. Scheduling overflow surfaced to the user, not absorbed; pressure-valve order (G20 → G18 tracking half → G21) unchanged.
```

In the Summary Table change the G16 row's `Total SP` from `4` to `9` and the `**Total**` row from `**29**` to `**34**`. WEEKLY.md carries no `**Last Updated**` header — leave its header alone.

- [ ] **Step 3: Add the two TASK-056 dependent rows**

In `docs/planning/TODO.md`, after the item-1 row (`| 1   | 🔴 Domain choice/purchase/DNS ...`), insert:

```markdown
| 1a | ↳ R2 image host swap (G16 dependent) | `AWS_CLOUDFRONT_URL` (Vercel prod) → `https://img.<domain>` bound to the R2 bucket → redeploy; interim is the rate-limited `r2.dev` URL | 📨 | rides item 1; pre-authorized chain |
```

After the item-21 row, append:

```markdown
| 22 | Stock counts per size (3 real products) | `Product.stock` + `ProductVariant.stock` — nominal 5/size, 10 for the backpack until answered (G16 spec §4) | ⬜ | follow-up; not in the 2026-08-21 ask |
```

Update the legend sentence's row count if it states one (it says "21 rows" in the Status line at line ~148: change to "21 rows + 2 G16 dependents"). Bump `**Last Updated**: 2026-08-21` → `2026-08-26` at the top of TODO.md **and** the TODO.md row in `docs/README.md` to `2026-08-26`.

- [ ] **Step 4: Format and verify**

Run: `npx prettier --write docs/README.md docs/planning/WEEKLY.md docs/planning/TODO.md docs/planning/plans/2026-08-26_g16-real-product-intake.md && npm run test:run -- docs-freshness`
Expected: prettier rewrites tables (fine); docs-freshness suite PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/README.md docs/planning/WEEKLY.md docs/planning/TODO.md docs/planning/plans/2026-08-26_g16-real-product-intake.md
git commit -m "docs(g16): implementation plan, 4→9 SP revision, TASK-056 dependent rows"
```

---

### Task 2: `Textarea` forwards its ref

**Files:**

- Modify: `src/components/ui/textarea.tsx`
- Test: `tests/unit/textarea-ref.test.tsx`

**Interfaces:**

- Produces: `Textarea` — same props (`React.ComponentProps<"textarea">`), now `React.forwardRef<HTMLTextAreaElement, …>`. Every existing consumer (9 files) is source-compatible.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/textarea-ref.test.tsx
import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  // G16: react-hook-form's register() passes a ref; a plain function component
  // drops it on React 18, so an invalid description could never be focused.
  it("forwards its ref to the DOM textarea", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="t" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("keeps the data-slot and merges className", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} className="extra" aria-label="t" />);
    expect(ref.current).toHaveAttribute("data-slot", "textarea");
    expect(ref.current).toHaveClass("extra");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/textarea-ref.test.tsx`
Expected: FAIL — `ref.current` is `null` (React warns "Function components cannot be given refs").

- [ ] **Step 3: Implement**

Replace the whole of `src/components/ui/textarea.tsx` with:

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

// forwardRef (G16): matches input.tsx — react-hook-form's register() ref must
// reach the DOM node so validation errors can focus the field on React 18.
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
```

- [ ] **Step 4: Verify**

Run: `npx vitest run tests/unit/textarea-ref.test.tsx && npm run typecheck`
Expected: 2 tests PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/textarea.tsx tests/unit/textarea-ref.test.tsx
git commit -m "fix(ui): Textarea forwards its ref so react-hook-form can focus invalid fields"
```

---

### Task 3: `s3.ts` speaks to Cloudflare R2 via `S3_ENDPOINT`

**Files:**

- Modify: `src/lib/s3.ts:1-10`
- Modify: `.env.example` (FILE STORAGE block)
- Test: `tests/unit/s3.test.ts`

**Interfaces:**

- Produces: unchanged exports `getPresignedUploadUrl(filename, contentType, folder?) → Promise<{uploadUrl, publicUrl, key}>`, `deleteFromS3(key)`, `getKeyFromUrl(url)`, `s3Client`, `BUCKET_NAME`. New env var `S3_ENDPOINT` (optional). Both `/api/admin/upload` handlers stay untouched.

- [ ] **Step 1: Write the failing test**

`s3.ts` builds its client at module scope, so each case resets modules, sets env, and re-imports.

```ts
// tests/unit/s3.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://signed.example/put"),
}));

const originalEnv = process.env;

async function loadS3(env: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = { ...originalEnv, ...env };
  const { S3Client } = await import("@aws-sdk/client-s3");
  const mod = await import("@/lib/s3");
  const config = vi.mocked(S3Client).mock.calls.at(-1)?.[0] as Record<string, unknown>;
  return { mod, config };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  process.env = originalEnv;
});

describe("s3.ts client configuration (G16: Cloudflare R2 via S3_ENDPOINT)", () => {
  it("without S3_ENDPOINT keeps the AWS defaults (us-east-1, no endpoint, virtual-host style)", async () => {
    const { config } = await loadS3({ S3_ENDPOINT: undefined, AWS_REGION: undefined });
    expect(config.region).toBe("us-east-1");
    expect(config.endpoint).toBeUndefined();
    expect(config.forcePathStyle).toBe(false);
  });

  it("with S3_ENDPOINT uses region 'auto', the endpoint, and path-style addressing", async () => {
    const { config } = await loadS3({
      S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com",
      AWS_REGION: undefined,
    });
    expect(config.region).toBe("auto");
    expect(config.endpoint).toBe("https://abc123.r2.cloudflarestorage.com");
    expect(config.forcePathStyle).toBe(true);
  });

  it("an explicit AWS_REGION still wins over 'auto'", async () => {
    const { config } = await loadS3({
      S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com",
      AWS_REGION: "eu-central-1",
    });
    expect(config.region).toBe("eu-central-1");
  });

  it("builds the public URL from AWS_CLOUDFRONT_URL (the r2.dev / img.<domain> host)", async () => {
    const { mod } = await loadS3({
      S3_ENDPOINT: "https://abc123.r2.cloudflarestorage.com",
      AWS_S3_BUCKET: "mirox-media",
      AWS_CLOUDFRONT_URL: "https://pub-xyz.r2.dev",
    });
    const result = await mod.getPresignedUploadUrl("Фото 1.jpg", "image/jpeg");
    expect(result.uploadUrl).toBe("https://signed.example/put");
    expect(result.key).toMatch(/^products\/\d+-_1\.jpg$/);
    expect(result.publicUrl).toBe(`https://pub-xyz.r2.dev/${result.key}`);
    expect(mod.getKeyFromUrl(result.publicUrl)).toBe(result.key);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/s3.test.ts`
Expected: FAIL on the second and third cases (`region` is `"us-east-1"`, `endpoint` undefined, `forcePathStyle` undefined). The first case fails too: `forcePathStyle` is `undefined`, not `false`.

- [ ] **Step 3: Implement**

Replace lines 1–10 of `src/lib/s3.ts` (the imports and the `s3Client` construction) with:

```ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// G16: Cloudflare R2 is SigV4/S3-compatible — one optional endpoint is the
// only difference. Credentials + bucket stay in the AWS_* slots (single env
// contract, no R2_* fork). R2 ignores region and expects "auto"; real AWS
// keeps the old default. forcePathStyle is re-verified against the real
// bucket in Task 11 — if virtual-host addressing works there, drop it.
const endpoint = process.env.S3_ENDPOINT || undefined;

const s3Client = new S3Client({
  region: process.env.AWS_REGION || (endpoint ? "auto" : "us-east-1"),
  endpoint,
  forcePathStyle: Boolean(endpoint),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});
```

Everything below (`BUCKET_NAME`, `CDN_URL`, the three functions, the exports) is unchanged.

- [ ] **Step 4: Rewrite the `.env.example` storage block**

Replace the block from `# FILE STORAGE (AWS S3 or Cloudflare R2)` through `# R2_PUBLIC_URL=""` with:

```dotenv
# ===========================================
# FILE STORAGE (S3-compatible: AWS S3 or Cloudflare R2)
# ===========================================
# ONE contract for both providers (G16). For Cloudflare R2, put the R2 API
# token's key pair in the AWS_* slots, the bucket name in AWS_S3_BUCKET, and
# set S3_ENDPOINT to the account endpoint — there are no R2_* variables.
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
# Leave unset for R2 (the client uses "auto" when S3_ENDPOINT is set).
AWS_REGION=""
AWS_S3_BUCKET="mirox-media"
# R2 only: https://<ACCOUNT_ID>.r2.cloudflarestorage.com. Unset = real AWS S3.
S3_ENDPOINT=""
# Public base URL that product image URLs are built from. R2: the bucket's
# r2.dev URL (rate-limited, interim) until the custom domain lands — then
# https://img.<domain> (TASK-056 item 1a). AWS: the CloudFront distribution.
AWS_CLOUDFRONT_URL=""
```

- [ ] **Step 5: Verify**

Run: `npx vitest run tests/unit/s3.test.ts && npm run typecheck && npm run lint`
Expected: 4 tests PASS; typecheck and lint clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/s3.ts .env.example tests/unit/s3.test.ts
git commit -m "feat(storage): S3_ENDPOINT support so s3.ts talks to Cloudflare R2 (single AWS_* env contract)"
```

---

### Task 4: `excludeFromFeed` + `styleGroup` — schema, migration, validation, write-through

**Files:**

- Modify: `prisma/schema.prisma` (Product model)
- Create: `prisma/migrations/<timestamp>_add_product_exclude_from_feed/migration.sql` (generated)
- Modify: `src/lib/validations/index.ts:22-38`
- Modify: `src/app/api/admin/products/route.ts` (POST create data)
- Modify: `src/app/api/admin/products/[id]/route.ts` (PUT update data)
- Test: `tests/unit/admin-products-api.test.ts`

**Interfaces:**

- Produces: `Product.excludeFromFeed: boolean` (Prisma, default `false`); `productBaseSchema` now accepts `styleGroup?: string | null` (max 100) and `excludeFromFeed?: boolean` (**no default** — see Established facts); POST `/api/admin/products` and PUT `/api/admin/products/[id]` persist both. Tasks 5, 6 depend on these.

- [ ] **Step 1: Schema + migration**

In `prisma/schema.prisma`, inside `model Product`, directly after `isFeatured    Boolean          @default(false)` add:

```prisma
  // G16: per-product Google Shopping opt-out. The 3 real products carry
  // third-party trademarks in their imagery (spec §Problem 3) — an explicit,
  // auditable flag that survives someone later filling in `brand`.
  excludeFromFeed Boolean        @default(false)
```

Run: `npx prisma migrate dev --name add_product_exclude_from_feed`
Expected: a new folder `prisma/migrations/2026…_add_product_exclude_from_feed/migration.sql` containing exactly
`ALTER TABLE "products" ADD COLUMN "excludeFromFeed" BOOLEAN NOT NULL DEFAULT false;`, and "Your database is now in sync". Then `npx prisma format` (aligns the column block) and `npm run db:generate`.

- [ ] **Step 2: Write the failing API test**

```ts
// tests/unit/admin-products-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest, createRouteParams } from "../helpers/api-test-utils";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    category: { findUnique: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { POST } from "@/app/api/admin/products/route";
import { PUT } from "@/app/api/admin/products/[id]/route";

const adminSession = { user: { id: "admin-1", email: "a@t.com", role: "ADMIN" }, expires: "" };

const validBody = {
  name: "Олімпійка з лампасами, чорна",
  slug: "olimpiyka-lampasy-chorna",
  price: 1749,
  sku: "MRX-101",
  stock: 20,
  categoryId: "cat-1",
};

const existing = {
  id: "p1",
  name: "Old",
  slug: "old",
  sku: "MRX-001",
  categoryId: "cat-1",
  styleGroup: null,
  excludeFromFeed: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(adminSession as never);
  vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: "cat-1" } as never);
  vi.mocked(prisma.product.create).mockImplementation(
    async ({ data }: never) => ({ id: "new", ...(data as object) }) as never
  );
  vi.mocked(prisma.product.update).mockImplementation(
    async ({ data }: never) => ({ ...existing, ...(data as object) }) as never
  );
});

describe("POST /api/admin/products — G16 fields", () => {
  it("persists styleGroup and excludeFromFeed when sent", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    const req = createNextRequest({
      url: "/api/admin/products",
      method: "POST",
      body: { ...validBody, styleGroup: "olimpiyka-lampasy", excludeFromFeed: true },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = vi.mocked(prisma.product.create).mock.calls[0][0].data;
    expect(data).toEqual(
      expect.objectContaining({ styleGroup: "olimpiyka-lampasy", excludeFromFeed: true })
    );
  });

  it("leaves excludeFromFeed to the DB default when omitted (does not force false)", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    const res = await POST(
      createNextRequest({ url: "/api/admin/products", method: "POST", body: validBody })
    );
    expect(res.status).toBe(201);
    const data = vi.mocked(prisma.product.create).mock.calls[0][0].data as Record<string, unknown>;
    expect(data.excludeFromFeed).toBeUndefined();
  });

  it("rejects a styleGroup longer than 100 characters", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    const res = await POST(
      createNextRequest({
        url: "/api/admin/products",
        method: "POST",
        body: { ...validBody, styleGroup: "x".repeat(101) },
      })
    );
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/admin/products/[id] — G16 fields", () => {
  beforeEach(() => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(existing as never);
  });

  it("updates styleGroup and excludeFromFeed when sent", async () => {
    const req = createNextRequest({
      url: "/api/admin/products/p1",
      method: "PUT",
      body: { styleGroup: "svetr-blyskavka", excludeFromFeed: false },
    });
    const res = await PUT(req, createRouteParams({ id: "p1" }));
    expect(res.status).toBe(200);
    const data = vi.mocked(prisma.product.update).mock.calls[0][0].data;
    expect(data).toEqual(
      expect.objectContaining({ styleGroup: "svetr-blyskavka", excludeFromFeed: false })
    );
  });

  it("clears styleGroup when null is sent (un-links the colourway)", async () => {
    const req = createNextRequest({
      url: "/api/admin/products/p1",
      method: "PUT",
      body: { styleGroup: null },
    });
    await PUT(req, createRouteParams({ id: "p1" }));
    const data = vi.mocked(prisma.product.update).mock.calls[0][0].data as Record<string, unknown>;
    expect(data.styleGroup).toBeNull();
  });

  // The teeth: Zod 4 keeps .default() under .partial(), so a defaulted flag
  // would be reset to false by ANY partial PUT and silently re-enter the feed.
  it("a partial PUT that omits excludeFromFeed does not touch it", async () => {
    const req = createNextRequest({
      url: "/api/admin/products/p1",
      method: "PUT",
      body: { name: "Renamed" },
    });
    const res = await PUT(req, createRouteParams({ id: "p1" }));
    expect(res.status).toBe(200);
    const data = vi.mocked(prisma.product.update).mock.calls[0][0].data as Record<string, unknown>;
    expect("excludeFromFeed" in data).toBe(false);
    expect("styleGroup" in data).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/unit/admin-products-api.test.ts`
Expected: the "persists"/"updates"/"clears" cases FAIL (fields stripped by Zod, never reach Prisma); the "omits" case passes vacuously for now — it gains teeth once the field exists.

- [ ] **Step 4: Extend `productBaseSchema`**

In `src/lib/validations/index.ts`, inside `productBaseSchema` after the `mpn` line add:

```ts
  // G16: colourway-sibling link (TASK-037 model — one Product per colourway).
  styleGroup: z.string().max(100).optional().nullable(),
  // G16: Google Shopping opt-out. Deliberately NO .default(): Zod 4 applies
  // defaults even under .partial(), which would reset the flag to false on
  // every partial PUT. The DB default (false) covers creation.
  excludeFromFeed: z.boolean().optional(),
```

- [ ] **Step 5: Write both fields through in the routes**

`src/app/api/admin/products/route.ts` — in the `prisma.product.create({ data: { … } })` block, after `mpn: data.mpn,` add:

```ts
        styleGroup: data.styleGroup,
        excludeFromFeed: data.excludeFromFeed,
```

`src/app/api/admin/products/[id]/route.ts` — in the `prisma.product.update({ data: { … } })` block, after the `mpn` spread add:

```ts
        ...(data.styleGroup !== undefined && { styleGroup: data.styleGroup }),
        ...(data.excludeFromFeed !== undefined && { excludeFromFeed: data.excludeFromFeed }),
```

- [ ] **Step 6: Verify**

Run: `npx vitest run tests/unit/admin-products-api.test.ts && npm run typecheck && npm run test:run`
Expected: 6 tests PASS; typecheck clean; full suite green (`seed-data`, `products-api`, `docs-freshness` untouched).

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/validations/index.ts src/app/api/admin/products/route.ts "src/app/api/admin/products/[id]/route.ts" tests/unit/admin-products-api.test.ts
git commit -m "feat(catalog): Product.excludeFromFeed migration + styleGroup/excludeFromFeed on the admin product API"
```

---

### Task 5: The Google Shopping feed honours `excludeFromFeed`

**Files:**

- Modify: `src/app/feed/google-shopping.xml/route.ts` (the `where` clause in `GET`)
- Test: `tests/unit/google-shopping-route.test.ts`

**Interfaces:**

- Consumes: `Product.excludeFromFeed` (Task 4).
- Produces: `GET /feed/google-shopping.xml` selects `where: { isActive: true, excludeFromFeed: false }`.

- [ ] **Step 1: Write the failing test**

The Prisma mock applies the route's own `where` to a fixture, so if the route forgets the
filter the excluded row appears in the XML and the assertion fails — the guard is proven to fail
before it is trusted.

```ts
// tests/unit/google-shopping-route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: { product: { findMany: vi.fn() } } }));
vi.mock("@/lib/seo", () => ({ siteConfig: { name: "Mirox Shop", url: "https://mirox.test" } }));

import { prisma } from "@/lib/db";
import { GET } from "@/app/feed/google-shopping.xml/route";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  price: number;
  comparePrice: number | null;
  sku: string;
  barcode: string | null;
  brand: string | null;
  mpn: string | null;
  stock: number;
  isActive: boolean;
  excludeFromFeed: boolean;
  category: { name: string } | null;
  images: { url: string }[];
};

function row(overrides: Partial<Row>): Row {
  return {
    id: "p-placeholder",
    name: "Худі Mirox Basic",
    slug: "hudi-mirox-basic",
    description: "Базове худі",
    shortDesc: null,
    price: 1290,
    comparePrice: null,
    sku: "MRX-001",
    barcode: null,
    brand: "Mirox",
    mpn: null,
    stock: 10,
    isActive: true,
    excludeFromFeed: false,
    category: { name: "Худі" },
    images: [{ url: "https://mirox.test/images/products/p-hudi-basic.png" }],
    ...overrides,
  };
}

const fixture: Row[] = [
  row({}),
  row({
    id: "p-real",
    name: "Олімпійка з лампасами, чорна",
    slug: "olimpiyka-lampasy-chorna",
    sku: "MRX-101",
    brand: null,
    excludeFromFeed: true,
    images: [{ url: "https://pub-xyz.r2.dev/products/1-photo.jpg" }],
  }),
  row({ id: "p-inactive", slug: "inactive", sku: "MRX-009", isActive: false }),
];

beforeEach(() => {
  vi.clearAllMocks();
  // Apply the route's own where-clause to the fixture (isActive / excludeFromFeed
  // equality only — the two keys this route is expected to use).
  vi.mocked(prisma.product.findMany).mockImplementation(async (args: never) => {
    const where = ((args as { where?: Record<string, unknown> }).where ?? {}) as Partial<Row>;
    return fixture.filter((r) =>
      (Object.keys(where) as (keyof Row)[]).every((k) => r[k] === where[k])
    ) as never;
  });
});

describe("GET /feed/google-shopping.xml — excludeFromFeed (G16)", () => {
  it("queries only active, feed-included products", async () => {
    await GET();
    expect(vi.mocked(prisma.product.findMany).mock.calls[0][0]).toEqual(
      expect.objectContaining({ where: { isActive: true, excludeFromFeed: false } })
    );
  });

  it("omits an excluded product from the XML while its siblings remain", async () => {
    const xml = await (await GET()).text();
    expect(xml).toContain("<g:id>p-placeholder</g:id>");
    expect(xml).not.toContain("p-real");
    expect(xml).not.toContain("olimpiyka-lampasy-chorna");
    expect(xml).not.toContain("p-inactive");
  });

  it("still validates the placeholder row (validateFeedItemSafe drops nothing unexpectedly)", async () => {
    const xml = await (await GET()).text();
    expect(xml).toContain("<g:price>1290.00 UAH</g:price>");
    expect(xml).toContain("<g:brand>Mirox</g:brand>");
    expect(xml).toContain("<g:product_type>Худі</g:product_type>");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/google-shopping-route.test.ts`
Expected: FAIL — the `where` is `{ isActive: true }` only, so `p-real` is present in the XML.

- [ ] **Step 3: Implement**

In `src/app/feed/google-shopping.xml/route.ts`, change the `findMany` call's `where`:

```ts
      // G16: per-product opt-out — trademark-bearing imagery must never enter
      // the public feed, regardless of which text fields are set.
      where: { isActive: true, excludeFromFeed: false },
```

Also update the docblock above `GET` from "for all active products" to "for all active products
not flagged `excludeFromFeed`".

- [ ] **Step 4: Verify**

Run: `npx vitest run tests/unit/google-shopping-route.test.ts tests/unit/google-shopping-feed.test.ts && npm run typecheck`
Expected: all PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/feed/google-shopping.xml/route.ts tests/unit/google-shopping-route.test.ts
git commit -m "feat(feed): honour Product.excludeFromFeed in the Google Shopping feed"
```

---

### Task 6: `ProductForm` gains `styleGroup` and `excludeFromFeed`

**Files:**

- Modify: `src/components/admin/ProductForm.tsx`
- Modify: `src/app/(admin)/admin/products/[id]/page.tsx` (the local `Product` interface)
- Modify: `messages/uk.json` (`admin.productForm.labels/placeholders/hints`)
- Test: `tests/unit/product-form.test.tsx`

**Interfaces:**

- Consumes: `productBaseSchema` fields from Task 4 (the API accepts `styleGroup: string | null`, `excludeFromFeed: boolean`).
- Produces: `ProductForm`'s `Product` prop type gains `styleGroup: string | null; excludeFromFeed: boolean` (both required in the interface — the admin GET returns the full row). Submit payload always includes `styleGroup` (`null` when empty) and `excludeFromFeed`.

- [ ] **Step 1: Add the catalog keys**

In `messages/uk.json` under `admin.productForm`:

- `labels`: add `"styleGroup": "Група кольорів"` and `"excludeFromFeed": "Не показувати у Google Shopping"`.
- `placeholders`: add `"styleGroup": "напр. svetr-blyskavka"`.
- `hints`: add `"styleGroup": "Товари з однаковим значенням — це та сама модель в інших кольорах; на сторінці товару вони показуються як перемикач кольору."` and `"excludeFromFeed": "Товар не потрапляє у фід Google Shopping (для товарів із чужими торговими марками на фото)."`.

Keys are UA-only (`ru.json` untouched — `i18n-catalogs.test.ts` enforces it).

- [ ] **Step 2: Write the failing test**

```tsx
// tests/unit/product-form.test.tsx
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { ProductForm } from "@/components/admin/ProductForm";

const fetchMock = vi.fn();

const product = {
  id: "p1",
  name: "Светр на блискавці, чорний",
  slug: "svetr-blyskavka-chornyi",
  description: "Опис",
  shortDesc: "Короткий",
  price: "1579",
  comparePrice: null,
  costPrice: null,
  sku: "MRX-103",
  barcode: null,
  brand: null,
  mpn: null,
  styleGroup: "svetr-blyskavka",
  excludeFromFeed: true,
  stock: 20,
  categoryId: "cat-svetry",
  isActive: true,
  isFeatured: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async (url: string) => {
    if (url.startsWith("/api/admin/categories")) {
      return {
        ok: true,
        json: async () => [{ id: "cat-svetry", name: "Светри", parentId: "c-odyah" }],
      };
    }
    return { ok: true, json: async () => ({ id: "p1" }) };
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("ProductForm — G16 fields", () => {
  it("renders styleGroup and excludeFromFeed from the product", async () => {
    renderWithIntl(<ProductForm product={product} isEdit />);
    expect(screen.getByLabelText("Група кольорів")).toHaveValue("svetr-blyskavka");
    expect(screen.getByRole("switch", { name: "Не показувати у Google Shopping" })).toBeChecked();
  });

  it("submits styleGroup and excludeFromFeed in the PUT payload", async () => {
    renderWithIntl(<ProductForm product={product} isEdit />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled()); // categories loaded
    fireEvent.change(screen.getByLabelText("Група кольорів"), { target: { value: "new-group" } });
    fireEvent.click(screen.getByRole("switch", { name: "Не показувати у Google Shopping" }));
    fireEvent.click(screen.getByRole("button", { name: "Оновити товар" }));

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
      expect(put).toBeDefined();
      const body = JSON.parse(put![1].body as string);
      expect(body.styleGroup).toBe("new-group");
      expect(body.excludeFromFeed).toBe(false);
    });
  });

  it("sends styleGroup: null when the field is emptied", async () => {
    renderWithIntl(<ProductForm product={product} isEdit />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Група кольорів"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Оновити товар" }));
    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
      expect(JSON.parse(put![1].body as string).styleGroup).toBeNull();
    });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/unit/product-form.test.tsx`
Expected: FAIL — no element labelled «Група кольорів»; no switch named «Не показувати у Google Shopping».

- [ ] **Step 4: Implement in `ProductForm.tsx`**

1. In `buildProductFormSchema`, after `mpn: z.string().optional(),` add:

```ts
      styleGroup: z.string().max(100).optional(),
```

and after `isFeatured: z.boolean(),` add:

```ts
      excludeFromFeed: z.boolean(),
```

2. In the `Product` interface, after `mpn: string | null;` add `styleGroup: string | null;` and after `isFeatured: boolean;` add `excludeFromFeed: boolean;`.

3. In `defaultValues`, add `styleGroup: product?.styleGroup || "",` and `excludeFromFeed: product?.excludeFromFeed ?? false,`.

4. After `const isFeatured = watch("isFeatured");` add `const excludeFromFeed = watch("excludeFromFeed");`.

5. In `onSubmit`'s `payload`, after `mpn: data.mpn || null,` add `styleGroup: data.styleGroup || null,` and after `isFeatured: data.isFeatured,` add `excludeFromFeed: data.excludeFromFeed,`.

6. In the Status card, after the `isFeatured` block (inside `CardContent`, after its closing `</div>`), add:

```tsx
              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="excludeFromFeed">{t("labels.excludeFromFeed")}</Label>
                  <p className="text-muted-foreground text-sm">{t("hints.excludeFromFeed")}</p>
                </div>
                <Switch
                  id="excludeFromFeed"
                  checked={excludeFromFeed}
                  onCheckedChange={(checked) => setValue("excludeFromFeed", checked)}
                  disabled={isLoading}
                />
              </div>
```

(`Switch` renders a Radix `role="switch"` button; the `Label htmlFor` gives it its accessible name.)

7. In the Organization card, after the category `</div>` block, add:

```tsx
<div className="space-y-2">
  <Label htmlFor="styleGroup">{t("labels.styleGroup")}</Label>
  <Input
    id="styleGroup"
    {...register("styleGroup")}
    placeholder={t("placeholders.styleGroup")}
    disabled={isLoading}
  />
  <p className="text-muted-foreground text-xs">{t("hints.styleGroup")}</p>
  {errors.styleGroup && <p className="text-destructive text-sm">{errors.styleGroup.message}</p>}
</div>
```

- [ ] **Step 5: Extend the edit page's `Product` interface**

In `src/app/(admin)/admin/products/[id]/page.tsx`, the local `Product` interface gains the same two members: `styleGroup: string | null;` (after `mpn`) and `excludeFromFeed: boolean;` (after `isFeatured`). The admin GET already returns the full row, so no fetch change.

- [ ] **Step 6: Verify**

Run: `npx vitest run tests/unit/product-form.test.tsx tests/unit/i18n-catalogs.test.ts && npm run typecheck && npm run lint`
Expected: all PASS; typecheck and lint clean. If the switch's accessible name is not resolved in jsdom, the `Label` `htmlFor` must point at the Switch's `id` — check the rendered DOM with `screen.debug()` before changing the query.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/ProductForm.tsx "src/app/(admin)/admin/products/[id]/page.tsx" messages/uk.json tests/unit/product-form.test.tsx
git commit -m "feat(admin): styleGroup and excludeFromFeed fields on the product form"
```

---

### Task 7: Variants API — `GET/POST /api/admin/products/[id]/variants`, `PATCH/DELETE …/[variantId]`

**Files:**

- Modify: `src/lib/validations/index.ts` (after `productSchema`)
- Create: `src/app/api/admin/products/[id]/variants/route.ts`
- Create: `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`
- Test: `tests/unit/admin-product-variants-api.test.ts`

**Interfaces:**

- Consumes: `VARIANT_NAMES` from `@/lib/variant-names`; `requireAdmin/apiError/apiSuccess` from `@/lib/api-utils`.
- Produces (Task 8 depends on these exact shapes):
  - `productVariantSchema = z.object({ name: z.enum([VARIANT_NAMES.size, VARIANT_NAMES.color]), value: z.string().trim().min(1).max(50), stock: z.number().int().min(0) })`
  - `productVariantUpdateSchema = productVariantSchema.partial()` (name still enum-guarded when present)
  - `GET` → `200` JSON array of `ProductVariant` rows ordered `createdAt asc, id asc`; `404` unknown product.
  - `POST` body `{name, value, stock}` → `201` created row; `400` invalid (incl. any name outside the enum, and a duplicate `name+value` on the same product); `404` unknown product.
  - `PATCH` body partial → `200` updated row; `404` variant not on product.
  - `DELETE` → `200 {message}`; `400` when `orderItems`/`cartItems` reference the variant; `404` not found.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/admin-product-variants-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest, createRouteParams } from "../helpers/api-test-utils";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    productVariant: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GET, POST } from "@/app/api/admin/products/[id]/variants/route";
import { PATCH, DELETE } from "@/app/api/admin/products/[id]/variants/[variantId]/route";

const adminSession = { user: { id: "admin-1", email: "a@t.com", role: "ADMIN" }, expires: "" };
const customerSession = { user: { id: "u1", email: "c@t.com", role: "CUSTOMER" }, expires: "" };
const params = createRouteParams({ id: "p1" });
const itemParams = createRouteParams({ id: "p1", variantId: "v1" });

const sizeM = { id: "v1", productId: "p1", name: "Розмір", value: "M", stock: 5 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(adminSession as never);
  vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "p1" } as never);
  vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null);
});

describe("GET /api/admin/products/[id]/variants", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET(createNextRequest({ url: "/api/admin/products/p1/variants" }), params);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin", async () => {
    vi.mocked(auth).mockResolvedValue(customerSession as never);
    const res = await GET(createNextRequest({ url: "/api/admin/products/p1/variants" }), params);
    expect(res.status).toBe(403);
  });

  it("returns 404 for an unknown product", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    const res = await GET(createNextRequest({ url: "/api/admin/products/p1/variants" }), params);
    expect(res.status).toBe(404);
  });

  it("lists the product's variants in creation order", async () => {
    vi.mocked(prisma.productVariant.findMany).mockResolvedValue([sizeM] as never);
    const res = await GET(createNextRequest({ url: "/api/admin/products/p1/variants" }), params);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([sizeM]);
    expect(prisma.productVariant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "p1" },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      })
    );
  });
});

describe("POST /api/admin/products/[id]/variants", () => {
  const post = (body: Record<string, unknown>) =>
    POST(
      createNextRequest({ url: "/api/admin/products/p1/variants", method: "POST", body }),
      params
    );

  it("creates a Розмір variant", async () => {
    vi.mocked(prisma.productVariant.create).mockResolvedValue(sizeM as never);
    const res = await post({ name: "Розмір", value: "M", stock: 5 });
    expect(res.status).toBe(201);
    expect(prisma.productVariant.create).toHaveBeenCalledWith({
      data: { productId: "p1", name: "Розмір", value: "M", stock: 5 },
    });
  });

  it("creates a Колір variant", async () => {
    vi.mocked(prisma.productVariant.create).mockResolvedValue({
      ...sizeM,
      id: "v2",
      name: "Колір",
      value: "Чорний",
    } as never);
    const res = await post({ name: "Колір", value: "Чорний", stock: 20 });
    expect(res.status).toBe(201);
  });

  // The load-bearing guard (spec §3): a hand-typed English name would silently
  // break every storefront variant lookup and both catalog facets.
  it.each(["Size", "Color", "size", "Розмір ", "Колiр"])(
    "rejects the non-canonical name %j with 400 and never touches the DB",
    async (name) => {
      const res = await post({ name, value: "M", stock: 5 });
      expect(res.status).toBe(400);
      expect(prisma.productVariant.create).not.toHaveBeenCalled();
    }
  );

  it("rejects an empty value and a negative stock", async () => {
    expect((await post({ name: "Розмір", value: "  ", stock: 5 })).status).toBe(400);
    expect((await post({ name: "Розмір", value: "M", stock: -1 })).status).toBe(400);
    expect((await post({ name: "Розмір", value: "M", stock: 1.5 })).status).toBe(400);
  });

  it("rejects a duplicate name+value on the same product with 400", async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(sizeM as never);
    const res = await post({ name: "Розмір", value: "M", stock: 5 });
    expect(res.status).toBe(400);
    expect(prisma.productVariant.create).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    expect((await post({ name: "Розмір", value: "M", stock: 5 })).status).toBe(404);
  });
});

describe("PATCH /api/admin/products/[id]/variants/[variantId]", () => {
  const patch = (body: Record<string, unknown>) =>
    PATCH(
      createNextRequest({ url: "/api/admin/products/p1/variants/v1", method: "PATCH", body }),
      itemParams
    );

  it("updates value and stock", async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(sizeM as never);
    vi.mocked(prisma.productVariant.update).mockResolvedValue({ ...sizeM, stock: 9 } as never);
    const res = await patch({ stock: 9 });
    expect(res.status).toBe(200);
    expect(prisma.productVariant.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { stock: 9 },
    });
  });

  it("still rejects a non-canonical name on update", async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(sizeM as never);
    expect((await patch({ name: "Size" })).status).toBe(400);
    expect(prisma.productVariant.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the variant is not on this product", async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null);
    expect((await patch({ stock: 1 })).status).toBe(404);
  });
});

describe("DELETE /api/admin/products/[id]/variants/[variantId]", () => {
  const del = () =>
    DELETE(
      createNextRequest({ url: "/api/admin/products/p1/variants/v1", method: "DELETE" }),
      itemParams
    );

  it("deletes an unreferenced variant", async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({
      ...sizeM,
      _count: { orderItems: 0, cartItems: 0 },
    } as never);
    const res = await del();
    expect(res.status).toBe(200);
    expect(prisma.productVariant.delete).toHaveBeenCalledWith({ where: { id: "v1" } });
  });

  it("refuses with 400 when orders or carts reference the variant", async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue({
      ...sizeM,
      _count: { orderItems: 2, cartItems: 0 },
    } as never);
    expect((await del()).status).toBe(400);
    expect(prisma.productVariant.delete).not.toHaveBeenCalled();
  });

  it("returns 404 when not found", async () => {
    vi.mocked(prisma.productVariant.findFirst).mockResolvedValue(null);
    expect((await del()).status).toBe(404);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/admin-product-variants-api.test.ts`
Expected: FAIL at import — the route modules do not exist.

- [ ] **Step 3: Add the schemas**

In `src/lib/validations/index.ts`, add `import { VARIANT_NAMES } from "@/lib/variant-names";` at the top, and after `productSchema`:

```ts
// Product variant validations (G16). `name` is an enum over the canonical DATA
// values — a hand-typed "Size" is unenterable, not merely discouraged
// (stated-conventions-are-not-controls). Per-variant price/sku deliberately
// not exposed (YAGNI).
export const productVariantSchema = z.object({
  name: z.enum([VARIANT_NAMES.size, VARIANT_NAMES.color], {
    message: `Variant name must be "${VARIANT_NAMES.size}" or "${VARIANT_NAMES.color}"`,
  }),
  value: z.string().trim().min(1, "Value is required").max(50),
  stock: z.number().int().min(0, "Stock cannot be negative"),
});

export const productVariantUpdateSchema = productVariantSchema.partial();
```

- [ ] **Step 4: Implement the collection route**

```ts
// src/app/api/admin/products/[id]/variants/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { productVariantSchema } from "@/lib/validations";
import { requireAdmin, apiError, apiSuccess } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/products/[id]/variants - List a product's variants
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) {
      return apiError("Product not found", 404);
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      // Same tiebreaker as the PDP query: rows can share a createdAt.
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return apiSuccess(variants);
  } catch {
    return apiError("Failed to fetch variants", 500);
  }
}

// POST /api/admin/products/[id]/variants - Add a variant
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) {
      return apiError("Product not found", 404);
    }

    const validationResult = productVariantSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError(validationResult.error.issues[0].message, 400);
    }
    const data = validationResult.data;

    const duplicate = await prisma.productVariant.findFirst({
      where: { productId: id, name: data.name, value: data.value },
      select: { id: true },
    });
    if (duplicate) {
      return apiError("This variant already exists on the product", 400);
    }

    const variant = await prisma.productVariant.create({
      data: { productId: id, name: data.name, value: data.value, stock: data.stock },
    });

    return apiSuccess(variant, 201);
  } catch {
    return apiError("Failed to add variant", 500);
  }
}
```

- [ ] **Step 5: Implement the item route**

```ts
// src/app/api/admin/products/[id]/variants/[variantId]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { productVariantUpdateSchema } from "@/lib/validations";
import { requireAdmin, apiError, apiSuccess } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string; variantId: string }>;
}

// PATCH /api/admin/products/[id]/variants/[variantId] - Update a variant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id, variantId } = await params;
    const body = await request.json();

    const existing = await prisma.productVariant.findFirst({
      where: { id: variantId, productId: id },
    });
    if (!existing) {
      return apiError("Variant not found", 404);
    }

    const validationResult = productVariantUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError(validationResult.error.issues[0].message, 400);
    }
    const data = validationResult.data;

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.stock !== undefined && { stock: data.stock }),
      },
    });

    return apiSuccess(variant);
  } catch {
    return apiError("Failed to update variant", 500);
  }
}

// DELETE /api/admin/products/[id]/variants/[variantId] - Delete a variant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id, variantId } = await params;

    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId: id },
      include: { _count: { select: { orderItems: true, cartItems: true } } },
    });
    if (!variant) {
      return apiError("Variant not found", 404);
    }

    // No onDelete on the OrderItem/CartItem relations — a referenced variant
    // would be an FK error; refuse explicitly instead.
    if (variant._count.orderItems > 0 || variant._count.cartItems > 0) {
      return apiError(
        "Cannot delete a variant that is referenced by orders or carts. Set its stock to 0 instead.",
        400
      );
    }

    await prisma.productVariant.delete({ where: { id: variantId } });

    return apiSuccess({ message: "Variant deleted successfully" });
  } catch {
    return apiError("Failed to delete variant", 500);
  }
}
```

- [ ] **Step 6: Verify**

Run: `npx vitest run tests/unit/admin-product-variants-api.test.ts && npm run typecheck && npm run lint`
Expected: all cases PASS (5 parametrised rejections included); typecheck and lint clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/validations/index.ts "src/app/api/admin/products/[id]/variants" tests/unit/admin-product-variants-api.test.ts
git commit -m "feat(admin-api): product variants CRUD with enum-guarded canonical variant names"
```

---

### Task 8: `ProductVariantsSection` — rows of name → value → stock, mounted on the edit page

**Files:**

- Create: `src/components/admin/ProductVariantsSection.tsx`
- Modify: `src/components/admin/index.ts` (export)
- Modify: `src/app/(admin)/admin/products/[id]/page.tsx` (mount below `ProductForm`)
- Modify: `messages/uk.json` (new `admin.productVariants` namespace)
- Test: `tests/unit/product-variants-section.test.tsx`

**Interfaces:**

- Consumes: Task 7's routes and shapes; `VARIANT_NAMES`; shadcn `Select*`, `Input`, `Button`, `Card*`, `Table*`; `toast` from sonner.
- Produces: `export function ProductVariantsSection({ productId }: { productId: string })`.

- [ ] **Step 1: Add the catalog keys**

In `messages/uk.json` under `admin`, add a sibling namespace:

```json
"productVariants": {
  "title": "Варіанти",
  "description": "Розміри та колір товару. Назва варіанта — лише «Розмір» або «Колір»: саме ці значення шукає вітрина.",
  "headers": { "name": "Назва", "value": "Значення", "stock": "Залишок", "actions": "Дії" },
  "namePlaceholder": "Назва",
  "valuePlaceholder": "напр. M або Чорний",
  "add": "Додати варіант",
  "empty": "Варіантів ще немає.",
  "toasts": {
    "loadError": "Не вдалося завантажити варіанти",
    "added": "Варіант додано",
    "updated": "Варіант оновлено",
    "deleted": "Варіант видалено",
    "saveError": "Не вдалося зберегти варіант",
    "deleteError": "Не вдалося видалити варіант"
  }
}
```

- [ ] **Step 2: Write the failing test**

```tsx
// tests/unit/product-variants-section.test.tsx
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { ProductVariantsSection } from "@/components/admin/ProductVariantsSection";

const fetchMock = vi.fn();
const rows = [
  { id: "v1", productId: "p1", name: "Розмір", value: "M", stock: 5 },
  { id: "v2", productId: "p1", name: "Колір", value: "Чорний", stock: 20 },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (!init || init.method === undefined) return { ok: true, json: async () => rows };
    if (init.method === "POST")
      return {
        ok: true,
        json: async () => ({ id: "v3", productId: "p1", ...JSON.parse(init.body as string) }),
      };
    return { ok: true, json: async () => ({}) };
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("ProductVariantsSection", () => {
  it("loads and lists the product's variants", async () => {
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    expect(await screen.findByDisplayValue("Чорний")).toBeInTheDocument();
    expect(screen.getByDisplayValue("M")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/products/p1/variants");
  });

  // The guard as executed: the name is a Select, never a free-text input.
  it("offers the variant name only as a select — no text input named «Назва»", async () => {
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");
    const combos = screen.getAllByRole("combobox");
    expect(combos.length).toBeGreaterThanOrEqual(1); // the add-row select (+ one per row)
    expect(screen.queryByRole("textbox", { name: "Назва" })).toBeNull();
    expect(screen.getAllByRole("textbox", { name: "Значення" }).length).toBeGreaterThanOrEqual(1);
  });

  it("adds a variant with the canonical default name «Розмір»", async () => {
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");
    // Rows and the add row share aria-labels; the add row is the LAST match.
    fireEvent.change(screen.getAllByRole("textbox", { name: "Значення" }).at(-1)!, {
      target: { value: "L" },
    });
    fireEvent.change(screen.getAllByRole("spinbutton", { name: "Залишок" }).at(-1)!, {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Додати варіант" }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      expect(post).toBeDefined();
      expect(JSON.parse(post![1].body as string)).toEqual({ name: "Розмір", value: "L", stock: 5 });
    });
    expect(await screen.findByDisplayValue("L")).toBeInTheDocument();
  });

  it("deletes a row via DELETE on the item route", async () => {
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");
    fireEvent.click(screen.getAllByRole("button", { name: "Видалити" })[1]);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/products/p1/variants/v2",
        expect.objectContaining({ method: "DELETE" })
      )
    );
    await waitFor(() => expect(screen.queryByDisplayValue("Чорний")).toBeNull());
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/unit/product-variants-section.test.tsx`
Expected: FAIL at import — module does not exist.

- [ ] **Step 4: Implement the component**

```tsx
// src/components/admin/ProductVariantsSection.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VARIANT_NAMES } from "@/lib/variant-names";

type VariantName = (typeof VARIANT_NAMES)[keyof typeof VARIANT_NAMES];
const NAME_OPTIONS: VariantName[] = [VARIANT_NAMES.size, VARIANT_NAMES.color];

interface VariantRow {
  id: string;
  name: string;
  value: string;
  stock: number;
}

interface ProductVariantsSectionProps {
  productId: string;
}

/**
 * G16: name → value → stock rows over /api/admin/products/[id]/variants.
 * The name control is a Select over VARIANT_NAMES — never free text — so a
 * hand-typed "Size" (which breaks every storefront lookup) is unenterable.
 * Value/stock edits persist on blur via PATCH; per-variant price/sku are
 * deliberately not exposed (YAGNI).
 */
export function ProductVariantsSection({ productId }: ProductVariantsSectionProps) {
  const t = useTranslations("admin.productVariants");
  const tCommon = useTranslations("admin.common");
  const base = `/api/admin/products/${productId}/variants`;

  const [rows, setRows] = useState<VariantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: VariantName; value: string; stock: string }>({
    name: VARIANT_NAMES.size,
    value: "",
    stock: "0",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(base);
        if (!res.ok) throw new Error();
        setRows(await res.json());
      } catch {
        toast.error(t("toasts.loadError"));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [base, t]);

  const addVariant = async () => {
    const stock = parseInt(draft.stock, 10);
    if (!draft.value.trim() || isNaN(stock) || stock < 0) return;
    setBusyId("new");
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, value: draft.value.trim(), stock }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("toasts.saveError"));
      }
      const created: VariantRow = await res.json();
      setRows((prev) => [...prev, created]);
      setDraft({ name: draft.name, value: "", stock: "0" });
      toast.success(t("toasts.added"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toasts.saveError"));
    } finally {
      setBusyId(null);
    }
  };

  const patchVariant = useCallback(
    async (id: string, patch: Partial<Pick<VariantRow, "name" | "value" | "stock">>) => {
      setBusyId(id);
      try {
        const res = await fetch(`${base}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || t("toasts.saveError"));
        }
        const updated: VariantRow = await res.json();
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
        toast.success(t("toasts.updated"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("toasts.saveError"));
      } finally {
        setBusyId(null);
      }
    },
    [base, t]
  );

  const deleteVariant = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`${base}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("toasts.deleteError"));
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success(t("toasts.deleted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toasts.deleteError"));
    } finally {
      setBusyId(null);
    }
  };

  const updateLocal = (id: string, patch: Partial<VariantRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const nameSelect = (value: string, onChange: (v: VariantName) => void, disabled: boolean) => (
    <Select value={value} onValueChange={(v) => onChange(v as VariantName)} disabled={disabled}>
      <SelectTrigger aria-label={t("headers.name")}>
        <SelectValue placeholder={t("namePlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {NAME_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> {tCommon("loading")}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <div className="space-y-2">
            <div className="text-muted-foreground grid grid-cols-[1fr_1fr_6rem_2.5rem] gap-2 text-xs font-medium">
              <span>{t("headers.name")}</span>
              <span>{t("headers.value")}</span>
              <span>{t("headers.stock")}</span>
              <span className="sr-only">{t("headers.actions")}</span>
            </div>
            {rows.map((row) => {
              const busy = busyId === row.id;
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_1fr_6rem_2.5rem] items-center gap-2"
                >
                  {nameSelect(row.name, (name) => patchVariant(row.id, { name }), busy)}
                  <Input
                    aria-label={t("headers.value")}
                    value={row.value}
                    disabled={busy}
                    onChange={(e) => updateLocal(row.id, { value: e.target.value })}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value) patchVariant(row.id, { value });
                    }}
                  />
                  <Input
                    aria-label={t("headers.stock")}
                    type="number"
                    min="0"
                    value={row.stock}
                    disabled={busy}
                    onChange={(e) => updateLocal(row.id, { stock: Number(e.target.value) })}
                    onBlur={(e) => {
                      const stock = parseInt(e.target.value, 10);
                      if (!isNaN(stock) && stock >= 0) patchVariant(row.id, { stock });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={tCommon("delete")}
                    disabled={busy}
                    onClick={() => deleteVariant(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-[1fr_1fr_6rem_auto] items-center gap-2 border-t pt-4">
          {nameSelect(draft.name, (name) => setDraft({ ...draft, name }), busyId === "new")}
          <Input
            aria-label={t("headers.value")}
            placeholder={t("valuePlaceholder")}
            value={draft.value}
            disabled={busyId === "new"}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
          />
          <Input
            aria-label={t("headers.stock")}
            type="number"
            min="0"
            value={draft.stock}
            disabled={busyId === "new"}
            onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
          />
          <Button
            type="button"
            onClick={addVariant}
            disabled={busyId === "new" || !draft.value.trim()}
          >
            {busyId === "new" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("add")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

The row inputs and the add-row inputs share their `aria-label`s («Значення», «Залишок»), so the
test targets the **last** match — the add row — via `.at(-1)!`.

- [ ] **Step 5: Export and mount**

`src/components/admin/index.ts` — add `export { ProductVariantsSection } from "./ProductVariantsSection";`.

`src/app/(admin)/admin/products/[id]/page.tsx` — import `ProductVariantsSection` from `@/components/admin` and, after `<ProductForm product={product} isEdit />`, render:

```tsx
<ProductVariantsSection productId={product.id} />
```

- [ ] **Step 6: Verify**

Run: `npx vitest run tests/unit/product-variants-section.test.tsx tests/unit/i18n-catalogs.test.ts && npm run typecheck && npm run lint`
Expected: 4 tests PASS; typecheck and lint clean. Radix `Select` needs no pointer polyfill here because no test opens it.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/ProductVariantsSection.tsx src/components/admin/index.ts "src/app/(admin)/admin/products/[id]/page.tsx" messages/uk.json tests/unit/product-variants-section.test.tsx
git commit -m "feat(admin): ProductVariantsSection — enum-guarded variant editor on the product edit page"
```

---

### Task 9: `ProductImagesSection` — the `ImageUploader` finally gets a mount point and a persistence wrapper

**Files:**

- Create: `src/components/admin/image-diff.ts` (pure helper)
- Create: `src/components/admin/ProductImagesSection.tsx`
- Modify: `src/components/admin/index.ts` (export)
- Modify: `src/app/(admin)/admin/products/[id]/page.tsx` (mount above the variants section)
- Modify: `messages/uk.json` (new `admin.productImages` namespace)
- Test: `tests/unit/image-diff.test.ts`, `tests/unit/product-images-section.test.tsx`

**Interfaces:**

- Consumes: existing `ImageUploader` (`images: {id?, url, alt?, isNew?}[]`, `onChange(images)`, `maxImages`, `folder`); existing routes `GET/POST/PUT /api/admin/products/[id]/images` (POST body `{url, alt?, position?}` → 201 row; PUT body `{imageIds: string[]}`) and `DELETE …/images/[imageId]`.
- Produces:
  - `export interface AdminImage { id?: string; url: string; alt?: string; isNew?: boolean }`
  - `export function diffImages(prev: AdminImage[], next: AdminImage[]): { added: AdminImage[]; removedIds: string[]; orderChanged: boolean }`
  - `export function ProductImagesSection({ productId }: { productId: string })`.

Design: adds and removals persist immediately (POST / DELETE); reorders are applied locally and
persisted by an explicit «Зберегти порядок» button (the uploader fires `onChange` on every
drag-over, so persisting each one would spam PUTs). A removed persisted image deletes only the DB
row — the R2 object stays (accepted: no media library, see spec §4).

- [ ] **Step 1: Add the catalog keys**

In `messages/uk.json` under `admin`, add:

```json
"productImages": {
  "title": "Зображення",
  "description": "Перше зображення — головне (картка товару). Друге показується при наведенні на картку. Перетягніть, щоб змінити порядок, і збережіть його.",
  "saveOrder": "Зберегти порядок",
  "orderSaved": "Порядок збережено",
  "toasts": {
    "loadError": "Не вдалося завантажити зображення",
    "attachError": "Не вдалося прикріпити {name}",
    "removeError": "Не вдалося видалити зображення",
    "orderError": "Не вдалося зберегти порядок"
  }
}
```

- [ ] **Step 2: Write the failing helper test**

```ts
// tests/unit/image-diff.test.ts
import { describe, it, expect } from "vitest";
import { diffImages, type AdminImage } from "@/components/admin/image-diff";

const a: AdminImage = { id: "a", url: "https://x/a.jpg" };
const b: AdminImage = { id: "b", url: "https://x/b.jpg" };
const fresh: AdminImage = { url: "https://x/new.jpg", isNew: true };

describe("diffImages", () => {
  it("reports a new (id-less) image as added", () => {
    expect(diffImages([a, b], [a, b, fresh])).toEqual({
      added: [fresh],
      removedIds: [],
      orderChanged: false,
    });
  });

  it("reports a missing persisted id as removed", () => {
    expect(diffImages([a, b], [b])).toEqual({ added: [], removedIds: ["a"], orderChanged: false });
  });

  it("reports a pure reorder of persisted ids", () => {
    expect(diffImages([a, b], [b, a])).toEqual({ added: [], removedIds: [], orderChanged: true });
  });

  it("does not count an add or remove as a reorder", () => {
    expect(diffImages([a, b], [b, fresh]).orderChanged).toBe(false);
  });

  it("is a no-op for identical lists", () => {
    expect(diffImages([a, b], [a, b])).toEqual({ added: [], removedIds: [], orderChanged: false });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/unit/image-diff.test.ts`
Expected: FAIL at import.

- [ ] **Step 4: Implement the helper**

```ts
// src/components/admin/image-diff.ts
/** Mirrors ImageUploader's ImageItem — id present = persisted ProductImage row. */
export interface AdminImage {
  id?: string;
  url: string;
  alt?: string;
  isNew?: boolean;
}

export interface ImageChanges {
  added: AdminImage[];
  removedIds: string[];
  orderChanged: boolean;
}

/**
 * G16: the persistence wrapper's decision function. Adds = items without an
 * id; removals = persisted ids absent from `next`; a reorder is only reported
 * when the persisted-id sequence changed with NO add/remove in the same
 * change (the uploader emits one onChange per drag-over).
 */
export function diffImages(prev: AdminImage[], next: AdminImage[]): ImageChanges {
  const nextIds = next.filter((i) => i.id).map((i) => i.id as string);
  const prevIds = prev.filter((i) => i.id).map((i) => i.id as string);
  const added = next.filter((i) => !i.id);
  const removedIds = prevIds.filter((id) => !nextIds.includes(id));
  const sameMembers = added.length === 0 && removedIds.length === 0;
  const orderChanged = sameMembers && prevIds.some((id, index) => nextIds[index] !== id);
  return { added, removedIds, orderChanged };
}
```

- [ ] **Step 5: Write the failing component test**

The dropzone cannot be exercised in jsdom, so the render test covers load, remove, and the
save-order button. The add/reorder decisions are covered by the `diffImages` helper test; the
real upload → POST path is verified manually in Task 11 (accepted gap).

```tsx
// tests/unit/product-images-section.test.tsx
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { ProductImagesSection } from "@/components/admin/ProductImagesSection";

const fetchMock = vi.fn();
const rows = [
  {
    id: "i1",
    productId: "p1",
    url: "https://pub.r2.dev/products/1-front.jpg",
    alt: "Спереду",
    position: 0,
  },
  {
    id: "i2",
    productId: "p1",
    url: "https://pub.r2.dev/products/2-back.jpg",
    alt: "Ззаду",
    position: 1,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (!init || init.method === undefined) return { ok: true, json: async () => rows };
    return { ok: true, json: async () => rows };
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("ProductImagesSection", () => {
  it("loads the product's images into the uploader grid", async () => {
    renderWithIntl(<ProductImagesSection productId="p1" />);
    expect(await screen.findByAltText("Спереду")).toBeInTheDocument();
    expect(screen.getByAltText("Ззаду")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/products/p1/images");
  });

  it("removing a persisted image calls DELETE on its item route", async () => {
    renderWithIntl(<ProductImagesSection productId="p1" />);
    await screen.findByAltText("Ззаду");
    // ImageUploader's remove buttons are icon-only; the second one belongs to i2.
    const removeButtons = screen
      .getAllByRole("button")
      .filter((b) => b.className.includes("destructive"));
    fireEvent.click(removeButtons[1]);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/products/p1/images/i2",
        expect.objectContaining({ method: "DELETE" })
      )
    );
    await waitFor(() => expect(screen.queryByAltText("Ззаду")).toBeNull());
  });

  it("hides the save-order button until the order is dirty", async () => {
    renderWithIntl(<ProductImagesSection productId="p1" />);
    await screen.findByAltText("Ззаду");
    expect(screen.queryByRole("button", { name: "Зберегти порядок" })).toBeNull();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run tests/unit/product-images-section.test.tsx`
Expected: FAIL at import.

- [ ] **Step 7: Implement the section**

```tsx
// src/components/admin/ProductImagesSection.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "./ImageUploader";
import { diffImages, type AdminImage } from "./image-diff";

interface ProductImagesSectionProps {
  productId: string;
}

/**
 * G16: the persistence wrapper ImageUploader never had. Adds POST, removals
 * DELETE, both immediately; reorders apply locally and persist on an explicit
 * button (the uploader emits onChange per drag-over). Removing a persisted
 * image deletes the DB row only — the R2 object is left in place (accepted).
 */
export function ProductImagesSection({ productId }: ProductImagesSectionProps) {
  const t = useTranslations("admin.productImages");
  const tCommon = useTranslations("admin.common");
  const base = `/api/admin/products/${productId}/images`;

  const [images, setImages] = useState<AdminImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderDirty, setOrderDirty] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(base);
        if (!res.ok) throw new Error();
        const rows: { id: string; url: string; alt: string | null }[] = await res.json();
        setImages(rows.map((r) => ({ id: r.id, url: r.url, alt: r.alt ?? undefined })));
      } catch {
        toast.error(t("toasts.loadError"));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [base, t]);

  const handleChange = async (next: AdminImage[]) => {
    const { added, removedIds, orderChanged } = diffImages(images, next);

    if (orderChanged) {
      setImages(next);
      setOrderDirty(true);
      return;
    }

    // Optimistic local state; failures below roll the specific item back.
    let working = next;
    setImages(working);

    for (const id of removedIds) {
      try {
        const res = await fetch(`${base}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
      } catch {
        toast.error(t("toasts.removeError"));
        const restored = images.find((i) => i.id === id);
        if (restored) {
          working = [...working, restored];
          setImages(working);
        }
      }
    }

    for (const item of added) {
      try {
        const res = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url, position: working.indexOf(item) }),
        });
        if (!res.ok) throw new Error();
        const row: { id: string; url: string; alt: string | null } = await res.json();
        working = working.map((i) =>
          i === item ? { id: row.id, url: row.url, alt: row.alt ?? undefined } : i
        );
      } catch {
        toast.error(t("toasts.attachError", { name: item.url.split("/").pop() ?? item.url }));
        working = working.filter((i) => i !== item);
      }
      setImages(working);
    }
  };

  const saveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const res = await fetch(base, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: images.filter((i) => i.id).map((i) => i.id) }),
      });
      if (!res.ok) throw new Error();
      setOrderDirty(false);
      toast.success(t("orderSaved"));
    } catch {
      toast.error(t("toasts.orderError"));
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> {tCommon("loading")}
          </div>
        ) : (
          <ImageUploader images={images} onChange={handleChange} maxImages={12} folder="products" />
        )}
        {orderDirty && (
          <Button type="button" onClick={saveOrder} disabled={isSavingOrder}>
            {isSavingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("saveOrder")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

`maxImages={12}`: the backpack row carries 10 photos (spec §4); the uploader's default of 10
would block the last one.

- [ ] **Step 8: Export and mount**

`src/components/admin/index.ts` — add `export { ProductImagesSection } from "./ProductImagesSection";`.

`src/app/(admin)/admin/products/[id]/page.tsx` — import it from `@/components/admin` and render
it between `<ProductForm … />` and `<ProductVariantsSection … />`:

```tsx
      <ProductForm product={product} isEdit />
      <ProductImagesSection productId={product.id} />
      <ProductVariantsSection productId={product.id} />
```

- [ ] **Step 9: Verify**

Run: `npx vitest run tests/unit/image-diff.test.ts tests/unit/product-images-section.test.tsx tests/unit/i18n-catalogs.test.ts && npm run typecheck && npm run lint && npm run test:run`
Expected: all PASS; full suite green.

- [ ] **Step 10: Commit**

```bash
git add src/components/admin/image-diff.ts src/components/admin/ProductImagesSection.tsx src/components/admin/index.ts "src/app/(admin)/admin/products/[id]/page.tsx" messages/uk.json tests/unit/image-diff.test.ts tests/unit/product-images-section.test.tsx
git commit -m "feat(admin): ProductImagesSection mounts ImageUploader with a persistence wrapper"
```

---

### Task 10: Catalog prerequisites — two categories, two swatches

**Files:**

- Modify: `prisma/seed-data/categories.ts` (`subcategories`)
- Modify: `src/lib/product-display.ts` (`COLOR_SWATCH_CLASSES`)
- Modify: `tests/unit/product-display.test.ts`, `tests/unit/seed-data.test.ts`

**Interfaces:**

- Produces: seed slugs `svetry` (parent `odyah`, sortOrder 6) and `ryukzaky` (parent `aksesuary`, sortOrder 2); swatch keys `Бежевий`, `Темно-синій`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/product-display.test.ts` inside the `describe`:

```ts
// G16: the real полузамок colourways — without these keys ProductCard,
// filter-bar and the PDP swatch row silently drop the chips.
it("swatch classes cover the G16 real-product colourways", () => {
  expect(Object.keys(COLOR_SWATCH_CLASSES)).toEqual(
    expect.arrayContaining(["Чорний", "Білий", "Бежевий", "Темно-синій"])
  );
  for (const cls of Object.values(COLOR_SWATCH_CLASSES)) expect(cls).toMatch(/\bbg-/);
});
```

Append to `tests/unit/seed-data.test.ts`'s first `describe`:

```ts
// G16: every real product sits on a leaf — Светри (Одяг) and Рюкзаки (Аксесуари).
it("seeds the G16 leaf categories under the right parents", () => {
  const bySlug = new Map(subcategories.map((s) => [s.slug, s]));
  expect(bySlug.get("svetry")?.parentSlug).toBe("odyah");
  expect(bySlug.get("ryukzaky")?.parentSlug).toBe("aksesuary");
  expect(new Set(subcategories.map((s) => s.slug)).size).toBe(subcategories.length);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/product-display.test.ts tests/unit/seed-data.test.ts`
Expected: the two new cases FAIL (missing keys / undefined slugs).

- [ ] **Step 3: Implement**

`src/lib/product-display.ts`:

```ts
export const COLOR_SWATCH_CLASSES: Record<string, string> = {
  Чорний: "bg-black border-border-strong",
  Білий: "bg-[#f5f5f5] border-border",
  // G16 (real полузамок colourways). Muted hexes on purpose — the swatch is a
  // chip, not a brand colour; no-bright-colors does not scan this module.
  Бежевий: "bg-[#d6c3a5] border-border",
  "Темно-синій": "bg-[#1f2a44] border-border-strong",
};
```

`prisma/seed-data/categories.ts` — append to `subcategories`:

```ts
  {
    name: "Светри",
    slug: "svetry",
    description: "Светри Mirox — в'язані та на блискавці",
    parentSlug: "odyah",
    sortOrder: 6,
  },
  {
    name: "Рюкзаки",
    slug: "ryukzaky",
    description: "Рюкзаки та ранці Mirox",
    parentSlug: "aksesuary",
    sortOrder: 2,
  },
```

- [ ] **Step 4: Verify (tests + a real local reseed)**

Run: `npx vitest run tests/unit/product-display.test.ts tests/unit/seed-data.test.ts tests/unit/filter-bar.test.tsx tests/unit/product-card.test.tsx && npm run typecheck`
Expected: PASS.

Then reseed locally (destructive by design, local host only — `assertLocalDatabase()` guards it):
`npm run db:seed` → output line `10 categories (2 top-level, 8 sub)`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/product-display.ts prisma/seed-data/categories.ts tests/unit/product-display.test.ts tests/unit/seed-data.test.ts
git commit -m "feat(catalog): Светри/Рюкзаки leaf categories and Бежевий/Темно-синій swatches for the real products"
```

---

### Task 11: Local pass — R2 wiring verified against the real bucket, then the 7 rows entered through admin (pair session)

**Files:** none committed except possibly `src/lib/s3.ts` (see Step 2) and this plan's log.

**Preconditions (user):** a Cloudflare R2 bucket (suggested name `mirox-media`), an R2 API token
with Object Read & Write on it, the bucket's **public access enabled** (r2.dev subdomain), and a
CORS rule on the bucket allowing `PUT` from `http://localhost:3000` and the Vercel prod origin
with `Content-Type` in `AllowedHeaders` — the browser uploads straight to the presigned URL.

- [ ] **Step 1: Local env**

In `.env` (never committed) set:

```dotenv
AWS_ACCESS_KEY_ID="<r2 token access key id>"
AWS_SECRET_ACCESS_KEY="<r2 token secret>"
AWS_S3_BUCKET="mirox-media"
S3_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
AWS_CLOUDFRONT_URL="https://pub-<hash>.r2.dev"
```

Leave `AWS_REGION` unset (or empty).

- [ ] **Step 2: Verify addressing against the real bucket (spec §1 open item)**

Write this to the scratchpad as `r2-check.ts` and run it from the repo root with
`node --env-file=.env --import tsx <scratchpad>/r2-check.ts` (Node ≥ 20.6; `tsx` is a devDependency):

```ts
import { getPresignedUploadUrl } from "/workspaces/dropshipping/src/lib/s3";

async function main() {
  const { uploadUrl, publicUrl, key } = await getPresignedUploadUrl(
    "r2-check.txt",
    "text/plain",
    "products"
  );
  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: "ok",
    headers: { "Content-Type": "text/plain" },
  });
  console.log("PUT", put.status, key);
  const get = await fetch(publicUrl);
  console.log("GET", get.status, await get.text(), publicUrl);
}
main();
```

Expected: `PUT 200` and `GET 200 ok`. If PUT fails with a `SignatureDoesNotMatch` / host
error, retry once with `forcePathStyle: false` in `s3.ts`; whichever works is kept, the
`s3.test.ts` expectation for `forcePathStyle` is updated to match, the spec's §1 gets a one-line
"verified: path-style|virtual-host" note, and the change is committed as
`fix(storage): R2 addressing verified against the real bucket`. Delete the probe object afterwards
(dashboard or `deleteFromS3(key)`).

- [ ] **Step 3: Dev server, fresh cache**

Run: `rm -rf .next && npm run dev` (stale `.next` masks changes — memory `next-dev-serves-stale-next-cache`). Sign in as the seeded admin.

- [ ] **Step 4: Enter the 7 rows (Appendix A) through `/admin/products/new`**

Per row: fill the form (name, slug, short/full description, price, SKU, stock = variant sum,
category, `styleGroup`, **«Не показувати у Google Shopping» ON**, `brand` empty, «Рекомендований»
ON for MRX-101, 102, 103, 107) → «Створити товар» → on the edit page upload the listed photos in the
listed order → add variants (`Розмір` S/M/L/XL at 5 each, or «Один розмір» 10; exactly one
`Колір` row) → «Зберегти порядок» if reordered.

Log any defect found in **this plan's Execution Log** (bottom of the file): fixed-live ones as
`fix(g16): …` commits on this branch; larger ones as 🟤 BACKLOG candidates for close-out.

- [ ] **Step 5: Pair-session checklist (spec §5), all 7 rows**

- [ ] PDP: gallery renders (R2 URLs through `next/image`), sibling colourway swatches navigate across the styleGroup (2 for олімпійка, 4 for светр), size picker shows S–XL for garments and **no picker** for the backpack.
- [ ] Catalog `/products`: Светри and Рюкзаки appear in the category facet; Бежевий and Темно-синій chips render; size + colour filters return the right rows.
- [ ] Header search finds «Светр», «Олімпійка», «Рюкзак».
- [ ] Cart → COD checkout completes for one garment (with size) and the backpack; the order line reads «Розмір: M», never «— Size».
- [ ] `curl -s localhost:3000/feed/google-shopping.xml | grep -c "<item>"` = 8 (placeholders only); `grep MRX-1` finds nothing.
- [ ] `curl -s localhost:3000/sitemap.xml` contains the 7 slugs; each `/products/<slug>/opengraph-image` returns 200 with an image.
- [ ] Card hover-swap works on every row (each has ≥ 2 images).
- [ ] Light visual check of the facet rows and chips — no full visual-gate round (no design handoff covers admin).

- [ ] **Step 6: Record**

Append the checklist outcome + defect list to the Execution Log; commit the plan
(`docs(g16): local pass complete — <n> defects fixed live, <m> filed`).

---

### Task 12: PR, merge, production pass

- [ ] **Step 1: Finish the branch** — REQUIRED SUB-SKILL `superpowers:finishing-a-development-branch`: `npm run lint && npm run typecheck && npm run format:check && npm run test:run` green; `gh pr create` against `main` with a body that lists every spec decision (1–9) and links the spec + this plan (percent-encode `(admin)`/`[id]` in permalinks). Wait for CI (lint/typecheck/tests/build/E2E on chromium+webkit — the E2E job runs `prisma migrate deploy` + `db seed`, which exercises the new migration and categories). **Merge only on the user's word.**

- [ ] **Step 2: Vercel env before the deploy lands** (user, dashboard — production scope): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `S3_ENDPOINT`, `AWS_CLOUDFRONT_URL` (the r2.dev URL). Add the prod origin to the bucket's CORS rule.

- [ ] **Step 3: Verify the deploy is real** — the Vercel Git integration builds `vercel-build.sh` → `prisma migrate deploy`; confirm `20…_add_product_exclude_from_feed` applied (build log) and that `GET <prod>/feed/google-shopping.xml` still returns 8 items. Green Actions badge ≠ deployed (memory).

- [ ] **Step 4: Prod categories** — `/admin/categories`: create «Светри» (slug `svetry`, parent Одяг) and «Рюкзаки» (slug `ryukzaky`, parent Аксесуари).

- [ ] **Step 5: Prod intake** — repeat Task 11 Step 4 for the 7 rows through the deployed admin (the client's real path; photos upload from the user's machine, `docs/real_products/` is local only).

- [ ] **Step 6: Placeholder deactivation (prod only, admin action)** — `/admin/products`: edit each of MRX-001…008 and switch «Активний» off. Confirm the homepage «Рекомендовані» rail shows the 4 real featured rows and «Новинки» shows real rows only.

- [ ] **Step 7: Prod verification** — rerun the Task 11 Step 5 checklist against prod (feed item count now **0** — every active product is excluded; that is correct until non-branded stock arrives), plus: one PDP image URL is `https://pub-…r2.dev/products/…` and returns 200; one real COD test order end-to-end (the confirmation email still only reaches the Resend owner — TASK-056 item 2 residue, expected).

- [ ] **Step 8: Landmine** — add to `docs/planning/WEEKLY.md` G16 section and to memory: **prod now holds real data; `db:seed` must never target prod again** (the `SEED_ALLOW_REMOTE` escape hatch is retired for prod).

---

### Task 13: Close-out (after merge — CLAUDE.md § Task Completion)

- [ ] Extract ≥ 2 BACKLOG items (🟤, `[2026-08-xx] From: G16 close-out`): (a) `isActive`/`isFeatured` `.default()` under `.partial()` resets on partial PUT; (b) orphaned R2 objects on image removal / no media library; (c) any pair-session finds. Add the R2-URL swap and stock-count rows if not already in TASK-056 (Task 1).
- [ ] Archive this plan → `docs/archive/plans/` (move file **and** move its `docs/README.md` row to Archived Plans with `COMPLETE`), bump index dates.
- [ ] WEEKLY: G16 Summary-Table Status → `✅ PR #N`; Daily-Schedule entry checked; TODO/DONE transition with plan link, summary, key changes; spec `**Status**` → Implemented.
- [ ] Propagation check: `CLAUDE.md` Architecture tree (new `variants/` API route, `ProductImagesSection`/`ProductVariantsSection`, `image-diff.ts`, `excludeFromFeed` in the Google Shopping pattern, `S3_ENDPOINT` in env notes), `docs/README.md`, `.env.example` already done; `docs/ARCHITECTURE.md`/API docs if they list admin routes.
- [ ] Commit docs; capture learnings to memory (R2 addressing result; Zod 4 partial+default; whatever the pair session taught).

---

## Appendix A — Intake data sheet (the 7 rows)

Source: `docs/real_products/` (gitignored). Brand names stripped everywhere; «Всі бірки — присутні» omitted by ruling. `brand` empty, `excludeFromFeed` ON, `comparePrice` empty on every row. Stock is nominal (TASK-056 row 22). Photo numbers are the `photo_N_…jpg` files; upload in the listed order (first = card image, second = hover-swap).

**Shared descriptions**

- Олімпійка (both): shortDesc «Олімпійка на блискавці з лампасами, стоячий комір» · description «Олімпійка на блискавці зі стоячим коміром і контрастними лампасами на рукавах. Матеріал: бавовна / поліестер. Сезон: весна – осінь. Рукави на манжетах, фірмова фурнітура. Розміри S–XL.»
- Светр (all four): shortDesc «В'язаний светр на короткій блискавці, 100% бавовна» · description «В'язаний светр із коміром на короткій блискавці (полузамок). Матеріал: 100% бавовна. Сезон: весна – літо – осінь. Подарункове пакування. Розміри S–XL.»
- Рюкзак: shortDesc «Рюкзак з екошкіри, 45 × 31 × 15 см» · description «Міський рюкзак з екошкіри. Розміри: висота 45 см, ширина 31 см, глибина 15 см. Два відділення на блискавці та одне внутрішнє. Один розмір.»

| SKU     | Name (`name`)                   | slug                        | Category  | Price | styleGroup          | Featured | Колір       | Розмір (stock)    | Stock | Photos (folder → files, in order)                |
| ------- | ------------------------------- | --------------------------- | --------- | ----: | ------------------- | :------: | ----------- | ----------------- | ----: | ------------------------------------------------ |
| MRX-101 | Олімпійка з лампасами, чорна    | olimpiyka-lampasy-chorna    | Олімпійки |  1749 | `olimpiyka-lampasy` |    ✔     | Чорний      | S/M/L/XL (5 each) |    20 | зіп-худі → p4, p2, p6                            |
| MRX-102 | Олімпійка з лампасами, біла     | olimpiyka-lampasy-bila      | Олімпійки |  1749 | `olimpiyka-lampasy` |    ✔     | Білий       | S/M/L/XL (5 each) |    20 | зіп-худі → p1, p5, p3, p6                        |
| MRX-103 | Светр на блискавці, чорний      | svetr-blyskavka-chornyi     | Светри    |  1579 | `svetr-blyskavka`   |    ✔     | Чорний      | S/M/L/XL (5 each) |    20 | полузамок → p4, p7, p8                           |
| MRX-104 | Светр на блискавці, білий       | svetr-blyskavka-bilyi       | Светри    |  1579 | `svetr-blyskavka`   |          | Білий       | S/M/L/XL (5 each) |    20 | полузамок → p1, p7, p8                           |
| MRX-105 | Светр на блискавці, темно-синій | svetr-blyskavka-temno-synii | Светри    |  1579 | `svetr-blyskavka`   |          | Темно-синій | S/M/L/XL (5 each) |    20 | полузамок → p2, p7, p8                           |
| MRX-106 | Светр на блискавці, бежевий     | svetr-blyskavka-bezhevyi    | Светри    |  1579 | `svetr-blyskavka`   |          | Бежевий     | S/M/L/XL (5 each) |    20 | полузамок → p3, p7, p8, p5, p6, p9               |
| MRX-107 | Рюкзак з екошкіри, чорний       | ryukzak-ekoshkira-chornyi   | Рюкзаки   |  1649 | —                   |    ✔     | Чорний      | Один розмір (10)  |    10 | ранець → p1, p2, p3, p4, p5, p6, p7, p8, p9, p10 |

Alt text per image (typed in the uploader's alt field if exposed; otherwise left empty — the
storefront falls back to the product name): «<name> — вид спереду / ззаду / деталь / у групі кольорів».

## Execution Log

_(appended during execution — planning, per-task completion, blockers, pair-session findings)_

- 2026-08-26 — plan written; spec approved; effort revised 4 → 9 SP (Task 1).
- 2026-08-26 — Tasks 1-10 implemented via subagent-driven development, each task reviewed
  individually; Tasks 11-13 (the two pair sessions and close-out) remain outstanding — they need
  the client's R2 credentials, a production deploy, and a merge.
