# Weekly Plan

**Week**: Monday September 21 – Friday September 25, 2026
**Created**: 2026-09-16
**Sources**: [MILESTONES.md](MILESTONES.md) · [ROADMAP.md](ROADMAP.md) · [GOALS.md](GOALS.md) · [BACKLOG.md](BACKLOG.md) · [TODO.md](TODO.md) · prior WEEKLY (2026-08-24 week, archived below) · [REVIEW-QUEUE.md](REVIEW-QUEUE.md) · git log (2 weeks) · [reference/2026-09-16-client-reply.md](../reference/2026-09-16-client-reply.md) · [deployment/launch-runbook.md](../deployment/launch-runbook.md)
**Cleanup Week?**: No — overdue by cadence (never held; 🟤 pool ≫ 20 SP). The user re-confirmed on 2026-09-16 that it runs **after launch**, and redefined launch for this project: the domain purchase is deferred ("maybe later"), so "launch" is the «minimally ready for real operation» declaration that follows the main functions in this plan — under the same ruling's standing constraint, **no new features** beyond it.
**Context**: **Own the content, then declare ready.** The client's 2026-09-16 blanket delegation moved the last blockers we can act on in-house: TASK-055's seven content/legal pages (three are payment-gateway prerequisites) are drafted and built by us (🏆), the Nova Poshta city/branch picker we told the client we would build runs on our own key, and two G16 defects on the client's self-service product-intake path are closed before they bite. Production is unblocked first (the 🟠 stale-CSS redeploy). The domain is not being bought for now (user ruling 2026-09-16), so the cutover chain is dormant; instead the week ends with the handover / launch-options document (G27) that turns "all main functions done" into a proposal the client can act on, plus the developer credit the verbal agreement provides for.

---

## Parallel Work

- **Domain → cutover chain — DORMANT by ruling (2026-09-16: not buying the domain for now, maybe later).** The pre-authorized procedure in [launch-runbook.md](../deployment/launch-runbook.md) Part 1 (Resend DNS → `EMAIL_FROM` → `AWS_CLOUDFRONT_URL` flip **with the same-window `ProductImage.url` backfill**, Steps 4/12 → cache-off redeploy → Post checks + `npm run smoke`) stays the procedure for whenever a domain exists. Until then real customers receive **no order e-mail** (`EMAIL_FROM=onboarding@resend.dev` delivers only to the Resend owner) — [G27](#g27-handover--launch-options-document-solo) weighs the interim own-subdomain option.
- **Client self-service product intake** — the client enters the remaining 5 real products through the admin with the UA intake guide (user ruling 2026-09-01). [G24](#g24-client-intake-safety-net-batch) hardens that path. Prod holds real data since 2026-09-01: `db:seed` against prod is destruction, `SEED_ALLOW_REMOTE=1` is retired for prod permanently.
- **TASK-055 client review round-trip** — the drafted page copy goes to the client for review through the user (the reply promised «надішлемо на перегляд перед публікацією»); publication follows their OK **or three working days of silence** (ruled 2026-09-16 — the user expects the client to be slow).
- **🟠 Stale production CSS (open since 2026-09-12, now the 3rd rebuild in a row)** — re-verified 2026-09-16: `/` serves `143491e5ab2efd5e.css` + `61c0f0682ec37a4c.css` and `.gap-x-6` resolves in neither, so the Sep 13 and Sep 16 pushes rebuilt **with** the cache. Owner action → [G22](#g22-production-cache-off-redeploy--smoke-re-verify-solo) Monday, doable any earlier day.

---

## Task Groups

_Group IDs continue from prior weeks (G1–G21 are permanently taken by DONE.md and memory references); this week is G22–G27._

### G22. Production Cache-Off Redeploy + Smoke Re-verify [solo]

🟡 Ops · ops/deploy · **1 SP** · Mon, first thing (owner action; any earlier day works)

> The one scheduled group below the 2-SP floor — the urgent/deadline-bound exception: production has rendered the footer links at 0px gap on **every page** since PR #46 (2026-09-12), and each subsequent push rebuilt with the cache. Origin is the 🟠 🟤 [2026-09-12] G20 close-out entry (Claude-surfaced); sourced 🟡 by the intake rule's time-sensitive-ops routing. No Vercel CLI in this container; the Vercel MCP plugin's deploy tool is untested here and stays untouched — the dashboard click is the recorded remedy.

- [ ] Owner: Vercel dashboard → Redeploy the current production deployment with **"Use existing build cache" unchecked** (or set `VERCEL_FORCE_NO_BUILD_CACHE=1` in the project env and push). Then Claude: `npm run smoke -- --url https://dropshipping-test.vercel.app` exits 0 with the CSS-hash row `CHANGED`, and a 390px check of `/track`'s footer nav shows `.gap-x-6`/`.gap-y-2` resolved (links no longer touching); record the served chunk hashes in the close-out (1) — BACKLOG 🟠 🟤 [2026-09-12] G20 close-out [URGENT]

### G23. TASK-055 Content, Legal & Contact Pages [batch]

🔵 User · content/storefront · **10 SP** · Mon–Wed · **🏆 Weekly Challenge**

> Unblocked 2026-09-16: the client delegated the copy (TASK-056 item 15), so we draft all seven pages ourselves — AI-drafted UA copy, client reviews before publish. Three of the seven (public offer/terms, privacy, returns) are payment-gateway onboarding prerequisites per the [payments decision doc](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md) §5.3 item 9 and gate TASK-048; shipping the group also lifts the 2026-07-28 ruling that hid the header/footer info links (no-dead-links rule). Expect the **architectural** brainstorm path — seven routes with no existing flow — so a spec and an SDD plan precede the build. Decisions the spec must settle: content model for long-form copy (catalog keys via `t.rich` vs a typed `src/content/pages/` module — CLAUDE.md's "all display copy in `messages/*.json`" rule applies), UA-only copy with the RU toggle falling back to UA (recommended), slugs, and the developer-credit placement (member 5). **Publish protocol ruled 2026-09-16**: merge after the client's OK **or** after three working days of silence. Facts we do not hold stay out: no phone/address unless the client sends one (TASK-056 row 4), no third-party brand names and no authenticity claim (row 14), return window «14 днів» (user-approved 2026-07-28).

- [ ] Brainstorm → spec → plan, then draft the seven pages' UA copy — legal three first (`/terms` public offer, `/privacy`, `/returns`), each checked against decision doc §5.3 item 9 and the brand posture above; `/contact` carries the TG channel, the reviews channel `t.me/mirox_vidgyk`, manager `@mirox_manager` and the `/feedback` form (3) — TODO.md TASK-055 [HIGH], unblocked 2026-09-16
- [ ] Build the seven routes under `(shop)` — `/contact` per [`Mirox Contacts.dc.html`](../design/design_handoff_mirox/Mirox%20Contacts.dc.html) (social cards, delivery/payment + returns blocks, about + stat cards), the other six on the shared page shell; per-page metadata via `getTranslations`; sitemap rows; `Footer.tsx`'s `shopLinks` and the hidden header info links restored; unit tests with `renderWithIntl` + an E2E link sweep proving no footer/header link 404s; visual gate (4) — TODO.md TASK-055 AC 1 + AC 3
- [ ] Manager-contact touchpoints single-sourced: a `@mirox_manager` Telegram link in `src/content/brand.ts` consumed by `/contact`, the checkout payment-step contacts (`src/content/checkout.ts`) and the order e-mail contact block (`src/content/emails.ts`) — today both surfaces render «напишіть менеджеру» with the channel (`t.me/mirox_shop`) and Instagram links and WhatsApp hidden (`WHATSAPP_HREF` null), so the client reply's п.5/п.6 statement («лишається «зв'яжіться з менеджером» (Telegram @mirox_manager)») names a handle the site does not yet link; visual gate on the payment step (1) — BACKLOG 🟤 [2026-09-16] TASK-056 delegation (subsumed; origin cited)
- [ ] Client review package: the drafted copy as a paste-able UA doc under `docs/reference/`, handed to the user to send; publish after the client's OK or after the three-working-day silence window; tick §5.3 item 9's "published" half on the decision doc once live (1) — TODO.md TASK-055 AC 2 + the reply's review promise
- [ ] Developer credit: a «Розроблено» line in the footer (every page) plus a short mention on `/about`, linking the user's personal site (all contact methods live there; **URL supplied 2026-09-16: `https://goodalex223.github.io`** — e-mail stays off the footer (harvestable, and it lives on the site); also add the credit to `public/humans.txt`, a `<meta name="author">` in the root layout, and a credit line in the README + the G27 handover doc — user, batch 4: Как это лучше сделать? Нужно где-то оставить свой след, что это я был разработчиком, чтобы кто угодно мог со мной связаться. У меня есть сайт goodalex223.github.io, где есть все способы связи со мной, почта alexminak32@gmail.com, могу предоставить еще способы связи) — the credit the verbal agreement provides for (the site is built in exchange for the credit, portfolio use and client reviews); strings via the catalog; placement settled in the G23 spec (1) — user-raised 2026-09-16 (weekly-plan review) → BACKLOG 🔵 [2026-09-16], promoted same day

### G24. Client-Intake Safety Net [batch]

🟤 Auto · admin/catalog · **3 SP** · Tue — **the week's single 🟤 group**

> Two G16-filed defects sit directly on the path the client is walking right now: creating products through the admin form with Ukrainian names, in a catalogue that is entirely third-party branded. Both are High value / Low effort in the BACKLOG and both protect the client's own intake rather than ours. TDD; the intake guide is updated alongside.

- [ ] `generateSlug` transliterates Cyrillic (uk → Latin map) instead of returning `""`, and `POST /api/admin/products` rejects an empty slug with a coded 400 instead of persisting an unreachable product; tests cover «Олімпійка з лампасами, чорна» → non-empty slug, the `${slug}-${suffix}` collision path, and the empty-slug rejection (2) — BACKLOG 🟤 [2026-09-01] G16 pair session
- [ ] `excludeFromFeed` defaults **on** for new products in the form (`ProductForm` `defaultValues`), with the DB default and the Zod schema untouched — the schema deliberately carries no `.default()`, or partial PUTs would reset the flag; intake guide sentence updated (1) — BACKLOG 🟤 [2026-09-01] G16 pair session, option (a)

### G25. TASK-049 Nova Poshta City/Branch Picker [solo]

🔵 User · checkout/delivery · **5 SP** (may prove 8 — checkout is the most review-sensitive surface) · Thu–Fri

> The 🔵 [2026-08-07] user ask (Q1: replace the free-text «Відділення / адреса» with the standard city → warehouse picker), un-gated 2026-09-16: TASK-056 item 7 ruled Nova Poshta only, and the address/warehouse reference methods accept any account's key, so the picker runs on **our own** NP key — the client was told so in the reply («зробимо на нашому ключі»). **Prerequisite**: that key in local `.env` and Vercel prod by Wed — the user will try to obtain one on their own account (ruling 2026-09-16); without it the group slips (valve #1). **This is the last feature under the no-new-features ruling.** Design source: decision doc §6.2–6.3 (`getCities` → `CityRef`; `getWarehouses` returns branches **and** lockers — filter `TypeOfWarehouseRef` for postomats, the inverted-UUID trap) and §6.7 (two dependent selects, server-proxied so the key never reaches the browser; directories cached daily). Prod has no Redis, so caching is `unstable_cache`/module-scope, not BullMQ's ioredis. Likely architectural at brainstorm (new API surface + a `shippingAddress` shape change), so spec + plan first.

- [ ] Server-proxied directory routes (`/api/shipping/np/cities`, `/api/shipping/np/warehouses?city=<CityRef>&type=branch|postomat`) with the key server-side only, daily-TTL cache, coded outcomes, query validation via Zod; unit tests with mocked NP responses incl. the postomat filter (2) — decision doc §6.2/§6.3/§6.7
- [ ] Checkout: city search → branch/postomat select replacing free-text `city`/`line1` for `np-office`/`np-postomat`; `np-courier` keeps a street address; store `CityRef`/`WarehouseRef` alongside the display strings (shape decision in the spec — additive to `shippingAddress`); hydration gate preserved; every string change sweeps every E2E locator type (checkout specs run in CI, not locally); visual gate at 390/768/1280 (3) — BACKLOG 🔵 [2026-08-07] G2 post-gate Q1 [HIGH]; spec TASK-049 (v1.4 B-track, pulled forward by the 2026-09-16 client statement)

### G26. Weekly Reviews [batch]

⚪ Overhead · recurring reviews · **5 SP** · Fri

> Run 4. Read [REVIEW-QUEUE.md](REVIEW-QUEUE.md) first — the run recipe (skeleton commit before research, step-5 re-check pass, Convention-4 cheap checks on every park). Window for slot 4 = shipped since run 3 (2026-09-12): PR #47 close-out (`05edce3` → `a2281a3`), the G15 response processing (`c574e0c`), this week's PRs, and every memory file touched 2026-09-13 → run day. Parks: `resend` **cannot fire** this week (domain deferred by ruling); the six slot-4 fold-in defers fire when a named host is touched; `neon` / `logic-lens` get cheap checks only (`git ls-remote`, no re-reading); EARS and the `sentry`/`prisma` runners-up likewise. **Slot 4 owes a verdict** on the fix-chain lesson (fourth failure mode in `review-fix-chains-and-lazy-diagnostics`; likely host = run-1 propagation row 3). **Standing-lens question for a process row**: the lens says "re-scope once the storefront has launched" — the user's 2026-09-16 ruling redefines launch as the «minimally ready» declaration expected right after this plan; rule whether that fires the re-scope now or at the declaration. Slot-3 bias counter stands at 0 of 2. Sequential in-session (Convention 8; its 🟤 amendment is pending and may be folded here if the conventions are touched).

- [ ] Plugins ×2: best not-yet-reviewed from the official store AND from the wider internet, each row tagged `source:` (2)
- [ ] Claude best-practices: top not-yet-reviewed candidate via date-aware web search (1)
- [ ] Non-Claude AI best-practices — methodology-aimed; the bias-watch counter advances only per the rewritten condition (1)
- [ ] Cross-project propagation: the window above, memory files included (Convention 9); rule on the owed fix-chain verdict and the standing-lens question (1)

### G27. Handover & Launch-Options Document [solo]

🔵 User · docs/ops · **3 SP** · Thu

> User-raised 2026-09-16 at the plan review. Everything runs on the user's own accounts today — the Vercel project and its env, Neon, the Cloudflare R2 bucket `mirox-media`, the Resend key, the GitHub repo, GTM/GA4, any NP key — because the arrangement is verbal: the site is built in exchange for a developer credit, portfolio use and client reviews, and launching at the user's expense was never agreed; the client is not very invested. When the main functions land the user wants to say «all the essentials are done, the rest is optional» and put launch options to the client. **The launch model is decided together in an attended brainstorm** — the user has not settled it — and only then written up. Deliverable, not a feature: the no-new-features ruling is untouched.

- [ ] Internal handover runbook (`docs/deployment/handover.md`, EN): inventory of every service, account, env variable and credential on the user's identity; per item — what the client must end up owning, transfer vs re-create, cost, downtime/risk, and the order of operations; the domain-purchase how-to (`.com.ua` through a Ukrainian registrar, ~200–400 UAH/yr; Vercel does not sell `.com.ua`) pointing at the launch runbook Part 1 for the cutover steps; indexed in docs/README.md at authoring time (2) — user-raised 2026-09-16 → BACKLOG 🔵 [2026-09-16], promoted same day
- [ ] Launch-model proposal (client-facing, UA, messenger-paste format like the 2026-08-21 ask), after the brainstorm: the three models — (1) the client hands over their core data and we obtain and connect everything on their behalf; (2) the client obtains everything themselves and hands us the credentials to connect; (3) the client obtains **and** connects everything themselves — with what each needs from the client, what it costs, and the recommendation the brainstorm reached; plus the interim option to weigh, not decide: customer e-mail from a subdomain of the user's **own** domain (Resend verifies subdomains), which closes the no-order-e-mail gap without a purchase and is reversible at handover (1) — user-raised 2026-09-16
- Brainstorm inputs added 2026-09-16 (manual-testing batch 5, user-raised): **four constraints** — the client must pay for every connected service; the developer keeps deploy/update access (periodic updates continue); the client is not technical (keys, code, env are opaque to them); the developer's card currently backs some services. **Recommended model to test on Thursday**: the client owns the billing identity, the developer keeps membership access — in one guided screen-share the client creates their own Vercel team, Neon project, Cloudflare account, Resend account (later the registrar) with their card and adds the developer as member/collaborator on each; the developer moves the project, re-issues every key under the client's accounts and sets the env, so the client never handles a key. Facts for the runbook: Vercel Hobby forbids commercial use → a live shop needs **Pro** on the client's team; everything else fits free tiers today. **Rejected alternative** (the user's unreached «second thought»): the developer keeps every account and re-bills the client monthly — simpler for a non-technical client, but keeps the card and the liability on the developer, which is exactly what the handover must end. The «keys and data» instruction the user asked for **is member 1** (the internal handover runbook), not a new deliverable (Как лучше поступить? Я не уверен. Мне необходимо передать сайт владельцу, а именно то, чтобы он сам платил за подключенные сервисы и услуги, при том что я еще буду периодически обновлять сайт. Клиент не сильно понимает в ключах, коде и подобном. Первая мысль: Нужен документ-инструкция как получить все ключи и данные, необходимые для работы сайта (сейчас прод работает на данных разработчика). Я имею .env, vercel env, git env, etc. Почему это важно, потому что на некоторых сервисах я подвязал свою карту. Второй мысли пока нет).

---

## Daily Schedule

### Monday — Production unblocked, the content group opens

- **[G22](#g22-production-cache-off-redeploy--smoke-re-verify-solo)** 🟡 — owner does the cache-off redeploy first thing; `npm run smoke` must come back `CHANGED`, exit 0.
- **[G23](#g23-task-055-content-legal--contact-pages-batch)** 🔵 — part 1: brainstorm → spec → plan; legal copy drafted first (terms / privacy / returns against §5.3), then `/contact`.

### Tuesday — Build the pages, protect the client's intake

- **[G23](#g23-task-055-content-legal--contact-pages-batch)** 🔵 — part 2: the seven routes, nav/footer restore incl. the developer credit, metadata + sitemap, tests.
- **[G24](#g24-client-intake-safety-net-batch)** 🟤 — slug transliteration + feed default, TDD, intake guide updated.

### Wednesday — Content lands; picker go/no-go

- **[G23](#g23-task-055-content-legal--contact-pages-batch)** 🔵 — part 3: visual gate, PR + review, client review package handed over (silence window starts).
- **[G25](#g25-task-049-nova-poshta-citybranch-picker-solo)** 🔵 — go/no-go on the NP API key; brainstorm + spec if go.

### Thursday — Delivery picker + the handover conversation

- **[G25](#g25-task-049-nova-poshta-citybranch-picker-solo)** 🔵 — part 1: directory proxy + cache, TDD; G23 merge after review.
- **[G27](#g27-handover--launch-options-document-solo)** 🔵 — the launch-model brainstorm with the user, then the inventory runbook and the UA proposal.

### Friday — Reviews + close

- **[G26](#g26-weekly-reviews-batch)** ⚪ — run 4, sequential in-session.
- **[G25](#g25-task-049-nova-poshta-citybranch-picker-solo)** 🔵 — part 2: checkout selects, visual gate, PR.
- Close-out: statuses → `✅ PR #N`, as-delivered quota recompute, next-week seed list — expected seed: the «minimally ready» declaration and the Cleanup Week that follows it.

---

## Summary Table

| ID  | Group                                                    | Domain             | Source      | Tasks  | Total SP | Day     | Status    |
| --- | -------------------------------------------------------- | ------------------ | ----------- | ------ | -------- | ------- | --------- |
| G22 | Production Cache-Off Redeploy + Smoke Re-verify `[solo]` | ops/deploy         | 🟡 Ops      | 1      | 1        | Mon     | ☐ Planned |
| G23 | TASK-055 Content, Legal & Contact Pages `[batch]` 🏆     | content/storefront | 🔵 User     | 5      | 10       | Mon–Wed | ☐ Planned |
| G24 | Client-Intake Safety Net `[batch]`                       | admin/catalog      | 🟤 Auto     | 2      | 3        | Tue     | ☐ Planned |
| G25 | TASK-049 Nova Poshta City/Branch Picker `[solo]`         | checkout/delivery  | 🔵 User     | 2      | 5        | Thu–Fri | ☐ Planned |
| G26 | Weekly Reviews `[batch]`                                 | recurring          | ⚪ Overhead | 4      | 5        | Fri     | ☐ Planned |
| G27 | Handover & Launch-Options Document `[solo]`              | docs/ops           | 🔵 User     | 2      | 3        | Thu     | ☐ Planned |
|     | **Total**                                                |                    |             | **16** | **27**   |         |           |

_Source legend: 🔵 User · 🟡 Ops · 🟤 Auto · ⚪ Overhead (exempt from the quota denominator). Status on completion: `✅ PR #N` (the number, never a bare ✅)._

---

## Notes

- _Brainstorm sanity-checks: week dates confirmed vs git/DONE (today Wed 2026-09-16; Sep 21 verified a Monday, Sep 25 a Friday); **the previous week did NOT land inside its header** — Aug 24–28 delivery ran to Sun 2026-09-13 (+16 days), and its header never carried the template's REQUIRED `**Spillover**` line (nothing in this repo enforces it — recorded in the archive below instead); **what fell due during the spillover**: the weeks of Aug 31–Sep 4 and Sep 7–11 were consumed by delivery and never planned, as is the current week (Sep 14–18: only the G21 close-out and the G15 response processing) — no scheduled mandate fell due in them (Weekly Reviews run 3 landed Sep 12 inside the spillover; the Cleanup Week was already overdue at Aug 24 and stays user-pinned post-launch); velocity 34 SP across 13 working days ≈ 2.6 SP/day, down from ≈ 5.7 (Aug 10–14, 40 SP in 7) and ≈ 3.7 (Aug 3–7, 26 SP in 7) → realistic in-window capacity ≈ 13–16 non-⚪ SP; this plan books 22 non-⚪ (27 total) after the user's two additions, with a declared valve; Cleanup Week overdue by cadence, user-pinned to after launch; source quotas satisfiable (81.8% 🔵)._
- **Discussion Phase** — self-conducted on 2026-09-16 (unattended run; classification **bounded** — the planning docs it edits already exist), then **reviewed by the user the same day**. Themes weighed: **(A) Own the content** — chosen; **(B) Cutover rehearsal** — rejected, the runbook's steps are ⛔ BLOCKED on a domain that is now deferred; **(C) CI-forward** — rejected, TASK-040's value is post-launch and its AC 2 is already delivered (reap 5). **User rulings**: (1) the domain is **not** bought for now, maybe later — the cutover chain goes dormant; (2) the user will **try** to obtain an NP API key for G25; (3) TASK-055 publishes after the client's OK **or** three working days of silence — accepted, with the caveat that the client may not answer soon; (4) Cleanup Week confirmed post-launch, **and no new features** — the site is to be declared «minimally ready for real operation» once the main functions land; (5) all five reap nominations approved — **executed** (below). **Two additions**: the handover / launch-options document (→ G27, its own 🔵 group) and the developer credit (→ G23 member 5). "Everything else looks good" is the approval of the groups.
- **Backlog reaps — executed 2026-09-16 (user-approved), per the standing move-to-🪦 convention (marked in place, body preserved under 🪦, tombstone row in Rejected Ideas)**:
  1. **"Add dynamic OG image generation — use `opengraph-image.tsx`"** · [2026-01-22] From: TASK-017 · implicitly delivered: `src/app/(shop)/products/[slug]/opengraph-image.tsx` (TASK-019) and the site-wide `src/app/opengraph-image.tsx` (TASK-035 / PR #21) both exist and are live.
  2. **"Add category metaTitle/metaDesc fields"** · [2026-01-22] From: TASK-017 · both halves gone: `Category.metaTitle`/`metaDesc` already exist (`prisma/schema.prisma:135-136`), and the only page that could render them, `/categories/[slug]`, was retired by G12 (routing-layer 307 in `next.config.mjs`).
  3. **"Add dynamic OG images for category pages"** · [2026-02-02] From: TASK-019 · same G12 obsolescence — no category page exists to carry a card.
  4. **"Implement proper i18n with hreflang — current setup is preparation only (`en`)"** · [2026-01-22] From: TASK-017 · premise superseded: TASK-039 shipped cookie-mode i18n with **no per-locale URLs** by decision, so hreflang alternates have nothing distinct to point at; the SEO-localization remainder is TASK-053 (spec v2.0) and the `alternates.languages` residue is the live 🟤 "Machine-metadata EN corners" [2026-08-15] entry — a duplicate of two live siblings.
  5. **"Add Vercel deploy preview on PRs"** · [2026-02-04] From: TASK-026 · implicitly delivered by the Vercel Git integration: the `vercel` bot posts the preview on every PR (verified on PRs #46 and #47); previews sit behind Vercel Authentication and never migrate (runbook § Known limitations). Consequence: TASK-040's AC 2 is already satisfied — marked on the TODO entry; re-scope TASK-040 before scheduling it.
  - _Considered, not nominated_: "Automated doc freshness check via git timestamps" ([2026-02-10] TASK-030) — G11 chose the index-row design over git timestamps, but the entry proposes a different instrument and its sibling row already records G11; leave it to the Cleanup Week's own audit.
- **Capacity & pressure valve**: 22 non-⚪ SP against an observed 13–16 — the user's two additions are in, so the overload is stated rather than hidden. Deferral order under pressure: **G25 first** (largest, v1.4-track, prerequisite-gated — it slips cleanly to the following week), then **G24** (protects the client's intake, so it moves rather than drops), G26 under its own hard-deadline rule. **G23 and G27 do not valve**: G23 is the launch gate and the challenge; G27 is what the «minimally ready» declaration needs in hand. The unplanned days Thu Sep 17 – Fri Sep 18 can absorb G22's owner action and the NP-key prerequisite; a G23 copy-drafting head start (the G15 precedent) is available only on the user's say-so, not assumed.
- **Dependencies / risks**: G22 is an owner action — nothing in this container can do it. G23 touches the footer (every page), the checkout payment step (member 3) and the e-mail shell → visual gate + the standing E2E-locator sweep; legal copy is drafted by us and must not assert facts we do not hold (no phone/address, no brand names, no ФОП/ТОВ details — §5.3 items 1–8 stay the client's); member 5 needs the personal-site URL from the user. G24 changes admin create-path behaviour the client is using live — ship with the intake-guide sentence, verify against a Ukrainian product name in the real admin. G25's key is external; its checkout change rides the hydration-gated form (G2 precedent: six review rounds) and four local checkout/cart E2E specs already fail on seed data (🟤 [2026-09-12]) — CI is the signal. G27's launch-model brainstorm needs the user present (Thu); the inventory half can be drafted without them. G26 runs sequential in-session. `NODE_ENV=development` in `/etc/environment` still corrupts local `next build` CSS — compiled-CSS checks run `env -u NODE_ENV npm run build`.
- **Quota sourcing transparency**: G23 subsumes one 🟤-origin rider (the [2026-09-16] Telegram-manager link, 1 SP) under the G13/G14 subsumption precedent, and G22's origin is a Claude-surfaced 🟤 entry sourced 🟡 by the intake rule's time-sensitive routing. Strict-origin accounting would read 🟤 at 5/22 (22.7%) — still compliant; the Quota Check below uses group sourcing per the intake rule and the precedent, and this note is the honest record of the difference.
- **Still open after the review**: the personal-site URL for the developer credit (G23 member 5); the launch model itself, decided in G27's Thursday brainstorm, with the own-subdomain e-mail interim as one input; whether the user's NP-key attempt succeeds by Wednesday (G25 go/no-go).
- **Parked (carried)**: the domain purchase itself (deferred by ruling — maybe later; the runbook chain stays ready); TASK-040 CI extensions (AC 2 already delivered — re-scope first; next candidate is a post-launch week); the `/track` hydration error 🔵 [2026-09-06] (next evidence: the console `Warning:` line + an incognito check); transactional-e-mail and Zod validation-message localization 🔵 [2026-08-15] (post-launch); React-19-style `ui/` refs 🔵 [2026-08-15] (retires with the React 19 upgrade); the checkout distraction-free header and the mobile-PDP contextual header (deferred by ruling, and now also barred by no-new-features); MILESTONES/GOALS refresh (both still show January state — Cleanup Week); the cross-project propagation queue (9 TODO § 🔀 rows, all unchecked — a post-launch batch sitting); G17 re-run `low` scoped to `src` 🟤; `product.stock` variant decrement 🟤 and `isActive`/`isFeatured` `.default()` reset 🟤 (next 🟤 candidates — the latter is not UI-reachable today); the Convention 8 amendment 🟤 (G26 may fold it); the Vercel WAF rate-limit rule 🟤 and the `__Host-` cookie note (both decide at the domain).
- **Process observations (Claude-surfaced; route at close-out per the intake rule)**: (a) the Aug 24–28 plan carried no `**Spillover**` line through a +16-day slip — the template calls the line REQUIRED past Friday+2, but this repo has no gate for it (the universal-config check is a PowerShell pre-commit hook absent here); the close-out procedure should add the line at the first close-out that lands late, or the archive note is the only record. (b) Live-config drift check: not applicable — this project maintains no live-config sync. (c) `OWNER-QUEUE.md`: absent; no owner-session tracks to weigh.

### Quota Check

- 🔵 User-Flagged SP: 18 / 22 (81.8%) — must be ≥50% ✅
- 🟡 Operational SP: 1 / 22 (4.5%) — must be ≤25% ✅ (G22, the urgent below-floor exception)
- 🟤 Auto-Generated SP: 3 / 22 (13.6%) — must be ≤25% AND ≤1 group ✅ (one group: G24)
- Cleanup Week status: **overdue by cadence** — user-pinned to run **after launch** (ruling 2026-08-11, re-confirmed 2026-09-16 with launch redefined as the «minimally ready» declaration)
- Last Cleanup Week: never (the Feb 2026 freeze week predates the cadence)
- Compliance: ✅ all quotas met — the cadence deviation is an explicit user ruling; see the sourcing-transparency note for the strict-origin reading
- _Denominator note_: Y = 27 total − 5 ⚪ (G26 Weekly Reviews) = 22. As-delivered quotas are recomputed at close-out per standing precedent.

---

## Weekly Challenge 🏆

**G23 — TASK-055 Content, Legal & Contact Pages (🔵)**: the default-source pick and the last launch gate we control end to end. Three of the seven pages are payment-gateway onboarding prerequisites (§5.3 item 9) that block TASK-048, the footer has pointed at nothing since TASK-035 hid the info links, and yesterday's delegation removed the only reason they were not built — the copy. It now also carries the developer credit the verbal agreement provides for. Shipping it makes the store presentable to a real customer and to a gateway reviewer in the same week.

---

## Previous Week Summary

**Week of Monday August 24 – Friday August 28, 2026** (created 2026-08-20; archived under its TRUE header) · **Spillover: delivery ran to Sun 2026-09-13** (+16 days past the Friday; the header's REQUIRED `**Spillover**` line was never added — this note is the record). **All 7 groups shipped** — 34/34 SP (30 non-⚪: 27 🔵 = 90%, 3 🟤 = 10%); the pressure valve (G20 → G18's tracking half → G21) was never exercised, the week simply ran long.

- **G15 TASK-056 Client Round-Trip** — ✅ `b836e77` (Fri Aug 21, no PR — the pre-week head start): the 21-item UA ask drafted, twice reviewed and **sent by the user the same day**. **Reply arrived 2026-09-16 as a blanket delegation with no facts** — all 22 rows decided by us (user-approved; `c574e0c`, reply doc `docs/reference/2026-09-16-client-reply.md`): TASK-055 unblocked, Nova Poshta only, RU catalog accepted, no dual-language products, two BACKLOG entries reaped → 🪦; the domain purchase was the one open item and is now **deferred by user ruling (2026-09-16: not buying for now)**.
- **G16 Real-Product Intake** — ✅ PR #41 `36b5593` (+ close-out PR #42; DONE.md dates it 2026-09-01): the prep step found the admin could not carry a real product at all (no image/variant UI, no storage, no `styleGroup`, no feed opt-out) → 4 → **9 SP**. Cloudflare R2 live, `excludeFromFeed` added, the Google Shopping feed worked for the first time ever (0 → 8 items); prod holds 2 of 7 real rows, the client enters the rest with a written UA guide. Two pre-existing bugs found by real data, 10 🟤 filed.
- **G17 Pre-Launch Security Scan** — ✅ PR #43 `0bee3d2` (Sep 4): `claude-security` v0.11.0 low/whole-repo, 12 candidates → 9 panel-verified findings, 6 fixed in-branch; the HIGH (seeded admin credential live in prod and published in the README) closed end-to-end incl. production. Run 2 abandoned on cost — **run-1 coverage only, never a clean bill of health**.
- **G18 Guest Order Access & Hardening 🏆** — ✅ PR #44 `a37c8d0` (Sep 6): one authorization rule (`canAccessOrder`), signed per-order grant cookie, `/track` lookup with per-order lockout; the PR review fixed the counter-zeroing race; production verified; 14 riders filed; the `/code-review` skill burned a session limit (memory `code-review-skill-cost-2026-09`).
- **G19 Launch Runbook + Deploy Verification** — ✅ PR #45 `735533a` (Sep 10): `npm run smoke` (14 probe rows, exit 0 only if all pass) + the 19-step cutover runbook; the Actions Deploy job proved a no-op at merge; the runbook found the `ProductImage.url` backfill that five review passes missed; 5 review rounds, deliverables unchanged after `01bd910`.
- **G20 Pre-Launch Polish** — ✅ PR #46 `baef19b` (Sep 12): mobile «Новинки» rail + the G8 residue (malformed JSON → 400 on all 10 public routes) + a footer overflow the gate found (4 → 5 SP); first zero-finding code review; close-out found `main` red since G19 (empty `docs/planning/plans` broke a guard) and **stale production CSS, 3rd recurrence — still OPEN** (→ this week's G22).
- **G21 Weekly Reviews run 3** — ✅ PR #47 `05edce3` (Sep 13): 17 rows (1 adopt · 10 defer · 1 pass · 3 propagate + 2 process); a park closed itself by adoption, a fired park still deferred; 4 review rounds, both findings prose-derived figures; threshold-suppression recurrence 25.
- **As delivered**: 34/34 SP; unit suite 868 → **1128 + 1 todo** (88 files); CI E2E 60/60 (chromium + webkit); prod verified functionally after every merge deploy except the stale-CSS caveat above.
- **What fell due during the spillover**: the weeks of Aug 31–Sep 4 and Sep 7–11 were consumed by delivery and never planned; the Cleanup Week (already overdue) stays user-pinned post-launch. Nothing else scheduled fell due.
- **Carried forward**: TASK-055 (→ G23), the NP picker (→ G25), the G16 intake riders (→ G24), the 🟠 stale-CSS redeploy (→ G22), the domain chain (dormant), TASK-040, the propagation queue, the G2 volume-triggered hardening pieces (idempotency token, CSPRNG suffix), the NP status-webhook question (TASK-049/050).

_Full detail: [DONE.md](DONE.md) · the prior plan in git history of this file (pre-2026-09-16 version)._
