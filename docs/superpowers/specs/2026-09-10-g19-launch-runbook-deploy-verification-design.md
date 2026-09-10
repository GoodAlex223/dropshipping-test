# G19 — Launch Runbook & Deploy Verification: Design Spec

**Date**: 2026-09-10
**Status**: Approved — brainstormed section-by-section and approved by the user 2026-09-10. Not yet implemented.
**Branch**: `feat/g19-launch-runbook-deploy-verification` (from `main` @ `0c8f62c`)
**Source**: WEEKLY.md G19 (🔵 User, 2 members, 3 SP, Thu) — the user-raised production-launch deploy runbook (🔵 [2026-08-10], from G5's prod email-config round-trip) plus the three 🟤 riders it subsumes: [2026-07-21] post-deploy smoke test, [2026-08-14] served-asset staleness check, [2026-08-18] "nothing verifies a Vercel production deploy except a human looking at it". Two further 🟤 entries are folded in by their own request: [2026-09-04] "the smoke script must probe rejections, not just renders" and [2026-09-06] "the Vercel Preview environment never migrates".
**Program context**: `2026-07-14-mirox-shop-program-design.md` (Mirox rebrand + Ukraine launch). This is the operational slice of TASK-054 launch readiness. Its cutover half depends on TASK-056 items 1 / 1a / 2, which are still awaiting the client — that dependency is expressed as ⛔ BLOCKED steps, not as absent ones (§4).

## Problem

### 1. Nothing verifies a production deploy except a human looking at it

Production is deployed by the **Vercel Git integration**. The repository's own GitHub Actions "Deploy to Vercel" job is a validated no-op — its secrets are unset, so its `prisma migrate deploy` step has never run. A green Actions badge therefore proves nothing about production. Every production deploy in this project's history (G12, G13, G14, G16, G17, G18) was confirmed by a person opening the site. That is standing practice, and it has worked, but it is practice rather than a control: it does not fail loudly, it does not run when nobody remembers, and it checks whatever the person happened to look at.

### 2. The failures this project has actually suffered are invisible to HTTP 200

The probe list in §2 is not generic; each row is derived from a real incident in this repository:

- **Stale CSS across two deploys** (PR #35): Vercel's restored build cache short-circuited CSS compilation. Fresh HTML render, `x-vercel-cache: MISS`, and the _old_ chunk hash. A changed `globals.css` did not bust it; only a cache-off redeploy did. Every page returned 200 throughout.
- **Production schema drift** (pre-PR #22): unmigrated `reviews`/`subscribers` tables 500'd the homepage. This is the one failure a naive 200 check _does_ catch, which is why it belongs in the set.
- **Google Shopping feed served zero items** from the first seeded catalog until G16 (2026-09-01) — roughly two months. The route filters with `validateFeedItemSafe`, so an item failing validation is dropped **silently**; the feed returned 200 with a well-formed, empty document the entire time.
- **PDP `og:image` 500'd in production** (PR #24) because Vercel does not trace `public/` assets into function bundles — caught only because a backlog entry demanded someone fetch it by hand after the deploy.
- **`/_next/image` was an SSRF proxy** (G17 finding F6): `remotePatterns: [{ hostname: "**" }]` let the unauthenticated optimizer fetch any https URL. The fix derives an allow-list from `AWS_CLOUDFRONT_URL` at **build** time — which means a missing or malformed value in the Vercel build environment silently yields an empty allow-list and 400s every product image.

A check that only asserts `200` would have caught exactly one of these five.

### 3. There is no runbook for the real-domain cutover

The cutover is a multi-actor sequence with ordering constraints that are easy to get wrong under time pressure: the domain must exist before Resend DNS can be verified, which must pass before `EMAIL_FROM` can leave `onboarding@resend.dev`, which requires a redeploy to take effect. Until that chain closes, **real customers receive no order e-mail at all** — `onboarding@resend.dev` delivers only to the Resend account owner's own inbox. The code path is correct and live-verified (G5, plus the PR #34 await hotfix); the sending domain is the entire gap. None of this ordering is written down anywhere executable.

### 4. The cutover cannot be rehearsed

No domain has been purchased. TASK-056 item 1 is still 📨 awaiting the client, and items 1a (`AWS_CLOUDFRONT_URL` → `img.<domain>`) and 2 (Resend DNS → `EMAIL_FROM`) are chained behind it. The cutover half of this group is therefore a document that will be executed exactly once, later, by someone reading it — and it ships verified by review only. The smoke half, by contrast, can be and will be exercised against live production this week. This asymmetry is real and is recorded in §6 and § Risks rather than smoothed over.

### 5. Constraints carried in

- **`db:seed` must never target production again.** The 2026-09-01 ruling stands: real product rows are in production, `main()` deletes the entire catalog/transactional tree before reseeding, and `SEED_ALLOW_REMOTE=1` is retired for production permanently.
- **The Preview environment never migrates.** PR #44's preview build logged `DIRECT_URL is not set — skipping migrations`. Setting `DIRECT_URL` for Preview would be actively harmful: previews would apply unmerged migrations to the production database.
- **Docs freshness is enforced by a test.** A new doc needs its `docs/README.md` index row in the same commit, and the index's own header date must be ≥ every date it lists.
- Design specs under `docs/superpowers/specs/` carry `**Date**:` (authoring date, never edited, never compared by the linter).

## Decisions

Rulings taken with the user during the 2026-09-10 brainstorm, in order:

1. **Smoke script ships as a local CLI, not CI wiring.** A `deployment_status`-triggered workflow is the right end state and is exactly what the [2026-08-18] rider asks for, but verifying that it fires — with the correct `environment` string, from the Git integration rather than the Actions job — requires a production deploy whose timing we do not control. Shipping an unverified CI control during launch week would be a fresh instance of the failure mode this group exists to close. The wiring is filed 🟤 (§ Out of scope).
2. **The staleness check has three outcomes, not two.** `CHANGED` passes; `UNCHANGED` fails; **`NO-BASELINE` also fails** (exit non-zero) unless `--allow-missing-baseline` is passed explicitly. A missing state file must not render the check silently inconclusive — a check that cannot fail looks exactly like one that passes.
3. **One document, two parts**, at `docs/deployment/launch-runbook.md`: Part 1 the one-time cutover, Part 2 the recurring every-deploy checks. Two separate docs would split what launch day executes together, since the cutover's own post phase _is_ the recurring checklist.
4. **The full 13-row probe set**, not the four rows the WEEKLY line names. The extras are data rows on an existing engine, and the feed-item-count row guards the one failure class here that has actually bitten.
5. **Discovery over hardcoding.** The R2 image URL, product slugs and CSS hashes are all read out of the target's own HTML at run time. Nothing pins `pub-444210ee….r2.dev` or a product name, so the script survives catalog edits and the domain swap without an edit.
6. **Two stale statements in the source backlog entry are corrected, not transcribed** (§4.3).

## Design

### §1 `scripts/smoke.ts` — architecture

A single `tsx` script, matching the existing `scripts/rotate-password.ts` / `scripts/delete-test-accounts.ts` convention, wired as `npm run smoke`.

```
npm run smoke -- --url https://dropshipping-test.vercel.app
```

Two phases:

1. **Context build.** Fetch `/` once. From that one response derive: the set of `/_next/static/css/<hash>.css` chunk hashes, the set of `/products/<slug>` links, and one absolute remote image URL taken from a `/_next/image?url=…` parameter whose host is not the target's own. This single fetch is what makes the rest of the rows independent of catalog contents.
2. **Probe run.** Iterate the row table (§2), print one fixed-width line per row, tally, exit `0` only if every row passed.

Structure: probes are **data**, not code paths — each row is `{ id, label, run(ctx): Promise<Result> }` over one shared HTTP helper (timeout, no redirect-following, header capture). Adding a row is one entry; the engine never changes. The pure helpers (`extractCssHashes`, `extractProductSlugs`, `findRemoteImageUrl`, `compareBaseline`, `exitCodeFor`) are exported for unit testing and contain no I/O.

Flags: `--url <target>` (required), `--baseline <file>`, `--save-baseline <file>`, `--allow-missing-baseline`, `--json`.

### §2 The probe table

| #   | Probe                                                               | Assertion                                                  | Derived from                                     |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| 1   | `GET /`                                                             | 200 **and** ≥ 1 `/products/<slug>` link in the server HTML | WEEKLY "DB-backed string" (relocated — see §2.1) |
| 2   | `GET /products`                                                     | 200 **only**                                               | WEEKLY (corrected — see §2.1)                    |
| 3   | `GET /api/products?limit=1`                                         | 200 **and** `data[0].slug` is a non-empty string           | WEEKLY "DB-backed route"                         |
| 4   | `GET /api/health`                                                   | 200 **and** `checks.database.status === "ok"`              | Problem §2, schema drift                         |
| 5   | `GET /categories/hudi`                                              | 307 **and** `location: /products?category=hudi`            | WEEKLY; guards the G12 routing-layer redirect    |
| 6   | CSS chunk-hash set vs baseline                                      | `CHANGED` / `UNCHANGED` (fail) / `NO-BASELINE` (fail)      | 🟤 [2026-08-14] staleness                        |
| 7   | `GET /_next/image?url=<discovered R2 image>&w=640&q=75`             | 200                                                        | 🟤 [2026-09-04]; **load-bearing, see §2.2**      |
| 8   | `GET /_next/image?url=https://example.invalid/x.png`                | 400                                                        | 🟤 [2026-09-04] arbitrary host                   |
| 9   | `GET /_next/image?url=http://169.254.169.254/latest/meta-data/`     | 400                                                        | 🟤 [2026-09-04] cloud metadata                   |
| 10  | `GET /_next/image?url=https://<discovered CDN host>.evil.com/x.png` | 400                                                        | 🟤 [2026-09-04] lookalike host                   |
| 11  | `GET /feed/google-shopping.xml`                                     | 200 **and** `<item>` count > 0                             | Problem §2, silent-zero feed                     |
| 12  | `GET /track`                                                        | 200                                                        | G18 surface                                      |
| 13  | `GET /sitemap.xml`, `GET /robots.txt`                               | 200 each                                                   | cutover post-phase (§4.2)                        |

#### §2.1 The WEEKLY line item is wrong about `/products`, and the correction matters

WEEKLY specifies "fetch `/products` … (assert 200 + a DB-backed string)". Verified against live production on 2026-09-10: `/products` renders `<ProductsContent />`, a client component, and its 98 KB of server HTML contains **zero** product slugs, zero SKUs and zero `r2.dev` URLs — the listing is fetched in the browser. A DB-backed string assertion there could never pass.

The homepage is the opposite: `/` server-renders four product slugs (`futbolka-mirox`, `hudi-mirox-basic`, `olimpiyka-lampasy-bila`, `olimpiyka-lampasy-chorna`) and real R2 image URLs. So the DB-backed string assertion moves to row 1, `/products` keeps a 200-only check (the shell must still render), and row 3 adds an explicit JSON-level DB assertion via the API. This is the difference between a check that fails on a broken deploy and one that fails on every deploy, which is the same defect wearing different clothes.

#### §2.2 Row 7 is what stops rows 8–10 being vacuous

`remotePatterns` is computed at **build** time from `AWS_CLOUDFRONT_URL` (`next.config.mjs` → `cdnRemotePatterns()`). If that variable is absent or malformed in the Vercel build environment, the function returns `[]` and the optimizer rejects **every** remote host — including the real one. Rows 8–10 would all go green while the live catalogue's images were 400ing.

Row 7 (a real, currently-served R2 image must return 200) is therefore not a nice-to-have alongside the rejection probes; it is the control that gives them meaning. Stated generally: a narrowing fix needs an accept probe and a reject probe, or neither result is informative. This is the `verify-the-rejection-not-the-render` lesson run in both directions.

### §3 Baseline and exit semantics

State lives in `.smoke-state.json` at the repository root, gitignored, shaped as a map **keyed by target origin** so that a run against a preview URL cannot clobber the production baseline:

```json
{
  "https://dropshipping-test.vercel.app": {
    "cssHashes": ["143491e5ab2efd5e", "1ee63df177967359"],
    "observedAt": "2026-09-10T03:31:38.394Z"
  }
}
```

Row 6 resolves to exactly one of:

- **`CHANGED`** — the observed hash set differs from the stored one. Pass. The new set is written back.
- **`UNCHANGED`** — identical sets. **Fail.** After a CSS/JS-affecting deploy this is the stale-build-cache signature; the runbook's remedy (Part 2) is a cache-off redeploy.
- **`NO-BASELINE`** — no stored entry for this origin. **Fail**, with a message naming `--allow-missing-baseline` and `--save-baseline`. The set is still written, so the _next_ run is meaningful.

`--baseline <file>` / `--save-baseline <file>` provide the stateless two-step for a fresh machine or a clean clone.

Exit code is `0` if and only if every row passed. `--json` emits the full result array for future CI consumption without changing the exit contract.

A deliberate limitation, stated so it is not mistaken for a bug: row 6 compares against _the last run_, not against _the last deploy_. Two runs with no deploy between them report `UNCHANGED` and fail. That is the correct bias for a post-deploy check — a false alarm costs one glance, a missed stale build cost this project two deploys — and Part 2 of the runbook says to run it once, after deploying.

### §4 `docs/deployment/launch-runbook.md`

Indexed in `docs/README.md` in the same commit, with the index header date bumped to match (freshness linter).

#### §4.1 Part 1 — the one-time real-domain cutover

Numbered steps in three phases. Every step carries an **owner** (client / owner / dev) and a **verification line** — how you know it worked, not just that you did it. Steps gated on TASK-056 carry **⛔ BLOCKED** plus the named unblocking condition, so a blocked step can never be mistaken for an un-started one. (This follows the [2026-07-18] guardrail: mark content-blocked items _blocked_, never "done".)

**Pre** — domain purchased and DNS access confirmed (⛔ TASK-056 №1) · Resend SPF + DKIM verified on the real domain (⛔ №2; a `vercel.app` subdomain can never be verified, Vercel owns that DNS) · `EMAIL_FROM` → `noreply@<domain>` + redeploy · `AWS_CLOUDFRONT_URL` → `https://img.<domain>` bound to the R2 bucket (⛔ №1a — now a one-variable swap, the bucket is live) · R2 CORS rule extended to the new origin · `FEEDBACK_EMAIL` → the client's real recipient · `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_STORE_NAME` reviewed · legal pages live · **decision gate**: the 8 seeded placeholder products are still active in production alongside the 2 real ones (program spec decision 9, deliberately outstanding) — decide with the client whether they are deactivated before the domain goes public.

> **Superseded 2026-09-10 (Task 7 review).** The `⛔ №1a` parenthetical above — "now a one-variable swap, the bucket is live" — is wrong: `ProductImage.url` stores an absolute URL baked in at upload time (`src/lib/s3.ts:84`), and `next.config.mjs`'s `cdnRemotePatterns()` allows exactly one remote host. Flipping `AWS_CLOUDFRONT_URL` strands every existing real-product image on the old host unless a `ProductImage.url` backfill runs in the same window — see `docs/deployment/launch-runbook.md` Step 4.

**While** — attach the domain and confirm SSL in Vercel · deploy via the **Git integration**, never the Actions job · confirm in the build log that `scripts/vercel-build.sh` ran `prisma migrate deploy` against `DIRECT_URL`.

**Post** — `npm run smoke -- --url https://<domain>` · place a real COD order and confirm the confirmation e-mail arrives in a real (non-owner) inbox · newsletter double-opt-in round-trip · `sitemap.xml` / `robots.txt` serving the new domain · GA4/GTM firing after consent · Search Console property + Google Shopping feed re-registered on the new domain.

#### §4.2 Part 2 — every production deploy

Short and repeatable: run the smoke script; if row 6 reports `UNCHANGED` after a CSS/JS-affecting change, redeploy with the build cache off (`VERCEL_FORCE_NO_BUILD_CACHE=1`, or the dashboard's Redeploy with the cache box unchecked) and re-run; a green Actions badge is not evidence of a deploy.

#### §4.3 Two corrections to the source entry

The 🔵 [2026-08-10] backlog entry predates two later rulings, and the runbook records the current state rather than transcribing the entry verbatim:

1. Its **"user-gated prod re-seed plan"** is superseded. Since 2026-09-01 real product rows live in production, `db:seed` deletes the whole catalog/transactional tree before reseeding, and `SEED_ALLOW_REMOTE=1` is retired for production permanently. The runbook says **do not re-seed production**; remaining products are entered by the client through the admin panel, per the guide written in G16.
2. **Preview never migrates** is recorded as an accepted limitation, carrying its warning: a preview of a column-adding branch runs the new Prisma client against the unmigrated schema, and the fix is _not_ to set `DIRECT_URL` for Preview (that would apply unmerged migrations to the production database). The durable options — a Neon branch per preview, or accepting degraded previews — stay on the backlog.

### §5 Collateral

- **`docs/deployment/setup.md`** — the existing "Pre-deployment Checklist" (line 527) is stale: it demands Stripe live keys and a Stripe webhook secret, both dormant since G2's COD switch. Repointed at the runbook with the dead rows corrected. Two checklists that disagree is a doc-contradicts-code condition, and the fix belongs with the doc that supersedes it.
- **`.gitignore`** — `.smoke-state.json`.
- **`package.json`** — `"smoke": "tsx scripts/smoke.ts"`.
- **`docs/README.md`** — index rows for this spec and for the runbook; header date bumped.

### §6 Verification

**The smoke script is verified twice, in opposite directions.**

1. `tests/unit/smoke.test.ts` covers the pure helpers against fixture HTML with no network: hash extraction from realistic `<link>` markup, slug extraction, remote-image discovery (including the case where only same-origin images exist), and all three baseline outcomes including origin keying.
2. It is then run against live production, **and each row is deliberately forced to fail** — a wrong URL, a tampered baseline entry, an inverted expectation — to confirm the failures actually fire and the exit code flips. Rows that pass on the first try and were never observed failing are not verified; they are merely green.

**The runbook is verified by review only.** No domain exists, so its cutover half cannot be dry-run — see Problem §4 and § Risks. Its factual claims (env var names, the `vercel-build.sh` chain, the Resend constraint, the R2 variable contract) are checkable against the repository and are checked; its _sequence_ is not exercised until launch day.

Standard gates apply throughout: `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run format:check`.

## Out of scope (recorded)

- **`deployment_status`-triggered CI wiring** for the smoke script — filed 🟤 at implementation time. Decision 1; this is what finally converts the ritual into a control that runs without being remembered.
- **Per-preview Neon branches** to fix the never-migrating Preview environment — stays on the backlog (§4.3.2); the runbook documents the limitation rather than resolving it.
- **Lighthouse CI / preview-deploy comments / scheduled `npm audit`** — TASK-040, a separate group.
- **Uptime monitoring and error tracking** (Sentry, still not implemented) — a monitoring concern, not a deploy-verification one.
- **Executing the cutover.** This group writes the runbook; running it is launch day, gated on TASK-056.

## Risks & open items

1. **The cutover half ships unrehearsed.** Mitigation: every factual claim is checked against the repository, ⛔ steps name their unblocking condition, and each step carries a verification line so the executor can tell a completed step from a skipped one. Residual risk accepted: the ordering may still prove wrong under real conditions, and the runbook should be corrected in place on launch day rather than after.
2. **The smoke script still requires a human to run it.** Decision 1 accepts this for launch week; the 🟤 follow-up closes it. The runbook makes it a numbered step so it is not left to memory.
3. **Row 6 fails on a second run with no deploy in between** (§3). Documented, deliberate, biased toward false alarm over silence.
4. **Rows 8–10 assert a 400 from `/_next/image`.** If Next.js were ever to change the rejection status for a disallowed host, these rows would fail without a security regression having occurred. The failure mode is a loud false alarm, not a silent pass, which is the correct direction — and row 7 would distinguish the two cases immediately.
5. **The probe list encodes today's routes.** `/categories/hudi` assumes that category slug continues to exist; the feed row assumes the feed stays non-empty by design. Both are true now and both are catalog-dependent. If the client's catalog changes shape, row 5's slug is the one line that may need an edit — noted in the script's header comment.
