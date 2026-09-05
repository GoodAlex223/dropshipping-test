# G18 — Guest Order Access & Hardening Plan

**Last Updated**: 2026-09-04
**Task**: G18 (WEEKLY [G18](../WEEKLY.md#g18-guest-order-access--hardening-batch)) · 🔵 BACKLOG [2026-08-07] guest order tracking + 🟤 [2026-08-06] G2 hardening bundle's ownership-check rider (G17 MEDIUM, confirmed 3/3)
**Branch**: `feat/g18-guest-order-access` (from `main` @ `eef2e4e`)
**Status**: Planning — spec approved 2026-09-04, implementation not started
**Spec**: [2026-09-04-g18-guest-order-access-design.md](../../superpowers/specs/2026-09-04-g18-guest-order-access-design.md) — the plan argues from the spec; executors read both.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the confirmation page's order-PII disclosure and give guests a verified way to see an order later — one authorization rule, a signed per-order grant cookie, an order-number + e-mail lookup with a per-order lockout, and a `/track` status page.

**Architecture:** A pure helper (`src/lib/order-access.ts`) owns the rule "owning session, else a valid HMAC grant cookie for this exact order, else nothing". `create-order` and the new `POST /api/orders/lookup` both set the grant on their `NextResponse`; the confirmation page and the new `/track/[orderNumber]` Server Component both read it through `cookies()` and redirect to `/track?order=N` uniformly when the rule fails or the order is absent (no existence oracle). Two additive `Order` columns carry the lockout.

**Tech Stack:** Next.js 14 App Router (RSC + Route Handlers), Prisma 6 / PostgreSQL, Zod, node `crypto` (HMAC-SHA256 + `timingSafeEqual`), next-intl cookie mode (UA + RU), Vitest + RTL, Playwright.

## Global Constraints

- **TDD** — every code task writes the failing test first, runs it red, then implements. Run `npm run test:run` before every commit; `.husky/pre-commit` runs lint-staged only, not the unit suite.
- **Cookie contract (spec §1)**: name `og_<orderNumber>`; value `<expiry unix seconds>.<hex HMAC-SHA256>`; HMAC input `order-grant:<orderNumber>:<expiry>` keyed with `NEXTAUTH_SECRET`; `httpOnly`, `sameSite: "lax"`, `path: "/"`, `maxAge: 86400`, `secure` iff `request.nextUrl.protocol === "https:"`. Routes set it on the `NextResponse`; pages read via `cookies()` from `next/headers` (synchronous on Next 14 — never `await cookies()`).
- **Order-number gate**: `/^ORD-[A-Z0-9]+-[A-Z0-9]{4}$/` after `trim().toUpperCase()`, applied before any cookie name, query or redirect.
- **Lockout (spec §2)**: 5 failures → `lookupLockedUntil = now + 15 min` and the counter resets to 0; success resets both. The increment is atomic (`{ increment: 1 }`) and the lock decision reads the **returned** row, never the pre-read value.
- **Uniform failures**: unknown order number and wrong e-mail are the identical `404 ORDER_NOT_FOUND`; pages redirect identically for absent and unauthorized orders.
- **Coded outcomes**: `code` beside EN prose; clients map through `t.has(key as never) ? t(key as never) : t("fallback")`. No `console.error` in routes (TASK-029).
- **Catalog**: every new `uk.json` key needs an `ru.json` counterpart with the same ICU arguments (the parity test is hard). RU copy is a draft pending client sign-off, like the rest of `ru.json`.
- **E-mail copy** lives in `src/content/emails.ts` (content layer, not the catalog); every interpolated free-text string passes through `escapeHtml`.
- **Route files export only handlers and Next config** — constants live in `src/lib/`, or the Next build's route type-check fails.
- **Dynamic-route params**: Server Components keep Promise-typed `await params` (tolerant on 14, correct on 15+).
- **Strings and locators**: any string change sweeps every E2E locator type; specs that do not run locally run in CI (chromium + webkit).
- **Money**: `formatPrice()` from `src/lib/format.ts` is the only price formatter.
- **Never `cat` `.env`** — it holds live tokens. `NEXTAUTH_SECRET` is exported in this shell (45 chars), so vitest inherits it; tests still set and restore it explicitly.
- **Local DB** is `postgres:5432` (`DATABASE_URL` in `.env`), reachable — `prisma migrate dev` works here (measured in G16). `prisma/seed.ts` is destructive; never point it at prod.
- **Commit style**: conventional commits with scope `g18`; end every message with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File Structure

| File                                                                                                             | Action        | Responsibility                                                                                       |
| ---------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `src/lib/validations/index.ts`                                                                                   | Modify        | `ORDER_NUMBER_PATTERN` + `orderLookupSchema` (shared, zod-only — safe for client bundles)            |
| `src/lib/order-access.ts`                                                                                        | Create        | Grant sign/verify, cookie name/writer, `canAccessOrder` type guard, `emailsMatch`, lockout constants |
| `tests/unit/order-access.test.ts`                                                                                | Create        | Helper contract                                                                                      |
| `prisma/schema.prisma` + `prisma/migrations/*`                                                                   | Modify        | `Order.lookupFailedAttempts`, `Order.lookupLockedUntil`                                              |
| `src/app/api/orders/lookup/route.ts`                                                                             | Create        | `POST` — pair verification, lockout, grant                                                           |
| `tests/unit/orders-lookup-api.test.ts`                                                                           | Create        | Route contract                                                                                       |
| `src/app/api/checkout/create-order/route.ts`                                                                     | Modify        | Set the post-checkout grant on the 200                                                               |
| `tests/unit/checkout-create-order-api.test.ts`                                                                   | Modify        | Assert the grant cookie                                                                              |
| `messages/uk.json`, `messages/ru.json`                                                                           | Modify        | `track` namespace, `footer.links.track`, `checkout.confirmation.trackLink`                           |
| `messages/README.md`                                                                                             | Modify        | RU nuance entry for the new strings                                                                  |
| `tests/unit/i18n-catalogs.test.ts`                                                                               | Modify        | `track.byCode` covers every lookup code                                                              |
| `src/components/common/Footer.tsx` + `tests/unit/footer.test.tsx`                                                | Modify        | «Статус замовлення» link                                                                             |
| `src/app/(shop)/checkout/confirmation/page.tsx`                                                                  | Modify        | Authorization + uniform redirect; `notFound` removed; not-found screen links to `/track`             |
| `src/app/(shop)/track/page.tsx`                                                                                  | Create        | Form page shell (Suspense-wrapped form)                                                              |
| `src/app/(shop)/track/track-form.tsx`                                                                            | Create        | `"use client"` lookup form                                                                           |
| `tests/unit/track-form.test.tsx`                                                                                 | Create        | Form contract (prefill, success nav, coded toasts)                                                   |
| `src/app/(shop)/track/[orderNumber]/page.tsx`                                                                    | Create        | Grant-gated status page (RSC)                                                                        |
| `src/content/emails.ts` + `src/lib/email-templates/order-confirmation.ts` + `tests/unit/email-templates.test.ts` | Modify        | Guest CTA → `/track?order=N`                                                                         |
| `src/app/robots.ts` + `tests/unit/robots.test.ts`                                                                | Modify/Create | Disallow `/track/`                                                                                   |
| `src/app/sitemap.ts`                                                                                             | Modify        | List `/track`                                                                                        |
| `tests/e2e/checkout.spec.ts`                                                                                     | Modify        | Cold-visit redirect + lookup round-trip                                                              |
| `docs/README.md`                                                                                                 | Modify        | Plan index row (this task); archive move at close-out                                                |

---

### Task 1: Order-access helper (grant, cookie, rule)

**Files:**

- Modify: `src/lib/validations/index.ts` (append after `feedbackSchema`)
- Create: `src/lib/order-access.ts`
- Test: `tests/unit/order-access.test.ts`

**Interfaces:**

- Consumes: `NEXTAUTH_SECRET` env; `Session` type from `next-auth` (augmented in `src/lib/auth.ts`: `session.user.id: string`).
- Produces (exact):
  - `ORDER_NUMBER_PATTERN: RegExp` and `orderLookupSchema` from `@/lib/validations`
  - from `@/lib/order-access`: `ORDER_GRANT_TTL_SECONDS = 86400`, `LOOKUP_MAX_FAILURES = 5`, `LOOKUP_LOCK_MS = 900000`, `normalizeOrderNumber(value: string): string`, `isValidOrderNumber(value: string): boolean`, `orderGrantCookieName(orderNumber: string): string`, `createOrderGrant(orderNumber: string, now?: Date): string`, `verifyOrderGrant(orderNumber: string, cookieValue: string | undefined, now?: Date): boolean`, `setOrderGrantCookie(response: NextResponse, orderNumber: string, request: NextRequest): void`, `emailsMatch(stored: string, given: string): boolean`, `canAccessOrder<T extends { orderNumber: string; userId: string | null }>(order: T | null, session: Session | null, cookieValue: string | undefined, now?: Date): order is T`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/order-access.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import {
  ORDER_GRANT_TTL_SECONDS,
  canAccessOrder,
  createOrderGrant,
  emailsMatch,
  isValidOrderNumber,
  normalizeOrderNumber,
  orderGrantCookieName,
  setOrderGrantCookie,
  verifyOrderGrant,
} from "@/lib/order-access";

const originalSecret = process.env.NEXTAUTH_SECRET;
const NOW = new Date("2026-09-04T12:00:00Z");
const ORDER = "ORD-MF2K1X9Q-A7B3";

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-order-grants";
});
afterEach(() => {
  process.env.NEXTAUTH_SECRET = originalSecret;
});

function session(id: string): Session {
  return {
    user: { id, email: "c@example.com", name: null, image: null, role: "CUSTOMER" },
    expires: "",
  } as Session;
}

describe("order number gate", () => {
  it("normalises and accepts the generated shape", () => {
    expect(normalizeOrderNumber("  ord-mf2k1x9q-a7b3 ")).toBe(ORDER);
    expect(isValidOrderNumber(ORDER)).toBe(true);
    expect(isValidOrderNumber("ORD-TEST")).toBe(false); // the unit-test fixture shape is NOT a real order number
  });
  it("rejects lowercase, path-ish, empty and oversized input", () => {
    for (const bad of [
      "ord-mf2k1x9q-a7b3",
      "../ORD-MF2K1X9Q-A7B3",
      "",
      "ORD-MF2K1X9Q-A7B",
      "ORD-MF2K1X9Q-A7B3X",
      "ORD-MF2K1X9Q-A7B3; Path=/",
    ]) {
      expect(isValidOrderNumber(bad)).toBe(false);
    }
  });
  it("derives the cookie name from the order number", () => {
    expect(orderGrantCookieName(ORDER)).toBe(`og_${ORDER}`);
  });
});

describe("createOrderGrant / verifyOrderGrant", () => {
  it("round-trips a fresh grant", () => {
    const grant = createOrderGrant(ORDER, NOW);
    expect(grant).toMatch(/^\d+\.[0-9a-f]{64}$/);
    expect(verifyOrderGrant(ORDER, grant, NOW)).toBe(true);
  });
  it("expires exactly at the TTL", () => {
    const grant = createOrderGrant(ORDER, NOW);
    const justBefore = new Date(NOW.getTime() + (ORDER_GRANT_TTL_SECONDS - 1) * 1000);
    const at = new Date(NOW.getTime() + ORDER_GRANT_TTL_SECONDS * 1000);
    expect(verifyOrderGrant(ORDER, grant, justBefore)).toBe(true);
    expect(verifyOrderGrant(ORDER, grant, at)).toBe(false);
  });
  it("rejects a tampered signature, a tampered expiry, and a grant for another order", () => {
    const grant = createOrderGrant(ORDER, NOW);
    const [exp, sig] = grant.split(".");
    const flipped = (sig[0] === "0" ? "1" : "0") + sig.slice(1);
    expect(verifyOrderGrant(ORDER, `${exp}.${flipped}`, NOW)).toBe(false);
    expect(verifyOrderGrant(ORDER, `${Number(exp) + 3600}.${sig}`, NOW)).toBe(false);
    expect(verifyOrderGrant("ORD-MF2K1X9Q-ZZZZ", grant, NOW)).toBe(false);
  });
  it("rejects malformed values without throwing", () => {
    for (const bad of [undefined, "", "nodot", "abc.def", "123.", ".abc", "123.zz"]) {
      expect(verifyOrderGrant(ORDER, bad, NOW)).toBe(false);
    }
  });
  it("binds the grant to the secret", () => {
    const grant = createOrderGrant(ORDER, NOW);
    process.env.NEXTAUTH_SECRET = "another-secret";
    expect(verifyOrderGrant(ORDER, grant, NOW)).toBe(false);
  });
  it("throws on create and reads as no-grant on verify when the secret is unset", () => {
    const grant = createOrderGrant(ORDER, NOW);
    delete process.env.NEXTAUTH_SECRET;
    expect(() => createOrderGrant(ORDER, NOW)).toThrow(/NEXTAUTH_SECRET/);
    expect(verifyOrderGrant(ORDER, grant, NOW)).toBe(false);
  });
});

describe("setOrderGrantCookie", () => {
  it("sets an httpOnly lax path=/ cookie with the TTL, secure only over https", () => {
    const http = NextResponse.json({});
    setOrderGrantCookie(http, ORDER, new NextRequest("http://localhost:3000/api/orders/lookup"));
    const c = http.cookies.get(`og_${ORDER}`);
    expect(c).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ORDER_GRANT_TTL_SECONDS,
    });
    expect(c?.secure).toBeFalsy();
    expect(verifyOrderGrant(ORDER, c?.value)).toBe(true);

    const https = NextResponse.json({});
    setOrderGrantCookie(
      https,
      ORDER,
      new NextRequest("https://dropshipping-test.vercel.app/api/orders/lookup")
    );
    expect(https.cookies.get(`og_${ORDER}`)?.secure).toBe(true);
  });
});

describe("emailsMatch", () => {
  it("compares case- and whitespace-insensitively without mutating the stored value", () => {
    expect(emailsMatch("Guest@Example.com", "  guest@example.com ")).toBe(true);
    expect(emailsMatch("guest@example.com", "guest@example.co")).toBe(false);
    expect(emailsMatch("guest@example.com", "")).toBe(false);
  });
});

describe("canAccessOrder", () => {
  const order = { orderNumber: ORDER, userId: "user-1" };
  const guest = { orderNumber: ORDER, userId: null };
  it("allows the owning session", () => {
    expect(canAccessOrder(order, session("user-1"), undefined, NOW)).toBe(true);
  });
  it("allows a valid grant, for guests and for someone else's session alike", () => {
    const grant = createOrderGrant(ORDER, NOW);
    expect(canAccessOrder(guest, null, grant, NOW)).toBe(true);
    expect(canAccessOrder(order, session("user-2"), grant, NOW)).toBe(true);
  });
  it("denies a different user's session, a missing grant, and a foreign grant", () => {
    expect(canAccessOrder(order, session("user-2"), undefined, NOW)).toBe(false);
    expect(canAccessOrder(guest, null, undefined, NOW)).toBe(false);
    expect(canAccessOrder(guest, null, createOrderGrant("ORD-MF2K1X9Q-ZZZZ", NOW), NOW)).toBe(
      false
    );
  });
  it("never allows a null order, whatever the session or grant", () => {
    expect(canAccessOrder(null, session("user-1"), createOrderGrant(ORDER, NOW), NOW)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/order-access.test.ts`
Expected: FAIL — `Cannot find module '@/lib/order-access'`.

- [ ] **Step 3: Add the shared pattern + schema to validations**

Append to `src/lib/validations/index.ts` after the `feedbackSchema` block:

```ts
// Guest order access (G18). The pattern is shared between the lookup schema
// (client + server) and src/lib/order-access.ts, which must not be imported
// by client code (it pulls node:crypto).
export const ORDER_NUMBER_PATTERN = /^ORD-[A-Z0-9]+-[A-Z0-9]{4}$/;

export const orderLookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .max(40, "Order number is too long")
    .regex(ORDER_NUMBER_PATTERN, "Invalid order number"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(254, "Email is too long"),
});
```

- [ ] **Step 4: Implement the helper**

```ts
// src/lib/order-access.ts
import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { ORDER_NUMBER_PATTERN } from "@/lib/validations";

/**
 * Guest order access (G18 spec §1–§2).
 *
 * One rule, used by the confirmation page and /track/[orderNumber]: the
 * owning session may see the order; otherwise a valid grant cookie for that
 * exact order number may; otherwise nothing. The grant is a signed, expiring
 * cookie — stateless, one per order — set by create-order (post-checkout) and
 * by the lookup route (after an order-number + e-mail pair verifies).
 */

export const ORDER_GRANT_TTL_SECONDS = 24 * 60 * 60;
export const LOOKUP_MAX_FAILURES = 5;
export const LOOKUP_LOCK_MS = 15 * 60 * 1000;

export function normalizeOrderNumber(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidOrderNumber(value: string): boolean {
  return ORDER_NUMBER_PATTERN.test(value);
}

export function orderGrantCookieName(orderNumber: string): string {
  return `og_${orderNumber}`;
}

function requireSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set — order grants cannot be signed");
  }
  return secret;
}

function sign(orderNumber: string, expiry: number, secret: string): Buffer {
  return crypto
    .createHmac("sha256", secret)
    .update(`order-grant:${orderNumber}:${expiry}`)
    .digest();
}

function nowSeconds(now: Date): number {
  return Math.floor(now.getTime() / 1000);
}

export function createOrderGrant(orderNumber: string, now: Date = new Date()): string {
  const expiry = nowSeconds(now) + ORDER_GRANT_TTL_SECONDS;
  return `${expiry}.${sign(orderNumber, expiry, requireSecret()).toString("hex")}`;
}

/** Never throws — a missing secret or any malformed value reads as "no grant". */
export function verifyOrderGrant(
  orderNumber: string,
  cookieValue: string | undefined,
  now: Date = new Date()
): boolean {
  if (!cookieValue) return false;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return false;
  const dot = cookieValue.indexOf(".");
  if (dot <= 0 || dot === cookieValue.length - 1) return false;
  const expiry = Number(cookieValue.slice(0, dot));
  const givenHex = cookieValue.slice(dot + 1);
  if (!Number.isInteger(expiry) || expiry <= nowSeconds(now)) return false;
  if (!/^[0-9a-f]+$/.test(givenHex)) return false;
  const given = Buffer.from(givenHex, "hex");
  const expected = sign(orderNumber, expiry, secret);
  if (given.length !== expected.length) return false;
  return crypto.timingSafeEqual(given, expected);
}

export function setOrderGrantCookie(
  response: NextResponse,
  orderNumber: string,
  request: NextRequest
): void {
  response.cookies.set(orderGrantCookieName(orderNumber), createOrderGrant(orderNumber), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ORDER_GRANT_TTL_SECONDS,
    // Mirrors NextAuth's useSecureCookies rule: Secure on https (Vercel),
    // plain on CI's http://localhost — WebKit drops Secure cookies there.
    secure: request.nextUrl.protocol === "https:",
  });
}

/**
 * Constant-time e-mail comparison over normalised digests, so differing
 * lengths never short-circuit. create-order stores the address as typed, so
 * both sides are normalised here rather than in the database.
 */
export function emailsMatch(stored: string, given: string): boolean {
  const digest = (v: string) => crypto.createHash("sha256").update(v.trim().toLowerCase()).digest();
  return crypto.timingSafeEqual(digest(stored), digest(given));
}

export function canAccessOrder<T extends { orderNumber: string; userId: string | null }>(
  order: T | null,
  session: Session | null,
  cookieValue: string | undefined,
  now: Date = new Date()
): order is T {
  if (!order) return false;
  if (order.userId && session?.user?.id === order.userId) return true;
  return verifyOrderGrant(order.orderNumber, cookieValue, now);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/unit/order-access.test.ts`
Expected: PASS (all describe blocks green). The installed Zod is **4.3.6** (measured at planning time), which supports `.trim()`, `.toUpperCase()` and `.toLowerCase()` on `z.string()`; the existing `z.string().email("…")` form is what the neighbouring schemas use, so keep it for consistency.

- [ ] **Step 6: Typecheck + commit**

Run: `npm run typecheck && npx vitest run tests/unit/order-access.test.ts tests/unit/newsletter.test.ts`
Expected: PASS.

```bash
git add src/lib/order-access.ts src/lib/validations/index.ts tests/unit/order-access.test.ts
git commit -m "feat(g18): add the order-access helper — signed per-order grant + access rule

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Lockout columns (schema + migration)

**Files:**

- Modify: `prisma/schema.prisma` (model `Order`, after `customerNotes`)
- Create: `prisma/migrations/<timestamp>_add_order_lookup_lockout/migration.sql` (generated)

**Interfaces:**

- Produces: `Order.lookupFailedAttempts: number` (default 0), `Order.lookupLockedUntil: Date | null` on the Prisma client.

- [ ] **Step 1: Add the columns**

In `prisma/schema.prisma`, inside `model Order`, directly after `customerNotes  String?         @db.Text`:

```prisma
  /// G18 guest lookup lockout: wrong-e-mail attempts against this order number.
  lookupFailedAttempts Int       @default(0)
  /// G18: while set and in the future, POST /api/orders/lookup answers 429.
  lookupLockedUntil    DateTime?
```

- [ ] **Step 2: Generate the migration against the local DB**

Run: `npx prisma migrate dev --name add_order_lookup_lockout`
Expected: a new folder `prisma/migrations/<ts>_add_order_lookup_lockout/` whose `migration.sql` contains exactly two `ALTER TABLE "orders" ADD COLUMN` statements (`"lookupFailedAttempts" INTEGER NOT NULL DEFAULT 0`, `"lookupLockedUntil" TIMESTAMP(3)`), and "Your database is now in sync". If the command reports drift or wants to reset, STOP — do not accept a reset (the local DB is fine to reset, but drift means the schema and migrations disagree and that must be understood first).

- [ ] **Step 3: Regenerate the client and typecheck**

Run: `npm run db:generate && npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(g18): add Order lookup lockout columns

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: `POST /api/orders/lookup`

**Files:**

- Create: `src/app/api/orders/lookup/route.ts`
- Test: `tests/unit/orders-lookup-api.test.ts`

**Interfaces:**

- Consumes: `orderLookupSchema`, `LOOKUP_MAX_FAILURES`, `LOOKUP_LOCK_MS`, `emailsMatch`, `setOrderGrantCookie` (Task 1); `prisma.order.findUnique` / `prisma.order.update`; `apiError` / `apiSuccess` from `@/lib/api-utils`.
- Produces: `POST` → `200 { orderNumber }` + grant cookie · `400 { error, code: "VALIDATION_ERROR" }` · `404 { error, code: "ORDER_NOT_FOUND" }` · `429 { error, code: "TOO_MANY_ATTEMPTS", retryAfterSeconds }` + `Retry-After` · `500 { error, code: "LOOKUP_FAILED" }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/orders-lookup-api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { createNextRequest } from "../helpers/api-test-utils";

// api-utils.ts transitively imports next-auth via @/lib/auth — mock to keep
// vitest away from its ESM resolution.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { order: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { POST } from "@/app/api/orders/lookup/route";
import { prisma } from "@/lib/db";
import { verifyOrderGrant, LOOKUP_MAX_FAILURES } from "@/lib/order-access";

const mockFindUnique = vi.mocked(prisma.order.findUnique);
const mockUpdate = vi.mocked(prisma.order.update);
const ORDER = "ORD-MF2K1X9Q-A7B3";
const originalSecret = process.env.NEXTAUTH_SECRET;

function lookup(body: Record<string, unknown>) {
  return createNextRequest({ url: "/api/orders/lookup", method: "POST", body });
}

function storedOrder(
  overrides: Partial<{
    email: string;
    lookupFailedAttempts: number;
    lookupLockedUntil: Date | null;
  }> = {}
) {
  return {
    id: "order-1",
    email: "Guest@Example.com",
    lookupFailedAttempts: 0,
    lookupLockedUntil: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXTAUTH_SECRET = "test-secret-for-order-grants";
  mockUpdate.mockImplementation(
    async (args) =>
      ({ ...storedOrder(), ...(args as { data: Record<string, unknown> }).data }) as never
  );
});
afterEach(() => {
  process.env.NEXTAUTH_SECRET = originalSecret;
});

describe("POST /api/orders/lookup", () => {
  it("returns 400 VALIDATION_ERROR for a malformed order number", async () => {
    const res = await POST(lookup({ orderNumber: "not-an-order", email: "guest@example.com" }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("VALIDATION_ERROR");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 VALIDATION_ERROR for a malformed JSON body, not a 500", async () => {
    const req = new NextRequest("http://localhost:3000/api/orders/lookup", {
      method: "POST",
      body: "{not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 ORDER_NOT_FOUND for an unknown order number", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(lookup({ orderNumber: ORDER, email: "guest@example.com" }));
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("ORDER_NOT_FOUND");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns the identical 404 for a wrong e-mail and increments the failure counter atomically", async () => {
    mockFindUnique.mockResolvedValue(storedOrder() as never);
    mockUpdate.mockResolvedValue({ lookupFailedAttempts: 1 } as never);
    const res = await POST(lookup({ orderNumber: ORDER, email: "wrong@example.com" }));
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("ORDER_NOT_FOUND");
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-1" },
        data: { lookupFailedAttempts: { increment: 1 } },
      })
    );
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("locks the order for 15 minutes on the fifth failure and resets the counter", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T12:00:00Z"));
    try {
      mockFindUnique.mockResolvedValue(
        storedOrder({ lookupFailedAttempts: LOOKUP_MAX_FAILURES - 1 }) as never
      );
      mockUpdate
        .mockResolvedValueOnce({ lookupFailedAttempts: LOOKUP_MAX_FAILURES } as never)
        .mockResolvedValueOnce({} as never);
      const res = await POST(lookup({ orderNumber: ORDER, email: "wrong@example.com" }));
      expect(res.status).toBe(404);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: "order-1" },
          data: {
            lookupFailedAttempts: 0,
            lookupLockedUntil: new Date("2026-09-04T12:15:00Z"),
          },
        })
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns 429 TOO_MANY_ATTEMPTS with Retry-After while locked, even for the right e-mail", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T12:00:00Z"));
    try {
      mockFindUnique.mockResolvedValue(
        storedOrder({ lookupLockedUntil: new Date("2026-09-04T12:10:00Z") }) as never
      );
      const res = await POST(lookup({ orderNumber: ORDER, email: "guest@example.com" }));
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.code).toBe("TOO_MANY_ATTEMPTS");
      expect(json.retryAfterSeconds).toBe(600);
      expect(res.headers.get("retry-after")).toBe("600");
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(res.headers.get("set-cookie")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats an expired lock as no lock", async () => {
    mockFindUnique.mockResolvedValue(
      storedOrder({ lookupLockedUntil: new Date(Date.now() - 1000) }) as never
    );
    const res = await POST(lookup({ orderNumber: ORDER, email: "guest@example.com" }));
    expect(res.status).toBe(200);
  });

  it("returns 200 with the grant cookie on a match, normalising case and whitespace on both sides", async () => {
    mockFindUnique.mockResolvedValue(storedOrder({ lookupFailedAttempts: 2 }) as never);
    const res = await POST(
      lookup({ orderNumber: `  ${ORDER.toLowerCase()} `, email: "  GUEST@example.com " })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orderNumber: ORDER });
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderNumber: ORDER } })
    );
    // counter + lock reset because the stored row had failures
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-1" },
        data: { lookupFailedAttempts: 0, lookupLockedUntil: null },
      })
    );
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(new RegExp(`^og_${ORDER}=`));
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/Path=\//);
    expect(setCookie).toMatch(/Max-Age=86400/);
    expect(setCookie).not.toMatch(/Secure/i); // http test request
    const value = res.cookies.get(`og_${ORDER}`)?.value;
    expect(verifyOrderGrant(ORDER, value)).toBe(true);
  });

  it("skips the reset write when there is nothing to reset", async () => {
    mockFindUnique.mockResolvedValue(storedOrder() as never);
    const res = await POST(lookup({ orderNumber: ORDER, email: "guest@example.com" }));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 LOOKUP_FAILED when the database throws", async () => {
    mockFindUnique.mockRejectedValue(new Error("db down"));
    const res = await POST(lookup({ orderNumber: ORDER, email: "guest@example.com" }));
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe("LOOKUP_FAILED");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/orders-lookup-api.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/orders/lookup/route'`.

- [ ] **Step 3: Implement the route**

```ts
// src/app/api/orders/lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { orderLookupSchema } from "@/lib/validations";
import {
  LOOKUP_LOCK_MS,
  LOOKUP_MAX_FAILURES,
  emailsMatch,
  setOrderGrantCookie,
} from "@/lib/order-access";

// Guest order lookup (G18 spec §2). Public: the order-number + e-mail pair is
// the credential. Unknown number and wrong e-mail answer identically, so the
// route is not an existence oracle; the per-order lockout is the only
// throttle — per-IP limits are a platform decision (prod has no Redis).
export async function POST(request: NextRequest) {
  try {
    // A malformed body is the caller's error, not ours (G20 residue pattern).
    const body = await request.json().catch(() => null);
    const parsed = orderLookupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid lookup data", 400, "VALIDATION_ERROR");
    }
    const { orderNumber, email } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, email: true, lookupFailedAttempts: true, lookupLockedUntil: true },
    });
    if (!order) {
      return apiError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    const now = new Date();
    if (order.lookupLockedUntil && order.lookupLockedUntil > now) {
      const retryAfterSeconds = Math.ceil(
        (order.lookupLockedUntil.getTime() - now.getTime()) / 1000
      );
      return NextResponse.json(
        { error: "Too many attempts", code: "TOO_MANY_ATTEMPTS", retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

    if (!emailsMatch(order.email, email)) {
      // Atomic increment; the lock decision reads the RETURNED count so two
      // concurrent failures cannot both see 4 and neither lock.
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { lookupFailedAttempts: { increment: 1 } },
        select: { lookupFailedAttempts: true },
      });
      if (updated.lookupFailedAttempts >= LOOKUP_MAX_FAILURES) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            lookupFailedAttempts: 0,
            lookupLockedUntil: new Date(now.getTime() + LOOKUP_LOCK_MS),
          },
        });
      }
      return apiError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    if (order.lookupFailedAttempts > 0 || order.lookupLockedUntil) {
      await prisma.order.update({
        where: { id: order.id },
        data: { lookupFailedAttempts: 0, lookupLockedUntil: null },
      });
    }

    const response = apiSuccess({ orderNumber });
    setOrderGrantCookie(response, orderNumber, request);
    return response;
  } catch {
    return apiError("Lookup failed", 500, "LOOKUP_FAILED");
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/orders-lookup-api.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck && npm run lint`
Expected: PASS, 0 warnings.

```bash
git add src/app/api/orders/lookup/route.ts tests/unit/orders-lookup-api.test.ts
git commit -m "feat(g18): add POST /api/orders/lookup — pair verification with per-order lockout

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: create-order sets the post-checkout grant

**Files:**

- Modify: `src/app/api/checkout/create-order/route.ts` (the final `return NextResponse.json({ orderId, orderNumber })`)
- Test: `tests/unit/checkout-create-order-api.test.ts`

**Interfaces:**

- Consumes: `setOrderGrantCookie` (Task 1).
- Produces: the 200 response carries `og_<orderNumber>` — the confirmation page (Task 6) relies on it.

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/checkout-create-order-api.test.ts`, inside the existing top-level `describe`, after the test `"creates a guest COD order with PENDING status and server-computed totals"`. Also add `process.env.NEXTAUTH_SECRET = "test-secret-for-order-grants";` as the first line of the file's existing `beforeEach` (create-order now signs a grant; the shell exports a secret, but the test must not depend on that):

```ts
it("sets the post-checkout grant cookie for the new order (G18 spec §1)", async () => {
  mockTx();
  const res = await POST(
    createNextRequest({ url: "/api/checkout/create-order", method: "POST", body: validBody })
  );
  expect(res.status).toBe(200);
  const cookie = res.cookies.get("og_ORD-TEST");
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 86400 });
  expect(cookie?.value).toMatch(/^\d+\.[0-9a-f]{64}$/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/checkout-create-order-api.test.ts -t "post-checkout grant"`
Expected: FAIL — `cookie` is `undefined`.

- [ ] **Step 3: Set the cookie on the response**

In `src/app/api/checkout/create-order/route.ts` add the import `import { setOrderGrantCookie } from "@/lib/order-access";` and replace the final success return with:

```ts
// The post-checkout one-time grant (G18 spec §1): the browser stores this
// same-origin fetch response's cookie before router.push navigates, so the
// confirmation page can authorize the just-created order with no user
// action. Cold visits later re-verify via /track.
const response = NextResponse.json({
  orderId: order.id,
  orderNumber: order.orderNumber,
});
setOrderGrantCookie(response, order.orderNumber, request);
return response;
```

- [ ] **Step 4: Run the whole file to verify it passes**

Run: `npx vitest run tests/unit/checkout-create-order-api.test.ts`
Expected: PASS — the new test and every existing one (the race test included).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/checkout/create-order/route.ts tests/unit/checkout-create-order-api.test.ts
git commit -m "feat(g18): create-order sets the post-checkout order grant cookie

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Catalog strings (UA + RU), footer link, byCode coverage

**Files:**

- Modify: `messages/uk.json`, `messages/ru.json`, `messages/README.md`
- Modify: `src/components/common/Footer.tsx:14-19` (`shopLinks`)
- Test: `tests/unit/footer.test.tsx`, `tests/unit/i18n-catalogs.test.ts`

**Interfaces:**

- Produces catalog keys (both locales): `track.page.{title,description}`, `track.form.{orderNumberLabel,orderNumberPlaceholder,emailLabel,emailPlaceholder,submit,submitting}`, `track.byCode.{ORDER_NOT_FOUND,TOO_MANY_ATTEMPTS,VALIDATION_ERROR,LOOKUP_FAILED}` (`TOO_MANY_ATTEMPTS` takes ICU `{minutes}`), `track.fallback`, `track.status.{dateLabel,statusLabel,trackingLabel,trackingLink,checkAnother}`, `footer.links.track`, `checkout.confirmation.trackLink`. (Deviation from spec §5, recorded: `track.status.heading` is dropped — the status page reuses `checkout.confirmation.orderNumberLabel`; `LOOKUP_FAILED` is added to `byCode` so the coverage test can assert every code the route emits.)

- [ ] **Step 1: Write the failing tests**

In `tests/unit/footer.test.tsx`, inside `"uses the Ukrainian copyright-row link labels"`, add after the feedback-link assertion:

```ts
expect(screen.getByRole("link", { name: "Статус замовлення" })).toHaveAttribute("href", "/track");
```

In `tests/unit/i18n-catalogs.test.ts`, inside the `"byCode coverage"` describe, after the feedback block:

```ts
it("track.byCode covers every code /api/orders/lookup emits", () => {
  const byCode = uk.track.byCode as Record<string, string>;
  for (const code of [
    "ORDER_NOT_FOUND",
    "TOO_MANY_ATTEMPTS",
    "VALIDATION_ERROR",
    "LOOKUP_FAILED",
  ]) {
    expect(byCode[code]).toBeTruthy();
  }
  expect(uk.track.fallback).toBeTruthy();
});

it("renders the lockout copy with the minutes argument in both locales", () => {
  renderWithIntl(
    createElement(Probe, {
      namespace: "track",
      msgKey: "byCode.TOO_MANY_ATTEMPTS",
      values: { minutes: 15 },
    })
  );
  expect(screen.getByText("Забагато спроб. Спробуйте знову через 15 хв.")).toBeInTheDocument();
  expect((ru.track.byCode as Record<string, string>).TOO_MANY_ATTEMPTS).toContain("{minutes}");
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/footer.test.tsx tests/unit/i18n-catalogs.test.ts`
Expected: FAIL — the footer link is absent; `uk.track` is undefined (TypeScript may also flag the missing key — that is the same failure).

- [ ] **Step 3: Add the keys with a script (keeps both files valid JSON), then format**

Write `/tmp/claude-0/-workspaces-dropshipping/5b8fecf1-79e7-4731-91cf-f5c737c917a1/scratchpad/add-track-keys.mjs`:

```js
import { readFileSync, writeFileSync } from "node:fs";

const uk = {
  page: {
    title: "Статус замовлення",
    description:
      "Введіть номер замовлення та email, який ви вказали при оформленні, щоб переглянути статус і деталі доставки.",
  },
  form: {
    orderNumberLabel: "Номер замовлення",
    orderNumberPlaceholder: "ORD-…",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    submit: "Перевірити",
    submitting: "Перевіряємо…",
  },
  byCode: {
    ORDER_NOT_FOUND:
      "Замовлення з таким номером та email не знайдено. Перевірте дані та спробуйте ще раз.",
    TOO_MANY_ATTEMPTS: "Забагато спроб. Спробуйте знову через {minutes} хв.",
    VALIDATION_ERROR: "Перевірте номер замовлення та email — щось не так.",
    LOOKUP_FAILED: "Не вдалося перевірити замовлення. Спробуйте пізніше.",
  },
  fallback: "Не вдалося перевірити замовлення. Спробуйте пізніше.",
  status: {
    dateLabel: "Дата оформлення",
    statusLabel: "Статус",
    trackingLabel: "Номер відстеження",
    trackingLink: "Відстежити посилку",
    checkAnother: "Перевірити інше замовлення",
  },
};

const ru = {
  page: {
    title: "Статус заказа",
    description:
      "Введите номер заказа и email, указанный при оформлении, чтобы посмотреть статус и детали доставки.",
  },
  form: {
    orderNumberLabel: "Номер заказа",
    orderNumberPlaceholder: "ORD-…",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    submit: "Проверить",
    submitting: "Проверяем…",
  },
  byCode: {
    ORDER_NOT_FOUND:
      "Заказ с таким номером и email не найден. Проверьте данные и попробуйте ещё раз.",
    TOO_MANY_ATTEMPTS: "Слишком много попыток. Попробуйте снова через {minutes} мин.",
    VALIDATION_ERROR: "Проверьте номер заказа и email — что-то не так.",
    LOOKUP_FAILED: "Не удалось проверить заказ. Попробуйте позже.",
  },
  fallback: "Не удалось проверить заказ. Попробуйте позже.",
  status: {
    dateLabel: "Дата оформления",
    statusLabel: "Статус",
    trackingLabel: "Номер отслеживания",
    trackingLink: "Отследить посылку",
    checkAnother: "Проверить другой заказ",
  },
};

function patch(file, track, footerTrack, confirmationTrackLink) {
  const json = JSON.parse(readFileSync(file, "utf8"));
  if (json.track) throw new Error(`${file}: track namespace already exists`);
  json.footer.links.track = footerTrack;
  json.checkout.confirmation.trackLink = confirmationTrackLink;
  json.track = track;
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
}

patch("messages/uk.json", uk, "Статус замовлення", "Перевірити статус замовлення");
patch("messages/ru.json", ru, "Статус заказа", "Проверить статус заказа");
console.log("track keys added to uk.json and ru.json");
```

Run: `node /tmp/claude-0/-workspaces-dropshipping/5b8fecf1-79e7-4731-91cf-f5c737c917a1/scratchpad/add-track-keys.mjs && npx prettier --write messages/uk.json messages/ru.json`
Expected: "track keys added"; `git diff --stat messages/` shows both files changed and nothing but additions (`git diff messages/ | grep '^-' | grep -v '^---'` prints nothing).

- [ ] **Step 4: Add the footer link**

In `src/components/common/Footer.tsx` change `shopLinks` to:

```ts
const shopLinks = [
  { key: "catalog", href: "/products" },
  { key: "categories", href: "/categories" },
  { key: "new", href: "/products?sortBy=createdAt&sortOrder=desc" },
  { key: "track", href: "/track" },
  { key: "feedback", href: "/feedback" },
] as const;
```

- [ ] **Step 5: Record the RU nuance**

Append to the `## RU draft nuances` list in `messages/README.md` (before the file's final line):

```markdown
- **`track.*` (G18, 2026-09-04)** — guest order lookup + status page. Same
  gender resolution as the order-status badges: «Заказ с таким номером … не
  найден» takes masculine agreement because the subject noun is present;
  `TOO_MANY_ATTEMPTS` keeps the `{minutes}` ICU argument in both locales
  («через {minutes} хв.» / «через {minutes} мин.»). Draft, pending the same
  client sign-off as the rest of the RU catalog.
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/footer.test.tsx tests/unit/i18n-catalogs.test.ts`
Expected: PASS — including the pre-existing parity tests (`ru covers every uk key`, `ru reuses every ICU argument`).

- [ ] **Step 7: Commit**

```bash
git add messages/uk.json messages/ru.json messages/README.md src/components/common/Footer.tsx tests/unit/footer.test.tsx tests/unit/i18n-catalogs.test.ts
git commit -m "feat(g18): add the track catalog namespace (UA + RU draft) and the footer link

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Confirmation page — authorization + uniform redirect

**Files:**

- Modify: `src/app/(shop)/checkout/confirmation/page.tsx`

**Interfaces:**

- Consumes: `canAccessOrder`, `isValidOrderNumber`, `normalizeOrderNumber`, `orderGrantCookieName` (Task 1); `checkout.confirmation.trackLink` (Task 5).
- Produces: nothing new; the E2E in Task 10 is the proof. There is no RSC unit render for this page — `getTranslations` throws outside the RSC module graph (Task-4 HomePage precedent) — so the rule itself is unit-covered in Task 1 and the page is E2E-covered.

- [ ] **Step 1: Apply the rule**

Replace the imports `import { notFound } from "next/navigation";` with:

```ts
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  canAccessOrder,
  isValidOrderNumber,
  normalizeOrderNumber,
  orderGrantCookieName,
} from "@/lib/order-access";
```

In `OrderConfirmation`, replace

```ts
if (!order) {
  notFound();
}
```

with

```ts
// G18 spec §1: owning session or a valid grant cookie, else /track with the
// number prefilled. Absent and unauthorized redirect identically — this
// page is not an existence oracle (the former notFound() was one).
// Next 14: cookies() is synchronous (await-style is Next 15 — G3 lesson).
const grant = cookies().get(orderGrantCookieName(orderNumber))?.value;
if (!canAccessOrder(order, session, grant)) {
  redirect(`/track?order=${encodeURIComponent(orderNumber)}`);
}
```

(`canAccessOrder` is a type guard, so `order` is non-null below it and no other line of the component changes.)

In `NoOrderNumber`, after the existing «Продовжити покупки» `<Link>`, add a second action:

```tsx
<p className="mt-4">
  <Link
    href="/track"
    className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
  >
    {t("confirmation.trackLink")}
  </Link>
</p>
```

In `ConfirmationPage`, replace

```ts
  const orderNumber = params.order;

  if (!orderNumber) {
    return <NoOrderNumber />;
  }
```

with

```ts
  // The gate runs before the number reaches a cookie name, a query or a
  // redirect (spec §1). A malformed value is "no order", not a 404.
  const orderNumber = params.order ? normalizeOrderNumber(params.order) : "";

  if (!orderNumber || !isValidOrderNumber(orderNumber)) {
    return <NoOrderNumber />;
  }
```

- [ ] **Step 2: Typecheck, lint, run the unit suite**

Run: `npm run typecheck && npm run lint && npm run test:run`
Expected: PASS. (`notFound` must no longer be imported — lint flags an unused import.)

- [ ] **Step 3: Manual probe against the dev server (rejection first, then render)**

Run `rm -rf .next && npm run dev -- --port 3001` in the foreground of a second shell, then, with a seeded order number from `npx prisma studio` or `psql` (`SELECT "orderNumber" FROM orders LIMIT 1`):

```bash
# cold visit → the body must carry NO order data, and a redirect to /track
curl -s "http://localhost:3001/checkout/confirmation?order=<seeded-number>" | grep -c -E 'Адреса доставки|@example.com'
# expected: 0
curl -s "http://localhost:3001/checkout/confirmation?order=<seeded-number>" | grep -o -E '/track\?order=[A-Z0-9-]+' | head -1
# expected: /track?order=<seeded-number>
# malformed → the not-found screen, never a 500
curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3001/checkout/confirmation?order=../etc"
# expected: 200
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(shop)/checkout/confirmation/page.tsx"
git commit -m "fix(g18): confirmation page authorizes the order before rendering it

Closes the G17 MEDIUM: order PII no longer sits behind the order-number URL
alone. Owning session or grant cookie, else a uniform redirect to /track.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: `/track` form page

**Files:**

- Create: `src/app/(shop)/track/page.tsx`
- Create: `src/app/(shop)/track/track-form.tsx`
- Test: `tests/unit/track-form.test.tsx`

**Interfaces:**

- Consumes: `POST /api/orders/lookup` contract (Task 3); `track.*` catalog keys (Task 5).
- Produces: `TrackForm` (named export, `"use client"`); on success navigates to `/track/<orderNumber>` (Task 8).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/track-form.test.tsx
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const push = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(search),
}));

import { toast } from "sonner";
import { TrackForm } from "@/app/(shop)/track/track-form";

const fetchMock = vi.fn();
const ORDER = "ORD-MF2K1X9Q-A7B3";

beforeEach(() => {
  vi.clearAllMocks();
  search = "";
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function submit(orderNumber: string, email: string) {
  fireEvent.change(screen.getByLabelText("Номер замовлення"), { target: { value: orderNumber } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Перевірити" }));
}

describe("TrackForm", () => {
  it("prefills the order number from ?order=", () => {
    search = `order=${ORDER}`;
    renderWithIntl(<TrackForm />);
    expect(screen.getByLabelText("Номер замовлення")).toHaveValue(ORDER);
  });

  it("posts the pair and navigates to the status page on success", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ orderNumber: ORDER }) });
    renderWithIntl(<TrackForm />);
    submit(ORDER, "guest@example.com");
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/track/${ORDER}`));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/orders/lookup");
    expect(JSON.parse(init.body)).toEqual({ orderNumber: ORDER, email: "guest@example.com" });
  });

  it("maps ORDER_NOT_FOUND to the Ukrainian toast and keeps the form on screen", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ code: "ORDER_NOT_FOUND" }) });
    renderWithIntl(<TrackForm />);
    submit(ORDER, "wrong@example.com");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Замовлення з таким номером та email не знайдено. Перевірте дані та спробуйте ще раз."
      )
    );
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Перевірити" })).toBeInTheDocument();
  });

  it("renders the lockout minutes from retryAfterSeconds", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ code: "TOO_MANY_ATTEMPTS", retryAfterSeconds: 601 }),
    });
    renderWithIntl(<TrackForm />);
    submit(ORDER, "guest@example.com");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Забагато спроб. Спробуйте знову через 11 хв.")
    );
  });

  it("falls back to the generic copy for an unknown code and for a network failure", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ code: "SOMETHING_NEW" }) });
    renderWithIntl(<TrackForm />);
    submit(ORDER, "guest@example.com");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Не вдалося перевірити замовлення. Спробуйте пізніше."
      )
    );
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fireEvent.click(screen.getByRole("button", { name: "Перевірити" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/track-form.test.tsx`
Expected: FAIL — `Cannot find module '@/app/(shop)/track/track-form'`.

- [ ] **Step 3: Implement the form**

```tsx
// src/app/(shop)/track/track-form.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Guest order lookup (G18 spec §4). Mirrors feedback-form.tsx: coded outcomes
// map to catalog copy through the t.has guard; success navigates to the
// grant-gated status page. No honeypot — the route creates nothing and has
// its own per-order lockout.
export function TrackForm() {
  const t = useTranslations("track");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams?.get("order") ?? "");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // data.error is EN API/log text — map the machine code instead.
        const code = data.code as string | undefined;
        const key = code ? `byCode.${code}` : "";
        const minutes = Math.max(1, Math.ceil((Number(data.retryAfterSeconds) || 900) / 60));
        toast.error(key && t.has(key as never) ? t(key as never, { minutes }) : t("fallback"));
        return;
      }

      router.push(`/track/${encodeURIComponent(String(data.orderNumber))}`);
    } catch {
      toast.error(t("fallback"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="track-order-number" className="text-sm font-medium">
          {t("form.orderNumberLabel")}
        </label>
        <Input
          id="track-order-number"
          value={orderNumber}
          required
          maxLength={40}
          autoComplete="off"
          placeholder={t("form.orderNumberPlaceholder")}
          onChange={(e) => setOrderNumber(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="track-email" className="text-sm font-medium">
          {t("form.emailLabel")}
        </label>
        <Input
          id="track-email"
          type="email"
          value={email}
          required
          maxLength={254}
          autoComplete="email"
          placeholder={t("form.emailPlaceholder")}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? t("form.submitting") : t("form.submit")}
      </Button>
    </form>
  );
}
```

```tsx
// src/app/(shop)/track/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { TrackForm } from "./track-form";

// Metadata stays EN like the rest of the SEO layer (BACKLOG'd UA-metadata
// sweep) — the page body is UA/RU via the catalog.
export const metadata: Metadata = {
  title: "Order status",
  description: "Check the status of your Mirox Shop order by order number and e-mail.",
};

export default function TrackPage() {
  const t = useTranslations("track.page");
  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-3">{t("description")}</p>
      <div className="mt-8">
        {/* useSearchParams needs a Suspense boundary on Next 14 or the build fails. */}
        <Suspense fallback={null}>
          <TrackForm />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/track-form.test.tsx`
Expected: PASS (5 tests). Note: `required` on the inputs does not block `fireEvent.click` submission in jsdom because the form's `onSubmit` fires through React's synthetic handler on `submit`, not the native validity check — if the success test times out, replace the click with `fireEvent.submit(screen.getByRole("button").closest("form")!)`.

- [ ] **Step 5: Typecheck, lint, browser sanity, commit**

Run: `npm run typecheck && npm run lint`, then with the dev server up open `http://localhost:3001/track?order=ORD-X` and confirm the field is prefilled and a wrong pair toasts in Ukrainian.

```bash
git add "src/app/(shop)/track/page.tsx" "src/app/(shop)/track/track-form.tsx" tests/unit/track-form.test.tsx
git commit -m "feat(g18): add the /track lookup form

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: `/track/[orderNumber]` status page

**Files:**

- Create: `src/app/(shop)/track/[orderNumber]/page.tsx`

**Interfaces:**

- Consumes: `canAccessOrder`, `isValidOrderNumber`, `normalizeOrderNumber`, `orderGrantCookieName` (Task 1); catalog keys `track.status.*`, `checkout.confirmation.*`, `checkout.summary.qty`, `account.orderStatus.*`, `shipping.*` (Task 5 + existing); `getOrderStatusStyle` from `@/lib/order-status`; `getShippingMethodLabel` from `@/lib/shipping`; `formatPrice`.
- Produces: the page the form (Task 7) navigates to and the E2E (Task 10) asserts on.

- [ ] **Step 1: Implement the page**

```tsx
// src/app/(shop)/track/[orderNumber]/page.tsx
export const dynamic = "force-dynamic";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight, Banknote, Package, Truck } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getShippingMethodLabel } from "@/lib/shipping";
import { getOrderStatusStyle } from "@/lib/order-status";
import {
  canAccessOrder,
  isValidOrderNumber,
  normalizeOrderNumber,
  orderGrantCookieName,
} from "@/lib/order-access";
import { Badge } from "@/components/ui/badge";

interface TrackOrderPageProps {
  params: Promise<{ orderNumber: string }>;
}

// Guest order status (G18 spec §4). Same authorization rule as the
// confirmation page; absent and unauthorized redirect identically to the
// form (no existence oracle). No PurchaseTracker here — the confirmation
// page fires the GA4 purchase once, this page may be visited many times.
export default async function TrackOrderPage({ params }: TrackOrderPageProps) {
  const { orderNumber: raw } = await params;
  const orderNumber = normalizeOrderNumber(raw);
  if (!isValidOrderNumber(orderNumber)) notFound();

  const [session, order] = await Promise.all([
    auth(),
    prisma.order.findUnique({ where: { orderNumber }, include: { items: true } }),
  ]);
  // Next 14: cookies() is synchronous (await-style is Next 15 — G3 lesson).
  const grant = cookies().get(orderGrantCookieName(orderNumber))?.value;
  if (!canAccessOrder(order, session, grant)) {
    redirect(`/track?order=${encodeURIComponent(orderNumber)}`);
  }

  const t = await getTranslations("track.status");
  const tCheckout = await getTranslations("checkout");
  const tAccount = await getTranslations("account");
  const tShipping = await getTranslations("shipping");
  const format = await getFormatter();

  const statusLabel = tAccount.has(`orderStatus.${order.status}` as never)
    ? tAccount(`orderStatus.${order.status}` as never)
    : order.status;

  const shippingAddress = order.shippingAddress as {
    name: string;
    company?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode?: string;
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            {tCheckout("confirmation.orderNumberLabel")}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">{order.orderNumber}</h1>
          <div className="mt-4 flex flex-col items-center gap-2">
            <Badge variant="secondary" className={`${getOrderStatusStyle(order.status)} text-sm`}>
              {statusLabel}
            </Badge>
            <p className="text-muted-foreground text-sm">
              {t("dateLabel")}:{" "}
              {format.dateTime(order.createdAt, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {order.trackingNumber && (
          <div className="bg-card border-border mt-8 rounded-[20px] border p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <Truck className="h-4 w-4" />
              {t("trackingLabel")}
            </h2>
            <p className="mt-2 font-mono text-sm">{order.trackingNumber}</p>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm underline underline-offset-4"
              >
                {t("trackingLink")}
                <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        <div className="bg-card border-border mt-6 rounded-[20px] border p-7">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Package className="h-5 w-5" />
            {tCheckout("confirmation.detailsHeading")}
          </h2>

          <div className="mt-6 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-bold">{item.productName}</p>
                  {item.variantInfo && (
                    <p className="text-muted-foreground text-sm">{item.variantInfo}</p>
                  )}
                  <p className="text-muted-foreground text-sm">
                    {tCheckout("summary.qty", { count: item.quantity })} ×{" "}
                    {formatPrice(Number(item.unitPrice))}
                  </p>
                </div>
                <p className="font-bold whitespace-nowrap">
                  {formatPrice(Number(item.totalPrice))}
                </p>
              </div>
            ))}
          </div>

          <div className="border-border mt-6 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {tCheckout("confirmation.subtotalLabel")}
              </span>
              <span className="font-bold">{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {tCheckout("confirmation.shippingLabel")}
              </span>
              <span className="font-bold">{formatPrice(Number(order.shippingCost))}</span>
            </div>
            <div className="mt-1 flex justify-between text-base">
              <span className="font-bold">{tCheckout("confirmation.totalLabel")}</span>
              <span className="font-extrabold">{formatPrice(Number(order.total))}</span>
            </div>
          </div>

          <div className="border-border mt-6 border-t pt-4">
            <h3 className="mb-2 flex items-center gap-2 font-bold">
              <Banknote className="h-4 w-4" />
              {tCheckout("confirmation.paymentLabel")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {order.paymentMethod === "cod"
                ? tCheckout("confirmation.paymentCod")
                : tCheckout("confirmation.paymentCard")}
            </p>
          </div>

          <div className="border-border mt-6 border-t pt-4">
            <h3 className="mb-2 font-bold">{tCheckout("confirmation.addressHeading")}</h3>
            <p className="text-muted-foreground text-sm">
              {shippingAddress.name}
              {shippingAddress.company && (
                <>
                  <br />
                  {shippingAddress.company}
                </>
              )}
              <br />
              {shippingAddress.line1}
              {shippingAddress.line2 && (
                <>
                  <br />
                  {shippingAddress.line2}
                </>
              )}
              <br />
              {shippingAddress.city}
              {shippingAddress.state && `, ${shippingAddress.state}`}
              {shippingAddress.postalCode && ` ${shippingAddress.postalCode}`}
            </p>
          </div>

          {order.shippingMethod && (
            <div className="border-border mt-6 border-t pt-4">
              <h3 className="mb-2 font-bold">{tCheckout("confirmation.methodHeading")}</h3>
              <p className="text-muted-foreground text-sm">
                {tShipping.has(order.shippingMethod as never)
                  ? tShipping(order.shippingMethod as never)
                  : getShippingMethodLabel(order.shippingMethod)}
              </p>
            </div>
          )}

          {order.customerNotes && (
            <div className="border-border mt-6 border-t pt-4">
              <h3 className="mb-2 font-bold">{tCheckout("confirmation.notesHeading")}</h3>
              <p className="text-muted-foreground text-sm">{order.customerNotes}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-7 py-4 text-[13px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5]"
          >
            {tCheckout("confirmation.continueShopping")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/track"
            className="border-border-strong hover:border-muted-foreground inline-flex items-center justify-center rounded-[10px] border px-7 py-4 text-[13px] font-bold transition-colors"
          >
            {t("checkAnother")}
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS. If `getFormatter` is not resolvable from `next-intl/server` in this version, use `new Intl.DateTimeFormat("uk-UA", { year: "numeric", month: "long", day: "numeric" }).format(order.createdAt)` instead — the planning session verified `getFormatter` is exported by the installed next-intl's `server/react-server` types.

- [ ] **Step 3: Manual probe (rejection first)**

With the dev server up and a seeded order number `N` whose stored e-mail you know:

```bash
# cold → redirect to the form, no order data in the body
curl -s "http://localhost:3001/track/N" | grep -c 'Адреса доставки'          # expected: 0
# malformed segment → 404, not 500
curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3001/track/nope"   # expected: 404
# verified → 200 + grant, then the status page renders
curl -s -c /tmp/claude-0/-workspaces-dropshipping/5b8fecf1-79e7-4731-91cf-f5c737c917a1/scratchpad/jar.txt -H 'Content-Type: application/json' \
  -d '{"orderNumber":"N","email":"<stored e-mail>"}' http://localhost:3001/api/orders/lookup
curl -s -b /tmp/claude-0/-workspaces-dropshipping/5b8fecf1-79e7-4731-91cf-f5c737c917a1/scratchpad/jar.txt "http://localhost:3001/track/N" | grep -c 'Адреса доставки'   # expected: 1
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(shop)/track/[orderNumber]/page.tsx"
git commit -m "feat(g18): add the grant-gated /track/[orderNumber] status page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Guest CTA in the order e-mail, robots, sitemap

**Files:**

- Modify: `src/content/emails.ts` (`order` block, after `cta`)
- Modify: `src/lib/email-templates/order-confirmation.ts` (`contactPanel`)
- Modify: `src/app/robots.ts`, `src/app/sitemap.ts`
- Test: `tests/unit/email-templates.test.ts`; Create: `tests/unit/robots.test.ts`

**Interfaces:**

- Produces: `emails.order.guestCta: string`; the guest e-mail links to `${NEXT_PUBLIC_APP_URL}/track?order=<N>`; `robots()` disallows `/track/`; the sitemap lists `/track`.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/email-templates.test.ts`, replace the two CTA tests with:

```ts
it("gives guest orders the status CTA instead of the account CTA", () => {
  const html = generateOrderConfirmationHtml({ ...baseOrder, hasAccount: false });
  expect(html).not.toContain("ІСТОРІЯ ЗАМОВЛЕНЬ");
  expect(html).not.toContain("/account/orders");
  expect(html).toContain("СТАТУС ЗАМОВЛЕННЯ");
  expect(html).toContain("https://test.example.com/track?order=ORD-20260810-001");
});

it("shows the account CTA, not the status CTA, for signed-in customers", () => {
  const html = generateOrderConfirmationHtml({ ...baseOrder, hasAccount: true });
  expect(html).toContain("ІСТОРІЯ ЗАМОВЛЕНЬ");
  expect(html).toContain("https://test.example.com/account/orders");
  expect(html).not.toContain("/track?order=");
});
```

Create `tests/unit/robots.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import robots from "@/app/robots";

describe("robots.txt", () => {
  it("keeps the /track form crawlable but hides the per-order status pages", () => {
    const { rules } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    expect(disallow).toContain("/track/");
    expect(disallow).not.toContain("/track");
    expect(disallow).toContain("/checkout/");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/email-templates.test.ts tests/unit/robots.test.ts`
Expected: FAIL — no «СТАТУС ЗАМОВЛЕННЯ» in the guest HTML; `/track/` not in `disallow`.

- [ ] **Step 3: Implement**

`src/content/emails.ts`, after `cta: "ІСТОРІЯ ЗАМОВЛЕНЬ",`:

```ts
    /** Guest orders have no account page — this CTA opens /track prefilled (G18). */
    guestCta: "СТАТУС ЗАМОВЛЕННЯ",
```

`src/lib/email-templates/order-confirmation.ts`, replace the `contactPanel` block with:

```ts
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
// Signed-in customers get the account page; guests get the grant-gated
// status page with the number prefilled (G18) — one button, never both.
const ctaButton = data.hasAccount
  ? renderButton(`${appUrl}/account/orders`, t.cta)
  : renderButton(`${appUrl}/track?order=${encodeURIComponent(data.orderNumber)}`, t.guestCta);

const contactPanel = renderPanel(
  `<p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.muted};">${t.contactHeading}</p>
    <p style="margin: 0 0 20px 0;">${contactLinks}</p>
    ${ctaButton}`,
  { center: true }
);
```

`src/app/robots.ts`: change the `disallow` array to `["/api/", "/admin/", "/checkout/", "/cart", "/account/", "/track/", "/_next/"]`.

`src/app/sitemap.ts`: after the `/feedback` entry add

```ts
    {
      url: `${baseUrl}/track`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/email-templates.test.ts tests/unit/robots.test.ts tests/unit/seo.test.ts`
Expected: PASS — including the existing escaping and tax-row tests.

- [ ] **Step 5: Commit**

```bash
git add src/content/emails.ts src/lib/email-templates/order-confirmation.ts src/app/robots.ts src/app/sitemap.ts tests/unit/email-templates.test.ts tests/unit/robots.test.ts
git commit -m "feat(g18): guest status CTA in the order e-mail; hide /track/ pages from crawlers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: E2E — the post-checkout grant, the cold-visit redirect, the lookup round-trip

**Files:**

- Modify: `tests/e2e/checkout.spec.ts` (extend `"guest can place a COD order end-to-end"`)

**Interfaces:**

- Consumes: everything above, running end to end against the dev server on port 3001 (Playwright's `webServer` starts it; `reuseExistingServer` locally).

- [ ] **Step 1: Extend the existing test**

Append inside `"guest can place a COD order end-to-end"`, after the final `оплата при отриманні у відділенні` assertion:

```ts
// --- G18: the grant cookie carried the confirmation; a cold visit must not.
const confirmationUrl = page.url();
const orderNumber = new URL(confirmationUrl).searchParams.get("order")!;
expect(orderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]{4}$/);

await page.context().clearCookies();
await page.goto(confirmationUrl);
await page.waitForURL(/\/track\?order=ORD-/, { timeout: 15000 });
// Verify the rejection, not just the redirect: no order data reached the page.
await expect(page.getByText(/адреса доставки/i)).toHaveCount(0);
await expect(page.getByLabel(/^номер замовлення$/i)).toHaveValue(orderNumber);

// Wrong e-mail → uniform not-found copy, still on the form.
await page.getByLabel(/^email$/i).fill("someone-else@example.com");
await page.getByRole("button", { name: /^перевірити$/i }).click();
await expect(page.getByText(/з таким номером та email не знайдено/i)).toBeVisible();
await expect(page).toHaveURL(/\/track\?order=/);

// Right e-mail → the status page, PENDING in Ukrainian, the number on screen.
await page.getByLabel(/^email$/i).fill("guest-e2e@example.com");
await page.getByRole("button", { name: /^перевірити$/i }).click();
await page.waitForURL(new RegExp(`/track/${orderNumber}$`), { timeout: 15000 });
await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();
await expect(page.getByText("Очікує підтвердження")).toBeVisible();
await expect(page.getByText(/адреса доставки/i)).toBeVisible();
```

- [ ] **Step 2: Run it locally on chromium (foreground)**

Run: `rm -rf .next && npx playwright test tests/e2e/checkout.spec.ts --project=chromium`
Expected: 3 passed. If the cold `goto` does not reach `/track` within the timeout, check the confirmation page's redirect in the browser first (`redirect()` inside the Suspense child streams a meta-refresh; Playwright follows it) before touching the test.

- [ ] **Step 3: Run the full unit suite + gates**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run format:check && node scripts/i18n-byte-diff.mjs`
Expected: all PASS; the byte-diff reports no removed Cyrillic fragments missing from `uk.json` (this task removes none).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/checkout.spec.ts
git commit -m "test(g18): E2E covers the grant, the cold-visit redirect and the lookup round-trip

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Visual gate, PR, CI, merge

**Files:**

- Modify: this plan (Implementation Log), `docs/README.md` (plan status stays IN PROGRESS until close-out)

- [ ] **Step 1: Visual gate** — REQUIRED: screenshots delivered as ONE artifact URL per round (memory: chat-inline images never reach the user). Capture with the dev server up (`rm -rf .next` first — stale `.next` serves old CSS): `/track` empty, `/track?order=<N>` prefilled, the wrong-e-mail toast, and `/track/<N>` after a verified lookup; desktop 1280×800 and mobile 390×844. Build the artifact via the `artifact-design` skill, publish, hand the user the link, wait for sign-off. Fix and re-round on any ruling.

- [ ] **Step 2: Finish the branch** — REQUIRED SUB-SKILL `superpowers:finishing-a-development-branch`. Before `gh pr create`: `npm run lint && npm run typecheck && npm run format:check && npm run test:run` green; push; PR against `main` with a body that lists the six spec decisions, the two schema columns, the uniform-redirect self-review fix, the deviations recorded in Task 5, and links to the spec + this plan (percent-encode `(shop)` and `[orderNumber]` in permalinks — the remote is `GoodAlex223/dropshipping-test`, not the directory name; `curl` each link before posting). End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 3: Review + CI** — run `/code-review` on the PR; list every sub-threshold finding in chat, rule on each (memory: an 80 gate is a 100 gate). Then query the check-runs that actually executed (`gh pr checks`) — lint, typecheck, unit, build, E2E chromium + webkit — not the badge. The E2E job runs `prisma migrate deploy` + seed, which exercises the new migration.

- [ ] **Step 4: Merge only on the user's word.** Then verify the deploy is real: the Vercel Git-integration build log shows `<ts>_add_order_lookup_lockout` applied; on production, with the owner's own test order (number + the e-mail it was placed with):

```bash
PROD=https://dropshipping-test.vercel.app
# rejection first
curl -s -o /dev/null -w '%{http_code}\n' -H 'Content-Type: application/json' -d '{"orderNumber":"<N>","email":"wrong@example.com"}' $PROD/api/orders/lookup   # 404
curl -s "$PROD/checkout/confirmation?order=<N>" | grep -c 'Адреса доставки'                                                                       # 0
# then the grant, with Secure on https
curl -s -D - -o /dev/null -H 'Content-Type: application/json' -d '{"orderNumber":"<N>","email":"<real>"}' $PROD/api/orders/lookup | grep -i '^set-cookie'  # og_<N>=…; HttpOnly; Secure; SameSite=Lax
```

Record the results in the Implementation Log.

---

### Task 12: Close-out (CLAUDE.md § Task Completion)

- [ ] **Extract** → BACKLOG.md (🟤, `### [YYYY-MM-DD] From: G18 close-out`): (1) claim-by-e-mail rider — "link `userId: null` orders on registration **only after** the registering address is verified" `[relates-to: G18 Decision 3]`; (2) the per-IP throttle entry from G17 gains a pointer that the lookup route now exists and is a second consumer; (3) anything the review rounds surfaced. Minimum 2 (this plan's § Future Improvements seeds them).
- [ ] **Deploy-tied work** → the post-deploy rejection/Secure check (Task 11 step 4) as an `AFTER` box (0.25 SP, origin G18) in TODO.md § Next Deploy Window (create the section if absent — WEEKLY has no Deploy Window group this week; G19's smoke script may absorb it).
- [ ] **Archive** the plan → `docs/archive/plans/` — **four edits** (G17 lesson): move the file, move its `docs/README.md` row to the archive table, repoint every inbound link (`grep -rn '2026-09-04_g18' docs`), fix the moved file's own relative links: `../WEEKLY.md` → `../../planning/WEEKLY.md`; the spec link `../../superpowers/specs/…` stays as is, because `docs/planning/plans/` and `docs/archive/plans/` sit at the same depth below `docs/`. Run the docs-freshness test after the move — it resolves every relative link.
- [ ] **Transition** → DONE.md entry (plan link, summary, key changes); WEEKLY G18 Summary-Table status `✅ PR #N` + the Tue/Wed Daily-Schedule entries; spec `**Status**` → Implemented with the merge SHA read from `git rev-parse` (never composed).
- [ ] **Propagate** — enumerate: `find . -name CLAUDE.md -not -path './node_modules/*'` + `docs/planning/` + `docs/README.md`. Root `CLAUDE.md`: architecture tree (`(shop)/track/`, `api/orders/lookup/`, `lib/order-access.ts`, `tests/unit/{order-access,orders-lookup-api,track-form,robots}.test.ts`), the **Auth flow** paragraph (confirmation page + `/track/[orderNumber]` are grant-or-session gated), the **Coded API outcomes** pattern (add `api/orders/lookup` + `track.byCode`), a new **Guest order access** pattern line; `src/components/CLAUDE.md` Footer line (track link); `messages/README.md` already updated in Task 5. Late learnings must reach LIVE docs, not just the log.
- [ ] **Commit** docs; **capture learnings** → memory (foreground updater): anything durable — e.g. the RSC-page-cannot-be-unit-rendered constraint pushing logic into pure helpers, the existence-oracle self-review catch.

---

## Implementation Log

### [2026-09-04 17:40] — PHASE: Planning

- Spec approved by the user 2026-09-04 (six rulings, section-by-section); plan written from it.
- Self-review corrections folded in: the spec's "same posture as the newsletter helper" claim was wrong — `generateUnsubscribeToken` falls back to `"development-secret"` when `NEXTAUTH_SECRET` is unset, it does not throw; the grant helper **throws** (a forgeable grant is worse than a 500), and `src/lib/auth.ts` already refuses to boot without the secret, so production cannot reach that path. Spec parenthetical corrected in the same commit as this plan.
- Deviations from spec §5 recorded in Task 5 (no `track.status.heading`; `LOOKUP_FAILED` added to `byCode`).
- Risks carried: `Secure` behind Vercel's proxy verified only post-deploy (Task 11 step 4); the RSC pages have no unit render, so the rule lives in a pure helper and the pages are E2E-covered.

---

## Future Improvements

| Idea                                                                                 | Rationale                                                                                   | Effort | Priority |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------ | -------- |
| Claim guest orders on registration once e-mail verification exists                   | Decision 3 — auto-linking on an unverified address is an order-history takeover             | M      | M        |
| Per-IP / per-e-mail throttle primitive (Upstash via Marketplace or Vercel WAF rules) | G17 🟤 entry; the lookup route is now a second unauthenticated consumer beside create-order | M      | H        |
| Single JSON-array grant cookie if per-order cookies ever accumulate                  | Spec risk: bounded by TTL only today                                                        | S      | L        |
| Phone as an alternative lookup factor                                                | Out of scope by decision; COD customers are phone-first                                     | S      | L        |
