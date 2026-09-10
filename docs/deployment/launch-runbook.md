# Production Launch Runbook

One-time real-domain cutover checklist, plus the checks to run after every production deploy.

**Last Updated**: 2026-09-10

---

**See also**: the
[design spec](../superpowers/specs/2026-09-10-g19-launch-runbook-deploy-verification-design.md) this
runbook implements (rationale, the 14-row probe table, risks), the
[implementation plan](../planning/plans/2026-09-10_g19-launch-runbook-deploy-verification.md) and its
[Verification Log](../planning/plans/2026-09-10_g19-launch-runbook-deploy-verification.md#verification-log)
(exactly what has and hasn't been run against live production), and
[deployment/setup.md](setup.md) for local/general environment variable setup.

Throughout this document, `<domain>` stands for whichever real domain Step 1 settles on — substitute
it literally, including inside shell commands.

## Reliability of this document

**Part 1 has never been executed.** No real domain exists yet — TASK-056 item №1 is still awaiting
the client — so every fact below (env var names, file paths, script behavior, the
`vercel-build.sh` migration chain, the Resend/R2 constraints) has been checked against this
repository's actual code and configuration, but the _sequence_, run top to bottom against a real
cutover, has not been rehearsed. If a step turns out to be wrong or mis-ordered on the day this is
actually run, **fix it in this file in place** — don't route around it silently, and don't let this
paragraph quietly go stale once a cutover has actually happened once.

**Part 2 has been run against live production repeatedly, including forcing every reachable failure
class on purpose**; see the Verification Log linked above for the real transcripts, and its own
"Discrepancies" section for what that session found unexpected.

## Roles

Every step below names who acts on it:

- **client** — the Mirox Shop business owner. Only they can buy the domain, grant DNS access, supply
  legal/contact copy, and choose who receives feedback-form e-mail.
- **owner** — whoever holds the Vercel / Resend / Cloudflare account credentials for this project
  (dashboards, environment variables, DNS-adjacent settings).
- **dev** — whoever has repo/CLI access and runs the verification commands (`npm run smoke`, `curl`,
  reading build logs, querying the database).

On a small team these can be the same physical person wearing different hats — the label says what
kind of access a step needs, not necessarily a distinct individual. All ⛔ markers below cite item
numbers from the TASK-056 client ask; the full tracking table with current status lives in
[planning/TODO.md](../planning/TODO.md).

## At a glance

| #   | Step                                        | Who          | Status                           |
| --- | ------------------------------------------- | ------------ | -------------------------------- |
| 1   | Domain purchased + DNS access confirmed     | client       | ⛔ BLOCKED — №1                  |
| 2   | Resend SPF + DKIM verified                  | owner        | ⛔ BLOCKED — №2 (needs 1)        |
| 3   | Set `EMAIL_FROM`                            | owner        | waits on 2                       |
| 4   | Backfill existing product-image URLs        | dev          | waits on 1                       |
| 5   | Set `AWS_CLOUDFRONT_URL`                    | owner        | ⛔ BLOCKED — №1a (needs 1, 4)    |
| 6   | Extend R2 CORS rule (admin upload only)     | owner        | waits on 1                       |
| 7   | Set `FEEDBACK_EMAIL`                        | client+owner | ⛔ BLOCKED — №3                  |
| 8   | Review `NEXT_PUBLIC_APP_URL` / `STORE_NAME` | owner        | waits on 1                       |
| 9   | Legal pages live                            | client+dev   | ⛔ BLOCKED — №4, №15             |
| 10  | DECISION: keep or deactivate placeholders   | client       | decision gate — no deploy needed |
| 11  | Attach domain + confirm SSL                 | owner        | waits on 1                       |
| 12  | Deploy via Git integration                  | owner/dev    | waits on 3, 4, 5, 8, 11          |
| 13  | Confirm migrations ran in the build log     | dev/owner    | waits on 12                      |
| 14  | Run `npm run smoke`                         | dev          | waits on 12                      |
| 15  | Real COD order + e-mail check               | dev/client   | waits on 14                      |
| 16  | Newsletter double opt-in round-trip         | dev          | waits on 14                      |
| 17  | sitemap/robots content check                | dev          | waits on 14                      |
| 18  | GA4/GTM firing after consent                | dev/owner    | waits on 14                      |
| 19  | Search Console + feed re-registration       | owner        | waits on 14                      |

---

## Part 1 — One-time real-domain cutover

### Pre (before attaching the domain)

#### Step 1 — Domain purchased, DNS access confirmed

⛔ **BLOCKED** — TASK-056 №1 (🔴 launch blocker). Gates every other step in this document.

- **Who:** client (buys/chooses the domain and either makes DNS changes on request or grants the
  owner delegated access — e.g., adding them as a collaborator at the registrar, or moving the zone
  to Cloudflare and inviting them in).
- **Depends on:** nothing — this is the first domino.
- **Unblocked when:** the client has said, in writing, which domain they bought and how DNS changes
  will actually get made (who logs in, or who they've granted access to).
- **Verification:** `dig NS <domain>` resolves, and you can personally add/edit a DNS record for it
  (prove it with a harmless TXT record) without relaying a request through the client live.

Settle the apex-vs-`www` question here too — it feeds Steps 6, 8 and 11 below and should not be
re-litigated at each one.

#### Step 2 — Resend SPF + DKIM verified on the real domain

⛔ **BLOCKED** — TASK-056 №2 (🔴 launch blocker).

**A `vercel.app` subdomain can never be verified in Resend — Vercel owns that DNS, not you.** This is
why `EMAIL_FROM` has been stuck on `onboarding@resend.dev` since G5: there was never a domain to
verify. Do not attempt this before Step 1 closes; it cannot succeed.

- **Who:** owner adds the domain in the Resend dashboard, gets back SPF (TXT) and DKIM
  (CNAME/TXT) records, and adds them wherever Step 1 established DNS is actually edited.
- **Depends on:** Step 1.
- **Unblocked when:** the DNS records exist (may still need the client, if they insist on making DNS
  changes personally).
- **Verification:** the Resend dashboard shows the domain's status as **Verified** for both SPF and
  DKIM — not "Pending". DNS propagation can take up to ~24–48 hours; don't treat "Pending" a few
  minutes after adding records as a failure.

#### Step 3 — Set `EMAIL_FROM`

- **Who:** owner, in the Vercel project's Production environment variables.
- **Depends on:** Step 2 (verified, not just added).
- **Action:** set `EMAIL_FROM=noreply@<domain>`. **Do not redeploy yet** — batch this with Steps 5
  and 8 into the single deploy at Step 12. (Step 6, the R2 CORS rule, is independent and needs no
  deploy at all.)
- **Verification:** the Vercel dashboard shows the new value for the Production scope. (It has no
  effect on the live site until Step 12's deploy — Vercel env vars are read at build/runtime start,
  not hot-reloaded.)

#### Step 4 — Backfill existing product-image URLs to the new CDN host

This step exists because of something the "one-variable swap" framing of Step 5 misses — found while
writing this runbook by reading `next.config.mjs` and `src/lib/s3.ts`, not carried over from any
earlier plan: **`ProductImage.url` stores a full, already-baked URL at upload time**
(`` `${AWS_CLOUDFRONT_URL}/${key}` ``, computed once inside `getPresignedUploadUrl` and persisted
as-is), and `next.config.mjs`'s `cdnRemotePatterns()` allows **exactly one** remote hostname —
whichever `AWS_CLOUDFRONT_URL` currently resolves to (deliberately narrow since G17 finding F6, the
SSRF fix). The moment Step 5 flips that variable and Step 12 redeploys, any `ProductImage.url` row
still pointing at the _old_ host is rejected (400) by the image optimizer. Changing the variable
really is one variable; making the images already in production survive that change is a separate
piece of work with no tooling yet.

Only real, uploaded products are affected. The 8 seeded placeholders store root-relative
`/images/...` paths served from `public/`, which need no `AWS_CLOUDFRONT_URL` allow-list entry at all
(see the comment in `next.config.mjs`) — nothing to backfill there.

- **Who:** dev.
- **Depends on:** Step 1 (need the final domain name — DNS does not need to be live yet, just the
  name).
- **Action:**
  1. Discover the _current_ CDN host rather than trusting this document's example — run
     `npm run smoke -- --url https://dropshipping-test.vercel.app` (or curl the homepage and grep for
     `_next/image?url=`) to read out whichever `pub-….r2.dev` host is live right now. As of the G19
     Verification Log (2026-09-10) it was
     `https://pub-444210ee6d61467894be231e22c9cd78.r2.dev`, but do not hardcode that — re-discover it
     at execution time, the same way `scripts/smoke.ts` itself does.
  2. There is **no existing script for this rewrite** — `scripts/` has none as of this writing.
     Write a small one-off (a Prisma script or a direct SQL `UPDATE`) that replaces that host prefix
     with `https://img.<domain>` across every `ProductImage.url` row, preserving the path/key
     unchanged (same bucket, same object — only the public hostname changes). Dry-run it against a
     local/staging copy of the data before touching production.
  3. Run it against production **immediately before or alongside** Step 12's deploy, not days
     earlier. There is an unavoidable window — however Steps 4/5/12 are ordered — between "the DB
     rows point at the new host" and "the next build's allow-list includes the new host", during
     which the real products' images 400. There is no zero-downtime version of this without a more
     elaborate dual-host setup, which is out of scope here; keep the window as short as practical.
- **Verification:** query `ProductImage.url` in production and confirm zero rows still reference the
  old host. Treat this as a first pass, not the final word: anyone uploading through
  `/admin/products` after this point and before Step 12's deploy actually lands writes a row with
  whatever host is live at upload time — the client is doing exactly this on an ongoing basis (see
  "Do not re-seed production" below), so this is a realistic gap, not a hypothetical one. **Step 12
  re-runs this exact check as a pre-flight gate immediately before triggering the deploy** — that is
  what actually closes the window, not this step alone. (The end-to-end proof — a 200 through the
  _new_ host — only lands after Step 12's deploy; that's Step 14's "real CDN" row.)

#### Step 5 — Set `AWS_CLOUDFRONT_URL`

⛔ **BLOCKED** — TASK-056 №1a. The R2 bucket (`mirox-media`) is already live and production images
already serve from the interim `r2.dev` URL, so once the domain exists this really is a one-variable
swap for _new_ uploads — Step 4 is what makes it safe for the images already in production.

- **Who:** owner, in Vercel Production env vars.
- **Depends on:** Step 1 (domain known). Do not run this until Step 4's backfill is ready to ship in
  the same window.
- **Unblocked when:** Step 1 (№1) has closed — TASK-056 №1a needs no separate client action of its
  own once the domain exists.
- **Action:** set `AWS_CLOUDFRONT_URL=https://img.<domain>`, bound to the R2 bucket via Cloudflare's
  R2 custom-domain feature. The exact DNS mechanics (whether the zone needs to sit in Cloudflare, or
  a CNAME suffices from wherever Step 1 lands DNS) depend on where the domain's DNS actually ends up
  — this has not been done before for this bucket, so confirm against Cloudflare's current R2
  custom-domain instructions at execution time rather than assuming. **Do not redeploy yet.**
- **Verification:** the Vercel dashboard shows the new value; independently, fetching a known
  object's URL directly through `https://img.<domain>/<key>` (before relying on `/_next/image` to do
  it) returns the image with a 200 — this proves the custom-domain binding itself works, separately
  from Next's optimizer.

#### Step 6 — Extend the R2 CORS rule to the new origin

CORS here governs the browser-side `PUT` during admin image upload (the presigned-URL flow in
`src/lib/s3.ts`) — plain reads (`<img>` tags, or `/_next/image`'s server-side fetch) don't need a
CORS entry at all. So this step matters for the admin panel working on the new domain, not for
storefront images being visible.

- **Who:** owner, in the Cloudflare R2 bucket's CORS policy settings.
- **Depends on:** Step 1 (need the domain to add as an origin).
- **Action:** the current rule allows `http://localhost:3000` and
  `https://dropshipping-test.vercel.app` only (GET/PUT, `Content-Type`). Add `https://<domain>` (and
  `https://www.<domain>` if Step 1 settled on serving both).
- **Verification:** read the bucket's CORS policy back (don't just trust the save dialog) and confirm
  the new origin(s) are listed alongside the two existing ones. Don't remove the
  `dropshipping-test.vercel.app` entry — Preview deployments still use that origin.

#### Step 7 — Set `FEEDBACK_EMAIL`

⛔ **BLOCKED** — TASK-056 №3. Today `FEEDBACK_EMAIL` is deliberately the project owner's own
address, so a real customer's feedback-form submission does reach someone today — just not the
client.

- **Who:** client supplies the address; owner sets it.
- **Depends on:** nothing else in this list — not gated on the domain, can happen whenever the client
  answers.
- **Unblocked when:** the client answers TASK-056 №3 with the real recipient address.
- **Verification:** the Vercel dashboard shows the new value for Production.

#### Step 8 — Review `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_STORE_NAME`

- **Who:** owner.
- **Depends on:** Step 1 (domain, and the apex/`www` decision made there).
- **Action:** set `NEXT_PUBLIC_APP_URL=https://<domain>` (matching whichever host Step 1 declared
  canonical — this value feeds `src/lib/seo.ts`'s canonical URLs, sitemap generation, and the
  order-confirmation/newsletter e-mail links, so it must be exact). Confirm `NEXT_PUBLIC_STORE_NAME`
  (currently `Mirox Shop`) is still correct with the client, or update it. **Do not redeploy yet.**
- **Verification:** the Vercel dashboard shows both values for Production. (Since `NEXT_PUBLIC_*`
  values are inlined at _build_ time, not read at runtime, nothing changes until Step 12 rebuilds —
  the real verification is Step 17.)

#### Step 9 — Legal pages live

⛔ **BLOCKED** — TASK-056 №4 (contact details) and №15 (legal-page copy / lawyer engagement) — both
still awaiting the client as of this writing.

- **Who:** client supplies copy; dev builds and ships the routes (TASK-055).
- **Depends on:** nothing here — not gated on the domain, can ship on the old domain ahead of
  cutover.
- **Unblocked when:** the client supplies contact details (№4) and legal-page copy or lawyer sign-off
  (№15).
- **Verification:** `/contact` and the legal routes return 200 and show the client-approved copy, not
  placeholder text.

#### Step 10 — DECISION GATE: the 8 seeded placeholder products

This is **not an instruction** — it's a decision to take with the client before the real domain
becomes public, per program spec decision 9 (deliberately left open at G16). It doesn't block the
technical cutover either way, and it needs no deploy to execute (it's a data change via the admin
panel, independent of Steps 11–13) — it's flagged here so it isn't decided by default, silently.

Production currently shows 8 seeded placeholder products (Ukrainian clothing, fictional) alongside 2
real ones (more may have landed by cutover time via the admin panel). Two options:

- **Keep them active** — the storefront looks fuller on day one; a visitor may notice the mix isn't
  all real inventory.
- **Deactivate them** — set `isActive = false` on the 8 seeded rows via `/admin/products` (individual
  or bulk toggle) before or shortly after the domain goes public; the catalog shrinks to whatever is
  genuinely for sale.

- **Who:** client decides; owner/dev executes whichever way it goes.
- **Verification:** this step's "verification" is a decision on record (date + who decided what), not
  a technical check. If deactivation is chosen: `/admin/products` shows the real products active and
  the 8 seeded ones inactive, and `/products` plus the homepage rails show only the active ones.

---

### While (attaching the domain, deploying)

#### Step 11 — Attach the domain in Vercel, confirm SSL

- **Who:** owner.
- **Depends on:** Step 1.
- **Action:** add the domain (and the `www` variant if Step 1 called for both) in the Vercel
  project's Domains settings.
- **Verification:** the Vercel dashboard shows the domain with a green "Valid Configuration" status;
  visiting `https://<domain>` in a browser shows a valid TLS certificate with no warnings.

#### Step 12 — Deploy via the Git integration

**Never the GitHub Actions "Deploy to Vercel" job** — its secrets are unset, so it is a validated
no-op that has never once run `prisma migrate deploy`. A green badge on that job proves nothing about
production.

- **Who:** owner (or dev, if triggering via `git push`/merge to `main`).
- **Depends on:** Steps 3, 4, 5 and 8 (every Pre-phase env var / data change that needs a rebuild to
  take effect) and Step 11 (domain attached). Step 6 (R2 CORS) does **not** gate this deploy — it's a
  Cloudflare-side setting that takes effect on its own; it only needs to land before anyone uploads a
  new image from the new domain's admin panel, whether that's before or after this step.
- **Pre-flight, immediately before triggering the deploy below:** re-run Step 4's host-prefix query
  against `ProductImage.url`. If every row is already on the new host, proceed. If any row is still on
  the _old_ host, someone — most plausibly the client, entering products through `/admin/products` on
  an ongoing basis (see "Do not re-seed production" below) — uploaded an image after Step 4's backfill
  ran. Re-run Step 4's rewrite against those rows, confirm zero stragglers again, _then_ trigger the
  deploy. This re-check is what actually closes the Step 4 → Step 12 window; Step 4's own check alone
  cannot, since it runs before the window even opens.
- **Action:** trigger a new production deployment through the **Vercel Git integration** — either
  push/merge to `main`, or use the dashboard's "Redeploy" on the current production commit. Given how
  much changed in this window, and this project's history of Vercel serving stale CSS across a deploy
  (PR #35 — a changed `globals.css` did not bust the build cache; only a cache-off redeploy did), do
  this one with the build cache off: `VERCEL_FORCE_NO_BUILD_CACHE=1`, or the dashboard's Redeploy with
  "Use existing Build Cache" unchecked.
- **Verification:** the Vercel dashboard shows a _new_ deployment (a fresh deployment ID and
  timestamp, not a reused/promoted old one), status "Ready", promoted to Production, sourced from the
  Git commit on `main`.
- **Recovery, if a stranded image turns up anyway** (discovered later — a 400 a customer or the
  client reports, or a broken image noticed in passing): re-run Step 4's backfill again. It's a
  DB-only fix and needs no further redeploy — by then the live build's allow-list already includes
  the new host, so the stranded row just needs to be updated to match it.

#### Step 13 — Confirm migrations actually ran

- **Who:** dev or owner, reading the deployment's Build Logs in the Vercel dashboard.
- **Depends on:** Step 12.
- **Action:** find the line `▶ vercel-build: applying database migrations (prisma migrate deploy)`.
- **Verification:** the next line reads `✓ migrations applied` — **not**
  `⚠ WARNING: DIRECT_URL is not set — skipping migrations` and **not**
  `⚠ WARNING: prisma migrate deploy FAILED`. `scripts/vercel-build.sh` makes migration failure
  non-fatal by design (a broken migration must not strand prod on the previous build), so a green
  deploy status does **not** imply this succeeded — you have to read the log line itself. As of this
  writing there is no migration queued specifically for the cutover, but by the time this document
  actually runs, ordinary feature work may well have added some — this step has to actually catch
  those, not just rehearse the discipline Part 2 asks for on every deploy.

---

### Post (immediately after the cutover deploy)

#### Step 14 — Run the smoke script

- **Who:** dev.
- **Depends on:** Step 12.
- **Action:**
  ```bash
  npm run smoke -- --url https://<domain> --allow-missing-baseline
  ```
  This is a brand-new origin with no stored CSS baseline yet, so the CSS-hash row would otherwise
  report `NO-BASELINE` and fail the run on that basis alone — the flag waives exactly that one
  outcome, nothing else. **Drop the flag on every later run against this domain** (Part 2 below) —
  from the second run on, a missing baseline would mean something actually went missing.
- **Verification:** all 14 rows print `PASS`. If anything other than the CSS row fails, **stop here**
  — do not proceed to Steps 15–19, the storefront is not confirmed working yet. (The CSS row itself
  should read `PASS … NO-BASELINE` on this specific run, given the flag; that's expected, not a
  problem.)

#### Step 15 — Place a real order, confirm the e-mail lands outside the owner's inbox

This is the concrete, end-to-end proof that Steps 2–3 (Resend verification, `EMAIL_FROM`) actually
work for a real customer — not just that Resend's dashboard says "sent". Every order placed against
`onboarding@resend.dev` before this point delivered only to the Resend account owner's own inbox;
this step is what proves that's no longer true.

- **Who:** dev or client, using a real inbox that is **not** the Resend account owner's own address.
- **Depends on:** Step 14 passing.
- **Verification:** the order-confirmation e-mail arrives in that outside inbox within a few minutes,
  with the correct order number and items, and the order also appears in `/admin/orders`.

#### Step 16 — Newsletter double opt-in round-trip

- **Who:** dev, using a real inbox.
- **Depends on:** Step 14 passing.
- **Action:** subscribe via the storefront's newsletter signup, receive the confirmation e-mail,
  click the confirmation link.
- **Verification:** the subscriber's status in `/admin/newsletter` reads **ACTIVE**, not PENDING.

#### Step 17 — Confirm `sitemap.xml` / `robots.txt` actually reference the new domain

Step 14 already checked these return 200; that alone doesn't prove the URLs _inside_ them point at
the new domain rather than a stale one baked in before `NEXT_PUBLIC_APP_URL` was updated (Step 8).

- **Who:** dev.
- **Depends on:** Step 14 passing.
- **Verification:**
  ```bash
  curl -s https://<domain>/sitemap.xml | grep -c '<domain>'                       # > 0
  curl -s https://<domain>/sitemap.xml | grep -c 'dropshipping-test.vercel.app'    # must be 0
  curl -s https://<domain>/robots.txt
  ```
  `robots.txt` should still disallow `/api/`, `/admin/`, `/checkout/`, `/cart`, `/account/`,
  `/track/`, `/_next/` (the full list in `src/app/robots.ts`) — same rules, new host.

#### Step 18 — GA4 / GTM firing after consent

- **Who:** dev or owner.
- **Depends on:** Step 14 passing.
- **Action:** open the new domain in a browser, accept the cookie consent banner.
- **Verification:** a GTM Preview / GA4 DebugView session shows events (e.g. `page_view`) tagged with
  the new host — not merely that the GTM script tag is present in the page source.

#### Step 19 — Search Console property and Google Shopping feed re-registration

- **Who:** owner.
- **Depends on:** Step 14 passing (specifically, the feed row).
- **Action:** register/verify the new domain as a Search Console property and submit its sitemap;
  re-point wherever the Google Shopping feed is registered (Merchant Center or equivalent) at
  `https://<domain>/feed/google-shopping.xml`.
- **Verification:** Search Console shows the property verified and the sitemap submitted with 0
  errors; a manual fetch of the feed URL shows `<item>` count > 0 (mirrors smoke row 11, now against
  the real domain and confirmed inside the actual feed reader, not just `curl`).

---

## Known limitations and corrections to earlier guidance

Earlier planning (BACKLOG 🔵 [2026-08-10], the entry this runbook grew from) made two assumptions
later rulings overturned. Both corrections are current; the original entry is not.

### Do not re-seed production

`prisma/seed.ts`'s `main()` is destructive by design — it deletes the entire catalog and
transactional tree (reviews, supplier orders, order items, orders, cart items, variants, images,
products, categories) before reseeding, meant for resetting a local/test database. The original
2026-08-10 entry assumed production would eventually be re-seeded once real products existed. That
assumption no longer holds: **real product rows have been in production since 2026-09-01**, and
running `db:seed` against prod now would destroy them, every real order, and every real review, on
top of the 8 seeded placeholders.

**`SEED_ALLOW_REMOTE=1` is retired for production permanently.** Do not set it against prod's
`DATABASE_URL`/`DIRECT_URL` again, regardless of who asks or why. Remaining products are entered by
the client themselves through `/admin/products`, per the Ukrainian intake guide already handed to
them (G16, 2026-09-01) — not a file in this repository.

### The Preview environment never migrates

`scripts/vercel-build.sh` skips `prisma migrate deploy` whenever `DIRECT_URL` is unset, and it is
deliberately unset for Vercel's **Preview** environment. A Preview build of a branch that adds a
migration therefore runs the new Prisma Client against the **unmigrated** schema — confirmed live on
PR #44's preview build, whose log read `DIRECT_URL is not set — skipping migrations`.

**Do not fix this by setting `DIRECT_URL` for Preview.** Every preview would then share production's
one database; a preview of an unmerged, unreviewed branch would apply that branch's migrations
straight to production before the PR is even approved — worse than the problem it would solve. This
is an accepted limitation, not a bug to quietly route around. A durable fix (a Neon branch per
preview, or explicitly accepting degraded previews) stays on the backlog
([planning/BACKLOG.md](../planning/BACKLOG.md), [2026-09-06] entry).

**Practical effect:** testing a schema-changing branch in Preview shows Prisma Client / DB mismatch
errors (a missing column, etc.) on that specific preview deployment. That is not a sign the migration
itself is wrong, and it does not touch production — production only ever migrates via Step 13 above.

_(A third wrinkle, not in the original entry — the `AWS_CLOUDFRONT_URL` swap needing an image-URL
backfill first — is documented in place at Step 4, since it's only actionable there.)_

---

## Part 2 — Every production deploy

Run this after every deploy meant to reach real users, not just the cutover.

1. ```bash
   npm run smoke -- --url https://<domain>
   ```
   Once a baseline exists for this origin (after its first successful run — Step 14 above, for the
   cutover itself), drop `--allow-missing-baseline`. A missing baseline from here on means something
   actually went missing, not that the origin is new.
2. **All 14 rows should read `PASS`.** If the CSS-hash row alone reads `UNCHANGED` and this deploy
   changed CSS or JS: Vercel's build cache likely served a stale bundle — this has already happened in
   this project's history (PR #35). Redeploy with the cache disabled
   (`VERCEL_FORCE_NO_BUILD_CACHE=1`, or the dashboard's Redeploy with "Use existing Build Cache"
   unchecked) and re-run; expect `CHANGED` this time.
3. If the CSS row instead reads `NO-CSS`, the deploy is very likely broken outright — the homepage
   served no stylesheet at all. Treat it like any other failing row: stop and diagnose, don't
   redeploy-and-hope.
4. **Any other row failing means the deploy is not confirmed good.** Do not tell anyone the site is
   live until the row list says so. A green GitHub Actions badge on the "Deploy to Vercel" job proves
   nothing — its secrets are unset, and it has never actually deployed anything (see the design
   spec's Problem §1).
5. The baseline file (`.smoke-state.json`) is local to whichever machine runs the command and is
   gitignored. Running it from a fresh clone or a different machine reports `NO-BASELINE` on its
   first run even against healthy, previously-verified production — that's the tool having no local
   memory yet, not a broken deploy.
