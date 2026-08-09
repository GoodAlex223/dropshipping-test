# G4 Peripheral Surfaces Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert every remaining English customer-facing surface (auth, account, newsletter, system pages, categories chrome, Header residuals, cookie banner) to Ukrainian with Mirox derived alignment, per the approved spec `docs/superpowers/specs/2026-08-08-g4-peripheral-surfaces-design.md`.

**Architecture:** Four new `src/content/` modules (auth/account/newsletter/system) + a `header` key on `site.ts` carry all new copy; a shared hook-free `StatusScreen` component replaces the five hand-rolled status pages; the newsletter API (and the register 409) gain machine `code`s that clients map to Ukrainian via the content layer (G2 `create-order` convention). Categories chrome strings stay inline (catalog-domain convention).

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind + shadcn/ui, Zod, Vitest + RTL, Playwright.

## Global Constraints

- Branch: `feat/g4-peripheral-surfaces` (already checked out; spec committed as `80dc69a`).
- All new UI copy is Ukrainian, in `src/content/` modules as plain typed literals — **except** categories chrome, which stays inline in its components (spec §3.1 exception).
- API prose (`error`/`message` fields) stays **English** — clients render Ukrainian by mapping the machine `code` (spec §3.3). Existing EN assertions on `body.error`/`body.message` in API tests are kept, not translated.
- `StatusScreen` must have **no** `"use client"` directive and no hooks (server-usable by `not-found.tsx`).
- Do not touch: admin surfaces, showcase routes, `src/components/ui/*` primitives, Stripe code, `/products` + PDP strings.
- `no-bright-colors.test.ts` SCAN_PATHS already covers every touched path — do not edit that file; never introduce a numbered bright-hue utility.
- Preserve `useParams<{ id: string }>()!` in `account/orders/[id]` (G3 pattern; the trailing `!` is load-bearing — pages-compat types).
- Dates render with `toLocaleDateString("uk-UA", …)` on account pages.
- Primary submit CTAs uppercase in the content strings themselves («УВІЙТИ»); navigation buttons normal case («На головну»). No CSS `uppercase` class for this.
- Every commit: conventional message + the standing `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` trailer. Pre-commit hooks (lint-staged) must pass.
- Run a single test file with `npm run test:run -- tests/unit/<file>`.
- Log progress in this plan file (check boxes, note deviations) as tasks complete.

---

### Task 1: `apiError` optional `code` param

**Files:**

- Modify: `src/lib/api-utils.ts:37-39`
- Test: `tests/unit/api-utils.test.ts` (extend `describe("apiError")` at line ~100)

**Interfaces:**

- Consumes: nothing new.
- Produces: `apiError(message: string, status?: number, code?: string)` → JSON `{ error }` or `{ error, code }`. Tasks 2 and 7 rely on the 3-arg form.

- [x] **Step 1: Write the failing tests** — append inside `describe("apiError", …)` in `tests/unit/api-utils.test.ts`:

```ts
it("includes a machine code when provided", async () => {
  const response = apiError("Invalid confirmation link", 404, "INVALID_TOKEN");

  expect(response.status).toBe(404);
  const body = await response.json();
  expect(body).toEqual({ error: "Invalid confirmation link", code: "INVALID_TOKEN" });
});

it("omits the code key entirely when not provided", async () => {
  const response = apiError("Plain");
  const body = await response.json();

  expect(body).toEqual({ error: "Plain" });
  expect("code" in body).toBe(false);
});
```

- [x] **Step 2: Run to verify the first fails**

Run: `npm run test:run -- tests/unit/api-utils.test.ts`
Expected: FAIL — body equals `{ error: … }` without `code` (first new test).

- [x] **Step 3: Implement** — replace the `apiError` function in `src/lib/api-utils.ts`:

```ts
export function apiError(message: string, status: number = 400, code?: string) {
  // `code` is machine-readable for clients that map outcomes to localized
  // copy (see the newsletter routes); `message` stays log/consumer text.
  return NextResponse.json(code ? { error: message, code } : { error: message }, { status });
}
```

- [x] **Step 4: Run to verify pass**

Run: `npm run test:run -- tests/unit/api-utils.test.ts`
Expected: PASS (all).

- [x] **Step 5: Commit**

```bash
git add src/lib/api-utils.ts tests/unit/api-utils.test.ts
git commit -m "feat(api): optional machine code on apiError responses"
```

---

### Task 2: Newsletter API coded outcomes

**Files:**

- Modify: `src/app/api/newsletter/subscribe/route.ts`, `src/app/api/newsletter/confirm/route.ts`, `src/app/api/newsletter/unsubscribe/route.ts`
- Test: `tests/unit/newsletter-api.test.ts`

**Interfaces:**

- Consumes: Task 1's `apiError(message, status, code)`.
- Produces: every newsletter response carries `code` (error bodies via `apiError`'s third arg; success bodies as a `code` key inside the `apiSuccess` payload). Codes consumed by Tasks 3/6:
  - subscribe: `VALIDATION_ERROR` 400 · `ALREADY_SUBSCRIBED` 409 · `CONFIRMATION_PENDING` 201 (both the normal and the P2002-race path) · `SUBSCRIBE_FAILED` 500
  - confirm: `TOKEN_REQUIRED` 400 · `INVALID_TOKEN` 404 · `ALREADY_CONFIRMED` 200 · `LINK_EXPIRED` 410 · `CONFIRMED` 200 · `CONFIRM_FAILED` 500
  - unsubscribe: `VALIDATION_ERROR` 400 · `SUBSCRIBER_NOT_FOUND` 404 · `ALREADY_UNSUBSCRIBED` 200 · `INVALID_UNSUBSCRIBE_LINK` 400 · `UNSUBSCRIBED` 200 · `UNSUBSCRIBE_FAILED` 500

- [x] **Step 1: Extend existing tests (red first).** In `tests/unit/newsletter-api.test.ts`, add a `body.code` assertion to each listed test. Keep every existing EN `toContain` assertion. Worked example for the 409 test:

```ts
it("returns 409 when email is already active", async () => {
  // …existing arrange/act unchanged…
  expect(res.status).toBe(409);
  const body = await res.json();
  expect(body.error).toContain("already subscribed");
  expect(body.code).toBe("ALREADY_SUBSCRIBED");
});
```

Apply the same pattern (read body if the test doesn't already, then `expect(body.code).toBe(…)`):

| Test (by its `it` title)                                       | Expected `code`            |
| -------------------------------------------------------------- | -------------------------- |
| subscribe: "returns 400 on validation error (invalid email)"   | `VALIDATION_ERROR`         |
| subscribe: "returns 409 when email is already active"          | `ALREADY_SUBSCRIBED`       |
| subscribe: "creates new subscriber with PENDING status"        | `CONFIRMATION_PENDING`     |
| subscribe: "re-subscribes existing UNSUBSCRIBED subscriber"    | `CONFIRMATION_PENDING`     |
| subscribe: "returns 201 even if email send fails"              | `CONFIRMATION_PENDING`     |
| confirm: "returns 400 when token is missing"                   | `TOKEN_REQUIRED`           |
| confirm: "returns 404 when token is invalid"                   | `INVALID_TOKEN`            |
| confirm: "returns success when already active"                 | `ALREADY_CONFIRMED`        |
| confirm: "returns 410 when token is expired"                   | `LINK_EXPIRED`             |
| confirm: "returns 410 when confirmationExpiry is null"         | `LINK_EXPIRED`             |
| confirm: "activates subscriber and clears token"               | `CONFIRMED`                |
| unsubscribe: "returns 400 on validation error (missing email)" | `VALIDATION_ERROR`         |
| unsubscribe: "returns 400 on validation error (missing token)" | `VALIDATION_ERROR`         |
| unsubscribe: "returns 404 when subscriber not found"           | `SUBSCRIBER_NOT_FOUND`     |
| unsubscribe: "returns success when already unsubscribed"       | `ALREADY_UNSUBSCRIBED`     |
| unsubscribe: "returns 400 when HMAC token is invalid"          | `INVALID_UNSUBSCRIBE_LINK` |
| unsubscribe: "unsubscribes successfully with valid HMAC token" | `UNSUBSCRIBED`             |

Note: the two 400-validation tests currently assert only `res.status` — add the body read + code assertion there.

- [x] **Step 2: Run to verify red**

Run: `npm run test:run -- tests/unit/newsletter-api.test.ts`
Expected: FAIL — `body.code` is `undefined` in every extended test.

- [x] **Step 3: Attach codes in the three routes.** Exact replacements (English prose unchanged):

`subscribe/route.ts`:

- `apiError(result.error.issues[0].message, 400)` → `apiError(result.error.issues[0].message, 400, "VALIDATION_ERROR")`
- `apiError("This email is already subscribed", 409)` → `…, 409, "ALREADY_SUBSCRIBED")`
- both `apiSuccess({ message: "Please check your email to confirm your subscription" }, 201)` (race path and normal path) → `apiSuccess({ code: "CONFIRMATION_PENDING", message: "Please check your email to confirm your subscription" }, 201)`
- `apiError("Failed to process subscription", 500)` → `…, 500, "SUBSCRIBE_FAILED")`

Add above the first changed line the G2-style comment:

```ts
// `error`/`message` strings are for logs/API consumers; clients map
// `code` to Ukrainian copy (src/content/newsletter.ts).
```

`confirm/route.ts`:

- `apiError("Confirmation token is required", 400)` → `…, 400, "TOKEN_REQUIRED")`
- `apiError("Invalid confirmation link", 404)` → `…, 404, "INVALID_TOKEN")`
- `apiSuccess({ message: "Your subscription is already confirmed" })` → `apiSuccess({ code: "ALREADY_CONFIRMED", message: "Your subscription is already confirmed" })`
- `apiError("This confirmation link has expired. Please subscribe again.", 410)` → `…, 410, "LINK_EXPIRED")`
- `apiSuccess({ message: "Your subscription has been confirmed" })` → `apiSuccess({ code: "CONFIRMED", message: "Your subscription has been confirmed" })`
- `apiError("Failed to confirm subscription", 500)` → `…, 500, "CONFIRM_FAILED")`

`unsubscribe/route.ts`:

- `apiError(result.error.issues[0].message, 400)` → `…, 400, "VALIDATION_ERROR")`
- `apiError("Subscriber not found", 404)` → `…, 404, "SUBSCRIBER_NOT_FOUND")`
- `apiSuccess({ message: "You are already unsubscribed" })` → `apiSuccess({ code: "ALREADY_UNSUBSCRIBED", message: "You are already unsubscribed" })`
- `apiError("Invalid unsubscribe link", 400)` → `…, 400, "INVALID_UNSUBSCRIBE_LINK")`
- `apiSuccess({ message: "You have been unsubscribed successfully" })` → `apiSuccess({ code: "UNSUBSCRIBED", message: "You have been unsubscribed successfully" })`
- `apiError("Failed to process unsubscribe", 500)` → `…, 500, "UNSUBSCRIBE_FAILED")`

- [x] **Step 4: Run to verify green**

Run: `npm run test:run -- tests/unit/newsletter-api.test.ts`
Expected: PASS (all 17+).

- [x] **Step 5: Commit**

```bash
git add src/app/api/newsletter tests/unit/newsletter-api.test.ts
git commit -m "feat(newsletter): machine codes on every API outcome (G2 coded-outcome convention)"
```

---

### Task 3: Content modules (auth/account/newsletter/system + site.header) and the label-map move

**Files:**

- Create: `src/content/auth.ts`, `src/content/account.ts`, `src/content/newsletter.ts`, `src/content/system.ts`
- Modify: `src/content/site.ts` (add `header` key), `src/lib/order-status.ts` (labels move out)
- Test: `tests/unit/content.test.ts` (extend), `tests/unit/order-status.test.ts` (update)

**Interfaces:**

- Consumes: `pluralizeUk` from `@/lib/format`.
- Produces (exact, used by Tasks 5–12): `auth`, `account`, `ORDER_STATUS_LABELS`, `PAYMENT_STATUS_LABELS` (from `@/content/account`), `newsletter`, `NewsletterOutcomeCopy` (from `@/content/newsletter`), `system`, `site.header`. `@/lib/order-status` keeps exporting `ORDER_STATUS_LABELS`, `getOrderStatusLabel`, `getOrderStatusStyle`, `ORDER_STATUS_STYLES` (labels now Ukrainian).

- [x] **Step 1: Write failing content-shape tests** — append to `tests/unit/content.test.ts` (extend the existing import block too):

```ts
import { auth } from "@/content/auth";
import { account, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/content/account";
import { newsletter } from "@/content/newsletter";
import { system } from "@/content/system";
import { OrderStatus, PaymentStatus } from "@prisma/client";

describe("auth content", () => {
  it("keeps submit CTAs uppercase per the shipped checkout convention", () => {
    expect(auth.login.submit).toBe(auth.login.submit.toUpperCase());
    expect(auth.register.submit).toBe(auth.register.submit.toUpperCase());
  });
});

describe("account content", () => {
  it("labels every OrderStatus value in Ukrainian", () => {
    for (const s of Object.values(OrderStatus)) {
      expect(ORDER_STATUS_LABELS[s]).toBeTruthy();
      expect(ORDER_STATUS_LABELS[s]).not.toMatch(/^[A-Za-z ]+$/);
    }
  });

  it("labels every PaymentStatus value in Ukrainian", () => {
    for (const s of Object.values(PaymentStatus)) {
      expect(PAYMENT_STATUS_LABELS[s]).toBeTruthy();
    }
  });

  it("pluralizes the more-items line", () => {
    expect(account.orders.card.more(1)).toBe("+1 інший товар");
    expect(account.orders.card.more(3)).toBe("+3 інші товари");
    expect(account.orders.card.more(5)).toBe("+5 інших товарів");
  });

  it("maps cod and card payment methods", () => {
    expect(account.orderDetail.payment.methodLabel("cod")).toBe("Оплата при отриманні");
    expect(account.orderDetail.payment.methodLabel("card")).toBe("Карткою");
  });
});

describe("newsletter content", () => {
  it("covers every confirm code the API emits", () => {
    for (const code of [
      "CONFIRMED",
      "ALREADY_CONFIRMED",
      "LINK_EXPIRED",
      "INVALID_TOKEN",
      "TOKEN_REQUIRED",
    ]) {
      expect(newsletter.confirm.byCode[code]).toBeTruthy();
    }
  });

  it("covers every unsubscribe code the API emits", () => {
    for (const code of [
      "UNSUBSCRIBED",
      "ALREADY_UNSUBSCRIBED",
      "SUBSCRIBER_NOT_FOUND",
      "INVALID_UNSUBSCRIBE_LINK",
    ]) {
      expect(newsletter.unsubscribe.byCode[code]).toBeTruthy();
    }
  });

  it("interpolates the unsubscribe prompt email", () => {
    expect(newsletter.unsubscribe.idle.prompt("a@b.ua")).toContain("a@b.ua");
  });
});

describe("system content", () => {
  it("has the cookie banner button pair", () => {
    expect(system.cookies.accept).toBe("Прийняти");
    expect(system.cookies.decline).toBe("Відхилити");
  });
});

describe("site header content", () => {
  it("wraps search queries in Ukrainian guillemets", () => {
    expect(site.header.search.viewAll("test")).toContain("«test»");
    expect(site.header.search.noResults("test")).toContain("«test»");
  });
});
```

- [x] **Step 2: Update `tests/unit/order-status.test.ts`** — replace the last `it` block and add enum coverage for labels:

```ts
it("labels known statuses in Ukrainian and falls back to the raw value", () => {
  expect(getOrderStatusLabel("SHIPPED")).toBe("Відправлено");
  expect(getOrderStatusLabel("WEIRD")).toBe("WEIRD");
});

it("defines a label for every OrderStatus value", () => {
  for (const s of Object.values(OrderStatus)) {
    expect(ORDER_STATUS_LABELS[s]).toBeTruthy();
  }
});
```

Extend the import to `import { getOrderStatusStyle, getOrderStatusLabel, ORDER_STATUS_STYLES, ORDER_STATUS_LABELS } from "@/lib/order-status";` (re-export keeps working).

- [x] **Step 3: Run to verify red**

Run: `npm run test:run -- tests/unit/content.test.ts tests/unit/order-status.test.ts`
Expected: FAIL — modules don't exist yet; `getOrderStatusLabel("SHIPPED")` still `"Shipped"`.

- [x] **Step 4: Create `src/content/auth.ts`** (complete file):

```ts
/**
 * Auth surfaces copy (login, register, auth error boundary). Single
 * extraction point for TASK-039 i18n — plain typed strings.
 * Zod field-validation messages live in src/lib/validations (UA there too,
 * G2 shippingAddressSchema precedent).
 */
export const auth = {
  login: {
    title: "Вхід",
    description: "Увійдіть, щоб керувати замовленнями та даними акаунта",
    email: { label: "Email", placeholder: "name@example.com" },
    password: { label: "Пароль", placeholder: "Введіть пароль" },
    submit: "УВІЙТИ",
    submitting: "ВХІД…",
    errors: {
      invalidCredentials: "Невірний email або пароль",
      generic: "Щось пішло не так. Спробуйте ще раз.",
    },
    noAccount: "Немає акаунта?",
    signUpLink: "Зареєструватися",
  },
  register: {
    title: "Реєстрація",
    description: "Заповніть дані, щоб створити акаунт",
    name: { label: "Ім'я", placeholder: "Олександр Коваленко" },
    email: { label: "Email", placeholder: "name@example.com" },
    password: { label: "Пароль", placeholder: "Створіть пароль" },
    confirmPassword: { label: "Підтвердження пароля", placeholder: "Повторіть пароль" },
    submit: "СТВОРИТИ АКАУНТ",
    submitting: "СТВОРЕННЯ АКАУНТА…",
    errors: {
      /** Maps register-API `code`s (see /api/auth/register 409). */
      byCode: {
        EMAIL_EXISTS: "Цей email вже зареєстровано",
      } as Record<string, string>,
      generic: "Щось пішло не так. Спробуйте ще раз.",
    },
    hasAccount: "Вже є акаунт?",
    signInLink: "Увійти",
  },
  error: {
    title: "Помилка автентифікації",
    description:
      "Під час автентифікації сталася помилка. Спробуйте ще раз — якщо проблема повторюється, зверніться до нас.",
    errorId: (digest: string) => `Код помилки: ${digest}`,
    retry: "Спробувати ще раз",
    backToLogin: "До входу",
  },
};
```

- [x] **Step 5: Create `src/content/account.ts`** (complete file):

```ts
import { pluralizeUk } from "@/lib/format";

/**
 * Account area copy (layout nav, overview, orders list/detail) plus the
 * customer-facing OrderStatus / PaymentStatus label maps. Single extraction
 * point for TASK-039 i18n. The status maps live here (not lib/) because they
 * are customer copy; lib/order-status.ts re-exports for style/label lookup.
 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує підтвердження",
  CONFIRMED: "Підтверджено",
  PROCESSING: "Обробляється",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  CANCELLED: "Скасовано",
  REFUNDED: "Повернуто",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує оплати",
  PAID: "Оплачено",
  FAILED: "Не вдалася",
  REFUNDED: "Повернуто",
  PARTIALLY_REFUNDED: "Частково повернуто",
};

export const account = {
  title: "Мій акаунт",
  nav: { overview: "Огляд", orders: "Замовлення" },
  overview: {
    welcome: (name: string) => `З поверненням, ${name}!`,
    nameFallback: "Клієнт",
    description: "Керуйте замовленнями та даними акаунта.",
    ordersCard: {
      title: "Замовлення",
      description: "Перегляд і відстеження ваших замовлень",
      cta: "До замовлень",
    },
    info: { title: "Дані акаунта", name: "Ім'я", email: "Email", notSet: "Не вказано" },
  },
  orders: {
    title: "Історія замовлень",
    filter: { placeholder: "Фільтр за статусом", all: "Всі замовлення" },
    empty: {
      title: "Замовлень поки немає",
      description: "Коли ви оформите замовлення, воно з'явиться тут.",
      cta: "Перейти в каталог",
    },
    card: {
      placed: "Дата замовлення",
      total: "Сума",
      number: "№ замовлення",
      details: "Деталі",
      qty: (n: number) => `К-сть: ${n}`,
      more: (n: number) => `+${n} ${pluralizeUk(n, "інший товар", "інші товари", "інших товарів")}`,
    },
    pagination: {
      prev: "Назад",
      next: "Далі",
      pageOf: (page: number, total: number) => `Сторінка ${page} з ${total}`,
    },
  },
  orderDetail: {
    orderTitle: (num: string) => `Замовлення ${num}`,
    placedOn: (date: string) => `Оформлено ${date}`,
    notFound: "Замовлення не знайдено",
    loadFailed: "Не вдалося завантажити замовлення",
    backToOrders: "До замовлень",
    timeline: {
      title: "Статус замовлення",
      placed: "Замовлення оформлено",
      confirmed: "Замовлення підтверджено",
      processing: "Обробляється",
      shipped: "Відправлено",
      delivered: "Доставлено",
      cancelled: "Скасовано",
      tracking: "Номер відстеження:",
      trackPackage: "Відстежити посилку",
    },
    items: { title: (n: number) => `Товари (${n})`, sku: "Артикул:" },
    summary: {
      title: "Разом",
      subtotal: "Товари",
      shipping: "Доставка",
      discount: "Знижка",
      tax: "Податок",
      total: "До сплати",
    },
    address: { title: "Адреса доставки" },
    payment: {
      title: "Оплата",
      method: "Спосіб",
      status: "Статус",
      paidOn: "Оплачено",
      methodLabel: (method?: string | null) =>
        method === "cod"
          ? "Оплата при отриманні"
          : method === "card"
            ? "Карткою"
            : (method ?? "Карткою"),
    },
    notes: { title: "Коментар до замовлення" },
  },
};
```

- [x] **Step 6: Create `src/content/newsletter.ts`** (complete file):

```ts
/**
 * Newsletter pages + footer-signup copy. The byCode maps translate the
 * machine `code`s the newsletter API returns (API prose stays English —
 * G2 create-order convention). Single extraction point for TASK-039 i18n.
 */
export interface NewsletterOutcomeCopy {
  title: string;
  description: string;
}

export const newsletter = {
  confirm: {
    loading: { title: "Підтверджуємо підписку…", description: "Зачекайте, будь ласка." },
    byCode: {
      CONFIRMED: {
        title: "Підписку підтверджено!",
        description: "Дякуємо! Тепер ви отримуватимете наші новини та пропозиції.",
      },
      ALREADY_CONFIRMED: {
        title: "Підписку вже підтверджено",
        description: "Цей email уже отримує наші листи.",
      },
      LINK_EXPIRED: {
        title: "Посилання застаріло",
        description: "Термін дії посилання минув. Підпишіться ще раз — ми надішлемо новий лист.",
      },
      INVALID_TOKEN: {
        title: "Недійсне посилання",
        description: "Посилання для підтвердження недійсне. Перевірте адресу з листа.",
      },
      TOKEN_REQUIRED: {
        title: "Недійсне посилання",
        description: "У посиланні бракує токена підтвердження.",
      },
    } as Record<string, NewsletterOutcomeCopy>,
    fallback: {
      title: "Щось пішло не так",
      description: "Не вдалося підтвердити підписку. Спробуйте пізніше.",
    },
  },
  unsubscribe: {
    idle: {
      title: "Відписатися від розсилки",
      prompt: (email: string) => `Ви впевнені, що хочете відписати ${email} від нашої розсилки?`,
      confirm: "Так, відписатися",
    },
    processing: { title: "Обробляємо…", description: "Зачекайте, будь ласка." },
    invalidLink: {
      title: "Недійсне посилання",
      description: "Посилання для відписки недійсне або неповне.",
    },
    byCode: {
      UNSUBSCRIBED: {
        title: "Ви відписалися",
        description: "Ми більше не надсилатимемо вам листи.",
      },
      ALREADY_UNSUBSCRIBED: {
        title: "Ви вже відписані",
        description: "Цей email не отримує нашу розсилку.",
      },
      SUBSCRIBER_NOT_FOUND: {
        title: "Недійсне посилання",
        description: "Підписника з таким email не знайдено.",
      },
      INVALID_UNSUBSCRIBE_LINK: {
        title: "Недійсне посилання",
        description: "Посилання для відписки недійсне.",
      },
    } as Record<string, NewsletterOutcomeCopy>,
    fallback: {
      title: "Щось пішло не так",
      description: "Не вдалося обробити відписку. Спробуйте пізніше.",
    },
  },
  signup: {
    byCode: {
      ALREADY_SUBSCRIBED: "Цей email уже підписаний на розсилку",
    } as Record<string, string>,
    fallback: "Не вдалося підписатися",
  },
  actions: {
    continueShopping: "Продовжити покупки",
    goHome: "На головну",
  },
};
```

- [x] **Step 7: Create `src/content/system.ts`** (complete file):

```ts
/**
 * System pages copy (404, root error boundary, cookie consent banner).
 * Single extraction point for TASK-039 i18n — plain typed strings.
 */
export const system = {
  notFound: {
    title: "404",
    description: "Сторінку не знайдено",
    cta: "Повернутися на головну",
  },
  error: {
    title: "Щось пішло не так",
    description: "Сталася неочікувана помилка. Спробуйте ще раз.",
    errorId: (digest: string) => `Код помилки: ${digest}`,
    retry: "Спробувати ще раз",
    home: "На головну",
  },
  cookies: {
    message:
      "Ми використовуємо cookies для аналізу відвідуваності та покращення роботи сайту. Натискаючи «Прийняти», ви погоджуєтесь на аналітичне відстеження.",
    accept: "Прийняти",
    decline: "Відхилити",
  },
};
```

- [x] **Step 8: Add `header` to `src/content/site.ts`** — insert as a new key right after `tagline: BRAND_TAGLINE,`:

```ts
  /** Header chrome strings (G4). Nav item labels stay in Header.tsx's
   *  `navigation` array (pre-existing UA); these are the residuals. */
  header: {
    menu: "Меню",
    toggleMenu: "Відкрити меню",
    categories: "Категорії",
    adminPanel: "Адмін-панель",
    account: "Акаунт",
    orders: "Замовлення",
    signIn: "Увійти",
    signOut: "Вийти",
    createAccount: "Створити акаунт",
    cart: "Кошик",
    search: {
      srOpen: "Пошук (Ctrl+K)",
      dialogTitle: "Пошук товарів",
      placeholder: "Пошук товарів…",
      viewAll: (q: string) => `Всі результати для «${q}»`,
      noResults: (q: string) => `Нічого не знайдено за запитом «${q}»`,
      minChars: "Введіть щонайменше 2 символи для пошуку…",
    },
  },
```

- [x] **Step 9: Move the label map out of `src/lib/order-status.ts`** — replace the whole file with:

```ts
import { ORDER_STATUS_LABELS } from "@/content/account";

/**
 * Single source of truth for OrderStatus presentation.
 * Monochrome by policy; the destructive (red) token is reserved for the
 * negative terminal states CANCELLED and REFUNDED.
 * Labels are customer copy and live in src/content/account.ts (G4);
 * re-exported here so lookup stays one import for consumers.
 */
export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-muted text-foreground",
  PROCESSING: "bg-secondary text-secondary-foreground",
  SHIPPED: "bg-secondary text-secondary-foreground",
  DELIVERED: "bg-foreground text-background",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-destructive/10 text-destructive",
};

export { ORDER_STATUS_LABELS };

export function getOrderStatusStyle(status: string): string {
  return ORDER_STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
}

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
```

- [x] **Step 10: Run to verify green**

Run: `npm run test:run -- tests/unit/content.test.ts tests/unit/order-status.test.ts`
Expected: PASS. Then `npm run typecheck` — expect PASS (nothing consumes the new modules yet; admin pages import only `getOrderStatusStyle`).

- [x] **Step 11: Commit**

```bash
git add src/content tests/unit/content.test.ts tests/unit/order-status.test.ts src/lib/order-status.ts
git commit -m "feat(content): auth/account/newsletter/system modules + site.header; UA order/payment status labels"
```

---

### Task 4: `StatusScreen` shared component

**Files:**

- Create: `src/components/common/StatusScreen.tsx`
- Modify: `src/components/common/index.ts` (add export)
- Test: Create `tests/unit/status-screen.test.tsx`

**Interfaces:**

- Consumes: `Button` (shadcn), `cn`, `next/link`, `lucide-react` types.
- Produces (used by Tasks 5, 6, 7):

```ts
export type StatusTone = "neutral" | "success" | "error";
export type StatusAction =
  | { label: string; href: string; variant?: "default" | "outline" | "destructive" }
  | { label: string; onClick: () => void; variant?: "default" | "outline" | "destructive" };
export function StatusScreen(props: {
  icon?: LucideIcon;
  iconClassName?: string;
  tone?: StatusTone;
  title: string;
  description?: string;
  meta?: string;
  actions?: StatusAction[];
}): JSX.Element;
```

- [x] **Step 1: Write the failing test** — `tests/unit/status-screen.test.tsx` (complete file):

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { XCircle, CheckCircle2 } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";

describe("StatusScreen", () => {
  it("renders title, description and meta", () => {
    render(
      <StatusScreen title="Щось пішло не так" description="Опис помилки" meta="Код помилки: abc" />
    );
    expect(screen.getByRole("heading", { name: "Щось пішло не так" })).toBeInTheDocument();
    expect(screen.getByText("Опис помилки")).toBeInTheDocument();
    expect(screen.getByText("Код помилки: abc")).toBeInTheDocument();
  });

  it("renders href actions as links and onClick actions as buttons", () => {
    const onClick = vi.fn();
    render(
      <StatusScreen
        title="Т"
        actions={[
          { label: "На головну", href: "/" },
          { label: "Спробувати ще раз", onClick },
        ]}
      />
    );
    expect(screen.getByRole("link", { name: "На головну" })).toHaveAttribute("href", "/");
    fireEvent.click(screen.getByRole("button", { name: "Спробувати ще раз" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("maps tone to token classes on the icon", () => {
    const { container: err } = render(<StatusScreen icon={XCircle} tone="error" title="Помилка" />);
    expect(err.querySelector("svg")).toHaveClass("text-destructive");
    const { container: ok } = render(
      <StatusScreen icon={CheckCircle2} tone="success" title="Готово" />
    );
    expect(ok.querySelector("svg")).toHaveClass("text-foreground");
  });

  it("omits icon and actions blocks when not provided", () => {
    const { container } = render(<StatusScreen title="404" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
```

- [x] **Step 2: Run to verify red**

Run: `npm run test:run -- tests/unit/status-screen.test.tsx`
Expected: FAIL — module not found.

- [x] **Step 3: Implement `src/components/common/StatusScreen.tsx`** (complete file — note: NO `"use client"`, no hooks):

```tsx
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "error";

/**
 * Server callers (not-found.tsx) may only pass `href` actions — functions
 * can't cross the server→client boundary. Client callers may pass either.
 */
export type StatusAction =
  | { label: string; href: string; variant?: "default" | "outline" | "destructive" }
  | { label: string; onClick: () => void; variant?: "default" | "outline" | "destructive" };

const TONE_ICON: Record<StatusTone, string> = {
  neutral: "text-muted-foreground",
  success: "text-foreground",
  error: "text-destructive",
};

interface StatusScreenProps {
  icon?: LucideIcon;
  iconClassName?: string;
  tone?: StatusTone;
  title: string;
  description?: string;
  /** Small line under the description, e.g. «Код помилки: …». */
  meta?: string;
  actions?: StatusAction[];
}

/**
 * The one Mirox treatment for full-viewport status pages (404, error
 * boundaries, newsletter confirm/unsubscribe). Hook-free by design so the
 * server-rendered not-found.tsx can use it.
 */
export function StatusScreen({
  icon: Icon,
  iconClassName,
  tone = "neutral",
  title,
  description,
  meta,
  actions = [],
}: StatusScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        {Icon && (
          <Icon className={cn("mx-auto h-12 w-12", TONE_ICON[tone], iconClassName)} aria-hidden />
        )}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
          {meta && <p className="text-muted-foreground text-xs">{meta}</p>}
        </div>
        {actions.length > 0 && (
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {actions.map((action) =>
              "href" in action ? (
                <Button key={action.label} variant={action.variant ?? "default"} asChild>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ) : (
                <Button
                  key={action.label}
                  variant={action.variant ?? "default"}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

Add to `src/components/common/index.ts`: `export { StatusScreen } from "./StatusScreen";` (match the file's existing export style).

- [x] **Step 4: Run to verify green**

Run: `npm run test:run -- tests/unit/status-screen.test.tsx`
Expected: PASS (4).

- [x] **Step 5: Commit**

```bash
git add src/components/common/StatusScreen.tsx src/components/common/index.ts tests/unit/status-screen.test.tsx
git commit -m "feat(common): StatusScreen — shared hook-free status-page treatment"
```

---

### Task 5: System pages — 404, root error boundary, cookie banner (+ home.spec names)

**Files:**

- Modify: `src/app/not-found.tsx`, `src/app/error.tsx`, `src/components/common/CookieConsent.tsx`, `tests/e2e/home.spec.ts`

**Interfaces:**

- Consumes: `StatusScreen`/`StatusAction` (Task 4), `system` (Task 3).
- Produces: nothing downstream.

- [x] **Step 1: Replace `src/app/not-found.tsx`** (complete file — keeps `force-dynamic`, stays a server component, href action only):

```tsx
export const dynamic = "force-dynamic";
import { StatusScreen } from "@/components/common/StatusScreen";
import { system } from "@/content/system";

export default function NotFound() {
  return (
    <StatusScreen
      title={system.notFound.title}
      description={system.notFound.description}
      actions={[{ label: system.notFound.cta, href: "/" }]}
    />
  );
}
```

- [x] **Step 2: Replace `src/app/error.tsx`** (complete file — keeps the `window.location.href` home action: the router may be broken inside a crashed boundary):

```tsx
"use client";

import { useEffect } from "react";
import { XCircle } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { system } from "@/content/system";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <StatusScreen
      icon={XCircle}
      tone="error"
      title={system.error.title}
      description={system.error.description}
      meta={error.digest ? system.error.errorId(error.digest) : undefined}
      actions={[
        { label: system.error.retry, onClick: () => reset() },
        {
          label: system.error.home,
          onClick: () => (window.location.href = "/"),
          variant: "outline",
        },
      ]}
    />
  );
}
```

- [x] **Step 3: Localize `CookieConsent.tsx`** — add `import { system } from "@/content/system";`, then replace the banner block's copy:

- the `<p>` text `We use cookies … analytics tracking.` (including the `&ldquo;Accept&rdquo;` entities) → `{system.cookies.message}`
- `>Decline<` → `>{system.cookies.decline}<`
- `>Accept<` → `>{system.cookies.accept}<`

Zustand store, GTM script block, and `mounted` gate untouched.

- [x] **Step 4: Update `tests/e2e/home.spec.ts`** — both `getByRole("button", { name: "Decline" })` occurrences (lines ~39 and ~48) → `getByRole("button", { name: "Відхилити" })`.

- [x] **Step 5: Verify**

Run: `npm run typecheck && npm run test:run -- tests/unit/no-bright-colors.test.ts tests/unit/home-page.test.tsx`
Expected: PASS. (Full e2e runs in Task 13/CI.)

- [x] **Step 6: Commit**

```bash
git add src/app/not-found.tsx src/app/error.tsx src/components/common/CookieConsent.tsx tests/e2e/home.spec.ts
git commit -m "feat(system): 404 + root error via StatusScreen; Ukrainian cookie banner"
```

---

### Task 6: Newsletter pages + footer signup mapping

**Files:**

- Modify: `src/app/newsletter/confirm/page.tsx`, `src/app/newsletter/unsubscribe/page.tsx`, `src/components/common/NewsletterSignup.tsx`
- Test: Create `tests/unit/newsletter-status-pages.test.tsx`

**Interfaces:**

- Consumes: `StatusScreen` (Task 4), `newsletter`/`NewsletterOutcomeCopy` (Task 3), API codes (Task 2).
- Produces: nothing downstream.

- [x] **Step 1: Write the failing RTL tests** — `tests/unit/newsletter-status-pages.test.tsx` (complete file):

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const searchParamsGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: searchParamsGet }),
}));

import NewsletterConfirmPage from "@/app/newsletter/confirm/page";
import NewsletterUnsubscribePage from "@/app/newsletter/unsubscribe/page";

function stubFetch(response: { ok: boolean; body: Record<string, unknown> }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: response.ok, json: async () => response.body })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("newsletter confirm page", () => {
  it("shows the success copy for CONFIRMED", async () => {
    searchParamsGet.mockReturnValue("tok-1");
    stubFetch({ ok: true, body: { code: "CONFIRMED", message: "en text" } });
    render(<NewsletterConfirmPage />);
    expect(await screen.findByText("Підписку підтверджено!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Продовжити покупки" })).toHaveAttribute("href", "/");
  });

  it("distinguishes ALREADY_CONFIRMED from CONFIRMED", async () => {
    searchParamsGet.mockReturnValue("tok-1");
    stubFetch({ ok: true, body: { code: "ALREADY_CONFIRMED" } });
    render(<NewsletterConfirmPage />);
    expect(await screen.findByText("Підписку вже підтверджено")).toBeInTheDocument();
  });

  it("shows the expired copy for LINK_EXPIRED", async () => {
    searchParamsGet.mockReturnValue("tok-1");
    stubFetch({ ok: false, body: { code: "LINK_EXPIRED", error: "en text" } });
    render(<NewsletterConfirmPage />);
    expect(await screen.findByText("Посилання застаріло")).toBeInTheDocument();
  });

  it("falls back to generic Ukrainian copy on an unknown code", async () => {
    searchParamsGet.mockReturnValue("tok-1");
    stubFetch({ ok: false, body: { code: "SOMETHING_NEW" } });
    render(<NewsletterConfirmPage />);
    expect(await screen.findByText("Щось пішло не так")).toBeInTheDocument();
  });

  it("shows invalid-link copy without fetching when token is missing", () => {
    searchParamsGet.mockReturnValue(null);
    stubFetch({ ok: true, body: {} });
    render(<NewsletterConfirmPage />);
    expect(screen.getByText("Недійсне посилання")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("newsletter unsubscribe page", () => {
  it("prompts with the email, then shows success after confirming", async () => {
    searchParamsGet.mockImplementation((key: string) =>
      key === "email" ? "a@b.ua" : "valid-token"
    );
    stubFetch({ ok: true, body: { code: "UNSUBSCRIBED", message: "en" } });
    render(<NewsletterUnsubscribePage />);
    expect(screen.getByText(/a@b\.ua/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Так, відписатися" }));
    await waitFor(() => expect(screen.getByText("Ви відписалися")).toBeInTheDocument());
  });

  it("shows invalid-link copy when params are missing", () => {
    searchParamsGet.mockReturnValue(null);
    render(<NewsletterUnsubscribePage />);
    expect(screen.getByText("Недійсне посилання")).toBeInTheDocument();
  });

  it("maps error codes through the content layer", async () => {
    searchParamsGet.mockImplementation((key: string) => (key === "email" ? "a@b.ua" : "bad-token"));
    stubFetch({ ok: false, body: { code: "INVALID_UNSUBSCRIBE_LINK", error: "en" } });
    render(<NewsletterUnsubscribePage />);
    fireEvent.click(screen.getByRole("button", { name: "Так, відписатися" }));
    await waitFor(() => expect(screen.getByText("Недійсне посилання")).toBeInTheDocument());
  });
});
```

- [x] **Step 2: Run to verify red**

Run: `npm run test:run -- tests/unit/newsletter-status-pages.test.tsx`
Expected: FAIL — pages still render the old EN strings.

- [x] **Step 3: Replace `src/app/newsletter/confirm/page.tsx`** (complete file):

```tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { newsletter, type NewsletterOutcomeCopy } from "@/content/newsletter";

type ConfirmState =
  | { status: "loading" }
  | { status: "success"; copy: NewsletterOutcomeCopy }
  | { status: "error"; copy: NewsletterOutcomeCopy };

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? null;

  const [state, setState] = useState<ConfirmState>(
    token
      ? { status: "loading" }
      : { status: "error", copy: newsletter.confirm.byCode.TOKEN_REQUIRED }
  );

  useEffect(() => {
    if (!token) return;

    async function confirmSubscription() {
      try {
        const response = await fetch(`/api/newsletter/confirm?token=${token}`);
        const data = await response.json().catch(() => ({}));
        // API prose is EN log text; `code` drives the Ukrainian copy.
        const copy =
          (data.code && newsletter.confirm.byCode[data.code]) ||
          (response.ok ? newsletter.confirm.byCode.CONFIRMED : newsletter.confirm.fallback);
        setState({ status: response.ok ? "success" : "error", copy });
      } catch {
        setState({ status: "error", copy: newsletter.confirm.fallback });
      }
    }

    confirmSubscription();
  }, [token]);

  if (state.status === "loading") {
    return (
      <StatusScreen
        icon={Loader2}
        iconClassName="animate-spin"
        title={newsletter.confirm.loading.title}
        description={newsletter.confirm.loading.description}
      />
    );
  }

  if (state.status === "success") {
    return (
      <StatusScreen
        icon={CheckCircle2}
        tone="success"
        title={state.copy.title}
        description={state.copy.description}
        actions={[{ label: newsletter.actions.continueShopping, href: "/" }]}
      />
    );
  }

  return (
    <StatusScreen
      icon={XCircle}
      tone="error"
      title={state.copy.title}
      description={state.copy.description}
      actions={[{ label: newsletter.actions.goHome, href: "/", variant: "outline" }]}
    />
  );
}

export default function NewsletterConfirmPage() {
  return (
    <Suspense
      fallback={
        <StatusScreen
          icon={Loader2}
          iconClassName="animate-spin"
          title={newsletter.confirm.loading.title}
        />
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
```

- [x] **Step 4: Replace `src/app/newsletter/unsubscribe/page.tsx`** (complete file):

```tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { newsletter, type NewsletterOutcomeCopy } from "@/content/newsletter";

type UnsubscribeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; copy: NewsletterOutcomeCopy }
  | { status: "error"; copy: NewsletterOutcomeCopy };

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") ?? null;
  const token = searchParams?.get("token") ?? null;

  const [state, setState] = useState<UnsubscribeState>({ status: "idle" });

  async function handleUnsubscribe() {
    if (!email || !token) {
      setState({ status: "error", copy: newsletter.unsubscribe.invalidLink });
      return;
    }

    setState({ status: "loading" });
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json().catch(() => ({}));
      // API prose is EN log text; `code` drives the Ukrainian copy.
      const copy =
        (data.code && newsletter.unsubscribe.byCode[data.code]) ||
        (response.ok
          ? newsletter.unsubscribe.byCode.UNSUBSCRIBED
          : newsletter.unsubscribe.fallback);
      setState({ status: response.ok ? "success" : "error", copy });
    } catch {
      setState({ status: "error", copy: newsletter.unsubscribe.fallback });
    }
  }

  if (!email || !token) {
    return (
      <StatusScreen
        icon={XCircle}
        tone="error"
        title={newsletter.unsubscribe.invalidLink.title}
        description={newsletter.unsubscribe.invalidLink.description}
        actions={[{ label: newsletter.actions.goHome, href: "/", variant: "outline" }]}
      />
    );
  }

  if (state.status === "idle") {
    return (
      <StatusScreen
        icon={Mail}
        title={newsletter.unsubscribe.idle.title}
        description={newsletter.unsubscribe.idle.prompt(email)}
        actions={[
          {
            label: newsletter.unsubscribe.idle.confirm,
            onClick: handleUnsubscribe,
            variant: "destructive",
          },
        ]}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <StatusScreen
        icon={Loader2}
        iconClassName="animate-spin"
        title={newsletter.unsubscribe.processing.title}
        description={newsletter.unsubscribe.processing.description}
      />
    );
  }

  const icon = state.status === "success" ? CheckCircle2 : XCircle;
  return (
    <StatusScreen
      icon={icon}
      tone={state.status}
      title={state.copy.title}
      description={state.copy.description}
      actions={[{ label: newsletter.actions.goHome, href: "/", variant: "outline" }]}
    />
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <Suspense
      fallback={
        <StatusScreen
          icon={Loader2}
          iconClassName="animate-spin"
          title={newsletter.unsubscribe.processing.title}
        />
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
```

- [x] **Step 5: Map codes in `NewsletterSignup.tsx`** — add `import { newsletter } from "@/content/newsletter";` and replace the response-handling block inside `handleSubmit`:

```ts
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // data.error is EN API/log text — map the machine code instead.
        toast.error((data.code && newsletter.signup.byCode[data.code]) || newsletter.signup.fallback);
        return;
      }

      setIsSuccess(true);
      setEmail("");
      toast.success("Перевірте пошту, щоб підтвердити підписку");
    } catch {
      toast.error(newsletter.signup.fallback);
    } finally {
```

(The `throw new Error(data.error || …)` line and the `error instanceof Error` toast disappear; the catch becomes bare.)

- [x] **Step 6: Run to verify green**

Run: `npm run test:run -- tests/unit/newsletter-status-pages.test.tsx tests/unit/footer.test.tsx tests/unit/no-bright-colors.test.ts`
Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add src/app/newsletter src/components/common/NewsletterSignup.tsx tests/unit/newsletter-status-pages.test.tsx
git commit -m "feat(newsletter): pages via StatusScreen with code-mapped Ukrainian copy; signup toast maps codes"
```

---

### Task 7: Auth — Zod UA messages, login/register forms, auth error boundary, register EMAIL_EXISTS

**Files:**

- Modify: `src/lib/validations/index.ts:4-19`, `src/app/(auth)/login/login-form.tsx`, `src/app/(auth)/register/register-form.tsx`, `src/app/(auth)/error.tsx`, `src/app/api/auth/register/route.ts`
- Test: Create `tests/unit/auth-register-api.test.ts`

**Interfaces:**

- Consumes: `auth` (Task 3), `StatusScreen` (Task 4).
- Produces: register 409 body `{ error: "Email already registered", code: "EMAIL_EXISTS" }`.

- [x] **Step 1: Write the failing register-API test** — `tests/unit/auth-register-api.test.ts` (complete file):

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest } from "../helpers/api-test-utils";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed-password") },
}));

import { prisma } from "@/lib/db";
import { POST } from "@/app/api/auth/register/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  it("returns 409 with EMAIL_EXISTS code for a duplicate email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as never);

    const req = createNextRequest({
      url: "/api/auth/register",
      method: "POST",
      body: {
        name: "Тест",
        email: "dup@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("EMAIL_EXISTS");
  });

  it("creates the user and returns 201 for a new email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "u2",
      name: "Тест",
      email: "new@example.com",
      role: "CUSTOMER",
      createdAt: new Date(),
    } as never);

    const req = createNextRequest({
      url: "/api/auth/register",
      method: "POST",
      body: {
        name: "Тест",
        email: "new@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });
});
```

- [x] **Step 2: Run to verify red**

Run: `npm run test:run -- tests/unit/auth-register-api.test.ts`
Expected: FAIL — `body.code` undefined on the 409.

- [x] **Step 3: Add the code in `src/app/api/auth/register/route.ts`**:

```ts
if (existingUser) {
  // Client maps `code` to Ukrainian (src/content/auth.ts); `error` stays log text.
  return NextResponse.json(
    { error: "Email already registered", code: "EMAIL_EXISTS" },
    { status: 409 }
  );
}
```

- [x] **Step 4: Translate the auth Zod messages** in `src/lib/validations/index.ts` (these serve the client-side RHF resolvers directly — G2 `shippingAddressSchema` precedent; newsletter schemas stay EN because only the API consumes them and codes drive that UI):

```ts
export const loginSchema = z.object({
  email: z.string().email("Введіть коректний email"),
  password: z.string().min(8, "Пароль має містити щонайменше 8 символів"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Ім'я має містити щонайменше 2 символи"),
    email: z.string().email("Введіть коректний email"),
    password: z.string().min(8, "Пароль має містити щонайменше 8 символів"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не збігаються",
    path: ["confirmPassword"],
  });
```

- [x] **Step 5: Convert `login-form.tsx`.** Keep the whole structure (Suspense/skeleton/Card); replace only strings and error-setting. Add `import { auth } from "@/content/auth";`. Replacements in **both** `LoginFormInner` and `LoginFormSkeleton`:

| Old                                                                                                | New                                                             |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `setError("Invalid email or password")`                                                            | `setError(auth.login.errors.invalidCredentials)`                |
| `setError("Something went wrong. Please try again.")`                                              | `setError(auth.login.errors.generic)`                           |
| `<CardTitle …>Sign in</CardTitle>` (×2: inner + skeleton)                                          | `<CardTitle …>{auth.login.title}</CardTitle>`                   |
| `<CardDescription>Enter your email and password to sign in to your account</CardDescription>` (×2) | `<CardDescription>{auth.login.description}</CardDescription>`   |
| `<Label htmlFor="email">Email</Label>`                                                             | `<Label htmlFor="email">{auth.login.email.label}</Label>`       |
| email `placeholder="name@example.com"`                                                             | `placeholder={auth.login.email.placeholder}`                    |
| `<Label htmlFor="password">Password</Label>`                                                       | `<Label htmlFor="password">{auth.login.password.label}</Label>` |
| password `placeholder="Enter your password"`                                                       | `placeholder={auth.login.password.placeholder}`                 |
| `{isLoading ? "Signing in..." : "Sign in"}`                                                        | `{isLoading ? auth.login.submitting : auth.login.submit}`       |
| `Don&apos;t have an account?{" "}`                                                                 | `{auth.login.noAccount}{" "}`                                   |
| `>Sign up</Link>`                                                                                  | `>{auth.login.signUpLink}</Link>`                               |

- [x] **Step 6: Convert `register-form.tsx`.** Add `import { auth } from "@/content/auth";`. Replacements:

| Old                                                                            | New                                                                                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `setError(result.error \|\| "Registration failed")`                            | `setError((result.code && auth.register.errors.byCode[result.code]) \|\| auth.register.errors.generic)` |
| `setError("Something went wrong. Please try again.")`                          | `setError(auth.register.errors.generic)`                                                                |
| `>Create an account</CardTitle>`                                               | `>{auth.register.title}</CardTitle>`                                                                    |
| `<CardDescription>Enter your details to create your account</CardDescription>` | `<CardDescription>{auth.register.description}</CardDescription>`                                        |
| `<Label htmlFor="name">Name</Label>`                                           | `<Label htmlFor="name">{auth.register.name.label}</Label>`                                              |
| name `placeholder="John Doe"`                                                  | `placeholder={auth.register.name.placeholder}`                                                          |
| `<Label htmlFor="email">Email</Label>`                                         | `<Label htmlFor="email">{auth.register.email.label}</Label>`                                            |
| email `placeholder="name@example.com"`                                         | `placeholder={auth.register.email.placeholder}`                                                         |
| `<Label htmlFor="password">Password</Label>`                                   | `<Label htmlFor="password">{auth.register.password.label}</Label>`                                      |
| password `placeholder="Create a password"`                                     | `placeholder={auth.register.password.placeholder}`                                                      |
| `<Label htmlFor="confirmPassword">Confirm Password</Label>`                    | `<Label htmlFor="confirmPassword">{auth.register.confirmPassword.label}</Label>`                        |
| confirm `placeholder="Confirm your password"`                                  | `placeholder={auth.register.confirmPassword.placeholder}`                                               |
| `{isLoading ? "Creating account..." : "Create account"}`                       | `{isLoading ? auth.register.submitting : auth.register.submit}`                                         |
| `Already have an account?{" "}`                                                | `{auth.register.hasAccount}{" "}`                                                                       |
| `>Sign in</Link>`                                                              | `>{auth.register.signInLink}</Link>`                                                                    |

- [x] **Step 7: Replace `src/app/(auth)/error.tsx`** (complete file):

```tsx
"use client";

import { useEffect } from "react";
import { XCircle } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { auth } from "@/content/auth";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Auth Error]", error);
  }, [error]);

  return (
    <StatusScreen
      icon={XCircle}
      tone="error"
      title={auth.error.title}
      description={auth.error.description}
      meta={error.digest ? auth.error.errorId(error.digest) : undefined}
      actions={[
        { label: auth.error.retry, onClick: () => reset() },
        { label: auth.error.backToLogin, href: "/login", variant: "outline" },
      ]}
    />
  );
}
```

- [x] **Step 8: Verify green**

Run: `npm run test:run -- tests/unit/auth-register-api.test.ts tests/unit/checkout-schema.test.ts && npm run typecheck`
Expected: PASS (checkout-schema guards that the shared validations file edit broke nothing).
Also run: `grep -rn "at least 8\|Invalid email address" tests/ src/` — review hits: the two changed auth messages must have no remaining consumer asserting them; the newsletter schemas legitimately keep `"Invalid email address"`.

- [x] **Step 9: Commit**

```bash
git add src/lib/validations/index.ts "src/app/(auth)" src/app/api/auth/register/route.ts tests/unit/auth-register-api.test.ts
git commit -m "feat(auth): Ukrainian login/register/error surfaces; UA zod messages; EMAIL_EXISTS code"
```

---

### Task 8: Account layout + overview (dead links removed)

**Files:**

- Modify: `src/app/(shop)/account/layout.tsx`, `src/app/(shop)/account/page.tsx`

**Interfaces:**

- Consumes: `account` (Task 3).
- Produces: nothing downstream.

- [x] **Step 1: Layout** — replace the nav array + title in `layout.tsx`; drop the now-unused `MapPin`/`Settings` imports:

```tsx
import { User, Package } from "lucide-react";
import { account } from "@/content/account";

const accountNav = [
  { href: "/account", label: account.nav.overview, icon: User },
  { href: "/account/orders", label: account.nav.orders, icon: Package },
  // «Адреси» and «Налаштування» are deliberately absent: /account/addresses
  // and /account/settings don't exist yet (404 today). Restore when the pages
  // are built — BACKLOG [2026-08-08] From: G4 brainstorm (Footer shopLinks
  // precedent for omitting links to unbuilt pages).
];
```

and `<h1 className="mb-8 text-2xl font-bold">My Account</h1>` → `…>{account.title}</h1>`.

- [x] **Step 2: Overview page** — in `page.tsx`: add `import { account } from "@/content/account";`; delete the entire Addresses and Settings `<Card>` blocks (and the `MapPin`, `Settings` imports); keep the Orders card in the same grid. String replacements:

| Old                                                    | New                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `Welcome back, {session?.user?.name \|\| "Customer"}!` | `{account.overview.welcome(session?.user?.name \|\| account.overview.nameFallback)}` |
| `Manage your orders, addresses, and account settings.` | `{account.overview.description}`                                                     |
| Orders card `<CardTitle …>Orders</CardTitle>`          | `{account.overview.ordersCard.title}`                                                |
| `View and track your orders`                           | `{account.overview.ordersCard.description}`                                          |
| `View Orders`                                          | `{account.overview.ordersCard.cta}`                                                  |
| `<CardTitle …>Account Information</CardTitle>`         | `{account.overview.info.title}`                                                      |
| `>Name</p>`                                            | `>{account.overview.info.name}</p>`                                                  |
| `>Email</p>`                                           | `>{account.overview.info.email}</p>`                                                 |
| `{session?.user?.name \|\| "Not set"}`                 | `{session?.user?.name \|\| account.overview.info.notSet}`                            |

- [x] **Step 3: Verify** — `npm run typecheck && npm run lint` → PASS (unused imports would fail lint).

- [x] **Step 4: Commit**

```bash
git add "src/app/(shop)/account/layout.tsx" "src/app/(shop)/account/page.tsx"
git commit -m "feat(account): Ukrainian layout + overview; drop links to unbuilt addresses/settings pages"
```

---

### Task 9: Account orders list

**Files:**

- Modify: `src/app/(shop)/account/orders/page.tsx`

**Interfaces:**

- Consumes: `account` (Task 3), `getOrderStatusLabel` (UA since Task 3).
- Produces: nothing downstream.

- [x] **Step 1: Convert strings.** Add `import { account } from "@/content/account";`. Replace the status `SelectContent` with label-map-driven items (keeps today's 6-status set — REFUNDED intentionally still absent, matching current behavior):

```tsx
const ORDER_FILTER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
```

(module scope), then:

```tsx
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={account.orders.filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{account.orders.filter.all}</SelectItem>
            {ORDER_FILTER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {getOrderStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
```

Remaining replacements:

| Old                                                 | New                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `toLocaleDateString("en-US", {`                     | `toLocaleDateString("uk-UA", {`                                              |
| `Order History` (×3: content + 2 loading headers)   | `{account.orders.title}`                                                     |
| `No orders yet`                                     | `{account.orders.empty.title}`                                               |
| `When you place an order, it will appear here.`     | `{account.orders.empty.description}`                                         |
| `>Start Shopping</Link>`                            | `>{account.orders.empty.cta}</Link>`                                         |
| `>Order placed</p>`                                 | `>{account.orders.card.placed}</p>`                                          |
| `>Total</p>`                                        | `>{account.orders.card.total}</p>`                                           |
| `>Order #</p>`                                      | `>{account.orders.card.number}</p>`                                          |
| `View Details`                                      | `{account.orders.card.details}`                                              |
| `Qty: {item.quantity}`                              | `{account.orders.card.qty(item.quantity)}`                                   |
| `+{order.items.length - 4} more items`              | `{account.orders.card.more(order.items.length - 4)}`                         |
| `Previous`                                          | `{account.orders.pagination.prev}`                                           |
| `Page {pagination.page} of {pagination.totalPages}` | `{account.orders.pagination.pageOf(pagination.page, pagination.totalPages)}` |
| `Next`                                              | `{account.orders.pagination.next}`                                           |

- [x] **Step 2: Verify** — `npm run typecheck` → PASS.

- [x] **Step 3: Commit**

```bash
git add "src/app/(shop)/account/orders/page.tsx"
git commit -m "feat(account): Ukrainian orders list with label-map status filter and uk-UA dates"
```

---

### Task 10: Account order detail (G3-unblocked)

**Files:**

- Modify: `src/app/(shop)/account/orders/[id]/page.tsx`
- Test: `tests/unit/dynamic-route-params.test.tsx:62` (one assertion)

**Interfaces:**

- Consumes: `account`, `PAYMENT_STATUS_LABELS` (Task 3).
- Produces: nothing downstream.

- [x] **Step 1: Update the regression assertion first (red).** In `tests/unit/dynamic-route-params.test.tsx` line 62: `findByText("Order not found")` → `findByText("Замовлення не знайдено")`. (Deviation from spec §5 "no change expected" — the test asserts the account page's error string; recorded here, propagate at completion. The three admin assertions stay EN.)

Run: `npm run test:run -- tests/unit/dynamic-route-params.test.tsx` → the `/account/orders/[id]` test FAILS (page still EN).

- [x] **Step 2: Convert the page.** Keep `useParams<{ id: string }>()!` and the `!` comment untouched. Add `import { account, PAYMENT_STATUS_LABELS } from "@/content/account";`. Replace the timeline constants:

```tsx
const ORDER_TIMELINE = [
  { status: "PENDING", label: account.orderDetail.timeline.placed, icon: Clock },
  { status: "CONFIRMED", label: account.orderDetail.timeline.confirmed, icon: CheckCircle2 },
  { status: "PROCESSING", label: account.orderDetail.timeline.processing, icon: Package },
  { status: "SHIPPED", label: account.orderDetail.timeline.shipped, icon: Truck },
  { status: "DELIVERED", label: account.orderDetail.timeline.delivered, icon: CheckCircle2 },
];

const CANCELLED_TIMELINE = [
  { status: "PENDING", label: account.orderDetail.timeline.placed, icon: Clock },
  { status: "CANCELLED", label: account.orderDetail.timeline.cancelled, icon: XCircle },
];
```

Remaining replacements:

| Old                                                                     | New                                                                           |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `setError("Order not found")`                                           | `setError(account.orderDetail.notFound)`                                      |
| `setError("Failed to load order")` (×2)                                 | `setError(account.orderDetail.loadFailed)`                                    |
| `toLocaleDateString("en-US", {`                                         | `toLocaleDateString("uk-UA", {`                                               |
| `{error \|\| "Order not found"}`                                        | `{error \|\| account.orderDetail.notFound}`                                   |
| `Back to Orders`                                                        | `{account.orderDetail.backToOrders}`                                          |
| `Order {order.orderNumber}`                                             | `{account.orderDetail.orderTitle(order.orderNumber)}`                         |
| `Placed on {formatDate(order.createdAt)}`                               | `{account.orderDetail.placedOn(formatDate(order.createdAt))}`                 |
| `>Order Status</CardTitle>`                                             | `>{account.orderDetail.timeline.title}</CardTitle>`                           |
| `Tracking: {order.trackingNumber}`                                      | `{account.orderDetail.timeline.tracking} {order.trackingNumber}`              |
| `Track Package`                                                         | `{account.orderDetail.timeline.trackPackage}`                                 |
| `Items ({order.items.length})`                                          | `{account.orderDetail.items.title(order.items.length)}`                       |
| `SKU: {item.productSku}`                                                | `{account.orderDetail.items.sku} {item.productSku}`                           |
| `>Order Summary</CardTitle>`                                            | `>{account.orderDetail.summary.title}</CardTitle>`                            |
| `>Subtotal</span>`                                                      | `>{account.orderDetail.summary.subtotal}</span>`                              |
| `>Shipping</span>`                                                      | `>{account.orderDetail.summary.shipping}</span>`                              |
| `>Discount</span>`                                                      | `>{account.orderDetail.summary.discount}</span>`                              |
| `>Tax</span>`                                                           | `>{account.orderDetail.summary.tax}</span>`                                   |
| `<span>Total</span>`                                                    | `<span>{account.orderDetail.summary.total}</span>`                            |
| `Shipping Address` (CardTitle)                                          | `{account.orderDetail.address.title}`                                         |
| `Payment` (CardTitle)                                                   | `{account.orderDetail.payment.title}`                                         |
| `>Method</span>`                                                        | `>{account.orderDetail.payment.method}</span>`                                |
| `<span className="capitalize">{order.paymentMethod \|\| "Card"}</span>` | `<span>{account.orderDetail.payment.methodLabel(order.paymentMethod)}</span>` |
| `>Status</span>`                                                        | `>{account.orderDetail.payment.status}</span>`                                |
| `{order.paymentStatus}` (Badge child)                                   | `{PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}`         |
| `>Paid on</span>`                                                       | `>{account.orderDetail.payment.paidOn}</span>`                                |
| `>Order Notes</CardTitle>`                                              | `>{account.orderDetail.notes.title}</CardTitle>`                              |

- [x] **Step 3: Verify green**

Run: `npm run test:run -- tests/unit/dynamic-route-params.test.tsx && npm run typecheck`
Expected: PASS — all four regression tests green again.

- [x] **Step 4: Commit**

```bash
git add "src/app/(shop)/account/orders/[id]/page.tsx" tests/unit/dynamic-route-params.test.tsx
git commit -m "feat(account): Ukrainian order detail — timeline, payment labels, uk-UA dates"
```

---

### Task 11: Categories chrome (inline strings — catalog-domain convention)

**Files:**

- Modify: `src/app/(shop)/categories/page.tsx`, `src/app/(shop)/categories/[slug]/category-client.tsx`

**Interfaces:**

- Consumes: `pluralizeUk` from `@/lib/format` (both files import it).
- Produces: nothing downstream.

- [x] **Step 1: `/categories` page.** Add `import { pluralizeUk } from "@/lib/format";`. Replacements:

| Old                                                              | New                                                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `>Categories</h1>`                                               | `>Категорії</h1>`                                                            |
| `Browse our products by category`                                | `Перегляньте наші товари за категоріями`                                     |
| `No categories yet`                                              | `Категорій поки немає`                                                       |
| `Check back later for our product categories.`                   | `Незабаром тут з'являться категорії товарів.`                                |
| `{totalProducts} {totalProducts === 1 ? "product" : "products"}` | `{totalProducts} {pluralizeUk(totalProducts, "товар", "товари", "товарів")}` |
| `+{category.children.length - 4} more`                           | `ще {category.children.length - 4}`                                          |

- [x] **Step 2: `category-client.tsx`.** Add `import { pluralizeUk } from "@/lib/format";`. Replacements (sort options translated **in place** — the 4-option unification with /products is BACKLOG'd, not done here):

| Old                                                                            | New                                                                                |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `>Home</Link>` (breadcrumb)                                                    | `>Головна</Link>`                                                                  |
| `>Categories</Link>` (breadcrumb)                                              | `>Категорії</Link>`                                                                |
| `{pagination.total} {pagination.total === 1 ? "product" : "products"}`         | `{pagination.total} {pluralizeUk(pagination.total, "товар", "товари", "товарів")}` |
| `>All</Button>` (subcategory chip)                                             | `>Всі</Button>`                                                                    |
| `Filters` (mobile button text node)                                            | `Фільтри`                                                                          |
| `<SheetTitle>Filters</SheetTitle>`                                             | `<SheetTitle>Фільтри</SheetTitle>`                                                 |
| `<Label>Price Range</Label>`                                                   | `<Label>Ціна</Label>`                                                              |
| `Apply Price Filter`                                                           | `Застосувати`                                                                      |
| `Clear All Filters`                                                            | `Скинути фільтри`                                                                  |
| `Price: {formatPrice(appliedPriceRange[0])} - {…[1])}`                         | `Ціна: {formatPrice(appliedPriceRange[0])} – {…[1])}`                              |
| `placeholder="Sort by"`                                                        | `placeholder="Сортування"`                                                         |
| `>Newest</SelectItem>`                                                         | `>Новинки</SelectItem>`                                                            |
| `>Oldest</SelectItem>`                                                         | `>Найстаріші</SelectItem>`                                                         |
| `>Price: Low to High</SelectItem>`                                             | `>Ціна: за зростанням</SelectItem>`                                                |
| `>Price: High to Low</SelectItem>`                                             | `>Ціна: за спаданням</SelectItem>`                                                 |
| `>Name: A to Z</SelectItem>`                                                   | `>Назва: А–Я</SelectItem>`                                                         |
| `>Name: Z to A</SelectItem>`                                                   | `>Назва: Я–А</SelectItem>`                                                         |
| `No products found`                                                            | `Товарів не знайдено`                                                              |
| `Try adjusting your filters or check back later.`                              | `Спробуйте змінити фільтри або поверніться пізніше.`                               |
| `Clear Filters` (empty-state button)                                           | `Скинути фільтри`                                                                  |
| `Previous`                                                                     | `Назад`                                                                            |
| `Page {pagination.page} of {pagination.totalPages}`                            | `Сторінка {pagination.page} з {pagination.totalPages}`                             |
| `Next`                                                                         | `Далі`                                                                             |
| `Category not found`                                                           | `Категорію не знайдено`                                                            |
| `The category you&apos;re looking for doesn&apos;t exist or has been removed.` | `Такої категорії не існує або її було видалено.`                                   |
| `Back to Categories`                                                           | `До категорій`                                                                     |

- [x] **Step 3: Verify** — `npm run typecheck && npm run test:run -- tests/unit/no-bright-colors.test.ts` → PASS.

- [x] **Step 4: Commit**

```bash
git add "src/app/(shop)/categories"
git commit -m "feat(categories): Ukrainian chrome — headers, counts, filters, in-place sort labels"
```

---

### Task 12: Header residuals (+ navigation.spec names)

**Files:**

- Modify: `src/components/common/Header.tsx`, `tests/e2e/navigation.spec.ts`

**Interfaces:**

- Consumes: `site.header` (Task 3).
- Produces: nothing downstream.

- [x] **Step 1: Consume `site.header`.** Add `import { site } from "@/content/site";`. Replacements:

| Old                                                    | New                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `<span className="sr-only">Toggle menu</span>`         | `<span className="sr-only">{site.header.toggleMenu}</span>`    |
| `<SheetTitle>Menu</SheetTitle>`                        | `<SheetTitle>{site.header.menu}</SheetTitle>`                  |
| `>Categories</Link>` (mobile nav)                      | `>{site.header.categories}</Link>`                             |
| `Admin Panel` (×3: mobile nav, desktop nav, dropdown)  | `{site.header.adminPanel}`                                     |
| `Account` (mobile link + dropdown item)                | `{site.header.account}`                                        |
| `Orders` (mobile link + dropdown item)                 | `{site.header.orders}`                                         |
| `Sign out` (mobile button + dropdown item)             | `{site.header.signOut}`                                        |
| `<Button className="w-full">Sign in</Button>` (mobile) | `<Button className="w-full">{site.header.signIn}</Button>`     |
| `Create account` (mobile outline button)               | `{site.header.createAccount}`                                  |
| `<span className="sr-only">Search (Ctrl+K)</span>`     | `<span className="sr-only">{site.header.search.srOpen}</span>` |
| `<DialogTitle>Search Products</DialogTitle>`           | `<DialogTitle>{site.header.search.dialogTitle}</DialogTitle>`  |
| `placeholder="Search products..."`                     | `placeholder={site.header.search.placeholder}`                 |
| `View all results for &quot;{searchQuery}&quot;`       | `{site.header.search.viewAll(searchQuery)}`                    |
| `No products found for &quot;{searchQuery}&quot;`      | `{site.header.search.noResults(searchQuery)}`                  |
| `Type at least 2 characters to search...`              | `{site.header.search.minChars}`                                |
| `>Sign in</Button>` (desktop ghost)                    | `>{site.header.signIn}</Button>`                               |
| `<span className="sr-only">Кошик</span>`               | `<span className="sr-only">{site.header.cart}</span>`          |

(The `aria-label="Пошук"` and the `navigation` array are already Ukrainian — untouched.)

- [x] **Step 2: Update `tests/e2e/navigation.spec.ts`** — all three `name: "Categories"` assertions (lines ~47, ~95, ~128) → `name: "Категорії"`. Adjust the adjacent comments where they name the link.

- [x] **Step 3: Verify** — `npm run test:run -- tests/unit/header.test.tsx && npm run typecheck` → PASS (that test asserts only Каталог/Новинки/Бестселери/Пошук, all unchanged).

- [x] **Step 4: Commit**

```bash
git add src/components/common/Header.tsx tests/e2e/navigation.spec.ts
git commit -m "feat(header): Ukrainian residuals — menu, search dialog, auth entries, sr-only labels"
```

---

### Task 13: Full-suite verification + EN-residual sweep

**Files:**

- Modify: whatever the sweep finds (expect: nothing or small stragglers).

- [x] **Step 1: EN literal sweep** over every touched surface — review each hit by eye (identifiers/props don't count, rendered text does):

```bash
grep -rnE '>[^<>{}]*[A-Za-z]{3,}[^<>{}]*<' \
  "src/app/(auth)" "src/app/(shop)/account" src/app/newsletter \
  "src/app/(shop)/categories" src/app/error.tsx src/app/not-found.tsx \
  src/components/common/Header.tsx src/components/common/CookieConsent.tsx \
  src/components/common/StatusScreen.tsx | grep -vE "className|xmlns|svg|Image|Link href"
```

Also `grep -rn '"en-US"' "src/app/(shop)/account"` → expect zero. Fix any real residual, matching the owning content module.

- [x] **Step 2: Full unit suite** — `npm run test:run` → all pass (expect roughly 636 → 655–665; record the exact number in the progress log).
- [x] **Step 3: Static checks** — `npm run lint && npm run typecheck && npm run format:check` → PASS.
- [x] **Step 4: Local prod build** — `npm run build` → succeeds (StatusScreen-in-server-tree canary: a function passed from `not-found.tsx` would fail here).
- [x] **Step 5: Touched e2e specs locally** (needs dev DB seeded + port 3001 per playwright config):

```bash
npx playwright test tests/e2e/home.spec.ts tests/e2e/navigation.spec.ts --project=chromium
```

Expected: PASS with the «Відхилити»/«Категорії» names.

- [x] **Step 6: Commit** any sweep fixes:

```bash
git add -A && git commit -m "fix(g4): EN-residual sweep fixes"   # only if the sweep changed files
```

---

### Task 14: Visual consistency gate (user sign-off required)

**Files:**

- Create (scratchpad only, NOT committed): capture script + montage sheet in the session scratchpad directory.

**Setup** (shell-only, no `.env` edits):

- [ ] Dev server: `AUTH_TRUST_HOST=true NEXTAUTH_URL=http://localhost:3001 npm run dev -- --port 3001` (audit workaround for credentials login).
- [ ] Seed data present (`npm run db:seed` if needed; customer `customer@example.com` / `customer123`).
- [ ] Newsletter states: insert a PENDING subscriber with a known token + future expiry, a second with backdated expiry (scratchpad Node script via `prisma` + `generateUnsubscribeToken` from `src/lib/newsletter.ts` for the HMAC URL). Mint URLs: `/newsletter/confirm?token=…` (valid → success; backdated → LINK_EXPIRED; garbage → INVALID_TOKEN), `/newsletter/unsubscribe?email=…&token=…` (valid HMAC → idle→success; wrong token → INVALID_UNSUBSCRIBE_LINK).
- [ ] Error boundaries: temporary throwing page `src/app/dev-boom/page.tsx` (`export default function Boom(): never { throw new Error("boom"); }`) for the root boundary; a temporary `throw` at the top of `LoginFormInner` for the auth boundary. **Delete both before any commit** (`git status` must be clean of them).

**Captures** (Playwright script, 1440×900 + 390×844, to scratchpad):

- [ ] login, register, auth-error (forced), `/account`, `/account/orders`, `/account/orders/{seeded-id}`, `/categories`, `/categories/hudi`, newsletter confirm ×3 states, unsubscribe ×3 states, 404 (`/definitely-missing`), root error (forced), cookie banner (fresh context on `/`).

**Gate:**

- [ ] Assemble a side-by-side montage (HTML sheet in scratchpad): each G4 surface beside its shipped sibling — login/register beside checkout's step card, account pages beside `/cart`, StatusScreen states beside `/checkout/confirmation`, categories beside `/products`.
- [ ] Present to the user; **user sign-off = the gate** (judged for consistency with shipped work; no mockup exists). Iterate on findings before proceeding.

---

### Task 15: Docs, BACKLOG spawns, PR

**Files:**

- Modify: `CLAUDE.md` (root), `src/app/CLAUDE.md`, `src/components/CLAUDE.md`, `docs/planning/BACKLOG.md`, this plan file (final log).

- [x] **Step 1: Root `CLAUDE.md`** — in the `src/content/` tree listing add four lines (auth.ts, account.ts, newsletter.ts, system.ts — one-line descriptions matching the existing style, e.g. `account.ts # Account area copy + ORDER_STATUS_LABELS/PAYMENT_STATUS_LABELS (customer label maps)`); note in the `order-status` mention that labels live in `content/account.ts` since G4; add a Detected-Patterns line: **Coded API outcomes** — newsletter routes + register 409 return machine `code`s alongside EN prose; clients map code → UA via `src/content/` (G2 create-order convention, extended in G4).
- [x] **Step 2: `src/app/CLAUDE.md`** — newsletter pages + account pages now UA via content modules; newsletter API coded outcomes; account nav omits addresses/settings (BACKLOG'd).
- [x] **Step 3: `src/components/CLAUDE.md`** — add `StatusScreen.tsx` to the common/ listing (hook-free shared status-page treatment, server-usable, href-only actions from server callers); note CookieConsent + NewsletterSignup copy sources.
- [x] **Step 4: BACKLOG** — add under `### [2026-08-08] From: G4 brainstorm` (🟤): (1) restore account Addresses/Settings nav links when pages are built (pairs with the TASK-056 content-gap row; links removed in G4); (2) products↔categories sort-set unification (shared options + `getSalesRanking()`; behavior change deliberately deferred out of G4). The `AUTH_TRUST_HOST` note is **already filed** (existing entry ~line 622) — do not duplicate.
- [x] **Step 5: Docs-freshness manual check** — `docs/README.md` index rows ↔ headers both directions + neighbouring rows for every doc touched this task.
- [x] **Step 6: Commit + push + PR**

```bash
git add CLAUDE.md src/app/CLAUDE.md src/components/CLAUDE.md docs/planning/BACKLOG.md docs/planning/plans/2026-08-08_g4-peripheral-surfaces.md
git commit -m "docs(g4): CLAUDE.md propagation, BACKLOG spawns, plan log"
git push -u origin feat/g4-peripheral-surfaces
gh pr create --title "feat: G4 peripheral surfaces sweep — Ukrainian + Mirox alignment (auth/account/newsletter/system/categories/header)" --body "…summary…"
```

PR body summarizes: scope (spec link), the coded-outcome API change, StatusScreen, dead-link removal, test delta, visual-gate sign-off note. End the body with the standing Claude Code attribution line. Verify the repo slug via `gh repo view --json nameWithOwner` before writing any permalinks (repo is `dropshipping-test`, not the directory name).

---

## Post-plan (standing completion workflow, after merge — not tasks here)

PR review rounds → user approval → merge → completion workflow (DONE.md transition, WEEKLY `✅ PR #N`, BACKLOG resolution, plan archive to `docs/archive/plans/`, memory capture). During the propagation check, add a superseded note to spec §5's "dynamic-route-params: no change expected" row (Task 10 falsified it — one assertion updates).

## Progress log

- 2026-08-08: Plan written from the approved spec (brainstorm same day; spec commit `80dc69a`). Branch `feat/g4-peripheral-surfaces` active, plan committed `e3a6add`. Executed via subagent-driven-development (haiku implementers, sonnet reviewers, fable final review — G3 SDD pattern); full per-task trail in `.superpowers/sdd/2026-08-08_g4-peripheral-surfaces/progress.md`.
- Task 1 (`apiError` optional `code` param): complete, commits `e3a6add..316c5bd`, review clean.
- Task 2 (Newsletter API coded outcomes): complete, commits `316c5bd..f9c049f`, review clean.
- Task 3 (Content modules auth/account/newsletter/system + site.header, label-map move): complete, commits `f9c049f..cfaae78`, review clean on code. 1 minor deferred: the implementer report's test-breakdown didn't match the file structure (reviewer verified the real top-line 33-pass count independently) — a report-evidence calibration note, no code impact.
- Task 4 (`StatusScreen` shared component): complete, commits `cfaae78..5cc22cc`, review clean. 1 minor deferred: `key={action.label}` would collide on duplicate action labels in one `actions` array — plan-mandated shape, negligible risk since CTA copy is always distinct.
- Task 5 (System pages — 404, root error boundary, cookie banner + home.spec names): complete, commits `5cc22cc..598cd44`, review clean.
- Task 6 (Newsletter pages + footer signup mapping): fix round 1/5 (3 findings addressed — signup mapping tests added, report corrections; intermediate commit `3a2cfa2`), then complete, commits `598cd44..80bf53c`, review clean after the fix round. 1 minor deferred: a TASK-039 comment in `NewsletterSignup.tsx` (lines 10-11) is now slightly imprecise since the error-path strings moved to `content/newsletter.ts` — pre-existing comment, cosmetic.
- Task 7 (Auth — Zod UA messages, login/register forms, auth error boundary, register EMAIL_EXISTS): complete, commits `80bf53c..3ec7118`, review clean.
- Task 8 (Account layout + overview, dead links removed): complete, commits `3ec7118..1a11a1c`, review clean. 1 minor deferred: the overview grid keeps `lg:grid-cols-3` with a single Orders card (plan-mandated) — flagged for the Task 14 visual gate to eyeball.
- Task 9 (Account orders list): complete, commits `1a11a1c..558f0dd`, review clean.
- Task 10 (Account order detail, G3-unblocked): complete, commits `558f0dd..a1e25a0`, review clean. **Deviation**: falsifies spec §5's "dynamic-route-params: no change expected" row — `tests/unit/dynamic-route-params.test.tsx:62`'s `/account/orders/[id]` assertion had to move from the English `"Order not found"` to `"Замовлення не знайдено"` (the three admin-route assertions stay English); recorded in-task per the spec's own instruction, superseded note owed to the spec at merge-completion (out of this task's scope, see Post-plan section above).
- Task 11 (Categories chrome — inline strings, catalog-domain convention): complete, commits `a1e25a0..4837632`, review clean.
- Task 12 (Header residuals + navigation.spec names): fix round 1/5 (3 findings addressed — 3 `/menu/i` locators in `navigation.spec.ts` broken by the new Ukrainian accessible name, now `/меню/i`; 2 report corrections; intermediate commit `4dc2574`), then complete, commits `4837632..a0520b2`, review clean after the fix round. Carried forward to Task 13 (controller-verified): `navigation.spec.ts:95`'s heading assertion (`/categories/i`) doesn't match Task 11's new «Категорії» H1 — a deterministic failure needing a fix in Task 13; also noted the `products-page` local test failure is a pre-existing dev-server race (fails on `main` too, passes in the CI prod build) — not chased, not masked.
- Task 13 (Full-suite verification + EN-residual sweep): complete, commits `a0520b2..8471500`, review clean. Fixed the carried `navigation.spec.ts:95` assertion (only change); full suite 672 passed + 1 todo, build + static checks clean, e2e 11/11. New finding carried to Task 15's BACKLOG: `NODE_ENV=development` in `/etc/environment` (a third source beyond the two TASK-057 removed, local prod-CSS corruption only). One adjudication note (no action taken): a reviewer's "Important" on the implementer report was a mis-attribution, not a fabrication — the quoted "Record its status verbatim…" text is verbatim from the controller's own dispatch prompt, not a fabricated workspace-file citation.
- Task 14 (Visual consistency gate, user sign-off required): captures complete (38 PNGs + an HTML montage, `g4-visual-gate/g4-montage.html`; controller spot-checked login/orders/newsletter-success for consistency). Three execution finds carried to Task 15's BACKLOG: (1) the newsletter confirm page's `useEffect` fetch has no stale-response guard — React Strict-Mode's dev double-invoke clobbers the success render with a false error; (2) a scripted client-side `signIn()` still hits `MissingCSRF` even under the documented `AUTH_TRUST_HOST` workaround — worked around with a direct `/api/auth/callback/credentials` POST; (3) the `NODE_ENV`/`/etc/environment` finding carried from Task 13. **Gate**: user reviewed all 8 captured surfaces — items 1, 3, 4, 6, 7, 8 approved as-is; item 2 (account overview) approved with an option-A grid revision requested, fixed in two rounds (`21eb067` then `1ad7a9e` — the first arbitrary Tailwind class silently no-op'd producing a full-width card, and the follow-up arbitrary-_property_ variant no-op'd too; an inline `style` was the only fallback that actually compiled, verified against the SSR HTML and a fresh screenshot, ~304px track) — this is where the Tailwind-v4 nested-comma no-op was discovered; item 5 (`/categories`) approved visually and spawned two user-raised 🔵 BACKLOG items (categories→catalog redesign; the parent-category «Всі»=0 rollup bug, controller-verified against the products API and seed data). **Gate SIGNED OFF** (montage copied to the repo-root `.superpowers/…/visual-gate/`, git-ignored, for host browsing).
- Task 15 (Docs, BACKLOG spawns, plan close-out — this task): root/`src/app`/`src/components` `CLAUDE.md` propagation (new content modules, the coded-API-outcomes pattern, `StatusScreen`, an `order-status.ts` tree entry noting the label move to `content/account.ts`, two Known-challenges extensions for the `/etc/environment` NODE_ENV source and the Tailwind v4 nested-comma no-op). Three new BACKLOG groups added: `[2026-08-08] From: G4 brainstorm` (2× 🟤 — restore account nav links, sort-set unification), `[2026-08-09] From: G4 execution` (4× 🟤 — NODE_ENV third source, newsletter confirm race guard, Tailwind arbitrary-value no-op, scripted-signIn CSRF nuance), `[2026-08-09] From: G4 visual gate (user)` (2× 🔵 — categories→catalog redesign, parent-category rollup bug). Plan checkboxes bulk-closed (`- [ ] **Step` → `- [x] **Step`, 79 boxes across Tasks 1-15; Task 14's non-Step setup/capture/gate checklist intentionally left as-is, out of the bulk-check's scope) and this progress log rewritten from the SDD ledger. `docs/README.md` docs-freshness pass (G4 spec row added following the G1/G2/G3 sibling convention; BACKLOG index-date synced; own header date bumped; G4's plan intentionally NOT added to the Implementation Plans/Archived Plans tables — matches the G1/G2/G3 sibling precedent of not listing G-numbered plans there). **Deviation (task split, not a plan defect):** per the controller's dispatch, this task stops at the commit — push + PR (plan Step 6's second half) is deferred until after a final branch review the controller runs separately.
