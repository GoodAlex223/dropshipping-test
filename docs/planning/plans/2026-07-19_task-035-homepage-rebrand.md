# TASK-035 Homepage Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the customer homepage on the Mirox design system as a composition of focused, content-driven sections backed by real product and review data.

**Architecture:** All copy moves to two typed modules under `src/content/`, giving TASK-039 one i18n extraction point and the client-inventory task one place to enumerate what the client still owes. Page sections become components — homepage-only ones under `src/components/home/`, ones the Footer also consumes under `src/components/common/`. Data access moves to `src/lib/product-queries.ts`, whose `getBestsellers()` is the shared "popular" definition TASK-036 will import. `page.tsx` shrinks to composition.

**Tech Stack:** Next.js 14.2.35 (App Router), React 18, TypeScript strict, Tailwind CSS v4, Prisma + PostgreSQL, Vitest + Testing Library, Playwright.

**Spec:** [docs/superpowers/specs/2026-07-19-task-035-homepage-design.md](../../superpowers/specs/2026-07-19-task-035-homepage-design.md)

## Global Constraints

Every task's requirements implicitly include these.

- **Colour policy**: monochrome only. The single sanctioned hue is `--destructive` red, applied via token utilities (`text-destructive`, `bg-destructive`) — never a numbered utility like `red-500`. No `bg-blue-*`, `text-green-*`, `bg-chart-*`, etc. anywhere customer-facing.
- **All colour via TASK-034 tokens.** Never hardcode hex. Dark sections use `data-surface="dark"`; do not use `.dark` or `dark:` variants.
- **`data-surface` inheritance trap**: `[data-surface="dark"]` redefines tokens but does not re-assert inherited `color`, and any descendant using `bg-background` collapses invisibly into the surface. Audit children of every dark section, not just the wrapper.
- **New CSS tokens must be registered in `@theme inline`** in `globals.css`. Defining `--x` alone does not create a `text-x` utility — it is a silent no-op that typecheck, lint, and tests cannot see.
- **Next.js is pinned at 14.2.35.** `params` is a **plain object** in client components, not a Promise. Never call `use(params)` — that is Next 15 semantics and 500s here.
- **Prettier**: double quotes, semicolons, 2-space indent, 100-char print width, `es5` trailing commas. Pre-commit runs `eslint --fix` + `prettier --write`.
- **TypeScript strict.** No `any`. Path alias `@/*` → `./src/*`.
- **Images**: `next/image` only, never `<img>` (ESLint enforced). Product/hero images get `placeholder="blur"` with `DEFAULT_BLUR_DATA_URL` and an explicit `sizes` from `IMAGE_SIZES`.
- **Bare `catch`** when the error variable is unused: `} catch {`, not `} catch (error) {`.
- **`src/content/brand.ts` must import nothing, and `src/lib/seo.ts` must never import `src/content/site.ts`.** `site.ts` holds live Lucide component references in `footerBenefits`, which cannot be tree-shaken out of a single object literal. `seo.ts` is imported by `opengraph-image.tsx`, `robots.ts`, `sitemap.ts` and `feed/google-shopping.xml/route.ts` — all lucide-free today, and one of them runs in the constrained OG-image runtime. Brand strings for those consumers come from `brand.ts`.
- **Components**: PascalCase filenames; non-components kebab-case. Barrel `index.ts` per component directory.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), optional scope.
- **Out of scope, do not fix in passing**: UAH price formatting (`ProductCard.formatPrice` hardcodes USD — that is TASK-039), product-card hover/quick-view (TASK-036), the `use(params)` break on 4 admin/account routes (BACKLOG'd).

---

## Task 1: Capture the client brief in the repository

The brief exists only in a session transcript on one disk. Every task below depends on its wording. This task is first because it de-risks the rest and touches no code.

**Files:**

- Create: `docs/reference/client-brief.md`
- Create: `docs/reference/mirox-concept-screenshot.jpg` (moved from repo root)
- Modify: `docs/README.md`

**Interfaces:**

- Consumes: nothing
- Produces: `docs/reference/client-brief.md` — the citable source for "client list #1/#2 item N" references used by every later task and by TODO.md

- [ ] **Step 1: Create the reference directory and move the screenshot**

```bash
mkdir -p docs/reference
git mv photo_2026-07-13_13-23-08.jpg docs/reference/mirox-concept-screenshot.jpg 2>/dev/null \
  || mv photo_2026-07-13_13-23-08.jpg docs/reference/mirox-concept-screenshot.jpg
ls -la docs/reference/
```

Expected: `mirox-concept-screenshot.jpg` present (~62 KB). The `git mv` fails because the file was never tracked, so the `||` fallback does a plain `mv` — both outcomes are fine.

- [ ] **Step 2: Write `docs/reference/client-brief.md`**

Transcribe **both** client lists verbatim in the original Russian, each followed by an English translation. Source: session transcript `~/.claude/projects/-workspaces-dropshipping/2565949a-ffa7-4e0c-94fa-10918da7638f.jsonl`, line 44 (list #1, `ПРОМПТ ДЛЯ СОЗДАНИЯ САЙТА MIROX SHOP`, 2026-07-14) and line 654 (list #2, `Mirox Shop — План улучшений сайта`, 2026-07-15).

The document must include, at minimum, the homepage-relevant sections reproduced here so this plan remains self-contained if the transcript is lost:

```markdown
# Mirox Shop — Client Brief

**Status**: Verbatim record. Do not edit the quoted blocks — they are the client's words.
**Sources**: Claude Code session transcript, 2026-07-14 (list #1) and 2026-07-15 (list #2).
**Concept screenshot**: [mirox-concept-screenshot.jpg](mirox-concept-screenshot.jpg)

## List #1 — ПРОМПТ ДЛЯ СОЗДАНИЯ САЙТА MIROX SHOP (2026-07-14)

### Главная страница — Первый экран

> Большой баннер.
> Модель в современной одежде.
> Большой текст:
> STYLE.
> QUALITY.
> CONFIDENCE.
> Под ним:
> "Mirox Shop — современная одежда для тех, кто ценит качество и минимализм."
> Кнопки:
> • Перейти в каталог
> • Смотреть новинки

_Translation_: Large banner. Model in modern clothing. Large text "STYLE. / QUALITY. /
CONFIDENCE." Below it: "Mirox Shop — modern clothing for those who value quality and
minimalism." Buttons: "Go to catalog", "See new arrivals".

### Карточки преимуществ

> 🚚 Быстрая доставка · 🔄 Обмен размера · ⭐ Высокое качество · 💬 Поддержка 24/7

### Почему выбирают нас

> 🛍 Более 300 успешных покупок на OLX
> 📱 Более 100 заказов через Instagram
> ⭐ Высокий рейтинг покупателей
> 🚚 Быстрая доставка по Украине
> 📦 Проверяем каждый товар перед отправкой
> 🔄 Обмен размера
> 💬 Поддержка без выходных
> 🏆 Только качественная одежда
> 🔒 Безопасная оплата
> ❤️ Нам доверяют постоянные клиенты

### Социальные сети

> Instagram · TikTok · Telegram
> Подписывайтесь, чтобы первыми узнавать о новинках.

### Повышение доверия

> 🔥 Сейчас просматривают этот товар 12 человек
> 🛒 Сегодня купили 7 человек
> ⭐ Рейтинг 4.9
> 👁 Просмотров товара

**⚠️ Not implemented.** These are fabricated real-time social-proof numbers with no
data source. Ruled out of scope — see TASK-051.

### Overall goals

> Главная цель — чтобы посетитель захотел купить товар уже в первые 10 секунд
> пребывания на сайте.
> Сайт должен выглядеть дороже большинства украинских интернет-магазинов.
> Google PageSpeed 95+

## List #2 — План улучшений сайта (2026-07-15)

Items relevant to the homepage (full 20-item list below):

> 13. Верхний баннер — Бесплатная доставка или акции.
> 14. Hero — Использовать реальные фото моделей вместо SVG.
> 15. Анимации / GSAP, плавные появления, параллакс, микроанимации.
> 16. Соцсети — Instagram, TikTok, Telegram со счетчиками.
> 17. Цвета — Переключатели черный/белый в виде кружков.
> 18. Карточки товаров — Вторая фотография, быстрый просмотр, купить.

_Translation_: 13 = top banner, free delivery or promos. 14 = hero, use real model
photos instead of SVG. 15 = animations/GSAP, smooth reveals, parallax, micro-animations.
16 = socials with counters. 18 = colour switchers as circles. 19 = product cards with
second photo, quick view, buy.

## Known internal contradiction

The brief states the hero CTAs twice with different labels: the homepage section says
`Перейти в каталог` / `Смотреть новинки`, while the image-generation prompt in the same
document says `Перейти в каталог` / `Новинки`. TASK-035 treats the **homepage section**
as authoritative (it describes the page, not a mockup).
```

Reproduce the remaining items of list #2 (1–12, 17, 20) verbatim from the transcript alongside these. If the transcript is unreachable, record that fact explicitly in the document rather than paraphrasing from memory.

- [ ] **Step 3: Index both files in `docs/README.md`**

Add to the documentation table (the same table that lists `superpowers/specs/…`):

```markdown
| [reference/client-brief.md](reference/client-brief.md) | **Client brief (verbatim)** — Mirox Shop requirement lists #1 and #2, RU + EN | 2026-07-19 |
```

- [ ] **Step 4: Verify nothing else still points at the old screenshot path**

Run: `grep -rn "photo_2026-07-13" --include="*.md" --include="*.ts" --include="*.tsx" . | grep -v node_modules`
Expected: hits only in `docs/planning/BACKLOG.md` and `docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md`. Update those two references to `docs/reference/mirox-concept-screenshot.jpg`.

- [ ] **Step 5: Commit**

```bash
git add docs/reference docs/README.md docs/planning/BACKLOG.md \
  docs/superpowers/specs/2026-07-14-mirox-shop-program-design.md
git commit -m "docs: capture client brief and concept screenshot in the repo

The brief existed only in a session transcript on one disk, with no backup
and no review history, while every planning doc cited it second-hand.
Transcribed verbatim (RU + EN) and indexed; screenshot moved out of the
repo root into docs/reference/."
```

---

## Task 2: Content modules

**Files:**

- Create: `src/content/brand.ts`
- Create: `src/content/site.ts`
- Create: `src/content/home.ts`
- Test: `tests/unit/content.test.ts`

**Interfaces:**

- Consumes: nothing
- Produces:
  - `BRAND_NAME`, `BRAND_TAGLINE`, `BRAND_META_SUFFIX` — plain string constants in `brand.ts` with **zero imports** (see Step 3 for why this file exists separately)
  - `site: SiteContent` with `.name`, `.tagline`, `.announcement: string | null`, `.socials: SocialLink[]`, `.claims: ClientClaims`, `.footerBenefits: BenefitItem[]`
  - `home: HomeContent` with `.hero`, `.benefits: BenefitItem[]`, `.whyChooseUs`, `.rails`, `.testimonials`, `.social`
  - `interface SocialLink { platform: "instagram" | "tiktok" | "telegram"; label: string; href: string; followers: number | null }`
  - `interface ClientClaims { olxSales: string | null; instagramOrders: string | null; customerRating: string | null }`
  - `interface BenefitItem { icon: LucideIcon; title: string; description: string }`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/content.test.ts`:

```tsx
import { describe, it, expect } from "vitest";
import { site } from "@/content/site";
import { home } from "@/content/home";

describe("site content", () => {
  it("exposes the Mirox brand name", () => {
    expect(site.name).toBe("Mirox Shop");
  });

  it("declares exactly the three briefed social platforms", () => {
    expect(site.socials.map((s) => s.platform)).toEqual(["instagram", "tiktok", "telegram"]);
  });

  it("defaults every follower count to null so no counter is fabricated", () => {
    expect(site.socials.every((s) => s.followers === null)).toBe(true);
  });

  it("carries the client's own claim figures", () => {
    expect(site.claims.olxSales).toBe("300+");
    expect(site.claims.instagramOrders).toBe("100+");
  });
});

describe("home content", () => {
  it("splits the slogan into the three briefed lines", () => {
    expect(home.hero.headline).toEqual(["STYLE.", "QUALITY.", "CONFIDENCE."]);
  });

  it("uses the homepage-section CTA labels, not the mockup-prompt ones", () => {
    expect(home.hero.primaryCta.href).toBe("/products");
    expect(home.hero.secondaryCta.href).toBe("/products?sort=newest");
  });

  it("provides exactly four benefit cards", () => {
    expect(home.benefits).toHaveLength(4);
  });

  it("provides the seven always-true why-choose-us claims", () => {
    expect(home.whyChooseUs.items).toHaveLength(7);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: FAIL — `Cannot find module '@/content/site'`.

- [ ] **Step 3: Write `src/content/brand.ts`**

This file exists separately, and **must import nothing**, because `src/lib/seo.ts` consumes it in Task 4 — and `seo.ts` is imported by `opengraph-image.tsx`, `robots.ts`, `sitemap.ts`, and `feed/google-shopping.xml/route.ts`, all of which are lucide-free today. `site.ts` holds live Lucide component references in `footerBenefits`, and those cannot be tree-shaken out of a single object literal, so importing `site` from `seo.ts` would pull the whole icon library into the OG-image runtime and the feed route.

```ts
/**
 * Brand constants. Deliberately dependency-free: src/lib/seo.ts imports this,
 * and seo.ts is consumed by the OG image route, robots, sitemap and the
 * Google Shopping feed. Never add an import to this file — importing site.ts
 * instead would drag lucide-react into all of them.
 */

export const BRAND_NAME = "Mirox Shop";

/** Long form — hero subtitle, footer. */
export const BRAND_TAGLINE = "Modern clothing for those who value quality and minimalism.";

/**
 * Short form for <title>. The long tagline pushes the homepage title past 70
 * characters, which search results truncate.
 */
export const BRAND_META_SUFFIX = "Modern Clothing";
```

- [ ] **Step 4: Write `src/content/site.ts`**

```ts
import { Truck, RefreshCw, ShieldCheck, MessageCircle, type LucideIcon } from "lucide-react";
import { BRAND_NAME, BRAND_TAGLINE } from "./brand";

/**
 * Site-wide content, consumed by the homepage and the Footer.
 *
 * CLIENT-SUPPLIED VALUES — the fields marked below come from the client and
 * cannot be invented by us. An unset value renders nothing rather than a
 * placeholder. Source: docs/reference/client-brief.md.
 */

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

export interface ClientClaims {
  /** CLIENT-SUPPLIED, UNAUDITED (as provided 2026-07-14). null hides the claim. */
  olxSales: string | null;
  instagramOrders: string | null;
  customerRating: string | null;
}

export interface BenefitItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const site = {
  name: BRAND_NAME,
  tagline: BRAND_TAGLINE,

  /** CLIENT-SUPPLIED. Top announcement bar copy; null removes the bar entirely. */
  announcement: "Free delivery on orders over 1000 UAH" as string | null,

  /** CLIENT-SUPPLIED. Placeholder handles until the client confirms real URLs. */
  socials: [
    {
      platform: "instagram",
      label: "Instagram",
      href: "https://instagram.com/miroxshop",
      followers: null,
    },
    { platform: "tiktok", label: "TikTok", href: "https://tiktok.com/@miroxshop", followers: null },
    { platform: "telegram", label: "Telegram", href: "https://t.me/miroxshop", followers: null },
  ] as SocialLink[],

  /**
   * CLIENT-SUPPLIED, UNAUDITED. The client's own claims about their OLX and
   * Instagram sales history, recorded 2026-07-14. Rendered as their claims.
   *
   * These must NEVER feed aggregateRating structured data: the site emits real
   * review markup via seo.ts, and Google's structured-data policy prohibits
   * aggregate ratings that don't correspond to on-site reviews.
   */
  claims: {
    olxSales: "300+",
    instagramOrders: "100+",
    customerRating: null,
  } as ClientClaims,

  /** Footer benefit strip — the concept screenshot's footer row. */
  footerBenefits: [
    { icon: Truck, title: "Free delivery", description: "On orders over 1000 UAH" },
    { icon: RefreshCw, title: "Easy returns", description: "14 days to change your mind" },
    { icon: ShieldCheck, title: "Secure payment", description: "Online or on delivery" },
    { icon: MessageCircle, title: "Support 24/7", description: "We're always here" },
  ] as BenefitItem[],
};
```

Note `customerRating` ships as `null`: unlike the sales figures, a rating claim is checkable against our own review data, so it stays dark until the client supplies a defensible number.

- [ ] **Step 5: Write `src/content/home.ts`**

```ts
import { Truck, RefreshCw, Award, Headphones } from "lucide-react";
import type { BenefitItem } from "./site";

export interface HeroImage {
  src: string;
  alt: string;
}

/**
 * Homepage copy. Single extraction point for TASK-039 i18n — these are plain
 * typed objects with no logic, the shape any i18n library can consume.
 */
export const home = {
  hero: {
    eyebrow: "NEW COLLECTION",
    /** Brief list #1: three separate lines, rendered as three lines. */
    headline: ["STYLE.", "QUALITY.", "CONFIDENCE."],
    subtitle: "Mirox Shop — modern clothing for those who value quality and minimalism.",
    primaryCta: { label: "Shop the Catalog", href: "/products" },
    secondaryCta: { label: "New Arrivals", href: "/products?sort=newest" },
    /**
     * CLIENT-SUPPLIED. Set to null to render the centred typographic hero.
     * Currently an AI-generated placeholder: unbranded clothing only, never a
     * fabricated Mirox logo, and subject to client sign-off before production.
     */
    image: {
      src: "/hero-placeholder-ai.jpg",
      alt: "Model wearing a black hoodie against a dark background",
    } as HeroImage | null,
  },

  benefits: [
    { icon: Truck, title: "Fast delivery", description: "1–3 days across Ukraine" },
    { icon: RefreshCw, title: "Size exchange", description: "Wrong fit? Swap it" },
    { icon: Award, title: "Premium quality", description: "Only the best fabrics" },
    { icon: Headphones, title: "Support 24/7", description: "We're always in touch" },
  ] as BenefitItem[],

  whyChooseUs: {
    title: "Why choose us",
    /**
     * Seven statements true by construction, or unfalsifiable brand voice.
     * The brief's three checkable claims live in site.claims and are rendered
     * separately, gated on being configured.
     */
    items: [
      "Fast delivery across Ukraine",
      "Every item checked before shipping",
      "Size exchange",
      "Support seven days a week",
      "Quality clothing only",
      "Secure payment",
      "Trusted by returning customers",
    ],
  },

  rails: {
    featured: {
      title: "Featured",
      viewAllHref: "/products?featured=true",
      viewAllLabel: "View all",
    },
    bestsellers: {
      title: "Bestsellers",
      // Interim target: no "popular" sort exists until TASK-036 adds one.
      viewAllHref: "/products?sort=newest",
      viewAllLabel: "View all",
    },
  },

  testimonials: { title: "What our customers say" },

  social: {
    title: "Follow us",
    subtitle: "Follow along to hear about new arrivals first.",
  },
};
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 7: Verify `brand.ts` stayed dependency-free**

Run: `grep -c "^import" src/content/brand.ts || true`
Expected: `0`. Any import here defeats the file's entire purpose — see Step 3.

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/content tests/unit/content.test.ts
git commit -m "feat(home): add typed content modules for site and homepage copy

Single extraction point for TASK-039 i18n and single enumeration point for
client-owed content. Follower counts and the rating claim default to null so
nothing fabricated can render."
```

---

## Task 3: Product queries and the bestseller definition

**Files:**

- Create: `src/lib/product-queries.ts`
- Modify: `prisma/schema.prisma` (add one index to `OrderItem`)
- Create: migration under `prisma/migrations/`
- Test: `tests/unit/product-queries.test.ts`

**Interfaces:**

- Consumes: `prisma` from `@/lib/db`
- Produces:
  - `interface ProductCardData` — the serialized shape `ProductCard` accepts (`price`/`comparePrice` as strings, not Decimal)
  - `getFeaturedProducts(limit?: number): Promise<ProductCardData[]>`
  - `getNewArrivals(limit?: number): Promise<ProductCardData[]>`
  - `type BestsellerSource = "orders" | "backfilled" | "mixed"`
  - `getBestsellers(limit?: number, windowDays?: number): Promise<{ products: ProductCardData[]; source: BestsellerSource }>`
  - **TASK-036 imports `getBestsellers` for its "popular" sort.**

- [ ] **Step 1: Confirm which database `DATABASE_URL` resolves to — do NOT skip**

`.env` contains a **duplicate `DATABASE_URL`**, and dotenv is last-wins, so the live Neon production URL can silently win over local Postgres. `prisma migrate dev` against production would be destructive.

Run:

```bash
grep -n "DATABASE_URL" .env
node -e "require('dotenv').config(); const u=process.env.DATABASE_URL; console.log(u.replace(/:[^:@]+@/, ':***@'))"
```

Expected: the printed URL points at **localhost/127.0.0.1** (local Docker Postgres, host port 5433). If it prints a `neon.tech` host, **stop** — remove or reorder the duplicate so the local URL wins, then re-run. Do not proceed to Step 3 until this prints a local host.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/product-queries.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    orderItem: { groupBy: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { getBestsellers, getFeaturedProducts, getNewArrivals } from "@/lib/product-queries";

const findMany = prisma.product.findMany as unknown as ReturnType<typeof vi.fn>;
const groupBy = prisma.orderItem.groupBy as unknown as ReturnType<typeof vi.fn>;

/** Minimal row shaped like the PRODUCT_CARD_SELECT result. */
function row(id: string, name = `Product ${id}`) {
  return {
    id,
    name,
    slug: `product-${id}`,
    shortDesc: null,
    price: { toString: () => "100.00" },
    comparePrice: null,
    stock: 5,
    isFeatured: false,
    category: { name: "Hoodies", slug: "hoodies" },
    images: [{ url: "https://example.com/a.jpg", alt: null }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getFeaturedProducts", () => {
  it("queries active featured products and serializes Decimal price to string", async () => {
    findMany.mockResolvedValue([row("a")]);

    const result = await getFeaturedProducts(4);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, isFeatured: true },
        take: 4,
      })
    );
    expect(result[0].price).toBe("100.00");
    expect(result[0].comparePrice).toBeNull();
  });
});

describe("getNewArrivals", () => {
  it("orders by createdAt descending", async () => {
    findMany.mockResolvedValue([]);

    await getNewArrivals(3);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
    );
  });
});

describe("getBestsellers", () => {
  it("counts only orders whose sale stuck, within the window", async () => {
    groupBy.mockResolvedValue([]);
    findMany.mockResolvedValue([]);

    await getBestsellers(4, 90);

    const arg = groupBy.mock.calls[0][0];
    expect(arg.by).toEqual(["productId"]);
    expect(arg.where.order.status.in).toEqual(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]);
    expect(arg.where.order.status.in).not.toContain("PENDING");
    expect(arg.where.order.status.in).not.toContain("CANCELLED");
    expect(arg.where.order.status.in).not.toContain("REFUNDED");
    expect(arg.where.order.createdAt.gte).toBeInstanceOf(Date);
    expect(arg.orderBy).toEqual({ _sum: { quantity: "desc" } });
  });

  it("reports source 'orders' when order data alone fills the rail", async () => {
    groupBy.mockResolvedValue([
      { productId: "a", _sum: { quantity: 9 } },
      { productId: "b", _sum: { quantity: 4 } },
    ]);
    findMany.mockResolvedValueOnce([row("a"), row("b")]);

    const result = await getBestsellers(2);

    expect(result.source).toBe("orders");
    expect(result.products.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("preserves sales ranking even though findMany returns arbitrary order", async () => {
    groupBy.mockResolvedValue([
      { productId: "a", _sum: { quantity: 9 } },
      { productId: "b", _sum: { quantity: 4 } },
    ]);
    // Prisma's `in` filter does not preserve the order of the id list.
    findMany.mockResolvedValueOnce([row("b"), row("a")]);

    const result = await getBestsellers(2);

    expect(result.products.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("backfills from new arrivals and reports 'mixed' when history is thin", async () => {
    groupBy.mockResolvedValue([{ productId: "a", _sum: { quantity: 9 } }]);
    findMany
      .mockResolvedValueOnce([row("a")]) // ranked lookup
      .mockResolvedValueOnce([row("a"), row("b"), row("c")]); // new arrivals backfill

    const result = await getBestsellers(3);

    expect(result.source).toBe("mixed");
    // "a" came from orders and must not be duplicated by the backfill.
    expect(result.products.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("reports 'backfilled' when there is no qualifying order history at all", async () => {
    groupBy.mockResolvedValue([]);
    findMany.mockResolvedValueOnce([row("x"), row("y")]);

    const result = await getBestsellers(2);

    expect(result.source).toBe("backfilled");
    expect(result.products.map((p) => p.id)).toEqual(["x", "y"]);
  });

  it("excludes inactive products that still have sales history", async () => {
    groupBy.mockResolvedValue([
      { productId: "a", _sum: { quantity: 9 } },
      { productId: "gone", _sum: { quantity: 8 } },
    ]);
    // "gone" is filtered out by the isActive clause, so findMany omits it.
    findMany.mockResolvedValueOnce([row("a")]).mockResolvedValueOnce([]);

    const result = await getBestsellers(2);

    expect(result.products.map((p) => p.id)).toEqual(["a"]);
    expect(findMany.mock.calls[0][0].where).toEqual(expect.objectContaining({ isActive: true }));
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/unit/product-queries.test.ts`
Expected: FAIL — `Cannot find module '@/lib/product-queries'`.

- [ ] **Step 4: Write `src/lib/product-queries.ts`**

```ts
import { prisma } from "@/lib/db";

/**
 * Serialized product shape consumed by <ProductCard>. Prisma returns Decimal
 * for price fields, which cannot cross the server/client boundary — these are
 * stringified here so callers never have to remember to do it.
 */
export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  price: string;
  comparePrice: string | null;
  stock: number;
  isFeatured: boolean;
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
}

/**
 * Order statuses representing a sale that actually stuck. PENDING is excluded
 * because the sale isn't real yet; CANCELLED and REFUNDED because it didn't
 * hold. Kept as string literals so the list is assertable in tests without
 * importing the Prisma enum.
 */
const COUNTED_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

const PRODUCT_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  shortDesc: true,
  price: true,
  comparePrice: true,
  stock: true,
  isFeatured: true,
  category: { select: { name: true, slug: true } },
  images: {
    select: { url: true, alt: true },
    orderBy: { position: "asc" as const },
    take: 1,
  },
};

type RawProduct = Omit<ProductCardData, "price" | "comparePrice"> & {
  price: { toString(): string };
  comparePrice: { toString(): string } | null;
};

function serialize(product: RawProduct): ProductCardData {
  return {
    ...product,
    price: product.price.toString(),
    comparePrice: product.comparePrice?.toString() ?? null,
  };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    select: PRODUCT_CARD_SELECT,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return (products as RawProduct[]).map(serialize);
}

export async function getNewArrivals(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: PRODUCT_CARD_SELECT,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return (products as RawProduct[]).map(serialize);
}

/**
 * Where the bestsellers came from. Exposed so callers never present new
 * arrivals as bestsellers without knowing they're doing it.
 */
export type BestsellerSource = "orders" | "backfilled" | "mixed";

export interface BestsellerResult {
  products: ProductCardData[];
  source: BestsellerSource;
}

/**
 * Real bestsellers: units sold per product over a trailing window, counting
 * only orders that stuck. Backfills from new arrivals when order history is
 * too thin to fill the rail — the normal state of a new store.
 *
 * This is the shared definition of "popular"; TASK-036 imports it for the
 * catalog sort rather than defining a second one.
 */
export async function getBestsellers(limit = 8, windowDays = 90): Promise<BestsellerResult> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { status: { in: [...COUNTED_STATUSES] }, createdAt: { gte: since } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const rankedIds = grouped.map((group) => group.productId);

  const ranked = rankedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: rankedIds }, isActive: true },
        select: PRODUCT_CARD_SELECT,
      })
    : [];

  // Prisma's `in` filter returns rows in arbitrary order, so re-impose the
  // sales ranking rather than trusting the query's ordering.
  const byId = new Map((ranked as RawProduct[]).map((p) => [p.id, p]));
  const fromOrders = rankedIds
    .map((id) => byId.get(id))
    .filter((p): p is RawProduct => p !== undefined)
    .map(serialize);

  if (fromOrders.length >= limit) {
    return { products: fromOrders, source: "orders" };
  }

  const seen = new Set(fromOrders.map((p) => p.id));
  const backfill = (await getNewArrivals(limit + fromOrders.length))
    .filter((p) => !seen.has(p.id))
    .slice(0, limit - fromOrders.length);

  return {
    products: [...fromOrders, ...backfill],
    source: fromOrders.length === 0 ? "backfilled" : "mixed",
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/unit/product-queries.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 6: Add the supporting index to the schema**

The bestseller `groupBy` filters and groups on `productId`, which has no index — only `orderId` does.

In `prisma/schema.prisma`, in `model OrderItem`, change:

```prisma
  @@index([orderId])
  @@map("order_items")
```

to:

```prisma
  @@index([orderId])
  @@index([productId])
  @@map("order_items")
```

- [ ] **Step 7: Generate the migration**

Re-confirm Step 1's output still shows a local host, then run:

```bash
npm run db:migrate -- --name add_order_item_product_index
```

Expected: a new directory under `prisma/migrations/` containing `CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");` and Prisma reporting the migration applied.

- [ ] **Step 8: Regenerate the client and typecheck**

Run: `npm run db:generate && npm run typecheck`
Expected: both succeed with no errors.

- [ ] **Step 9: Commit**

```bash
git add src/lib/product-queries.ts tests/unit/product-queries.test.ts \
  prisma/schema.prisma prisma/migrations
git commit -m "feat(home): add product queries with a real bestseller definition

Bestsellers count units sold over a trailing window, excluding PENDING,
CANCELLED and REFUNDED orders, and backfill from new arrivals when history
is thin — reporting which source was used rather than silently passing new
arrivals off as bestsellers. TASK-036 imports this for its popular sort.

Adds the missing OrderItem.productId index the groupBy needs."
```

---

## Task 4: Homepage metadata rebrand

The homepage `<title>` currently renders **"Store | Quality Products, Great Prices"** in production, because `NEXT_PUBLIC_STORE_NAME` is unset and `seo.ts` falls back to the literal `"Store"`. A homepage rebrand that leaves that in place has not rebranded the homepage.

**Files:**

- Modify: `src/lib/seo.ts:5` and `getHomeMetadata()`
- Test: `tests/unit/seo.test.ts` (existing file — add cases)

**Interfaces:**

- Consumes: `BRAND_NAME`, `BRAND_META_SUFFIX` from `@/content/brand` (Task 2) — **not** `site.ts`
- Produces: no new exports; `getHomeMetadata()` behaviour changes

- [ ] **Step 1: Read the existing test file first**

Run: `grep -n "getHomeMetadata\|siteConfig" tests/unit/seo.test.ts`
Expected: existing assertions that may hardcode `"Store"`. Any that do must be updated in Step 4, not left failing.

- [ ] **Step 2: Write the failing test**

Append to `tests/unit/seo.test.ts`:

```ts
describe("getHomeMetadata brand", () => {
  it("falls back to the Mirox brand name, never the generic 'Store'", () => {
    const metadata = getHomeMetadata();
    const title = (metadata.title as { absolute: string }).absolute;
    expect(title).toContain("Mirox Shop");
    expect(title).not.toContain("Store |");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/unit/seo.test.ts -t "Mirox brand"`
Expected: FAIL — title is `"Store | Quality Products, Great Prices"`.

- [ ] **Step 4: Update `src/lib/seo.ts`**

Add the import at the top of the file. **Import from `@/content/brand`, never from `@/content/site`** — `site.ts` holds live Lucide component references in `footerBenefits` which cannot be tree-shaken out of a single object literal, and `seo.ts` is imported by `opengraph-image.tsx`, `robots.ts`, `sitemap.ts` and `feed/google-shopping.xml/route.ts`, all lucide-free today.

```ts
import { BRAND_NAME, BRAND_META_SUFFIX } from "@/content/brand";
```

Change line 5 from:

```ts
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Store",
```

to:

```ts
  // Env var still wins so deployments can override, but the fallback is the
  // real brand rather than the generic "Store" placeholder. Setting
  // NEXT_PUBLIC_STORE_NAME in production remains BACKLOG'd.
  name: process.env.NEXT_PUBLIC_STORE_NAME || BRAND_NAME,
```

Change `getHomeMetadata()` to use brand copy instead of the template line. Use the **short** suffix: the long tagline would push the title past 70 characters, which search results truncate.

```ts
export function getHomeMetadata(): Metadata {
  return {
    title: {
      absolute: `${siteConfig.name} — ${BRAND_META_SUFFIX}`,
    },
    description: siteConfig.description,
    alternates: {
      canonical: siteConfig.url,
    },
  };
}
```

Then update any pre-existing assertion in `tests/unit/seo.test.ts` that expected the literal `"Store"` or the old suffix.

- [ ] **Step 5: Run the full seo suite**

Run: `npx vitest run tests/unit/seo.test.ts`
Expected: PASS, all tests including the pre-existing ones.

- [ ] **Step 6: Verify no icon library leaked into the metadata layer**

Run: `grep -n "content/site\|lucide" src/lib/seo.ts || echo "clean"`
Expected: `clean`. A hit means `seo.ts` now drags `lucide-react` into the OG-image route, robots, sitemap and the Google Shopping feed — import from `@/content/brand` instead.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seo.ts tests/unit/seo.test.ts
git commit -m "fix(seo): brand the homepage title as Mirox Shop, not 'Store'

NEXT_PUBLIC_STORE_NAME is unset in production, so the fallback was rendering
'Store | Quality Products, Great Prices' as the homepage title, OG title and
JSON-LD name. Fallback now resolves to the real brand."
```

---

## Task 5: AnnouncementBar

**Files:**

- Create: `src/components/common/AnnouncementBar.tsx`
- Modify: `src/components/common/index.ts`
- Modify: `src/app/(shop)/layout.tsx`
- Test: `tests/unit/announcement-bar.test.tsx`

**Interfaces:**

- Consumes: `site.announcement` from Task 2
- Produces: `<AnnouncementBar />` — no props; reads content itself. Mounted once in the shop layout, above `<Header/>`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/announcement-bar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSite = { announcement: "Free delivery on orders over 1000 UAH" as string | null };
vi.mock("@/content/site", () => ({
  get site() {
    return mockSite;
  },
}));

import { AnnouncementBar } from "@/components/common/AnnouncementBar";

beforeEach(() => {
  window.localStorage.clear();
  mockSite.announcement = "Free delivery on orders over 1000 UAH";
});

afterEach(() => {
  window.localStorage.clear();
});

describe("AnnouncementBar", () => {
  it("renders the configured announcement", () => {
    render(<AnnouncementBar />);
    expect(screen.getByText("Free delivery on orders over 1000 UAH")).toBeInTheDocument();
  });

  it("renders nothing when no announcement is configured", () => {
    mockSite.announcement = null;
    const { container } = render(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden once dismissed", () => {
    window.localStorage.setItem("mirox:announcement-dismissed", "1");
    const { container } = render(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes an accessible dismiss control", () => {
    render(<AnnouncementBar />);
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/announcement-bar.test.tsx`
Expected: FAIL — `Cannot find module '@/components/common/AnnouncementBar'`.

- [ ] **Step 3: Write the component**

```tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { site } from "@/content/site";

const DISMISSED_KEY = "mirox:announcement-dismissed";

/**
 * Top announcement bar (client brief list #2 item 13).
 *
 * Deliberately NOT sticky: the header below it is `sticky top-0`, so leaving
 * this unpinned lets it scroll away instead of permanently eating viewport on
 * mobile. Cookie consent is bottom-anchored, so the two never stack.
 *
 * The admin-managed version of this banner is TASK-047.
 */
export function AnnouncementBar() {
  // Start hidden and reveal after mount: reading localStorage during render
  // would desync server and client HTML and trip a hydration mismatch.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");
  }, []);

  if (!site.announcement || dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <div data-surface="dark" className="bg-background text-foreground">
      <div className="container flex items-center justify-center gap-4 py-2">
        <p className="text-center text-xs tracking-wide">{site.announcement}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/announcement-bar.test.tsx`
Expected: PASS, 4 tests.

Note the first test passes because `useEffect` runs synchronously under Testing Library's `render`, resolving `dismissed` to `false` before assertion.

- [ ] **Step 5: Export from the barrel**

In `src/components/common/index.ts`, add:

```ts
export { AnnouncementBar } from "./AnnouncementBar";
```

- [ ] **Step 6: Mount in the shop layout**

In `src/app/(shop)/layout.tsx`, change the import and add the bar above the header:

```tsx
import { Header, Footer, AnnouncementBar } from "@/components/common";
```

```tsx
<div className="flex min-h-screen flex-col">
  <AnnouncementBar />
  <Header />
  <main className="flex-1">{children}</main>
  <Footer />
  <CartDrawer />
</div>
```

- [ ] **Step 7: Verify the full suite and types**

Run: `npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/common/AnnouncementBar.tsx src/components/common/index.ts \
  "src/app/(shop)/layout.tsx" tests/unit/announcement-bar.test.tsx
git commit -m "feat(home): add dismissible site-wide announcement bar

Client brief list #2 item 13. Unpinned so it scrolls away beneath the sticky
header; hidden entirely when site.announcement is null."
```

---

## Task 6: Shared content-driven components — BenefitStrip and SocialLinks

Both live in `common/` rather than `home/` because the Footer consumes them too. `src/components/common` is already in the colour guard's `SCAN_PATHS`, so both are covered the moment they exist.

**Files:**

- Create: `src/components/common/BenefitStrip.tsx`
- Create: `src/components/common/SocialLinks.tsx`
- Modify: `src/components/common/index.ts`
- Test: `tests/unit/benefit-strip.test.tsx`
- Test: `tests/unit/social-links.test.tsx`

**Interfaces:**

- Consumes: `BenefitItem`, `SocialLink` types and `site.socials` from Task 2
- Produces:
  - `<BenefitStrip items={BenefitItem[]} className?: string />` — takes items as a **prop** so the hero and footer instances can differ in content while sharing structure
  - `<SocialLinks className?: string />` — reads `site.socials` itself

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/benefit-strip.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Truck, Award } from "lucide-react";
import { BenefitStrip } from "@/components/common/BenefitStrip";

const items = [
  { icon: Truck, title: "Fast delivery", description: "1–3 days across Ukraine" },
  { icon: Award, title: "Premium quality", description: "Only the best fabrics" },
];

describe("BenefitStrip", () => {
  it("renders every supplied item", () => {
    render(<BenefitStrip items={items} />);
    expect(screen.getByText("Fast delivery")).toBeInTheDocument();
    expect(screen.getByText("Premium quality")).toBeInTheDocument();
  });

  it("renders each item's description", () => {
    render(<BenefitStrip items={items} />);
    expect(screen.getByText("1–3 days across Ukraine")).toBeInTheDocument();
  });

  it("renders nothing when given no items", () => {
    const { container } = render(<BenefitStrip items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

Create `tests/unit/social-links.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const mockSocials = [
  { platform: "instagram", label: "Instagram", href: "https://instagram.com/x", followers: null },
  { platform: "tiktok", label: "TikTok", href: "https://tiktok.com/@x", followers: 12500 },
];
vi.mock("@/content/site", () => ({
  site: {
    get socials() {
      return mockSocials;
    },
  },
}));

import { SocialLinks } from "@/components/common/SocialLinks";

describe("SocialLinks", () => {
  it("renders a link per configured platform", () => {
    render(<SocialLinks />);
    expect(screen.getByRole("link", { name: /Instagram/ })).toHaveAttribute(
      "href",
      "https://instagram.com/x"
    );
    expect(screen.getByRole("link", { name: /TikTok/ })).toBeInTheDocument();
  });

  it("shows a counter only for platforms with a real follower count", () => {
    render(<SocialLinks />);
    // TikTok has 12500 and renders formatted; Instagram has null and renders none.
    expect(screen.getByText("12.5K")).toBeInTheDocument();
    expect(screen.queryByText("null")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("opens external profiles safely", () => {
    render(<SocialLinks />);
    const link = screen.getByRole("link", { name: /Instagram/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
```

- [ ] **Step 2: Run both tests to verify they fail**

Run: `npx vitest run tests/unit/benefit-strip.test.tsx tests/unit/social-links.test.tsx`
Expected: FAIL — both modules missing.

- [ ] **Step 3: Write `src/components/common/BenefitStrip.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { BenefitItem } from "@/content/site";

interface BenefitStripProps {
  items: BenefitItem[];
  className?: string;
}

/**
 * Horizontal benefit row. Content arrives as a prop because the hero and the
 * footer show different items (delivery/exchange/quality/support vs
 * delivery/returns/payment/support) with identical structure.
 */
export function BenefitStrip({ items, className }: BenefitStripProps) {
  if (items.length === 0) return null;

  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Write `src/components/common/SocialLinks.tsx`**

```tsx
import { Instagram, Send, Music2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { site, type SocialLink } from "@/content/site";

// lucide has no TikTok or Telegram brand glyph; Music2 and Send are the
// conventional stand-ins and keep the set monochrome and consistent.
const ICONS: Record<SocialLink["platform"], LucideIcon> = {
  instagram: Instagram,
  tiktok: Music2,
  telegram: Send,
};

/**
 * Follower counts render ONLY when a real number is configured. TODO.md's
 * acceptance criterion is explicit that counters appear only if real numbers
 * are supplied, and fabricated social proof is out of scope per TASK-051.
 */
function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

interface SocialLinksProps {
  className?: string;
}

export function SocialLinks({ className }: SocialLinksProps) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-4", className)}>
      {site.socials.map((social) => {
        const Icon = ICONS[social.platform];
        return (
          <li key={social.platform}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground inline-flex items-center gap-2 text-sm transition-colors"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{social.label}</span>
              {social.followers !== null && (
                <span className="text-muted-foreground text-xs">
                  {formatFollowers(social.followers)}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 5: Run both tests to verify they pass**

Run: `npx vitest run tests/unit/benefit-strip.test.tsx tests/unit/social-links.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 6: Export from the barrel**

In `src/components/common/index.ts`, add:

```ts
export { BenefitStrip } from "./BenefitStrip";
export { SocialLinks } from "./SocialLinks";
```

- [ ] **Step 7: Commit**

```bash
git add src/components/common/BenefitStrip.tsx src/components/common/SocialLinks.tsx \
  src/components/common/index.ts tests/unit/benefit-strip.test.tsx tests/unit/social-links.test.tsx
git commit -m "feat(home): add shared BenefitStrip and SocialLinks components

Both are consumed by the homepage and the footer, so they live in common/.
Follower counters render only when a real number is configured."
```

---

## Task 7: Hero

**Files:**

- Create: `src/components/home/Hero.tsx`
- Create: `src/components/home/index.ts`
- Create: `public/hero-placeholder-ai.jpg`
- Test: `tests/unit/hero.test.tsx`

**Interfaces:**

- Consumes: `home.hero` and `home.benefits` from Task 2, `<BenefitStrip>` from Task 6
- Produces: `<Hero />` — no props; reads content itself

- [ ] **Step 1: Write the failing test**

Create `tests/unit/hero.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Truck } from "lucide-react";

const mockHero = {
  eyebrow: "NEW COLLECTION",
  headline: ["STYLE.", "QUALITY.", "CONFIDENCE."],
  subtitle: "Mirox Shop — modern clothing for those who value quality and minimalism.",
  primaryCta: { label: "Shop the Catalog", href: "/products" },
  secondaryCta: { label: "New Arrivals", href: "/products?sort=newest" },
  image: { src: "/hero-placeholder-ai.jpg", alt: "Model wearing a black hoodie" } as {
    src: string;
    alt: string;
  } | null,
};

vi.mock("@/content/home", () => ({
  home: {
    get hero() {
      return mockHero;
    },
    benefits: [{ icon: Truck, title: "Fast delivery", description: "1–3 days" }],
  },
}));

import { Hero } from "@/components/home/Hero";

describe("Hero", () => {
  it("renders all three slogan lines", () => {
    render(<Hero />);
    expect(screen.getByText("STYLE.")).toBeInTheDocument();
    expect(screen.getByText("QUALITY.")).toBeInTheDocument();
    expect(screen.getByText("CONFIDENCE.")).toBeInTheDocument();
  });

  it("renders the slogan as a single h1 for document outline", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("STYLE.");
    expect(heading).toHaveTextContent("CONFIDENCE.");
  });

  it("renders both CTAs pointing at the briefed destinations", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Shop the Catalog" })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(screen.getByRole("link", { name: "New Arrivals" })).toHaveAttribute(
      "href",
      "/products?sort=newest"
    );
  });

  it("sits on an inverted surface", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector('[data-surface="dark"]')).not.toBeNull();
  });

  it("renders the photo when one is configured", () => {
    mockHero.image = { src: "/hero-placeholder-ai.jpg", alt: "Model wearing a black hoodie" };
    render(<Hero />);
    expect(screen.getByAltText("Model wearing a black hoodie")).toBeInTheDocument();
  });

  it("still renders a complete hero when no photo is configured", () => {
    mockHero.image = null;
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop the Catalog" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    mockHero.image = { src: "/hero-placeholder-ai.jpg", alt: "Model wearing a black hoodie" };
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/hero.test.tsx`
Expected: FAIL — `Cannot find module '@/components/home/Hero'`.

- [ ] **Step 3: Write the component**

```tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BenefitStrip } from "@/components/common/BenefitStrip";
import { DEFAULT_BLUR_DATA_URL } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { home } from "@/content/home";

/**
 * Hero — client brief list #1, first screen.
 *
 * One component, two layouts. With no configured image it renders centred and
 * typographic; with an image it renders two-column, matching the concept
 * screenshot. Both states are deliberate and finished, so dropping the photo
 * is a one-line content change rather than a redesign.
 */
export function Hero() {
  const { eyebrow, headline, subtitle, primaryCta, secondaryCta, image } = home.hero;
  const hasImage = image !== null;

  return (
    <section data-surface="dark" className="bg-background text-foreground">
      <div className="container py-16 md:py-24">
        <div
          className={cn(
            "gap-12",
            hasImage ? "grid items-center lg:grid-cols-2" : "mx-auto max-w-3xl text-center"
          )}
        >
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-[0.2em]">{eyebrow}</p>

            <h1 className="font-heading mt-6 text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              {headline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <p className="text-muted-foreground mt-6 text-base sm:text-lg">{subtitle}</p>

            <div
              className={cn(
                "mt-10 flex flex-col gap-4 sm:flex-row",
                !hasImage && "sm:justify-center"
              )}
            >
              <Button asChild size="lg">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
              </Button>
            </div>
          </div>

          {hasImage && (
            <div className="relative aspect-[4/5] w-full overflow-hidden lg:aspect-[3/4]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                // This is the LCP element: eager, sized, and blurred-in.
                priority
                // Not IMAGE_SIZES.hero ("100vw") — that over-fetches badly for
                // a half-width column on desktop and costs LCP against the
                // PageSpeed 95+ target.
                sizes="(max-width: 1024px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={DEFAULT_BLUR_DATA_URL}
                className="object-cover"
              />
            </div>
          )}
        </div>

        <BenefitStrip items={home.benefits} className="border-border mt-16 border-t pt-10" />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/hero.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Generate the placeholder hero image**

Generate a photorealistic image matching the concept: a model in **plain, unbranded** black clothing against a dark background, portrait orientation, roughly 1200×1600.

Three constraints from the spec, all mandatory:

1. **No Mirox logo or any brand mark on the garment** — an AI-rendered logo depicts merchandise that does not exist.
2. Save as `public/hero-placeholder-ai.jpg`. The filename must keep the `placeholder-ai` marker so it is never mistaken for a client asset.
3. Note in the commit body that client sign-off is required before production.

Verify: `ls -la public/hero-placeholder-ai.jpg` — expected: file present, under ~400 KB.

- [ ] **Step 6: Create the barrel export**

Create `src/components/home/index.ts`:

```ts
export { Hero } from "./Hero";
```

- [ ] **Step 7: Commit**

```bash
git add src/components/home/Hero.tsx src/components/home/index.ts \
  public/hero-placeholder-ai.jpg tests/unit/hero.test.tsx
git commit -m "feat(home): add Mirox hero with additive photo slot

Typographic-complete: renders centred with no image, two-column with one, so
removing the photo is a content change not a redesign. Image is an AI-generated
placeholder with unbranded clothing — client sign-off required before production."
```

---

## Task 8: ProductRail

**Files:**

- Create: `src/components/home/ProductRail.tsx`
- Modify: `src/components/home/index.ts`
- Test: `tests/unit/product-rail.test.tsx`

**Interfaces:**

- Consumes: `ProductCardData` from Task 3, `<ProductCard>` (existing)
- Produces: `<ProductRail title={string} products={ProductCardData[]} viewAllHref={string} viewAllLabel={string} />`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/product-rail.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProductRail } from "@/components/home/ProductRail";
import type { ProductCardData } from "@/lib/product-queries";

const products: ProductCardData[] = [
  {
    id: "a",
    name: "Mirox Basic Hoodie",
    slug: "mirox-basic-hoodie",
    shortDesc: null,
    price: "1290.00",
    comparePrice: null,
    stock: 7,
    isFeatured: true,
    category: { name: "Hoodies", slug: "hoodies" },
    images: [{ url: "https://example.com/a.jpg", alt: null }],
  },
];

describe("ProductRail", () => {
  it("renders the heading and the view-all link", () => {
    render(
      <ProductRail
        title="Bestsellers"
        products={products}
        viewAllHref="/products?sort=newest"
        viewAllLabel="View all"
      />
    );
    expect(screen.getByRole("heading", { name: "Bestsellers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View all/ })).toHaveAttribute(
      "href",
      "/products?sort=newest"
    );
  });

  it("renders a card per product", () => {
    render(
      <ProductRail
        title="Featured"
        products={products}
        viewAllHref="/products"
        viewAllLabel="View all"
      />
    );
    expect(screen.getByText("Mirox Basic Hoodie")).toBeInTheDocument();
  });

  it("renders nothing at all when there are no products", () => {
    const { container } = render(
      <ProductRail title="Featured" products={[]} viewAllHref="/products" viewAllLabel="View all" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/product-rail.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Write the component**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/products";
import { FadeIn } from "@/components/common/FadeIn";
import type { ProductCardData } from "@/lib/product-queries";

interface ProductRailProps {
  title: string;
  products: ProductCardData[];
  viewAllHref: string;
  viewAllLabel: string;
}

/**
 * A titled row of products. Renders nothing when empty, so a new store gets a
 * shorter coherent page rather than an empty rail.
 */
export function ProductRail({ title, products, viewAllHref, viewAllLabel }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section className="container py-16">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          <Link
            href={viewAllHref}
            className="hover:text-muted-foreground text-sm font-medium transition-colors"
          >
            {viewAllLabel}
            <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/product-rail.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Add to the barrel**

In `src/components/home/index.ts`, add:

```ts
export { ProductRail } from "./ProductRail";
```

- [ ] **Step 6: Commit**

```bash
git add src/components/home/ProductRail.tsx src/components/home/index.ts \
  tests/unit/product-rail.test.tsx
git commit -m "feat(home): add ProductRail shared by featured and bestseller sections"
```

---

## Task 9: WhyChooseUs

**Files:**

- Create: `src/components/home/WhyChooseUs.tsx`
- Modify: `src/components/home/index.ts`
- Test: `tests/unit/why-choose-us.test.tsx`

**Interfaces:**

- Consumes: `home.whyChooseUs` and `site.claims` from Task 2
- Produces: `<WhyChooseUs />` — no props

- [ ] **Step 1: Write the failing test**

Create `tests/unit/why-choose-us.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ClientClaims } from "@/content/site";

const mockClaims: ClientClaims = {
  olxSales: "300+",
  instagramOrders: "100+",
  customerRating: null,
};

vi.mock("@/content/site", () => ({
  site: {
    get claims() {
      return mockClaims;
    },
  },
}));

vi.mock("@/content/home", () => ({
  home: {
    whyChooseUs: {
      title: "Why choose us",
      items: ["Fast delivery across Ukraine", "Secure payment"],
    },
  },
}));

import { WhyChooseUs } from "@/components/home/WhyChooseUs";

beforeEach(() => {
  mockClaims.olxSales = "300+";
  mockClaims.instagramOrders = "100+";
  mockClaims.customerRating = null;
});

describe("WhyChooseUs", () => {
  it("renders every always-true claim", () => {
    render(<WhyChooseUs />);
    expect(screen.getByText("Fast delivery across Ukraine")).toBeInTheDocument();
    expect(screen.getByText("Secure payment")).toBeInTheDocument();
  });

  it("renders configured client claims", () => {
    render(<WhyChooseUs />);
    expect(screen.getByText(/300\+/)).toBeInTheDocument();
    expect(screen.getByText(/100\+/)).toBeInTheDocument();
  });

  // Non-vacuity: the test above proves claims CAN render, so this one failing
  // to find them is meaningful rather than a component that renders nothing.
  it("omits client claims that are not configured", () => {
    render(<WhyChooseUs />);
    expect(screen.queryByText(/rating/i)).not.toBeInTheDocument();
  });

  it("omits all client claims when none are configured", () => {
    mockClaims.olxSales = null;
    mockClaims.instagramOrders = null;
    render(<WhyChooseUs />);
    expect(screen.queryByText(/300\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/100\+/)).not.toBeInTheDocument();
    // The always-true claims must survive.
    expect(screen.getByText("Secure payment")).toBeInTheDocument();
  });

  it("renders the customer rating claim once it is configured", () => {
    mockClaims.customerRating = "4.9";
    render(<WhyChooseUs />);
    expect(screen.getByText(/4\.9/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/why-choose-us.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Write the component**

```tsx
import { Check } from "lucide-react";
import { FadeIn } from "@/components/common/FadeIn";
import { home } from "@/content/home";
import { site } from "@/content/site";

/**
 * "Why choose us" — client brief list #1, a 10-item list whose items are not
 * all the same kind of statement.
 *
 * Seven are policy claims true by construction, or unfalsifiable brand voice;
 * they ship as static copy. Three are checkable claims about the client's own
 * sales history and reputation; those live in site.claims and render only when
 * the client has supplied a figure. None of them may feed aggregateRating
 * structured data — see site.ts.
 */
export function WhyChooseUs() {
  const { title, items } = home.whyChooseUs;
  const { olxSales, instagramOrders, customerRating } = site.claims;

  const clientClaims = [
    olxSales && `${olxSales} successful sales on OLX`,
    instagramOrders && `${instagramOrders} orders through Instagram`,
    customerRating && `${customerRating} average customer rating`,
  ].filter((claim): claim is string => Boolean(claim));

  return (
    <section className="bg-muted/40 py-16">
      <div className="container">
        <FadeIn>
          <h2 className="font-heading text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>

          <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {[...clientClaims, ...items].map((claim) => (
              <li key={claim} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-sm">{claim}</span>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/why-choose-us.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Add to the barrel**

In `src/components/home/index.ts`, add:

```ts
export { WhyChooseUs } from "./WhyChooseUs";
```

- [ ] **Step 6: Commit**

```bash
git add src/components/home/WhyChooseUs.tsx src/components/home/index.ts \
  tests/unit/why-choose-us.test.tsx
git commit -m "feat(home): add Why-Choose-Us with config-gated client claims

Policy claims ship as static copy; the client's checkable sales and rating
figures render only when supplied, and never feed structured data."
```

---

## Task 10: Testimonials

**Files:**

- Create: `src/lib/review-queries.ts`
- Create: `src/components/home/Testimonials.tsx`
- Modify: `src/components/home/index.ts`
- Test: `tests/unit/review-queries.test.ts`
- Test: `tests/unit/testimonials.test.tsx`

**Interfaces:**

- Consumes: `prisma` from `@/lib/db`, `<StarRating>` (existing, `src/components/reviews`)
- Produces:
  - `interface Testimonial { id: string; rating: number; comment: string; authorName: string; productName: string; productSlug: string; createdAt: string }`
  - `getTestimonials(limit?: number): Promise<Testimonial[]>`
  - `<Testimonials testimonials={Testimonial[]} />`

Note: this adds `src/lib/review-queries.ts`, which the spec's §4.2 file list did not name. Separating it from `product-queries.ts` keeps each module to one entity; TASK-044 (reviews) will add to it.

- [ ] **Step 1: Note the StarRating interface (already verified)**

`src/components/reviews/StarRating.tsx` takes:

```ts
interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

Two traps: the prop is **`value`**, not `rating`, and there is **no `readonly` prop** — readonly is derived internally from `onChange` being absent. So a display-only rating is `<StarRating value={n} size="sm" />`. It is also a `"use client"` component, which a server component may render.

- [ ] **Step 2: Write the failing test for the query**

Create `tests/unit/review-queries.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { review: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/db";
import { getTestimonials } from "@/lib/review-queries";

const findMany = prisma.review.findMany as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe("getTestimonials", () => {
  it("selects only visible, high-rated reviews that have a comment", async () => {
    findMany.mockResolvedValue([]);

    await getTestimonials(6);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isHidden: false,
          rating: { gte: 4 },
          comment: { not: null },
        }),
        orderBy: { createdAt: "desc" },
        take: 6,
      })
    );
  });

  it("flattens the relation and serializes the date", async () => {
    findMany.mockResolvedValue([
      {
        id: "r1",
        rating: 5,
        comment: "Great quality",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        user: { name: "Oleksandr" },
        product: { name: "Mirox Basic Hoodie", slug: "mirox-basic-hoodie" },
      },
    ]);

    const result = await getTestimonials();

    expect(result[0]).toEqual({
      id: "r1",
      rating: 5,
      comment: "Great quality",
      authorName: "Oleksandr",
      productName: "Mirox Basic Hoodie",
      productSlug: "mirox-basic-hoodie",
      createdAt: "2026-06-01T00:00:00.000Z",
    });
  });

  it("falls back to a neutral author label when the user has no name", async () => {
    findMany.mockResolvedValue([
      {
        id: "r2",
        rating: 4,
        comment: "Good",
        createdAt: new Date("2026-06-02T00:00:00.000Z"),
        user: { name: null },
        product: { name: "Tee", slug: "tee" },
      },
    ]);

    const result = await getTestimonials();

    expect(result[0].authorName).toBe("Verified customer");
  });

  it("drops rows whose comment is an empty string", async () => {
    findMany.mockResolvedValue([
      {
        id: "r3",
        rating: 5,
        comment: "   ",
        createdAt: new Date("2026-06-03T00:00:00.000Z"),
        user: { name: "A" },
        product: { name: "Tee", slug: "tee" },
      },
    ]);

    const result = await getTestimonials();

    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/unit/review-queries.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 4: Write `src/lib/review-queries.ts`**

```ts
import { prisma } from "@/lib/db";

/**
 * Serialized review for homepage display. Dates are strings because this
 * crosses into client components — the "Serialized" convention documented in
 * src/types/index.ts.
 */
export interface Testimonial {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  productName: string;
  productSlug: string;
  createdAt: string;
}

/**
 * Real customer reviews for the homepage testimonials rail. Unlike the trust
 * numbers in site.claims, this is backed by genuine data, so it ships.
 *
 * Prisma's `comment: { not: null }` cannot exclude whitespace-only strings, so
 * those are filtered after the query.
 */
export async function getTestimonials(limit = 6): Promise<Testimonial[]> {
  const reviews = await prisma.review.findMany({
    where: {
      isHidden: false,
      rating: { gte: 4 },
      comment: { not: null },
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return reviews
    .filter((review) => review.comment !== null && review.comment.trim().length > 0)
    .map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment as string,
      authorName: review.user.name ?? "Verified customer",
      productName: review.product.name,
      productSlug: review.product.slug,
      createdAt: review.createdAt.toISOString(),
    }));
}
```

- [ ] **Step 5: Run the query test to verify it passes**

Run: `npx vitest run tests/unit/review-queries.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Write the failing component test**

Create `tests/unit/testimonials.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Testimonial } from "@/lib/review-queries";

vi.mock("@/content/home", () => ({
  home: { testimonials: { title: "What our customers say" } },
}));

import { Testimonials } from "@/components/home/Testimonials";

const testimonials: Testimonial[] = [
  {
    id: "r1",
    rating: 5,
    comment: "Excellent quality, fits perfectly.",
    authorName: "Oleksandr",
    productName: "Mirox Basic Hoodie",
    productSlug: "mirox-basic-hoodie",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

describe("Testimonials", () => {
  it("renders each testimonial with author and product", () => {
    render(<Testimonials testimonials={testimonials} />);
    expect(screen.getByText(/Excellent quality/)).toBeInTheDocument();
    expect(screen.getByText("Oleksandr")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mirox Basic Hoodie/ })).toHaveAttribute(
      "href",
      "/products/mirox-basic-hoodie"
    );
  });

  it("renders nothing when no reviews qualify", () => {
    const { container } = render(<Testimonials testimonials={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 7: Write `src/components/home/Testimonials.tsx`**

Use the real `StarRating` prop names confirmed in Step 1.

```tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
// Imported directly rather than via the reviews barrel: the barrel also pulls
// in ReviewForm/ReviewList/ReviewSection and their dependencies, which a unit
// test rendering this component would otherwise have to load.
import { StarRating } from "@/components/reviews/StarRating";
import { FadeIn } from "@/components/common/FadeIn";
import { home } from "@/content/home";
import type { Testimonial } from "@/lib/review-queries";

interface TestimonialsProps {
  testimonials: Testimonial[];
}

/** Real reviews only. Omitted entirely when none qualify — a new store's state. */
export function Testimonials({ testimonials }: TestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <section className="container py-16">
      <FadeIn>
        <h2 className="font-heading text-center text-2xl font-bold tracking-tight sm:text-3xl">
          {home.testimonials.title}
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover-lift">
              <CardContent className="p-6">
                <StarRating value={testimonial.rating} size="sm" />
                <p className="mt-4 text-sm leading-relaxed">{testimonial.comment}</p>
                <p className="mt-4 text-sm font-medium">{testimonial.authorName}</p>
                <Link
                  href={`/products/${testimonial.productSlug}`}
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  {testimonial.productName}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
```

- [ ] **Step 8: Run the component test to verify it passes**

Run: `npx vitest run tests/unit/testimonials.test.tsx`
Expected: PASS, 2 tests. If `StarRating` requires different props, fix the component (not the test) to match its real interface.

- [ ] **Step 9: Add to the barrel**

In `src/components/home/index.ts`, add:

```ts
export { Testimonials } from "./Testimonials";
```

- [ ] **Step 10: Commit**

```bash
git add src/lib/review-queries.ts src/components/home/Testimonials.tsx \
  src/components/home/index.ts tests/unit/review-queries.test.ts tests/unit/testimonials.test.tsx
git commit -m "feat(home): add testimonials rail backed by real reviews

Visible, 4-plus-star reviews with a non-empty comment. Unlike the trust
numbers this is genuine data, so it ships; the section disappears entirely
when nothing qualifies."
```

---

## Task 11: Compose the homepage

**Files:**

- Modify: `src/app/(shop)/page.tsx` (full rewrite — currently 255 lines)

**Interfaces:**

- Consumes: everything from Tasks 2, 3, 7, 8, 9, 10
- Produces: the rendered homepage

- [ ] **Step 1: Rewrite `src/app/(shop)/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getHomeMetadata } from "@/lib/seo";
import { getBestsellers, getFeaturedProducts } from "@/lib/product-queries";
import { getTestimonials } from "@/lib/review-queries";
import { Hero, ProductRail, WhyChooseUs, Testimonials } from "@/components/home";
import { SocialLinks } from "@/components/common";
import { home } from "@/content/home";

export const metadata: Metadata = getHomeMetadata();

// Homepage content changes slowly and the brief targets PageSpeed 95+, so this
// is served from cache and refreshed in the background rather than running four
// queries on every visit. Replaces the previous `dynamic = "force-dynamic"`.
export const revalidate = 300;

export default async function HomePage() {
  const [featured, bestsellers, testimonials] = await Promise.all([
    getFeaturedProducts(8),
    getBestsellers(8),
    getTestimonials(6),
  ]);

  return (
    <div className="flex flex-col">
      <Hero />

      <ProductRail
        title={home.rails.featured.title}
        products={featured}
        viewAllHref={home.rails.featured.viewAllHref}
        viewAllLabel={home.rails.featured.viewAllLabel}
      />

      <ProductRail
        title={home.rails.bestsellers.title}
        products={bestsellers.products}
        viewAllHref={home.rails.bestsellers.viewAllHref}
        viewAllLabel={home.rails.bestsellers.viewAllLabel}
      />

      <WhyChooseUs />

      <Testimonials testimonials={testimonials} />

      <section data-surface="dark" className="bg-background text-foreground">
        <div className="container py-16 text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {home.social.title}
          </h2>
          <p className="text-muted-foreground mt-4 text-sm">{home.social.subtitle}</p>
          <SocialLinks className="mt-8 justify-center" />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build succeeds and inspect the render mode**

Run: `npm run build`
Expected: build succeeds. In the route summary, `/` should be listed as ISR (a revalidate interval), not `ƒ (Dynamic)`.

- [ ] **Step 3: Decide ISR vs dynamic on evidence, not assumption**

If the build fails or `/` cannot be statically prepared because of the Prisma/Neon adapter, revert **only** the rendering directive:

```tsx
export const dynamic = "force-dynamic";
```

and delete the `revalidate` line. Record the reason in the commit body. Do not leave both directives in the file — they conflict.

- [ ] **Step 4: Run the app and check the page renders**

Run: `npm run dev` then load `http://localhost:3000/`.
Expected: dark hero with the three slogan lines and both CTAs; benefit strip; featured and bestseller rails; why-choose-us; testimonials if the seed database has qualifying reviews; dark social section; dark footer. No black-on-black text anywhere.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(shop)/page.tsx"
git commit -m "feat(home): compose the rebuilt homepage from section components

page.tsx drops from 255 lines of inline queries and markup to composition
only. Switches from force-dynamic to 5-minute ISR: the content changes
slowly and the brief targets PageSpeed 95+."
```

---

## Task 12: Footer rebrand

**Files:**

- Modify: `src/components/common/Footer.tsx`
- Test: `tests/unit/footer.test.tsx`

**Interfaces:**

- Consumes: `site.tagline`, `site.footerBenefits` from Task 2; `<BenefitStrip>`, `<SocialLinks>` from Task 6

- [ ] **Step 1: Write the failing test**

Create `tests/unit/footer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/common/NewsletterSignup", () => ({
  NewsletterSignup: () => <div data-testid="newsletter" />,
}));

import { Footer } from "@/components/common/Footer";

describe("Footer", () => {
  it("uses the Mirox tagline, not the generic template copy", () => {
    render(<Footer />);
    expect(screen.queryByText(/one-stop shop for quality products/i)).not.toBeInTheDocument();
    expect(screen.getByText(/value quality and minimalism/i)).toBeInTheDocument();
  });

  it("links to the social profiles", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /Instagram/ })).toBeInTheDocument();
  });

  it("links only to routes that exist", () => {
    render(<Footer />);
    const dead = ["/contact", "/faq", "/shipping", "/returns", "/about", "/privacy", "/terms"];
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => href !== null);
    for (const route of dead) {
      expect(hrefs).not.toContain(route);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/footer.test.tsx`
Expected: FAIL — the generic tagline is present and all seven dead links are rendered.

- [ ] **Step 3: Rewrite `src/components/common/Footer.tsx`**

```tsx
import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import { BenefitStrip } from "@/components/common/BenefitStrip";
import { SocialLinks } from "@/components/common/SocialLinks";
import { NewsletterSignup } from "./NewsletterSignup";
import { site } from "@/content/site";

// Only routes that actually exist. The seven former links (/contact, /faq,
// /shipping, /returns, /about, /privacy, /terms) all 404 — those pages are a
// separate task, and three of them are payment-gateway onboarding
// prerequisites needing client and legal copy we cannot write.
const shopLinks = [
  { name: "All Products", href: "/products" },
  { name: "Categories", href: "/categories" },
  { name: "New Arrivals", href: "/products?sort=newest" },
];

export function Footer() {
  return (
    <footer data-surface="dark" className="bg-background text-foreground border-t">
      <div className="container py-12">
        <BenefitStrip items={site.footerBenefits} className="border-border border-b pb-10" />

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo />
            </Link>
            <p className="text-muted-foreground text-sm">{site.tagline}</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Shop</h3>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Follow us</h3>
            <SocialLinks className="flex-col items-start gap-3" />
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Newsletter</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Get exclusive offers and updates delivered to your inbox.
            </p>
            <NewsletterSignup />
          </div>
        </div>

        <div className="border-border mt-12 border-t pt-8">
          <p className="text-muted-foreground text-center text-sm">
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/footer.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Verify the newsletter input is still legible on the dark surface**

TASK-034 found the dark footer silently drove the newsletter input to 1.34:1 contrast. Load the homepage, scroll to the footer, and confirm the input's border and placeholder are visible against black. If not, fix `NewsletterSignup` to use `border-input`/`text-foreground` tokens rather than adding a colour.

- [ ] **Step 6: Commit**

```bash
git add src/components/common/Footer.tsx tests/unit/footer.test.tsx
git commit -m "feat(home): rebrand the footer with Mirox copy, socials and benefits

Removes seven links that all 404 — those pages are a separate task, and three
are payment-gateway onboarding prerequisites needing client and legal copy."
```

---

## Task 13: Extend the colour guard to cover the homepage

`tests/unit/no-bright-colors.test.ts` deliberately excludes the homepage, with the instruction: _"do not add the deferred (shop) page routes above without a corresponding cleanup task landing first."_ **TASK-035 is that task.**

**Files:**

- Modify: `tests/unit/no-bright-colors.test.ts`

**Interfaces:**

- Consumes: the files created by Tasks 2, 7, 8, 9, 10, 11
- Produces: guard coverage for the homepage

- [ ] **Step 1: Verify the guard currently does NOT catch a homepage violation**

Temporarily add `className="bg-blue-500"` to a `div` in `src/app/(shop)/page.tsx`, then run:

Run: `npx vitest run tests/unit/no-bright-colors.test.ts`
Expected: **PASS** — proving the homepage is unguarded today. If it fails, the guard already covers it and the rest of this task needs rechecking. Remove the temporary class before continuing.

- [ ] **Step 2: Extend `SCAN_PATHS`**

In `tests/unit/no-bright-colors.test.ts`, change the array to add three entries:

```ts
const SCAN_PATHS = [
  "src/components/common",
  "src/components/home",
  "src/components/reviews",
  "src/components/products",
  "src/components/shop",
  "src/components/checkout",
  "src/content",
  "src/app/newsletter",
  "src/lib/order-status.ts",
  "src/app/not-found.tsx",
  "src/app/(shop)/page.tsx",
  "src/app/(shop)/account",
  "src/app/(shop)/checkout",
  "src/app/(shop)/layout.tsx",
  "src/app/(auth)",
  "src/app/error.tsx",
  "src/app/layout.tsx",
];
```

- [ ] **Step 3: Update the explanatory comment so it stays true**

Replace the first paragraph of the comment block (lines 5–18) with:

```ts
// Surfaces TASK-034 and TASK-035 cleaned; these must never carry bright color
// utilities.
//
// Within src/app/(shop), only catalog / product / cart (page.tsx et al.) are
// deliberately NOT in this list — they're rebuilt by TASK-036 / 037 / 043 and
// may legitimately still contain bright colors until those land. The home page
// WAS in that deferred set; TASK-035 rebuilt it, so `(shop)/page.tsx`,
// `src/components/home` and `src/content` joined the scan as part of that task.
// Every other customer-facing route group IS scanned, specifically because none
// of them has a rebuild task of its own to inherit the obligation:
// `(shop)/account` (TASK-034 neutralized its one offender,
// account/orders/[id]/page.tsx), `(shop)/checkout` (TASK-034 neutralized its one
// offender, checkout/confirmation/page.tsx), the whole `(auth)` group
// (login/register — verified clean, no changes needed), and the shared
// root-level files every route tree passes through — `(shop)/layout.tsx`, the
// root `error.tsx`, and the root `layout.tsx` (all three verified clean). Do not
// mistake any of these for oversights, and do not add the remaining deferred
// (shop) page routes above without a corresponding cleanup task landing first.
```

- [ ] **Step 4: Prove the guard now HAS teeth**

Re-add `className="bg-blue-500"` to a `div` in `src/app/(shop)/page.tsx`, then run:

Run: `npx vitest run tests/unit/no-bright-colors.test.ts`
Expected: **FAIL**, naming `src/app/(shop)/page.tsx` and the line number. A guard that has not been observed failing is not known to work.

Then remove the temporary class and re-run:

Run: `npx vitest run tests/unit/no-bright-colors.test.ts`
Expected: PASS, and the "scans a non-empty set of files" test still passes with a larger file count than before.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/no-bright-colors.test.ts
git commit -m "test: extend the colour guard to cover the rebuilt homepage

The guard deferred (shop)/page.tsx pending a cleanup task; TASK-035 is that
task. Adds the homepage, src/components/home and src/content to SCAN_PATHS,
and updates the comment so the deferral list stays accurate. Verified by
observing the guard fail on an injected bg-blue-500 before removing it."
```

---

## Task 14: E2E smoke test and full verification

**Files:**

- Create: `tests/e2e/home.spec.ts`

**Interfaces:**

- Consumes: the rendered homepage from Task 11

- [ ] **Step 1: Read an existing spec to match conventions**

Run: `head -40 tests/e2e/navigation.spec.ts`
Expected: the project's `test.describe` / `test` structure, `isMobile` usage, and any shared setup. Match it.

- [ ] **Step 2: Write `tests/e2e/home.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the Mirox hero slogan", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText("STYLE.");
    await expect(heading).toContainText("QUALITY.");
    await expect(heading).toContainText("CONFIDENCE.");
  });

  test("primary CTA navigates to the catalog", async ({ page }) => {
    await page.getByRole("link", { name: "Shop the Catalog" }).click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test("secondary CTA navigates to new arrivals", async ({ page }) => {
    await page.getByRole("link", { name: "New Arrivals" }).first().click();
    await expect(page).toHaveURL(/sort=newest/);
  });

  test("shows the why-choose-us block", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /why choose us/i })).toBeVisible();
  });

  test("shows social links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Instagram/ }).first()).toBeVisible();
  });

  test("announcement bar dismisses and stays dismissed", async ({ page }) => {
    const dismiss = page.getByRole("button", { name: /dismiss announcement/i });

    // The bar reveals after mount (localStorage read in an effect), so wait for
    // it rather than asserting immediately — the same pre-hydration race that
    // caused the WebKit failure diagnosed in TASK-038a.
    await expect(dismiss).toBeVisible();
    await dismiss.click();
    await expect(dismiss).toBeHidden();

    await page.reload();
    await expect(dismiss).toBeHidden();
  });
});
```

- [ ] **Step 3: Run the E2E suite**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`
Expected: all tests pass on chromium and webkit. If a test fails only on WebKit, suspect a pre-hydration interaction race before suspecting a product bug — see the TASK-038a diagnosis.

- [ ] **Step 4: Run every gate**

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

Expected: all five pass. `test:run` should report the pre-existing 336 tests plus roughly 45 new ones, with no failures.

- [ ] **Step 5: Run the full E2E suite for regressions**

Run: `npm run test:e2e`
Expected: no new failures versus the 84/85 baseline. The one known intermittent chromium `navigation.spec.ts` "can navigate to categories page" flake is pre-existing and unrelated — do not chase it.

- [ ] **Step 6: Manual verification pass**

Confirm each, and record the result:

- Hero renders correctly **with** `home.hero.image` set, and again with it temporarily set to `null` (restore afterwards)
- No black-on-black or invisible text in the announcement bar, hero, social section, or footer
- Newsletter input in the dark footer has visible border and placeholder
- With OS reduced-motion enabled, `FadeIn` sections appear immediately and cards do not animate on hover
- Mobile viewport: announcement bar scrolls away under the sticky header; cookie consent does not overlap it
- `₴` and Ukrainian characters render without tofu if used in announcement copy

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/home.spec.ts
git commit -m "test(e2e): add homepage smoke coverage

Hero slogan, both CTA destinations, why-choose-us, social links, and
announcement-bar dismissal persistence."
```

---

## Post-Implementation

Not part of the plan's tasks; follow CLAUDE.md's task-completion workflow after review sign-off.

1. **Extract** improvements → BACKLOG.md (Claude-surfaced → 🟤, user-raised → 🔵) and actionable items → TODO.md. At minimum, file the two tasks this design spawned:
   - **Content & legal pages** — the seven footer routes; three are payment-gateway onboarding prerequisites per the [payments decision doc §5.3](../../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md)
   - **Client content inventory** — one fill-in list consolidating BACKLOG "Content dependencies", WEEKLY "Preparation Needed", the payments §5.3 checklist, and every client-supplied field in `src/content/`
   - Also: repoint the Bestsellers "view all" link when TASK-036 adds a popular sort
2. **Archive** this plan → `docs/archive/plans/`
3. **Transition** TASK-035 from TODO.md → DONE.md, and check off the group in WEEKLY.md (Summary-Table Status → `✅ PR #N`, plus the Daily-Schedule entry)
4. **Commit** documentation changes
5. **Capture learnings** → memory files
6. **Update the AUTO-MANAGED sections** in `CLAUDE.md` and `src/components/CLAUDE.md` / `src/app/CLAUDE.md` — nothing regenerates them, and this task falsifies the homepage description in each
