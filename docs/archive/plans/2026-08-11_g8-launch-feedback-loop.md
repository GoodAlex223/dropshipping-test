# G8 Launch Feedback Loop Implementation Plan (TASK-058 + TASK-059)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the launch feedback loop — a public `/feedback` page whose submissions arrive as email (TASK-058), announced by a site-wide scrolling marquee linking to it (TASK-059).

**Architecture:** A guest-capable `POST /api/feedback` validates with Zod, silently drops honeypot hits, and awaits a Resend send to the `FEEDBACK_EMAIL` recipient (failed send = 500 — the email is the deliverable). The marquee is the existing `AnnouncementBar` grown a richer `SiteAnnouncement` content shape and a pure-CSS scroll that rejoins the repo's reduced-motion reset.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Zod **v4** (`^4.3.5`), Resend `^6.6.0` (`replyTo` camelCase — verified against `node_modules/resend/dist/index.d.cts`), Vitest + RTL, Tailwind v4 (plain-CSS classes in `globals.css`, NOT arbitrary values).

**Spec:** `docs/superpowers/specs/2026-08-11-launch-feedback-loop-design.md` (approved 2026-08-11).
**Branch:** `feat/task-058-059-launch-feedback-loop` (already checked out).

## Global Constraints

- All user-visible copy is Ukrainian and lives in `src/content/*` modules — never inline in components. API `error`/`message` prose stays English; clients map the machine `code` to UA (`byCode` convention).
- `src/content/emails.ts` may import ONLY `./brand` (lucide-free contract — it bundles into API routes).
- Every interpolated user/DB string in email HTML passes through `escapeHtml` (from `@/lib/newsletter`).
- Email sends on API routes are `await`ed (PR #34 serverless-freeze lesson) and wrapped in the existing `sendWithTimeout` 10s race.
- Unit tests: all `vi.mock()` calls before imports; `vi.mock("@/lib/auth", ...)` wherever `api-utils` is transitively imported; bare `catch` when the error variable is unused.
- Marquee CSS: define keyframes + classes as plain CSS in `globals.css` (Tailwind v4 silently no-ops arbitrary values with nested commas); the reduced-motion override must live INSIDE the existing `@media (prefers-reduced-motion: reduce)` block.
- Run commands with `npx vitest run <path>` for single files; `npm run test:run` for the full suite.
- Do NOT trust local `next build` visuals (`/etc/environment` sets `NODE_ENV=development`, corrupting responsive utilities in local prod CSS) — the visual gate runs on the dev server. Never add a `NODE_ENV` line to any env file.
- Commit after each green task with conventional-commit messages. Do not push until the user approves at the visual gate.

---

### Task 1: `feedbackSchema` validation

**Files:**

- Modify: `src/lib/validations/index.ts` (append after the newsletter schemas, ~line 163)
- Test: `tests/unit/feedback-schema.test.ts` (create)

**Interfaces:**

- Consumes: `zod` v4 (`z` already imported at top of validations/index.ts).
- Produces: `feedbackSchema` (ZodObject) and `type FeedbackInput = z.infer<typeof feedbackSchema>` — `{ name?: string; email?: string; message: string; website?: string }`. Task 4's route imports both.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/feedback-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { feedbackSchema } from "@/lib/validations";

describe("feedbackSchema", () => {
  it("accepts a message-only submission", () => {
    const result = feedbackSchema.safeParse({ message: "Кнопка кошика не працює" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
      expect(result.data.email).toBeUndefined();
    }
  });

  it("trims all fields", () => {
    const result = feedbackSchema.safeParse({
      name: "  Олена  ",
      email: "  olena@example.com  ",
      message: "  Каталог вантажиться повільно  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Олена");
      expect(result.data.email).toBe("olena@example.com");
      expect(result.data.message).toBe("Каталог вантажиться повільно");
    }
  });

  it("normalizes empty-string name and email to undefined", () => {
    const result = feedbackSchema.safeParse({
      name: "",
      email: "  ",
      message: "Все працює чудово",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
      expect(result.data.email).toBeUndefined();
    }
  });

  it("rejects a missing message", () => {
    expect(feedbackSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a message shorter than 5 characters after trimming", () => {
    expect(feedbackSchema.safeParse({ message: " ок  " }).success).toBe(false);
  });

  it("rejects a message over 2000 characters", () => {
    expect(feedbackSchema.safeParse({ message: "а".repeat(2001) }).success).toBe(false);
  });

  it("rejects an invalid email when one is given", () => {
    expect(
      feedbackSchema.safeParse({ email: "not-an-email", message: "Довге повідомлення" }).success
    ).toBe(false);
  });

  it("accepts the honeypot field without validating its content", () => {
    const result = feedbackSchema.safeParse({
      message: "Нормальний текст",
      website: "http://spam.example",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.website).toBe("http://spam.example");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feedback-schema.test.ts`
Expected: FAIL — `feedbackSchema` is not exported.

- [ ] **Step 3: Implement the schema**

In `src/lib/validations/index.ts`, after `updateSubscriberStatusSchema` (~line 163), add:

```ts
// Feedback validations (G8 TASK-058)
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const feedbackSchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().trim().max(100, "Name is too long").optional()),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Invalid email address").max(254, "Email is too long").optional()
  ),
  message: z
    .string()
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(2000, "Message must be at most 2000 characters"),
  /** Honeypot — never rejected here; the route silently drops when filled. */
  website: z.string().max(200).optional(),
});
```

And with the other type exports at the bottom of the file:

```ts
export type FeedbackInput = z.infer<typeof feedbackSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/feedback-schema.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/index.ts tests/unit/feedback-schema.test.ts
git commit -m "feat(feedback): add feedbackSchema validation (TASK-058)"
```

---

### Task 2: Feedback email copy + template

**Files:**

- Modify: `src/content/emails.ts` (add `feedback` block after `newsletter`, before `footer`)
- Create: `src/lib/email-templates/feedback.ts`
- Test: `tests/unit/email-templates.test.ts` (append a describe block)

**Interfaces:**

- Consumes: `renderEmailShell`/`renderPanel`/`EMAIL_COLORS` from `./layout`; `escapeHtml` from `@/lib/newsletter`; `emails`/`getStoreName` from `@/content/emails`.
- Produces: `emails.feedback` copy object (`subject(): string`, `title`, `heading`, `nameLabel`, `emailLabel`, `anonymous`); `generateFeedbackEmailHtml(data: FeedbackEmailData): string` and `interface FeedbackEmailData { name?: string; email?: string; message: string }`. Task 3 imports both.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/email-templates.test.ts` (new top-level describe; add the import next to the other template imports):

```ts
import { generateFeedbackEmailHtml } from "@/lib/email-templates/feedback";
```

```ts
describe("generateFeedbackEmailHtml", () => {
  it("renders name and email rows when provided", () => {
    const html = generateFeedbackEmailHtml({
      name: "Олена",
      email: "olena@example.com",
      message: "Кнопка кошика не працює",
    });
    expect(html).toContain("Новий відгук із сайту");
    expect(html).toContain("Олена");
    expect(html).toContain("olena@example.com");
    expect(html).toContain("Кнопка кошика не працює");
  });

  it("renders the anonymous line when no contacts were left", () => {
    const html = generateFeedbackEmailHtml({ message: "Анонімний відгук про сайт" });
    expect(html).toContain("Відправник не залишив контактів.");
    expect(html).not.toContain("Ім'я:");
  });

  it("escapes user-controlled strings", () => {
    const html = generateFeedbackEmailHtml({
      name: '<script>alert("x")</script>',
      message: "Текст із <b>тегами</b> всередині",
    });
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;тегами&lt;/b&gt;");
  });

  it("converts message newlines to <br> after escaping", () => {
    const html = generateFeedbackEmailHtml({ message: "перший рядок\nдругий рядок" });
    expect(html).toContain("перший рядок<br>другий рядок");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: FAIL — cannot resolve `@/lib/email-templates/feedback`. Pre-existing tests still pass.

- [ ] **Step 3: Add the copy block**

In `src/content/emails.ts`, between the `newsletter` block and `footer`, add:

```ts
  feedback: {
    subject: () => `Новий відгук із сайту — ${getStoreName()}`,
    title: "Новий відгук",
    heading: "Новий відгук із сайту",
    nameLabel: "Ім'я",
    emailLabel: "Email",
    /** Rendered when the visitor left neither name nor email. */
    anonymous: "Відправник не залишив контактів.",
  },
```

- [ ] **Step 4: Create the template**

Create `src/lib/email-templates/feedback.ts`:

```ts
import { escapeHtml } from "@/lib/newsletter";
import { emails } from "@/content/emails";
import { EMAIL_COLORS, renderEmailShell, renderPanel } from "./layout";

export interface FeedbackEmailData {
  name?: string;
  email?: string;
  message: string;
}

export function generateFeedbackEmailHtml(data: FeedbackEmailData): string {
  const t = emails.feedback;

  const contactRows = [
    data.name
      ? `<p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.muted};">${t.nameLabel}: <strong style="color: ${EMAIL_COLORS.text};">${escapeHtml(data.name)}</strong></p>`
      : "",
    data.email
      ? `<p style="margin: 0; color: ${EMAIL_COLORS.muted};">${t.emailLabel}: <strong style="color: ${EMAIL_COLORS.text};">${escapeHtml(data.email)}</strong></p>`
      : "",
  ].join("");

  const introPanel = renderPanel(
    `<h2 style="margin: 0 0 16px 0; font-size: 20px;">${t.heading}</h2>
    ${contactRows || `<p style="margin: 0; color: ${EMAIL_COLORS.muted};">${t.anonymous}</p>`}`
  );

  // Escape FIRST, then substitute newlines — the substitution must never run
  // on raw user input.
  const messageHtml = escapeHtml(data.message).replace(/\r?\n/g, "<br>");
  const messagePanel = renderPanel(`<p style="margin: 0;">${messageHtml}</p>`);

  return renderEmailShell({ title: t.title, bodyHtml: `${introPanel}${messagePanel}` });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: PASS (all pre-existing + 4 new).

- [ ] **Step 6: Commit**

```bash
git add src/content/emails.ts src/lib/email-templates/feedback.ts tests/unit/email-templates.test.ts
git commit -m "feat(emails): feedback notification copy + dark-shell template (TASK-058)"
```

---

### Task 3: `sendFeedbackEmail` in the email lib

**Files:**

- Modify: `src/lib/email.ts` (new import + new exported function after `sendNewsletterConfirmationEmail`)
- Test: `tests/unit/email-send.test.ts` (create)

**Interfaces:**

- Consumes: `generateFeedbackEmailHtml` + `FeedbackEmailData` (Task 2); module-scope `resend`, `emailFrom`, `sendWithTimeout` already in `email.ts`; `emails.feedback.subject()`.
- Produces: `sendFeedbackEmail(data: FeedbackEmailData): Promise<{ success: boolean; error?: string }>` and re-export `export type { FeedbackEmailData }`. Task 4's route imports the function.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/email-send.test.ts`. Key constraint: `email.ts` reads `RESEND_API_KEY`/`EMAIL_FROM` at **module scope**, so each case sets env then dynamically imports a fresh module via `vi.resetModules()`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const originalEnv = { ...process.env };

// email.ts freezes RESEND_API_KEY at import — set env BEFORE a fresh import.
async function importEmailModule() {
  vi.resetModules();
  return await import("@/lib/email");
}

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ error: null });
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("sendFeedbackEmail", () => {
  it("log-skips and succeeds when RESEND_API_KEY is unset (local dev)", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendFeedbackEmail } = await importEmailModule();
    const result = await sendFeedbackEmail({ message: "Привіт з форми" });
    expect(result.success).toBe(true);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("fails loud when Resend is configured but FEEDBACK_EMAIL is unset", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.FEEDBACK_EMAIL;
    const { sendFeedbackEmail } = await importEmailModule();
    const result = await sendFeedbackEmail({ message: "Привіт з форми" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("FEEDBACK_EMAIL");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends to FEEDBACK_EMAIL with Reply-To when the visitor left an email", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.FEEDBACK_EMAIL = "owner@example.com";
    const { sendFeedbackEmail } = await importEmailModule();
    const result = await sendFeedbackEmail({
      name: "Олена",
      email: "olena@example.com",
      message: "Кнопка кошика не працює",
    });
    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        replyTo: "olena@example.com",
        subject: expect.stringContaining("Новий відгук"),
        html: expect.stringContaining("Кнопка кошика не працює"),
      })
    );
  });

  it("omits Reply-To when no email was provided", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.FEEDBACK_EMAIL = "owner@example.com";
    const { sendFeedbackEmail } = await importEmailModule();
    await sendFeedbackEmail({ message: "Анонімний відгук про сайт" });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).not.toHaveProperty("replyTo");
  });

  it("returns failure when Resend reports an error", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.FEEDBACK_EMAIL = "owner@example.com";
    sendMock.mockResolvedValue({ error: { message: "boom" } });
    const { sendFeedbackEmail } = await importEmailModule();
    const result = await sendFeedbackEmail({ message: "Довге повідомлення" });
    expect(result).toEqual({ success: false, error: "boom" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/email-send.test.ts`
Expected: FAIL — `sendFeedbackEmail` is not exported.

- [ ] **Step 3: Implement `sendFeedbackEmail`**

In `src/lib/email.ts`, extend the imports:

```ts
import { generateFeedbackEmailHtml, type FeedbackEmailData } from "./email-templates/feedback";
```

Next to `export type { OrderEmailData };` add:

```ts
export type { FeedbackEmailData };
```

Append after `sendNewsletterConfirmationEmail`:

```ts
export async function sendFeedbackEmail(
  data: FeedbackEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("Skipping email send - RESEND_API_KEY not configured");
    console.log("Would send feedback to:", process.env.FEEDBACK_EMAIL || "(FEEDBACK_EMAIL unset)");
    return { success: true };
  }

  // Read at call time, not module scope: a missing value must fail loud per
  // request (the email IS the deliverable), and env-dependent tests stay
  // honest (G5 getStoreName lesson).
  const to = process.env.FEEDBACK_EMAIL;
  if (!to) {
    console.error("FEEDBACK_EMAIL is not configured - feedback email not sent");
    return { success: false, error: "FEEDBACK_EMAIL not configured" };
  }

  try {
    const { error } = await sendWithTimeout(
      resend.emails.send({
        from: emailFrom,
        to,
        ...(data.email ? { replyTo: data.email } : {}),
        subject: emails.feedback.subject(),
        html: generateFeedbackEmailHtml(data),
      })
    );

    if (error) {
      console.error("Failed to send feedback email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending feedback email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/email-send.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Guard against regressions in the files this touched**

Run: `npx vitest run tests/unit/email-templates.test.ts tests/unit/newsletter-api.test.ts`
Expected: PASS (newsletter-api mocks `@/lib/email` wholesale, so the new export is invisible to it — this run just proves it).

- [ ] **Step 6: Commit**

```bash
git add src/lib/email.ts tests/unit/email-send.test.ts
git commit -m "feat(emails): sendFeedbackEmail with call-time FEEDBACK_EMAIL + Reply-To (TASK-058)"
```

---

### Task 4: `POST /api/feedback` route

**Files:**

- Create: `src/app/api/feedback/route.ts`
- Test: `tests/unit/feedback-api.test.ts` (create)

**Interfaces:**

- Consumes: `feedbackSchema` (Task 1), `sendFeedbackEmail` (Task 3), `apiError(message, status, code)` / `apiSuccess(data, status)` from `@/lib/api-utils`.
- Produces: `POST` handler with outcomes `201 {code:"FEEDBACK_SENT"}` / `400 VALIDATION_ERROR` / `500 SEND_FAILED`. Task 5's form fetches it.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/feedback-api.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNextRequest } from "../helpers/api-test-utils";

// api-utils.ts transitively imports next-auth via @/lib/auth — mock to keep
// vitest away from its ESM resolution.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendFeedbackEmail: vi.fn().mockResolvedValue({ success: true }),
}));

import { sendFeedbackEmail } from "@/lib/email";
import { POST } from "@/app/api/feedback/route";

const mockSend = vi.mocked(sendFeedbackEmail);

function feedbackRequest(body: Record<string, unknown>) {
  return createNextRequest({ url: "/api/feedback", method: "POST", body });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockResolvedValue({ success: true });
});

describe("POST /api/feedback", () => {
  it("returns 201 FEEDBACK_SENT and sends the email", async () => {
    const res = await POST(feedbackRequest({ message: "Кнопка кошика не працює" }));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.code).toBe("FEEDBACK_SENT");
    expect(mockSend).toHaveBeenCalledWith({
      name: undefined,
      email: undefined,
      message: "Кнопка кошика не працює",
    });
  });

  it("passes trimmed contact fields through and drops empty strings", async () => {
    await POST(
      feedbackRequest({ name: "  Олена ", email: "", message: " Каталог вантажиться повільно " })
    );
    expect(mockSend).toHaveBeenCalledWith({
      name: "Олена",
      email: undefined,
      message: "Каталог вантажиться повільно",
    });
  });

  it("returns 400 VALIDATION_ERROR when message is missing", async () => {
    const res = await POST(feedbackRequest({}));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("VALIDATION_ERROR");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 400 VALIDATION_ERROR when message is too short", async () => {
    const res = await POST(feedbackRequest({ message: "ок" }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 VALIDATION_ERROR when message exceeds 2000 characters", async () => {
    const res = await POST(feedbackRequest({ message: "а".repeat(2001) }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 VALIDATION_ERROR for an invalid email", async () => {
    const res = await POST(
      feedbackRequest({ email: "not-an-email", message: "Довге повідомлення" })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("VALIDATION_ERROR");
  });

  it("silently drops filled-honeypot submissions with a fake 201", async () => {
    const res = await POST(
      feedbackRequest({ message: "Цілком нормальний текст", website: "http://spam.example" })
    );
    expect(res.status).toBe(201);
    expect((await res.json()).code).toBe("FEEDBACK_SENT");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 500 SEND_FAILED when the send reports failure", async () => {
    mockSend.mockResolvedValue({ success: false, error: "FEEDBACK_EMAIL not configured" });
    const res = await POST(feedbackRequest({ message: "Довге повідомлення" }));
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe("SEND_FAILED");
  });

  it("returns 500 SEND_FAILED when the send throws", async () => {
    mockSend.mockRejectedValue(new Error("network down"));
    const res = await POST(feedbackRequest({ message: "Довге повідомлення" }));
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe("SEND_FAILED");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feedback-api.test.ts`
Expected: FAIL — cannot resolve `@/app/api/feedback/route`.

- [ ] **Step 3: Implement the route**

Create `src/app/api/feedback/route.ts`:

```ts
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { feedbackSchema } from "@/lib/validations";
import { sendFeedbackEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = feedbackSchema.safeParse(body);

    // `error`/`message` prose stays English for logs/API consumers; the
    // /feedback page maps `code` to Ukrainian (src/content/feedback.ts).
    if (!result.success) {
      return apiError(result.error.issues[0].message, 400, "VALIDATION_ERROR");
    }

    const { name, email, message, website } = result.data;

    // Honeypot: the field is visually hidden, so a value means a bot filled
    // it. Report success without sending so the bot gets no signal.
    if (website && website.trim() !== "") {
      return apiSuccess({ code: "FEEDBACK_SENT", message: "Feedback sent" }, 201);
    }

    // Awaited (PR #34): a fire-and-forget send dies at serverless freeze.
    // The email IS the deliverable, so a failed send must not report
    // success (deliberately stricter than the newsletter subscribe route).
    const sent = await sendFeedbackEmail({ name, email, message });
    if (!sent.success) {
      return apiError("Failed to send feedback", 500, "SEND_FAILED");
    }

    return apiSuccess({ code: "FEEDBACK_SENT", message: "Feedback sent" }, 201);
  } catch {
    return apiError("Failed to process feedback", 500, "SEND_FAILED");
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/feedback-api.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/feedback/route.ts tests/unit/feedback-api.test.ts
git commit -m "feat(api): POST /api/feedback with coded outcomes + honeypot drop (TASK-058)"
```

---

### Task 5: `/feedback` page, form, content module, footer link, sitemap, env example

**Files:**

- Create: `src/content/feedback.ts`
- Create: `src/app/(shop)/feedback/page.tsx`
- Create: `src/app/(shop)/feedback/feedback-form.tsx`
- Modify: `src/components/common/Footer.tsx` (`shopLinks`, line ~10)
- Modify: `src/app/sitemap.ts` (static pages array, after the `/cart` entry)
- Modify: `.env.example` (after `EMAIL_FROM`, line 38)
- Test: `tests/unit/feedback-form.test.tsx` (create), `tests/unit/content.test.ts` (append), `tests/unit/footer.test.tsx` (extend one assertion)

**Interfaces:**

- Consumes: `POST /api/feedback` (Task 4) via `fetch`; `Input`/`Textarea`/`Button` from `@/components/ui`; `toast` from `sonner`.
- Produces: `feedback` content object (`page.title`, `page.description`, `form.*`, `success.*`, `byCode: Record<string,string>`, `fallback`); `FeedbackForm` component; `/feedback` route. Task 7's marquee links to `/feedback`.

- [ ] **Step 1: Write the failing form tests**

Create `tests/unit/feedback-form.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { toast } from "sonner";
import { FeedbackForm } from "@/app/(shop)/feedback/feedback-form";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FeedbackForm", () => {
  it("submits message-only feedback and shows the success box", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ code: "FEEDBACK_SENT" }) });
    render(<FeedbackForm />);

    fireEvent.change(screen.getByLabelText("Повідомлення"), {
      target: { value: "Кнопка кошика не працює" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати" }));

    await waitFor(() => expect(screen.getByText("Дякуємо!")).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/feedback");
    expect(JSON.parse(init.body).message).toBe("Кнопка кошика не працює");
  });

  it("keeps the honeypot field out of sight and out of the tab order", () => {
    render(<FeedbackForm />);
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot!.getAttribute("tabindex")).toBe("-1");
    expect(honeypot!.closest('div[aria-hidden="true"]')).not.toBeNull();
  });

  it("maps SEND_FAILED to the Ukrainian toast and keeps the form on screen", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ code: "SEND_FAILED" }) });
    render(<FeedbackForm />);

    fireEvent.change(screen.getByLabelText("Повідомлення"), {
      target: { value: "Каталог вантажиться повільно" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Не вдалося надіслати повідомлення. Спробуйте пізніше."
      )
    );
    expect(screen.getByRole("button", { name: "Надіслати" })).toBeInTheDocument();
  });

  it("falls back to the generic Ukrainian error when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<FeedbackForm />);

    fireEvent.change(screen.getByLabelText("Повідомлення"), {
      target: { value: "Каталог вантажиться повільно" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Не вдалося надіслати повідомлення. Спробуйте пізніше."
      )
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feedback-form.test.tsx`
Expected: FAIL — cannot resolve `@/app/(shop)/feedback/feedback-form`.

- [ ] **Step 3: Create the content module**

Create `src/content/feedback.ts`:

```ts
/**
 * /feedback page + form copy (G8 TASK-058). The byCode map translates the
 * machine `code`s the feedback API returns (API prose stays English — G2
 * create-order convention). Single extraction point for TASK-039 i18n.
 */
export const feedback = {
  page: {
    title: "Зворотний зв'язок",
    description:
      "Ми щойно запустили новий сайт. Якщо щось не працює, виглядає дивно або у вас є ідея — напишіть нам. Ми читаємо кожне повідомлення.",
  },
  form: {
    nameLabel: "Ім'я",
    namePlaceholder: "Як до вас звертатися (необов'язково)",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    emailHint: "Залиште email, якщо хочете отримати відповідь (необов'язково)",
    messageLabel: "Повідомлення",
    messagePlaceholder: "Розкажіть, що сталося або що можна покращити…",
    submit: "Надіслати",
    submitting: "Надсилаємо…",
  },
  success: {
    title: "Дякуємо!",
    description:
      "Ваше повідомлення надіслано. Якщо ви залишили email, ми відповімо найближчим часом.",
  },
  byCode: {
    VALIDATION_ERROR: "Перевірте заповнені поля — щось не так.",
    SEND_FAILED: "Не вдалося надіслати повідомлення. Спробуйте пізніше.",
  } as Record<string, string>,
  fallback: "Не вдалося надіслати повідомлення. Спробуйте пізніше.",
};
```

- [ ] **Step 4: Create the form component**

Create `src/app/(shop)/feedback/feedback-form.tsx`:

```tsx
"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { feedback } from "@/content/feedback";

export function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // data.error is EN API/log text — map the machine code instead.
        toast.error((data.code && feedback.byCode[data.code]) || feedback.fallback);
        return;
      }

      setIsSuccess(true);
    } catch {
      toast.error(feedback.fallback);
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="border-border bg-muted flex items-start gap-3 rounded-md border p-4">
        <CheckCircle2 className="text-foreground h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-foreground font-semibold">{feedback.success.title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{feedback.success.description}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="feedback-name" className="text-sm font-medium">
            {feedback.form.nameLabel}
          </label>
          <Input
            id="feedback-name"
            value={name}
            maxLength={100}
            placeholder={feedback.form.namePlaceholder}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="feedback-email" className="text-sm font-medium">
            {feedback.form.emailLabel}
          </label>
          <Input
            id="feedback-email"
            type="email"
            value={email}
            maxLength={254}
            placeholder={feedback.form.emailPlaceholder}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-muted-foreground text-xs">{feedback.form.emailHint}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="feedback-message" className="text-sm font-medium">
          {feedback.form.messageLabel}
        </label>
        <Textarea
          id="feedback-message"
          value={message}
          required
          minLength={5}
          maxLength={2000}
          rows={6}
          placeholder={feedback.form.messagePlaceholder}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
        />
      </div>
      {/* Honeypot: hidden from real users (display: none, no tab stop); bots
          that fill every field reveal themselves. The label text is
          deliberately EN bait, not UA copy — it must look like a real field
          to a bot and is never shown to people. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="feedback-website">Website</label>
        <input
          id="feedback-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? feedback.form.submitting : feedback.form.submit}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Create the page**

Create `src/app/(shop)/feedback/page.tsx`:

```tsx
import type { Metadata } from "next";
import { feedback } from "@/content/feedback";
import { FeedbackForm } from "./feedback-form";

// Metadata stays EN like the rest of the SEO layer (BACKLOG'd for the
// UA-metadata sweep; G9 rules on it) — the page body is UA via content.
export const metadata: Metadata = {
  title: "Feedback",
  description: "Tell us about problems or ideas — the Mirox Shop feedback form.",
};

export default function FeedbackPage() {
  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">{feedback.page.title}</h1>
      <p className="text-muted-foreground mt-3">{feedback.page.description}</p>
      <div className="mt-8">
        <FeedbackForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Footer link + sitemap entry + env example**

In `src/components/common/Footer.tsx`, extend `shopLinks`:

```ts
const shopLinks = [
  { name: "Каталог", href: "/products" },
  { name: "Категорії", href: "/categories" },
  { name: "Новинки", href: "/products?sortBy=createdAt&sortOrder=desc" },
  { name: "Зворотний зв'язок", href: "/feedback" },
];
```

In `src/app/sitemap.ts`, after the `/cart` entry in `staticPages`:

```ts
    {
      url: `${baseUrl}/feedback`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
```

In `.env.example`, directly under the `EMAIL_FROM` line:

```
# Feedback form recipient (TASK-058). Interim: the Resend account owner's
# address until TASK-056's client round-trip supplies the real one.
FEEDBACK_EMAIL=""
```

- [ ] **Step 7: Extend content + footer tests**

Append to `tests/unit/content.test.ts` (add `import { feedback } from "@/content/feedback";` next to the other content imports):

```ts
describe("feedback content", () => {
  it("maps both feedback API outcome codes to Ukrainian", () => {
    expect(Object.keys(feedback.byCode).sort()).toEqual(["SEND_FAILED", "VALIDATION_ERROR"]);
  });
});
```

In `tests/unit/footer.test.tsx`, add to the "uses the Ukrainian copyright-row link labels" test:

```ts
expect(screen.getByRole("link", { name: "Зворотний зв'язок" })).toHaveAttribute(
  "href",
  "/feedback"
);
```

- [ ] **Step 8: Run the tests**

Run: `npx vitest run tests/unit/feedback-form.test.tsx tests/unit/content.test.ts tests/unit/footer.test.tsx`
Expected: PASS (4 new form tests + 1 new content test + extended footer test; no pre-existing failures).

- [ ] **Step 9: Commit**

```bash
git add src/content/feedback.ts "src/app/(shop)/feedback" src/components/common/Footer.tsx src/app/sitemap.ts .env.example tests/unit/feedback-form.test.tsx tests/unit/content.test.ts tests/unit/footer.test.tsx
git commit -m "feat(shop): /feedback page + form, footer link, sitemap entry (TASK-058)"
```

---

### Task 6: Marquee CSS + reduced-motion reset rejoin

**Files:**

- Modify: `src/app/globals.css` (marquee classes after `.animate-fade-up` ~line 474; overrides inside the `@media (prefers-reduced-motion: reduce)` block ~line 501)
- Test: `tests/unit/marquee-css.test.ts` (create)

**Interfaces:**

- Consumes: nothing (pure CSS).
- Produces: `.animate-marquee` (the track class — owns ALL track layout) and `.marquee-duplicate` (marker for the second copy). Task 7's component uses exactly these two class names.

- [ ] **Step 1: Write the failing source-level test**

Create `tests/unit/marquee-css.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// G8 TASK-059: the marquee must rejoin the repo's reduced-motion reset —
// a surface override that isn't named in the reset silently keeps animating
// for reduced-motion users. jsdom can't see compiled CSS, so this asserts
// against the source; the visual gate checks the compiled output.
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const reduceIdx = css.indexOf("@media (prefers-reduced-motion: reduce)");
const beforeReduce = css.slice(0, reduceIdx);
const afterReduce = css.slice(reduceIdx);

describe("marquee CSS", () => {
  it("still has the reduced-motion block (guards the slices below from vacuity)", () => {
    expect(reduceIdx).toBeGreaterThan(-1);
  });

  it("defines the marquee animation before the reduced-motion reset", () => {
    expect(beforeReduce).toContain("@keyframes mirox-marquee");
    expect(beforeReduce).toMatch(/\.animate-marquee\s*\{[^}]*animation:\s*mirox-marquee/);
  });

  it("pauses on hover and keyboard focus", () => {
    expect(beforeReduce).toMatch(
      /\.animate-marquee:hover,\s*\.animate-marquee:focus-within\s*\{[^}]*animation-play-state:\s*paused/
    );
  });

  it("rejoins the reduced-motion reset", () => {
    expect(afterReduce).toMatch(/\.animate-marquee\s*\{[^}]*animation:\s*none/);
    expect(afterReduce).toMatch(/\.marquee-duplicate\s*\{[^}]*display:\s*none/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/marquee-css.test.ts`
Expected: FAIL on tests 2–4 (test 1 passes — the reduce block exists today).

- [ ] **Step 3: Add the CSS**

In `src/app/globals.css`, directly after the `.animate-fade-up` rule (~line 474), add:

```css
/* Marquee (G8 TASK-059): the track holds two copies of the content; each
     copy carries its own trailing padding (pr-12 on the copy, NOT gap on the
     track) so translateX(-50%) lands exactly on the second copy's start and
     the loop is seamless. ALL track layout lives here rather than in
     Tailwind utilities on the element, so the reduced-motion override below
     wins by source order instead of fighting utility-class order. */
@keyframes mirox-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
.animate-marquee {
  display: flex;
  width: max-content;
  white-space: nowrap;
  animation: mirox-marquee 30s linear infinite;
}
.animate-marquee:hover,
.animate-marquee:focus-within {
  animation-play-state: paused;
}
```

Inside the existing `@media (prefers-reduced-motion: reduce)` block (after the `.hover-lift` overrides), add:

```css
.animate-marquee {
  animation: none;
  width: auto;
  white-space: normal;
  justify-content: center;
}
.marquee-duplicate {
  display: none;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/marquee-css.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css tests/unit/marquee-css.test.ts
git commit -m "feat(ui): marquee animation rejoining the reduced-motion reset (TASK-059)"
```

---

### Task 7: `SiteAnnouncement` shape + AnnouncementBar marquee variant

**Files:**

- Modify: `src/content/site.ts` (announcement field + new interface + dismiss label)
- Modify: `src/components/common/AnnouncementBar.tsx` (id-scoped key, link wrap, marquee variant)
- Test: `tests/unit/announcement-bar.test.tsx` (rewrite), `tests/unit/content.test.ts` (one more assertion)

**Interfaces:**

- Consumes: `.animate-marquee` / `.marquee-duplicate` classes (Task 6); `/feedback` route (Task 5).
- Produces: `export interface SiteAnnouncement { id: string; text: string; href: string | null; marquee: boolean }`; `site.announcement: SiteAnnouncement | null`; `site.announcementDismiss: string`. The bar goes LIVE site-wide in this task (the shop layout already mounts it).

- [ ] **Step 1: Rewrite the component tests (failing first)**

Replace the full contents of `tests/unit/announcement-bar.test.tsx` with:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SiteAnnouncement } from "@/content/site";

const mockSite = {
  announcement: null as SiteAnnouncement | null,
  announcementDismiss: "Приховати оголошення",
};
vi.mock("@/content/site", () => ({
  get site() {
    return mockSite;
  },
}));

import { AnnouncementBar } from "@/components/common/AnnouncementBar";

const LAUNCH: SiteAnnouncement = {
  id: "launch-2026-08",
  text: "Ми відкрилися! Розкажіть нам про проблеми",
  href: "/feedback",
  marquee: true,
};

beforeEach(() => {
  window.localStorage.clear();
  mockSite.announcement = { ...LAUNCH };
});

afterEach(() => {
  window.localStorage.clear();
});

describe("AnnouncementBar", () => {
  it("renders nothing when no announcement is configured", () => {
    mockSite.announcement = null;
    const { container } = render(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links the announcement text to its href", () => {
    render(<AnnouncementBar />);
    expect(screen.getByRole("link", { name: LAUNCH.text })).toHaveAttribute("href", "/feedback");
  });

  it("renders an aria-hidden, link-free duplicate for the marquee loop", () => {
    const { container } = render(<AnnouncementBar />);
    expect(container.querySelector(".animate-marquee")).not.toBeNull();
    const dupe = container.querySelector(".marquee-duplicate");
    expect(dupe).not.toBeNull();
    expect(dupe!.getAttribute("aria-hidden")).toBe("true");
    // The copy is visual-only: a second link would add a hidden tab stop.
    expect(dupe!.querySelector("a")).toBeNull();
  });

  it("renders the static centered variant without a duplicate when marquee is off", () => {
    mockSite.announcement = { ...LAUNCH, marquee: false };
    const { container } = render(<AnnouncementBar />);
    expect(container.querySelector(".animate-marquee")).toBeNull();
    expect(container.querySelector(".marquee-duplicate")).toBeNull();
    expect(screen.getByText(LAUNCH.text)).toBeInTheDocument();
  });

  it("stays hidden when the id-scoped dismissal key is set", () => {
    // Non-vacuous only because AnnouncementBar reads the real snapshot
    // (useSyncExternalStore's getSnapshot) on this very first render pass
    // under RTL's non-hydrating render().
    window.localStorage.setItem("mirox:announcement-dismissed:launch-2026-08", "1");
    const { container } = render(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("ignores a different announcement's dismissal (id scoping)", () => {
    window.localStorage.setItem("mirox:announcement-dismissed:old-promo", "1");
    render(<AnnouncementBar />);
    expect(screen.getByRole("link", { name: LAUNCH.text })).toBeInTheDocument();
  });

  it("dismisses via the UA-labelled control and persists under the id-scoped key", () => {
    render(<AnnouncementBar />);

    fireEvent.click(screen.getByRole("button", { name: "Приховати оголошення" }));

    expect(screen.queryByText(LAUNCH.text)).not.toBeInTheDocument();
    expect(window.localStorage.getItem("mirox:announcement-dismissed:launch-2026-08")).toBe("1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/announcement-bar.test.tsx`
Expected: FAIL — component still renders `site.announcement` as a string / old key / EN aria-label.

- [ ] **Step 3: Update `src/content/site.ts`**

Add the interface next to the other exported interfaces:

```ts
export interface SiteAnnouncement {
  /** Dismissal-key suffix — bump to resurface for users who dismissed a prior announcement. */
  id: string;
  text: string;
  /** Optional link target; wraps the announcement text in a Link when set. */
  href: string | null;
  /** Scrolling marquee vs the static centered bar. */
  marquee: boolean;
}
```

Replace ONLY the `announcement: null as string | null,` line (keep the whole retraction comment above it, and append one paragraph to that comment):

```ts
   * [existing retraction comment stays verbatim] …
   *
   * The launch announcement below is NOT a client promo claim — it announces
   * our own feedback form (G8 TASK-059), so it doesn't conflict with the
   * retraction rule above. Promo copy still needs client confirmation.
   */
  announcement: {
    id: "launch-2026-08",
    text: "Ми відкрилися! Новий сайт Mirox уже працює. Помітили проблему або маєте пропозицію — розкажіть нам через форму зворотного зв'язку →",
    href: "/feedback",
    marquee: true,
  } as SiteAnnouncement | null,

  /** Accessible label for the announcement dismiss control. */
  announcementDismiss: "Приховати оголошення",
```

- [ ] **Step 4: Rework `AnnouncementBar.tsx`**

Replace the component file with (preserving the existing explanatory comments where they still apply — the `useSyncExternalStore` rationale, the listeners Set rationale, the SSR-snapshot rationale, and the not-sticky JSDoc are all still true):

```tsx
"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { site } from "@/content/site";

// Dismissal is id-scoped (G8): a new announcement (new id) resurfaces for
// users who dismissed a previous one. Computed per call, not module scope —
// the content module is mocked per-test, and a module-scope key would freeze
// the first mock's id.
function dismissedKey(): string {
  return `mirox:announcement-dismissed:${site.announcement?.id ?? ""}`;
}

const listeners = new Set<() => void>();

function subscribeDismissed(onChange: () => void) {
  listeners.add(onChange);

  function onStorage(event: StorageEvent) {
    if (event.key === dismissedKey()) onChange();
  }
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getDismissedSnapshot(): boolean {
  return window.localStorage.getItem(dismissedKey()) === "1";
}

function getDismissedServerSnapshot(): boolean {
  return true;
}

function dismiss() {
  window.localStorage.setItem(dismissedKey(), "1");
  listeners.forEach((listener) => listener());
}

export function AnnouncementBar() {
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getDismissedServerSnapshot
  );

  const announcement = site.announcement;
  if (!announcement || dismissed) return null;

  const inner = announcement.href ? (
    <Link href={announcement.href} className="underline-offset-4 hover:underline">
      {announcement.text}
    </Link>
  ) : (
    announcement.text
  );

  return (
    <div className="bg-background text-foreground">
      <div className="container flex items-center gap-4 py-2">
        {announcement.marquee ? (
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="animate-marquee">
              <span className="pr-12 text-xs tracking-wide">{inner}</span>
              {/* Visual-only copy for the seamless loop: aria-hidden and
                  link-free so it adds no tab stop or duplicate accname. */}
              <span className="marquee-duplicate pr-12 text-xs tracking-wide" aria-hidden="true">
                {announcement.text}
              </span>
            </div>
          </div>
        ) : (
          <p className="flex-1 text-center text-xs tracking-wide">{inner}</p>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={site.announcementDismiss}
          className="text-muted-foreground hover:text-foreground -m-2 p-2 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

(When writing the real file, carry over the original long-form comments from the current file for the `listeners` Set, the `storage` event, and the server snapshot — they explain non-obvious constraints that still hold. This plan omits them only for brevity; the file must keep them.)

- [ ] **Step 5: Document the launch value in the content test**

In `tests/unit/content.test.ts`, add to the existing "site content" describe:

```ts
it("points the launch announcement at the feedback form as a marquee", () => {
  expect(site.announcement?.href).toBe("/feedback");
  expect(site.announcement?.marquee).toBe(true);
  expect(site.announcement?.id).toBeTruthy();
});
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/unit/announcement-bar.test.tsx tests/unit/content.test.ts`
Expected: PASS (7 bar tests + extended content tests).

- [ ] **Step 7: Sweep for the strings this task removed** ([[string-renames-must-sweep-locator-types]])

```bash
grep -rn "Dismiss announcement" src tests
grep -rn "mirox:announcement-dismissed" src tests | grep -v "announcement-dismissed:"
grep -rn "announcement" tests/e2e
```

Expected: first two return nothing (the un-scoped key literal and EN label are gone everywhere); third returns nothing today — if any e2e selector matches, fix it in this task. Also skim `tests/e2e/navigation.spec.ts` for `getByRole("link", …)`/`getByText` selectors that the new always-present top-bar link («…форму зворотного зв'язку →», href `/feedback`) could now double-match; add `.first()` scoping only where an actual collision exists.

- [ ] **Step 8: Commit**

```bash
git add src/content/site.ts src/components/common/AnnouncementBar.tsx tests/unit/announcement-bar.test.tsx tests/unit/content.test.ts
git commit -m "feat(shop): launch marquee via SiteAnnouncement shape, id-scoped dismissal (TASK-059)"
```

---

### Task 8: Full verification + visual gate + PR

**Files:** none created — verification only (fixes land as follow-up commits).

- [ ] **Step 1: Full local CI-equivalent**

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test:run
```

Expected: all green; unit total grows from 701 | 1 todo by the ~29 new tests. Fix anything red before proceeding.

- [ ] **Step 2: E2E spot-check (chromium, navigation spec)**

The marquee now renders on every storefront page in E2E. If the local stack (Postgres + seeded data, dev/prod server on the configured port) is available:

```bash
npx playwright test tests/e2e/navigation.spec.ts --project=chromium
```

Expected: PASS. If the local stack cannot run E2E, say so explicitly in the PR body and watch the CI E2E job — do not claim the spec passed locally ([[local-failure-masks-later-assertions]]).

- [ ] **Step 3: Visual gate (standing prevention — dev server, NOT local `next build`)**

Start `npm run dev` (port 3001) and capture with the browser tooling:

1. Homepage desktop (~1440px): marquee scrolling above the header, dismiss X visible.
2. Homepage mobile (~390px): marquee legible, no horizontal page scroll.
3. `/feedback` desktop + mobile: heading, three fields, hint text, submit button.
4. Reduced-motion emulation (DevTools → prefers-reduced-motion: reduce): bar is static and centered, duplicate copy not visible.
5. In the served CSS (DevTools → Sources → the compiled stylesheet), confirm `.animate-marquee` has `animation: none` inside the reduce media block — compiled output, not just source ([[surface-override-must-rejoin-reduced-motion-reset]]).
6. Click through: marquee link → `/feedback`; submit the form (dev mode logs "Skipping email send" — expected); dismiss the marquee and confirm it stays hidden on reload.

Present the screenshots to the user for sign-off. **Do not push before sign-off.**

- [ ] **Step 4: User actions to request alongside sign-off**

- Add `FEEDBACK_EMAIL=<owner address>` to the Vercel project env (Production; Preview optional) — without it every prod submission returns 500 by design.
- Optionally set `FEEDBACK_EMAIL` + `RESEND_API_KEY` in local `.env` and send one real submission end-to-end to the owner inbox.

- [ ] **Step 5: Push + PR (after sign-off)**

```bash
git push -u origin feat/task-058-059-launch-feedback-loop
gh pr create --title "feat: launch feedback loop — /feedback form + announcement marquee (G8, TASK-058/059)" --body "<summary + test plan + FEEDBACK_EMAIL env note + CI-E2E watch note>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

Remote is `GoodAlex223/dropshipping-test` ([[github-repo-name-differs-from-directory]]). After CI: verify which jobs _executed_, not the badge ([[merge-readiness-needs-check-runs]]). Then the repo's review process (/code-review) runs per standing convention.

---

## Post-merge close-out checklist (repo Task Completion policy — runs after user approval + review)

1. BACKLOG intake: 🟤 per-IP rate limiting for public POST endpoints (feedback + newsletter subscribe); 🟤 TASK-056 rider — swap `FEEDBACK_EMAIL` to the client's real address in the pre-launch round-trip.
2. WEEKLY G8: both task checkboxes + Summary/Daily statuses → `✅ PR #N`; TODO.md TASK-058/059 → DONE.md with plan link.
3. Archive this plan to `docs/archive/plans/` and update `docs/README.md` if its index references live plans.
4. CLAUDE.md propagation check: architecture tree gains `/feedback` + `api/feedback` + `content/feedback.ts` + `email-templates/feedback.ts`; `.env` docs mention `FEEDBACK_EMAIL`.
5. Memory capture: any durable lessons from execution.

## Progress Log

- 2026-08-11: Plan written from the approved spec (design approved same day; branch + spec committed `b863afc`).
