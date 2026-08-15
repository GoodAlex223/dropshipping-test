# TODO

**Last Updated**: 2026-08-11

Program spec: [Mirox Shop Program Design](../superpowers/specs/2026-07-14-mirox-shop-program-design.md) · Current week: [WEEKLY.md](WEEKLY.md)

---

## 📋 Planned (v1.3 — "Mirox Rebrand Demo")

_TASK-057 (Mirox design adoption) completed 2026-07-31 — PR [#24](https://github.com/GoodAlex223/dropshipping-test/pull/24) merged `f9ceb97`; see [DONE.md](DONE.md). The user-approved **prod re-seed** ran the same day (`SEED_ALLOW_REMOTE=1` against the Neon direct endpoint): prod now serves the Mirox clothing catalog (8 products, UAH), verified live via API/PDP/homepage._

_TASK-036 (Catalog redesign + filters) completed 2026-08-01 — PR [#26](https://github.com/GoodAlex223/dropshipping-test/pull/26) merged `919906b`; see [DONE.md](DONE.md). All ACs met (4-sort set incl. «Популярні» chosen in-plan; hydration gate preserved unchanged; visual gate signed off after one revision round)._

_G1 (Cart & drawer restyle, WEEKLY batch) completed 2026-08-04 — PR [#28](https://github.com/GoodAlex223/dropshipping-test/pull/28) merged `0eccaf7`; see [DONE.md](DONE.md). Its staleness audit ([audit doc](audits/2026-08-04-storefront-staleness-audit.md)) is the definitive G2/G4 scope input and feeds TASK-056's Friday consolidated ask (photography, size charts, legal copy + the audit's dead `/account/*` links)._

_TASK-037 (Product page redesign) completed 2026-08-03 — PR [#27](https://github.com/GoodAlex223/dropshipping-test/pull/27) merged `cec8408`; see [DONE.md](DONE.md). All ACs met with two spec-ratified deviations: AC-5's fake struck-through bundle price shipped as an **honest sum** (checkout recomputes prices server-side; real bundle discount → TASK-046/047, BACKLOG'd), and «Відкрити фото замірів» omitted until measurement photos arrive (restore note on the size-charts item below). Visual gate signed off after one revision round; 3 PR review rounds all resolved._

_TASK-039 (G9, i18n foundation) completed 2026-08-15 — PR [#37](https://github.com/GoodAlex223/dropshipping-test/pull/37) merged `2c93da7` (2 visual-gate rounds, 4 PR-review rounds, all findings fixed); see [DONE.md](DONE.md). All three ACs shipped: next-intl cookie mode (UA default, RU toggle), full-sweep byte-verified extraction into `messages/{uk,ru}.json`, §7.4 axis tests green. The monobank UA-site prerequisite is now satisfied for whenever TASK-048 unblocks. Residue: RU catalog is a DRAFT pending client sign-off (TASK-056 rider below); admin stays EN/raw-enum until G13; the `[2026-08-15]` BACKLOG intake groups carry the gate/review spawn._

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

- [ ] 🟠 **[G8 residue] Feedback/marquee post-merge polish batch** (one commit; ranked by the PR #35 re-review) — (1) malformed JSON body → explicit `request.json().catch()` → `400 VALIDATION_ERROR` instead of the convention 500 `SEND_FAILED` (a status-code lie to non-browser clients; newsletter subscribe shares the pattern — fix both or note why not); (2) `observer.observe(first)` in [AnnouncementBar.tsx](../../src/components/common/AnnouncementBar.tsx) so a late font swap can't leave a stale `--marquee-shift` seam; (3) test-debt: whitespace-honeypot + JSON-parse route paths, `VALIDATION_ERROR` toast path, `\r\n` template newline case, name-only/email-only template rows, boundary values (name=100, message=5/2000); (4) if the static (non-marquee) announcement variant is ever activated, fix its asymmetric `pr-3`-only inset first — added 2026-08-14, G8 final review + PR reviews

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
**Status**: ⏸️ Deferred (user decision, 2026-08-11)
**Effort**: S
**Dependencies**: None

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
