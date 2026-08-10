# TODO

**Last Updated**: 2026-08-10

Program spec: [Mirox Shop Program Design](../superpowers/specs/2026-07-14-mirox-shop-program-design.md) · Current week: [WEEKLY.md](WEEKLY.md)

---

## 📋 Planned (v1.3 — "Mirox Rebrand Demo")

_TASK-057 (Mirox design adoption) completed 2026-07-31 — PR [#24](https://github.com/GoodAlex223/dropshipping-test/pull/24) merged `f9ceb97`; see [DONE.md](DONE.md). The user-approved **prod re-seed** ran the same day (`SEED_ALLOW_REMOTE=1` against the Neon direct endpoint): prod now serves the Mirox clothing catalog (8 products, UAH), verified live via API/PDP/homepage._

_TASK-036 (Catalog redesign + filters) completed 2026-08-01 — PR [#26](https://github.com/GoodAlex223/dropshipping-test/pull/26) merged `919906b`; see [DONE.md](DONE.md). All ACs met (4-sort set incl. «Популярні» chosen in-plan; hydration gate preserved unchanged; visual gate signed off after one revision round)._

_G1 (Cart & drawer restyle, WEEKLY batch) completed 2026-08-04 — PR [#28](https://github.com/GoodAlex223/dropshipping-test/pull/28) merged `0eccaf7`; see [DONE.md](DONE.md). Its staleness audit ([audit doc](audits/2026-08-04-storefront-staleness-audit.md)) is the definitive G2/G4 scope input and feeds TASK-056's Friday consolidated ask (photography, size charts, legal copy + the audit's dead `/account/*` links)._

_TASK-037 (Product page redesign) completed 2026-08-03 — PR [#27](https://github.com/GoodAlex223/dropshipping-test/pull/27) merged `cec8408`; see [DONE.md](DONE.md). All ACs met with two spec-ratified deviations: AC-5's fake struck-through bundle price shipped as an **honest sum** (checkout recomputes prices server-side; real bundle discount → TASK-046/047, BACKLOG'd), and «Відкрити фото замірів» omitted until measurement photos arrive (restore note on the size-charts item below). Visual gate signed off after one revision round; 3 PR review rounds all resolved._

#### [TASK-039] i18n foundation

**Priority**: 🟠 High
**Status**: 📋 Planned
**Effort**: L
**Dependencies**: [TASK-033]

**Description** (scope shifted by TASK-057, 2026-07-27 — spec §4): Scope shifts: externalize the _now-hardcoded Ukrainian strings_ into locale files + locale infra with UA default / RU toggle. `formatPrice()` lands early via TASK-057; §7.4-compliance verification remains TASK-039's AC. The monobank payments-prerequisite escalation is unchanged. Library choice (e.g., next-intl) decided in plan.

**⚠️ Dependency escalated by [TASK-038b]**: this is no longer only a language-law item. **monobank will not approve internet acquiring without a Ukrainian-language version of the site** ([decision doc §4.2](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md)) — so if the Plata-by-mono branch is chosen, TASK-039 becomes a **hard prerequisite for payments (TASK-048)**, not a parallel track. UAH formatting is specified in decision doc §7.4 (uk-UA: non-breaking-space thousands, comma decimal, `₴`/`грн` **after** the amount, ДСТУ 3582:2013) — use `Intl.NumberFormat('uk-UA', …)`, not hand-rolled formatting.

**Acceptance Criteria**:

- [ ] Locale infrastructure with UA default, RU toggle
- [ ] Customer-facing storefront strings — hardcoded Ukrainian since TASK-057 (`src/content/*.ts` config layer + inline component strings on homepage/header/footer) — externalized into locale files
- [ ] `formatPrice()` (landed via TASK-057, `src/lib/format.ts`) verified compliant with decision doc §7.4

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
      **rendered** page. This project derived it the hard way across TASK-057, TASK-036, TASK-037,
      G1 and G4 — screenshot the rendered page against the reference (or, absent a mockup, against
      shipped sibling surfaces) and get human sign-off before claiming a design task done; it
      caught real defects in four-plus tasks. It applies to any project with a UI. It currently
      lives only in this project's auto-memory, which by construction reaches no other project.
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
**Status**: 📋 Planned
**Effort**: S
**Dependencies**: None

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
- [ ] WhatsApp contact number/link for checkout manager contacts — `src/content/checkout.ts`
      `contacts.whatsapp` (G2, 2026-08-06)
