# TASK-039 i18n Foundation (G9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship next-intl cookie-mode locale infrastructure (UA default / RU toggle), externalize every customer-facing UI string into `messages/{uk,ru}.json`, and verify `formatPrice()` against decision-doc §7.4.

**Architecture:** next-intl v4 without i18n routing — locale resolves from a `NEXT_LOCALE` cookie inside `getRequestConfig`; RU messages deep-merge over UA (missing RU keys render UA). No URL changes, no middleware changes. Strings migrate byte-identically from `src/content/*.ts` + inline component literals into domain-namespaced catalogs; config values (icons, hrefs, client-supplied data) stay in trimmed TS modules.

**Tech Stack:** Next.js 14.2.35 (App Router, `force-dynamic`), React 18.3.1, next-intl ^4.8.3, TypeScript strict, Vitest + RTL, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-14-task-039-i18n-foundation-design.md` (approved 2026-08-14; the four user rulings are §"User rulings")

## Global Constraints

- **Byte-identical law**: every existing UA string moves verbatim — no re-spelling, no punctuation "fixes". `scripts/i18n-byte-diff.mjs` (Task 3) must pass after every extraction task. Deliberate rewrites require a line in `scripts/i18n-byte-diff-allow.txt` + a plan-log entry.
- **Next 14, not 15**: `cookies()` from `next/headers` is **synchronous** (`const store = cookies()`); dynamic-route client pages keep `useParams<{ id: string }>()!` (G3). Do not copy Next-15-style `await cookies()` from next-intl docs.
- **Out of scope** (spec §"Scope boundaries"): DB product/category data, `src/content/emails.ts` + email templates, Zod messages in `src/lib/validations/index.ts`, `category-client.tsx`, admin surfaces incl. `ProductForm.tsx`, URL-based routing/hreflang.
- **Only new dependency**: `next-intl`. No lodash/deepmerge packages — hand-rolled merge.
- **No new env vars.**
- Repo conventions apply: Prettier double quotes/semicolons, ESLint bare `catch`, no `console.error` in API routes, `npm run typecheck` before commits (pre-commit hooks run lint-staged).
- Non-async components use `useTranslations` (RTL-testable, works in server components too); **only** async server components / `generateMetadata` use `getTranslations`.
- All commits on `feat/task-039-i18n-foundation`; conventional commit style `feat(i18n): …`. Update the **Progress log** (bottom of this file) in the same commit as each task.

## File Structure (end state)

```
messages/
├── uk.json                    # UA catalog — source of truth for all UI copy
├── ru.json                    # RU catalog — DRAFT (agent-translated, pending client sign-off)
└── README.md                  # DRAFT status, nuance-flag list, namespace conventions
src/i18n/
├── config.ts                  # LOCALES, Locale, DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_LABELS, resolveLocale()
├── merge.ts                   # deepMerge() for message trees
├── request.ts                 # getRequestConfig: cookie → locale → merged messages
└── actions.ts                 # "use server" setLocale()
src/components/common/LocaleSwitcher.tsx   # UA | RU toggle (client)
scripts/i18n-byte-diff.mjs     # verbatim-extraction verifier (Cyrillic fragments)
scripts/i18n-byte-diff-allow.txt
global.d.ts                    # next-intl AppConfig augmentation (typed t() keys)
tests/helpers/render-with-intl.tsx         # RTL render wrapped in NextIntlClientProvider
tests/unit/i18n-config.test.ts             # resolveLocale + deepMerge
tests/unit/i18n-catalogs.test.ts           # catalog integrity (orphans, retraction regex, ru coverage)
tests/unit/locale-switcher.test.tsx
tests/e2e/locale-toggle.spec.ts
Trimmed (config only): src/content/{brand,site,home,checkout,account}.ts
Deleted: src/content/{cart,auth,system,feedback,newsletter}.ts
Untouched: src/content/emails.ts, src/lib/validations/index.ts, category-client.tsx
```

---

### Task 1: next-intl infrastructure (plugin, request config, provider, html lang, test helper)

**Files:**

- Modify: `package.json` (dependency), `next.config.mjs`, `src/app/layout.tsx`
- Create: `src/i18n/config.ts`, `src/i18n/merge.ts`, `src/i18n/request.ts`, `global.d.ts`, `messages/uk.json`, `messages/ru.json`, `tests/helpers/render-with-intl.tsx`
- Test: `tests/unit/i18n-config.test.ts`

**Interfaces:**

- Produces: `LOCALES: readonly ["uk","ru"]`, `type Locale = "uk" | "ru"`, `DEFAULT_LOCALE: "uk"`, `LOCALE_COOKIE = "NEXT_LOCALE"`, `LOCALE_LABELS: Record<Locale,string>`, `resolveLocale(raw: string | undefined): Locale`, `deepMerge(base, override)`, `renderWithIntl(ui, options?)` — every later task consumes these exact names.

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl@^4.8.3
```

Verify `package.json` gained `"next-intl": "^4.8.3"` and `npm ls next-intl` resolves without peer warnings (peers: next ^14, react ^18 — pinned stack satisfies both).

- [ ] **Step 2: Write the failing tests for locale resolution + merge**

Create `tests/unit/i18n-config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, resolveLocale } from "@/i18n/config";
import { deepMerge } from "@/i18n/merge";

describe("resolveLocale", () => {
  it("returns uk for undefined (no cookie)", () => {
    expect(resolveLocale(undefined)).toBe("uk");
  });
  it("returns uk for garbage values", () => {
    expect(resolveLocale("en")).toBe("uk");
    expect(resolveLocale("uk-UA")).toBe("uk");
    expect(resolveLocale("")).toBe("uk");
  });
  it("returns each supported locale verbatim", () => {
    for (const l of LOCALES) expect(resolveLocale(l)).toBe(l);
  });
  it("defaults to uk", () => {
    expect(DEFAULT_LOCALE).toBe("uk");
  });
});

describe("deepMerge", () => {
  it("overrides scalars and recurses into nested objects", () => {
    const base = { a: { b: "укр", c: "спільне" }, d: "базове" };
    const override = { a: { b: "рус" } };
    expect(deepMerge(base, override)).toEqual({
      a: { b: "рус", c: "спільне" },
      d: "базове",
    });
  });
  it("does not mutate its inputs", () => {
    const base = { a: { b: "x" } };
    const override = { a: { b: "y" } };
    deepMerge(base, override);
    expect(base.a.b).toBe("x");
  });
  it("ignores override keys that are objects where base has strings (shape mismatch keeps base)", () => {
    const base = { a: "текст" };
    const override = { a: { broken: "shape" } } as unknown as typeof base;
    expect(deepMerge(base, override)).toEqual({ a: "текст" });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/unit/i18n-config.test.ts`
Expected: FAIL — `Cannot find module '@/i18n/config'`.

- [ ] **Step 4: Implement config, merge, request, catalogs**

`src/i18n/config.ts`:

```ts
/**
 * Locale registry for the cookie-mode i18n setup (TASK-039 spec §1).
 * UA is the legal + SEO default; RU is a user-preference toggle. The cookie
 * name matches next-intl's routing convention so a future URL-routing
 * upgrade reads the same cookie.
 */
export const LOCALES = ["uk", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uk";
export const LOCALE_COOKIE = "NEXT_LOCALE";
/** Display labels for the header toggle. */
export const LOCALE_LABELS: Record<Locale, string> = { uk: "UA", ru: "RU" };

export function resolveLocale(raw: string | undefined): Locale {
  return (LOCALES as readonly string[]).includes(raw ?? "") ? (raw as Locale) : DEFAULT_LOCALE;
}
```

`src/i18n/merge.ts`:

```ts
type MessageTree = { [key: string]: string | MessageTree };

/**
 * RU-over-UA message merge (spec §1): a missing or shape-mismatched RU key
 * silently keeps the UA value, so partial RU coverage never breaks the UI.
 */
export function deepMerge<T extends MessageTree>(base: T, override: MessageTree): T {
  const out: MessageTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    if (typeof value === "string" && typeof current === "string") {
      out[key] = value;
    } else if (
      value !== null &&
      typeof value === "object" &&
      current !== null &&
      typeof current === "object"
    ) {
      out[key] = deepMerge(current as MessageTree, value);
    }
    // shape mismatch or key absent in base: keep base (uk is the schema)
  }
  return out as T;
}
```

`src/i18n/request.ts` (thin adapter — pure parts are tested above; this file is covered by the Task 2 E2E):

```ts
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale } from "./config";
import { deepMerge } from "./merge";
import uk from "../../messages/uk.json";
import ru from "../../messages/ru.json";

export default getRequestConfig(async () => {
  // Next 14: cookies() is synchronous (await-style is Next 15 — G3 lesson class).
  const store = cookies();
  const locale = resolveLocale(store.get(LOCALE_COOKIE)?.value);
  return {
    locale,
    messages: locale === "ru" ? deepMerge(uk, ru) : uk,
    timeZone: "Europe/Kyiv",
  };
});
```

`messages/uk.json` (seed; domains land in Tasks 3–8):

```json
{
  "common": {
    "localeSwitcher": "Мова"
  }
}
```

`messages/ru.json` (seed):

```json
{
  "common": {
    "localeSwitcher": "Язык"
  }
}
```

`global.d.ts` (repo root — covered by tsconfig `**/*.ts` include; `resolveJsonModule` already on):

```ts
import type uk from "./messages/uk.json";
import type { Locale } from "./src/i18n/config";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof uk;
  }
}
```

`next.config.mjs` — top of file:

```js
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(); // default path: ./src/i18n/request.ts
```

…and the export at the bottom changes from `export default nextConfig;` to:

```js
export default withNextIntl(nextConfig);
```

(If the file exports through an analyzer/wrapper chain, wrap the outermost value.)

- [ ] **Step 5: Wire the root layout (html lang fix + provider)**

In `src/app/layout.tsx`: add imports, make the component async, replace `lang="en"`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
```

```tsx
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const organizationJsonLd = getOrganizationJsonLd();
  const websiteJsonLd = getWebsiteJsonLd();

  return (
    <html
      lang={locale}
      ...
```

and wrap the body content:

```tsx
<body className={...}>
  <NextIntlClientProvider>
    <Providers>{children}</Providers>
  </NextIntlClientProvider>
</body>
```

(`NextIntlClientProvider` rendered from a server component auto-inherits locale + messages from the request config. Full-catalog client payload is the accepted spec trade-off.)

- [ ] **Step 6: Create the RTL helper**

`tests/helpers/render-with-intl.tsx`:

```tsx
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import uk from "../../messages/uk.json";

/**
 * RTL render wrapped in the intl provider with the real UA catalog, so
 * component tests exercise exactly the strings production renders.
 */
export function renderWithIntl(ui: ReactElement, options?: RenderOptions) {
  return render(
    <NextIntlClientProvider locale="uk" messages={uk} timeZone="Europe/Kyiv">
      {ui}
    </NextIntlClientProvider>,
    options
  );
}
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run tests/unit/i18n-config.test.ts` → PASS (7 tests).
Run: `npm run typecheck` → clean.
Run: `npm run test:run` → full suite still green (701 | 1 todo — nothing consumed the provider yet).

- [ ] **Step 8: Dev-boot smoke**

Run: `rm -rf .next && timeout 60 npm run dev` (port 3001), curl `http://localhost:3001/` once, confirm 200 and `<html lang="uk"` in the response body, then stop the server. (Stale-`.next` lesson: always clear before judging behavior.)

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json next.config.mjs src/i18n messages global.d.ts src/app/layout.tsx tests/helpers/render-with-intl.tsx tests/unit/i18n-config.test.ts docs/planning/plans/2026-08-14_task-039-i18n-foundation.md
git commit -m "feat(i18n): next-intl cookie-mode infrastructure — locale config, request wiring, html lang fix"
```

---

### Task 2: Locale toggle (server action, LocaleSwitcher, Header mount, E2E)

**Files:**

- Create: `src/i18n/actions.ts`, `src/components/common/LocaleSwitcher.tsx`, `tests/unit/locale-switcher.test.tsx`, `tests/e2e/locale-toggle.spec.ts`
- Modify: `src/components/common/Header.tsx`

**Interfaces:**

- Consumes: `LOCALES`, `Locale`, `LOCALE_COOKIE`, `LOCALE_LABELS`, `resolveLocale` (Task 1), `renderWithIntl` (Task 1).
- Produces: `setLocale(locale: Locale): Promise<void>` server action; `<LocaleSwitcher className?>` with `data-testid="locale-switcher"` and per-locale `data-testid="locale-switcher-uk" / "locale-switcher-ru"` — E2E and the visual gate rely on these testids.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/locale-switcher.test.tsx`:

```tsx
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("@/i18n/actions", () => ({ setLocale: vi.fn() }));

import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { setLocale } from "@/i18n/actions";

beforeEach(() => vi.clearAllMocks());

describe("LocaleSwitcher", () => {
  it("renders both locale buttons with the UA one active (current locale disabled)", () => {
    renderWithIntl(<LocaleSwitcher />);
    expect(screen.getByTestId("locale-switcher-uk")).toBeDisabled();
    expect(screen.getByTestId("locale-switcher-ru")).toBeEnabled();
    expect(screen.getByTestId("locale-switcher-uk")).toHaveTextContent("UA");
    expect(screen.getByTestId("locale-switcher-ru")).toHaveTextContent("RU");
  });

  it("labels the group in the active language for a11y", () => {
    renderWithIntl(<LocaleSwitcher />);
    expect(screen.getByRole("group", { name: "Мова" })).toBeInTheDocument();
  });

  it("calls the setLocale action with ru on click", () => {
    renderWithIntl(<LocaleSwitcher />);
    fireEvent.click(screen.getByTestId("locale-switcher-ru"));
    expect(setLocale).toHaveBeenCalledWith("ru");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/locale-switcher.test.tsx`
Expected: FAIL — `Cannot find module '@/components/common/LocaleSwitcher'`.
(`fireEvent`, not `user-event` — the repo has no `@testing-library/user-event` and the only-new-dependency constraint holds. RTL-cannot-catch-hit-testing caveat applies as always: the E2E in Step 6 is the real-browser check.)

- [ ] **Step 3: Implement action + component**

`src/i18n/actions.ts`:

```ts
"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./config";

/**
 * Persist the visitor's locale choice (spec §1). Setting a cookie from a
 * server action invalidates the router cache, so the tree re-renders in the
 * new locale without extra refresh plumbing.
 */
export async function setLocale(locale: Locale): Promise<void> {
  const safe = resolveLocale(locale); // never trust the wire value
  cookies().set(LOCALE_COOKIE, safe, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
```

`src/components/common/LocaleSwitcher.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/i18n/actions";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** UA | RU header toggle (TASK-039 spec §1). Active locale is disabled. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("localeSwitcher")}
      data-testid="locale-switcher"
      className={cn("flex items-center", className)}
    >
      {LOCALES.map((l: Locale, i) => (
        <button
          key={l}
          type="button"
          disabled={isPending || l === locale}
          aria-current={l === locale ? "true" : undefined}
          data-testid={`locale-switcher-${l}`}
          onClick={() => startTransition(() => setLocale(l))}
          className={cn(
            "px-1.5 py-1 text-xs font-semibold tracking-wide uppercase transition-colors",
            i > 0 && "border-border border-l",
            l === locale
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground cursor-pointer"
          )}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Mount in Header (desktop + mobile)**

In `src/components/common/Header.tsx`:

- import `{ LocaleSwitcher } from "@/components/common/LocaleSwitcher";`
- Desktop: inside the Actions cluster `<div className="flex items-center gap-2">`, render `<LocaleSwitcher className="hidden md:flex" />` as the first child (before the search button).
- Mobile: inside the `SheetContent`, directly after the closing `</nav>` and before the `<Separator className="my-4" />`, render `<LocaleSwitcher className="mt-4 px-3" />`.

- [ ] **Step 5: Run unit tests**

Run: `npx vitest run tests/unit/locale-switcher.test.tsx tests/unit/header.test.tsx`
Expected: LocaleSwitcher PASS; header.test.tsx still PASS (Header itself not yet on `t()` — unchanged strings).

- [ ] **Step 6: Write the E2E spec**

`tests/e2e/locale-toggle.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Locale toggle", () => {
  test("switches html lang to ru, persists across reload, and switches back", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");

    if (isMobile) {
      // Toggle lives in the mobile menu sheet
      await page.getByRole("button", { name: "Відкрити меню" }).click();
    }
    await page.getByTestId("locale-switcher-ru").first().click();

    // Authoritative assertion: cookie-driven re-render lands lang=ru
    await expect(page.locator("html")).toHaveAttribute("lang", "ru", { timeout: 15000 });

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    // The switcher itself re-labels in RU (common.localeSwitcher)
    await expect(page.getByTestId("locale-switcher").first()).toHaveAttribute("aria-label", "Язык");

    if (isMobile) {
      await page
        .getByRole("button", { name: "Открыть меню" })
        .or(page.getByRole("button", { name: "Відкрити меню" }))
        .first()
        .click();
    }
    await page.getByTestId("locale-switcher-uk").first().click();
    await expect(page.locator("html")).toHaveAttribute("lang", "uk", { timeout: 15000 });
  });
});
```

(The mobile re-open uses `.or()` because the menu button's sr-only label translates once Task 4 lands; before that both branches resolve to the UA label — the locator stays valid across tasks.)

- [ ] **Step 7: Run the E2E locally**

Run: `rm -rf .next && npx playwright test tests/e2e/locale-toggle.spec.ts --project=chromium`
Expected: PASS. (Needs dev server infra per repo E2E setup — seeded DB; port 3001 locally. If the runner auto-starts the webServer, no manual server needed.)

- [ ] **Step 8: Commit**

```bash
git add src/i18n/actions.ts src/components/common/LocaleSwitcher.tsx src/components/common/Header.tsx tests/unit/locale-switcher.test.tsx tests/e2e/locale-toggle.spec.ts docs/planning/plans/2026-08-14_task-039-i18n-foundation.md
git commit -m "feat(i18n): UA|RU locale toggle — setLocale action, LocaleSwitcher, header mount, e2e"
```

---

### Task 3: Byte-diff verifier + cart domain (the worked example)

**Files:**

- Create: `scripts/i18n-byte-diff.mjs`, `scripts/i18n-byte-diff-allow.txt` (empty)
- Modify: `messages/uk.json` (+`cart` ns), `src/components/shop/CartDrawer.tsx`, `src/app/(shop)/cart/page.tsx`, `tests/unit/content.test.ts`
- Delete: `src/content/cart.ts`

**Interfaces:**

- Consumes: `renderWithIntl` (Task 1).
- Produces: the verifier CLI (`node scripts/i18n-byte-diff.mjs`, env `I18N_DIFF_BASE` default `main`) and the **migration recipe** every later extraction task repeats:
  1. Inventory the file's Cyrillic literals: `grep -nP '[\x{0400}-\x{04FF}]' <file>`.
  2. Add catalog keys under the domain namespace (copy-paste values from source — never retype).
  3. Swap the component to `useTranslations("<ns>")` / async server code to `getTranslations("<ns>")`.
  4. Delete the source literals / content module.
  5. Migrate that component's tests to `renderWithIntl`.
  6. `node scripts/i18n-byte-diff.mjs` → clean; targeted vitest run → green.

- [ ] **Step 1: Write the verifier**

`scripts/i18n-byte-diff.mjs`:

```js
#!/usr/bin/env node
/**
 * i18n byte-diff (TASK-039 spec §2 "extraction law"): every Cyrillic string
 * fragment REMOVED from src/** on this branch must appear verbatim inside
 * messages/uk.json. Catches transcription corruption («цінує»→«цінює» class).
 * Deliberate rewrites go in scripts/i18n-byte-diff-allow.txt (one fragment
 * per line) with a plan-log entry.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const BASE = process.env.I18N_DIFF_BASE || "main";
const CYR = /[Ѐ-ӿ]/;

const diff = execSync(`git diff ${BASE}...HEAD -- 'src/**/*.ts' 'src/**/*.tsx'`, {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const uk = readFileSync("messages/uk.json", "utf8");
const allow = new Set(
  existsSync("scripts/i18n-byte-diff-allow.txt")
    ? readFileSync("scripts/i18n-byte-diff-allow.txt", "utf8")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : []
);

const removedLines = diff
  .split("\n")
  .filter((l) => l.startsWith("-") && !l.startsWith("---") && CYR.test(l));

const literalRe = /(["'`])((?:\\.|(?!\1).)*)\1/g;
const misses = [];

for (const line of removedLines) {
  const fragments = [];
  let m;
  let matchedLiteral = false;
  while ((m = literalRe.exec(line))) {
    if (!CYR.test(m[2])) continue;
    matchedLiteral = true;
    // template interpolations become ICU args — verify the Cyrillic parts between them
    for (const frag of m[2].split(/\$\{[^}]*\}/)) fragments.push(frag.trim());
  }
  if (!matchedLiteral) {
    // fallback for multi-line template literals (no complete quote pair on this diff line)
    for (const run of line.matchAll(/[Ѐ-ӿ][Ѐ-ӿ'’ʼ\s.,:;!?…«»()-]*[Ѐ-ӿ]/g)) {
      fragments.push(run[0].trim());
    }
  }
  for (const f of fragments) {
    if (!CYR.test(f) || f.length < 2 || allow.has(f)) continue;
    if (!uk.includes(f)) misses.push({ frag: f, line: line.slice(0, 140) });
  }
}

if (misses.length) {
  console.error(
    `i18n byte-diff: ${misses.length} removed Cyrillic fragment(s) missing from messages/uk.json (base ${BASE}):`
  );
  for (const x of misses) console.error(`  MISSING «${x.frag}»\n    from: ${x.line}`);
  process.exit(1);
}
console.log(
  `i18n byte-diff clean (base ${BASE}): every removed Cyrillic fragment found verbatim in messages/uk.json.`
);
```

Create empty `scripts/i18n-byte-diff-allow.txt` (a `#`-comment first line explaining the format is fine — `#` lines are consumed as fragments that never match, harmless; prefer a real comment line `# one deliberately-rewritten fragment per line`).

- [ ] **Step 2: Prove the guard has teeth (guard-non-vacuity rule)**

Run `node scripts/i18n-byte-diff.mjs` → clean (no Cyrillic removed yet).
Then temporarily delete one UA string line from any `src/content/*.ts` file (do not commit), run the script → **must exit 1 naming that fragment**. Restore the line (`git checkout -- src/content/`). Record "guard failed when it should" in the progress log.

- [ ] **Step 3: Add the `cart` namespace to `messages/uk.json`**

Copy values from `src/content/cart.ts` **by paste, not retyping**. Structure (values shown here are the verbatim source strings — on any doubt the source file wins):

```json
"cart": {
  "title": "Кошик",
  "itemsCount": "{count, plural, one {# товар} few {# товари} many {# товарів} other {# товарів}}",
  "continueShopping": "Продовжити покупки",
  "remove": "Видалити",
  "variant": { "color": "Колір:", "size": "Розмір:" },
  "quantity": { "increase": "Збільшити кількість", "decrease": "Зменшити кількість" },
  "empty": { "title": "Кошик порожній", "cta": "Перейти в каталог" },
  "summary": {
    "title": "Разом",
    "itemsLabel": "Товари",
    "shippingLabel": "Доставка",
    "shippingValue": "За тарифами Нової Пошти",
    "totalLabel": "До сплати",
    "checkoutCta": "ОФОРМИТИ ЗАМОВЛЕННЯ",
    "validating": "Перевірка…",
    "securePayment": "Безпечна оплата",
    "stockIssues": {
      "title": "Деякі товари недоступні в потрібній кількості",
      "description": "Оновіть кількість або видаліть недоступні товари перед оформленням."
    }
  },
  "stock": {
    "outOfStock": "Немає в наявності",
    "onlyN": "Доступно лише {count}",
    "unavailable": "Товар більше недоступний"
  },
  "clear": {
    "action": "Очистити кошик",
    "dialogTitle": "Очистити кошик?",
    "dialogDescription": "Усі товари буде видалено з кошика. Цю дію не можна скасувати.",
    "confirm": "Очистити",
    "cancel": "Скасувати"
  },
  "drawer": { "title": "Кошик", "viewCart": "Переглянути кошик" }
}
```

ICU conversion rules (apply repo-wide): `(n) => \`${n} ${pluralizeUk(n, a, b, c)}\`` → `"{count, plural, one {# a} few {# b} many {# c} other {# c}}"` (`other` duplicates `many` — ICU requires the branch; counts are integers); plain interpolations `(x) => \`…${x}…\``→`"…{x}…"`.

- [ ] **Step 4: Migrate consumers**

`CartDrawer.tsx` (client): add `import { useTranslations } from "next-intl";`, inside the component `const t = useTranslations("cart");`, replace every `cart.xxx.yyy` read with `t("xxx.yyy")`; function-strings become `t("itemsCount", { count: n })` / `t("stock.onlyN", { count: n })`. Remove the `import { cart } from "@/content/cart";` line. Same procedure in `src/app/(shop)/cart/page.tsx` (it is `"use client"` — verify the directive; if any consumer is an async server component, use `const t = await getTranslations("cart")` instead).

Delete `src/content/cart.ts`.

- [ ] **Step 5: Re-point tests**

- `tests/unit/content.test.ts`: delete the `import { cart } from "@/content/cart";` line and the `describe("cart content")` block if one exists (check first: `grep -n "cart" tests/unit/content.test.ts`); equivalent coverage now lives in catalog integrity tests (Task 4 creates `i18n-catalogs.test.ts`).
- Any RTL test rendering `CartDrawer` or the cart page swaps `render(` → `renderWithIntl(` (imports adjust accordingly). Find them: `grep -rln "CartDrawer\|cart/page" tests/unit/`.

- [ ] **Step 6: Verify**

```bash
node scripts/i18n-byte-diff.mjs        # clean
npm run typecheck                       # clean — typo'd keys fail here (global.d.ts)
npx vitest run tests/unit               # full unit dir green
```

- [ ] **Step 7: Manual ICU plural spot-check**

`rm -rf .next && npm run dev`, open `/cart` with 1 / 2 / 5 items → «1 товар / 2 товари / 5 товарів». Stop server.

- [ ] **Step 8: Commit**

```bash
git add scripts/i18n-byte-diff.mjs scripts/i18n-byte-diff-allow.txt messages/uk.json src/components/shop/CartDrawer.tsx "src/app/(shop)/cart/page.tsx" tests/unit/content.test.ts docs/planning/plans/2026-08-14_task-039-i18n-foundation.md
git rm src/content/cart.ts
git commit -m "feat(i18n): byte-diff verifier + cart domain extraction (worked example)"
```

---

### Task 4: Header / site / home / brand domains

**Files:**

- Modify: `messages/uk.json` (+`header`, `footer`, `home`, `brand` ns), `src/content/site.ts` (trim), `src/content/home.ts` (trim), `src/content/brand.ts` (trim), `src/components/common/Header.tsx`, `src/components/common/Footer.tsx`, `src/components/common/AnnouncementBar.tsx`, `src/components/common/BenefitStrip.tsx`, `src/components/common/SocialLinks.tsx`, `src/components/home/Hero.tsx`, `src/components/home/WhyChooseUs.tsx`, `src/components/home/Testimonials.tsx`, `src/components/home/ProductRail.tsx` (rail labels via props from `page.tsx` — check), `src/app/(shop)/page.tsx`
- Test: `tests/unit/i18n-catalogs.test.ts` (new) + migrate `header.test.tsx`, `footer.test.tsx`, `announcement-bar.test.tsx`, `benefit-strip.test.tsx`, `social-links.test.tsx`, `hero.test.tsx`, `why-choose-us.test.tsx`, `testimonials.test.tsx`, `home-page.test.tsx`, `product-rail.test.tsx`, `content.test.ts`

**Interfaces:**

- Consumes: recipe + verifier (Task 3), `renderWithIntl` (Task 1).
- Produces: surviving config shapes later tasks and G13 rely on —
  `site.ts` keeps: `announcement: { id, href, marquee }` (**text/linkLabel move to catalog** — `AnnouncementBar` reads copy via `t()` and gating via config), `claims`, `footerBenefits: { icon }[]` (titles/descriptions → catalog keys `home.benefits.*` / `footer.benefits.*` addressed **by index**: `footerBenefits.${i}.title`), `socials` re-export, `name`, `tagline` (re-pointed to catalog? **No** — `site.name` stays `BRAND_NAME`; `site.tagline` field is deleted, consumers read `t("brand.tagline")`).
  `home.ts` keeps: `hero.eyebrow` (null config gate — campaign copy, untranslated until used), `hero.image`, CTA/rail `href`s, `benefits: { icon }[]`.
  `brand.ts` keeps: `BRAND_NAME`, `SOCIALS`, `WHATSAPP_HREF`, `BRAND_DESCRIPTION`, `BRAND_META_SUFFIX` (the last two move in Task 8 with the seo layer); `BRAND_TAGLINE`/`BRAND_HERO_SUBTITLE` → catalog `brand.tagline` / `brand.heroSubtitle`.

- [ ] **Step 1: Inventory** — `grep -nP '[\x{0400}-\x{04FF}]' src/content/site.ts src/content/home.ts src/content/brand.ts src/components/common/{Header,Footer,SocialLinks,NewsletterSignup}.tsx src/components/home/*.tsx "src/app/(shop)/page.tsx"` and paste the output into the progress log (it is the task's checklist).
      Note: `NewsletterSignup`'s strings belong to Task 5's `newsletter` ns — do not migrate it here, only note its lines.

- [ ] **Step 2: Extend `messages/uk.json`** with `header` (all of `site.header` incl. `search.*` — `viewAll`/`noResults` become `{query}` interpolations — plus the `navigation` array labels as `header.nav.catalog` / `header.nav.new` / `header.nav.bestsellers`), `footer` (Footer's own literals + `footer.benefits.0..3.title/description` from `site.footerBenefits`), `home` (hero headline as `home.hero.headline1`/`headline2`, `subtitle` ← `BRAND_HERO_SUBTITLE`, CTA labels, image alt, `benefits.0..3`, `whyChooseUs.title/intro/items.0..5`, `rails.newArrivals.title/viewAllLabel`, `testimonials.title`), `brand` (`tagline`, `heroSubtitle`), plus `site.announcement.text` / `site.announcementLinkLabel` / `site.announcementDismiss` under a `site` ns. Copy-paste every value from source.

- [ ] **Step 3: Migrate consumers** per the Task 3 recipe. Details that differ:
  - `Header.tsx` `navigation` array becomes `const navigation = [{ key: "catalog", href: "/products" }, { key: "new", href: "/products?sort=new" }, { key: "bestsellers", href: "/products?sort=popular" }]` rendered as `t(\`nav.${item.key}\`)`.
  - `AnnouncementBar.tsx`: keep the `SiteAnnouncement` config type minus `text`/`linkLabel` (shape becomes `{ id, href, marquee }`); the component reads `t("site.announcement.text")` etc. The dismissal-key logic keyed on `id` is untouched.
  - `Hero.tsx`: `headline` array → two keys rendered as two lines; `eyebrow` renders only when the **config** field is non-null (value then rendered verbatim — untranslated config copy, documented inline).
  - `Testimonials.tsx`: only the section title migrates; quote data stays wherever it lives today (verify via the Step 1 grep — it was not in the Cyrillic inventory, so it is DB/props-driven).

- [ ] **Step 4: Catalog integrity tests** — create `tests/unit/i18n-catalogs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import uk from "../../messages/uk.json";
import ru from "../../messages/ru.json";

type Tree = { [k: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Array<[string, string]> {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : leaves(v, `${prefix}${k}.`)
  );
}

describe("message catalogs", () => {
  it("ru contains no orphan keys (every ru key path exists in uk — uk is the schema)", () => {
    const ukKeys = new Set(leaves(uk as Tree).map(([k]) => k));
    const orphans = leaves(ru as Tree)
      .map(([k]) => k)
      .filter((k) => !ukKeys.has(k));
    expect(orphans).toEqual([]);
  });

  it("never advertises retracted services in any locale (G8/site.ts retraction rulings)", () => {
    const all = [...leaves(uk as Tree), ...leaves(ru as Tree)]
      .map(([, v]) => v)
      .join(" ")
      .toLowerCase();
    expect(all).not.toMatch(
      /обмін розміру|обмен размера|безкоштовна доставка|бесплатная доставка|free delivery|size exchange/
    );
  });

  it("renders apostrophe-bearing UA copy through ICU unchanged", async () => {
    const { createTranslator } = await import("next-intl");
    const t = createTranslator({ locale: "uk", messages: uk, namespace: "site" });
    expect(t("announcement.linkLabel")).toBe("Розкажіть нам через форму зворотного зв'язку");
  });
});
```

(The apostrophe test guards the ICU-escaping class of corruption byte-diff cannot see — the catalog byte can be right while the RENDERED string drops or eats characters. If `createTranslator`'s exact import shape differs in v4.8, use `NextIntlClientProvider` + a probe component through `renderWithIntl` instead; the assertion — rendered output equals the verbatim string — is the requirement, the vehicle is not.)

- [ ] **Step 5: Migrate the listed RTL tests** to `renderWithIntl` (mechanical: import swap; assertions unchanged — strings are byte-identical). Re-point `content.test.ts`'s `site`/`home` sections: config assertions (announcement href/marquee/id, claims, socials, hero image, benefit COUNT, rail href) keep reading the trimmed modules; string assertions (headline pair, whyChooseUs count/intro, retraction regex) move to `i18n-catalogs.test.ts` / read `uk.json`.

- [ ] **Step 6: Verify** — `node scripts/i18n-byte-diff.mjs` && `npm run typecheck` && `npx vitest run tests/unit` → all green. `rm -rf .next && npm run dev` → homepage renders identically (spot-check hero, announcement marquee, footer). Toggle to RU → homepage chrome falls back to UA (RU catalog still seed-only) — **expected** per the merge design.

- [ ] **Step 7: Commit** — `git add`/`git commit -m "feat(i18n): header/site/home/brand domains — catalog extraction + integrity tests"` (include the plan-log update; use `git add -A` for the trimmed/deleted content files after reviewing `git status`).

---

### Task 5: checkout / auth / account / system / feedback / newsletter / shipping domains

**Files:**

- Modify: `messages/uk.json` (+6 ns), `src/content/checkout.ts` (trim to config), `src/content/account.ts` (trim to the two label maps), `src/lib/shipping.ts` (keep map; note), `src/app/(shop)/checkout/page.tsx` (+its 4 inline lines), `src/app/(shop)/checkout/confirmation/page.tsx`, `src/app/(auth)/login/login-form.tsx`, `src/app/(auth)/register/register-form.tsx`, `src/app/(auth)/error.tsx`, `src/app/(shop)/account/{layout,page}.tsx`, `src/app/(shop)/account/orders/{page,[id]/page}.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/components/common/CookieConsent.tsx`, `src/components/common/StatusScreen.tsx`, `src/components/common/NewsletterSignup.tsx`, `src/app/(shop)/feedback/{page.tsx,feedback-form.tsx}`, `src/app/newsletter/{confirm,unsubscribe}/page.tsx`
- Delete: `src/content/{auth,system,feedback,newsletter}.ts`
- Test: migrate `feedback-form.test.tsx`, `newsletter-signup.test.tsx`, `newsletter-status-pages.test.tsx`, `status-screen.test.tsx`, `dynamic-route-params.test.tsx` (renders `account/orders/[id]`), finish `content.test.ts` re-point (file may end up deleted if only catalog-covered assertions remain — keep it if any config assertions survive), extend `i18n-catalogs.test.ts` with byCode coverage

**Interfaces:**

- Consumes: recipe + verifier; catalog test file (Task 4).
- Produces (G13 + email contracts):
  - `src/content/account.ts` keeps **only** `ORDER_STATUS_LABELS` + `PAYMENT_STATUS_LABELS` with the comment `// Temporary duplicate of messages/uk.json account.orderStatus/paymentStatus — admin-only source until G13 migrates admin to the admin.* namespace, then delete.` `src/lib/order-status.ts` is **unchanged** (admin keeps one import).
  - Customer surfaces render statuses via `t(\`orderStatus.${status}\`)` / `t(\`paymentStatus.${status}\`)`from the`account` ns.
  - `src/lib/shipping.ts` keeps its label map (email templates + non-request code read it); customer checkout UI reads catalog keys `shipping.np-office` / `shipping.np-courier` / `shipping.np-postomat` (keys = method ids).
  - byCode pattern: catalog namespaces `newsletter.confirm.byCode.<CODE>.title/description`, `newsletter.unsubscribe.byCode.<CODE>.*`, `newsletter.signup.byCode.<CODE>`, `auth.register.errors.byCode.<CODE>`, `feedback.byCode.<CODE>`, `checkout.errors.<CODE>`; components look up with a guarded dynamic key (`t.has(\`byCode.${code}\`) ? t(\`byCode.${code}\`) : t("fallback")`— if`t.has` is unavailable in v4.8, wrap the lookup in try/catch or check against an exported code list; pick ONE mechanism and use it in all six spots).

- [ ] **Step 1: Inventory** all listed files (`grep -nP '[\x{0400}-\x{04FF}]' …`) → progress log.
- [ ] **Step 2: Extend `messages/uk.json`** with `checkout` (all copy from `checkout.ts` incl. `errors.*` keyed by API code: `PRODUCT_UNAVAILABLE`, `INVALID_VARIANT`, `INVALID_SHIPPING_METHOD`, `INVALID_ORDER_DATA`, plus `orderFailed` fallback; `summary.qty` → `"{count} шт"`), `auth`, `account` (function-strings: `welcome` → `"З поверненням, {name}!"`, `qty` → `"К-сть: {count}"`, `more` → `"+{count, plural, one {# інший товар} few {# інші товари} many {# інших товарів} other {# інших товарів}}"` — `#` renders the number inside the branch, so this yields `+2 інші товари`; add one unit assertion of that exact rendered output), `system`, `feedback`, `newsletter`, `shipping`, and `account.orderStatus.*` / `account.paymentStatus.*` (copy the two maps).
- [ ] **Step 3: Migrate consumers** per recipe. Special cases:
  - `StatusScreen.tsx` stays hook-free where possible: it receives all copy via props today (verify) — if its 1 Cyrillic literal is a default, convert it to a required prop or `useTranslations` (works in server components; keeps not-found.tsx rendering it server-side).
  - `(auth)/error.tsx` + `error.tsx`/`not-found.tsx`: error boundaries are client components — `useTranslations` under the root provider works since the provider wraps `children` inside `<body>`; **verify the global error boundary is inside the provider tree** (`src/app/error.tsx` renders within the root layout body — yes; `global-error.tsx` does not exist — confirm, else leave that one hardcoded UA with a comment).
  - `dynamic-route-params.test.tsx`: wrap the rendered pages with `renderWithIntl`; the G3 regression assertions themselves are untouched.
- [ ] **Step 4: byCode coverage tests** — extend `i18n-catalogs.test.ts`: for each route, import nothing from the route (they hardcode codes today); instead copy the exact code lists the routes emit (`CONFIRMED`, `ALREADY_CONFIRMED`, `LINK_EXPIRED`, `INVALID_TOKEN`, `TOKEN_REQUIRED`; `UNSUBSCRIBED`, `ALREADY_UNSUBSCRIBED`, `SUBSCRIBER_NOT_FOUND`, `INVALID_UNSUBSCRIBE_LINK`, `VALIDATION_ERROR`; `ALREADY_SUBSCRIBED`; `EMAIL_EXISTS`; `VALIDATION_ERROR`, `SEND_FAILED`; `PRODUCT_UNAVAILABLE`, `INVALID_VARIANT`, `INVALID_SHIPPING_METHOD`, `INVALID_ORDER_DATA`) and assert each has a catalog entry. Keep the current tests' semantics — this replaces `content.test.ts`'s byCode blocks 1:1 (the shared-constant BACKLOG idea stays parked; do not expand scope).
- [ ] **Step 5: Verify** — byte-diff, typecheck, `npx vitest run tests/unit`, dev smoke of `/checkout`, `/login`, `/account`, `/feedback`, `/newsletter/confirm?token=x` (StatusScreen paths). All UA rendering identical.
- [ ] **Step 6: Commit** — `feat(i18n): checkout/auth/account/system/feedback/newsletter/shipping domains`.

---

### Task 6: Products domain sweep

**Files:**

- Modify: `messages/uk.json` (+`products` ns), `src/app/(shop)/products/filter-bar.tsx`, `src/app/(shop)/products/products-content.tsx`, `src/app/(shop)/products/[slug]/page.tsx`, `src/app/(shop)/products/[slug]/product-detail-client.tsx`, `src/app/(shop)/products/[slug]/opengraph-image.tsx` (1 line — if it is display copy, move to catalog via `getTranslations`; if it is a `грн` price suffix produced by `formatPrice`, leave), `src/components/products/{ProductCard,SizePicker,QuickViewDialog,BoughtTogether,ProductGallery,RecentlyViewed}.tsx`, `src/lib/product-badges.ts`, `src/lib/product-display.ts`
- Test: migrate `product-card.test.tsx`, `size-picker.test.tsx`, `quick-view-dialog.test.tsx`, `bought-together.test.tsx`, `product-gallery.test.tsx`, `recently-viewed.test.tsx`, `product-detail-client.test.tsx`, `filter-bar.test.tsx`, `product-badges.test.ts`, `product-display.test.ts`

**Interfaces:**

- Consumes: recipe + verifier.
- Produces: **lib-label pattern** (also used by Task 7 and G13): pure lib modules stop returning display strings and return stable KEYS; components translate. Concretely: `product-badges.ts` returns a badge descriptor `{ key: "new" | "sale" | … }` and components render `t(\`badges.${key}\`)`; `product-display.ts` label helpers likewise return keys or take the translated string as an argument — **whichever keeps their unit tests meaningful; pick per function and record in the progress log.** The variant-name literals (`"Розмір"`/`"Колір"`display prefixes) live under`products.variant.\*` — G14's DB-value rename is separate and unaffected.

- [ ] **Step 1: Inventory** (~110 Cyrillic lines: filter-bar 33, product-detail-client 26, ProductCard 12, SizePicker 10, products-content 8, QuickViewDialog 6, BoughtTogether 6, ProductGallery 5, RecentlyViewed 3, product-display 3, page 2, badges 1) → progress log.
- [ ] **Step 2: Extend catalog** — namespace `products` with sub-groups mirroring components (`filters.*`, `sort.*`, `card.*`, `gallery.*`, `sizePicker.*`, `quickView.*`, `boughtTogether.*`, `recentlyViewed.*`, `badges.*`, `detail.*`, `variant.*`). Plurals via ICU (`pluralizeUk` call sites: product-detail-client review count → `products.detail.reviewCount`).
- [ ] **Step 3: Migrate** per recipe (all listed components are `"use client"` — `useTranslations`; `[slug]/page.tsx` is async server — `getTranslations`).
- [ ] **Step 4: Migrate the 10 test files** to `renderWithIntl`; lib tests re-point per the lib-label pattern.
- [ ] **Step 5: Verify** — byte-diff, typecheck, `npx vitest run tests/unit`, dev smoke `/products` (filters, sort, cards, quick view) + one PDP (gallery, size picker, bought-together, recently-viewed). E2E products spec: `npx playwright test tests/e2e/products.spec.ts --project=chromium`.
- [ ] **Step 6: Commit** — `feat(i18n): products domain sweep`.

---

### Task 7: Reviews + categories + share remainder

**Files:**

- Modify: `messages/uk.json` (+`reviews`, `categories`, `share` keys), `src/components/reviews/{ReviewSection,ReviewForm,ReviewList,ReviewItem,ReviewStats}.tsx` (StarRating has no strings — verify), `src/app/(shop)/categories/page.tsx`, `src/components/products/SocialShareButtons.tsx`, `src/app/(shop)/account/layout.tsx` (1 remaining line if Task 5 missed it — inventory decides)
- Test: migrate `review-item.test.tsx` (+ any other review tests found by grep), categories page has no RTL test (verify), `social-links.test.tsx` already done in Task 4

**Interfaces:**

- Consumes: recipe + verifier; lib-label pattern (Task 6).
- Produces: completes the full-sweep AC — after this task `grep -rlP '[\x{0400}-\x{04FF}]' src --include="*.tsx" --include="*.ts" | grep -v "src/content/" | grep -v "src/lib/validations" | grep -v "src/lib/format.ts" | grep -v "src/lib/shipping.ts" | grep -v category-client | grep -v ProductForm | grep -v email` must return **empty** (remaining Cyrillic lives only in the ruled-out files; `format.ts` keeps `грн` + pluralize words, `shipping.ts` keeps the email-path label map, seed/test data uncounted).

- [ ] **Step 1: Inventory** (~35 lines: reviews ~24 across 6 files, categories/page 6, SocialShareButtons 6) → progress log.
- [ ] **Step 2: Extend catalog** (`reviews.*` incl. form validation copy + ICU for `ReviewStats`'s count; `categories.*` incl. its `pluralizeUk` call → ICU; `products.share.*` for SocialShareButtons).
- [ ] **Step 3: Migrate + test-migrate** per recipe.
- [ ] **Step 4: Run the completes-the-sweep grep above** — paste its (empty) output into the progress log. Byte-diff, typecheck, full `npx vitest run tests/unit`.
- [ ] **Step 5: Commit** — `feat(i18n): reviews/categories/share sweep — full-sweep extraction complete`.

---

### Task 8: SEO fixed set (ruling 3)

**Files:**

- Modify: `messages/uk.json` (+`seo` ns + `brand.description`/`brand.metaSuffix`), `src/lib/seo.ts`, `src/app/layout.tsx` (static `metadata` export → `generateMetadata()`), `src/app/(shop)/products/page.tsx` + `src/app/(shop)/categories/page.tsx` + auth pages (whichever call the converted seo helpers — find with `grep -rn "getAuthMetadata\|getHomeMetadata\|getCategoriesListingMetadata\|getDefaultMetadata" src/`), `src/app/(shop)/categories/[slug]/page.tsx` ("Category Not Found" + JSON-LD breadcrumbs), `src/content/brand.ts` (move `BRAND_DESCRIPTION`, `BRAND_META_SUFFIX`)
- Test: `tests/unit/seo.test.ts` (EN assertions → UA)

**Interfaces:**

- Consumes: catalog + `getTranslations`.
- Produces: seo helpers that need copy become **async** and accept no locale param (they read request scope): exact set and new signatures recorded in the progress log; callers `await` them inside `generateMetadata`. `getOrganizationJsonLd`/`getWebsiteJsonLd` keep reading `BRAND_NAME` (unchanged). **Constraint:** `emails.ts` imports from `brand.ts` — moving `BRAND_DESCRIPTION` must not break it (emails import only the name via `getStoreName` — verify with `grep -n "brand" src/content/emails.ts src/lib/email*.ts` before moving).

- [ ] **Step 1: Enumerate the fixed set** — `grep -n "All Products\|Sign In\|Create Account\|Categories\|Category Not Found\|Home" src/lib/seo.ts "src/app/(shop)/categories/[slug]/page.tsx"` + the EN description strings near `getAuthMetadata` → paste inventory into the progress log (spec estimates 8–12 strings).
- [ ] **Step 2: Add `seo` ns** with UA replacements. These are NEW translations (EN → UA), not byte-identical moves — byte-diff does not fire on EN removals; the UA copy is authored here and gate-reviewed. Also move `brand.description` / `brand.metaSuffix` values (byte-identical — these ARE Cyrillic moves).
- [ ] **Step 3: Convert** `seo.ts` helpers that emit those strings to `async` + `const t = await getTranslations("seo")`; root layout: `export async function generateMetadata(): Promise<Metadata> { return getDefaultMetadata(); }` with `getDefaultMetadata` now async (verify every call site compiles; typecheck is the net).
- [ ] **Step 4: Update `seo.test.ts`** — the changed assertions flip EN literals → the new UA literals; tests calling now-async helpers gain `await`. **seo helpers use request-scoped `getTranslations` — under vitest there is no request scope**: mock it per existing repo conventions (`vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => ukSeoFixture[key] }))` with a small fixture read from `messages/uk.json`) so assertions still verify real catalog values.
- [ ] **Step 5: Verify** — typecheck, `npx vitest run tests/unit/seo.test.ts tests/unit`, dev smoke: browser-tab titles on `/products`, `/categories`, `/login` now UA; `curl -s localhost:3001/products | grep -o '<title>[^<]*'` shows UA.
- [ ] **Step 5b: E2E locator sweep for the changed EN strings (PR #31 lesson)** — `grep -rn "toHaveTitle\|All Products\|Sign In\|Create Account\|Category Not Found" tests/e2e/` — known today: `navigation.spec.ts:20` asserts `toHaveTitle(/Mirox/)`, which keeps matching because `BRAND_NAME` ("Mirox Shop") stays in every title template. Any other hit must be updated in this task; paste the grep output into the progress log.
- [ ] **Step 6: Commit** — `feat(i18n): SEO fixed set → UA via seo namespace (closes BACKLOG 2026-08-09 entry)`.

---

### Task 9: RU catalog draft + coverage guard

**Files:**

- Modify: `messages/ru.json` (full draft), `tests/unit/i18n-catalogs.test.ts` (+coverage assertion)
- Create: `messages/README.md`

**Interfaces:**

- Consumes: the complete `uk.json` (Tasks 3–8).
- Produces: full RU coverage; the gate-review artifact list.

- [ ] **Step 1: Draft `ru.json`** mirroring every `uk.json` key (same tree, same ICU argument names, RU CLDR plural branches `one/few/many/other`). Translation happens key-by-key against the UA value **with the uk file open side-by-side**; product-domain terms stay consistent (кошик→корзина, замовлення→заказ, розмір→размер…). Proper nouns («Mirox», «Нова Пошта» → «Новая Почта» is WRONG — carrier brand stays «Нова Пошта») and `{arg}` names stay untouched. **E2E coupling:** `header.toggleMenu` must translate as «Открыть меню» — `tests/e2e/locale-toggle.spec.ts` matches that exact label in its RU branch (change both together or not at all).
- [ ] **Step 2: `messages/README.md`**:

```markdown
# Message catalogs (TASK-039)

- `uk.json` — source of truth; the schema. Every UI string lives here.
- `ru.json` — **DRAFT — agent-translated 2026-08-14, pending client sign-off
  (TASK-056 rider, pre-launch week)**. RU deep-merges over UK at request time;
  a missing RU key renders the UA value.

Nuance-flagged for review (gate + client): `home.hero.*`, `brand.*`,
`site.announcement.*`, `home.whyChooseUs.*`, testimonial/claims copy.

Conventions: namespaces mirror UI domains; `admin.*` reserved for G13; ICU
plurals carry all four branches (one/few/many/other); keys are camelCase;
byCode keys are the verbatim API codes. Extraction is byte-identical from the
pre-i18n literals — verified by `scripts/i18n-byte-diff.mjs`.
```

- [ ] **Step 3: Flip the coverage guard to hard** — add to `i18n-catalogs.test.ts`:

```ts
it("ru covers every uk key (full draft — Task 9 flips this to hard)", () => {
  const ruKeys = new Set(leaves(ru as Tree).map(([k]) => k));
  const missing = leaves(uk as Tree)
    .map(([k]) => k)
    .filter((k) => !ruKeys.has(k));
  expect(missing).toEqual([]);
});
it("ru reuses every ICU argument its uk counterpart declares", () => {
  const args = (s: string) => [...s.matchAll(/\{(\w+)[,}]/g)].map((m) => m[1]).sort();
  const ruMap = new Map(leaves(ru as Tree));
  for (const [key, ukVal] of leaves(uk as Tree)) {
    const ruVal = ruMap.get(key);
    if (ruVal) expect(args(ruVal), key).toEqual(args(ukVal));
  }
});
```

- [ ] **Step 4: Verify** — `npx vitest run tests/unit/i18n-catalogs.test.ts` PASS; dev smoke: toggle RU → walk home, catalog, PDP, cart, checkout, feedback — fully Russian chrome over UA product data (expected boundary).
- [ ] **Step 5: Commit** — `feat(i18n): full RU catalog draft (DRAFT — pending client sign-off) + coverage guards`.

---

### Task 10: formatPrice §7.4 axis tests

**Files:**

- Modify: `tests/unit/format.test.ts` (additive `describe`; reconcile with existing assertions — do not duplicate test names)

**Interfaces:** none new — `formatPrice` is verified, not changed. If any axis FAILS, **stop and report** (abort condition: the spec §5 premise would be wrong), do not "fix" the formatter unilaterally.

- [ ] **Step 1: Add the axis tests**

```ts
describe("formatPrice — §7.4 compliance axes (TASK-039 AC 3)", () => {
  it("groups thousands with NBSP U+00A0 (never comma or plain space)", () => {
    expect(formatPrice(1290)).toBe("1 290 грн");
    expect(formatPrice(1234567)).toBe("1 234 567 грн");
    expect(formatPrice(1290)).not.toMatch(/[,]| /);
  });
  it("does not group 3-digit amounts, groups from 4 digits", () => {
    expect(formatPrice(999)).toBe("999 грн");
    expect(formatPrice(1000)).toBe("1 000 грн");
  });
  it("uses comma decimals with exactly two kopiyka digits when fractional", () => {
    expect(formatPrice(1290.5)).toBe("1 290,50 грн");
    expect(formatPrice(0.05)).toBe("0,05 грн");
  });
  it("renders whole amounts without ,00 — documented ruling 1 (spec §5)", () => {
    expect(formatPrice(1290)).not.toContain(",");
  });
  it("places «грн» after the amount joined by NBSP, no trailing period (ДСТУ 3582:2013)", () => {
    expect(formatPrice(5)).toBe("5 грн");
    expect(formatPrice(5).endsWith(".")).toBe(false);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/format.test.ts` → PASS (if the existing file already asserts an axis, keep the stronger assertion once — no duplicates).
- [ ] **Step 3: Record the style:"currency" comparison** — run and paste output into the progress log:

```bash
node -e 'const f=new Intl.NumberFormat("uk-UA",{style:"currency",currency:"UAH"});console.log(JSON.stringify([f.format(1290),f.format(1290.5)]))'
```

Expected shape: `["1 290,00 ₴","1 290,50 ₴"]` (NBSP-separated) — documents ruling 2: same separators, `₴` vs sanctioned «грн», forced `,00` vs ruling 1.

- [ ] **Step 4: Commit** — `test(format): §7.4 axis-named compliance tests + currency-style comparison record`.

---

### Task 11: Cleanup, full verification, docs propagation, gate prep

**Files:**

- Modify: `CLAUDE.md` (root), `src/app/CLAUDE.md`, `src/components/CLAUDE.md`, `src/lib/format.ts` (comment only), `docs/planning/plans/2026-08-14_task-039-i18n-foundation.md` (final log)

**Interfaces:** none — this task ships no behavior.

- [ ] **Step 1: pluralizeUk residue** — `grep -rn "pluralizeUk" src/ | grep -v format.ts`: expected consumers after the sweep: `category-client.tsx` only (+ `content/account.ts` is gone-or-trimmed — its `more` fn migrated in Task 5). Update `format.ts`'s comment: `Hardcoded-UA interim until TASK-039 i18n` → `Kept for category-client.tsx (retired by G12); catalog strings use ICU plurals.`
- [ ] **Step 2: Full local verification** (in order):

```bash
npm run typecheck && npm run lint && npm run format:check
npm run test:run                     # expect ~730+ | 1 todo — record exact number
node scripts/i18n-byte-diff.mjs
rm -rf .next && npm run build        # standalone build with the plugin wrap must pass
npx playwright test --project=chromium   # all 6 e2e specs incl. locale-toggle
```

Record every count/output in the progress log. Any failure → systematic-debugging, not blind fixes.

- [ ] **Step 3: Docs propagation** (live docs must be corrected, not superseded-noted):
  - Root `CLAUDE.md`: `src/content/` block — rewrite to the surviving-module reality (brand/site/home/checkout/account trimmed to config + emails.ts untouched; strings in `messages/`), add `src/i18n/` + `messages/` + `LocaleSwitcher` entries to the tree, add a Detected-Patterns entry: cookie-mode next-intl (uk default, `NEXT_LOCALE`, RU-over-UK merge, byte-diff script, `renderWithIntl`, non-async→`useTranslations` / async→`getTranslations` rule, admin.\* reserved for G13, temp label-map duplication).
  - `src/app/CLAUDE.md` + `src/components/CLAUDE.md`: fix every "strings/copy from src/content/X" note the sweep falsified.
  - Do NOT touch WEEKLY/TODO/DONE here — that is the completion workflow after merge.
- [ ] **Step 4: Visual gate prep** — `rm -rf .next && npm run dev`; screenshot UA + RU: home (hero/announcement/footer), catalog + filters, PDP, cart drawer, checkout step 1, /feedback, login, toggle close-ups (desktop + mobile menu). Publish ONE artifact page (per the gate-screenshots convention) and request the user's gate review incl. the RU nuance-flag list from `messages/README.md`.
- [ ] **Step 5: Commit** — `docs(i18n): CLAUDE.md propagation + verification record` — then hold for the gate. PR only after gate sign-off (repo rule: user approval before push).

---

## Verification summary (maps to spec §9 success criteria)

| Spec AC                           | Proven by                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Locale infra, UA default + toggle | Task 1 unit tests, Task 2 E2E (`html[lang]` uk→ru→uk + persistence), middleware/URLs untouched (diff review) |
| Full-sweep externalization        | Task 7's empty-grep record, byte-diff clean at every task, unchanged UA rendering (gate screenshots)         |
| §7.4 verification                 | Task 10 axis tests + comparison record + spec §5 rulings                                                     |
| SEO ruling executed               | Task 8 (UA titles live), BACKLOG entry closeable at completion                                               |
| Suite green                       | Task 11 full run (typecheck/lint/format/unit/build/E2E)                                                      |

## Progress log

_Append entries here per task: date, task, what happened, counts, deviations, decisions. The G4 lesson applies: never pre-fill execution records — every entry is written AFTER the work it records._

- 2026-08-14 — Plan written from the approved spec (4 rulings recorded there). Not yet executed.
