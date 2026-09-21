# G23 / TASK-055 — Content, Legal & Contact Pages Plan

**Last Updated**: 2026-09-21
**Task**: G23 (WEEKLY [G23](../WEEKLY.md#g23-task-055-content-legal--contact-pages-batch)) · TODO [TASK-055] content & legal pages, UNBLOCKED 2026-09-16 by the client's blanket delegation (TASK-056 row 15) + two promoted BACKLOG entries (🔵 [2026-09-16] developer credit → member 5; 🟤 [2026-09-16] manager link → member 3, subsumed with a recorded deviation)
**Branch**: `feat/task-055-content-legal-pages` (from `main` @ `c779b6b`)
**Status**: In progress
**Spec**: [2026-09-21-g23-task-055-content-legal-pages-design.md](../../superpowers/specs/2026-09-21-g23-task-055-content-legal-pages-design.md) — the plan argues from the spec; executors read both. Section references below (§3, §4, …) are to it.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the seven info routes the storefront chrome already references but does not have, so no footer or header link 404s and the public offer / privacy policy / return policy are published — lifting the 2026-07-28 no-dead-links ruling and the "published" half of the payments decision doc's §5.3 item 9.

**Architecture:** Six of the seven pages are thin Server Components over one shared `StaticPage` shell that reads a new `pages` catalog namespace; `/contact` is bespoke per the design handoff. The `pages` namespace is stripped from the storefront client payload alongside `admin`, so ~100 KB of legal prose never reaches the browser. Seller identity is null-gated through a new `LEGAL_ENTITY` config, so the legal pages publish today and light up when the client registers.

**Tech Stack:** Next.js 14 App Router (Server Components), next-intl 4.13.6 (cookie mode, `getTranslations` + `t.raw`), TypeScript strict, Tailwind v4, Vitest + Testing Library, Playwright.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Language.** All customer-facing copy is Ukrainian. No English strings reach the page body.
- **Copy lives in `messages/uk.json`.** Never inline a UA string literal in a component. The one sanctioned exception in this repo is a currency unit; nothing in this group qualifies.
- **`pages` namespace gets no `ru.json` keys.** RU falls back to UA through `src/i18n/merge.ts`'s deep-merge, by decision (§4), matching `admin`.
- **Async functions use `getTranslations`; non-async use `useTranslations`.** Every page in this group is async.
- **No invented facts.** No phone number, no postal address, no third-party brand name, no authenticity claim, no follower counts, no free-shipping threshold. (TASK-056 rows 4, 14, 16, 17, 18.)
- **Return window is exactly «14 днів»** — user-approved 2026-07-28, `RETURN_WINDOW_DAYS = 14`.
- **Nova Poshta only.** No Ukrposhta anywhere (TASK-056 row 7).
- **Declare `grid-cols-1` explicitly** on any grid. Implicit tracks overflow on mobile.
- **Tailwind v4 in this container:** arbitrary values containing nested commas silently do not compile, and a bare `@media` inside `@layer utilities` is dropped in production builds. Neither is needed here — avoid both.
- **Commits:** conventional (`feat:`, `test:`, `docs:`), scoped `(g23)` where useful. Pre-commit runs eslint + prettier via lint-staged.
- **Code fences in this plan are tagged `js`, not `ts` — deliberately (controller ruling R6).** `tests/unit/plan-snippets.test.ts` (from G20) diffs every ` ```ts ` fence in an active plan against the file its preceding line names, line by line. This plan's fences are target-state **specifications**: they contain elision markers (`// …`) and top-level indentation for code that lives inside a function, so they can never match by construction — the guard would be red for the whole execution, and a permanently red suite masks new failures. That guard's own documentation offers this exact escape ("tag an illustrative block as something other than `ts`"). Do not retag them back. **Consequence to be aware of:** this plan gets no automated drift protection, so if a fix round or a PR review changes code this plan quotes, the plan's copy goes stale silently. Task 11 carries a manual reconciliation step for that.

- **Every guard must be proved red before it is trusted.** Tasks that add a guard include an explicit "break it and watch it fail" step. A guard that passes both before and after the change it protects is testing the wrong property.

---

## File Structure

**Created:**

| Path                                                                 | Responsibility                                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/content/legal.ts`                                               | `LegalEntity` type, null `LEGAL_ENTITY`, `RETURN_WINDOW_DAYS`. Config only — no copy, no JSX. |
| `src/components/pages/SellerRequisites.tsx`                          | Renders the requisites table, or the brand + manager fallback when `LEGAL_ENTITY` is null.    |
| `src/components/pages/StaticPage.tsx`                                | The shared shell: title, intro, `sections[]` of heading + body paragraphs + optional list.    |
| `src/components/pages/index.ts`                                      | Barrel, matching `src/components/common/index.ts`.                                            |
| `src/app/(shop)/{terms,privacy,returns,faq,shipping,about}/page.tsx` | Six thin route files: `generateMetadata()` + `<StaticPage/>`.                                 |
| `src/app/(shop)/contact/page.tsx`                                    | Bespoke `/contact` per the handoff.                                                           |
| `public/humans.txt`                                                  | Developer credit, standard format.                                                            |
| `tests/helpers/server-intl.ts`                                       | Reusable `getTranslations` mock over the real `uk.json`, supporting `t()` and `t.raw()`.      |
| `tests/unit/static-pages.test.tsx`                                   | The seven pages render their catalog copy.                                                    |
| `tests/unit/seller-requisites.test.tsx`                              | Both `LEGAL_ENTITY` branches.                                                                 |
| `tests/unit/nav-link-integrity.test.ts`                              | Every header/footer internal href resolves to a real route file.                              |
| `tests/unit/client-messages-payload.test.ts`                         | `pages` and `admin` never reach the client provider.                                          |
| `docs/reference/<date>-task-055-copy-for-client.md`                  | The UA review package.                                                                        |

**Modified:**

| Path                                     | Change                                                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `messages/uk.json`                       | New `pages` namespace; `footer.groups.*`, `footer.links.*` additions, `footer.developerCredit`; `header.nav.contacts`. |
| `src/app/layout.tsx:~120`                | Widen the `admin` strip to a named exclusion list; add `<meta name="author">`.                                         |
| `src/components/common/Header.tsx:44-48` | One entry appended to `navigation`.                                                                                    |
| `src/components/common/Footer.tsx`       | New two-group nav band; copyright row gains the developer credit.                                                      |
| `src/content/brand.ts`                   | `MANAGER_TELEGRAM_HREF`, `REVIEWS_CHANNEL_HREF`, `DEVELOPER_CREDIT_HREF`.                                              |
| `src/content/checkout.ts`                | `contacts.manager` added.                                                                                              |
| `src/content/emails.ts`                  | Manager link appended to the order-email contact block.                                                                |
| `src/app/sitemap.ts`                     | Seven rows.                                                                                                            |
| `tests/e2e/mobile-overflow.spec.ts`      | Seven routes added to `PAGES`.                                                                                         |
| `tests/e2e/navigation.spec.ts`           | Header/footer link sweep.                                                                                              |
| `README.md`                              | Developer credit line.                                                                                                 |

**Task order rationale:** infrastructure (1–3) → content (4–6) → wiring (7–9) → verification and handover (10–11). The link-integrity guard in Task 9 cannot pass until every route from Tasks 4–6 exists, which is why it is late.

---

## Task 1: `pages` namespace plumbing and the payload guard

Establishes the namespace, keeps it out of the client bundle, and locks that in with a guard. Nothing renders yet — this task's deliverable is the mechanism plus proof it holds.

**Files:**

- Modify: `messages/uk.json` (add a minimal `pages` namespace)
- Create: `src/i18n/client-namespaces.ts` (the exclusion list, as a dependency-free leaf module)
- Modify: `src/app/layout.tsx` (import the list; widen the `admin` strip)
- Create: `tests/unit/client-messages-payload.test.ts`

> **Controller ruling R1 (pre-flight).** The plan originally exported this constant from `src/app/layout.tsx`. It cannot live there: layout.tsx imports `next/font/google` (five font loaders) and `./globals.css`, so a vitest unit test cannot import it at all, which would make the guard below unrunnable. The constant moves to a leaf module — the same isolation `src/i18n/config.ts` already uses.

**Interfaces:**

- Consumes: nothing.
- Produces: `STOREFRONT_EXCLUDED_NAMESPACES: readonly string[]` exported from `src/i18n/client-namespaces.ts`; the `messages.pages` namespace root.

- [ ] **Step 1: Add the namespace root to the catalog**

Insert into `messages/uk.json`, after the `track` namespace (key order is not significant; keep it last so diffs stay readable):

```jsonc
"pages": {
  "terms": {
    "meta": { "title": "Публічна оферта", "description": "Умови продажу товарів у Mirox Shop." },
    "title": "Публічна оферта",
    "intro": "",
    "sections": []
  }
}
```

The empty `intro`/`sections` are filled in Task 4. This step exists so the guard in Step 3 has a namespace to assert about.

- [ ] **Step 2: Create the exclusion-list module and use it in the layout**

Create `src/i18n/client-namespaces.ts`. Keep it dependency-free — it is imported by both the root layout and a unit test:

```js
/**
 * Namespaces deliberately withheld from the storefront's client payload.
 *
 * `admin` (G13): admin chrome must never ship to the public bundle.
 * `pages` (G23): the seven info/legal pages are Server Components, so their
 * long-form copy has no client consumer — leaving it in would add roughly
 * 100 KB of Cyrillic prose to the RSC payload of EVERY storefront page for
 * text almost no visitor opens. Guarded by
 * tests/unit/client-messages-payload.test.ts.
 *
 * Adding a namespace here means: no client component may call
 * useTranslations() on it. Server Components read the full catalog via
 * getTranslations() regardless of this list.
 */
export const STOREFRONT_EXCLUDED_NAMESPACES: readonly string[] = ["admin", "pages"];
```

Then in `src/app/layout.tsx`, import it and replace the inline `admin` filter:

```js
import { STOREFRONT_EXCLUDED_NAMESPACES } from "@/i18n/client-namespaces";

// …

const clientMessages = Object.fromEntries(
  Object.entries(messages).filter(
    ([namespace]) => !STOREFRONT_EXCLUDED_NAMESPACES.includes(namespace)
  )
) as typeof messages;
```

- [ ] **Step 3: Write the failing guard**

Create `tests/unit/client-messages-payload.test.ts`:

```js
import { describe, it, expect } from "vitest";
import uk from "../../messages/uk.json";
import { STOREFRONT_EXCLUDED_NAMESPACES } from "@/i18n/client-namespaces";

/**
 * The root layout serializes the catalog into NextIntlClientProvider on every
 * storefront page. Measured 2026-09-21: 28,620 bytes without `admin`. The
 * seven G23 pages are Server Components, so their copy must not join it.
 *
 * These assertions compare against an INDEPENDENTLY COMPUTED expectation —
 * the catalog's own key set — rather than `length > 0`, which would pass on
 * an empty exclusion list.
 */
describe("storefront client message payload", () => {
  const ALL = Object.keys(uk);

  function clientNamespaces(): string[] {
    return ALL.filter((ns) => !STOREFRONT_EXCLUDED_NAMESPACES.includes(ns));
  }

  it("withholds exactly admin and pages", () => {
    expect([...STOREFRONT_EXCLUDED_NAMESPACES].sort()).toEqual(["admin", "pages"]);
  });

  it("does not hand the pages namespace to the client provider", () => {
    expect(clientNamespaces()).not.toContain("pages");
  });

  it("does not hand the admin namespace to the client provider", () => {
    expect(clientNamespaces()).not.toContain("admin");
  });

  it("still hands every other catalog namespace to the client provider", () => {
    const expected = ALL.filter((ns) => ns !== "admin" && ns !== "pages");
    expect(clientNamespaces().sort()).toEqual(expected.sort());
    // Guard the guard: the catalog must actually HAVE the namespaces the
    // storefront renders, so this is not vacuously comparing [] to [].
    expect(expected).toContain("header");
    expect(expected).toContain("footer");
    expect(expected).toContain("products");
  });
});
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run tests/unit/client-messages-payload.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Prove the guard has teeth**

Temporarily change the constant in `src/i18n/client-namespaces.ts` to `["admin"]` and re-run:

Run: `npx vitest run tests/unit/client-messages-payload.test.ts`
Expected: **FAIL** — "withholds exactly admin and pages" and "does not hand the pages namespace to the client provider" both fail.

Then restore `["admin", "pages"]` and re-run. Expected: 4 passed.

Do not skip this step. A payload guard that passes with the strip removed protects nothing.

- [ ] **Step 6: Typecheck and commit**

```bash
npm run typecheck
git add messages/uk.json src/i18n/client-namespaces.ts src/app/layout.tsx tests/unit/client-messages-payload.test.ts
git commit -m "feat(g23): withhold the pages namespace from the storefront client payload"
```

---

## Task 2: `legal.ts` config and the `SellerRequisites` component

**Files:**

- Create: `src/content/legal.ts`
- Create: `src/components/pages/SellerRequisites.tsx`
- Create: `src/components/pages/index.ts`
- Create: `tests/unit/seller-requisites.test.tsx`
- Modify: `messages/uk.json` (a `pages.common.requisites` block)

**Interfaces:**

- Consumes: `MANAGER_TELEGRAM_HREF` is added in Task 7 — **this task does not import it.** The fallback branch links `/feedback` and the brand name only; Task 7 adds the manager link to this component.
- Produces:
  - `interface LegalEntity { form: "ФОП" | "ТОВ"; name: string; edrpou: string; address: string; email?: string }`
  - `const LEGAL_ENTITY: LegalEntity | null`
  - `const RETURN_WINDOW_DAYS: number` (14)
  - `<SellerRequisites />` — a Server Component taking no props.

- [ ] **Step 1: Add the catalog keys**

Into `messages/uk.json` under `pages`, add a sibling to `terms`:

```jsonc
"common": {
  "requisites": {
    "heading": "Відомості про продавця",
    "form": "Організаційно-правова форма",
    "name": "Найменування",
    "edrpou": "Код ЄДРПОУ / РНОКПП",
    "address": "Адреса",
    "email": "Електронна пошта",
    "fallbackSeller": "Продавець",
    "fallbackBody": "Mirox Shop — інтернет-магазин одягу. Зв'язатися з нами можна через форму зворотного зв'язку або в Telegram.",
    "fallbackCta": "Форма зворотного зв'язку"
  }
}
```

- [ ] **Step 2: Write `src/content/legal.ts`**

```js
/**
 * Legal-entity configuration for the public offer, privacy policy and return
 * policy (G23 spec §3).
 *
 * Deliberately dependency-free, like brand.ts: these constants are read by
 * Server Components and may later be read by API routes.
 */

export interface LegalEntity {
  /** Drives the requisites heading and the offer's party clause. */
  form: "ФОП" | "ТОВ";
  /** Full registered name, e.g. «ФОП Прізвище Ім'я По-батькові». */
  name: string;
  /** ЄДРПОУ (ТОВ) or РНОКПП/ІПН (ФОП). */
  edrpou: string;
  /** Registered address exactly as it appears in the state register. */
  address: string;
  /** Official contact address. Omit until a real domain exists. */
  email?: string;
}

/**
 * CLIENT-SUPPLIED, PENDING (TASK-056 — asked 2026-08-21, unanswered; the
 * 2026-09-16 reply delegated the COPY, not the FACTS).
 *
 * `null` is a supported production state, not a TODO. <SellerRequisites/>
 * renders the brand + contact fallback instead of a requisites table, so the
 * legal pages publish today and light up with no code change once the client
 * registers a ФОП or ТОВ. Never fill this with example or placeholder data —
 * a fabricated ЄДРПОУ on a public offer is worse than an absent one.
 */
export const LEGAL_ENTITY: LegalEntity | null = null;

/**
 * USER-APPROVED 2026-07-28. Matches ЗУ «Про захист прав споживачів» ст. 9,
 * which grants 14 days to return non-food goods of proper quality.
 */
export const RETURN_WINDOW_DAYS = 14;
```

- [ ] **Step 3: Write the failing test**

Create `tests/unit/seller-requisites.test.tsx`:

```js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "../helpers/render-with-intl";

// Controller ruling R3: a `vi.hoisted` box is the mocking mechanism, NOT
// `vi.spyOn(module, "LEGAL_ENTITY", "get")` — you cannot spy a plain value
// property on a module already replaced by a factory.
const box = vi.hoisted(() => ({ entity: null as null | Record<string, string> }));

vi.mock("@/content/legal", () => ({
  get LEGAL_ENTITY() {
    return box.entity;
  },
  RETURN_WINDOW_DAYS: 14,
}));

import { SellerRequisites } from "@/components/pages/SellerRequisites";

describe("<SellerRequisites/>", () => {
  beforeEach(() => {
    box.entity = null;
  });

  it("renders the contact fallback when LEGAL_ENTITY is null", () => {
    renderWithIntl(<SellerRequisites />);
    expect(screen.getByText(/Mirox Shop/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /зворотн/i })).toHaveAttribute("href", "/feedback");
    expect(screen.queryByText(/ЄДРПОУ/)).not.toBeInTheDocument();
  });

  it("renders the requisites table when LEGAL_ENTITY is filled", () => {
    box.entity = {
      form: "ФОП",
      name: "ФОП Тестенко Тест Тестович",
      edrpou: "1234567890",
      address: "м. Київ, вул. Тестова, 1",
    };
    renderWithIntl(<SellerRequisites />);
    expect(screen.getByText("ФОП Тестенко Тест Тестович")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("м. Київ, вул. Тестова, 1")).toBeInTheDocument();
  });
});
```

The `vi.hoisted` box is required, not optional: `vi.mock`'s factory is hoisted above the imports, so a plain `let` would be in the temporal dead zone when the factory runs. Both branches must be exercised — the null branch is the one that ships.

- [ ] **Step 4: Run it and confirm it fails**

Run: `npx vitest run tests/unit/seller-requisites.test.tsx`
Expected: FAIL — cannot resolve `@/components/pages/SellerRequisites`.

- [ ] **Step 5: Write the component**

Create `src/components/pages/SellerRequisites.tsx`. It is **not** `"use client"` — the `pages` namespace is server-only (Task 1).

```js
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LEGAL_ENTITY } from "@/content/legal";

/**
 * Seller identity block for /terms, /privacy and /returns (G23 spec §3).
 *
 * Both branches are production states. The null branch is the one shipping
 * today: the client has not registered a ФОП/ТОВ, and §5.0 of the payments
 * decision doc means no gateway can be connected until they do. Copy in the
 * surrounding pages is written so neither branch leaves a dangling sentence.
 *
 * Sync (not async), so it uses useTranslations — it renders inside an async
 * page but is itself an ordinary Server Component.
 */
export function SellerRequisites() {
  const t = useTranslations("pages.common.requisites");

  return (
    <section className="border-border mt-10 rounded-lg border p-6">
      <h2 className="text-lg font-bold">{t("heading")}</h2>

      {LEGAL_ENTITY ? (
        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-[max-content_1fr]">
          <dt className="text-muted-foreground text-sm">{t("form")}</dt>
          <dd className="text-sm">{LEGAL_ENTITY.form}</dd>
          <dt className="text-muted-foreground text-sm">{t("name")}</dt>
          <dd className="text-sm">{LEGAL_ENTITY.name}</dd>
          <dt className="text-muted-foreground text-sm">{t("edrpou")}</dt>
          <dd className="text-sm">{LEGAL_ENTITY.edrpou}</dd>
          <dt className="text-muted-foreground text-sm">{t("address")}</dt>
          <dd className="text-sm">{LEGAL_ENTITY.address}</dd>
          {LEGAL_ENTITY.email ? (
            <>
              <dt className="text-muted-foreground text-sm">{t("email")}</dt>
              <dd className="text-sm">{LEGAL_ENTITY.email}</dd>
            </>
          ) : null}
        </dl>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-semibold">{t("fallbackSeller")}: </span>
            {t("fallbackBody")}
          </p>
          <Link href="/feedback" className="text-sm font-semibold underline underline-offset-4">
            {t("fallbackCta")}
          </Link>
        </div>
      )}
    </section>
  );
}
```

Create `src/components/pages/index.ts`:

```js
export { SellerRequisites } from "./SellerRequisites";
```

- [ ] **Step 6: Run the test and confirm it passes**

Run: `npx vitest run tests/unit/seller-requisites.test.tsx`
Expected: 2 passed.

- [ ] **Step 7: Typecheck and commit**

```bash
npm run typecheck
git add src/content/legal.ts src/components/pages messages/uk.json tests/unit/seller-requisites.test.tsx
git commit -m "feat(g23): null-gated LEGAL_ENTITY config and SellerRequisites block"
```

---

## Task 3: The `StaticPage` shell and the server-intl test helper

**Files:**

- Create: `src/components/pages/StaticPage.tsx`
- Create: `tests/helpers/server-intl.ts`
- Modify: `src/components/pages/index.ts`
- Create: `tests/unit/static-pages.test.tsx` (shell coverage only; per-page cases land in Tasks 4–6)

**Interfaces:**

- Consumes: the `pages` namespace root from Task 1.
- Produces:
  - `<StaticPage namespace="pages.terms" children?={ReactNode} />` — async Server Component.
  - `type PageSection = { heading: string; body: string[]; list?: string[] }`
  - `mockServerIntl()` from `tests/helpers/server-intl.ts` — installs a `next-intl/server` mock backed by the real `uk.json`, supporting `t(key)`, `t(key, params)` and `t.raw(key)`.

- [ ] **Step 1: Write the test helper**

Create `tests/helpers/server-intl.ts`. This generalizes the mock `tests/unit/seo.test.ts` wrote inline, adding `t.raw` support, so the seven page tests do not each re-derive it.

```js
import { vi } from "vitest";
import uk from "../../messages/uk.json";

function getPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object" && part in (acc as Record<string, unknown>)
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj
    );
}

/**
 * Mock `next-intl/server` with a real lookup into messages/uk.json.
 *
 * Vitest has no request scope, and next-intl 4.13.6's server entry expects the
 * "react-server" condition, which is absent here — so `getTranslations` has to
 * be mocked. Backing it with the real catalog (rather than a hand-written
 * fixture) means a page test fails when the catalog key is missing or
 * misspelled, which is the whole point.
 *
 * Call at module scope, BEFORE importing the component under test — vi.mock is
 * hoisted, and this wraps it.
 */
export function mockServerIntl() {
  vi.mock("next-intl/server", () => ({
    getTranslations: async (namespace?: string) => {
      const scope = namespace ? getPath(uk, namespace) : uk;
      const t = (key: string, params?: Record<string, string>) => {
        const raw = getPath(scope, key);
        if (typeof raw !== "string") {
          throw new Error(
            `server-intl mock: "${namespace ? namespace + "." : ""}${key}" is missing from messages/uk.json (or is not a string)`
          );
        }
        return params
          ? Object.entries(params).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), raw)
          : raw;
      };
      t.raw = (key: string) => getPath(scope, key);
      t.has = (key: string) => getPath(scope, key) !== undefined;
      return t;
    },
  }));
}
```

- [ ] **Step 2: Write the failing shell test**

Create `tests/unit/static-pages.test.tsx`:

```js
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockServerIntl } from "../helpers/server-intl";

mockServerIntl();

import { StaticPage } from "@/components/pages/StaticPage";

/**
 * StaticPage is an async Server Component. React 18 + RTL cannot render one
 * directly, so we await the component function to get its element tree and
 * render that — the standard vitest approach for RSC.
 */
describe("<StaticPage/>", () => {
  it("renders the catalog title for a namespace that has no sections yet", async () => {
    const ui = await StaticPage({ namespace: "pages.terms" });
    render(ui);

    // The value comes from messages/uk.json, so this asserts against production
    // copy, not a fixture. Task 1 seeded pages.terms with an empty sections
    // array, so this also pins the empty-state path: no <h2>, no crash.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Публічна оферта");
    expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  });
});
```

**Controller ruling R2 (pre-flight):** the plan originally included a second case asserting on `pages.returns`, which does not exist until Task 4 — committing it here would commit a red test, contradicting this task's own run-then-commit cycle. Section and list rendering are covered by Task 4's sweep instead.

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run tests/unit/static-pages.test.tsx`
Expected: FAIL — cannot resolve `@/components/pages/StaticPage`.

- [ ] **Step 4: Write the shell**

Create `src/components/pages/StaticPage.tsx`:

```js
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/** One section of an info page. `list` is optional; most sections are prose only. */
export type PageSection = {
  heading: string;
  body: string[];
  list?: string[];
};

interface StaticPageProps {
  /** Full catalog path, e.g. "pages.terms". */
  namespace: string;
  /** Rendered after the sections — used to mount <SellerRequisites/>. */
  children?: ReactNode;
}

/**
 * Shared shell for the six non-/contact info pages (G23 spec §5).
 *
 * Reads its whole body from the `pages` catalog namespace, which is withheld
 * from the client payload (spec §4) — so this must stay a Server Component and
 * must never be imported by a "use client" module.
 *
 * `t.raw` is used for `sections` because it takes a TYPED key and returns the
 * raw array, letting us map over it. The alternative — a literal t() call per
 * section — is what Footer.tsx was forced into for its four benefits, and does
 * not scale to a twelve-section public offer.
 */
export async function StaticPage({ namespace, children }: StaticPageProps) {
  const t = await getTranslations(namespace);
  const sections = (t.raw("sections") ?? []) as PageSection[];
  const intro = t.raw("intro") as string | undefined;

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      {intro ? <p className="text-muted-foreground mt-3 text-base">{intro}</p> : null}

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold tracking-tight">{section.heading}</h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground text-[15px] leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.list ? (
              <ul className="text-muted-foreground mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      {children}
    </div>
  );
}
```

Add to `src/components/pages/index.ts`:

```js
export { StaticPage, type PageSection } from "./StaticPage";
export { SellerRequisites } from "./SellerRequisites";
```

- [ ] **Step 5: Run the first test case and confirm it passes**

Run: `npx vitest run tests/unit/static-pages.test.tsx`
Expected: 1 passed. The whole file must be green before you commit.

- [ ] **Step 6: Typecheck and commit**

```bash
npm run typecheck
git add src/components/pages tests/helpers/server-intl.ts tests/unit/static-pages.test.tsx
git commit -m "feat(g23): StaticPage shell and a reusable server-intl test helper"
```

---

## Task 4: The three legal pages — `/terms`, `/privacy`, `/returns`

The §5.3-item-9 prerequisites. Draft these first: they are the reason the group is 🏆.

**Files:**

- Modify: `messages/uk.json` (`pages.terms`, `pages.privacy`, `pages.returns`)
- Create: `src/app/(shop)/terms/page.tsx`, `src/app/(shop)/privacy/page.tsx`, `src/app/(shop)/returns/page.tsx`
- Modify: `tests/unit/static-pages.test.tsx`

**Interfaces:**

- Consumes: `<StaticPage/>` and `PageSection` (Task 3), `<SellerRequisites/>` (Task 2), `RETURN_WINDOW_DAYS` (Task 2).
- Produces: routes `/terms`, `/privacy`, `/returns`; catalog keys `pages.{terms,privacy,returns}`.

**Drafting rules for all three** (from the Global Constraints, restated because they bind the prose):

- The seller is «Mirox Shop». Never name a ФОП, ЄДРПОУ or address — `<SellerRequisites/>` owns that, and it is null today.
- Write every clause so it reads correctly with the null branch. Do not write «реквізити продавця вказані нижче» as a bare promise; write «відомості про продавця наведені в кінці цієї сторінки», which is true in both branches.
- No third-party brand names, no «оригінал»/«репліка» claim (TASK-056 row 14).
- No phone, no postal address (row 4).
- Nova Poshta only (row 7).
- The return window is «14 днів», sourced from `RETURN_WINDOW_DAYS` where interpolated, otherwise written literally.
- Statute references are allowed and encouraged where they are accurate: ЗУ «Про захист прав споживачів» (ст. 8, 9), ЗУ «Про електронну комерцію» (ст. 11), ЗУ «Про захист персональних даних».

- [ ] **Step 1: Draft `pages.terms` — the публічна оферта**

Required sections, in this order. Each `heading` is exact; each bullet is a point the `body` must make.

1. **«1. Загальні положення»** — this document is a public offer under ст. 633/641 ЦКУ and ст. 11 ЗУ «Про електронну комерцію»; placing an order is full acceptance; the seller may amend it and the version on the site at the time of the order applies.
2. **«2. Терміни»** — «Продавець», «Покупець», «Товар», «Замовлення», «Сайт».
3. **«3. Предмет договору»** — sale of clothing and accessories listed in the catalogue, at the price shown at the moment of ordering.
4. **«4. Оформлення замовлення»** — orders through the site or a messenger; the buyer supplies name, phone and delivery details; the seller confirms; an order can be declined if the item is out of stock.
5. **«5. Ціна та оплата»** — prices in UAH; payment on receipt (післяплата) at a Nova Poshta branch; no prepayment required; the price is fixed at the moment of confirmation.
6. **«6. Доставка»** — Nova Poshta branch, postomat or courier; carrier tariffs paid by the buyer; dispatch timelines; risk passes on receipt. Link to `/shipping`.
7. **«7. Повернення та обмін»** — 14 days, the conditions summarized, with a link to `/returns` for the full procedure.
8. **«8. Відповідальність сторін»** — limits; force majeure; the seller is not liable for carrier delays.
9. **«9. Персональні дані»** — processed per the privacy policy, with a link to `/privacy`.
10. **«10. Порядок вирішення спорів»** — negotiation first, then Ukrainian law and Ukrainian courts.
11. **«11. Строк дії оферти»** — effective from publication, until withdrawn.
12. **«12. Відомості про продавця»** — one short paragraph pointing at the block below; `<SellerRequisites/>` renders after it.

- [ ] **Step 2: Draft `pages.privacy`**

1. **«1. Хто обробляє ваші дані»** — Mirox Shop as controller; the details block below.
2. **«2. Які дані ми збираємо»** — a `list`: name, phone, e-mail, delivery address, order history, and technical data (IP, browser, cookies).
3. **«3. Навіщо ми їх обробляємо»** — a `list`: fulfilling orders, contacting the buyer, handling returns, the newsletter on explicit consent, site analytics.
4. **«4. Підстави обробки»** — contract performance and consent, per ЗУ «Про захист персональних даних».
5. **«5. Кому ми передаємо дані»** — the carrier (Nova Poshta) for delivery, the e-mail provider for transactional mail, the analytics provider; never sold to third parties.
6. **«6. Скільки ми їх зберігаємо»** — for as long as needed for the order and statutory accounting.
7. **«7. Ваші права»** — a `list`: access, correction, deletion, withdrawal of consent, objection; exercised through the feedback form.
8. **«8. Cookies»** — what the consent banner does; analytics load only after acceptance. This must match the real behaviour: GTM is gated on consent.
9. **«9. Зміни до політики»** — amendments published on this page.

- [ ] **Step 3: Draft `pages.returns`**

1. **«1. Строк повернення»** — 14 days from receipt, per ст. 9 ЗУ «Про захист прав споживачів».
2. **«2. Умови повернення»** — `list`: unworn, tags intact, original packaging, no signs of use, proof of purchase.
3. **«3. Як оформити повернення»** — numbered `list`: contact through the feedback form or Telegram, agree the return, send by Nova Poshta, refund after inspection.
4. **«4. Хто оплачує пересилку»** — the buyer for a change of mind; the seller when the item is defective or wrong.
5. **«5. Строк повернення коштів»** — after inspection, within the statutory period.
6. **«6. Обмін»** — subject to availability; same conditions.
7. **«7. Товар неналежної якості»** — rights under ст. 8: replacement, repair, price reduction or refund.

- [ ] **Step 4: Write the three route files**

`src/app/(shop)/terms/page.tsx` — the other two are identical but for the namespace, and `/faq` etc. in Task 5 omit `<SellerRequisites/>`:

```js
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StaticPage, SellerRequisites } from "@/components/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.terms.meta");
  return { title: t("title"), description: t("description") };
}

export default function TermsPage() {
  return (
    <StaticPage namespace="pages.terms">
      <SellerRequisites />
    </StaticPage>
  );
}
```

Repeat for `privacy` and `returns`, substituting the namespace in both the metadata call and the `StaticPage` prop. Do not abbreviate this into a shared factory — three 14-line files are clearer than one indirection, and each route needs its own `generateMetadata` export anyway.

**Do not set `openGraph.images`.** Doing so suppresses the site-wide generated OG card (`mergeStaticMetadata`'s `hasOwnProperty('images')` guard).

- [ ] **Step 5: Extend the page test**

Replace the second case in `tests/unit/static-pages.test.tsx` with a table-driven sweep:

```js
const LEGAL_PAGES = ["terms", "privacy", "returns"] as const;

describe.each(LEGAL_PAGES)("pages.%s", (slug) => {
  it("renders its title and at least five sections, all non-empty", async () => {
    const ui = await StaticPage({ namespace: `pages.${slug}` });
    render(ui);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent?.trim().length ?? 0).toBeGreaterThan(0);

    const headings = screen.getAllByRole("heading", { level: 2 });
    // Independently computed: the catalog's own section count, not `> 0`.
    const sections = (uk.pages as Record<string, { sections: unknown[] }>)[slug].sections;
    expect(headings).toHaveLength(sections.length);
    expect(sections.length).toBeGreaterThanOrEqual(5);

    for (const heading of headings) {
      expect(heading.textContent?.trim()).not.toBe("");
    }
  });

  it("names no forbidden fact", async () => {
    const ui = await StaticPage({ namespace: `pages.${slug}` });
    const { container } = render(ui);
    const text = container.textContent ?? "";
    // TASK-056 rows 4 and 14: no invented contact data, no third-party brands,
    // no authenticity claim. These are the facts we do not hold.
    for (const forbidden of [
      "Palm Angels",
      "Polo Ralph Lauren",
      "Lacoste",
      "оригінал",
      "репліка",
      "Укрпошта",
    ]) {
      expect(text).not.toContain(forbidden);
    }
    expect(text).not.toMatch(/\+380/);
  });
});
```

Add `import uk from "../../messages/uk.json";` at the top of the file.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/unit/static-pages.test.tsx`
Expected: all cases pass, including the two-per-page sweep.

- [ ] **Step 7: Verify the routes render in the real app**

```bash
rm -rf .next && npm run dev
```

Visit `/terms`, `/privacy`, `/returns`. Confirm each renders UA copy, an `<h1>`, the section headings, and the seller-requisites block showing the **fallback** branch (no ЄДРПОУ row). `rm -rf .next` is not optional — `next dev` serves a stale cache otherwise.

- [ ] **Step 8: Commit**

```bash
npm run typecheck && npm run lint
git add messages/uk.json "src/app/(shop)/terms" "src/app/(shop)/privacy" "src/app/(shop)/returns" tests/unit/static-pages.test.tsx
git commit -m "feat(g23): publish the public offer, privacy policy and return policy"
```

---

## Task 5: `/faq`, `/shipping`, `/about`

**Files:**

- Modify: `messages/uk.json` (`pages.faq`, `pages.shipping`, `pages.about`)
- Create: `src/app/(shop)/faq/page.tsx`, `src/app/(shop)/shipping/page.tsx`, `src/app/(shop)/about/page.tsx`
- Modify: `tests/unit/static-pages.test.tsx`

**Interfaces:**

- Consumes: `<StaticPage/>` (Task 3). These three do **not** mount `<SellerRequisites/>`.
- Produces: routes `/faq`, `/shipping`, `/about`; catalog keys `pages.{faq,shipping,about}`.

- [ ] **Step 1: Draft `pages.shipping`**

Must agree with `/contact`'s summary block and with what checkout actually does — the shipping methods are `np-office`, `np-courier`, `np-postomat` (`src/lib/shipping.ts`), priced in UAH.

1. **«1. Способи доставки»** — `list`: відділення Нової Пошти, поштомат, кур'єр за адресою. No other carrier.
2. **«2. Вартість доставки»** — carrier tariffs, calculated at checkout, paid by the buyer. **No free-shipping threshold** — none exists in the order path and the claim is formally retracted in `site.ts`.
3. **«3. Строки відправлення»** — dispatch timing, stated without inventing an SLA the client never confirmed; phrase it as a typical case, not a guarantee.
4. **«4. Оплата»** — payment on receipt, no prepayment; link to `/terms`.
5. **«5. Відстеження»** — a Nova Poshta ТТН, plus the site's own `/track` page. Link `/track`.

- [ ] **Step 2: Draft `pages.faq`**

Eight to ten entries, each a `section` whose `heading` is the question and whose `body` is the answer. Every answer must be true of the shipped app:

- «Чи потрібна передоплата?» — no; payment on receipt.
- «Як оформити замовлення?» — through the site; an account is not required (guest checkout is live).
- «Як дізнатися статус замовлення?» — `/track` with the order number and e-mail.
- «Які способи доставки?» — Nova Poshta branch, postomat, courier; link `/shipping`.
- «Скільки коштує доставка?» — carrier tariffs, shown at checkout.
- «Чи можна повернути товар?» — 14 days; link `/returns`.
- «Як підібрати розмір?» — the size picker on the product page. Do **not** promise measurement photos — that button is deliberately omitted until the client sends charts.
- «Чи є у вас фізичний магазин?» — online only.
- «Як з вами зв'язатися?» — link `/contact`.

- [ ] **Step 3: Draft `pages.about`**

1. **«Про Mirox Shop»** — the brand posture from TASK-056 row 14: a clothing shop, not a multibrand reseller of named brands. Reuse the tagline's register. No brand names, no authenticity claim.
2. **«Як ми працюємо»** — items checked before dispatch, Nova Poshta delivery, payment on receipt.
3. **«Наш досвід»** — the client's own claims, attributed as theirs: «понад 300 успішних покупок на OLX», «100+ замовлень через Instagram». These are UNAUDITED client claims (TASK-056 row 17) — write them as the shop's own statement, and never let them feed structured data.
4. **«Хто зробив цей сайт»** — the developer credit mention. Body names the developer and links `https://goodalex223.github.io`. Keep the copy short and factual. The link itself is wired in Task 10; for now the catalog carries the label and the URL comes from `DEVELOPER_CREDIT_HREF` (Task 7) — so **order Task 7 before this step's link renders**, or leave the mention as plain text here and add the anchor in Task 9. Plain text now, anchor in Task 9, is the simpler sequencing and is what this plan assumes.

- [ ] **Step 4: Write the three route files**

Same shape as Task 4 Step 4, without the `<SellerRequisites/>` child:

```js
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StaticPage } from "@/components/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.shipping.meta");
  return { title: t("title"), description: t("description") };
}

export default function ShippingPage() {
  return <StaticPage namespace="pages.shipping" />;
}
```

Repeat for `faq` and `about`.

- [ ] **Step 5: Widen the test sweep**

In `tests/unit/static-pages.test.tsx`, change the table to cover all six shell pages:

```js
/**
 * Controller ruling R4: a per-page minimum, NOT one global floor. A single
 * `>= 3` would silently weaken the `>= 5` guarantee Task 4 set on the three
 * legal pages — and those floors are the substance of the §5.3 item 9 gate,
 * not a style preference. Raise a number here only when a page genuinely
 * gains sections.
 */
const SHELL_PAGES = {
  terms: 10,
  privacy: 8,
  returns: 6,
  faq: 8,
  shipping: 5,
  about: 3,
} as const;
```

Drive the table with `describe.each(Object.entries(SHELL_PAGES))` and assert each page's `sections.length` is `>=` its own minimum. Keep the equality assertion of rendered `<h2>` count against the catalog's own count — that is the assertion with teeth; the minimum is the floor that stops a page being quietly gutted.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/unit/static-pages.test.tsx`
Expected: 12 passed (six pages × two cases).

- [ ] **Step 7: Commit**

```bash
npm run typecheck && npm run lint
git add messages/uk.json "src/app/(shop)/faq" "src/app/(shop)/shipping" "src/app/(shop)/about" tests/unit/static-pages.test.tsx
git commit -m "feat(g23): add the FAQ, shipping and about pages"
```

---

## Task 6: `/contact` — the bespoke page

**Files:**

- Modify: `messages/uk.json` (`pages.contact`)
- Create: `src/app/(shop)/contact/page.tsx`
- Modify: `tests/unit/static-pages.test.tsx` (or a sibling case block)

**Interfaces:**

- Consumes: `SOCIALS` from `@/content/brand`, `site.claims` from `@/content/site`.
- Produces: route `/contact`; catalog keys `pages.contact`.

**Reference:** [`Mirox Contacts.dc.html`](../../design/design_handoff_mirox/Mirox%20Contacts.dc.html). Follow its structure; use the app's own tokens (`bg-card`, `border-border`, `text-muted-foreground`), not the handoff's hardcoded hexes.

- [ ] **Step 1: Draft `pages.contact`**

```jsonc
"contact": {
  "meta": { "title": "Контакти", "description": "…" },
  "title": "Контакти",
  "intro": "Ми завжди на зв'язку — пишіть у зручний месенджер, відповідаємо без вихідних.",
  "managerLabel": "Менеджер",
  "reviewsLabel": "Канал відгуків",
  "delivery": { "heading": "Доставка та оплата", "items": ["…"], "moreLabel": "Докладніше про доставку" },
  "returns": { "heading": "Повернення", "items": ["…"], "moreLabel": "Умови повернення" },
  "about": { "heading": "Про Mirox Shop", "body": "…" },
  "stats": { "olx": "покупок на OLX", "instagram": "замовлень в Instagram" },
  "form": { "heading": "Написати нам", "body": "…", "cta": "Форма зворотного зв'язку" }
}
```

The `delivery.items` and `returns.items` lists are **summaries** of `/shipping` and `/returns`, each ending with a link to the full page — a summary→detail relationship, not duplicated prose (spec §5).

- [ ] **Step 2: Write the page**

`src/app/(shop)/contact/page.tsx`. Key structural requirements:

- Social cards from `SOCIALS` — mapped, not hardcoded, so the handles stay single-sourced. `grid-cols-1 sm:grid-cols-3` (declare `grid-cols-1` explicitly).
- The manager Telegram and reviews-channel rows render from constants added in Task 7. **This task renders the social cards and the blocks; Task 7 adds those two rows.** Do not hardcode `t.me/mirox_manager` here.
- Delivery and returns blocks, each a `<section>` with a heading, a `<ul>` and a `<Link>` to the full page.
- The about block with two stat cards, each null-gated on `site.claims.olxSales` / `instagramOrders` — render nothing if null, never a zero.
- A link to `/feedback`.
- No phone, no address.

- [ ] **Step 3: Write the test**

```js
import { SOCIALS } from "@/content/brand";
import ContactPage from "@/app/(shop)/contact/page";

describe("/contact", () => {
  it("renders every social link from SOCIALS, not hardcoded handles", async () => {
    const ui = await ContactPage();
    render(ui);
    for (const social of SOCIALS) {
      expect(screen.getByRole("link", { name: new RegExp(social.label, "i") })).toHaveAttribute(
        "href",
        social.href
      );
    }
  });

  it("links out to the full shipping and returns pages", async () => {
    render(await ContactPage());
    expect(screen.getByRole("link", { name: /докладніше про доставку/i })).toHaveAttribute(
      "href",
      "/shipping"
    );
    expect(screen.getByRole("link", { name: /умови повернення/i })).toHaveAttribute(
      "href",
      "/returns"
    );
  });

  it("renders no phone number", async () => {
    const { container } = render(await ContactPage());
    expect(container.textContent ?? "").not.toMatch(/\+380/);
  });
});
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/static-pages.test.tsx`
Expected: all pass.

- [ ] **Step 5: Verify in the browser**

`rm -rf .next && npm run dev`, visit `/contact` at 1440px and at 390px. Confirm the social cards sit in three columns on desktop and one on mobile, and that nothing scrolls sideways.

- [ ] **Step 6: Commit**

```bash
npm run typecheck && npm run lint
git add messages/uk.json "src/app/(shop)/contact" tests/unit/static-pages.test.tsx
git commit -m "feat(g23): add the contact page per the design handoff"
```

---

## Task 7: Manager-contact single-sourcing

One handle, three surfaces. Today `/contact` does not exist, and checkout and the order e-mail render «напишіть менеджеру» beside the _channel_ link `t.me/mirox_shop` — so the client reply's п.5/п.6 statement names a handle the site never links.

**Files:**

- Modify: `src/content/brand.ts`
- Modify: `src/content/checkout.ts`
- Modify: `src/content/emails.ts`
- Modify: `src/app/(shop)/contact/page.tsx`
- Modify: `src/components/pages/SellerRequisites.tsx`
- Modify: `messages/uk.json` (`pages.common.requisites.fallbackTelegram`)
- Create: `tests/unit/manager-contact.test.ts`

**Interfaces:**

- Produces:
  - `MANAGER_TELEGRAM_HREF: string` — `"https://t.me/mirox_manager"`
  - `REVIEWS_CHANNEL_HREF: string` — `"https://t.me/mirox_vidgyk"`
  - `DEVELOPER_CREDIT_HREF: string` — `"https://goodalex223.github.io"` (consumed by Task 9)
  - `checkout.contacts.manager: string`

**Deviation on the record (spec §6):** BACKLOG 🟤 [2026-09-16] proposed putting the manager Telegram link _into the WhatsApp slot_. This plan does not. `WHATSAPP_HREF` stays `null` and the manager link gets its own named slot — a Telegram URL rendered under a WhatsApp label is untrue on checkout and on a transactional e-mail, which are the two surfaces where the site is asking to be trusted. Record this in the PR body so the backlog entry can be closed with the deviation cited.

- [ ] **Step 1: Add the constants**

Append to `src/content/brand.ts` (which must stay import-free — these are plain strings, so the contract holds):

```js
/**
 * Manager handle. VERIFIED 2026-09-16 (TASK-056 row 4) — the handle the
 * client's own reply names. Distinct from SOCIALS' `telegram`, which is the
 * shop CHANNEL (t.me/mirox_shop): the channel broadcasts, the manager answers.
 *
 * Deliberately NOT placed in the WHATSAPP_HREF slot (G23 spec §6): a Telegram
 * URL under a WhatsApp label would be a small untruth on checkout and on the
 * order e-mail. WHATSAPP_HREF stays null until a real number arrives.
 */
export const MANAGER_TELEGRAM_HREF = "https://t.me/mirox_manager";

/** Reviews channel. VERIFIED 2026-09-16 (TASK-056 row 16) — shown on /contact only, per that row. */
export const REVIEWS_CHANNEL_HREF = "https://t.me/mirox_vidgyk";

/**
 * The developer's site, carrying every contact method (URL supplied by the
 * user 2026-09-16). Part of the verbal agreement: the site is built in
 * exchange for this credit, portfolio use and client reviews. E-mail is
 * deliberately NOT rendered anywhere on the storefront — harvestable, and it
 * already lives on the linked site.
 */
export const DEVELOPER_CREDIT_HREF = "https://goodalex223.github.io";
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/manager-contact.test.ts`:

```js
import { describe, it, expect } from "vitest";
import { MANAGER_TELEGRAM_HREF, REVIEWS_CHANNEL_HREF, WHATSAPP_HREF } from "@/content/brand";
import { checkout } from "@/content/checkout";
import { emails } from "@/content/emails";

describe("manager contact single-sourcing", () => {
  it("exposes the manager handle distinctly from the shop channel", () => {
    expect(MANAGER_TELEGRAM_HREF).toBe("https://t.me/mirox_manager");
    expect(REVIEWS_CHANNEL_HREF).toBe("https://t.me/mirox_vidgyk");
  });

  it("leaves the WhatsApp slot null rather than filling it with Telegram", () => {
    // G23 spec §6 — the deliberate deviation from BACKLOG [2026-09-16].
    expect(WHATSAPP_HREF).toBeNull();
  });

  it("reaches the checkout payment step", () => {
    expect(checkout.contacts.manager).toBe(MANAGER_TELEGRAM_HREF);
  });

  it("reaches the order e-mail contact block exactly once", () => {
    const hrefs = emails.order.contacts.map((c) => c.href);
    expect(hrefs).toContain(MANAGER_TELEGRAM_HREF);
    expect(hrefs.filter((h) => h === MANAGER_TELEGRAM_HREF)).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run tests/unit/manager-contact.test.ts`
Expected: FAIL — `checkout.contacts.manager` is undefined.

- [ ] **Step 4: Wire the three consumers**

In `src/content/checkout.ts`, import `MANAGER_TELEGRAM_HREF` and add to `contacts`:

```js
  contacts: {
    manager: MANAGER_TELEGRAM_HREF,
    instagram: site.socials.find((s) => s.platform === "instagram")?.href ?? null,
    telegram: site.socials.find((s) => s.platform === "telegram")?.href ?? null,
    whatsapp: WHATSAPP_HREF,
  },
```

In `src/content/emails.ts`, prepend the manager to the order contact list, keeping the existing WhatsApp gate untouched:

```js
    contacts: [
      { platform: "telegram" as const, label: "Менеджер", href: MANAGER_TELEGRAM_HREF },
      ...SOCIALS.filter((s) => s.platform === "instagram" || s.platform === "telegram"),
      ...(WHATSAPP_HREF
        ? [{ platform: "whatsapp" as const, label: "WhatsApp", href: WHATSAPP_HREF }]
        : []),
    ],
```

In `src/app/(shop)/contact/page.tsx`, add the manager row and the reviews-channel row (the placeholders left by Task 6 Step 2).

In `src/components/pages/SellerRequisites.tsx`, add a Telegram link beside the existing `/feedback` link in the null branch, using a new `fallbackTelegram` catalog key.

- [ ] **Step 5: Run the test and confirm it passes**

Run: `npx vitest run tests/unit/manager-contact.test.ts`
Expected: 4 passed.

- [ ] **Step 6: Check the e-mail template still renders**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: PASS. If a snapshot-style assertion counts contact rows, update it deliberately and note the count change in the commit message.

- [ ] **Step 7: Commit**

```bash
npm run typecheck && npm run lint
git add src/content "src/app/(shop)/contact" src/components/pages messages/uk.json tests/unit/manager-contact.test.ts
git commit -m "feat(g23): single-source the manager Telegram link across contact, checkout and email"
```

---

## Task 8: Header entry, footer restructure, and the link-integrity guard

The guard is the point of this task: it turns the no-dead-links rule from a convention people remember into a test that fails.

**Files:**

- Modify: `src/components/common/Header.tsx:44-48`
- Modify: `src/components/common/Footer.tsx`
- Modify: `messages/uk.json` (`header.nav.contacts`, `footer.groups.*`, `footer.links.*`)
- Create: `tests/unit/nav-link-integrity.test.ts`

**Interfaces:**

- Consumes: every route from Tasks 4–6.
- Produces: `SHOP_LINK_GROUPS` exported from `Footer.tsx` — `readonly { key: string; links: readonly { key: string; href: string }[] }[]`.

- [ ] **Step 1: Add the header entry**

In `Header.tsx`, append to `navigation` (the array feeds both the desktop nav and the mobile sheet, so this is the whole change):

```js
const navigation = [
  { key: "catalog", href: "/products" },
  { key: "new", href: "/products?sort=new" },
  { key: "bestsellers", href: "/products?sort=popular" },
  { key: "contacts", href: "/contact" },
] as const;
```

Add `"contacts": "Контакти"` to `header.nav` in the catalog.

Only «Контакти» joins the header (spec §7). Design spec §4's six-item nav would put roughly 920px of content in a 768px bar and force the nav breakpoint to `lg`, taking the desktop nav away from 768–1023px tablets.

- [ ] **Step 2: Restructure the footer**

Replace the flat `shopLinks` with two named groups, exported so the guard can read them:

```js
/**
 * Footer link groups. Exported because tests/unit/nav-link-integrity.test.ts
 * asserts every internal href here resolves to a real route file — the
 * executable form of the no-dead-links rule (user ruling 2026-07-28).
 *
 * `key` (not the label) is the stable identity; `as const` narrows it to the
 * literal union next-intl's typed catalog keys require.
 */
export const SHOP_LINK_GROUPS = [
  {
    key: "shop",
    links: [
      { key: "catalog", href: "/products" },
      { key: "categories", href: "/categories" },
      { key: "new", href: "/products?sortBy=createdAt&sortOrder=desc" },
      { key: "track", href: "/track" },
      { key: "feedback", href: "/feedback" },
    ],
  },
  {
    key: "info",
    links: [
      { key: "about", href: "/about" },
      { key: "shipping", href: "/shipping" },
      { key: "returns", href: "/returns" },
      { key: "faq", href: "/faq" },
      { key: "contact", href: "/contact" },
      { key: "privacy", href: "/privacy" },
      { key: "terms", href: "/terms" },
    ],
  },
] as const;
```

Render them as a new band **above** the copyright row: `grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4`, each group a heading (`footer.groups.<key>`) plus a vertical list. Declare `grid-cols-1` explicitly.

Then **remove the link nav from the copyright row**, leaving it holding the brand line only — Task 9 adds the developer credit as its second element. Keep the row's `flex-wrap` and its asymmetric `gap-x-6 gap-y-2`: that is the G20 overflow fix and its comment must survive the edit.

Add the catalog keys: `footer.groups.shop` / `footer.groups.info`, and `footer.links.{about,shipping,returns,faq,contact,privacy,terms}`.

- [ ] **Step 3: Write the failing guard**

Create `tests/unit/nav-link-integrity.test.ts`:

```js
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { SHOP_LINK_GROUPS } from "@/components/common/Footer";

/**
 * The no-dead-links rule (user ruling 2026-07-28) as a test.
 *
 * TASK-035 hid the footer's info links rather than ship 404s, and the rule has
 * been enforced by memory ever since. Stated conventions are not controls:
 * this walks every internal href the chrome renders and asserts a route file
 * exists for it.
 */

const APP_DIR = path.resolve(__dirname, "../../src/app");

/**
 * Header hrefs, DERIVED from the source file rather than hand-mirrored.
 *
 * Controller ruling R5: Header.tsx is "use client" and importing it drags in
 * next-auth and zustand, so a direct import is impractical — but a hand-copied
 * mirror rots silently, leaving this guard green while the header drifts,
 * which is the exact failure the guard exists to prevent. So: read the file,
 * extract its href literals, and assert the extracted set covers what we
 * expect BEFORE walking it.
 */
const HEADER_SRC = readFileSync(
  path.resolve(__dirname, "../../src/components/common/Header.tsx"),
  "utf8"
);
const HEADER_HREFS = [...HEADER_SRC.matchAll(/href=\{?"(\/[^"]*)"/g)].map((m) => m[1]);

/** What the header is expected to link. Update deliberately, with the header. */
const EXPECTED_HEADER_HREFS = [
  "/products",
  "/products?sort=new",
  "/products?sort=popular",
  "/contact",
  "/categories",
];

function routeFileFor(href: string): string {
  const pathname = href.split("?")[0].replace(/\/$/, "") || "/";
  const segments = pathname === "/" ? [] : pathname.slice(1).split("/");
  return path.join(APP_DIR, "(shop)", ...segments, "page.tsx");
}

describe("navigation link integrity", () => {
  const footerHrefs = SHOP_LINK_GROUPS.flatMap((g) => g.links.map((l) => l.href));
  const allHrefs = [...EXPECTED_HEADER_HREFS, ...footerHrefs];

  it("walks a non-empty, independently counted set of links", () => {
    // Guard the guard: 5 shop + 7 info. A silently emptied SHOP_LINK_GROUPS
    // would otherwise make every assertion below vacuous.
    expect(footerHrefs).toHaveLength(12);
    expect(allHrefs).toHaveLength(17);
  });

  it("still sees every href the header source actually renders", () => {
    // R5: fails loudly if the header nav changes without this guard being
    // updated, instead of drifting green against a stale copy.
    for (const href of EXPECTED_HEADER_HREFS) {
      expect(HEADER_HREFS).toContain(href);
    }
  });

  it.each([...new Set(allHrefs)])("%s resolves to a route file", (href) => {
    const candidate = routeFileFor(href);
    const isRoot = href === "/";
    expect(isRoot || existsSync(candidate)).toBe(true);
  });
});
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run tests/unit/nav-link-integrity.test.ts`
Expected: all pass.

- [ ] **Step 5: Prove the guard has teeth**

Temporarily add `{ key: "bogus", href: "/definitely-not-a-route" }` to the `info` group and re-run.

Run: `npx vitest run tests/unit/nav-link-integrity.test.ts`
Expected: **FAIL** on `/definitely-not-a-route resolves to a route file`, and also on the length assertion (13 ≠ 12).

Then a third control for ruling R5: temporarily delete the `{ key: "contacts", href: "/contact" }` entry from `Header.tsx`'s `navigation` array and re-run. Expected: **FAIL** on "still sees every href the header source actually renders" — proving the derivation reads the real file rather than a stale copy. Restore it.

Remove the bogus entry and re-run. Expected: all pass.

Then a second control: temporarily empty the `info` group's `links` array and re-run. Expected: **FAIL** on the length assertion — proving the count check catches a silently emptied list rather than passing vacuously. Restore it.

- [ ] **Step 6: Verify in the browser**

`rm -rf .next && npm run dev`. At 1440px confirm the footer's two groups render side by side and «Контакти» is in the header nav. At 390px confirm the groups stack, nothing overflows, and the copyright row still wraps.

- [ ] **Step 7: Commit**

```bash
npm run typecheck && npm run lint
git add src/components/common/Header.tsx src/components/common/Footer.tsx messages/uk.json tests/unit/nav-link-integrity.test.ts
git commit -m "feat(g23): restore the header and footer info links behind a link-integrity guard"
```

---

## Task 9: Developer credit

Part of the verbal agreement — the site is built in exchange for this credit, portfolio use and client reviews.

**Files:**

- Modify: `src/components/common/Footer.tsx`
- Modify: `src/app/(shop)/about/page.tsx` (or its catalog entry — see Step 3)
- Modify: `src/lib/seo.ts` (`getDefaultMetadata()`'s `authors` field — this is what emits `<meta name="author">`; the root layout only awaits it)
- Create: `src/components/pages/DeveloperCredit.tsx`
- Modify: `src/components/pages/index.ts`
- Modify: `messages/uk.json` (`footer.developerCredit`, `pages.about.credit.*`)
- Create: `public/humans.txt`
- Modify: `README.md`
- Create: `tests/unit/developer-credit.test.tsx`

**Interfaces:**

- Consumes: `DEVELOPER_CREDIT_HREF` (Task 7).

- [ ] **Step 1: Add the footer credit**

In the copyright row — which Task 8 left holding only the brand line — add a second element. The row is already `flex-wrap` with `gap-x-6 gap-y-2` (the G20 fix), so at 390px this becomes its own wrapped line:

```js
<span>
  {t("developerCredit")}{" "}
  <a
    href={DEVELOPER_CREDIT_HREF}
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-foreground underline underline-offset-4 transition-colors"
  >
    GoodAlex223
  </a>
</span>
```

Catalog: `"developerCredit": "Розроблено —"`. The handle itself is not translatable copy, so it stays a literal — same reasoning as `site.name`.

- [ ] **Step 2: Add the `<meta name="author">`**

In `getDefaultMetadata()` in `src/lib/seo.ts`, the `authors` field currently names the store. Add the developer as a second author entry rather than replacing the store:

```js
    authors: [{ name: siteConfig.name }, { name: "GoodAlex223", url: DEVELOPER_CREDIT_HREF }],
```

- [ ] **Step 3: Add the `/about` anchor**

Task 5 drafted «Хто зробив цей сайт» as plain text. Now make the mention a link. `StaticPage` renders `body` paragraphs as plain strings, so rather than teach the shell about rich text for one sentence, render the credit as `children` of `<StaticPage>` on the about page:

```js
export default function AboutPage() {
  return (
    <StaticPage namespace="pages.about">
      <DeveloperCredit />
    </StaticPage>
  );
}
```

with a small `src/components/pages/DeveloperCredit.tsx` reading `pages.about.credit.{heading,body,linkLabel}`. Drop the plain-text section from `pages.about.sections` when you do this, so the credit appears exactly once.

- [ ] **Step 4: Write `public/humans.txt`**

```
/* TEAM */
Developer: GoodAlex223
Site: https://goodalex223.github.io
Location: Ukraine

/* SITE */
Name: Mirox Shop
Standards: HTML5, CSS3, TypeScript
Components: Next.js, React, Tailwind CSS, Prisma
```

No e-mail — it lives on the linked site (user ruling 2026-09-16).

- [ ] **Step 5: Add the README credit line**

A short line near the top of `README.md` naming the developer and linking the site.

- [ ] **Step 6: Write the test**

```js
describe("developer credit", () => {
  it("renders once in the footer, linking the developer site", () => {
    renderWithIntl(<Footer />);
    const link = screen.getByRole("link", { name: "GoodAlex223" });
    expect(link).toHaveAttribute("href", "https://goodalex223.github.io");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("renders no e-mail address in the footer", () => {
    const { container } = renderWithIntl(<Footer />);
    expect(container.textContent ?? "").not.toContain("@");
  });
});
```

- [ ] **Step 7: Run the tests and commit**

```bash
npx vitest run tests/unit/developer-credit.test.tsx
npm run typecheck && npm run lint
git add src/components src/lib/seo.ts src/app messages/uk.json public/humans.txt README.md tests/unit/developer-credit.test.tsx
git commit -m "feat(g23): add the developer credit to the footer, about page, humans.txt and metadata"
```

---

## Task 10: Sitemap rows and the E2E sweeps

**Files:**

- Modify: `src/app/sitemap.ts`
- Modify: `tests/e2e/mobile-overflow.spec.ts`
- Modify: `tests/e2e/navigation.spec.ts`

- [ ] **Step 1: Add the sitemap rows**

Append to `staticPages` in `src/app/sitemap.ts`, keeping the existing object shape:

```js
    ...(
      [
        ["/contact", 0.5],
        ["/about", 0.5],
        ["/shipping", 0.3],
        ["/returns", 0.3],
        ["/faq", 0.3],
        ["/privacy", 0.3],
        ["/terms", 0.3],
      ] as const
    ).map(([path, priority]) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority,
    })),
```

- [ ] **Step 2: Extend the mobile-overflow spec**

In `tests/e2e/mobile-overflow.spec.ts`, extend `PAGES`. Update the array's explanatory comment to say why the new routes are there — the footer restructure is the G20 bug class and these are the pages that carry the new band:

```js
const PAGES = [
  "/",
  "/products",
  "/cart",
  "/track",
  "/feedback",
  "/contact",
  "/about",
  "/shipping",
  "/returns",
  "/faq",
  "/privacy",
  "/terms",
];
```

- [ ] **Step 3: Add the E2E link sweep**

In `tests/e2e/navigation.spec.ts`, add a test that visits `/`, collects every `footer a[href^="/"]` and header nav href, then navigates to each and asserts a 200 response and a visible `h1`. Assert the collected count is 12 footer links before iterating — an empty selector would otherwise make the sweep pass without visiting anything.

- [ ] **Step 4: Run the full unit suite**

Run: `npm run test:run`
Expected: all pass. Fix anything the new routes broke — in particular `tests/unit/robots.test.ts` and any test asserting a sitemap row count.

- [ ] **Step 5: Run the E2E suite**

Run: `npm run test:e2e`
Expected: all pass. This needs a seeded local database (`npm run db:seed`) and the dev server on port 3001.

- [ ] **Step 6: Commit**

```bash
git add src/app/sitemap.ts tests/e2e
git commit -m "test(g23): sitemap rows plus mobile-overflow and link-sweep coverage for the new routes"
```

---

## Task 11: Client review package and documentation close-out

**Files:**

- Create: `docs/reference/<drafting-date>-task-055-copy-for-client.md`
- Modify: `docs/README.md` (index row for the new reference doc)
- Modify: `docs/planning/TODO.md` (TASK-055 ACs)
- Modify: `CLAUDE.md` (the `pages` namespace and its client-payload exclusion)

- [ ] **Step 1: Write the review package**

UA, messenger-paste format, following `docs/reference/2026-08-21-client-ask.md`. It contains:

- A one-paragraph preamble: we drafted all seven pages per their 2026-09-16 delegation; please read and tell us what to change.
- The full copy of all seven pages, page by page.
- **The disclaimer (spec §12), stated plainly in UA:** this text was drafted by us and has not been reviewed by a lawyer; it follows the statutory requirements and what payment gateways ask for, but it is not legal advice.
- **The one thing we cannot draft:** the seller's requisites — legal form, name, ЄДРПОУ/РНОКПП, registered address. Explain that until these arrive the pages publish without them, and that no payment gateway can be connected at all without a registered ФОП/ТОВ (payments decision §5.0).
- The publish protocol: we publish after their OK, or after three working days of silence.

- [ ] **Step 2: Index the new doc**

Add a row to `docs/README.md`'s table and confirm the index's own `**Last Updated**` header is ≥ every date it lists.

- [ ] **Step 3: Update TASK-055's acceptance criteria in TODO.md**

Tick AC 1 and AC 3. Leave AC 2 open until the client responds or the silence window closes. Record that the seller requisites remain outstanding and that §5.3 item 9's "published" half is now satisfied.

- [ ] **Step 4: Reconcile this plan's code snippets with what actually shipped**

Ruling R6 removed this plan from `plan-snippets.test.ts`'s automated drift check, so do it by hand once: walk the plan's `js` fences and compare each against the file it names. Where a fix round or a review changed the shipped code, update the plan's snippet to match. This is the check the guard would have run.

- [ ] **Step 5: Update CLAUDE.md**

Two additions: the `pages` namespace under the i18n pattern (noting it is server-only and stripped from the client payload alongside `admin`), and `src/content/legal.ts` in the `content/` file list.

- [ ] **Step 6: Run the docs guard**

Run: `npx vitest run tests/unit/docs-freshness.test.ts`
Expected: all pass. If it fails on a date or a missing index row, fix the doc — not the test.

- [ ] **Step 7: Full verification before the PR**

```bash
npm run typecheck && npm run lint && npm run format:check && npm run test:run
```

All four must pass. Then push and open the PR.

- [ ] **Step 8: Commit**

```bash
git add docs CLAUDE.md
git commit -m "docs(g23): client review package, TODO/CLAUDE updates, doc index rows"
```

---

## Verification before merge

- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:run` all green.
- [ ] `npm run test:e2e` green.
- [ ] Every one of the seven routes returns 200 and renders UA copy in a real browser.
- [ ] `<SellerRequisites/>` shows the **fallback** branch in production (no ЄДРПОУ row) — that is the state that ships.
- [ ] Both guards proved red and restored (Task 1 Step 5, Task 8 Step 5).
- [ ] No footer or header link 404s at 1440px and 390px.
- [ ] No horizontal scroll on any new page at 390px.
- [ ] Visual gate: screenshots of `/contact`, `/terms` and the new footer at both widths, delivered as an **artifact URL** — chat-inline images never reach the user.
- [ ] After merge, the deploy carries CSS changes (the footer band), so run `npm run smoke` and confirm the CSS row reads `CHANGED`, not `UNCHANGED`.

## Out of scope

- RU translations of the `pages` namespace — deliberate (spec §4).
- The seller's requisites — client-owed; `LEGAL_ENTITY` stays `null`.
- Any phone number or postal address — not supplied, not invented.
- TASK-048 payments — this group lifts only the "published" half of §5.3 item 9.
