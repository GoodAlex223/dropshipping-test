# G13 Admin Translation & Alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate the entire admin panel to Ukrainian via the `admin.*` next-intl namespace, restyle payment/supplier status badges onto the monochrome policy with catalog labels, unify admin toasts on sonner (fixing the customers/categories infinite-fetch loop), without growing the storefront client payload.

**Architecture:** All new copy lives in `messages/uk.json` under one `admin.*` namespace (UA-only; `ru.json` untouched — deep-merge falls back to UA). The root layout's `NextIntlClientProvider` switches from zero-prop to an explicit `messages` prop that excludes `admin.*`; the `(admin)` layout nests its own provider with the full catalog. Client components use `useTranslations`, the 3 server components use `getTranslations`. Two small lib modules carry monochrome status styles; labels come from the catalog.

**Tech Stack:** Next.js 14 App Router, next-intl 4.13 (cookie mode, shipped in G9/PR #37), sonner, Vitest + RTL (`renderWithIntl` helper), Prettier/ESLint via lint-staged.

**Spec:** `docs/superpowers/specs/2026-08-16-g13-admin-translation-design.md` (read it first — decision log + rationale live there).

## Global Constraints

- **UA-only**: every new key goes in `messages/uk.json` only. Never touch `messages/ru.json`.
- **Namespace**: all new keys under the single top-level `admin` key, appended **after `seo`** (last top-level key). Keys are camelCase. Do not rename or move any existing key.
- **Status labels are never duplicated**: order/payment badges read the existing `account.orderStatus` / `account.paymentStatus` keys. Only `admin.supplierOrderStatus` is new (lowercase keys — the vocab is a plain Prisma String, not an enum).
- **ICU plurals carry all four branches** (`one/few/many/other`) — catalog convention.
- **Money**: `formatPrice()` from `@/lib/format` is the only sanctioned price formatter. Never hand-roll `грн` strings in code.
- **Dates**: every `toLocaleDateString("en-US", …)` in admin becomes `toLocaleDateString("uk-UA", …)` (6 files; each task notes its own).
- **Translate only user-visible UI text.** Internal `throw new Error(...)` messages, log strings, and API request/response text stay English (spec decision 3). Server-echoed `data.message` toasts keep the echo; only their client-side fallback literals are translated.
- **Toast API**: direct sonner only (`import { toast } from "sonner"`). Migration mapping from the old wrapper: `toast({ title, description, variant: "destructive" })` → `toast.error(<key>, { description: <key> })`; any other `toast({ title, description })` → `toast.success(...)`. Where a `description` adds nothing over the title, drop it.
- **Verification per task** (all foreground — devcontainer rule): `npm run typecheck && npm run lint && npm run test:run`. All must pass before the task's commit.
- **Commits**: conventional style with `(g13)` scope — `feat(g13): …`, `test(g13): …`, `docs(g13): …`. lint-staged auto-formats on commit; if prettier rewrites a file you edited, that's expected.
- **`Edit`-tool gotcha**: some existing `uk.json` lines contain non-breaking spaces (U+00A0). If an `Edit` old_string fails to match on such a line, use `sed` with `\xc2\xa0` byte patterns instead. New admin strings use regular spaces.
- **Do not modify `src/components/ui/*`** (shadcn-managed).
- The customer storefront, `(auth)` pages, API routes, and `src/lib/validations/index.ts` are **out of scope** — do not edit them (spec §7), except the two layout files named in Task 1.
- **Task order deliberately deviates from the spec §3 "biggest-first" sweep listing**: the three `use-toast` pages (Tasks 3–5) come first so the loop bug and the dead wrapper die early, then the status-module consumers (6, 7, 9) follow their Task 2 dependency. Every file in the spec's listing is still covered exactly once.

## Translation glossary (use these exact renderings for consistency)

| English                                   | Ukrainian                                   |
| ----------------------------------------- | ------------------------------------------- |
| Save / Saving…                            | Зберегти / Збереження…                      |
| Cancel                                    | Скасувати                                   |
| Delete                                    | Видалити                                    |
| Edit                                      | Редагувати                                  |
| Add                                       | Додати                                      |
| Create                                    | Створити                                    |
| Search (button/label) / placeholder       | Пошук / Пошук…                              |
| Loading…                                  | Завантаження…                               |
| Actions                                   | Дії                                         |
| Name (of a thing / of a person)           | Назва / Ім'я                                |
| Status                                    | Статус                                      |
| Date                                      | Дата                                        |
| Price                                     | Ціна                                        |
| Stock                                     | Залишок                                     |
| Category / Categories                     | Категорія / Категорії                       |
| Product / Products                        | Товар / Товари                              |
| Order / Orders                            | Замовлення (same in sg./pl.)                |
| Customer / Customers                      | Клієнт / Клієнти                            |
| Supplier / Suppliers                      | Постачальник / Постачальники                |
| Review / Reviews                          | Відгук / Відгуки                            |
| Newsletter                                | Розсилка                                    |
| Subscriber                                | Підписник                                   |
| Settings                                  | Налаштування                                |
| Dashboard                                 | Огляд                                       |
| Email / Phone / Address                   | Email / Телефон / Адреса                    |
| Total                                     | Всього                                      |
| Previous / Next (pagination)              | Назад / Далі                                |
| All (filter)                              | Усі                                         |
| Active                                    | Активний                                    |
| Error                                     | Помилка                                     |
| Failed to load …                          | Не вдалося завантажити …                    |
| Failed to save …                          | Не вдалося зберегти …                       |
| … deleted                                 | … видалено                                  |
| Are you sure?                             | Ви впевнені?                                |
| This action cannot be undone.             | Цю дію неможливо скасувати.                 |
| No … found                                | … не знайдено                               |
| Try adjusting your search terms / filters | Спробуйте змінити пошуковий запит / фільтри |
| Export CSV / Import / Upload              | Експорт CSV / Імпорт / Завантажити          |
| Reply                                     | Відповісти                                  |
| Rating / Comment                          | Оцінка / Коментар                           |
| Quantity                                  | Кількість                                   |
| Description / Image(s)                    | Опис / Зображення                           |
| Anonymous                                 | Без імені                                   |
| SKU / Slug / MPN / GTIN                   | keep Latin as-is                            |

Style: match the storefront catalog's tone (formal «ви», imperative button labels). When a string isn't in this table, author natural admin-UI Ukrainian and keep the same term for the same concept across all tasks.

---

### Task 1: Foundation slice — catalog seed, provider split, admin layout + sidebar

**Files:**

- Modify: `messages/uk.json` (append `admin` top-level key after `seo`)
- Modify: `src/app/layout.tsx` (~line 25 imports, ~line 133 provider)
- Modify: `src/app/(admin)/layout.tsx` (full rewrite, 17 lines)
- Modify: `src/components/admin/AdminSidebar.tsx`
- Create: `tests/unit/admin-sidebar.test.tsx`

**Interfaces:**

- Produces: `admin.layout.title`, `admin.nav.{dashboard,products,categories,orders,reviews,newsletter,customers,suppliers,settings,wordmark,backToStore}`, `admin.common.{save,cancel,delete,edit,create,add,search,loading,actions,previous,next,error,areYouSure,cannotBeUndone}` — every later task may reference `admin.common.*` instead of minting page-local duplicates. Also produces the provider split all later client-component work relies on.

- [ ] **Step 1: Append the catalog seed to `messages/uk.json`** — after the closing brace of the `seo` block, as the new last top-level key:

```json
"admin": {
  "layout": { "title": "Панель адміністратора" },
  "nav": {
    "dashboard": "Огляд",
    "products": "Товари",
    "categories": "Категорії",
    "orders": "Замовлення",
    "reviews": "Відгуки",
    "newsletter": "Розсилка",
    "customers": "Клієнти",
    "suppliers": "Постачальники",
    "settings": "Налаштування",
    "wordmark": "Адмін",
    "backToStore": "Повернутися до магазину"
  },
  "common": {
    "save": "Зберегти",
    "cancel": "Скасувати",
    "delete": "Видалити",
    "edit": "Редагувати",
    "create": "Створити",
    "add": "Додати",
    "search": "Пошук",
    "loading": "Завантаження…",
    "actions": "Дії",
    "previous": "Назад",
    "next": "Далі",
    "error": "Помилка",
    "areYouSure": "Ви впевнені?",
    "cannotBeUndone": "Цю дію неможливо скасувати."
  }
}
```

Validate JSON: `node -e "JSON.parse(require('fs').readFileSync('messages/uk.json','utf8')); console.log('OK')"`

- [ ] **Step 2: Write the failing smoke test** — `tests/unit/admin-sidebar.test.tsx` (the global `tests/setup.tsx` already mocks `usePathname` and imports jest-dom):

```tsx
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "../helpers/render-with-intl";
import { AdminSidebar } from "@/components/admin";

describe("AdminSidebar (admin.* catalog smoke)", () => {
  it("renders Ukrainian nav labels from the real uk.json catalog", () => {
    renderWithIntl(<AdminSidebar />);
    expect(screen.getByText("Товари")).toBeInTheDocument();
    expect(screen.getByText("Замовлення")).toBeInTheDocument();
    expect(screen.getByText("Постачальники")).toBeInTheDocument();
    expect(screen.getByText("Повернутися до магазину")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it — must FAIL** (sidebar still renders English): `npm run test:run -- tests/unit/admin-sidebar.test.tsx` → expect `Unable to find an element with the text: Товари`.

- [ ] **Step 4: Split the root provider** in `src/app/layout.tsx`. Extend the existing import `import { getLocale } from "next-intl/server";` to also import `getMessages`. Inside the (already async) `RootLayout`, before the return:

```tsx
const messages = await getMessages();
// Admin-only strings stay out of the storefront client payload (G13 spec §2);
// the (admin) layout re-provides the full catalog in its own nested provider.
const clientMessages = Object.fromEntries(
  Object.entries(messages).filter(([namespace]) => namespace !== "admin")
) as typeof messages;
```

and change `<NextIntlClientProvider>` to `<NextIntlClientProvider messages={clientMessages}>`.

- [ ] **Step 5: Rewrite `src/app/(admin)/layout.tsx`** (nested full-catalog provider + translated header):

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AdminSidebar } from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  const t = await getTranslations("admin.layout");
  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="bg-background flex h-16 items-center border-b px-6">
            <h1 className="text-lg font-semibold">{t("title")}</h1>
          </header>
          <main className="bg-muted/20 flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 6: Translate `AdminSidebar.tsx`.** Move the module-scope `navigation` array inside the component so labels come from the hook (icons/hrefs unchanged; use `href` as the React key since names are no longer unique identifiers):

```tsx
import { useTranslations } from "next-intl";
// … inside AdminSidebar():
const t = useTranslations("admin.nav");
const navigation = [
  { name: t("dashboard"), href: "/admin", icon: LayoutDashboard },
  { name: t("products"), href: "/admin/products", icon: Package },
  { name: t("categories"), href: "/admin/categories", icon: FolderTree },
  { name: t("orders"), href: "/admin/orders", icon: ShoppingCart },
  { name: t("reviews"), href: "/admin/reviews", icon: MessageSquare },
  { name: t("newsletter"), href: "/admin/newsletter", icon: Mail },
  { name: t("customers"), href: "/admin/customers", icon: Users },
  { name: t("suppliers"), href: "/admin/suppliers", icon: Truck },
  { name: t("settings"), href: "/admin/settings", icon: Settings },
];
```

Replace `key={item.name}` with `key={item.href}`. Replace the `"Admin"` wordmark with `{t("wordmark")}` and both `"Back to Store"` occurrences (text node + `title` attr) with `{t("backToStore")}` / `t("backToStore")`.

- [ ] **Step 7: Run the smoke test — must PASS**, then full gates: `npm run test:run -- tests/unit/admin-sidebar.test.tsx`, then `npm run typecheck && npm run lint && npm run test:run`.

- [ ] **Step 8: Commit:** `git add messages/uk.json src/app/layout.tsx "src/app/(admin)/layout.tsx" src/components/admin/AdminSidebar.tsx tests/unit/admin-sidebar.test.tsx && git commit -m "feat(g13): admin.* catalog seed, provider payload split, sidebar + layout UA"`

---

### Task 2: Monochrome status style modules (TDD)

**Files:**

- Modify: `src/lib/order-status.ts` (22 lines today)
- Create: `src/lib/supplier-order-status.ts`
- Modify: `messages/uk.json` (add `admin.supplierOrderStatus`)
- Create: `tests/unit/status-styles.test.ts`

**Interfaces:**

- Produces: `getPaymentStatusStyle(status: string): string` and `PAYMENT_STATUS_STYLES` from `@/lib/order-status`; `getSupplierOrderStatusStyle(status: string): string` and `SUPPLIER_ORDER_STATUS_STYLES` from `@/lib/supplier-order-status`; catalog keys `admin.supplierOrderStatus.{pending,submitted,confirmed,shipped,delivered,cancelled,failed}`. Consumed by Tasks 6, 7, 9.

- [ ] **Step 1: Write the failing tests** — `tests/unit/status-styles.test.ts`. The bright-color regex is the teeth: it would reject the old `bg-yellow-100`-style maps, so the suite cannot pass vacuously:

```ts
import { describe, expect, it } from "vitest";
import { getPaymentStatusStyle, PAYMENT_STATUS_STYLES } from "@/lib/order-status";
import {
  getSupplierOrderStatusStyle,
  SUPPLIER_ORDER_STATUS_STYLES,
} from "@/lib/supplier-order-status";

const BRIGHT = /(yellow|green|red|orange|blue|purple|indigo)-\d/;

describe("getPaymentStatusStyle", () => {
  it("returns a monochrome style for every PaymentStatus value", () => {
    for (const s of ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]) {
      expect(PAYMENT_STATUS_STYLES[s], `missing style for ${s}`).toBeTruthy();
      expect(getPaymentStatusStyle(s)).not.toMatch(BRIGHT);
    }
  });
  it("falls back to muted for unknown values", () => {
    expect(getPaymentStatusStyle("NOT_A_STATUS")).toBe("bg-muted text-muted-foreground");
  });
});

describe("getSupplierOrderStatusStyle", () => {
  it("returns a monochrome style for every known lowercase status", () => {
    for (const s of [
      "pending",
      "submitted",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "failed",
    ]) {
      expect(SUPPLIER_ORDER_STATUS_STYLES[s], `missing style for ${s}`).toBeTruthy();
      expect(getSupplierOrderStatusStyle(s)).not.toMatch(BRIGHT);
    }
  });
  it("falls back to muted for unknown values", () => {
    expect(getSupplierOrderStatusStyle("something-new")).toBe("bg-muted text-muted-foreground");
  });
});
```

- [ ] **Step 2: Run — must FAIL** (`getPaymentStatusStyle` not exported; module missing): `npm run test:run -- tests/unit/status-styles.test.ts`

- [ ] **Step 3: Extend `src/lib/order-status.ts`.** Append below the existing exports:

```ts
export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PAID: "bg-foreground text-background",
  FAILED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-destructive/10 text-destructive",
  PARTIALLY_REFUNDED: "bg-secondary text-secondary-foreground",
};

export function getPaymentStatusStyle(status: string): string {
  return PAYMENT_STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
}
```

Also update the file's docstring: delete the now-false sentence "the admin panel renders raw enum values until G13 migrates it onto the admin._ namespace." and replace with "Both customer and admin surfaces source labels from the catalog (admin reuses the account._ keys; G13)."

- [ ] **Step 4: Create `src/lib/supplier-order-status.ts`:**

```ts
/**
 * Presentation styles for SupplierOrder.status.
 * SupplierOrder.status is a plain Prisma String (no enum) with a lowercase
 * vocabulary written by supplier.service.ts (pending/submitted/confirmed/
 * shipped/delivered/cancelled/failed). Deliberately parallel to
 * order-status.ts, which is keyed to the uppercase OrderStatus enum — do not
 * merge the two. Monochrome by policy; destructive is reserved for
 * cancelled/failed. Labels live in the messages catalog
 * (admin.supplierOrderStatus), resolved with a t.has guard because the
 * vocabulary is convention-only.
 */
export const SUPPLIER_ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  submitted: "bg-muted text-foreground",
  confirmed: "bg-secondary text-secondary-foreground",
  shipped: "bg-secondary text-secondary-foreground",
  delivered: "bg-foreground text-background",
  cancelled: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
};

export function getSupplierOrderStatusStyle(status: string): string {
  return SUPPLIER_ORDER_STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
}
```

- [ ] **Step 5: Add the label keys** inside the `admin` block of `messages/uk.json` (sibling of `nav`):

```json
"supplierOrderStatus": {
  "pending": "Очікує",
  "submitted": "Надіслано",
  "confirmed": "Підтверджено",
  "shipped": "Відправлено",
  "delivered": "Доставлено",
  "cancelled": "Скасовано",
  "failed": "Помилка"
}
```

- [ ] **Step 6: Run — must PASS**, then full gates.
- [ ] **Step 7: Commit:** `git add src/lib/order-status.ts src/lib/supplier-order-status.ts messages/uk.json tests/unit/status-styles.test.ts && git commit -m "feat(g13): monochrome payment + supplier status style modules with catalog labels"`

---

### Task 3: Customers page — loop regression test, sonner migration, translation

**Files:**

- Modify: `src/app/(admin)/admin/customers/page.tsx` (252 lines)
- Modify: `messages/uk.json` (add `admin.customers`)
- Create: `tests/unit/admin-customers-page.test.tsx`

**Interfaces:**

- Consumes: `admin.common.*` (Task 1).
- Produces: `admin.customers.*` keys; the loop-regression test pattern Tasks 4 reuses conceptually.

- [ ] **Step 1: Write the failing regression test** — `tests/unit/admin-customers-page.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "../helpers/render-with-intl";
import AdminCustomersPage from "@/app/(admin)/admin/customers/page";

const customersResponse = {
  data: [
    {
      id: "c1",
      name: "Тест Клієнт",
      email: "test@example.com",
      image: null,
      createdAt: "2026-08-01T00:00:00.000Z",
      orderCount: 2,
      totalSpent: 1290,
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
};

describe("AdminCustomersPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => customersResponse })
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the list exactly once (no unstable-toast refetch loop)", async () => {
    renderWithIntl(<AdminCustomersPage />);
    await screen.findByText("test@example.com");
    // Give the old bug room to refire: state settled + a few macrotask turns.
    await new Promise((r) => setTimeout(r, 50));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("renders Ukrainian headers from the catalog", async () => {
    renderWithIntl(<AdminCustomersPage />);
    await screen.findByText("test@example.com");
    expect(screen.getByRole("heading", { name: "Клієнти" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — must FAIL.** Expected: the loop test fails on call count (the old `toast`-in-deps code refetches; BACKLOG entry documented 100+ live calls) and the header test fails on English "Customers". **If the loop test unexpectedly PASSES on the old code, STOP** — the check may be measuring the wrong thing (see CLAUDE.md abort conditions / critical-thinking §4); investigate how many renders RTL produces before migrating, don't just proceed.

- [ ] **Step 3: Add `admin.customers` keys** to `messages/uk.json` (sibling of `nav`):

```json
"customers": {
  "title": "Клієнти",
  "subtitle": "Керування обліковими записами клієнтів",
  "searchPlaceholder": "Пошук за іменем або email…",
  "headers": {
    "customer": "Клієнт",
    "email": "Email",
    "orders": "Замовлення",
    "totalSpent": "Всього витрачено",
    "joined": "Дата реєстрації"
  },
  "empty": "Клієнтів не знайдено",
  "tryAdjusting": "Спробуйте змінити пошуковий запит",
  "anonymous": "Без імені",
  "loadError": "Не вдалося завантажити клієнтів",
  "showingRange": "Показано {from}–{to} із {total, plural, one {# клієнта} few {# клієнтів} many {# клієнтів} other {# клієнта}}"
}
```

- [ ] **Step 4: Migrate + translate the page.** In `src/app/(admin)/admin/customers/page.tsx`:
  - Remove `import { useToast } from "@/hooks/use-toast";` and `const { toast } = useToast();`. Add `import { toast } from "sonner";` and `import { useTranslations } from "next-intl";`.
  - `const t = useTranslations("admin.customers");` at the top of the component.
  - In `fetchCustomers`'s catch: drop the `console.error` line (matches the sibling sonner pages) and replace the wrapper call with `toast.error(t("loadError"));` — note the catch no longer uses `error`, so use bare `catch {` (ESLint convention).
  - Dependency array becomes `[pagination.page, pagination.limit, search, t]` — `next-intl` memoizes the translator for a fixed namespace, so `t` is referentially stable; the unstable `toast` is gone. **The Step 1 regression test is the guard on that stability claim**: if `t` were unstable, the fetch-count assertion would go red right here — do not delete or weaken it.
  - Replace every UI literal with its key: heading → `t("title")`, subtitle → `t("subtitle")`, placeholder → `t("searchPlaceholder")`, search button → `tCommon("search")` via `const tCommon = useTranslations("admin.common");`, the five `TableHead`s → `t("headers.…")`, empty state → `t("empty")` / `t("tryAdjusting")`, `"Anonymous"` → `t("anonymous")`, pagination "Showing…" → `t("showingRange", { from: …, to: …, total: pagination.total })` (compute `from`/`to` with the existing expressions), Previous/Next → `tCommon("previous")` / `tCommon("next")`.
  - `formatDate`: `"en-US"` → `"uk-UA"`.
- [ ] **Step 5: Run the test file — both tests must PASS**, then full gates.
- [ ] **Step 6: Commit:** `git add "src/app/(admin)/admin/customers/page.tsx" messages/uk.json tests/unit/admin-customers-page.test.tsx && git commit -m "feat(g13): customers page UA + sonner migration, fixes infinite refetch loop"`

---

### Task 4: Categories page — sonner migration + translation

**Files:**

- Modify: `src/app/(admin)/admin/categories/page.tsx` (~57 strings; the other loop-bug page — `toast` in the deps at line 139)
- Modify: `messages/uk.json` (add `admin.categories`)

**Interfaces:**

- Consumes: `admin.common.*`.
- Produces: `admin.categories.*`.

- [ ] **Step 1: Read the file end-to-end** and list every user-visible literal (headings, 8 table headers, 5 SelectItems, 7 labels, 7 placeholders, dialog titles, AlertDialog confirm, 5 wrapper-toast calls, empty state).
- [ ] **Step 2: Add `admin.categories` keys** covering that list. Follow the Task 3 shape (`title`, `subtitle`, `searchPlaceholder`, `headers.*`, `empty`, form/dialog sub-objects like `form.nameLabel`, `deleteDialog.title`). Use the glossary; AlertDialog uses `admin.common.areYouSure` / `admin.common.cannotBeUndone` / `admin.common.cancel` / `admin.common.delete` where the English matches those meanings.
- [ ] **Step 3: Migrate + translate** exactly as Task 3 Step 4: useToast → sonner (5 call sites, mapping from Global Constraints), bare `catch`, deps array loses `toast` (keeps `parentFilter`), all literals → `t(...)`. This page has no date formatting.
- [ ] **Step 4: Full gates**, plus the page-level remnant grep:
      `grep -nE '(>[A-Za-z][^<>{}]*<|placeholder="[A-Za-z]|title="[A-Za-z]|toast\.(success|error)\("[A-Za-z])' "src/app/(admin)/admin/categories/page.tsx"` — every remaining hit must be a deliberate non-translatable (component names don't match this pattern; server-echoed messages do not appear as literals).
- [ ] **Step 5: Commit:** `feat(g13): categories page UA + sonner migration`

---

### Task 5: Settings page — sonner migration, translation, (грн) labels, delete use-toast

**Files:**

- Modify: `src/app/(admin)/admin/settings/page.tsx` (~48 strings, 6 wrapper-toast calls)
- Modify: `messages/uk.json` (add `admin.settings`)
- Delete: `src/hooks/use-toast.ts`

**Interfaces:**

- Consumes: `admin.common.*`.
- Produces: `admin.settings.*`; removes the `use-toast` module repo-wide (this is its last consumer).

- [ ] **Step 1: Read the file**; list literals (12 labels incl. the 3 "$" ones, 8 card titles/descriptions, 5 placeholders, buttons, toasts).
- [ ] **Step 2: Add `admin.settings` keys.** The three shipping labels get these exact renderings (spec §4): "Free Shipping Threshold ($)" → `"freeShippingLabel": "Поріг безкоштовної доставки (грн)"`, "Standard Shipping ($)" → `"standardShippingLabel": "Стандартна доставка (грн)"`, "Express Shipping ($)" → `"expressShippingLabel": "Експрес-доставка (грн)"`.
- [ ] **Step 3: Migrate + translate** (same mechanics as Tasks 3–4; no date formatting here).
- [ ] **Step 4: Delete `src/hooks/use-toast.ts`**, then prove it's dead: `grep -rn "use-toast" src/ tests/` → must return nothing.
- [ ] **Step 5: Full gates + page remnant grep (Task 4 Step 4 command, this file's path).**
- [ ] **Step 6: Commit:** `git add -A "src/app/(admin)/admin/settings/page.tsx" src/hooks messages/uk.json && git commit -m "feat(g13): settings page UA + грн labels, drop dead use-toast wrapper"`

---

### Task 6: Orders list page — translation + monochrome payment badges

**Files:**

- Modify: `src/app/(admin)/admin/orders/page.tsx` (~35 strings; local `PAYMENT_STATUS_COLORS` at lines 69–75; badge use at ~381; 12 status-filter SelectItems; date at ~196)
- Modify: `messages/uk.json` (add `admin.orders` list-page keys)

**Interfaces:**

- Consumes: `getPaymentStatusStyle` (Task 2), `account.orderStatus` / `account.paymentStatus` (existing catalog), `admin.common.*`.
- Produces: `admin.orders.*` list keys (Task 7 adds detail keys into the same object).

- [ ] **Step 1: Read the file** and the already-migrated customer page `src/app/(shop)/account/orders/page.tsx` — copy its exact pattern for rendering enum labels from `account.orderStatus` (it is the in-repo precedent for typed enum→key access; reuse its cast style verbatim).
- [ ] **Step 2: Add `admin.orders` keys** (title, subtitle, search placeholder, 8 headers, empty state, filter labels — "All statuses" → `"allStatuses": "Усі статуси"`, "All payment statuses" → `"allPaymentStatuses": "Усі статуси оплати"`).
- [ ] **Step 3: Replace the local `PAYMENT_STATUS_COLORS` map** with `import { getOrderStatusStyle, getPaymentStatusStyle } from "@/lib/order-status";` (extend the existing import). Payment badge becomes:

```tsx
const tPayment = useTranslations("account.paymentStatus");
// …
<Badge className={getPaymentStatusStyle(order.paymentStatus)}>
  {tPayment(order.paymentStatus as Parameters<typeof tPayment>[0])}
</Badge>;
```

(If the account orders page uses a different cast idiom, prefer its idiom.) Order-status badges likewise render `tOrder(order.status …)` from `account.orderStatus` instead of the raw enum. The 12 filter `SelectItem`s reuse the same two namespaces for per-status labels.

- [ ] **Step 4: Translate the rest**; `formatDate` → `"uk-UA"`.
- [ ] **Step 5: Full gates + page remnant grep. Grep must show no `PAYMENT_STATUS_COLORS` left in this file.**
- [ ] **Step 6: Commit:** `feat(g13): orders list UA + monochrome payment badges with catalog labels`

---

### Task 7: Orders detail page — translation + payment badges + timeline

**Files:**

- Modify: `src/app/(admin)/admin/orders/[id]/page.tsx` (~46 strings; local `PAYMENT_STATUS_COLORS` at 130–136 with uses at ~326/~754; `STATUS_OPTIONS` at 122–129; `ORDER_TIMELINE` at 141–147; date at ~259; sonner already)
- Modify: `messages/uk.json` (extend `admin.orders` with detail keys)

**Interfaces:**

- Consumes: `getPaymentStatusStyle`, `account.orderStatus`, `account.paymentStatus`, `admin.common.*`; the enum-label cast idiom from Task 6.
- Produces: `admin.orders.timeline.*`.

- [ ] **Step 1: Read the file.** Delete its `PAYMENT_STATUS_COLORS` copy; adopt `getPaymentStatusStyle` + `account.paymentStatus` labels at both badge sites (same code as Task 6 Step 3).
- [ ] **Step 2: `STATUS_OPTIONS`** (the 7 order-status `SelectItem` labels) — labels come from `account.orderStatus`: keep the option **values** as the enum strings, render each label via the Task 6 idiom. Move the array inside the component if it needs the hook.
- [ ] **Step 3: `ORDER_TIMELINE`** — add and use:

```json
"timeline": {
  "placed": "Замовлення оформлено",
  "confirmed": "Замовлення підтверджено",
  "processing": "Обробляється",
  "shipped": "Відправлено",
  "delivered": "Доставлено"
}
```

(These deliberately match the tone of the customer timeline in `account.orderDetail.timeline`.)

- [ ] **Step 4: Translate the remaining literals** (11 titles, 4 labels, 3 placeholders, 4 toasts — the `toast.success(data.message)` echo at ~243 keeps its echo; only fallback literals are translated); `formatDate` → `"uk-UA"`.
- [ ] **Step 5: Full gates + remnant grep; no `PAYMENT_STATUS_COLORS` anywhere in `src/` after this task:** `grep -rn "PAYMENT_STATUS_COLORS" src/` → empty.
- [ ] **Step 6: Commit:** `feat(g13): orders detail UA + payment badges + timeline labels`

---

### Task 8: Suppliers list page — translation

**Files:**

- Modify: `src/app/(admin)/admin/suppliers/page.tsx` (~72 strings — the largest file: 9 headers, 10 SelectItems, 10 labels, 12 placeholders, 4 dialog titles, 9 toasts incl. `data.message` echoes at ~327–329, AlertDialog, 2 empty states; sonner already)
- Modify: `messages/uk.json` (add `admin.suppliers` list keys)

**Interfaces:**

- Consumes: `admin.common.*`.
- Produces: `admin.suppliers.*` list keys (Task 9 extends the same object).

- [ ] **Step 1: Read the file end-to-end**; list every literal.
- [ ] **Step 2: Add `admin.suppliers` keys** (glossary + Task 3 shape; sub-objects per dialog/form). The inline guard `toast.error("Name and code are required")` at ~233 is client-side validation — translate it: `"nameCodeRequired": "Вкажіть назву та код"`.
- [ ] **Step 3: Translate**; `data.message` echoes keep the echo, fallback literals translated.
- [ ] **Step 4: Full gates + remnant grep.**
- [ ] **Step 5: Commit:** `feat(g13): suppliers list UA`

---

### Task 9: Suppliers detail page — translation + supplier status module

**Files:**

- Modify: `src/app/(admin)/admin/suppliers/[id]/page.tsx` (~42 strings; local `STATUS_COLORS` at 88–96, badge at ~520; 15 headers; 7 toasts incl. echoes at ~178–180; date at ~193)
- Modify: `messages/uk.json` (extend `admin.suppliers`)

**Interfaces:**

- Consumes: `getSupplierOrderStatusStyle` + `admin.supplierOrderStatus` (Task 2), `admin.common.*`.

- [ ] **Step 1: Delete the local `STATUS_COLORS` map.** The badge becomes (the `t.has` guard is required — the vocabulary is a plain String, unknown values must render raw, mirroring the byCode guard pattern):

```tsx
import { getSupplierOrderStatusStyle } from "@/lib/supplier-order-status";
// …
const tSupplierStatus = useTranslations("admin.supplierOrderStatus");
// …
<Badge className={getSupplierOrderStatusStyle(order.status)}>
  {tSupplierStatus.has(order.status as never)
    ? tSupplierStatus(order.status as never)
    : order.status}
</Badge>;
```

- [ ] **Step 2: Translate the rest** (15 headers, 9 titles, toasts with echo rule); `formatDate` → `"uk-UA"`.
- [ ] **Step 3: Full gates + remnant grep; `grep -rn "STATUS_COLORS" src/` → empty.**
- [ ] **Step 4: Commit:** `feat(g13): suppliers detail UA + monochrome supplier status badges`

---

### Task 10: Products pages — list, edit, new

**Files:**

- Modify: `src/app/(admin)/admin/products/page.tsx` (~34 strings; sonner already)
- Modify: `src/app/(admin)/admin/products/[id]/page.tsx` (~8 strings: 1 toast, loading/not-found)
- Modify: `src/app/(admin)/admin/products/new/page.tsx` (**server component** — `getTranslations`, ~2 strings)
- Modify: `messages/uk.json` (add `admin.products`)

**Interfaces:**

- Consumes: `admin.common.*`.
- Produces: `admin.products.*`.

- [ ] **Step 1: Read all three files**; add `admin.products` keys (list: title/subtitle/search/9 headers/5 filter SelectItems/empty/toasts/AlertDialog; edit: loading «Завантаження…» via `admin.common.loading`, not-found «Товар не знайдено»; new: page heading «Новий товар» + description).
- [ ] **Step 2: Translate.** `new/page.tsx` uses `const t = await getTranslations("admin.products");` (server component — no hook).
- [ ] **Step 3: Full gates + remnant grep on all three files.**
- [ ] **Step 4: Commit:** `feat(g13): products pages UA`

---

### Task 11: ProductForm — translation, Zod messages, грн padding fix

**Files:**

- Modify: `src/components/admin/ProductForm.tsx` (~53 strings; local `productFormSchema` at ~25–56; «грн» spans at 286/308/334 over `pl-7` inputs)
- Modify: `messages/uk.json` (add `admin.productForm`)

**Interfaces:**

- Consumes: `admin.common.*`.
- Produces: `admin.productForm.*`.

- [ ] **Step 1: Read the file.** The module-scope Zod schema must become hook-aware because its messages come from the catalog. Convert it to a builder and memoize:

```tsx
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type TProductForm = ReturnType<typeof useTranslations<"admin.productForm">>;

function buildProductFormSchema(t: TProductForm) {
  return z.object({
    name: z.string().min(1, t("errors.nameRequired")),
    // … same fields as today, each message from t("errors.…")
  });
}

// inside the component:
const t = useTranslations("admin.productForm");
const productFormSchema = useMemo(() => buildProductFormSchema(t), [t]);
```

Keep the inferred form type working: `type ProductFormValues = z.infer<ReturnType<typeof buildProductFormSchema>>;` (move the existing type alias accordingly). `zodResolver(productFormSchema)` stays as-is.

- [ ] **Step 2: Add `admin.productForm` keys**, including the exact error renderings: "Name is required" → `"errors.nameRequired": "Вкажіть назву"`, "Price must be a positive number" → `"errors.pricePositive": "Ціна має бути додатним числом"`, "SKU is required" → `"errors.skuRequired": "Вкажіть SKU"`, "Stock must be a non-negative integer" → `"errors.stockNonNegative": "Залишок має бути цілим невід'ємним числом"`, "Category is required" → `"errors.categoryRequired": "Оберіть категорію"`, "Compare price must be greater than regular price" → `"errors.comparePriceGreater": "Стара ціна має бути більшою за звичайну"`. Plus 15 labels, 11 placeholders, 6 card titles, ternary create/update toasts (two keys each for success/failure).
- [ ] **Step 3: The three «грн» adornment spans stay literal** (currency symbol, not copy) — but change each adjoining `Input` `className` from `pl-7` to `pl-12` (the BACKLOG'd crowding fix: «грн» is 3 glyphs vs "$"'s 1).
- [ ] **Step 4: Full gates + remnant grep.** Existing unit tests must stay green — none render ProductForm today, but `npm run test:run` proves it.
- [ ] **Step 5: Commit:** `feat(g13): ProductForm UA incl. Zod messages, widen грн input padding`

---

### Task 12: ImageUploader + ProductImportDialog — ICU plurals

**Files:**

- Modify: `src/components/admin/ImageUploader.tsx` (~13 strings; template-literal toasts at ~83/99/105)
- Modify: `src/components/admin/ProductImportDialog.tsx` (~18 strings; pluralized toasts at ~105/110)
- Modify: `messages/uk.json` (add `admin.imageUploader`, `admin.productImport`)

**Interfaces:**

- Consumes: `admin.common.*`.

- [ ] **Step 1: Add the keys.** The interpolated/pluralized ones exactly:

```json
"imageUploader": {
  "onlyNMore": "Можна додати ще {count, plural, one {# зображення} few {# зображення} many {# зображень} other {# зображення}}",
  "uploadFailed": "Не вдалося завантажити {name}",
  "uploaded": "{count, plural, one {Завантажено # зображення} few {Завантажено # зображення} many {Завантажено # зображень} other {Завантажено # зображення}}"
},
"productImport": {
  "imported": "{count, plural, one {Імпортовано # товар} few {Імпортовано # товари} many {Імпортовано # товарів} other {Імпортовано # товару}}"
}
```

plus the remaining plain strings from both files (dialog titles, dropzone copy, buttons).

- [ ] **Step 2: Translate**, calling e.g. `toast.success(t("uploaded", { count: n }))` and `t("uploadFailed", { name: file.name })`.
- [ ] **Step 3: Full gates + remnant grep on both files.**
- [ ] **Step 4: Commit:** `feat(g13): image uploader + CSV import dialog UA with ICU plurals`

---

### Task 13: Reviews page — translation

**Files:**

- Modify: `src/app/(admin)/admin/reviews/page.tsx` (~50 strings; ternary toast at ~142; 9 filter SelectItems; date at ~205; sonner already)
- Modify: `messages/uk.json` (add `admin.reviews`)

- [ ] **Step 1: Read the file**; add `admin.reviews` keys. The visibility ternary gets two keys: `"nowVisible": "Відгук знову видимий"`, `"nowHidden": "Відгук приховано"` → `toast.success(review.isHidden ? t("nowVisible") : t("nowHidden"))`. Rating filter labels use ICU or fixed strings: «Усі оцінки», «5 зірок», «4 зірки», «3 зірки», «2 зірки», «1 зірка» (fixed strings — the set is closed, ICU unnecessary).
- [ ] **Step 2: Translate**; `formatDate` → `"uk-UA"`.
- [ ] **Step 3: Full gates + remnant grep.**
- [ ] **Step 4: Commit:** `feat(g13): reviews page UA`

---

### Task 14: Newsletter page — translation

**Files:**

- Modify: `src/app/(admin)/admin/newsletter/page.tsx` (~35 strings; ternary status toast at ~122; subscriber-status filter; date at ~162; sonner already)
- Modify: `messages/uk.json` (add `admin.newsletter`)

- [ ] **Step 1: Read the file**; add `admin.newsletter` keys. Subscriber statuses (SubscriberStatus enum, admin-only surface — no existing catalog labels, so these live here): `"status": { "PENDING": "Очікує підтвердження", "ACTIVE": "Активний", "UNSUBSCRIBED": "Відписаний" }` — used for both the filter SelectItems and any badge text; the ternary activate/unsubscribe toast gets two keys.
- [ ] **Step 2: Translate**; `formatDate` → `"uk-UA"`. The "Export CSV" button → «Експорт CSV».
- [ ] **Step 3: Full gates + remnant grep.**
- [ ] **Step 4: Commit:** `feat(g13): newsletter page UA`

---

### Task 15: Dashboard + docs propagation + final verification

**Files:**

- Modify: `src/app/(admin)/admin/page.tsx` (**server component**, ~14 strings)
- Modify: `messages/uk.json` (add `admin.dashboard`)
- Modify: `messages/README.md`, `CLAUDE.md` (root), `src/app/CLAUDE.md`, `src/components/CLAUDE.md`

- [ ] **Step 1: Translate the dashboard** — `const t = await getTranslations("admin.dashboard");` (server component). Keys: «Всього доходу», «Замовлення», «Товари», «Клієнти», «Підписники», «Останні замовлення», «Швидкі дії», sublabels («Активні товари», «Зареєстровані користувачі»), etc. Revenue stays on `formatPrice()`.
- [ ] **Step 2: `messages/README.md`**: in the conventions paragraph, replace "`admin.*` reserved for G13" with "`admin.*` populated in G13 — **UA-only by decision** (2026-08-16): RU deliberately has no admin keys; the deep-merge fallback renders UA for RU-toggled admins. The root layout strips `admin.*` from the storefront client payload; the `(admin)` layout re-provides the full catalog (provider split, G13 spec §2)."
- [ ] **Step 3: Root `CLAUDE.md` corrections** — grep first: `grep -n "until G13\|G13\|use-toast" CLAUDE.md src/app/CLAUDE.md src/components/CLAUDE.md`. Known stale claims to correct (there may be more — fix every hit that asserts the old reality):
  - Root: `hooks/` line "(use-debounce, use-toast)" → "(use-debounce)".
  - Root: `order-status.ts` line "the admin panel renders raw enum values until G13" → "admin sources labels from the catalog since G13 (reusing `account.*`; supplier statuses via `admin.supplierOrderStatus`)".
  - Root: the "Reserved namespace: `admin.*` is not yet populated…" passage in the cookie-mode i18n pattern → rewrite to the shipped reality (populated, UA-only, provider split, EN admin chrome gone, status badges labeled, settings «грн»).
  - `src/app/CLAUDE.md`: "admin status badges render raw enum values until G13 sources labels from the catalog" → same correction.
  - `src/components/CLAUDE.md`: AdminSidebar/providers lines if they assert English chrome or `use-toast`.
- [ ] **Step 4: Repo-wide remnant + leftover checks:**
  - `grep -rnE '(>[A-Za-z][^<>{}]*<|placeholder="[A-Za-z]|toast\.(success|error)\("[A-Za-z])' "src/app/(admin)" src/components/admin/` — audit every hit; only deliberate non-translatables (SKU/Slug/Latin technical tokens, `data.message` echoes) may remain.
  - `grep -rn "PAYMENT_STATUS_COLORS\|STATUS_COLORS\|use-toast" src/ tests/` → empty.
  - `grep -rn 'toLocaleDateString("en-US"' "src/app/(admin)" src/components/admin/` → empty.
- [ ] **Step 5: Storefront payload check** (needs the dev server; run foreground in a second terminal or background the server only): with `npm run dev` serving port 3001:
  - Negative: `curl -s http://localhost:3001/ | grep -c "Постачальники"` → `0` (admin string absent from storefront HTML).
  - Positive control (proves the check can fail — the grep target must be a string that IS in the payload): `curl -s http://localhost:3001/ | grep -c "Кошик"` → `≥ 1`.
- [ ] **Step 6: Full gates one last time**: `npm run typecheck && npm run lint && npm run format:check && npm run test:run`.
- [ ] **Step 7: Commit:** `git add -A && git commit -m "feat(g13): dashboard UA + docs propagation (CLAUDE.md, messages/README)"`

---

## After the plan (not tasks — workflow steps)

Browser click-through of all 13 admin routes (seeded DB, admin credentials from `prisma/seed-data/users.ts`) with screenshots delivered via one Artifact page, RU-toggle spot-check included; then PR per `superpowers:finishing-a-development-branch` + `requesting-code-review`. Close-out (BACKLOG 🟤 entry for admin API i18n, residual check-offs, WEEKLY status, DONE.md, memory) follows the CLAUDE.md Task Completion checklist — the doc corrections themselves already shipped in Task 15.
