# G5 Transactional Emails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild both transactional emails (order confirmation, newsletter double-opt-in) as Ukrainian, dark-Mirox-styled templates on a shared shell, route the brand through `BRAND_NAME` at all three `|| "Store"` sites, and harden the order email (escaping, guest-aware CTA).

**Architecture:** New `src/content/emails.ts` copy module (imports only `brand.ts` — lucide-free) + shared table-based dark shell in `src/lib/email-templates/layout.ts`; the order generator moves out of `email.ts` into `email-templates/order-confirmation.ts`; `email.ts` slims to Resend wiring. The socials array relocates `site.ts` → `brand.ts` (pure strings) so emails get contact hrefs without dragging `lucide-react` into API-route bundles.

**Tech Stack:** TypeScript strict, Vitest, Resend, email-safe HTML (tables + inline styles).

**Spec:** `docs/superpowers/specs/2026-08-10-g5-transactional-emails-design.md` (approved). Task journal/progress log lives in this file — append progress notes under each task as you go.

## Global Constraints

- Exact UA copy from spec §5/§6 — copy strings verbatim from the code blocks in this plan; do not paraphrase.
- Email HTML rules (spec §4): tables + stacked blocks only, inline styles everywhere, `bgcolor` attributes alongside CSS, no `<svg>`, no grid/flex, `<html lang="uk">`, 600px column.
- Colors: bg `#000000`, panel `#0d0d0d`, border `#1a1a1a`, text `#ffffff`, muted `#a3a3a3`, faint `#737373`, success `#4ade80`. CTA: white bg, black bold label; CTA copy stored pre-uppercased (house precedent: `checkout.payment.submit`).
- `formatPrice()` from `@/lib/format` is the only money formatter. `escapeHtml` from `@/lib/newsletter` wraps EVERY interpolated user/DB string.
- `src/content/brand.ts` must remain import-free. `src/content/emails.ts` may import ONLY `./brand`.
- Brand resolves at render time via `getStoreName()` — never a module-scope const (spec §7).
- Env-dependent tests: restore must be delete-aware — `process.env.X = undefined` stores the literal string `"undefined"`.
- Prettier (double quotes, 100 chars) auto-runs via pre-commit hook; TS strict; `@/*` → `./src/*`.
- Commits: conventional style, end message with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Full verification before finishing: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build` (do NOT judge visuals from a local build — container `NODE_ENV` issue corrupts local prod CSS; irrelevant to email HTML but the rule stands).

---

### Task 1: Relocate socials to brand.ts (pure refactor)

**Files:**

- Modify: `src/content/brand.ts`
- Modify: `src/content/site.ts:12-22` (interface) and `:84-99` (socials array)

**Interfaces:**

- Consumes: nothing new.
- Produces: `SOCIALS: SocialLink[]` and `interface SocialLink` exported from `@/content/brand`; `site.socials` and `type SocialLink` re-exported from `@/content/site` unchanged for existing consumers (`SocialLinks.tsx`, `checkout.ts`).

- [ ] **Step 1: Add SocialLink + SOCIALS to brand.ts**

Append to `src/content/brand.ts` (no imports — the file's header rule):

```ts
/** Social link data. Icon components stay in the UI layer (SocialLinks.tsx). */
export interface SocialLink {
  platform: "instagram" | "tiktok" | "telegram";
  label: string;
  href: string;
  /**
   * CLIENT-SUPPLIED. Real follower count, or null for no counter.
   * Never fabricate this — TODO.md AC requires counters only when real numbers
   * are supplied, and invented social proof is out of scope per TASK-051.
   */
  followers: number | null;
}

/**
 * CLIENT-SUPPLIED. Placeholder handles until the client confirms real URLs.
 * Relocated from site.ts (G5) so email templates can consume the hrefs
 * without dragging lucide-react into API-route bundles.
 */
export const SOCIALS: SocialLink[] = [
  {
    platform: "instagram",
    label: "Instagram",
    href: "https://instagram.com/mirox_shop",
    followers: null,
  },
  {
    platform: "tiktok",
    label: "TikTok",
    href: "https://tiktok.com/@mirox_shop",
    followers: null,
  },
  { platform: "telegram", label: "Telegram", href: "https://t.me/mirox_shop", followers: null },
];
```

- [ ] **Step 2: Point site.ts at the relocated data**

In `src/content/site.ts`:

1. Change the import line to `import { BRAND_NAME, BRAND_TAGLINE, SOCIALS } from "./brand";`
2. Delete the whole `export interface SocialLink { … }` block (lines 12–22) and add directly below the imports: `export type { SocialLink } from "./brand";`
3. Replace the whole inline socials array (`socials: [ … ] as SocialLink[],`) with:

```ts
  /** CLIENT-SUPPLIED placeholder handles — data lives in brand.ts since G5. */
  socials: SOCIALS,
```

Keep the JSDoc comment that sat above the old array only if it isn't now duplicated by brand.ts (it is — drop it, the one-liner above replaces it).

- [ ] **Step 3: Verify — typecheck + affected existing tests**

Run: `npm run typecheck && npx vitest run tests/unit/social-links.test.tsx tests/unit/footer.test.tsx tests/unit/content.test.ts`
Expected: PASS (pure relocation; `SocialLinks.tsx` still imports `{ site, type SocialLink } from "@/content/site"`).

- [ ] **Step 4: Commit**

```bash
git add src/content/brand.ts src/content/site.ts
git commit -m "refactor(g5): relocate socials data to brand.ts (lucide-free for email use)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: content/emails.ts — UA copy + render-time brand

**Files:**

- Create: `src/content/emails.ts`
- Create: `tests/unit/email-templates.test.ts` (first describe blocks)

**Interfaces:**

- Consumes: `BRAND_NAME`, `SOCIALS` from `@/content/brand` (Task 1).
- Produces: `getStoreName(): string`; `emails` object with `order.{subject(orderNumber: string), title, heading, thanks, orderNumberLabel, qty(n: number), subtotalLabel, shippingLabel, taxLabel, totalLabel, addressHeading, methodHeading, contactHeading, cta, contacts}`, `newsletter.{subject(), title, heading, introPrefix, body, cta, safetyTitle, safetyText, unsubscribe}`, `footer.rights`. Tasks 3–6 import these exact names.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/email-templates.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({ emails: { send: sendMock } })),
}));

import { getStoreName, emails } from "@/content/emails";

const originalEnv = { ...process.env };

function restoreEnvVar(key: string) {
  // Assigning undefined would store the literal string "undefined".
  if (originalEnv[key] === undefined) delete process.env[key];
  else process.env[key] = originalEnv[key];
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_STORE_NAME;
  delete process.env.RESEND_API_KEY;
  process.env.NEXT_PUBLIC_APP_URL = "https://test.example.com";
});

afterEach(() => {
  restoreEnvVar("NEXT_PUBLIC_STORE_NAME");
  restoreEnvVar("RESEND_API_KEY");
  restoreEnvVar("NEXT_PUBLIC_APP_URL");
});

// ---------------------------------------------------------------------------
// content/emails.ts
// ---------------------------------------------------------------------------

describe("getStoreName", () => {
  it("falls back to BRAND_NAME when NEXT_PUBLIC_STORE_NAME is unset", () => {
    expect(getStoreName()).toBe("Mirox Shop");
  });

  it("prefers NEXT_PUBLIC_STORE_NAME when set (read at call time, not import time)", () => {
    process.env.NEXT_PUBLIC_STORE_NAME = "Custom Brand";
    expect(getStoreName()).toBe("Custom Brand");
  });
});

describe("emails content module", () => {
  it("builds the UA order subject with the brand", () => {
    expect(emails.order.subject("ORD-1")).toBe("Замовлення ORD-1 прийнято — Mirox Shop");
  });

  it("builds the UA newsletter subject with the brand", () => {
    expect(emails.newsletter.subject()).toBe("Підтвердіть підписку на розсилку Mirox Shop");
  });

  it("stores pre-uppercased CTA labels (house checkout precedent)", () => {
    expect(emails.order.cta).toBe("ІСТОРІЯ ЗАМОВЛЕНЬ");
    expect(emails.newsletter.cta).toBe("ПІДТВЕРДИТИ ПІДПИСКУ");
  });

  it("exposes only instagram and telegram as order-email contacts", () => {
    expect(emails.order.contacts.map((s) => s.platform)).toEqual(["instagram", "telegram"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: FAIL — cannot resolve `@/content/emails`.

- [ ] **Step 3: Implement the module**

Create `src/content/emails.ts`:

```ts
import { BRAND_NAME, SOCIALS } from "./brand";

/**
 * Transactional email copy (spec 2026-08-10-g5-transactional-emails-design.md
 * §5/§6). Single extraction point for TASK-039 i18n — plain typed strings.
 *
 * MUST stay lucide-free: this module is bundled into API routes via
 * src/lib/email.ts, and importing ./site would drag lucide-react along.
 * Only ./brand is allowed here.
 */

/**
 * Render-time brand resolution (spec §7): a module-scope const would freeze
 * the env value at import and break env-dependent tests.
 */
export function getStoreName(): string {
  return process.env.NEXT_PUBLIC_STORE_NAME || BRAND_NAME;
}

export const emails = {
  order: {
    subject: (orderNumber: string) => `Замовлення ${orderNumber} прийнято — ${getStoreName()}`,
    /** <title> tag — plain form, no exclamation. */
    title: "Замовлення прийнято",
    heading: "Замовлення прийнято!",
    thanks: "Дякуємо за замовлення!",
    orderNumberLabel: "Замовлення №",
    /** «× 2» — quantity line under each item. */
    qty: (n: number) => `× ${n}`,
    subtotalLabel: "Товари",
    shippingLabel: "Доставка",
    /** Rendered only when tax > 0 (COD is always 0; spec §5). */
    taxLabel: "Податок",
    totalLabel: "До сплати",
    addressHeading: "Адреса доставки",
    methodHeading: "Спосіб доставки",
    contactHeading: "Питання щодо замовлення? Напишіть нам:",
    /** Pre-uppercased like checkout.payment.submit. */
    cta: "ІСТОРІЯ ЗАМОВЛЕНЬ",
    /** Manager channels for the contact block — no WhatsApp (checkout.ts precedent: null until client supplies). */
    contacts: SOCIALS.filter((s) => s.platform === "instagram" || s.platform === "telegram"),
  },
  newsletter: {
    subject: () => `Підтвердіть підписку на розсилку ${getStoreName()}`,
    title: "Підтвердіть підписку",
    heading: "Підтвердіть підписку",
    /** Rendered as `${introPrefix} ${brand}: <strong>{escaped email}</strong>` */
    introPrefix: "Ви залишили цю адресу для підписки на розсилку",
    body: "Підтвердіть підписку — і ми надсилатимемо новинки та ексклюзивні пропозиції.",
    cta: "ПІДТВЕРДИТИ ПІДПИСКУ",
    safetyTitle: "Не запитували підписку?",
    safetyText: "Просто проігноруйте цей лист. Посилання дійсне 24 години.",
    unsubscribe: "Відписатися",
  },
  footer: {
    rights: "Всі права захищені.",
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/content/emails.ts tests/unit/email-templates.test.ts
git commit -m "feat(g5): transactional-email content module — UA copy, render-time brand

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: email-templates/layout.ts — shared dark shell

**Files:**

- Create: `src/lib/email-templates/layout.ts`
- Modify: `tests/unit/email-templates.test.ts` (append describe block)

**Interfaces:**

- Consumes: `emails.footer.rights`, `getStoreName()` from `@/content/emails` (Task 2).
- Produces: `EMAIL_COLORS` (`bg, panel, border, text, muted, faint, success` — lowercase hex), `EMAIL_FONT_STACK: string`, `renderEmailShell(opts: { title: string; bodyHtml: string; footerExtraHtml?: string }): string`, `renderPanel(innerHtml: string, opts?: { center?: boolean }): string`, `renderButton(href: string, label: string): string`. Tasks 4–5 import these exact names from `./layout`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/email-templates.test.ts`:

```ts
import {
  EMAIL_COLORS,
  renderButton,
  renderEmailShell,
  renderPanel,
} from "@/lib/email-templates/layout";

// ---------------------------------------------------------------------------
// email-templates/layout.ts — shared dark shell
// ---------------------------------------------------------------------------

describe("renderEmailShell", () => {
  it("renders a Ukrainian-language dark shell with the brand and body", () => {
    const html = renderEmailShell({ title: "Тест", bodyHtml: "<p>BODY-MARKER</p>" });
    expect(html).toContain('<html lang="uk">');
    expect(html).toContain('bgcolor="#000000"');
    expect(html).toContain("<title>Тест</title>");
    expect(html).toContain("BODY-MARKER");
    expect(html).toContain("Mirox Shop");
    expect(html).toContain(`&copy; ${new Date().getFullYear()}`);
    expect(html).toContain("Всі права захищені.");
  });

  it("injects footerExtraHtml when provided and omits it otherwise", () => {
    const withExtra = renderEmailShell({
      title: "t",
      bodyHtml: "",
      footerExtraHtml: "<p>EXTRA-MARKER</p>",
    });
    const without = renderEmailShell({ title: "t", bodyHtml: "" });
    expect(withExtra).toContain("EXTRA-MARKER");
    expect(without).not.toContain("EXTRA-MARKER");
  });

  it("renders the env store name when set", () => {
    process.env.NEXT_PUBLIC_STORE_NAME = "Custom Brand";
    expect(renderEmailShell({ title: "t", bodyHtml: "" })).toContain("Custom Brand");
  });
});

describe("renderPanel / renderButton", () => {
  it("wraps content in a dark panel with border", () => {
    const html = renderPanel("<p>PANEL-MARKER</p>");
    expect(html).toContain("PANEL-MARKER");
    expect(html).toContain(`bgcolor="${EMAIL_COLORS.panel}"`);
    expect(html).toContain(EMAIL_COLORS.border);
  });

  it("renders a white button with href and label", () => {
    const html = renderButton("https://example.com/x", "НАТИСНУТИ");
    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain("НАТИСНУТИ");
    expect(html).toContain('bgcolor="#ffffff"');
    expect(html).toContain("color: #000000");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: FAIL — cannot resolve `@/lib/email-templates/layout`.

- [ ] **Step 3: Implement the shell**

Create `src/lib/email-templates/layout.ts`:

```ts
import { emails, getStoreName } from "@/content/emails";

/**
 * Shared dark Mirox email shell (spec 2026-08-10-g5-transactional-emails-design.md §4).
 * Email-safe rules: tables + stacked blocks only, inline styles everywhere,
 * bgcolor attributes alongside CSS for Outlook, no <svg>, no grid/flex.
 */

export const EMAIL_COLORS = {
  bg: "#000000",
  panel: "#0d0d0d",
  border: "#1a1a1a",
  text: "#ffffff",
  muted: "#a3a3a3",
  faint: "#737373",
  success: "#4ade80",
} as const;

export const EMAIL_FONT_STACK = "'Manrope', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

export function renderPanel(innerHtml: string, opts?: { center?: boolean }): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;"><tr><td bgcolor="${EMAIL_COLORS.panel}" style="background-color: ${EMAIL_COLORS.panel}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 14px; padding: 24px;${opts?.center ? " text-align: center;" : ""}">${innerHtml}</td></tr></table>`;
}

export function renderButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;"><tr><td bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 8px;"><a href="${href}" style="display: inline-block; padding: 14px 32px; font-weight: 700; letter-spacing: 0.08em; font-size: 13px; color: #000000; text-decoration: none;">${label}</a></td></tr></table>`;
}

export function renderEmailShell(opts: {
  title: string;
  bodyHtml: string;
  footerExtraHtml?: string;
}): string {
  const storeName = getStoreName();
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
  <title>${opts.title}</title>
</head>
<body bgcolor="${EMAIL_COLORS.bg}" style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.bg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${EMAIL_COLORS.bg}" style="background-color: ${EMAIL_COLORS.bg};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; font-family: ${EMAIL_FONT_STACK}; line-height: 1.6; color: ${EMAIL_COLORS.text};">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: ${EMAIL_COLORS.text};">${storeName}</span>
            </td>
          </tr>
          <tr>
            <td>${opts.bodyHtml}</td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 24px; border-top: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.faint}; font-size: 13px;">
              <p style="margin: 0;">&copy; ${year} ${storeName}. ${emails.footer.rights}</p>${opts.footerExtraHtml ?? ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email-templates/layout.ts tests/unit/email-templates.test.ts
git commit -m "feat(g5): shared dark Mirox email shell (table-based, lang=uk)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: order-confirmation template

**Files:**

- Create: `src/lib/email-templates/order-confirmation.ts`
- Modify: `tests/unit/email-templates.test.ts` (append describe block)

**Interfaces:**

- Consumes: `emails.order` (Task 2); `renderEmailShell/renderPanel/renderButton/EMAIL_COLORS` (Task 3); `escapeHtml` from `@/lib/newsletter`; `formatPrice` from `@/lib/format`; `getShippingMethodLabel` from `@/lib/shipping`.
- Produces: `export interface OrderEmailData` (the existing email.ts shape **plus `hasAccount: boolean`**) and `generateOrderConfirmationHtml(data: OrderEmailData): string`. Task 6 imports both from `./email-templates/order-confirmation`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/email-templates.test.ts`:

```ts
import {
  generateOrderConfirmationHtml,
  type OrderEmailData,
} from "@/lib/email-templates/order-confirmation";
import { formatPrice } from "@/lib/format";

// ---------------------------------------------------------------------------
// email-templates/order-confirmation.ts
// ---------------------------------------------------------------------------

const baseOrder: OrderEmailData = {
  orderNumber: "ORD-20260810-001",
  email: "customer@example.com",
  items: [
    {
      productName: "Худі Mirox Basic",
      variantInfo: "Size: M",
      quantity: 2,
      unitPrice: 1290,
      totalPrice: 2580,
    },
  ],
  subtotal: 2580,
  shippingCost: 80,
  tax: 0,
  total: 2660,
  shippingAddress: {
    name: "Тест Тестовий",
    line1: "Відділення №12",
    city: "Київ",
    country: "UA",
  },
  shippingMethod: "np-office",
  hasAccount: false,
};

describe("generateOrderConfirmationHtml", () => {
  it("renders the Ukrainian order email in the dark shell", () => {
    const html = generateOrderConfirmationHtml(baseOrder);
    expect(html).toContain('<html lang="uk">');
    expect(html).toContain('bgcolor="#000000"');
    for (const marker of [
      "Замовлення прийнято!",
      "Дякуємо за замовлення!",
      "Замовлення №",
      "ORD-20260810-001",
      "Товари",
      "Доставка",
      "До сплати",
      "Адреса доставки",
      "Спосіб доставки",
      "Нова Пошта — відділення",
      "Питання щодо замовлення?",
    ]) {
      expect(html).toContain(marker);
    }
    expect(html).toContain(formatPrice(2580));
    expect(html).toContain(formatPrice(2660));
    expect(html).not.toContain("Store");
  });

  it("escapes user-supplied strings (HTML injection)", () => {
    const html = generateOrderConfirmationHtml({
      ...baseOrder,
      items: [{ ...baseOrder.items[0], productName: '<img src=x onerror="pwn()">' }],
      shippingAddress: { ...baseOrder.shippingAddress, city: "<script>alert(1)</script>" },
    });
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("hides the account CTA for guest orders", () => {
    const html = generateOrderConfirmationHtml({ ...baseOrder, hasAccount: false });
    expect(html).not.toContain("ІСТОРІЯ ЗАМОВЛЕНЬ");
    expect(html).not.toContain("/account/orders");
  });

  it("shows the account CTA for signed-in customers", () => {
    const html = generateOrderConfirmationHtml({ ...baseOrder, hasAccount: true });
    expect(html).toContain("ІСТОРІЯ ЗАМОВЛЕНЬ");
    expect(html).toContain("https://test.example.com/account/orders");
  });

  it("renders the tax row only when tax > 0", () => {
    expect(generateOrderConfirmationHtml({ ...baseOrder, tax: 0 })).not.toContain("Податок");
    const withTax = generateOrderConfirmationHtml({ ...baseOrder, tax: 133 });
    expect(withTax).toContain("Податок");
    expect(withTax).toContain(formatPrice(133));
  });

  it("still resolves legacy Stripe-era shipping ids", () => {
    const html = generateOrderConfirmationHtml({ ...baseOrder, shippingMethod: "standard" });
    expect(html).toContain("Standard Shipping");
  });

  it("does not promise a nonexistent shipping-confirmation email", () => {
    expect(generateOrderConfirmationHtml(baseOrder)).not.toContain("shipping confirmation");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: FAIL — cannot resolve `@/lib/email-templates/order-confirmation`.

- [ ] **Step 3: Implement the template**

Create `src/lib/email-templates/order-confirmation.ts`:

```ts
import { escapeHtml } from "@/lib/newsletter";
import { formatPrice } from "@/lib/format";
import { getShippingMethodLabel } from "@/lib/shipping";
import { emails } from "@/content/emails";
import { EMAIL_COLORS, renderButton, renderEmailShell, renderPanel } from "./layout";

export interface OrderEmailData {
  orderNumber: string;
  email: string;
  items: Array<{
    productName: string;
    variantInfo?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    company?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  shippingMethod: string;
  /**
   * Guest COD orders (userId null) can't open /account/orders, so the CTA
   * renders only for signed-in customers — the G2 confirmation-page ruling.
   */
  hasAccount: boolean;
}

const t = emails.order;

function renderItemsRows(items: OrderEmailData["items"]): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
          <div style="font-weight: 600;">${escapeHtml(item.productName)}</div>
          ${item.variantInfo ? `<div style="color: ${EMAIL_COLORS.muted}; font-size: 14px;">${escapeHtml(item.variantInfo)}</div>` : ""}
          <div style="color: ${EMAIL_COLORS.muted}; font-size: 14px;">${t.qty(item.quantity)}</div>
        </td>
        <td align="right" style="padding: 12px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right; font-weight: 600; white-space: nowrap;">
          ${formatPrice(item.totalPrice)}
        </td>
      </tr>`
    )
    .join("");
}

function renderTotals(data: OrderEmailData): string {
  const row = (label: string, value: number) =>
    `<tr><td style="color: ${EMAIL_COLORS.muted}; padding: 4px 0;">${label}</td><td align="right" style="text-align: right; padding: 4px 0;">${formatPrice(value)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
    ${row(t.subtotalLabel, data.subtotal)}
    ${row(t.shippingLabel, data.shippingCost)}
    ${data.tax > 0 ? row(t.taxLabel, data.tax) : ""}
    <tr>
      <td style="border-top: 1px solid ${EMAIL_COLORS.border}; padding-top: 12px; font-weight: 700;">${t.totalLabel}</td>
      <td align="right" style="border-top: 1px solid ${EMAIL_COLORS.border}; padding-top: 12px; text-align: right; font-weight: 700;">${formatPrice(data.total)}</td>
    </tr>
  </table>`;
}

function renderAddress(a: OrderEmailData["shippingAddress"]): string {
  return [
    escapeHtml(a.name),
    a.company ? escapeHtml(a.company) : null,
    escapeHtml(a.line1),
    a.line2 ? escapeHtml(a.line2) : null,
    `${escapeHtml(a.city)}${a.state ? `, ${escapeHtml(a.state)}` : ""}${a.postalCode ? ` ${escapeHtml(a.postalCode)}` : ""}`,
    escapeHtml(a.country),
  ]
    .filter(Boolean)
    .join("<br>");
}

export function generateOrderConfirmationHtml(data: OrderEmailData): string {
  const successPanel = renderPanel(
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 16px;">
      <tr>
        <td bgcolor="${EMAIL_COLORS.success}" width="48" height="48" align="center" style="background-color: ${EMAIL_COLORS.success}; border-radius: 50%; color: #000000; font-size: 24px; font-weight: 700;">&#10003;</td>
      </tr>
    </table>
    <h2 style="margin: 0 0 8px 0; font-size: 20px;">${t.heading}</h2>
    <p style="margin: 0; color: ${EMAIL_COLORS.muted};">${t.thanks}</p>`,
    { center: true }
  );

  const orderNumberPanel = renderPanel(
    `<p style="margin: 0; color: ${EMAIL_COLORS.muted}; font-size: 14px;">${t.orderNumberLabel}</p>
    <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700;">${data.orderNumber}</p>`,
    { center: true }
  );

  const detailsPanel = renderPanel(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 24px;">${renderItemsRows(data.items)}</table>
    ${renderTotals(data)}
    <p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.muted}; font-size: 14px;">${t.addressHeading}</p>
    <p style="margin: 0 0 16px 0; font-size: 14px;">${renderAddress(data.shippingAddress)}</p>
    <p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.muted}; font-size: 14px;">${t.methodHeading}</p>
    <p style="margin: 0; font-size: 14px;">${escapeHtml(getShippingMethodLabel(data.shippingMethod))}</p>`
  );

  const contactLinks = t.contacts
    .map(
      (s) =>
        `<a href="${s.href}" style="color: ${EMAIL_COLORS.text}; text-decoration: underline;">${s.label}</a>`
    )
    .join(" &middot; ");

  const contactPanel = renderPanel(
    `<p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.muted};">${t.contactHeading}</p>
    <p style="margin: 0${data.hasAccount ? " 0 20px 0" : ""};">${contactLinks}</p>${
      data.hasAccount
        ? `\n    ${renderButton(`${process.env.NEXT_PUBLIC_APP_URL}/account/orders`, t.cta)}`
        : ""
    }`,
    { center: true }
  );

  return renderEmailShell({
    title: t.title,
    bodyHtml: `${successPanel}${orderNumberPanel}${detailsPanel}${contactPanel}`,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email-templates/order-confirmation.ts tests/unit/email-templates.test.ts
git commit -m "feat(g5): UA dark order-confirmation template — escaping, guest-aware CTA

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: newsletter-confirmation rebuild

**Files:**

- Modify: `src/lib/email-templates/newsletter-confirmation.ts` (full rewrite, same exported signature)
- Modify: `tests/unit/email-templates.test.ts` (append describe block)

**Interfaces:**

- Consumes: `emails.newsletter`, `getStoreName()` (Task 2); shell builders (Task 3); `escapeHtml`.
- Produces: `generateNewsletterConfirmationHtml(data: { email: string; confirmationUrl: string; unsubscribeUrl?: string }): string` — signature unchanged, so `email.ts` keeps compiling before Task 6.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/email-templates.test.ts`:

```ts
import { generateNewsletterConfirmationHtml } from "@/lib/email-templates/newsletter-confirmation";

// ---------------------------------------------------------------------------
// email-templates/newsletter-confirmation.ts
// ---------------------------------------------------------------------------

const newsletterData = {
  email: "customer@example.com",
  confirmationUrl: "https://test.example.com/newsletter/confirm?token=abc123",
};

describe("generateNewsletterConfirmationHtml", () => {
  it("renders the Ukrainian double-opt-in email in the dark shell", () => {
    const html = generateNewsletterConfirmationHtml(newsletterData);
    expect(html).toContain('<html lang="uk">');
    expect(html).toContain('bgcolor="#000000"');
    expect(html).toContain("Підтвердіть підписку");
    expect(html).toContain("Ви залишили цю адресу для підписки на розсилку");
    expect(html).toContain("customer@example.com");
    expect(html).toContain("Посилання дійсне 24 години.");
    expect(html).toContain(`href="${newsletterData.confirmationUrl}"`);
    expect(html).not.toContain("Store");
  });

  it("escapes the email address", () => {
    const html = generateNewsletterConfirmationHtml({
      ...newsletterData,
      email: '<b onmouseover="pwn()">x</b>@example.com',
    });
    expect(html).not.toContain('<b onmouseover="pwn()">');
    expect(html).toContain("&lt;b onmouseover=");
  });

  it("renders the unsubscribe link only when provided", () => {
    const withUnsub = generateNewsletterConfirmationHtml({
      ...newsletterData,
      unsubscribeUrl: "https://test.example.com/newsletter/unsubscribe?id=1",
    });
    expect(withUnsub).toContain("Відписатися");
    expect(withUnsub).toContain('href="https://test.example.com/newsletter/unsubscribe?id=1"');
    expect(generateNewsletterConfirmationHtml(newsletterData)).not.toContain("Відписатися");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: FAIL — the current file renders the English light template ("Confirm Your Subscription").

- [ ] **Step 3: Rewrite the template**

Replace the entire contents of `src/lib/email-templates/newsletter-confirmation.ts`:

```ts
import { escapeHtml } from "@/lib/newsletter";
import { emails, getStoreName } from "@/content/emails";
import { EMAIL_COLORS, renderButton, renderEmailShell, renderPanel } from "./layout";

export function generateNewsletterConfirmationHtml(data: {
  email: string;
  confirmationUrl: string;
  unsubscribeUrl?: string;
}): string {
  const t = emails.newsletter;

  const introPanel = renderPanel(
    `<h2 style="margin: 0 0 16px 0; font-size: 20px;">${t.heading}</h2>
    <p style="margin: 0; color: ${EMAIL_COLORS.muted};">${t.introPrefix} ${getStoreName()}: <strong style="color: ${EMAIL_COLORS.text};">${escapeHtml(data.email)}</strong></p>`
  );

  const ctaBlock = `<p style="margin: 0 0 16px 0;">${t.body}</p>
  <div style="margin-bottom: 32px;">${renderButton(data.confirmationUrl, t.cta)}</div>`;

  const safetyPanel = renderPanel(
    `<p style="margin: 0; font-size: 14px; color: ${EMAIL_COLORS.muted};"><strong style="color: ${EMAIL_COLORS.text};">${t.safetyTitle}</strong> ${t.safetyText}</p>`
  );

  const footerExtraHtml = data.unsubscribeUrl
    ? `<p style="margin: 8px 0 0 0;"><a href="${data.unsubscribeUrl}" style="color: ${EMAIL_COLORS.faint}; text-decoration: underline;">${t.unsubscribe}</a></p>`
    : undefined;

  return renderEmailShell({
    title: t.title,
    bodyHtml: `${introPanel}${ctaBlock}${safetyPanel}`,
    footerExtraHtml,
  });
}
```

- [ ] **Step 4: Run tests + the existing newsletter suites**

Run: `npx vitest run tests/unit/email-templates.test.ts tests/unit/newsletter.test.ts tests/unit/newsletter-api.test.ts`
Expected: PASS (newsletter-api mocks `@/lib/email` entirely; newsletter.test.ts covers utilities only).

- [ ] **Step 5: Commit**

```bash
git add src/lib/email-templates/newsletter-confirmation.ts tests/unit/email-templates.test.ts
git commit -m "feat(g5): UA dark newsletter double-opt-in template on the shared shell

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: email.ts slim-down, UA subjects, hasAccount call sites, admin fallback

**Files:**

- Modify: `src/lib/email.ts` (full rewrite — generator + interface move out)
- Modify: `src/app/api/checkout/create-order/route.ts:166-184` (add `hasAccount`)
- Modify: `src/app/api/checkout/confirm-order/route.ts:172` area (add `hasAccount`)
- Modify: `src/app/(admin)/admin/settings/page.tsx:20` (fallback → `BRAND_NAME`)
- Modify: `tests/unit/email-templates.test.ts` (append subject-wiring describe)
- Modify: `tests/unit/checkout-create-order-api.test.ts` (append 2 hasAccount tests)

**Interfaces:**

- Consumes: `generateOrderConfirmationHtml`, `OrderEmailData` (Task 4); `generateNewsletterConfirmationHtml` (Task 5); `emails.order.subject` / `emails.newsletter.subject` (Task 2).
- Produces: `sendOrderConfirmationEmail(data: OrderEmailData)` / `sendNewsletterConfirmationEmail(data)` — same exported names; `email.ts` re-exports `type { OrderEmailData }`.

- [ ] **Step 1: Write the failing subject-wiring tests**

Append to `tests/unit/email-templates.test.ts` (the `resend` mock and `sendMock` already exist at the top from Task 2):

```ts
// ---------------------------------------------------------------------------
// email.ts — subject wiring (mocked Resend; module re-imported so the
// module-scope RESEND_API_KEY read picks up the test value)
// ---------------------------------------------------------------------------

describe("email.ts subjects", () => {
  it("sends the order email with the UA subject", async () => {
    sendMock.mockResolvedValue({ error: null });
    process.env.RESEND_API_KEY = "test-key";
    vi.resetModules();
    const { sendOrderConfirmationEmail } = await import("@/lib/email");
    const result = await sendOrderConfirmationEmail({ ...baseOrder });
    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "customer@example.com",
        subject: "Замовлення ORD-20260810-001 прийнято — Mirox Shop",
      })
    );
  });

  it("sends the newsletter email with the UA subject", async () => {
    sendMock.mockResolvedValue({ error: null });
    process.env.RESEND_API_KEY = "test-key";
    vi.resetModules();
    const { sendNewsletterConfirmationEmail } = await import("@/lib/email");
    const result = await sendNewsletterConfirmationEmail(newsletterData);
    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Підтвердіть підписку на розсилку Mirox Shop" })
    );
  });
});
```

Append to `tests/unit/checkout-create-order-api.test.ts` (inside the existing top-level describe, after the "fires the confirmation email non-blocking" test):

```ts
it("passes hasAccount: false for guest orders", async () => {
  mockAuth.mockResolvedValue(null);
  mockTx();
  await POST(
    createNextRequest({ url: "/api/checkout/create-order", method: "POST", body: validBody })
  );
  expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
    expect.objectContaining({ hasAccount: false })
  );
});

it("passes hasAccount: true when a session user exists", async () => {
  mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  mockTx();
  await POST(
    createNextRequest({ url: "/api/checkout/create-order", method: "POST", body: validBody })
  );
  expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
    expect.objectContaining({ hasAccount: true })
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/email-templates.test.ts tests/unit/checkout-create-order-api.test.ts`
Expected: FAIL — old English subjects; `hasAccount` not passed.

- [ ] **Step 3: Rewrite email.ts**

Replace the entire contents of `src/lib/email.ts`:

```ts
import { Resend } from "resend";
import { emails } from "@/content/emails";
import { generateNewsletterConfirmationHtml } from "./email-templates/newsletter-confirmation";
import {
  generateOrderConfirmationHtml,
  type OrderEmailData,
} from "./email-templates/order-confirmation";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "noreply@yourdomain.com";

// Create a mock resend for development when no API key is set
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type { OrderEmailData };

export async function sendOrderConfirmationEmail(
  data: OrderEmailData
): Promise<{ success: boolean; error?: string }> {
  // Skip sending in development if no API key
  if (!resend) {
    console.log("Skipping email send - RESEND_API_KEY not configured");
    console.log("Would send order confirmation to:", data.email);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: data.email,
      subject: emails.order.subject(data.orderNumber),
      html: generateOrderConfirmationHtml(data),
    });

    if (error) {
      console.error("Failed to send order confirmation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendNewsletterConfirmationEmail(data: {
  email: string;
  confirmationUrl: string;
  unsubscribeUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("Skipping email send - RESEND_API_KEY not configured");
    console.log("Would send newsletter confirmation to:", data.email);
    console.log("Confirmation URL:", data.confirmationUrl);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: data.email,
      subject: emails.newsletter.subject(),
      html: generateNewsletterConfirmationHtml(data),
    });

    if (error) {
      console.error("Failed to send newsletter confirmation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending newsletter confirmation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

- [ ] **Step 4: Pass hasAccount at both call sites**

In `src/app/api/checkout/create-order/route.ts`, add one line to the `sendOrderConfirmationEmail({ … })` argument (after `shippingMethod: data.shippingMethod,`):

```ts
      hasAccount: Boolean(session?.user?.id),
```

In `src/app/api/checkout/confirm-order/route.ts`, add the same line to its `sendOrderConfirmationEmail({ … })` call (the dormant Stripe path stays type-correct).

- [ ] **Step 5: Admin settings fallback**

In `src/app/(admin)/admin/settings/page.tsx`: add `import { BRAND_NAME } from "@/content/brand";` and change line 20 to:

```ts
    storeName: process.env.NEXT_PUBLIC_STORE_NAME || BRAND_NAME,
```

(The lucide icon import named `Store` on line 4 is unrelated — leave it.)

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/unit/email-templates.test.ts tests/unit/checkout-create-order-api.test.ts && npm run typecheck`
Expected: PASS / clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/email.ts src/app/api/checkout/create-order/route.ts src/app/api/checkout/confirm-order/route.ts "src/app/(admin)/admin/settings/page.tsx" tests/unit/email-templates.test.ts tests/unit/checkout-create-order-api.test.ts
git commit -m "feat(g5): UA subjects, BRAND_NAME routing, hasAccount at email call sites

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Removed-strings sweep + full verification + visual gate

**Files:**

- Create (NOT committed): `scripts/preview-emails.ts` — delete after the gate
- No src changes expected unless the sweep/gate finds issues

**Interfaces:**

- Consumes: everything from Tasks 1–6.
- Produces: green full suite + user visual sign-off (merge precondition).

- [ ] **Step 1: Sweep for the strings the diff removed**

Lesson [[string-renames-must-sweep-locator-types]]: grep the repo for strings the diff REMOVED, across ALL file types (unit, E2E, src, docs):

Run:

```bash
grep -rn "Order Confirmed!\|Thank you for your order\|Confirm Your Subscription\|View Order Status\|All rights reserved\|Order Confirmed - " src tests --include="*.ts" --include="*.tsx"
grep -rn '|| "Store"' src tests
```

Expected: zero hits for both. Known, deliberate residuals that are NOT failures if seen on a broader grep: `admin/orders/[id]/page.tsx` "Order Confirmed" (admin timeline label) and `admin/settings/page.tsx` "Order Confirmation" (admin toggle label) — admin UI copy, out of G5 scope per spec §3. Any OTHER hit → fix before proceeding.

- [ ] **Step 2: Full verification suite**

Run: `npm run lint && npm run typecheck && npm run format:check && npm run test:run`
Expected: all green; note the new total test count for the PR description.

Run: `npm run build`
Expected: compiles clean (do not judge page visuals from this local build — container `NODE_ENV` issue).

- [ ] **Step 3: Render previews**

Create `scripts/preview-emails.ts` (temporary, never staged):

```ts
import { writeFileSync } from "node:fs";

process.env.NEXT_PUBLIC_APP_URL ??= "https://mirox-shop.example";

async function main() {
  const { generateOrderConfirmationHtml } =
    await import("../src/lib/email-templates/order-confirmation");
  const { generateNewsletterConfirmationHtml } =
    await import("../src/lib/email-templates/newsletter-confirmation");

  const outDir = process.argv[2] ?? ".";
  const base = {
    orderNumber: "ORD-20260810-042",
    email: "customer@example.com",
    items: [
      {
        productName: "Худі Mirox Basic — Чорний",
        variantInfo: "Size: M",
        quantity: 2,
        unitPrice: 1290,
        totalPrice: 2580,
      },
      {
        productName: "Кепка Mirox",
        variantInfo: "Один розмір",
        quantity: 1,
        unitPrice: 590,
        totalPrice: 590,
      },
    ],
    subtotal: 3170,
    shippingCost: 80,
    tax: 0,
    total: 3250,
    shippingAddress: {
      name: "Олександр Коваленко",
      line1: "Відділення №12",
      city: "Київ",
      country: "UA",
    },
    shippingMethod: "np-office",
  };

  writeFileSync(
    `${outDir}/order-account.html`,
    generateOrderConfirmationHtml({ ...base, hasAccount: true })
  );
  writeFileSync(
    `${outDir}/order-guest.html`,
    generateOrderConfirmationHtml({ ...base, hasAccount: false })
  );
  writeFileSync(
    `${outDir}/newsletter.html`,
    generateNewsletterConfirmationHtml({
      email: "customer@example.com",
      confirmationUrl: "https://mirox-shop.example/newsletter/confirm?token=preview",
      unsubscribeUrl: "https://mirox-shop.example/newsletter/unsubscribe?id=1&token=preview",
    })
  );
  console.log("Wrote order-account.html, order-guest.html, newsletter.html to", outDir);
}

main();
```

Run from repo root (tsx resolves the `@/` aliases inside the imported modules via tsconfig):
`npx tsx scripts/preview-emails.ts <scratchpad-dir>`

If tsx fails on the `@/` aliases, fallback: temporarily add the three render calls to a scratch vitest file and dump with `writeFileSync` — delete afterwards.

- [ ] **Step 4: Visual gate (standing rule — human sign-off required)**

Open all three HTML files in a real browser (chrome-devtools MCP: `file://` URLs), screenshot each at ~700px and ~375px widths, and present to the user alongside the shipped checkout confirmation page for consistency judgment. **Wait for explicit sign-off.** Fix + re-screenshot on revision requests (the G1/G4 pattern: expect at least one revision round).

- [ ] **Step 5: Manual dev-mode check**

Run: `npx vitest run tests/unit/checkout-create-order-api.test.ts` already covers the send path; for the skip path, confirm in Task 6's rewrite that the `!resend` branch still logs "Skipping email send - RESEND_API_KEY not configured" (it does — preserved verbatim). No dev-server run needed.

- [ ] **Step 6: Delete the preview script; commit any gate fixes**

```bash
rm scripts/preview-emails.ts
git status   # must show a clean tree, or only gate-fix changes
# if gate fixes were made:
git add -A && git commit -m "fix(g5): visual-gate revisions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Docs propagation, prod email config check, review handoff

**Files:**

- Modify: `CLAUDE.md` (architecture tree + conventions)
- Modify: `src/app/CLAUDE.md` / `src/components/CLAUDE.md` only if their trees mention moved pieces (check; likely no)
- No other code changes

**Interfaces:**

- Consumes: shipped state of Tasks 1–7.
- Produces: PR-ready branch + prod-config report; planning-doc closures (WEEKLY/BACKLOG/DONE/TODO) happen at the post-merge completion workflow, NOT here.

- [ ] **Step 1: CLAUDE.md propagation (root)**

In root `CLAUDE.md`:

1. Architecture tree, under `src/content/`: add `emails.ts` line — `# Transactional email copy (subjects + bodies, UA); imports only brand.ts — lucide-free by contract (bundled into API routes)`. Update `brand.ts` line to mention it now also carries `SOCIALS` (relocated G5).
2. Architecture tree, under `src/lib/email-templates/`: replace the single newsletter line with the three files (`layout.ts` shared dark shell, `order-confirmation.ts`, `newsletter-confirmation.ts`).
3. Update the `src/lib/email.ts` tree line: now Resend wiring only; templates in `email-templates/`.
4. Detected Patterns: add a **Transactional email pattern** bullet — dark Mirox table-based shell (`email-templates/layout.ts`), UA copy via `content/emails.ts`, render-time `getStoreName()` (`env || BRAND_NAME` — never module-scope), `escapeHtml` on every interpolated user/DB string, guest-aware CTA via `OrderEmailData.hasAccount` (G2 confirmation-page ruling), tax row only when > 0.
5. Search the file for stale claims the diff falsified — e.g. any remaining text implying emails brand as "Store" or that `email.ts` contains the order template. Fix in place (live doc → corrected, not superseded).

- [ ] **Step 2: Prod email config verification (spec §10)**

1. Try Vercel tooling for the project's prod env var names (`mcp__plugin_vercel_vercel__get_project` / env listing via the dashboard with the user — the Vercel CLI is not installed in this container).
2. Record in this plan file's journal: presence/absence of `RESEND_API_KEY` and `EMAIL_FROM`, and whether `EMAIL_FROM`'s domain is Resend-verified (ask the user to check the Resend dashboard — no API access here).
3. If anything is missing: draft the exact client action items (create Resend account → verify sending domain DNS → set both vars in Vercel prod env) and hand them to the user for the TASK-056 ask. The BACKLOG 🔵 entry closure itself happens in the post-merge completion workflow.

- [ ] **Step 3: Commit docs**

```bash
git add CLAUDE.md docs/planning/plans/2026-08-10_g5-transactional-emails.md
git commit -m "docs(g5): propagate email architecture + conventions; config-check journal

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Code review + PR (user-gated)**

1. Invoke `superpowers:requesting-code-review` for the branch diff; fix real findings (remember: the eligibility agent may wrongly reject and the ≥80 gate understates doc/visual findings — list sub-threshold findings in chat anyway).
2. **Wait for user approval** (house rule: no push before approval; visual gate from Task 7 must already be signed off).
3. On approval: push `feat/g5-transactional-emails`, open the PR (repo is `GoodAlex223/dropshipping-test` — read the remote, don't compose URLs), body summarizing scope + test delta, ending with the standard generated-with line.

---

## Self-review record

- **Spec coverage**: §4 shell → Task 3; §5 order → Tasks 4+6; §6 newsletter → Task 5; §7 structure/socials → Tasks 1, 2, 6; §8 escaping → Task 4 (+tests); §9 tests/visual gate → every task + Task 7; §10 prod config → Task 8; §11 propagation → Task 8 (in-PR part) + post-merge completion workflow (planning docs). No gaps.
- **Placeholder scan**: clean — all steps carry exact code/commands.
- **Type consistency**: `getStoreName`/`emails` (T2) ← T3/T4/T5/T6 imports match; `OrderEmailData.hasAccount` (T4) ← T6 call sites + tests match; `renderEmailShell/renderPanel/renderButton/EMAIL_COLORS` names consistent across T3–T5.

---

## Task 8 journal — prod email config verification (spec §10, executed 2026-08-10)

**Programmatic result: INCONCLUSIVE — env vars not readable from this container.**

- Vercel project located via MCP: `dropshipping-test` (`prj_IB5kKeCKmZ4AEUpKQSuScfoWo2c0`,
  team `goodalex223s-projects`), latest production deployment READY.
- The Vercel MCP exposes no environment-variable listing; the Vercel CLI is not installed in
  this devcontainer; `.vercel/project.json` absent.
- Runtime-log probe for the tell-tale `"Skipping email send - RESEND_API_KEY not configured"`
  line: no logs in a 7-day window — plan-tier retention (Hobby: 1h) makes this probe
  uninformative, not a proof of presence.

**User action required (≈2 min, Vercel + Resend dashboards):**

1. Vercel → `dropshipping-test` → Settings → Environment Variables (Production scope):
   confirm `RESEND_API_KEY` and `EMAIL_FROM` exist.
2. Resend dashboard → Domains: confirm the `EMAIL_FROM` domain is verified (SPF/DKIM green).
3. Known hazard (spec §10): with only the API key set, the code fallback
   `noreply@yourdomain.com` hard-fails Resend on the unverified domain — receipts silently
   never send either way.

**If anything is missing — client action items (route to the TASK-056 ask):**
create a Resend account → verify the real sending domain's DNS (SPF + DKIM) → set
`RESEND_API_KEY` + `EMAIL_FROM` in Vercel production env. Code ships regardless (decision 2);
the BACKLOG 🔵 entry closes at the completion workflow with a pointer to wherever this lands.
