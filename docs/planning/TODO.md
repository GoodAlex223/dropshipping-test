# TODO

**Last Updated**: 2026-08-21

Program spec: [Mirox Shop Program Design](../superpowers/specs/2026-07-14-mirox-shop-program-design.md) · Current week: [WEEKLY.md](WEEKLY.md)

---

## 📋 Planned (v1.3 — "Mirox Rebrand Demo")

_TASK-057 (Mirox design adoption) completed 2026-07-31 — PR [#24](https://github.com/GoodAlex223/dropshipping-test/pull/24) merged `f9ceb97`; see [DONE.md](DONE.md). The user-approved **prod re-seed** ran the same day (`SEED_ALLOW_REMOTE=1` against the Neon direct endpoint): prod now serves the Mirox clothing catalog (8 products, UAH), verified live via API/PDP/homepage._

_TASK-036 (Catalog redesign + filters) completed 2026-08-01 — PR [#26](https://github.com/GoodAlex223/dropshipping-test/pull/26) merged `919906b`; see [DONE.md](DONE.md). All ACs met (4-sort set incl. «Популярні» chosen in-plan; hydration gate preserved unchanged; visual gate signed off after one revision round)._

_G1 (Cart & drawer restyle, WEEKLY batch) completed 2026-08-04 — PR [#28](https://github.com/GoodAlex223/dropshipping-test/pull/28) merged `0eccaf7`; see [DONE.md](DONE.md). Its staleness audit ([audit doc](audits/2026-08-04-storefront-staleness-audit.md)) is the definitive G2/G4 scope input and feeds TASK-056's Friday consolidated ask (photography, size charts, legal copy + the audit's dead `/account/*` links)._

_TASK-037 (Product page redesign) completed 2026-08-03 — PR [#27](https://github.com/GoodAlex223/dropshipping-test/pull/27) merged `cec8408`; see [DONE.md](DONE.md). All ACs met with two spec-ratified deviations: AC-5's fake struck-through bundle price shipped as an **honest sum** (checkout recomputes prices server-side; real bundle discount → TASK-046/047, BACKLOG'd), and «Відкрити фото замірів» omitted until measurement photos arrive (restore note on the size-charts item below). Visual gate signed off after one revision round; 3 PR review rounds all resolved._

_TASK-039 (G9, i18n foundation) completed 2026-08-15 — PR [#37](https://github.com/GoodAlex223/dropshipping-test/pull/37) merged `2c93da7` (2 visual-gate rounds, 4 PR-review rounds, all findings fixed); see [DONE.md](DONE.md). All three ACs shipped: next-intl cookie mode (UA default, RU toggle), full-sweep byte-verified extraction into `messages/{uk,ru}.json`, §7.4 axis tests green. The monobank UA-site prerequisite is now satisfied for whenever TASK-048 unblocks. Residue: RU catalog is a DRAFT pending client sign-off (TASK-056 rider below); the admin EN/raw-enum residue is closed by G13 (PR [#40](https://github.com/GoodAlex223/dropshipping-test/pull/40) merged `56328f0`, 2026-08-17); the `[2026-08-15]` BACKLOG intake groups carry the gate/review spawn._

#### [TASK-040] CI extensions

**Priority**: 🟡 Medium
**Status**: 📋 Planned
**Effort**: M
**Dependencies**: [TASK-033]

**Description**: Lighthouse CI with performance budget (brief demands PageSpeed 95+), preview deploys per PR, scheduled weekly `npm audit` workflow.

**Acceptance Criteria**:

- [ ] Lighthouse CI job with budget failing PRs below threshold
- [ ] Preview deploy per PR with URL comment
- [ ] Weekly scheduled audit workflow opening an issue on findings

---

## 🟠 Medium Priority

_Items added 2026-08-11 from manual testing; both promoted the same day into WEEKLY [G8](WEEKLY.md)
(week of 2026-08-10) and assigned TASK ids per the promotion rule._

_G8 (TASK-058 feedback form + TASK-059 launch marquee) completed 2026-08-14 — PR [#35](https://github.com/GoodAlex223/dropshipping-test/pull/35) merged `a4114e6` + prod-CSS hotfix PR [#36](https://github.com/GoodAlex223/dropshipping-test/pull/36) merged `92236d4`, production live-verified; see [DONE.md](DONE.md). Residue: the polish batch below, three 🟤 BACKLOG entries ([2026-08-14] intake group), and the TASK-056 `FEEDBACK_EMAIL` rider._

- [ ] 🟠 **[G8 residue] Feedback/marquee post-merge polish batch** (one commit; ranked by the PR #35 re-review) — (1) malformed JSON body → explicit `request.json().catch()` → `400 VALIDATION_ERROR` instead of the convention 500 `SEND_FAILED` (a status-code lie to non-browser clients; newsletter subscribe shares the pattern — fix both or note why not); (2) `observer.observe(first)` in [AnnouncementBar.tsx](../../src/components/common/AnnouncementBar.tsx) so a late font swap can't leave a stale `--marquee-shift` seam; (3) test-debt: whitespace-honeypot + JSON-parse route paths, `VALIDATION_ERROR` toast path, `\r\n` template newline case, name-only/email-only template rows, boundary values (name=100, message=5/2000); (4) if the static (non-marquee) announcement variant is ever activated, fix its asymmetric `pr-3`-only inset first — added 2026-08-14, G8 final review + PR reviews. **Promoted 2026-08-20** → WEEKLY [G20](WEEKLY.md) member 2 (week of 2026-08-24, sourced 🔵 under the user's "ask + polish" pre-launch steer)

---

## ⏸️ Blocked

_None._

## 🔀 Spawned

### Cross-project propagation (out-of-tree)

Rows filed by the Weekly Reviews batch's cross-project-propagation slot (see
[REVIEW-QUEUE.md](REVIEW-QUEUE.md) § Cross-project propagation). These target the **global config
tree and other projects**, not this repository — so **status is user-maintained**: this repo cannot
verify that out-of-tree work landed. Kept separate from the in-tree spawned tasks below.

- [ ] **Propagate the visual-fidelity gate to `~/.claude/POLICIES/manual-testing.md`** — _filed
      2026-08-10, G6 run 1._ Verified absent: the global tree (`CLAUDE.md`, `WORKFLOW.md`,
      `POLICIES/*`, `TEMPLATES/*`) has no rule requiring UI work to be verified against the
      **rendered** page. This project derived it the hard way: TASK-035 passed every automated gate
      and six review rounds yet shipped a homepage that _looked broken_, and PR #23 made the
      sign-off standing — screenshot the rendered page against the reference (or, absent a mockup,
      against shipped sibling surfaces) and get human sign-off before claiming a design task done.
      It has caught real defects in TASK-057, TASK-036, TASK-037, G1 and G4 since. It applies to any
      project with a UI. It currently lives only in this project's auto-memory, which by
      construction reaches no other project.
- [ ] **Propagate "never write execution records ahead of execution" to
      `~/.claude/POLICIES/documentation.md` (or `WORKFLOW.md`)** — _filed 2026-08-10, G6 run 1._
      Verified absent from the global tree. The failure mode is universal, not project-specific:
      drafting a plan or completion record with **pre-checked boxes and invented commit SHAs / PR
      numbers** before the work happens (caught on self-review during G4). Pair it with the
      existing rule to read SHAs from `git rev-parse` rather than composing them.
- [ ] **Propagate the bidirectional docs-index check to `~/.claude/POLICIES/code-review.md`** — _filed
      2026-08-10 on the PR #32 review, correcting a wrong `pass`._ Verify a docs index and the docs'
      own headers agree **in both directions, plus neighbouring rows** — not just "was the index
      touched". `POLICIES/code-review.md` today carries only a generic "README updated if needed"
      checklist item, and its "both directions" line is about database migrations. The drift class
      this prevents has been caught by human review on PRs #16, #17, #19, #21, #23 and #26 in this
      repo alone, and it applies to any project with an index doc.
      **Worked example, live right now:** `docs/README.md`'s Archived Plans table ends at
      TASK-037 while four G-group plans sit in `docs/archive/plans/` unindexed — the in-tree
      instance is already filed as the 🟤 "WEEKLY-group archived plans missing from
      docs/README.md's Archived Plans table" ([2026-08-09] From: G4 completion) and is **not**
      duplicated here. Use it as the concrete case when writing the rule: a "was the index
      touched?" check passes on it, a bidirectional one does not.
- [ ] **Propagate "await background side effects — serverless freeze kills fire-and-forget" to
      `~/.claude/POLICIES/error-handling.md`** — _filed 2026-08-15, G10 run 2._ Verified absent
      from the global tree. The only rule in this batch backed by a **production incident**:
      `/api/checkout/create-order` called `sendOrderConfirmationEmail(...).catch(() => {})`
      without `await`; the Vercel function instance freezes the moment the response returns, so
      the fetch to Resend never executed — prod returned 200 and sent **zero** order emails for
      days (PR #34). It is invisible to local dev, where a long-running server lets the promise
      finish, and invisible to CI. The rule: `await` background-ish side effects before
      returning (keep failures non-fatal with `.catch`), or use the platform's `waitUntil` when
      response latency matters; sweep any route that fires-and-forgets a queue enqueue,
      analytics ping or webhook for the same class. Pair it with the regression shape that
      catches it — a race test asserting the response promise **cannot** resolve before the
      side-effect promise (red on fire-and-forget, green on await). Applies to any serverless
      target: Vercel, Lambda, Cloudflare Workers.
- [ ] **Propagate "re-read live git state before any close-out — the working copy moves
      mid-session" to `~/.claude/WORKFLOW.md`** — _filed 2026-08-15, G10 run 2._ Verified absent
      from the global tree. Not project-shaped: it is a property of how this user works —
      editing the same checkout while a session runs. On 2026-08-15, during an ~8-minute agent
      fan-out, the user merged PR #38, pulled, and committed twice; every field of the
      session-start `gitStatus` snapshot (branch, HEAD, PR state) was false by the time
      close-out started, and a doc write failed on a plan path that close-out had already
      archived. The rule: before any close-out, doc write, commit, or claim about repo state,
      re-read `git status -sb`, `git rev-parse HEAD`, `git log --oneline -5` and
      `gh pr view N --json state,mergedAt`, and reconcile against what you last believed. Treat
      "file not found" on a path a subagent reported as a **state-moved** signal, not a subagent
      error — check `docs/archive/` before re-creating anything.
- [ ] **Propagate "read in-branch history before treating a frozen plan as authority" to
      `~/.claude/POLICIES/code-review.md`** — _filed 2026-08-15, G10 run 2._ **Only the missing
      half**: `~/.claude/CLAUDE.md:63` already carries the authoring half — _"Frozen plans/specs
      get a superseded note; a live doc must simply be **corrected**."_ — and that is not
      duplicated. Absent is the **review** half: a reviewer reading a diff against a frozen plan
      reports a _deliberate in-branch reversal_ as a regression, because the plan is the only
      authority it was given. The rule: run `git log main..HEAD` before treating a plan or spec
      as the standard the diff is judged against, so decisions made and recorded inside the
      branch are visible. Its corollary belongs in the same paragraph: several agents agreeing
      about the same truncated input is not corroboration.

#### [TASK-055] Content & legal pages

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: M
**Dependencies**: [TASK-035]

**Description**: Build the seven footer routes that TASK-035 stopped linking to because they don't exist yet and 404 (`/contact`, `/faq`, `/shipping`, `/returns`, `/about`, `/privacy`, `/terms`; see `Footer.tsx`'s `shopLinks` comment). Three of them — public offer/terms, privacy policy, and return policy — are payment-gateway onboarding prerequisites per the [Ukraine payments & delivery decision](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md) §5.3, and block TASK-048 until they exist. Copy for all seven must come from the client or a lawyer; this task builds the pages, it cannot originate the legal content.

**📐 Design update (TASK-057, 2026-07-27 — spec §4)**: `/contact` layout is now designed ([`Mirox Contacts.dc.html`](../design/design_handoff_mirox/Mirox%20Contacts.dc.html) — social cards, delivery/payment + returns blocks, about + stat cards). Still blocked on client/lawyer copy; legal pages remain gateway-onboarding prerequisites. Two decisions recorded during TASK-057's visual-gate review: (1) per user decision (2026-07-28), the header/footer info links (Про нас, Доставка, Контакти, etc.) stay hidden until this page ships — TASK-057 did not add dead links, per the established no-dead-links rule; (2) the return window is **USER-APPROVED as «14 днів»** (2026-07-28) for use on this page once built — see the TASK-056 update below.

**Acceptance Criteria**:

- [ ] All seven routes exist and render real, client/lawyer-approved copy (no lorem ipsum placeholders)
- [ ] Public offer/terms, privacy policy, and return policy specifically reviewed against §5.3's onboarding checklist before TASK-048 depends on them
- [ ] `Footer.tsx`'s `shopLinks` restored to link to these pages once live, and its "removed links" comment updated

#### [TASK-056] Client content inventory

**Priority**: 🟠 High
**Status**: 📨 Ask **SENT 2026-08-21** (by the user, same day as drafted — ahead of the Mon 2026-08-25 plan) → [reference/2026-08-21-client-ask.md](../reference/2026-08-21-client-ask.md); awaiting client responses, processed as interrupts (WEEKLY § Parallel Work; the domain → Resend DNS → `EMAIL_FROM` chain is pre-authorized). Per-item tracking below. Plan (G15, archived): [2026-08-21_g15-task-056-client-round-trip.md](../archive/plans/2026-08-21_g15-task-056-client-round-trip.md)
**Effort**: S
**Dependencies**: None

**Un-deferred 2026-08-20 (weekly brainstorm)**: the declared pre-launch week (Aug 17–21) was
consumed by the prior week's +4-day spillover and never planned; the round-trip runs as WEEKLY G15
in the week of Aug 24–28, with the ask drafting Fri Aug 21 so the client's multi-week clock starts
before the weekend. **Same day, the client delivered the first 3 real products, ahead of the ask** —
their intake runs as WEEKLY [G16](WEEKLY.md) (pair session with the user); the ask acknowledges
receipt and requests these products' remaining gaps (size charts, back-view images for the card
hover-swap, GTIN/brand data).

**⏸️ Deferred to the pre-launch week (user, 2026-08-11)**: WEEKLY's G7 group was to assemble and hand off the consolidated ask on Fri 2026-08-07. The user's decision is to hold the whole client round-trip until the site is genuinely ready to operate in production with real data and real customers, rather than requesting assets against surfaces that don't exist yet. Nothing is dropped and nothing was partially sent — the checklist below is unchanged and carries forward at 🟠 High. Full rationale and the recorded counter-consideration (three items have multi-week client-side lead times and gate readiness itself) live in the 2026-08-03 week's WEEKLY § G7 (git history; condensed in [WEEKLY.md](WEEKLY.md) § Previous Week Summary). **Pre-launch week identified (user, 2026-08-11): next week, Aug 17–21** — the consolidated ask runs then, alongside polish, targeting user-ready by its end.

**⚠️ Live consequence of the deferral — real customers currently receive no order email.** `EMAIL_FROM` in Vercel prod is the interim `onboarding@resend.dev`, which Resend delivers **only to the Resend account owner's own inbox**; a real customer placing a COD order today gets a confirmation page and nothing else. The order-confirmation code path itself is correct and verified live (G5 + the PR #34 await hotfix) — the gap is purely the sending domain, i.e. the "Production domain purchase/choice" and "Transactional-email sending config" items below. This must be closed before the store takes real orders, whenever the round-trip is finally run.

**G8 rider (2026-08-14)**: when the email items above close, also swap **`FEEDBACK_EMAIL`** (Vercel prod env) from the interim owner address to the client's real feedback recipient — the `/feedback` form (PR #35) sends its notifications there, and today the owner deliberately IS the recipient.

**G9 rider (2026-08-15)**: two i18n items join the round-trip. (1) **RU catalog sign-off** — `messages/ru.json` (474 keys, agent-translated 2026-08-14) ships as a DRAFT behind the live UA|RU toggle (PR #37); the client reviews the nuance-flagged list in `messages/README.md` (undeclined «Нова Пошта», grammatical-gender resolutions, ё policy, marketing-register strings — hero, tagline, marquee, testimonials). A missing/rejected key silently falls back to UA, so partial acceptance is safe. (2) **RU product copy decision** — DB content (names/descriptions/variants) stays UA in RU mode by spec ruling; ask whether the client wants dual-language product data and will maintain it (BACKLOG `[2026-08-15]` entry has the design sketch — build only on opt-in).

**Description**: Single consolidated ask covering everything the client still owes for the Mirox rebrand to leave placeholder/retracted state, spawned by TASK-035's final review so these don't dribble out piecemeal across TASK-036/037/039. This task is the checklist and the client round-trip, not implementation.

**Update (TASK-057, 2026-07-27 — spec §4)**: generated placeholders now exist for hero/products/logo (PNG); the items below are updated to reflect that. Still owed: real photography, logo vector source, real social URLs/counts, size charts, claim re-confirmation, contact details, legal copy.

**Acceptance Criteria**:

- [ ] Hero photography confirmed or supplied — TASK-057 shipped a generated placeholder (`public/images/hero-model-2.png`; `home.hero.image` is no longer `null`); real client photography is still owed
- [ ] Product photography confirmed or supplied — TASK-057 shipped generated placeholders for all 8 SKUs (`public/images/products/*.png`); real garment photography is still owed (relates TASK-036/037)
- [ ] Logo vector/source file — TASK-057 replaced the code-drawn `<Logo/>` with a generated PNG (`public/images/logo.png`) in Header/Footer; the vector source file is still owed
- [ ] Real social URLs and follower counts for Instagram, TikTok, Telegram (`site.socials` in `src/content/site.ts` — still placeholder `@miroxshop` handles)
- [ ] The three client claim figures re-confirmed (`site.claims`: OLX sales, Instagram orders, customer rating)
- [ ] Announcement banner copy, once a real promotion exists (`site.announcement`, currently `null`)
- [ ] Free-shipping threshold/currency — still genuinely unconfirmed, no threshold exists anywhere in the order path (see TASK-035's Finding 1). The **return window is now resolved**: «14 днів» is USER-APPROVED (2026-07-28, recorded on TASK-055 above) for use once the `/contact`/policy page ships
- [ ] Contact details (phone/email/address) for the `/contact` page (feeds TASK-055)
- [ ] Size charts (feeds TASK-037/TASK-045 — `SizePicker.tsx`'s height/weight formula is an interim placeholder until these arrive; **the PDP's «Відкрити фото замірів» button was omitted by TASK-037 (spec §7 ledger #3) and gets restored when measurement photos arrive with these charts**)
- [ ] Legal-page content or lawyer engagement (feeds TASK-055)
- [ ] Bank-card details for the checkout prepay block (card number + holder name) — lights up
      `src/content/checkout.ts` `payment.prepay` (G2, 2026-08-06)
- [ ] WhatsApp contact number/link for manager contacts — single-sourced as `WHATSAPP_HREF` in
      `src/content/brand.ts` since G5 (2026-08-10); filling it lights up BOTH the checkout
      payment-step contacts and the order-email contact block (G2, 2026-08-06 · G5 gate ruling)
- [ ] **Production domain purchase/choice** (G5, 2026-08-10): no real domain exists yet — it gates
      transactional-email delivery (Resend DNS verification below), the real-domain deploy (where the
      placeholder catalog gets replaced with real products), and SEO. Client question: which domain,
      who buys it, who holds DNS access
- [ ] **Transactional-email sending config** (G5, 2026-08-10 — was fully ABSENT; `RESEND_API_KEY`
      **set by user 2026-08-10**, delivery still blocked on the domain): remaining chain — real
      domain purchased (item above) → verify its DNS in Resend (SPF + DKIM; a vercel.app subdomain
      CANNOT be verified — Vercel owns that DNS) → set `EMAIL_FROM=noreply@<real-domain>` in Vercel
      prod env → redeploy. Interim smoke-test (works now): `EMAIL_FROM=onboarding@resend.dev` +
      redeploy — Resend's test sender, delivers ONLY to the Resend account owner's own inbox, never
      to customers. Closes BACKLOG's 🔵 "Verify prod email config"

**Response tracking (G15, scaffolded 2026-08-21)** — rows keyed to the item numbers of the
client-facing ask ([reference/2026-08-21-client-ask.md](../reference/2026-08-21-client-ask.md));
the client answers "до п.N". Legend: ⬜ not sent · 📨 sent, awaiting · 🔁 partial answer ·
✅ answered · ➖ dropped/n-a. Responses are processed as interrupts (WEEKLY § Parallel Work); the
domain → Resend DNS → `EMAIL_FROM` chain (items 1–2) is pre-authorized interrupt work.

**Sent**: **2026-08-21** _(by the user, via messenger — same day as drafted, ahead of the Mon 2026-08-25 plan)_

| №   | Item (🔴 = launch blocker)         | Internal touchpoint                                                                                                              | Status | Response / date                                                                                                      |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| 1   | 🔴 Domain choice/purchase/DNS      | gates №2, real-domain deploy, SEO                                                                                                | 📨     |                                                                                                                      |
| 2   | 🔴 Customer-email chain            | Resend DNS verify → `EMAIL_FROM` (Vercel prod) → redeploy                                                                        | 📨     |                                                                                                                      |
| 3   | Feedback recipient address         | `FEEDBACK_EMAIL` (Vercel prod)                                                                                                   | 📨     |                                                                                                                      |
| 4   | Contact details (phone/email/addr) | TASK-055 `/contact` + Footer                                                                                                     | 📨     |                                                                                                                      |
| 5   | Prepay card number + holder        | `src/content/checkout.ts` `payment.prepay`                                                                                       | 📨     |                                                                                                                      |
| 6   | WhatsApp manager number            | `src/content/brand.ts` `WHATSAPP_HREF`                                                                                           | 📨     |                                                                                                                      |
| 7   | NP API key + Ukrposhta question    | TASK-049 · BACKLOG [2026-08-11] carrier decision                                                                                 | 📨     |                                                                                                                      |
| 8   | Hero photography                   | replaces `public/images/hero-model-2.png`; user softener: can stay generated                                                     | 📨     |                                                                                                                      |
| 9   | 🔴 Product photos (front + back)   | product images; back view = card hover-swap; owed: black zip-hoodie + half-zip backs                                             | 📨     |                                                                                                                      |
| 10  | Measurement photos                 | restores PDP «Відкрити фото замірів» (TASK-037 ledger #3)                                                                        | 📨     |                                                                                                                      |
| 11  | Logo vector source                 | source for `public/images/logo.png`                                                                                              | 📨     |                                                                                                                      |
| 12  | Size charts                        | TASK-045 · replaces `SizePicker.tsx` interim formula; incl. the 3 real products                                                  | 📨     |                                                                                                                      |
| 13  | GTIN/EAN + brand/MPN data          | product identifiers → Google Shopping feed; moot for the 3 branded products (item 14)                                            | 📨     |                                                                                                                      |
| 14  | ⚠️ Branded-goods positioning       | 3 products are Palm Angels / Polo RL / Lacoste (likely replicas) · G16 brand/feed handling — NO brand names into the Google feed | 📨     |                                                                                                                      |
| 15  | Legal-page copy / lawyer           | TASK-055 (7 routes; 3 are §5.3 prerequisites; «14 днів» approved)                                                                | 📨     |                                                                                                                      |
| 16  | Real socials + follower counts     | `src/content/brand.ts` `SOCIALS`                                                                                                 | 📨     | TG t.me/mirox_shop confirmed pre-send (user, 2026-08-21); reviews channel t.me/mirox_vidgyk display question pending |
| 17  | Claim figures re-confirmation      | `src/content/site.ts` `claims`                                                                                                   | 📨     |                                                                                                                      |
| 18  | Free-shipping threshold            | none exists in the order path (TASK-035 Finding 1) — needs code if confirmed                                                     | 📨     |                                                                                                                      |
| 19  | Announcement/promo copy            | `site.announcement` (bump `id` on change)                                                                                        | 📨     |                                                                                                                      |
| 20  | RU catalog sign-off package        | `messages/ru.json` DRAFT · nuance list in [messages/README.md](../../messages/README.md)                                         | 📨     |                                                                                                                      |
| 21  | RU product-copy opt-in question    | BACKLOG [2026-08-15] design sketch — build only on opt-in                                                                        | 📨     |                                                                                                                      |
