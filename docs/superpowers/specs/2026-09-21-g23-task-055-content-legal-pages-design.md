# G23 — TASK-055 Content, Legal & Contact Pages — Design

**Date**: 2026-09-21
**Status**: Approved (brainstorm 2026-09-21; user approved the design in one pass)
**Group**: WEEKLY 2026-09-21 G23 "TASK-055 Content, Legal & Contact Pages [batch] 🏆" (10 SP, Mon–Wed)
**Reference**: [`Mirox Contacts.dc.html`](../../design/design_handoff_mirox/Mirox%20Contacts.dc.html) (the only one of the seven pages with a design), [design spec §4](../../design/design_handoff_mirox/mirox-design-spec.md) «Контакти / инфо»
**Gates**: [Ukraine payments & delivery decision](2026-07-16-ukraine-payments-delivery-decision.md) §5.0 Gate 0 and §5.3 item 9 — «public offer + return policy published» is a prerequisite for **every** gateway, and blocks TASK-048
**Client inputs**: TASK-056 rows 4 (contacts), 14 (branded-goods posture), 15 (copy delegated to us), 16 (socials + reviews channel), 17 (claim figures)
**Backlog inputs**: 🔵 "Developer credit on the site" [2026-09-16] (promoted → member 5), 🟤 "Telegram-manager link in the WhatsApp slot" [2026-09-16] (subsumed → member 3, with a deviation — see §6)

---

## 1. Problem

Seven routes are referenced by the storefront's chrome and do not exist. `Footer.tsx`'s `shopLinks`
carries a comment naming them explicitly; the 2026-07-28 user ruling hid the header/footer info
links rather than ship dead links, and that ruling stands until these pages are live.

Three of the seven — `/terms` (публічна оферта), `/privacy`, `/returns` — are not content work but
**onboarding prerequisites**: no Ukrainian card gateway will approve a merchant whose site does not
publish a public offer and a return policy (§5.0, §5.3 item 9). They gate TASK-048.

The copy was blocked on the client until 2026-09-16, when the client delegated it wholesale
(«вирішуйте самі», TASK-056 row 15). We now draft all seven pages ourselves; the client reviews
before publish.

**What the delegation did not supply: facts.** In particular there is no legal identity anywhere in
the repo — `grep` across `src/` and `messages/` returns zero hits for `ФОП`, `ЄДРПОУ`, `оферт`.
§3 of this spec is the answer to that gap.

## 2. Scope

**In:** seven routes under `(shop)`; their UA copy; the `pages` catalog namespace; legal-identity
gating; manager-contact single-sourcing; header nav entry; footer restructure; developer credit;
per-page metadata + sitemap rows; tests; the client review package.

**Out:** RU translations of the new copy (§4 — the deep-merge fallback renders UA, by decision);
TASK-048 itself; any phone number or postal address (TASK-056 row 4 — not supplied, not invented);
any third-party brand name or authenticity claim (row 14).

## 3. Legal identity — null-gated requisites

**Decision (brainstorm Q1):** ship the legal pages now with the seller identity null-gated, exactly
as `WHATSAPP_HREF` and `checkout.payment.prepay` already work. Absent data renders an honest
fallback, never a placeholder and never an invention.

```ts
// src/content/legal.ts
export interface LegalEntity {
  /** «ФОП» | «ТОВ» — drives the requisites heading and the offer's party clause. */
  form: "ФОП" | "ТОВ";
  /** Full registered name, e.g. «ФОП Прізвище Ім'я По-батькові». */
  name: string;
  /** ЄДРПОУ (ТОВ) or ІПН/РНОКПП (ФОП). */
  edrpou: string;
  /** Registered address as it appears in the register. */
  address: string;
  /** Optional: official contact e-mail, once a real domain exists. */
  email?: string;
}

/**
 * CLIENT-SUPPLIED, PENDING (TASK-056 — asked 2026-08-21, not answered; the
 * 2026-09-16 reply delegated copy, not facts).
 *
 * null is a supported production state, not a TODO: <SellerRequisites/>
 * renders the brand + manager-contact fallback instead of a requisites table,
 * so /terms, /privacy and /returns publish today and light up with no code
 * change the moment the client registers.
 */
export const LEGAL_ENTITY: LegalEntity | null = null;

/** USER-APPROVED 2026-07-28. Matches ЗУ «Про захист прав споживачів» ст. 9 (14 days). */
export const RETURN_WINDOW_DAYS = 14;
```

`<SellerRequisites/>` (server component) renders:

- **filled** → a definition list: form + name, ЄДРПОУ/ІПН, address, contact;
- **null** → «Продавець: Mirox Shop» + the manager Telegram link + a link to `/feedback`.

Mounted on `/terms`, `/privacy` and `/returns`. The copy in those pages is written so that both
branches read as complete prose — no sentence is left dangling by the null branch.

**Why not the alternatives.** Visible `[ЗАПОВНИТИ]` markers would ship placeholder text to
production, which TASK-055 AC 1 forbids outright. Holding the legal three would leave three footer
links dead — the exact condition the 2026-07-28 ruling exists to prevent — and would not lift the
§5.3 item 9 gate.

## 4. Content model — catalog namespace, stripped from the client payload

**Decision (brainstorm Q2):** the copy lives in `messages/uk.json` under a new `pages` namespace,
and that namespace is **stripped from `clientMessages`** alongside `admin`.

**The measurement that drove this.** `src/app/layout.tsx` serializes the entire non-admin catalog
into `NextIntlClientProvider` on every storefront page — **28,620 bytes** today (`admin` is already
stripped, 33,929 bytes). Seven long-form legal pages added to the client payload would roughly
triple that, on the homepage, PDP and checkout alike, for text almost no visitor opens. The repo
already owns the fix; this is a one-expression change:

```ts
// src/app/layout.tsx — the existing admin strip, widened
/** Namespaces never shipped to the storefront client bundle. See the payload guard. */
const STOREFRONT_EXCLUDED_NAMESPACES: readonly string[] = ["admin", "pages"];
const clientMessages = Object.fromEntries(
  Object.entries(messages).filter(
    ([namespace]) => !STOREFRONT_EXCLUDED_NAMESPACES.includes(namespace)
  )
) as typeof messages;
```

All seven pages are Server Components and read the namespace with `await getTranslations`, which
sees the **full** server-side catalog regardless of the client strip. No page in this group has a
client component, so — unlike the `(admin)` route group — there is nothing to re-provide.

**Catalog shape**, per page:

```jsonc
"pages": {
  "terms": {
    "meta": { "title": "…", "description": "…" },
    "title": "Публічна оферта",
    "intro": "…",
    "sections": [
      { "heading": "1. Загальні положення", "body": ["…", "…"] },
      { "heading": "2. Предмет договору",   "body": ["…"],  "list": ["…", "…"] }
    ]
  }
}
```

**Iteration without a cast.** `t.raw(key)` in next-intl 4.13.6 takes a **typed** key
(`NamespacedMessageKeys`) and returns the raw value, so `t.raw("sections")` yields the array with
typo protection intact on the key. This avoids the `as never` escape hatch and avoids the
manually-unrolled-literal-`t()` pattern `Footer.tsx` was forced into for its four benefits.

**RU:** no `ru.json` keys are added. `src/i18n/merge.ts`'s deep-merge falls RU back to the UA value
per key, so an RU-toggled visitor sees UA legal copy — the same UA-only-by-decision treatment the
`admin` namespace received on 2026-08-16, and the behaviour the weekly plan recommended.

## 5. Route architecture

Seven Server Components under `src/app/(shop)/`:

| Route       | Shell        | Notes                                            |
| ----------- | ------------ | ------------------------------------------------ |
| `/contact`  | bespoke      | per the handoff; the only designed page          |
| `/about`    | `StaticPage` | carries the developer-credit mention (§8)        |
| `/faq`      | `StaticPage` | Q/A rendered as heading + body pairs             |
| `/shipping` | `StaticPage` | Nova Poshta only (TASK-056 row 7 — no Ukrposhta) |
| `/returns`  | `StaticPage` | + `<SellerRequisites/>`; «14 днів»               |
| `/privacy`  | `StaticPage` | + `<SellerRequisites/>` as the data controller   |
| `/terms`    | `StaticPage` | + `<SellerRequisites/>`; the публічна оферта     |

Slugs are the ones already fixed by TODO.md and `Footer.tsx`'s comment — English paths, UA copy,
matching every other route in the app (`/track`, `/feedback`, `/products`).

`src/components/pages/StaticPage.tsx` is a Server Component taking a namespace and rendering
`title` / `intro` / `sections[]`. Six pages are ~15-line instances of it: a `generateMetadata()`
calling `await getTranslations("pages.<slug>.meta")`, then the shell.

**Why not a `[slug]` catch-all** (the fewest-files option): a catch-all under `(shop)` is fragile
against future real routes, makes per-page metadata awkward, and destroys static analysis of which
routes exist — which is precisely what the link-integrity guard in §10 depends on.

`/contact` reuses `StaticPage`'s heading block, then its own handoff layout: three social cards
(`SOCIALS`), «Доставка та оплата» and «Повернення» **summary** blocks each linking to the full
`/shipping` and `/returns` pages (so the overlap between these three pages is a deliberate
summary→detail relationship, not duplicated prose), the reviews channel `t.me/mirox_vidgyk`, the
manager link, the `/feedback` form entry point, and the «Про Mirox Shop» block with the two stat
cards fed from `site.claims` (kept per TASK-056 row 17, still rendered as the client's own claims —
and still never feeding `aggregateRating`).

## 6. Manager contact single-sourcing

Two new named slots in `src/content/brand.ts` (which must stay import-free — these are plain
string constants, so the contract holds):

```ts
/** Verified 2026-09-16 (TASK-056 row 4). The manager handle the client's reply names. */
export const MANAGER_TELEGRAM_HREF = "https://t.me/mirox_manager";
/** Verified 2026-09-16 (TASK-056 row 16). Shown on /contact only, per that row. */
export const REVIEWS_CHANNEL_HREF = "https://t.me/mirox_vidgyk";
```

Consumed by three surfaces: `/contact`, `src/content/checkout.ts`'s `contacts` (the payment-step
manager block), and `src/content/emails.ts`'s `contacts` (the order-email contact block). Today
both of the latter render «напишіть менеджеру» beside the _channel_ link `t.me/mirox_shop` and an
Instagram link, so the reply's п.5/п.6 statement names a handle the site never links.

**Deviation from the BACKLOG entry, recorded deliberately.** BACKLOG 🟤 [2026-09-16] proposed
putting the Telegram manager link _into the WhatsApp slot_. This design does not: `WHATSAPP_HREF`
stays `null` and the manager link gets its own slot. A Telegram URL rendered under a WhatsApp label
is a small untruth on checkout and on a transactional e-mail — the two surfaces where the site is
asking for trust — and the null-gating precedent exists to avoid exactly that class of thing. The
backlog entry is satisfied in intent (a manager link now reaches both surfaces) and its literal
mechanism is declined.

## 7. Navigation

**Header** (brainstorm Q4 — «Контакти» only): one entry appended to `Header.tsx`'s `navigation`
array, `{ key: "contacts", href: "/contact" }`. That array feeds both the desktop nav and the
mobile sheet, so it is the entire change. Header goes to 5 nav items, comfortably inside the `md`
bar.

Design spec §4 specifies a six-item nav («…Про нас, Доставка, Контакти»). We deviate: seven items
plus the logo and five action controls measures ≈920px of content in a 768px bar, which is the
overflow class G20 just fixed in the footer. Serving §4 literally would mean raising the nav
breakpoint to `lg` and taking the whole desktop nav away from 768–1023px tablets — a real
regression to satisfy a spec the header already deviates from (§4 also shows a wishlist icon that
does not exist). The footer becomes the complete info directory instead.

**Footer — restructure (scope increase, user-approved in the brainstorm).** `shopLinks` holds five
links in the copyright row, and that row already produced the G20 mobile-overflow bug at 390px
(five UA labels, 380px of content in 358px of container, fixed with `flex-wrap`). Adding seven more
would put **twelve** links in a row that could not hold five.

So: a **new nav band above the copyright row**, two labeled groups —

- «Магазин»: Каталог, Категорії, Новинки, Відстежити замовлення, Зворотний зв'язок (the existing five)
- «Інформація»: Про нас, Доставка, Повернення, Питання-відповіді, Контакти, Політика конфіденційності, Умови користування (the seven new)

— leaving the copyright row holding only the brand line and the developer credit. Grouped columns
on `lg`, stacked on mobile. Declare `grid-cols-1` explicitly (implicit tracks overflow on mobile —
recorded lesson).

## 8. Developer credit

Part of the verbal agreement (the site is built in exchange for the credit, portfolio use and
client reviews), not decoration.

- **Footer** — a third element in the copyright row, visually equal to the brand line:
  «Розроблено — GoodAlex223» linking `https://goodalex223.github.io`. The row is already
  `flex-wrap` after G20, so at 390px it becomes a third wrapped line rather than forcing the row
  wider. Label via the catalog (`footer.developerCredit`); URL a constant.
- **`/about`** — a short «Хто зробив цей сайт» mention with the same link.
- **`public/humans.txt`** — new file, standard format.
- **`<meta name="author">`** — added in `getDefaultMetadata()`.
- **`README.md`** — a credit line; repeated in the G27 handover doc when that ships.

E-mail is deliberately not rendered anywhere on the site: it is harvestable, and it is already
reachable from the linked personal site (user ruling, 2026-09-16).

## 9. SEO

Per-page `generateMetadata()` via `await getTranslations("pages.<slug>.meta")` — async, matching
the rule that async functions use `getTranslations`, never `useTranslations`. No page sets
`openGraph.images`, so the site-wide root `opengraph-image.tsx` card merges in (the
`mergeStaticMetadata` guard — setting images here would silently suppress it).

Seven rows added to `sitemap.ts`'s `staticPages`: `changeFrequency: "monthly"`, priority 0.5 for
`/contact` and `/about`, 0.3 for the rest.

`robots.ts` unchanged — all seven are public and should be indexed. (Note for the reviewer: the
disallow list contains `/track/` with a trailing slash; none of the new routes collide with it.)

## 10. Testing

Per-page rendering tests with `renderWithIntl` (which loads the full `uk.json`, so the §4 client
strip does not blind them), asserting each page renders its catalog title and every section
heading. Plus three guards that earn their place:

1. **Link integrity (unit).** Enumerate every internal `href` in `Header.tsx`'s `navigation` and
   the footer's two link groups; assert each resolves to an existing
   `src/app/(shop)/**/page.tsx`. This is the executable form of the no-dead-links rule, which has
   so far been a stated convention enforced by memory — and stated conventions are not controls.
   **It must be proved red** against a fabricated href before it is trusted.
2. **Payload guard (unit).** Assert `pages` is absent from the object handed to
   `NextIntlClientProvider`. Without it the §4 strip can silently regress and the ~100 KB returns
   invisibly. Must also be proved red by removing the namespace from the exclusion list. Assert
   against the exclusion list _and_ the resulting object, not `length > 0`.
3. **Mobile overflow (E2E).** Add the seven routes to `tests/e2e/mobile-overflow.spec.ts`. The
   footer restructure is precisely the G20 bug class, and this spec already exists for it.

Plus an **E2E link sweep**: visit every header and footer link, assert a 200 and a rendered `h1`.

`<SellerRequisites/>` gets both branches tested — `LEGAL_ENTITY` null and filled — since the null
branch is the one that actually ships.

## 11. Client review package & publish protocol

`docs/reference/<drafting-date>-task-055-copy-for-client.md` (dated the day the copy is
drafted, matching the `2026-08-21-client-ask.md` convention): the full UA copy of all seven pages as
paste-able prose in the messenger format the 2026-08-21 ask established, handed to the user to
send. It names the requisites (§3) explicitly as the one thing we cannot draft for them, and
carries the disclaimer in §12.

**Publish protocol (ruled 2026-09-16):** merge after the client's OK, **or** after three working
days of silence. Once live, tick the «published» half of decision-doc §5.3 item 9.

## 12. Legal disclaimer of record

An AI-drafted публічна оферта is the instrument that legally binds the seller to every customer,
and neither we nor the client is a lawyer. The copy will be drafted carefully against §5.3 and
against ЗУ «Про захист прав споживачів» / ЗУ «Про електронну комерцію» / ЗУ «Про захист
персональних даних», and it will be substantially better than publishing nothing — which is the
real alternative, since it is also the status quo blocking the gateway.

It is nonetheless **not legal advice, and it has not been reviewed by a lawyer.** The UA review
package states this plainly, so the client accepts it knowingly rather than assuming it was
professionally reviewed. Recorded here so the decision is auditable later.

## 13. Decision log

| #   | Decision                                                              | Alternatives rejected                                 | Why                                                                                                                                           |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Legal identity null-gated via `LEGAL_ENTITY`                          | visible `[ЗАПОВНИТИ]` markers; hold the legal three   | markers ship placeholder text (AC 1 forbids); holding leaves 3 dead links and keeps §5.3 item 9 shut                                          |
| 2   | Copy in the `pages` catalog namespace, stripped from `clientMessages` | typed `src/content/pages/*.ts`; catalog with no strip | obeys the CLAUDE.md copy rule, keeps the RU fallback free, and costs 0 bytes of client payload via a mechanism the repo already has (`admin`) |
| 3   | Developer credit as a third copyright-row element                     | appended to the brand line; its own full-width row    | reads as authorship not fine print, and survives the G20 `flex-wrap` cleanly as a third line at 390px                                         |
| 4   | Header gains «Контакти» only                                          | all three per §4 (nav → `lg`); «Контакти» + «Про нас» | seven items ≈920px in a 768px bar; raising to `lg` would strip the nav from 768–1023px tablets                                                |
| 5   | Shared `StaticPage` + bespoke `/contact`                              | seven bespoke pages; one `[slug]` catch-all           | one place for typography; catch-all breaks per-page metadata and the §10 link-integrity guard                                                 |
| 6   | Manager Telegram gets its own slot; `WHATSAPP_HREF` stays `null`      | BACKLOG's "put it in the WhatsApp slot"               | a Telegram URL under a WhatsApp label is untrue on checkout and transactional e-mail                                                          |
| 7   | Footer restructured into two labeled groups                           | append seven links to the copyright row               | twelve links in a row that already overflowed at five                                                                                         |
| 8   | No RU keys for `pages`                                                | translate the legal copy to RU                        | UA-only-by-decision, same as `admin`; deep-merge renders UA for RU visitors                                                                   |

## 14. Open items this design does not close

- **The requisites themselves.** Still owed by the client (TASK-056 row 4 / registration). Until
  supplied, `/terms` and `/privacy` name no registered seller, and §5.0 Gate 0 means no gateway can
  be connected regardless — so this does not block anything G23 can reach.
- **Phone and postal address** — not supplied, not invented (row 4).
- **TASK-048** — unblocked by this group only on the "published" half of §5.3 item 9; the legal-form
  and banking items in that checklist remain open, and payments stay deferred until the client asks.
