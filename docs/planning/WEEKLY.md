# Weekly Plan

**Week of**: 2026-07-20 to 2026-07-26
**Last Updated**: 2026-07-21

---

## 🎯 Weekly Focus

**Primary Goal**: Ship the v1.3 Mirox customer-facing rebrand — homepage (done), then catalog and product page.

**Secondary Goals**:

- ✅ Homepage rebrand (TASK-035) — completed and merged, PR #21
- ✅ Harden the deploy pipeline — migrations now applied on every Vercel deploy (PR #22), after a post-merge prod incident exposed months of silent schema drift
- Start i18n foundation (TASK-039) — also a payments prerequisite (monobank requires a UA-language site)

---

## 📋 Planned Tasks

### Must Complete (Critical)

| Task             | Reference        | Status    | Notes                                                                                                                                                              |
| ---------------- | ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Homepage rebrand | TODO.md TASK-035 | ✅ PR #21 | Merged 2026-07-21 (`0992851`). Mirox homepage on the TASK-034 tokens; content-config layer; real-bestsellers rail. Prod hotfix PR #22 (`e89060d`) — see Daily Log. |

### Should Complete (Important)

| Task                  | Reference        | Status     | Notes                                                                                              |
| --------------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Catalog redesign      | TODO.md TASK-036 | 📋 Planned | Filters + sorting; must preserve/replace the E2E hydration gate; imports `getBestsellers` for sort |
| Product page redesign | TODO.md TASK-037 | 📋 Planned | Gallery, size/color, stock counter, related + recently-viewed                                      |

### Nice to Have (If Time Permits)

| Task            | Reference        | Status     | Notes                                                            |
| --------------- | ---------------- | ---------- | ---------------------------------------------------------------- |
| i18n foundation | TODO.md TASK-039 | 📋 Planned | UA default / RU toggle, UAH formatting; hard prereq for payments |
| CI extensions   | TODO.md TASK-040 | 📋 Planned | Lighthouse budget, preview deploys, post-deploy smoke test       |

---

## 🚧 Blockers & Risks

| Blocker                          | Impact                                       | Mitigation                                                   | Owner |
| -------------------------------- | -------------------------------------------- | ------------------------------------------------------------ | ----- |
| Design files not yet delivered   | Possible rework in TASK-036/037              | Token-driven components from TASK-034; build to the brief    | User  |
| Client content inventory pending | Hero photo, logo vector, real socials/claims | TASK-056 consolidates the ask; placeholders/gates until then | User  |
| Client payments prerequisites    | TASK-048 gateway pick blocked                | 9-item checklist (decision doc §5.3) — chase before v1.4     | User  |

---

## 📊 Progress Tracking

### Daily Log

_(TASK-035 spec + plan were authored 2026-07-19, in the prior week — see DONE.md.)_

#### Monday (2026-07-20)

- [x] TASK-035: homepage implementation (subagent-driven — fresh implementer + independent reviewer per task)
- **Completed**: the homepage rebuilt on the Mirox tokens — content-config layer (`src/content/{brand,site,home}.ts`), home sections (`Hero`, `ProductRail`, `WhyChooseUs`, `Testimonials`) + shared `AnnouncementBar`/`BenefitStrip`/`SocialLinks`, data layer (`product-queries.ts` real-bestsellers with fallback, `review-queries.ts` testimonials), site-wide code-generated OG card, rebranded footer. English copy, extraction-ready for i18n.
- **Blockers**: none (hero ships typographic-complete; real photography deferred to the client — TASK-056)

#### Tuesday (2026-07-21)

- [x] TASK-035 shipped + production incident hotfix + completion workflow
- **Completed**: PR #21 code-review round (OG card was silently suppressed by `getDefaultMetadata()` pinning the stale PNG — fixed so the generated Mirox card renders site-wide; docs index date) then merged (`0992851`). **Post-merge prod incident**: homepage 500 on every request — root-caused via Vercel runtime logs to a `reviews` table that had never been migrated to production (schema drifted since Feb; nothing ran `migrate deploy` on deploy). Hotfix **PR #22** (`e89060d`): `safeSection()` resilience so a failed section can't 500 the page, plus a `vercel-build` step that applies migrations on every Vercel deploy (via `DIRECT_URL`). Verified: prod `/` 200, all 5 pending migrations applied, zero runtime errors, reviews + newsletter restored. Completion workflow (extract/archive/transition/commit/memory).
- **Blockers**: none. **Carried**: 8 BACKLOG entries (testimonials under-fill, `?sort=newest` inert until TASK-036, USD-vs-UAH copy, migration-drift guard, post-deploy smoke test, `DIRECT_URL` docs, …)

---

## 🔮 Next Week Preview

**Tentative Focus**: Finish TASK-036 catalog + TASK-037 product page; begin TASK-039 i18n (Track B payments prerequisite).

**Preparation Needed**:

- [ ] Client design files (Figma) — chase if still missing
- [ ] Client content inventory (TASK-056): hero model photos, vector logo, real follower counts/claim figures, announcement copy, free-shipping threshold, return window, size charts, legal copy
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
