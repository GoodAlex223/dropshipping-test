# Launch Feedback Loop — Design (G8: TASK-058 + TASK-059)

**Date**: 2026-08-11
**Status**: Approved (user, 2026-08-11 — fields, marquee scope, form host, and both design sections)
**Source**: WEEKLY G8 (2026-08-11 manual-testing intake) · TODO.md TASK-058/TASK-059
**Branch**: `feat/task-058-059-launch-feedback-loop`

## Goal

Give launch visitors a way to report problems (TASK-058: site-wide feedback form) and tell
them about it (TASK-059: launch-announcement marquee linking to the form). The marquee links
to the form — the two ship together by design.

## User rulings (2026-08-11)

1. **Form fields**: message required; email and name optional. When email is provided, the
   notification email sets `Reply-To` to it.
2. **Marquee scope**: all storefront pages (the existing AnnouncementBar slot in
   `(shop)/layout.tsx`), not homepage-only.
3. **Form host**: dedicated `/feedback` page (not a dialog; `/contact` stays with
   client-blocked TASK-055) + a permanent footer link.
4. Both design sections approved as presented.

## TASK-058 — Feedback form

### Page

- `src/app/(shop)/feedback/page.tsx` — server component, metadata via the seo helpers,
  renders heading/description + the form. `/feedback` joins `sitemap.ts`.
- `src/app/(shop)/feedback/feedback-form.tsx` — `"use client"`, co-located
  (`login-form.tsx` pattern). Plain `useState` form state (`NewsletterSignup` pattern —
  no react-hook-form for a 3-field form).
- Fields: name (optional, ≤100), email (optional, validated when present, ≤254),
  message (required, 5–2000), plus a visually-hidden `website` honeypot input
  (`autocomplete="off"`, `tabIndex={-1}`, `aria-hidden`).
- Success replaces the form with a monochrome confirmation box (`NewsletterSignup`
  success treatment). Errors map API `code` → UA via the content module; network/unknown
  errors use the fallback string.
- Footer: add `{ name: "Зворотний зв'язок", href: "/feedback" }` to `shopLinks`
  (satisfies its "only routes that actually exist" rule — the route ships in the same PR).

### API

- `POST /api/feedback` (`src/app/api/feedback/route.ts`), no auth (guest-capable).
- `feedbackSchema` in `src/lib/validations/index.ts`: trims all fields; empty-string
  email/name normalize to undefined.
- Outcomes (G2/G4 coded-outcome convention; prose stays English):
  - `201` + `{ code: "FEEDBACK_SENT" }` on success **and** on a filled honeypot
    (silent drop — send is skipped, bots see success).
  - `400` + `VALIDATION_ERROR` on schema failure.
  - `500` + `SEND_FAILED` when the send fails or reports failure — the email **is** the
    deliverable here (deliberately unlike the newsletter route, which ignores send
    results), so a failed send must not report success.
- The send is `await`ed (PR #34 serverless-freeze lesson).

### Email

- `sendFeedbackEmail({ name?, email?, message })` in `src/lib/email.ts`, using the
  existing `sendWithTimeout` 10s race.
- Recipient: new **`FEEDBACK_EMAIL`** env var. Interim value = the owner's address (set in
  Vercel env, never hardcoded in the repo — works today because Resend's test sender
  delivers to the account owner's inbox, and the owner _is_ the recipient). TASK-056's
  pre-launch client round-trip swaps it to the client's real address. `.env.example` gains
  a documented entry.
- Config failure is loud: if Resend is configured but `FEEDBACK_EMAIL` is unset →
  `success: false` → route returns `500 SEND_FAILED`. If Resend itself is unconfigured
  (local dev), keep the existing log-and-skip behavior.
- `replyTo`: submitter's email when provided.
- Template `src/lib/email-templates/feedback.ts`: shared dark shell
  (`renderEmailShell`/`renderPanel`), rows for Ім'я / Email / Повідомлення (name/email
  rows render only when present), `escapeHtml` on all three user strings. Subject +
  body copy in `src/content/emails.ts` (imports only `brand.ts` — lucide-free contract).

### Spam stance

Honeypot + Zod length caps only for launch. No rate limiting — none exists repo-wide and
the failure domain is the owner's inbox. A 🟤 BACKLOG entry is filed at task completion for
per-IP rate limiting across public POST endpoints (feedback + newsletter subscribe share
the gap).

## TASK-059 — Launch marquee

### Content shape (`src/content/site.ts`)

```ts
export interface SiteAnnouncement {
  /** Dismissal-key suffix — bump to resurface for users who dismissed a prior announcement. */
  id: string;
  text: string;
  /** Optional link target; wraps the marquee/static text in a Link when set. */
  href: string | null;
  /** Scrolling marquee vs the static centered bar. */
  marquee: boolean;
}
announcement: SiteAnnouncement | null;
```

Launch value: `{ id: "launch-2026-08", text: <copy below>, href: "/feedback", marquee: true }`.
The retraction note on the old `announcement: null` field (free-shipping claim) stays in the
file — it documents why promo copy needs client confirmation; the launch announcement is not
a client claim and doesn't conflict with it.

### Component (`AnnouncementBar.tsx`)

- Dismissal keeps the `useSyncExternalStore` wiring; the localStorage key becomes
  id-scoped: `mirox:announcement-dismissed:${announcement.id}` (storage-event filter uses
  the computed key). No migration concern — `announcement` has been null since TASK-035,
  so no real user holds the old key.
- **Static variant** (`marquee: false`): today's centered rendering; text wrapped in a
  `next/link` when `href` is set.
- **Marquee variant**: overflow-hidden track; content rendered twice (second copy
  `aria-hidden="true"`) for a seamless loop; track animated by a new `.animate-marquee`
  class; pause on hover/focus via `animation-play-state: paused`. The whole text is the
  link. Dismiss button sits outside the track, always static — the WCAG 2.2.2
  hide mechanism for auto-starting moving content (hover-pause adds a pause mechanism).
- The dismiss button's `aria-label` (currently inline English "Dismiss announcement")
  moves into the content layer as a UA string in this touch.

### Animation + reduced motion

- Keyframes `mirox-marquee` (`translateX(0)` → `translateX(-50%)`, linear, infinite,
  ~30s) and `.animate-marquee` defined directly in `globals.css` next to
  `mirox-fade-up` — **not** as Tailwind arbitrary values (the v4 nested-comma no-op trap).
- Inside the existing `@media (prefers-reduced-motion: reduce)` block, the marquee
  **rejoins the reset**: `.animate-marquee { animation: none }`, the duplicate copy
  hidden (`display: none`), the track re-centered — reduced-motion users get the static
  centered bar. Pure CSS; no JS `matchMedia`.
- Verification is two-layer: a unit test asserts against the `globals.css` **source**
  (`no-bright-colors.test.ts` style) that `.animate-marquee` appears inside the
  reduce block; the visual gate checks the **compiled** CSS + rendered page
  (standing memory: verify compiled CSS, order matters).

### Launch copy (UA, draft — final wording open to user edit at spec review)

- Marquee text: «Ми відкрилися! Новий сайт Mirox уже працює. Помітили проблему або маєте
  пропозицію — розкажіть нам через форму зворотного зв'язку →»
- `/feedback` page title: «Зворотний зв'язок»; description: «Ми щойно запустили новий
  сайт. Якщо щось не працює, виглядає дивно або у вас є ідея — напишіть нам. Ми читаємо
  кожне повідомлення.»
- Success: «Дякуємо! Ваше повідомлення надіслано.» + «Якщо ви залишили email, ми
  відповімо найближчим часом.»
- Email subject: «Новий відгук із сайту» (store name resolved at render via
  `getStoreName()` where the template needs it).

## Gate revisions (user rulings, 2026-08-12 visual gate)

The live-gate review approved copy, scroll speed, click-through, dismissal, and the email
template, and ruled three design changes:

1. **The bar sticks with the header** — supersedes the component's original
   "deliberately NOT sticky" decision (TASK-035 era). Mechanism: the shop layout wraps
   `<AnnouncementBar /><Header />` in one `sticky top-0 z-50` wrapper; the `<header>`
   element drops its own `sticky top-0 z-50`. The mobile-viewport cost is user-accepted.
2. **Full horizontal length** — the marquee track spans the window width (the `container`
   constraint is removed from the bar), dismiss ✕ stays at the right edge.
3. **Visually distinct link** — `SiteAnnouncement` gains `linkLabel: string | null`. When
   `href` + `linkLabel` are set, the text renders plain and the label renders as an
   underlined link (the arrow lives in the label, so it no longer points at empty space).
   `linkLabel: null` + `href` keeps the whole-text-link behavior. Launch copy splits into:
   text «Ми відкрилися! Новий сайт Mirox уже працює. Помітили проблему або маєте
   пропозицію?» + linkLabel «Розкажіть нам через форму зворотного зв'язку →».

Round 2 (same gate, second pass) added two more rulings:

4. **The bar sits BELOW the header** — order swapped inside the sticky wrapper
   (`<Header /><AnnouncementBar />`); the bar gains its own `border-b` to separate from
   page content.
5. **CTA underline is a reaction, not a resting state** — no underline at rest
   (`font-medium` carries the distinction); underline appears on hover, keyboard focus,
   and click. The trailing arrow is removed from the label (it read as pointing at
   nothing): linkLabel = «Розкажіть нам через форму зворотного зв'язку».

Round 3 superseded ruling 5's underline half:

6. **CTA underlined at rest** — the hover-only underline still read as "not underlined"
   (the user reviews static screenshots, where hover can't show). Superseded by ruling 7.

Round 4 superseded the underline treatment entirely:

7. **CTA is an inverted pill button** — at 12px the typographic underline never read as a
   link. Final state: the label renders as a monochrome pill (`bg-foreground
text-background`, fully rounded, `font-semibold`, dims to 80% on hover) — the
   hero-button visual language, unmistakably clickable at rest with a visible hover
   reaction. Arrow stays removed; copy unchanged.

Round 5 (pill approved) surfaced two functional rulings on wide screens:

8. **Every visible copy is clickable** — the aria-hidden loop duplicate was link-free, so
   when two copies fit on screen the second pill was dead. Duplicates become real links
   with `tabIndex={-1}` + `aria-hidden` (mouse-clickable; still exactly one tab stop and
   one accessible link).
9. **Gap-free stream at any width** — two copies leave a right-edge void whenever one copy
   is narrower than the viewport. The track measures itself (ResizeObserver) and renders
   `ceil(viewport / copyWidth) + 1` copies (min 2), animating by the measured copy width
   via a `--marquee-shift` custom property (keyframes fall back to the old −50% before
   measurement), duration scaled to keep ~30 px/s.

Gate screenshots are delivered as a private Artifact page from round 2 onward — chat-inline
images didn't reach the user.

## Error handling summary

| Failure                                    | Behavior                                        |
| ------------------------------------------ | ----------------------------------------------- |
| Invalid body                               | `400 VALIDATION_ERROR` → UA field-check message |
| Honeypot filled                            | `201 FEEDBACK_SENT`, no send                    |
| Resend send error / timeout                | `500 SEND_FAILED` → UA "try later" message      |
| `FEEDBACK_EMAIL` unset (Resend configured) | `500 SEND_FAILED` (loud misconfiguration)       |
| Resend unconfigured (local dev)            | log-and-skip, `201` (existing dev convention)   |

## Testing

- **New** `tests/unit/feedback-api.test.ts` (module-level mocks of `@/lib/email`;
  `createNextRequest` helper): validation 400s (missing/short/long message, bad email),
  201 + send called with normalized payload, honeypot → 201 + send **not** called,
  send failure → 500, `FEEDBACK_EMAIL` handling via the env-test pattern
  (originalEnv save/restore).
- **Extend** `tests/unit/email-templates.test.ts`: feedback template escaping
  (`<script>` in name/message), conditional name/email rows, subject.
- **Extend** `tests/unit/announcement-bar.test.tsx`: null → nothing (kept); static +
  link; marquee duplicate `aria-hidden`; id-scoped dismissal key; dismissed → nothing.
- **New source-level CSS assertion**: `.animate-marquee` present inside the
  reduced-motion reset block of `globals.css` (guard with teeth — asserts non-vacuity).
- **Visual gate** (standing prevention): dev-server screenshots, desktop + mobile, of
  the marquee and `/feedback` page; user sign-off before PR.

## Out of scope (deliberate)

- No DB persistence / admin feedback page — email-only per WEEKLY G8 scope.
- No rate limiting (BACKLOG'd), no CAPTCHA, no GA4 form events.
- No i18n wiring — copy ships through `src/content/feedback.ts` + `emails.ts`; G9
  externalizes it with everything else (the designed trade, not drift).
- No admin-managed announcement (TASK-047 owns that).
- `?from=` page-context capture rejected at design (user chose plain page).

## Extraction candidates (file at task completion)

- 🟤 Per-IP rate limiting for public POST endpoints (feedback + newsletter subscribe).
- 🟤 TASK-056 rider: swap `FEEDBACK_EMAIL` to the client's real address during the
  pre-launch round-trip.
