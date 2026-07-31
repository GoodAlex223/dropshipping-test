# Weekly Plan

**Week of**: 2026-07-27 to 2026-08-02
**Last Updated**: 2026-07-31

---

## 🎯 Weekly Focus

**Primary Goal**: Ship TASK-057 — Mirox design adoption (dark-theme token flip, homepage/header/footer realignment, Mirox clothing seed, UAH display) and its v1.3/v1.4 task-map revision.

**Secondary Goals**:

- Start TASK-036 catalog redesign once TASK-057 merges (re-scoped to `Mirox Catalog.dc.html`)
- Carry TASK-039 i18n foundation forward — still a payments prerequisite (monobank requires a UA-language site)

---

## 📋 Planned Tasks

### Must Complete (Critical)

| Task                  | Reference        | Status    | Notes                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ---------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mirox design adoption | TODO.md TASK-057 | ✅ PR #24 | Merged `f9ceb97` 2026-07-31 after 2 review rounds (round 2 unblocked CI: `docs/**` ESLint ignore — Build/E2E ran for the first time on the branch, all green). Visual gate signed off v3. Prod serving the rebrand; PDP `og:image` ENOENT → follow-up [PR #25](https://github.com/GoodAlex223/dropshipping-test/pull/25). Also revises TASK-036/037/039/055/056. |

### Should Complete (Important)

| Task                  | Reference        | Status     | Notes                                                                                      |
| --------------------- | ---------------- | ---------- | ------------------------------------------------------------------------------------------ |
| Catalog redesign      | TODO.md TASK-036 | 📋 Planned | Re-scoped to `Mirox Catalog.dc.html` (TASK-057); hydration gate + client-brief extras stay |
| Product page redesign | TODO.md TASK-037 | 📋 Planned | Re-scoped to `Mirox Product.dc.html` (TASK-057); gains `SizePicker` + `BoughtTogether`     |

### Nice to Have (If Time Permits)

| Task            | Reference        | Status     | Notes                                                                                            |
| --------------- | ---------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| i18n foundation | TODO.md TASK-039 | 📋 Planned | Scope shifted: externalize now-hardcoded UA strings; `formatPrice()` already landed via TASK-057 |
| CI extensions   | TODO.md TASK-040 | 📋 Planned | Lighthouse budget, preview deploys, post-deploy smoke test                                       |

---

## 🚧 Blockers & Risks

| Blocker                          | Impact                                                                         | Mitigation                                                                           | Owner  |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------ |
| ~~TASK-057 not yet merged~~      | Resolved 2026-07-31 — PR #24 merged `f9ceb97`; TASK-036/037 unblocked          | —                                                                                    | Claude |
| ~~Prod re-seed not yet run~~     | Resolved 2026-07-31 — user-approved re-seed ran; prod serves the Mirox catalog | Verified live: 8 MRX products via API, PDP 200, homepage UAH/Ukrainian content       | User   |
| Client content inventory pending | Real photography, logo vector, real socials/claims, size charts, legal copy    | TASK-056 consolidates the ask; TASK-057 shipped generated placeholders as an interim | User   |
| Client payments prerequisites    | TASK-048 gateway pick blocked                                                  | 9-item checklist (decision doc §5.3) — chase before v1.4                             | User   |

---

## 📊 Progress Tracking

### Daily Log

#### Monday (2026-07-27)

- [x] TASK-057 brainstorm → spec → plan → Tasks 1–8 (subagent-driven — fresh implementer + independent reviewer per task)
- **Completed**: design handoff (`docs/design/design_handoff_mirox/`) adopted as canonical, app image assets staged; shared `formatPrice()` (`src/lib/format.ts`, uk-UA formatting per decision doc §7.4) replacing 5 duplicated USD formatters; `:root` flipped to the Mirox dark palette with `[data-surface="dark"]` inversion machinery deleted; Ukrainian content config (`src/content/{brand,home,site}.ts`) and homepage restructured to the handoff's section order; hero photo variant with CSS vignette + bordered benefit strip; header/footer realigned (client logo PNG, Ukrainian nav, footer benefits/socials/copyright); WhyChooseUs 2-column with stat cards + testimonial cards with avatars + amber `--rating` token.
- **Blockers**: none

#### Tuesday (2026-07-28)

- [x] TASK-057 Tasks 9–11 (Mirox seed, Cyrillic OG images, dark-coherence sweep) + Task 12 first pass (full verification + visual gate)
- **Completed**: Mirox clothing seed (8 products, UAH prices, `brand: "Mirox"`, guarded destructive reset via `SEED_ALLOW_REMOTE`) replacing the electronics catalog; Cyrillic-capable OG fonts + PDP OG card restyled to the Mirox palette (incidentally fixed a pre-existing prod bug — the PDP OG route crashed on relative product-image URLs, Satori needs absolute); deferred bright utilities cleared on cart/products, colour guard extended to cart/products/categories, admin functional-contrast pass (found and fixed a dead `dark:` badge and two stat-icon circles). Task 12's full verification pass found and fixed 2 MAJOR bugs: a local-only `NODE_ENV=development` leak (devcontainer + `.env.example`) corrupting every responsive Tailwind utility in `next build`'s compiled CSS (Vercel unaffected — the platform sets its own `NODE_ENV=production` first), and `tests/e2e/navigation.spec.ts` never updated for the Ukrainian header rework (rewritten for the new nav, 25/25 passing). Visual-fidelity gate captured (desktop + mobile, OG cards) and presented for sign-off; **user returned revision requests same day** (logo size, eyebrow removal, hero containment, 2-line headline, card buttons removed + sizes row + badge pill + rail reorder, socials icons-only, subscribe UA copy, OG ghost-logo watermark on both cards); info-page nav/footer links confirmed staying hidden until TASK-055 ships; return window «14 днів» **user-approved** for future TASK-055 use.
- **Blockers**: none — revisions queued for the next session

#### Wednesday (2026-07-29)

- [x] TASK-057 gate revision waves (3 rounds) → Task 12 sign-off → Task 13 docs housekeeping
- **Completed**: implemented all revisions from Tuesday's verdict across 3 rounds (`6f1877e`, `7c06be8`, `ea39abd`, `92bfe0e`) — round 1 addressed all 9 items A–I and, along the way, found+fixed a `next/og` static-prerender bug (a build-time self-fetch of a local asset by absolute URL silently fails during `next build`'s prerender; switched to an embedded base64 `data:` URI); round 2 fixed an E2E cart-spec locator; a v2 gate re-presentation (noting a Chromium `fullPage`-capture artifact that drops the hero's composited image layer — worked around with a tall-viewport, non-fullPage capture instead); round 3 fixed WhyChooseUs checklist vertical centering. **USER SIGN-OFF GRANTED (v3)** — Task 12 complete. Task 13 (docs housekeeping): TASK-057 added to TODO.md; TASK-036/037/039 re-scoped and TASK-055/056 annotated per the design-adoption spec §4; WEEKLY.md rolled to this week; new BACKLOG intake group filed; docs/README.md indexed; the 2026-07-14 program spec noted; CLAUDE.md propagation check applied.
- **Blockers**: none. PR #24 opened with `/code-review` posted (review findings fixed in-branch); the user-approved prod re-seed happens only after the Vercel deploy is verified serving the merged branch.

#### Thursday (2026-07-31) — today

- [x] PR #24 review rounds → merge → post-merge completion workflow
- **Completed**: review round 1 fixed all 4 findings (`8166e47` — token-derived `color-mix` vignette, PR-status doc sync, truthful `--radius` comment); review round 2 surfaced **CI red on every push of the branch** (ESLint linting the Figma-exported vendor JS — `--ext` is inert under flat config) → fixed by ignoring `docs/**` (`38ce2c0`), producing the branch's **first fully-green CI run** with Build + E2E executing for the first time; reviewer's final ruling 7 fixed + 1 accepted, `CLEAN`/`MERGEABLE`. **PR #24 merged** (`f9ceb97`, `--merge`), branches deleted, `main` pulled. Post-merge deploy verified: prod serving the rebrand (~2 min), root OG card 200; **PDP `og:image` 500 in prod** (`ENOENT` on `og-logo-ghost.png` — `public/` not traced into the serverless bundle; anticipated risk) → `outputFileTracingIncludes` fix on follow-up PR #25. Completion workflow: DONE.md entry, plan archived, TODO/WEEKLY/BACKLOG/docs-README synced, memory captured.
- **Blockers**: prod re-seed still gated on explicit user approval (prod shows electronics under the Mirox storefront until then)

---

## 🔮 Next Week Preview

**Tentative Focus**: Merge TASK-057 to `main`; start TASK-036 catalog + TASK-037 product page on the new tokens/content-config; continue chasing TASK-039/TASK-048 prerequisites.

**Preparation Needed**:

- [x] Push `feat/task-057-design-adoption`, open the PR (#24), run `/code-review` (sub-threshold findings listed in chat and addressed)
- [x] User-approved prod re-seed (`SEED_ALLOW_REMOTE=1` against the prod `DIRECT_URL`) — ran 2026-07-31 after the deploy was verified serving the merged branch; prod catalog is now Mirox (verified via API/PDP/homepage)
- [ ] Client content inventory (TASK-056): real photography, logo vector, real follower counts/claim figures, announcement copy, free-shipping threshold, size charts, legal copy — hero/products/logo now have generated placeholders as an interim
- [ ] **Client answers to the 9-item prerequisites checklist** ([decision doc §5.3](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md)) — legal form, tax group, turnover, VAT, current bank, installments, РРО/ПРРО (accountant), NovaPay account, site prerequisites. Until these land, TASK-048 has a decision tree but no single gateway.
- [ ] **Open the Cloudflare-blocked `developers.novaposhta.ua` from an unblocked network** to settle whether the classic API has a status webhook — gates TASK-049's polling design (decision doc §6.6)

---

## Status Legend

| Symbol | Meaning      |
| ------ | ------------ |
| 📋     | Planned      |
| ⏳     | In Progress  |
| ✅     | Completed    |
| ⏸️     | On Hold      |
| ❌     | Canceled     |
| 🔄     | Carried Over |
