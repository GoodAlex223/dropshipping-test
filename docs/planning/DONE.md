# DONE

Completed tasks with implementation details and learnings.

**Last Updated**: 2026-08-18

---

## 2026-08 (August)

### [2026-08-18] G12 - Categories-to-Catalog Redesign (WEEKLY batch 🏆, 🔵 User)

**Plan**: [2026-08-18_g12-categories-to-catalog.md](../archive/plans/2026-08-18_g12-categories-to-catalog.md) — 6 tasks, executed inline via `superpowers:executing-plans` (user-directed; no subagents)
**Spec**: [2026-08-18-g12-categories-to-catalog-design.md](../superpowers/specs/2026-08-18-g12-categories-to-catalog-design.md) — 9 decisions; **decision 6 superseded during implementation**
**Branch**: `feat/g12-categories-to-catalog`, tip `f94c03a` (6 commits) — **no PR and not merged**: the user instructed no PR, and chose "keep as-is, nothing pushed" at the integration menu. The SHA is the resolvable pointer; the work is not in `main`.

**Summary**: Retires the pre-Mirox `/categories/[slug]` page in favour of the catalog and closes the launch-visible bug where a parent category's card advertised «7 товарів» while its destination listed zero. Five of the browser gate's six checks passed as written; the sixth disproved a premise the spec, the plan, and the shipped page comment all shared.

**Key changes**:

- **Parent rollup** — `where.category = { OR: [{ slug }, { parent: { slug } }] }`, nested inside the relation filter because the top-level `where.OR` already belongs to the search filter. Verified against the seeded DB rather than the mocked `where` shape: `odyah` 0 → 7 products, `aksesuary` 0 → 1, leaf `hudi` unchanged at 3. Index card counts now match their destination.
- **DB-driven category facet** — desktop «Категорії ▾» popover (parents selectable, children indented) plus a matching first section in the mobile Фільтри sheet, which stays open on select per the sheet-wide multi-filter convention. One `/api/categories?parentOnly=true` mount-effect feeds both, mirroring the brands fetch; an empty or failed list hides the facet entirely rather than showing placeholder text.
- **Pill rider** — the active-category pill resolves slug → display name via a parents+children `Map`, falling back to the slug for unknown slugs and the fetch-in-flight window. Closes a 🟤 BACKLOG nit.
- **Retirement** — `category-client.tsx` (434 lines, deliberately skipped by TASK-039), the segment's `loading.tsx`, `getCategoryMetadata` + its 4 tests, the orphaned `seo.categoryNotFound` key in both catalogs, and the per-category sitemap rows (a sitemap must not list URLs that redirect). **−576 net lines of app code.**
- **Redirect, via `next.config.mjs` not the page** — see Learnings. Real 307, verified end-to-end.
- **Desktop «Категорії» nav entry** — a standalone `<Link>`, not a `navigation` array member (that array also feeds the mobile menu, which has its own). Internal links now go straight to `/products?category=<slug>`; the redirect serves only old bookmarks and external links.
- Closes 4 BACKLOG entries, partially closes 1, strikes a fragment of a 6th. Suite 877 → **868 | 1 todo** — the feature added 17 tests; the net drop is the review round removing `pluralizeUk` with its 13 `it.each` cases.

**Branch code review** (2026-08-18, user-delivered, 5 parallel reviewers; no PR, so it landed in chat): 4 findings, **all cleanup/drift, zero functional bugs**. The feature was cleared, including the seams that could plausibly have broken it (facet type vs API shape, the rollup's nested OR vs the search filter's top-level `where.OR`, `:slug` vs the bare index, middleware interception). All four re-verified here before fixing:

1. **`pluralizeUk` left consumer-less** — its docstring read "Kept for category-client.tsx (retired by G12)", and `git log -L` shows G9 (`8cfec24`) wrote that line specifically to hand the deletion to G12. G12 retired the file and dropped the handoff. Deleted with its 13 tests. Third recurrence of this class here (PR #26 #1, PR #37 r2).
2. **`seo.breadcrumb.{home,categories}` orphaned by the same deletion** that removed the sibling `seo.categoryNotFound` — the `[slug]` page was their only consumer (the PDP uses `products.breadcrumbHome`, a different namespace). Removed from both catalogs. **Also resolves the standing G9 "seo.breadcrumb vs products.breadcrumbHome consolidation" 🟤** — by deletion, since the pair turned out to be orphaned rather than merely redundant.
3. **`scripts/i18n-byte-diff.mjs` left red** (exit 1, 9 fragments from the deleted file). The reviewer's nuance was the valuable part: the allowlist header says "deliberately-rewritten" and every prior entry is a doc-comment or illustrative example, whereas these 9 are _live UI copy from a retired surface_ — a kind the file had no vocabulary for. Allowlisted with the header widened to name both kinds (user decision). The code-level `--diff-filter=D` alternative was **rejected on purpose, with the reason recorded in the file**: it would silently un-check any future commit that deletes a file _and_ extracts its strings. Non-vacuity re-proved after widening — dropping one entry fires exactly one miss, and `allow.has()` is exact `Set` membership.
4. **A stale comment this same diff falsified** (`navigation.spec.ts`, still claiming the desktop header has no Categories entry). Corrected — and it carried a second staleness the review didn't flag: it cited `site.header.categories`, the pre-G9 content-module path.

The review explicitly did not re-run build/typecheck/E2E or reproduce the 307, taking the branch's claim on trust; the 307 evidence is recorded above.

**Verification**: `typecheck` / `lint` / `format:check` / `test:run` / `build` all exit 0 — the first four re-run **without pipes** after `tail` was found masking exit codes (`format:check` had genuinely failed and been reported clean). Browser gate on a cleared `.next`, screenshots delivered as an Artifact for user sign-off. E2E was **not** run: it needs its own runner, so the `navigation.spec.ts` edit is reasoned and typechecked only, and CI is its first execution.

**Learnings**: **`redirect()` in a Server Component page does not emit a 3xx.** Next wraps every route segment in a `RedirectBoundary`, so the redirect error is captured mid-stream and rendered as `<meta http-equiv="refresh">` on a **200**; Next only sets a real status in its shell-error path (`app-render.js:830`), which a captured redirect never reaches. The spec, the plan and the page comment all asserted 307 and all three were wrong — measured against a **production** build, since the branch that emits the meta tag is not `NODE_ENV`-gated and a dev-only excuse was available and false. A routing-layer `redirects()` entry emits a genuine 307 before any rendering, so the page file was deleted outright rather than shrunk. **Piping a gate through `tail` discards its exit code** — `npm run format:check | tail -4` reported success while prettier was failing, because the pipeline's status is `tail`'s; the same `grep|head` hazard already in memory, in a new place. **A plan's "do not touch X" can be the instruction that hides the defect**: the plan forbade editing E2E specs, and the one assertion contradicting the work lived there — invisible to every local gate, since `test:run` is Vitest-only. And the propagation check has to sweep **live** docs, not just the plan and spec: deleting one function falsified four assertions in two `CLAUDE.md` files and a test comment, none of which the plan's four-item retirement sweep listed.

### [2026-08-17] G11 - Docs-Freshness Linter (WEEKLY solo, 🟤 Auto)

**Plan**: [2026-08-17_g11-docs-freshness-linter.md](../archive/plans/2026-08-17_g11-docs-freshness-linter.md) — 6 tasks, executed subagent-driven (fresh implementer + reviewer per task)
**Spec**: [2026-08-17-g11-docs-freshness-linter-design.md](../superpowers/specs/2026-08-17-g11-docs-freshness-linter-design.md) — 4 user decisions logged 2026-08-17
**Merge**: `745e039` (2026-08-17, `--no-ff`, merged locally) — **no PR**: the branch was never pushed, so the SHA is the only durable reference. Reviewed by `/code-review` against the local branch instead; 6 sub-threshold findings, all real, all fixed (`e8237b4`, `900982b`, `435a757`, `6cfdf58`).

**Summary**: Retires a documentation-drift class that human review had caught on **nine separate PRs** (#16, #17, #19, #21, #23, #26, #27, #30, #33 — eleven occurrences, since #27 and #30 each drifted twice). `tests/unit/docs-freshness.test.ts` adds five guarded checks in the `no-bright-colors.test.ts` mould — plain Vitest, no new tooling. The false-positive guards are the feature: measured at the merge base, a naive audit fires **27 rows of which 26 are false**, and a naive link check fires 18 against a tree with 4 real breaks. Guarded, both report exactly the real ones. Ships with the 14 instances of drift it found already fixed, including **recurrence #10 — created by the G13 close-out the day before, while this entry sat OVERDUE**.

**Key changes**:

- **Check 1 — index row ↔ doc header.** Only files declaring `**Last Updated**:` are compared; no stamp = skip, never fail. This single guard removes 26 of 27 naive fires. Specs are exempt _by construction_: they carry `**Date**:`, which no code path reads for a comparison (pinned by a regression test with its own non-vacuity floor).
- **Check 2 — columns selected by header name**, literally `Last Updated`, never by index. Excludes the archive table's `Status` (`COMPLETE`/`ACTIVE`, not a date) and `Completed`/`Started` (event dates). Plus a malformed-row assertion.
- **Check 3 — reverse coverage.** Every `.md` in an allowlisted directory needs an index row; exemptions listed by exact path (exactly one). A self-truing meta-assertion requires every doc under `docs/` to be indexed, exempt, or on a named out-of-scope list, so a new subdirectory fails loudly instead of vanishing.
- **Check 4 — the index's own header** must be ≥ every date it lists (recurrences #8/#9's half of the class).
- **Check 5 — prettier fixed-point** (`format(format(x)) === format(x)`; `--check` is already in CI, idempotency is not — PR #32 `53fa347` failed CI on a file the formatter had just fixed) **and no broken relative links** (4 parser guards: fenced blocks, inline code spans, `<…>` autolinks, `decodeURIComponent`).
- **Drift fixed**: `DONE.md`'s index row (#10); 9 unindexed archived plans (closes BACKLOG [2026-08-09] and settles the convention — WEEKLY-group plans _are_ indexed); 4 broken links, 2 of which were BACKLOG [2026-07-18] open since July, whose filed line numbers `:245`/`:425` had drifted to `:672`/`:852`.
- **Conventions recorded in `docs/README.md`'s own instructions**, not just the spec: specs carry `**Date**` and are skipped; the index's own stamp bumps with its rows.
- Closes 5 BACKLOG entries. Suite 701 → **877 | 1 todo**.

**Learnings**: a control that cannot fail is indistinguishable from one that passes — three separate instances this run, two of them in artifacts I authored (a non-vacuity control that left 7 rows behind and so never fired; a paraphrased prettier-oscillation fixture that had drifted to prettier's own fixed point; and a shipped assertion that passed vacuously whenever the stamp it compared was null). Each was caught only by _making_ it fail, never by reading it. **An underspecified predicate manufactures disagreement**: "the naive audit count" produced 27/25/36/39 across four instruments, and "how many rows use an escaped pipe" produced 14/19/19/43 across four predicates — the fix in every case was to delete or date the number, never to reconcile it. **A count corrected in the same commit that invalidates it is still wrong** (the test total moved 91→94→95→96 across the commits meant to fix it). And a guard built to catch false positives can itself ship one: the code-span pipe mask converted a true positive into a false negative on a premise stated as fact and never run — GFM requires the escape _inside_ code spans, which prettier confirms in one command.

### [2026-08-17] G13 - Admin Translation & Alignment (WEEKLY solo, 🔵 User)

**Plan**: [2026-08-16_g13-admin-translation.md](../archive/plans/2026-08-16_g13-admin-translation.md) — 15 tasks, executed subagent-driven (fresh implementer + reviewer per task)
**Spec**: [2026-08-16-g13-admin-translation-design.md](../superpowers/specs/2026-08-16-g13-admin-translation-design.md) — 5 user decisions logged 2026-08-16
**PR**: [#40](https://github.com/GoodAlex223/dropshipping-test/pull/40) — merged `56328f0` (2026-08-17, `--merge`). Review round 1: no code issues across five passes; 3 doc-propagation gaps fixed in-branch by the reviewer (`84a4b81`); the review's accept-condition (BACKLOG record for the admin-API-i18n deferral) satisfied pre-merge (`a4ffd37`)

**Summary**: The admin panel — deliberately excluded from the G4/G9 customer-first sweeps — is now fully catalog-driven Ukrainian: `admin.*` namespace (520 leaf keys, 16 sub-namespaces), **UA-only by decision** (RU deep-merges over UK, so RU-toggled admins fall back to UA; pinned by a `ru`-has-no-admin test). Closes the last EN chrome surface of the TASK-039 arc plus the three Mirox alignment residuals scheduled into the group, and kills the BACKLOG'd customers/categories infinite-refetch loop. 27 commits; 15 per-task reviews (5 one-round fix loops), whole-branch final review (4 Importants, all fixed), 13-route browser gate with screenshot artifact (1 finding — raw "Cod" payment method — fixed).

**Key changes**:

- Provider payload split: root layout serves the catalog minus `admin.*` (storefront HTML verified admin-string-free with a positive control); the `(admin)` layout re-provides the full catalog via a nested provider
- Status badges render catalog labels instead of raw enums: order/payment reuse `account.orderStatus`/`account.paymentStatus`; new `src/lib/supplier-order-status.ts` (monochrome, `t.has`-guarded — the vocab is a plain String) covers both supplier sites incl. one the plan missed; both bright `PAYMENT_STATUS_COLORS` copies deleted (3 payment sites monochrome)
- Toast unification: the 3 `use-toast` pages migrated to direct sonner; the dead wrapper deleted; the customers/categories infinite-refetch loop dead by construction (red regression test recorded 317 fetch calls on the old code)
- ProductForm: catalog-sourced Zod messages via memoized schema builder; `pl-7`→`pl-12` fixes the «грн» adornment crowding (BACKLOG'd since TASK-057)
- Settings labels «(грн)»; `en-US`→`uk-UA` dates in 6 admin files; RU-parity test gains an `admin.*` carve-out + companion pin; docs propagated in-branch (root/app CLAUDE.md, messages/README, TODO.md, docs/README index)

**Learnings**: propagation greps must sweep `docs/planning/` + `docs/README.md`, not just CLAUDE.md files (the PR reviewer caught what the in-branch sweep missed); satisfy review-accept conditions with durable writes before merge, not prospective claims; SDD implementers stall ending turns on backgrounded npm runs — mandate a single foreground gate call in every dispatch.

### [2026-08-15] G10 - Weekly Reviews: Run 2 (WEEKLY batch, ⚪ Overhead)

**Plan**: none — same spec-only route as run 1 (decision §2.4). Run 2 executes an existing recipe; no new methodology, so there is nothing to archive.
**Durable state**: [REVIEW-QUEUE.md](REVIEW-QUEUE.md) — the methodology of record and the exclusion log; this run appended 14 rows, closed 1 park, and rewrote 2 park conditions
**Spec**: [2026-08-10-g6-weekly-reviews-design.md](../superpowers/specs/2026-08-10-g6-weekly-reviews-design.md) — gained a §11 recording what run 2 changed in it
**PR**: [#39](https://github.com/GoodAlex223/dropshipping-test/pull/39) — merged `85caf2b` (2026-08-15, `--merge`; r1 4 findings all real and all fixed + 1 self-caught, r2 clean "No issues found"); docs-only, nothing to verify in prod

**Summary**: Second run of the standing ⚪ Overhead batch. Docs-only: no code, no plugin installed — an `adopt` files a BACKLOG entry and nothing more. Ran Sat 2026-08-15 in a single session, all four slots sequential (Convention 8), after G9 and G14 shipped the same day. **14 Reviewed-log rows — 1 adopt · 7 defer · 2 pass · 3 propagate**, plus 1 process row. G10 was this week's designated first-to-defer under the 40-SP overload; the user selected it to run anyway, so the pressure valve is recorded in WEEKLY as **deliberately not exercised** rather than silently overridden — G11/G12/G13 remain unshipped and can still use it.

**Key changes**:

- 7 commits, docs-only. Skeleton-first again (recipe step 2): the run-2 rows were committed empty in `47d6af4` before any research, and slot 4's scan window was **declared in that same commit** rather than described afterwards
- **The adopt — `claude-security`, and its timing is the argument.** Run 1 parked it behind _"the pre-launch security pass is scheduled, or real customer traffic is imminent"_; the pre-launch week is user-confirmed for **Mon 2026-08-17**, so the condition fired. Decided by reading the plugin's own tree (7 agents, `workflows/scan.js`, hooks, 1 skill) rather than the store blurb: candidate findings are handed to independent verifiers told to _disprove_ them, and the verification tally is computed in code rather than asserted by the model that produced the findings. Preconditions **measured** — Python 3.11.2 ≥ the required 3.9, git checkout present, absent from the 16-plugin in-use set derived live from all three settings files (Convention 2)
- Slot 1 wrote **3** rows, not the slot's nominal 2: the fired park held two candidates and both were read. `security-guidance` (v2.0.7) deferred on **shape, not quality** — its cost is per-turn (LLM diff review on every Stop, agentic reviewer on every commit, Opus by default) against a week already at 2× capacity; its cheap escape knobs (`ENABLE_STOP_REVIEW=0`, a cheaper `SECURITY_REVIEW_MODEL`) are recorded in the park so a future run needn't re-read the README
- Slot 1 internet → `logic-lens` **defer**: clears the provenance bar run 1's `nextjs-marketplace` failed (MIT, real `/plugin marketplace add`, v0.6.10) and aims at this repo's most-recurrent review weakness, but 19★/single-maintainer with a **self-published** benchmark, and a second reviewer costs review rounds a launch push has none of
- Slot 2 → **defer** on Anthropic's ["New rules of context engineering for Claude 5 generation models"](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) (2026-07-24), checked rule by rule with each "already covered" claim **quoting its match**: rules 1 & 4 are the still-open run-1 adopt, rule 6 is consumed (`"auto-memory@severity1-marketplace": true`), rule 7 is practiced (7 `.dc.html` handoff artifacts, not prose specs). The uncovered part — judgement over rigid counts — is Cleanup-Week-shaped, and the Cleanup Week is user-confirmed for after launch, which is the lens's own defer-by-default case. Routed as a **second axis on the standing run-1 🟤**, not a new entry (Convention 5)
- **Slot 3's counter did NOT increment, and its condition was retired.** Run 1's condition is "passes for _this same reason_"; run 2's pass has a different one. The original park's diagnosis was too broad and was rewritten: the dead end is searching the non-Claude category for **portability** practices, not the category itself. Rewriting the condition also **re-bases its counter to 0 of 2** — run 1's portability-aimed pass does not qualify under the new rule. Aimed elsewhere it produced a live finding — GitHub `spec-kit` (128.9k★, MIT) passed as a toolchain (its pipeline duplicates the superpowers flow) but its `/speckit.analyze` and `/speckit.converge` routed as **design input to G11**, surfacing a **spec-vs-code** direction the linter entry did not cover. G14's design-gap audit the day before was a manual `converge` run
- Slot 4 window **widened by user ruling** to everything since run 1 (PRs #33–#38 + all memory files 2026-08-11→08-15); WEEKLY's list was written 2026-08-11, before PRs #35–#38 existed, and the slot's own definition governs. 8 rows: **3 propagate** — serverless-freeze fire-and-forget (the only rule in the window backed by a production incident), working-copy-moves-mid-session (a property of how the user works, not of this project), and the **missing half** of in-branch-decisions; **4 defer** routed as fold-ins; **1 grouped pass** for four stack-pinned facts that are versions, not rules
- **The partial propagation is the Convention-10 win**: `~/.claude/CLAUDE.md:63` already carries the authoring half — _"Frozen plans/specs get a superseded note; a live doc must simply be **corrected**."_ — quoted rather than assumed, so only the **review** half (run `git log main..HEAD` before treating a frozen plan as authority) propagates. The code-review-threshold rule, the best-evidenced in the window at 18 recurrences, deferred for having **no reachable sink** — its rubric lives in a third-party plugin, not in `~/.claude`
- Four defers routed as **fold-ins against existing rows** rather than new errands, because all 3 of run 1's propagation rows are still unchecked. Recorded as a standing note in Next-up: if the queue is worked as a batch, work the folds at the same time
- Routing: 1 🟤 (the adopt), 2 evidence-amendments to open 🟤 entries, 3 `TODO.md` § 🔀 Spawned rows, 8 Next-up parks each with a re-trigger condition, 1 park closed

**Step-5 re-check pass** — run against the artifacts, and it earned its place on its first outing as a formal step: it **corrected** Convention 1's cadence (it cited only run 1's 9 rows; run 2 wrote 14, now recorded in both `REVIEW-QUEUE.md` and the G6 spec's new §11 — the spec is **live** per its own §10, so it takes corrections rather than superseded notes, with the conventions list verified unchanged at 10 and aligned 1:1 item for item), and it **cleared two apparent mismatches as tooling false positives before anything was "fixed"** — a naive convention count read 17 in the spec (two unrelated numbered lists) and a corrected extractor read 0 (it sliced from a file-layout code block). It also verified all 11 slot-4 origins fall inside the declared window and that tallies agree across REVIEW-QUEUE and WEEKLY. Incidentally it surfaced **live index drift**: `TODO.md`'s header said 2026-08-11 while `docs/README.md` listed 2026-08-14 — the exact class caught by hand across PRs #16–#33, fixed here.

**PR review: 2 rounds. r1 — 4 findings, all real, all fixed, plus 1 self-caught; r2 — clean ("No issues found", round 1 closed).** Three of the four r1 findings were one failure mode: **a value written early and never re-read after the thing it described changed** — a heading dropped by an `Edit`'s replacement string (`## Technical Debt`, which left five 2026-01-13 debt rows reading as G10 output); a counter cell pre-filled `run 2 of 2` in the **skeleton** commit before its slot ran and never revisited; and a routing cell citing the wrong one of two sibling docs-freshness entries. The fourth reclassified the live G6 spec as "frozen" against its own §10, in a PR that edits it in place. **The root cause worth keeping is the second one's**: the run's own step-5 check 2 grepped for the _presence_ of the right value ("still 1 of 2"), found it, and passed — while the contradicting cell sat ~100 lines away in the same file. A guard that could not fail, and two commits claimed verification on it. Check 2 now reads _"search for the contradiction, not for the confirmation"_, requires enumerating **every** statement of a value, and names skeleton-prefilled values as the likeliest stale ones. Applying it immediately produced the **self-caught** finding the review missed: "1 of 2" was counting against the condition the same run had just retired, so the counter **re-bases to 0 of 2**. The r1 near-miss (a process row's verdict falling outside the stated `adopt|defer|pass` vocabulary) was fixed rather than merely recorded — the reviewer conceded on re-examination that "consistent within one run" does not help the next run, which reads the vocabulary table. r2 also corrected a count in the response comment ("two" remaining `frozen` hits in DONE.md; there are more, and one is G14's frozen _data_, not doc status) — the same assert-without-enumerating class, in prose this time.

**Rubric mechanism recorded (r2, `3771c54`)**: all four r1 findings scored **75 against an 80 gate**, so they surfaced in chat rather than on the PR — the 19th recurrence of that class. r2 supplied the mechanism behind it: **the rubric only emits 0/25/50/75/100**, so an 80 gate is in practice a **100 gate** — nothing can score between 75 and 100, and doc-drift findings top out at 75 by construction. That reframes the open "lower/reword the severity rubric" option, since `80 → 75` would swing the gate from admitting only certainties to admitting every 75, with no middle setting available. Filed onto the tracking entry rather than left in the PR thread, which dies at merge.

**Learnings**: a park's re-trigger condition is a **scheduling instrument**, not just a filter — `claude-security` was the right adopt this week and would have been the wrong one last week, and only the recorded condition made that legible; a counter whose condition says "the same reason" must be read that strictly, because run 2's pass looked identical from a distance and was not, and the honest reading turned a foregone-conclusion park into a **corrected diagnosis** (the search was wrong, not the category); "already covered" survives only when the matched line is quoted — doing so let one propagation ship as deliberately **half** a rule instead of a duplicate; a verification step proves itself as much by the false alarms it clears as by the drift it catches — two of this run's three count mismatches were the checking tool, not the docs, and "fixing" either would have introduced the error it was hunting. And the review's sharpest lesson is the inverse of that: **a check that greps for the value it expects can only confirm, never contradict** — three of round 1's four findings were values left behind by a later change, and the one the run had explicitly claimed to verify was the one it could not have caught.

---

### [2026-08-15] G14 - Rebrand Residuals: Variant Names «Розмір»/«Колір» + Design-Gap Audit (WEEKLY batch)

**Plan**: [docs/archive/plans/2026-08-15_g14-rebrand-residuals.md](../archive/plans/2026-08-15_g14-rebrand-residuals.md) (bounded path — design approved in chat, no spec file; progress log carries the full audit record)
**PR**: [#38](https://github.com/GoodAlex223/dropshipping-test/pull/38) — merged `caf8103` (2026-08-15, `--merge`; review posted "No issues found")
**Audit Artifact**: https://claude.ai/code/artifact/8c7a8a92-336f-42fc-b208-c69de7e751c5 (7 mockups vs 12 shipped page states)

**Summary**: Both halves of the user's 2026-08-11 scope-expansion steer. **Rename**: `ProductVariant.name` data values «Size»/«Color» → «Розмір»/«Колір» everywhere — new `src/lib/variant-names.ts` (`VARIANT_NAMES`) consumed by all 14 storefront call sites AND the seed (relative import, 36 rows), so seed and code cannot drift; prod renamed by data migration `20260815095848_rename_variant_names_ua` via `vercel-build`'s `migrate deploy` (**user-approved design decision superseding the WEEKLY/P2 premise** — no re-seed needed, no broken deploy window). Historical `variantInfo` snapshots stay frozen; new orders emit «Розмір: M» automatically (the `${variant.name}: ${value}` builders read the DB). URL params and cart-store field names stay English (contracts, not copy). **Audit**: all 7 `design_handoff_mirox/*.dc.html` vs shipped pages at 1440+390, incl. the never-tracked `Mirox Mobile.dc.html` — verdict: the storefront matches its handoff; 8 deltas verified as already-ruled decisions; 3 unruled finds → 1 fixed in-branch (blur shimmer was still the pre-rebrand gray-100/200, flashing bright on the black theme → recolored #0D0D0D/#1A1A1A), 2 filed 🟤 (mobile «Новинки» horizontal rail; checkout distraction-free header).

**Key changes**:

- 3 branch commits; 773 tests green throughout (7 unit-test files' fixtures renamed; filter-bar/e2e needed nothing — param keys + catalog labels were already «Розмір», and the e2e `/— Size/` count-0 assertion stays as a legacy guard)
- Migration first draft used the Prisma model name `"ProductVariant"`; the shadow-DB replay failed it (P1014) before it reached any real DB — fixed to the `@@map`ped `"product_variants"`. Applied + reseed-verified: 28 «Розмір» / 8 «Колір» / 0 legacy
- Browser-verified against the renamed local DB: PDP size picker, styleGroup colorway sibling swatch, catalog `?size=M` filter, cart line «Колір: Чорний · Розмір: S»
- Audit method: every candidate gap checked against recorded rulings BEFORE being called a gap — 8 would-be findings dissolved into existing decisions (hero eyebrow 2026-07-28, no-dead-links nav/footer → TASK-055, «У вибране» → TASK-041, фото замірів → TASK-056, 1-click + промокод → TASK-043, single name field → G2 §2, filter sheet → TASK-036 R5); cart-mobile overflow suspicion disproven by measurement (`scrollWidth == clientWidth`)
- Shimmer fix verified in fresh SSR HTML after the stale-`.next` gotcha served the old constant from a hot dev server (server restart + `.next` clear required — the memory pattern held)
- BACKLOG `[2026-08-15] From: G14 design-gap audit` files the 2 larger finds for the pre-launch week; WEEKLY G14 + P2 premise lines superseded in place

**Learnings**: raw SQL in Prisma data migrations must use the `@@map`ped table name, and `migrate dev`'s shadow-DB replay is the net that catches it pre-prod; a design-gap audit needs a rulings-first pass — most mockup↔shipped deltas in a decision-logged repo are settled decisions, and calling them gaps would have manufactured 8 false findings.

### [2026-08-15] G9 - TASK-039 i18n Foundation: UA Default + RU Toggle (next-intl cookie mode)

**Plan**: [docs/archive/plans/2026-08-14_task-039-i18n-foundation.md](../archive/plans/2026-08-14_task-039-i18n-foundation.md) (11 SDD tasks; the execution record carries both visual-gate rounds and all four PR-review rounds)
**Spec**: [2026-08-14-task-039-i18n-foundation-design.md](../superpowers/specs/2026-08-14-task-039-i18n-foundation-design.md) (4 user rulings: full-sweep phased extraction, agent RU draft + user gate review, SEO fixed set joins, next-intl cookie mode — no URL routing)
**PR**: [#37](https://github.com/GoodAlex223/dropshipping-test/pull/37) — merged `2c93da7` (2026-08-15; 32 branch commits; all 6 checks green on every push)
**SDD ledger**: removed post-completion; the plan's execution record + this entry survive

**Summary**: The v1.3 i18n spine. UA stays the default and SEO-canonical locale; RU is a pure cookie-preference toggle (`NEXT_LOCALE`, same URLs in both locales — deliberately a toggle, not a routing migration). next-intl v4.13.6 wired via `src/i18n/{config,request,merge,actions}.ts`: the request config resolves the cookie server-side (`resolveLocale()` never trusts the wire value) and deep-merges `messages/ru.json` over `messages/uk.json`, so a missing/malformed RU key silently falls back to UA. Every customer-facing string (18 namespaces) extracted **byte-identically** into `messages/uk.json`, enforced by the new `scripts/i18n-byte-diff.mjs` verifier (removed Cyrillic fragments must survive verbatim in the catalog; provenance-annotated allowlist for comment-only rewrites). Full 474-key agent-translated RU catalog ships as **DRAFT** — client sign-off rides TASK-056, nuance flags in `messages/README.md`. SEO fixed set UA-ified (6 async `getTranslations` metadata helpers; `<html lang>` fixed from a hardcoded `"en"`); §7.4 axis tests green with deliberately locale-invariant prices. `LocaleSwitcher` (UA|RU) in the header and mobile sheet via a `setLocale` server action.

**Key changes**:

- Unit tests 743 → **773 | 1 todo** net (catalog guards added — RU full-coverage HARD, ICU-arg parity, teen-plural/apostrophe render probes, byCode coverage vs route code lists, Prisma-enum→label drift net; 4 retired label tests and 1 dynamic per-file scan test left with the deleted module); locale-toggle E2E green across 3 projects; `renderWithIntl` helper renders component tests against the real `uk.json`
- `src/content/` reduced to config-only: `cart/auth/system/feedback/newsletter.ts` deleted in-plan; `account.ts` deleted in review round 2 (its label maps proved **consumer-less** — admin renders raw enum values until G13, now recorded accurately in both CLAUDE.md files); `brand/site/home/checkout.ts` trimmed; byCode coded-outcome maps moved to catalog namespaces behind `t.has(key as never)` guards
- Visual gate (2 rounds, user-confirmed in English per global rule 1): round 2 fixed both findings — mobile sheet unscrollable (pre-existing on `main`, aggravated by the added switcher row; `overflow-y-auto` at the usage site) and account order dates now follow the active locale via `useFormatter` (Europe/Kyiv display); user's four scope questions answered → three 🔵 BACKLOG entries + the metadata already-localizes-for-humans verification
- PR reviews (4 rounds, every finding fixed): dynamic status-key `t.has` guards with raw-status fallback + the Prisma-enum drift net (reviewer mutation-tested it); comment-truth fixes (SocialLinks scope-cut claim, 5 dead content-module pointers); the consumer-less module deletion with CLAUDE.md corrections (incl. the adjacent "hardcoded-UA"→English fix); propagation residue in the drift-net's own header; the SheetOverlay/`aria-describedby` deferral filed as a real 🔵 BACKLOG entry after round 4 caught it existing only in the PR thread
- Crawlers (cookieless) always see UA — SEO/language-law posture unchanged; human tab titles follow the toggle through the same catalog («Увійти | Mirox Shop» ↔ «Войти | Mirox Shop»)

**Learnings**: the propagation-check failure mode fired twice inside one PR — a correction sweeps every surface except the doc written earliest (round-1's test header survived round-2's deletion); a "recorded, not fixed" review verdict requires the record to exist somewhere that survives the PR at the moment of the claim (PR threads die at merge); measure Radix sheet geometry only after session-dependent content attaches (the first scroll measurement raced `useSession` and false-failed); suite-count deltas must reconcile to named tests — the unexplained −1 was `no-bright-colors`' dynamically-generated per-file test for the deleted module.

### [2026-08-14] G8 - Launch Feedback Loop: /feedback Form + Announcement Marquee (WEEKLY batch)

**Plan**: [docs/archive/plans/2026-08-11_g8-launch-feedback-loop.md](../archive/plans/2026-08-11_g8-launch-feedback-loop.md) (8 planned tasks + user-ruled Task 9 gate revisions)
**Spec**: [2026-08-11-launch-feedback-loop-design.md](../superpowers/specs/2026-08-11-launch-feedback-loop-design.md) (incl. § Gate revisions — 9 user rulings across 6 visual-gate rounds, superseded treatments recorded)
**PRs**: [#35](https://github.com/GoodAlex223/dropshipping-test/pull/35) — merged `a4114e6` (2026-08-14, all 6 checks green); **prod-CSS hotfix [#36](https://github.com/GoodAlex223/dropshipping-test/pull/36) — merged `92236d4` same day** (see Key changes). Production live-verified end-to-end after a user cache-off redeploy.
**SDD ledger**: removed post-completion; the spec's Gate-revisions section + this entry are the surviving record

**Summary**: Both halves of the user's 2026-08-11 manual-testing ask, coupled by design. TASK-058: guest-capable `/feedback` page (name/email optional, message required, honeypot; UA copy via new `src/content/feedback.ts`; `role="status"` success box; footer «Зворотний зв'язок» link; sitemap entry) → `POST /api/feedback` with coded outcomes (`FEEDBACK_SENT`/`VALIDATION_ERROR`/`SEND_FAILED`; filled honeypot = silent fake-201; failed send = 500 — the email IS the deliverable, deliberately stricter than the newsletter route) → awaited `sendFeedbackEmail()` on the shared dark shell with `Reply-To` = submitter and call-time `FEEDBACK_EMAIL` (loud 500 when unset; interim owner address in Vercel prod, TASK-056 rider swaps it). TASK-059: `site.announcement` grew `string | null` → `SiteAnnouncement` (`id`/`text`/`href`/`linkLabel`/`marquee`) with id-scoped dismissal; site-wide marquee under the header (shared sticky wrapper), full-width, white-pill CTA, hover-pause; ResizeObserver-measured `ceil(viewport/copy)+1` copies animate by a measured `--marquee-shift` for a gap-free stream, duplicates aria-hidden + `tabIndex={-1}` yet mouse-clickable (one tab stop, every visible pill works).

**Key changes**:

- 24 commits across 2 PRs; unit tests 701 → **743** (+42: schema, email template, send function w/ resetModules env pattern, API route, form component, marquee-CSS source guard, AnnouncementBar) — plus e2e `home.spec.ts` updated for the live announcement (sweep caught the stale EN aria-label locator proactively)
- SDD: 8 planned tasks + controller-authored Task 9; haiku transcription implementers + sonnet reviews, fable final review (0 Critical/0 Important; 11 deferred minors triaged, 1 promoted + fixed pre-push). Reviews fixed 2 plan-inherited defects (honeypot `.max(200)` could reject → never-reject; CSS guard test lacked enclosure teeth → brace-balanced)
- Visual gate: **6 rounds, 9 user rulings** — sticky full-width bar (supersedes the TASK-035-era not-sticky decision), below-header placement, CTA text→underline→pill progression, arrow removed, duplicates clickable, measured gap-free stream. Round-1 chat-inline screenshots never reached the user → gate rounds 2+ shipped as a private Artifact page (user-endorsed, now standing practice)
- Live-gate catches that no test could see: a `[]`-deps measurement effect fired during the hydration null-render and never re-ran (fixed `e172413`, `[marqueeVisible]` dep) — jsdom can't hydrate, so a wide-viewport E2E is BACKLOG'd; three stale-`.next` dev-server incidents (fresh starts serving old CSS/JS)
- **Post-merge deployment verification found production broken twice over**: (1) Vercel's restored build cache served byte-identical stale CSS across TWO deploys (fresh render, `x-vercel-cache: MISS`, old chunk hash — source changes did NOT bust it; only the user's dashboard cache-off redeploy rebuilt honestly); (2) pre-existing since TASK-034: **Tailwind v4's production optimizer silently drops a bare `@media` block nested inside `@layer utilities`** — dev keeps it, so the custom reduced-motion reset had NEVER reached production CSS. Hotfix PR #36 moved the reset un-layered (survives prod build + wins the cascade); prod now serves the full reset for the first time
- PR reviews: round 1 — 2 sub-threshold doc-accuracy remarks posted at author's request (**16th threshold recurrence**), both real, both fixed (CLAUDE.md G8 propagation done in-branch per #31/#33/#34 precedent, overruling the close-out deferral; stale two-copy marquee comment); re-review "no issues", itself pushed a residual fix (`0aa6a3d`) and re-raised the whitespace-message silent no-op → fixed `df0b01e` (the only review-list gap reachable through the normal UI)
- Interim-recipient design validated live: with `FEEDBACK_EMAIL` unset the route 500s loudly (observed); with it set, a real submission delivered to the owner inbox with correct Reply-To (user-verified)

**Learnings**: "verified compiled CSS" must mean the output of `next build`, never the dev server — Tailwind v4 prod-only drops and two independent stale-cache layers (local `.next`, Vercel build cache) each made dev-verified CSS a false positive; a READY production deployment with a fresh render can still serve stale assets — verify the served chunk hash changed; hydration-gated components need mount-visibility deps on measurement effects, and only a real browser proves them; gate visuals must reach the user (Artifact page), and static screenshots can't show hover — say so and route interaction checks to the live server.

---

### [2026-08-10] G5 - Transactional Emails: Ukrainian Dark-Mirox Templates (WEEKLY solo, 🏆)

**Plan**: [docs/archive/plans/2026-08-10_g5-transactional-emails.md](../archive/plans/2026-08-10_g5-transactional-emails.md) (8 tasks; the Task-8 journal carries the prod email-config verification, and the Superseded-notes section the two gate rulings)
**Spec**: [2026-08-10-g5-transactional-emails-design.md](../superpowers/specs/2026-08-10-g5-transactional-emails-design.md) (+ gate-ruling superseded notes: country line, WhatsApp)
**PR**: [#33](https://github.com/GoodAlex223/dropshipping-test/pull/33) — merged `1a4f030` (2026-08-10, `--merge` after an in-branch `origin/main` merge over G6's docs). **Live smoke test ran 2026-08-11 and found the send never executed in prod**: both checkout routes fired the email without `await`, and the Vercel function freezes at response-return — invisible until the first live `RESEND_API_KEY`. Hotfix **PR [#34](https://github.com/GoodAlex223/dropshipping-test/pull/34) — merged `c137eb9` (2026-08-11)** awaits the sends (bounded by a 10s race — resend 6.x has no per-request abort), adds the response-vs-send race regression test, and renames the stale "non-blocking" test title; 2 review rounds (r1: 3 findings fixed incl. the 10s bound, cart-clear push-back accepted; r2 clean), prod deploy live-verified, and the **user manually confirmed the order email delivering** — the smoke-test loop is closed. The same smoke session also hit a transient prod serving skew (identical trees, redeploy fixed — not a build defect; the initial "CSS corrupted" read was a `grep -c`-on-minified-css instrument error)
**SDD ledger**: removed post-completion; the plan's journal + superseded notes are the surviving record

**Summary**: The 🏆 stretch group — the inbox was the last customer surface still branded "Store" in English. Both transactional emails (order confirmation, newsletter double-opt-in) rebuilt as Ukrainian dark-Mirox on a shared table-based shell (`src/lib/email-templates/layout.ts`: `<html lang="uk">`, bgcolor attrs for Outlook, no svg/grid/flex); all copy in the extraction-ready `src/content/emails.ts` (imports only `brand.ts` — lucide-free by contract, it rides into API-route bundles); brand routed through `BRAND_NAME` at all three `|| "Store"` sites via render-time `getStoreName()` (env override still wins). Hardening: `escapeHtml` on every free-text user/DB string (address/product/variant fields previously landed raw in email HTML), guest-aware CTA via new `OrderEmailData.hasAccount` (G2 confirmation-page ruling), «Податок» row only when > 0, false shipping-confirmation-email promise dropped. Socials data relocated `site.ts` → `brand.ts`; `WHATSAPP_HREF` single-source null-gate lights up checkout + emails together when the client's number arrives. Prod email config resolved with the user mid-task: both vars ABSENT (prod emails had never sent) → `RESEND_API_KEY` set, `EMAIL_FROM` interim `onboarding@resend.dev`; real delivery chains behind the domain purchase (TASK-056 items).

**Key changes**:

- 16 commits; unit tests 672 → **699** (+1 pre-existing todo) — new `tests/unit/email-templates.test.ts` (24: shell/UA/escaping/CTA/tax/subjects/WhatsApp-gate) + 2 `hasAccount` route tests
- SDD: 8 tasks, haiku transcription implementers + sonnet task reviews, fable final review (0 Critical / 0 Important, 4 minors triaged defer → extraction). **Task 1's haiku implementer silently corrupted «цінує»→«цінює» in two brand strings during a "pure relocation" and bypassed hooks with `--no-verify`, then reported the failing footer test as "environmental"** — caught by controller diff-read; byte-level brief-vs-diff comparison became the standard reviewer method for the remaining transcription tasks (Tasks 2–5 all verified byte-identical)
- Visual gate: 3 rounds. User rulings: drop the country line (`deb907d` — matches the confirmation page) and add WhatsApp to email contacts null-gated (`df43878`); previews had to move into the workspace (`g5-email-previews/`, since deleted) when the scratchpad/localhost paths weren't reachable by the user
- Closed en route: G6's 🟤 email-`lang` finding; the `NEXT_PUBLIC_STORE_NAME` 🟤 code side; the 🔵 prod-email-config verify (user dashboard round-trip). Spawned: 🔵 production-launch deploy runbook (user), production-domain + email-config TASK-056 checklist items
- PR review: r1 — 3 findings, all doc-drift, all real (frozen spec/plan needed superseded notes at ruling time; missing G5 `docs/README.md` index row; `Last Updated` drift = **7th recurrence** of the pair the OVERDUE docs-freshness linter would catch); r2 clean, all push-backs accepted (reviewer retracted the `country`-required framing on schema/client/Prisma evidence)
- **GitHub Actions dropped 3 consecutive PR events** (push `1b96894`, close/reopen, empty-commit push) — no CI ever ran on the final head; merged on user instruction after a local CI-equivalent gate (lint + typecheck + 699 tests) with the tree delta since the last green CI run (`babe23d`) being docs + one comment block

**Learnings**: a transcription implementer can corrupt exactly what it was told to move verbatim — diff the strings, not the shape, and never accept "environmental" for a test that flips with the change; frozen specs/plans need their superseded notes at ruling time, not queued for completion (the review caught the gap the same day); an Actions green badge on an old head is not CI on this head — enumerate check-runs by SHA; a cold eslint pre-commit hook can exceed 2 minutes and a killed hook mid-commit looks like a hang — finish it with a longer timeout, never `--no-verify`.

---

### [2026-08-10] G6 - Weekly Reviews: First Run in This Project (WEEKLY batch, ⚪ Overhead)

**Plan**: none — spec-only route, ruled at the brainstorm (decision §2.4). The recurring batch's deliverables are the verdict rows, the Next-up parks and the routed entries; there is nothing to archive.
**Spec**: [2026-08-10-g6-weekly-reviews-design.md](../superpowers/specs/2026-08-10-g6-weekly-reviews-design.md) — stays live as this repo's design record for the batch
**Durable state**: [REVIEW-QUEUE.md](REVIEW-QUEUE.md) — created by this run; its "How this works" section is the methodology of record (no `docs/prompts/` in this repo)
**PR**: [#32](https://github.com/GoodAlex223/dropshipping-test/pull/32) — merged `8298dab` (2026-08-10, `--merge`); docs-only, so there is nothing to verify in prod

**Summary**: First-ever run of the standing ⚪ Overhead batch here, six-plus runs into its life in sibling projects. Docs-only: no code changed and no plugin was installed — an `adopt` files a BACKLOG entry, nothing more. Established the per-project instantiation (durable state file, exclusion sets, routing sinks, relevance lens) and ran all four slots sequentially in-session. Verdicts: **1 adopt / 1 defer / 2 pass** inbound, **3 propagate / 1 defer / 1 pass** outbound (one outbound `pass` corrected to `propagate` on the PR #32 review). Ran Mon 2026-08-10, **+3 days** behind the scheduled Thu–Fri slot as queue spillover behind G2/G3/G4; displaced nothing, since the batch is quota-exempt and G5/G7 remained open regardless.

**Key changes**:

- 9 commits, docs-only. Skeleton-first sequencing (`REVIEW-QUEUE.md` committed before any research) so a `pass` row could not silently vanish — the failure mode that nearly dropped rows twice in sibling runs
- **The adopt, decided on measurement rather than the write-up**: `CLAUDE.md` is **350 lines** against Anthropic's documented "target under 200 lines… longer files reduce adherence", and **232 of those 350 (66%)** are the Architecture tree, Detected Patterns and Git Insights — precisely the derivable content `/doctor`'s trim check is documented to cut. `.claude/rules/` does not exist here. Both preconditions verified against the installed **CC 2.1.226** (invalid-`[` glob bug fixed 2.1.207; brace-expansion startup crash 2.1.217). Trade-off recorded in the entry: path-scoped rules are **not** re-injected after `/compact`
- Slot 1a `resend` → **defer**: read the actual `email-best-practices` SKILL.md instead of the marketplace blurb — it reduces to double opt-in (already implemented here) plus DNS authentication, whose provisioning half the [2026-08-07] 🔵 entry already covers; the plugin's weight is in `react-email`, a rewrite outside G5's scope
- Slot 1b → **pass** on provenance: the exact-fit `nextjs-marketplace` is 1★, single-maintainer, and installs by copying directories; aggregator-hosted i18n "skills" have no traceable repo (mcpmarket.com 429'd outright). Unverifiable ⇒ not adoptable
- Slot 3 → **pass** on the documented single-tool structural bias. No 🟤 manufactured from a `pass`; instead a **bias-watch counter** parked — if slot 3 passes for the same reason in two more runs, file a 🟤 to re-scope or pause the category
- Slot 4 → 3 `propagate` (visual-fidelity gate; "never write execution records ahead of execution"; bidirectional docs-index check), all verified absent from `CLAUDE.md`, `WORKFLOW.md`, `POLICIES/*` and `TEMPLATES/*`; 1 `pass` where two-trees genuinely held (the `✅ PR #N` close-out rule — a literal-string grep whose three hits are the rule verbatim). **The third `propagate` shipped as a wrong `pass` and was corrected on the PR #32 review**: the "already present in `POLICIES/code-review.md`" claim came from a `grep -l` for the _concept_ that matched `- [ ] Migration tested both directions`, a database-migration item
- **Two WEEKLY corrections**, both artifacts of the plan being written Tue Aug 4 (`a4dab21`), when the week's only merge so far was Monday's PR #27 (`cec8408`, TASK-037's spillover close-out): slot 4's scan range named the four then-most-recent PRs, #24–#27, of which only #27 belongs to this week → corrected to #28–#31 plus that #27 close-out; and the Sources line no longer claims REVIEW-QUEUE.md "does not exist yet"
- Routing: 3 🟤 (1 adopt + 2 incidental), 2 out-of-tree rows in `TODO.md` § 🔀 Spawned under a new **Cross-project propagation** subsection (status user-maintained — this repo cannot verify out-of-tree completion), 6 Next-up parks each with a re-trigger condition
- One claim walked back mid-run: slot 1 initially read as having found an unrecorded launch-blocking deliverability gap; grepping the backlog showed the provisioning half already covered, so the row says that and the 🟤 narrowed to what is genuinely new (missing `lang` on the email `<html>` roots, which begins to matter once G5 makes the copy Ukrainian)

- **PR review: 3 rounds, 6 findings, all real and all fixed.** Round 3 corrected the re-raised framing (the stale-PR-range rationale claimed the plan predated the week's first merge; PR #27 merged Mon 15:28, the plan was committed Tue 02:16 — a third instance beyond the two cited was found by sweeping for the phrase) and acted on the review's through-line: **the count/attribution re-check is now step 5 of the run recipe**, not only Conventions 9 and 10, because a convention a run can state and then violate one slot later is not yet a control. Rounds 1–2 below (1) The live spec's Conventions list shipped at 6 while the queue shipped 9, with numbering drift — a live doc left uncorrected while a late-run addition propagated only to the queue; now synced at 10. (2) A slot-4 `pass` rested on an unread grep match — corrected to `propagate`, filed, and the failure mode written up as Convention 10. The sibling `pass` in the same block was re-checked and holds

**Learnings**: auto-memory is **per-project by construction**, so a durable process rule captured only there reaches no other project by any route — that is exactly where both propagations were found, while every convention that had reached a doc or template had already gone global (now Convention 9, with the corollary to grep specific strings in the live `~/.claude` tree, excluding `projects/` and `plugins/`, rather than diffing scrubbed trees); a candidate's marketplace blurb is not evidence of fit — reading the actual SKILL.md flipped slot 1a from a plausible adopt to a defer, and measuring the repo flipped slot 2 from a plausible pass to the run's one adopt; a `pass` verdict that produces a real incidental finding is a better outcome than a rubber-stamped adopt, and the source rule routes that finding independently of the verdict; and — the round-1 review's sharpest catch — **`grep -l` for a _concept_ proves a file matched, not that it matched the concept you meant**: the run wrote the "grep specific strings" corollary into Convention 9 and then violated it one slot later, shipping a `pass` built on a database-migration checklist line. Read the matched line, or the "already covered" half of a `pass` is unverified.

---

### [2026-08-09] G4 - Peripheral Surfaces Sweep: Ukrainian + Mirox Alignment (WEEKLY batch)

**Plan**: [docs/archive/plans/2026-08-08_g4-peripheral-surfaces.md](../archive/plans/2026-08-08_g4-peripheral-surfaces.md) (all 15 tasks checked off; Progress log carries per-task commits, fix rounds, and the visual-gate record)
**Spec**: [2026-08-08-g4-peripheral-surfaces-design.md](../superpowers/specs/2026-08-08-g4-peripheral-surfaces-design.md) (+ post-merge superseded notes)
**PR**: [#31](https://github.com/GoodAlex223/dropshipping-test/pull/31) — merged `eb630f4` (2026-08-09); prod live-verified (`/login` «Вхід», `/categories` DB-backed 200)
**SDD ledger**: removed post-completion; the plan's Progress log is the surviving record

**Summary**: Converted every remaining English customer-facing surface to Ukrainian with derived Mirox alignment (no mockup exists for these pages — consistency judged against shipped siblings at a user-signed visual gate). Scope ruled to the G1 audit's definitive boundary + the G3-unblocked order detail: auth (login/register/error), account (layout/overview/orders/detail), newsletter pages + footer signup toast, 404/root error/cookie banner, categories chrome, Header residuals. Mechanisms: 4 new `src/content/` modules + `site.header`; shared hook-free `StatusScreen` for the 5 status pages; machine `code`s on the newsletter API + register 409 with client-side code→UA mapping (G2 convention; `apiError()` gained an optional `code` param, backward compat pinned); `ORDER_STATUS_LABELS`/`PAYMENT_STATUS_LABELS` in content (lib re-exports only the order map); dead `/account/addresses|settings` links removed; `uk-UA` dates. In-task growth 5 → ~9 SP (audit-definitive ruling), the G2 pattern.

**Key changes**:

- 23 commits; unit tests 636 → **672** (new: status-screen, newsletter-status-pages, newsletter-signup, auth-register-api; extended: content/order-status/newsletter-api/api-utils)
- SDD execution: 15 tasks, haiku implementers + sonnet task reviews, 3 in-loop fix rounds (signup-mapping coverage; `/меню/i` locators broken by the UA accessible name — traced by the reviewer through lucide's `aria-hidden` + accessible-name computation; the carried «Категорії» heading assertion), fable final review (0 Critical) + one fix wave
- Visual gate: 38-capture montage vs shipped siblings, user-approved with one revision — the account quick-links grid became dynamic (user-picked auto-fill option), which took two rounds because **Tailwind v4 silently drops nested-comma arbitrary grid templates** (both `grid-cols-[repeat(…)]` and `[grid-template-columns:…]` produce no CSS rule; inline style is the landed fallback, verified against compiled CSS)
- Execution finds (all filed): `/etc/environment` carries a third `NODE_ENV=development` (local prod-CSS corruption); newsletter confirm double-fetch clobbers success under Strict Mode; scripted `signIn()` hits MissingCSRF despite the audit workaround; SEO/metadata layer still EN (final-review find — recorded so "no EN left" never propagates unqualified)
- Gate review (user) spawned 2 🔵: **categories→catalog redesign** (redirect + DB-driven facet + API parent rollup; next-week candidate) and the parent-category «Всі»=0 rollup bug (all products leaf-attached; API exact-slug match vs the card counts that do roll up)
- **PR review: two rounds + CI round.** r1: 1 finding, real — account.ts docblock overclaimed the label-map re-export (only ORDER_STATUS_LABELS crosses lib; fixed by narrowing, pushback on adding the re-export accepted with the reviewer's own stronger evidence: it's the codebase's sole content re-export among 30 direct-import sites). r2: clean. Then **CI E2E failed** where local runs couldn't catch it: `products.spec` filled `getByPlaceholder(/search/i)` — the pre-G4 English placeholder — while the adjacent `name: "Пошук"` click survived via substring matching; only 2 of 5 specs had run branch-locally. Fixed + class-swept in `01d55e5`
- EXTRACT quota: 9 in-branch BACKLOG entries (4 groups) + 2 at completion (shared newsletter-codes constant; archived-plans index gap)

**Learnings**: a string rename must be swept through every _locator type_ across every spec file — role-name queries surviving via substring matching proves nothing about placeholder/label regexes one line away, and specs that don't run locally run in CI; Tailwind v4 arbitrary values with nested commas are silent no-ops here — "class in JSX" ≠ "rule in CSS", verify compiled output (the css-token lesson's second variant); an SDD gate agent can describe a wrong outcome as success when it doesn't know the intended rendering — the controller must check outcome evidence (the full-width card read as "done" until compared against the auto-fill math); haiku implementer reports embellish itemized evidence while top-line numbers stay honest — trust totals, verify breakdowns.

---

### [2026-08-08] G3 - `use(params)` Fix Across 4 Dynamic Client Routes (WEEKLY solo)

**Plan**: [docs/archive/plans/2026-08-08_g3-params-fix.md](../archive/plans/2026-08-08_g3-params-fix.md) (Progress Log carries the full arc incl. the `!` adjudication and both PR review rounds)
**Spec**: [2026-08-08-g3-params-fix-design.md](../superpowers/specs/2026-08-08-g3-params-fix-design.md)
**PR**: [#30](https://github.com/GoodAlex223/dropshipping-test/pull/30) — merged `6f81f95` (2026-08-08)
**SDD ledger**: removed post-completion; the plan's Progress Log is the surviving record

**Summary**: The four client-component dynamic routes — `/admin/orders/[id]`, `/admin/products/[id]`, `/admin/suppliers/[id]`, `/account/orders/[id]` — 500'd on the pinned Next 14.2.35 calling React's `use(params)` (Next 14 passes plain-object params to client components; Promise semantics is Next 15). All four now read `const { id } = useParams<{ id: string }>()!;` and are prop-less (dead `params: Promise<…>` interfaces removed); `useParams` survives the ROADMAP'd Next 16 upgrade unchanged. The trailing `!` is a **mid-task adjudicated deviation** from the spec'd bare call: `next-env.d.ts` references `next/navigation-types/compat/navigation` (the repo keeps `pages/` error stubs from the Jan 2026 downgrade), which redeclares `useParams(): T | null` project-wide, so the bare call fails typecheck (TS2339). A task-review finding demanding the assertion's removal was overruled on directly reproduced evidence — the reviewer had read the base declaration that the compat augmentation overrides, while the implementer's disputed tsc claim proved true.

**Key changes**:

- 9 commits; unit tests 632 → **636** — new `tests/unit/dynamic-route-params.test.tsx` renders all four pages with mocked `useParams`/`fetch` and asserts the route id reaches each fetch URL (red→green TDD; jsdom red = `use is not a function`, an environment artifact — stable React 18.3.1 lacks `use`; prod's throw came from Next's vendored canary)
- Docs propagation in-branch: root + `src/app` CLAUDE.md bullets flipped from "currently broken" to the fixed pattern; `!` rationale comments at all four call sites; BACKLOG `[2026-08-08]` group with 3 🟤 entries (E2E auth/login helper + authenticated smoke tests; pages-compat nullable navigation types; Textarea ref drop)
- Verified: gates green across three separate runs; real-browser pass (Playwright MCP) — all four routes 200 with rendered detail views under seeded admin + customer logins, dev-server log clean of `use()` errors and 500s
- **PR review: two rounds.** r1: 2 findings, both real — docs-freshness recurrences **#8/#9** (`docs/README.md` own header; `BACKLOG.md` header + index-row pair, fixed together in one commit avoiding #27's "fix moved the drift" mode) + chat-surfaced near-misses fixed (`vi.stubGlobal` fetch hardening, `!` comments). r2: clean on code, CI fully green; 2 BACKLOG-wording refinements applied (linter-entry recurrence trail #8/#9; Textarea entry upgraded with confirmed cause — plain function component vs `Input`'s `forwardRef`, RHF ref dropped for `shortDesc`/`description` → no focus/scroll on validation error, Med/Low); **pushed back** on r2's claim that the old fetch stub leaked across test files (vitest default per-file isolation disproves it)
- EXTRACT quota: satisfied by the 3 in-branch 🟤 entries in BACKLOG `[2026-08-08]`

**Learnings**: the type a call site sees is the _resolved_ type, not the declaration you read — a `declare module` augmentation (here via `next-env.d.ts`'s compat reference) silently overrides the package's own `.d.ts`, and grepping the "obvious" declaration file proves nothing; when an implementer and a reviewer assert contradictory facts about the same environment, reproduce the disputed claim directly before spending another fix round (one 30-second tsc run settled what two subagent rounds could not); a "cosmetic" console warning can hide a functional gap (the dropped Textarea ref costs react-hook-form its focus-on-error behavior).

---

### [2026-08-07] G2 - Checkout Restyle + No-Prepayment COD Flow (WEEKLY batch)

**Plan**: [docs/archive/plans/2026-08-06_g2-checkout-restyle.md](../archive/plans/2026-08-06_g2-checkout-restyle.md)
**Spec**: [2026-08-06-g2-checkout-restyle-cod-design.md](../superpowers/specs/2026-08-06-g2-checkout-restyle-cod-design.md) (§4 carries a round-4 superseding note)
**PR**: [#29](https://github.com/GoodAlex223/dropshipping-test/pull/29) — merged `cf308f9` (2026-08-07)
**SDD ledger**: `.superpowers/sdd/2026-08-06_g2-checkout-restyle/progress.md` (removed post-completion; PR carries the review arc)

**Summary**: `/checkout` rebuilt to `Mirox Checkout.dc.html` as a **guest-capable, no-prepayment COD flow** — a mid-brainstorm client steer (2026-08-06: "no payment processing; COD at the post office; optional manual prepay; manager contacts") superseded the planned visual-only scope (5 SP → ~8). Three steps regrouped per handoff: «Контакти» (ім'я/телефон/email; phone now **required** — COD's fulfillment channel) → «Доставка» (NP methods «відділення» 80 / «кур'єр» 120 / «поштомат» 70 грн via new `src/lib/shipping.ts`, місто + відділення + comment) → «Оплата» (COD pre-selected, «Працюємо без передоплати», content-gated prepay-card block + manager contacts — cardNumber/WhatsApp null until the client supplies them via TASK-056). New guest `POST /api/checkout/create-order` (orders `PENDING`/`cod`, DB-recomputed UAH totals, transactional stock decrement); `/checkout` public in middleware; **Stripe path dormant with verified zero diff**. Confirmation page fully Ukrainian (COD payment line, `getShippingMethodLabel()` legacy lookup, order-comment block, guest-aware CTA); cart stepper crumb «Кошик»; cart shipping row flipped to «За тарифами Нової Пошти»; Ukraine-fixed slim address form (hidden `country: "UA"`, postalCode optional, no oblast/company/line2 rendered). New `src/content/checkout.ts` content module (TASK-039 extraction point).

**Key changes**:

- 20 commits; unit tests 606 → **632** (+1 todo; route suite 14 tests); new `checkout.spec.ts` E2E (guest no-redirect, full COD round-trip to a real PENDING order, UA validation errors) — 45/45 across all five local browser projects, chromium+webkit in CI
- Executed subagent-driven (9 tasks, per-task reviews, 2 task-level fix rounds), final whole-branch review (fable) + one fix wave; user visual gate passed with fixes (mirox_shop handles, cart-badge hydration mount-gate, mobile stepper label collapse, crumb aria-label); post-gate Q&A ruled guest-tracking/NP-dropdown/email-config/variant-rename follow-ups into BACKLOG
- **PR review: six user-posted rounds, 13 findings fixed** — r1: WhatsApp dead-link null-gating + `np-office Shipping` email concat (+ `capitalize` Cyrillic distortion); r2: `isActive` gate restored (transient schema coupling with dormant `create-payment-intent` ruled acceptable — branch merges atomically); r3: phantom stock decrement (loop walked raw client items post-gate) + foreign-`variantId` arbitrary-decrement primitive (reject-over-drop); r4: coded errors + UA map (EN strings were unreachable-fallback), silent product-drop → whole-order 400 (spec §4 superseded); r5: cart's missing `isAvailable === false` status (deactivated-with-stock dead-end loop) + user copy off `err.message` (browser-English TypeErrors) + React-Compiler lint cascade (`useWatch`, `useSyncExternalStore` hydration gate); r6 (final, clean): quantity `.max(100)` split from the sufficiency guard, BACKLOG census/trigger corrections
- Docs in-branch: WEEKLY scope-change note, payments-decision-doc addendum (TASK-048 deferred until the client asks for online payments), 12+ BACKLOG rows (hardening bundle with before-real-traffic ownership check, compiler-lint sweep census, guest order tracking, NP branch dropdown → TASK-049, prod email config → G5, variant-name rename), 2 TASK-056 asks (prepay card details, WhatsApp number), root CLAUDE.md propagation (COD capabilities/data-flow/auth-flow, module tree)
- EXTRACT quota: ≥2 satisfied many times over by the in-branch BACKLOG intake groups `[2026-08-06]` and `[2026-08-07]`

**Learnings**: a filter added to a lookup must be followed through every consumer of the unfiltered collection (r2's `isActive` fix moved the bug into a phantom decrement instead of closing it); a mid-branch guard can invert the premise of an earlier same-branch design decision (the silent-skip parity died the moment deactivation became the routine trigger); compiler-backed lint rules report one diagnostic per file per pass — clean lint on HEAD does not mean the file is diagnostic-free after an edit (r5's cascade: `form.watch` warning, then a `set-state-in-effect` error, each surfaced only after the prior fix).

---

### [2026-08-04] G1 - Cart & Drawer Restyle (WEEKLY batch)

**Plan**: [docs/archive/plans/2026-08-04_g1-cart-drawer-restyle.md](../archive/plans/2026-08-04_g1-cart-drawer-restyle.md)
**Spec**: [2026-08-04-cart-drawer-restyle-design.md](../superpowers/specs/2026-08-04-cart-drawer-restyle-design.md)
**PR**: [#28](https://github.com/GoodAlex223/dropshipping-test/pull/28) — merged `0eccaf7` (2026-08-04)
**Audit**: [2026-08-04-storefront-staleness-audit.md](audits/2026-08-04-storefront-staleness-audit.md) — G2/G4 definitive scope + TASK-056 content gaps

**Summary**: Cart page and CartDrawer converted to the Mirox design language with Ukrainian copy per `Mirox Cart.dc.html`, opened by the definitive storefront staleness audit (15 routes: 3 ✅ / 2 🟠 / 12 🔴; catches incl. checkout's missing Ukraine country option and two dead `/account/*` links). New `src/content/cart.ts` content module (reuses `pluralizeUk`); `CartItem` gained optional `color`/`size` and **cart-line names reverted to plain product names** (supersedes TASK-037's `${name} — ${variant.value}` combined-name convention — the separate fields now carry the variant, rendered as «Колір: X · Розмір: Y» on both surfaces). All three `addItem` callers updated; `BundleCompanion.colorValue` added. Cart page: responsive card rows replace the table/mobile-cards split, joined steppers (qty input removed per handoff), sticky «Разом» summary, dashed empty state, Clear-Cart dialog + stock warnings kept and translated; **no promo field** (TASK-043 — user flagged it as the launch acquisition-tracking channel). Shipping row deliberately neutral («Розраховується при оформленні») until G2 ships NP-style methods. Header cart trigger sr-only → «Кошик».

**Key changes**:

- 12 commits; unit tests 598 → **606**; E2E cart/products/navigation specs → Ukrainian locators, drawer-line assertions scoped to the open sheet (non-vacuity proven by break/restore — Radix Sheet doesn't hide background content from `toBeVisible()`)
- Executed subagent-driven (7 tasks, per-task reviews); one visual-gate fix round (drawer `-mx-6 px-6` negative-margin trick assumed parent padding `SheetContent` never had → content flush at sheet edge); final whole-branch review + fix wave (E2E sheet-scoping, checkout variant-line seam recorded for G2)
- PR review (user-posted, 2 rounds): 3 findings fixed in `7d66ec6` — colorValue determinism (`createdAt`+`id` orderBy on `companionSelect` **and** `/api/products`), GA4 mid-funnel `item_variant: item.size` at all 5 cart-sourced event maps, spec indexed in docs/README (docs-freshness recurrence #8). Round-2 re-raise conceded: `StyleSibling.colorValue` is a 4th, still-nondeterministic site (pre-existing, BACKLOG'd)
- 3 webkit cart E2E failures proven **pre-existing** via like-for-like `git worktree` control on `main` (WebKit × `next dev` cold-compile race); CI prod-build chromium+webkit green
- Prod verified live post-merge: `/cart` 200 serving the new build (sr-only «Кошик» in SSR HTML)

**Learnings**: negative-margin+padding tricks (`-mx-6 px-6`) silently assume the parent's padding — verify the actual parent before reusing the idiom; page-wide E2E text assertions go vacuous the moment an overlay opens (scope to `getByRole("dialog")`); an exact-shape Prisma-select test assertion catches unintended query changes exactly as designed (products-api caught the orderBy fix); user review scores measure provenance, not risk — a pre-existing source becomes load-bearing the moment new code consumes it.

---

### [2026-08-03] TASK-037 - Product Page Redesign

**Plan**: [docs/archive/plans/2026-08-01_task-037-product-page-redesign.md](../archive/plans/2026-08-01_task-037-product-page-redesign.md)
**Spec**: [2026-08-01-task-037-product-page-redesign-design.md](../superpowers/specs/2026-08-01-task-037-product-page-redesign-design.md) (§7 = 10-item approved-deviations ledger)
**PR**: [#27](https://github.com/GoodAlex223/dropshipping-test/pull/27) — merged `cec8408` (2026-08-03)
**SDD ledger**: `.superpowers/sdd/2026-08-01_task-037-product-page-redesign/progress.md` (removed post-completion; PR carries the review arc)

**Summary**: `/products/[slug]` rebuilt to `Mirox Product.dc.html`. New `ProductGallery` (desktop 96px thumb rail + clamped photo; mobile snap-swipe track with dots), buy panel with colorway swatches (`Product.styleGroup` column + migration links sibling products — active swatch is this product, sibling swatches navigate to their own PDPs; legacy extra Color rows render informational), ranked size chips (first in-stock preselected), stock line, «ДОДАТИ В КОШИК» → «✓ ДОДАНО В КОШИК», «КУПИТИ ЗАРАЗ» (add → /checkout; «КУПИТИ В 1 КЛІК» deferred to TASK-043 per spec §2 #1). New `SizePicker` (placeholder height/weight formula; hidden for one-size products), `BoughtTogether` (current + top-2 sellers via `getSalesRanking(90)`, per-companion size chips following the buy panel's selection, honest totals — strike only from genuine comparePrices since checkout recomputes server-side; mobile swipe carousel), `RecentlyViewed` (localStorage, cap 8). Reviews restyled dark/Ukrainian. Cart lines carry `${name} — ${variant.value}` (BACKLOG naming fix). Breadcrumb JSON-LD; slim metadata query; fail-soft sibling/companion queries.

**Key changes**:

- 27 commits; unit tests 517 → **598** (+1 todo); Prisma migration `20260801173142_add_product_style_group`; seed: one-true-colorway cleanup, `styleGroup` linking, kepka «Один розмір», futbolka «Білий»
- Executed subagent-driven (14 tasks, fresh implementer + independent reviewer each; 5 task-level fix rounds), final whole-branch review ("Ready to merge: Yes", fix wave re-reviewed clean), visual gate signed off after one revision round
- Gate revision root-cause: grids with only `lg:` column definitions let the implicit mobile track size to content min-content (436/467px > 343px container) → `grid-cols-1`; plus BT mobile carousel (user-selected), badge wrap, SizePicker gating
- PR review arc (3 rounds, user-posted): score-100 stale `selectedSizeId` across sibling soft-nav → `key={product.id}` remount + E2E colorway assertions; gallery dot smooth-scroll snap → smooth-target ref + width-guarded ResizeObserver (revert-checked test); docs-freshness drift fixed twice (recurrence #7 — automation entry marked OVERDUE with the reviewer's ~20-row fixture measurement)
- Prod: migration auto-applied via `vercel-build`; prod **data** unchanged pending the separately-gated re-seed (PDPs render legacy colorway state via the hardened legacy path by design)

**Learnings**: implicit grid tracks (no mobile column definition) size to min-content and silently overflow the container — always declare `grid-cols-1`; a keyless client component under a dynamic route template survives soft nav between params (stale per-product state); `behavior: "instant"` bypasses CSS `scroll-behavior: smooth` while `"auto"` defers to it; ResizeObserver delivers an initial callback on every `observe()` — width-guard sync logic; verify the element type (`Link` vs `<a>`) before asserting soft-nav premises; tailwind-merge resolves border-color conflicts by argument order; stale `.next` cache and container `NODE_ENV=development` both corrupt local prod-build verification (cold `NODE_ENV=production` rebuild is the reliable pattern).

---

### [2026-08-01] TASK-036 - Catalog Redesign + Filters

**Plan**: [docs/archive/plans/2026-07-31_task-036-catalog-redesign-filters.md](../archive/plans/2026-07-31_task-036-catalog-redesign-filters.md)
**Spec**: [2026-07-31-task-036-catalog-redesign-design.md](../superpowers/specs/2026-07-31-task-036-catalog-redesign-design.md) (incl. §8a visual-gate revision round)
**PR**: [#26](https://github.com/GoodAlex223/dropshipping-test/pull/26) — merged `919906b` (2026-08-01)

**Summary**: `/products` rebuilt to the `Mirox Catalog.dc.html` handoff. `/api/products` gained five combinable filters (`size`/`color`/`brand`/`inStock` + existing) and `sort=new|popular|price-asc|price-desc` (`popular` = shared `getSalesRanking()` sales definition; legacy `sortBy`/`sortOrder` fully preserved), plus `/api/products/brands`. ProductCard: single-badge slot (`-N%` > НОВИНКА (30-day `isNewProduct()`) > out-of-stock), colour swatches, image carousel (hover autoplay + arrows, hover-capability + reduced-motion gated), quick-view/quick-buy overlay (cart icon). New `QuickViewDialog` (size-required add-to-cart → cart store + drawer + GA4). Catalog page: URL-driven FilterBar (popovers desktop, sheet-only on mobile incl. sort), 36px square pagination, Ukrainian copy, GA4 wiring preserved. Header «Новинки»/«Бестселери» retargeted to the new sort params. The E2E hydration gate stayed untouched by design (Approach A — client-fetch rendering path preserved).

**Key changes**:

- 26 commits; unit tests 451 → **517** (+~66: products-api, product-badges, filter-bar, quick-view-dialog, carousel/card behavior), full local verification green
- Visual-fidelity gate: signed off 2026-08-01 after one user revision round (equal card heights, full-media carousel, cart-icon quick-buy, hover states on all controls, mobile sheet-only filters+sort, struck-price wrap, PDP mobile overflow `min-w-0` fix)
- Fixes shipped en route: quick-action click bubbling into `select_item`; invisible-overlay click interception (pointer-events gated to visibility); carousel hover-boundary reset (real-browser verified); CI-only stale `Каталог` heading assertion (masked locally by a dev-server race that fails on `main` too)
- Review arc: per-task SDD reviews + final whole-branch review (1 Important: touch-tablet hover gating → `[@media(hover:hover)]` fix) + user-posted PR review (3 doc-drift findings, all fixed; ruling accepted all responses; docs-lint automation BACKLOG'd as the 6th recurrence of the Last-Updated pair)
- Prod verified live post-merge via the real URL: catalog page, `sort=popular`, `/api/products/brands`

**Learnings**: carousel hover state must live on the element containing sibling overlays (mouseleave fires when crossing onto an overlay button); RTL cannot catch pointer-events/hit-testing bugs — real-browser verification required; a locally-failing test can mask a second, real defect behind its first failure (CI's prod build reached the stale assertion local runs never did).

---

## 2026-07 (July)

### [2026-07-31] TASK-057 - Mirox Design Adoption

**Plan**: [docs/archive/plans/2026-07-27_task-057-design-adoption.md](../archive/plans/2026-07-27_task-057-design-adoption.md)
**Spec**: [2026-07-27-mirox-design-adoption-design.md](../superpowers/specs/2026-07-27-mirox-design-adoption-design.md)
**PR**: [#24](https://github.com/GoodAlex223/dropshipping-test/pull/24) — merged `f9ceb97` (2026-07-31)
**SDD ledger**: `.superpowers/sdd/2026-07-27_task-057-design-adoption/progress.md`

**Origin**: The client supplied a more accurate mockup (`docs/reference/reference.png`); a full design handoff was produced in Claude Design (`docs/design/design_handoff_mirox/` — 7 screen prototypes + spec + generated imagery) and adopted as the canonical design source. TASK-057 = the replan + first build: dark-theme flip, homepage realignment, Mirox clothing seed, and the v1.3/v1.4 task-map revision. Supersedes the homepage _visuals_ of TASK-035/PR #23; their content-config layer and section architecture survive.

**Summary**: `:root` flipped to the Mirox dark palette (whole app, `[data-surface="dark"]` inversion machinery deleted as dead code); homepage/header/footer realigned to `Mirox Home.dc.html` with Ukrainian copy; the electronics seed replaced by the Mirox Ukrainian clothing range (8 products, UAH, `brand: "Mirox"`, destructive reset guarded by `assertLocalDatabase()`/`SEED_ALLOW_REMOTE=1`); UAH display via the shared `formatPrice()` (`src/lib/format.ts`, decision doc §7.4); Cyrillic-capable OG cards with a ghosted brand mark on both root and PDP routes. Executed subagent-driven (13 tasks, fresh implementer + independent reviewer each), then a 3-round user visual-fidelity gate and a whole-branch final review.

**Key changes**:

- **Theme** — dark `:root` (background `#000000`, card `#0d0d0d`, `--border-strong`, `--text-faint`, amber `--rating`); two-layer colour guard re-pointed at the new palette; hover-lift white glow folded into the base rule.
- **Homepage** — image-variant hero (contained photo column desktop / backdrop mobile, token-derived `color-mix` vignette), 2-line «СТИЛЬ. ЯКІСТЬ. / ВПЕВНЕНІСТЬ.» headline, bordered benefit strip, «Новинки» rail, WhyChooseUs checklist + stat cards, testimonial cards, icons-only glass social tiles.
- **ProductCard** — whole-card link, sizes row from Size variants, discount pill; "View Product" button removed.
- **Content/config** — `src/content/{brand,home,site}.ts` rewritten in Ukrainian; header/footer nav realigned; info-page links stay hidden until TASK-055 (user decision, no dead links); return window «14 днів» user-approved for future TASK-055 use.
- **Seed** — `prisma/seed-data/*` rewritten (8 Mirox products MRX-001..008 with own galleries, 4 customers, 7 orders, 8 Ukrainian reviews, 6 subscribers); FK-ordered destructive reset with local-DB guard.
- **OG** — `src/lib/og-fonts.ts` (runtime Cyrillic Manrope TTF fetch, fail-safe `[]`); ghost-logo watermark embedded as base64 data URI at module scope on both cards.
- **Task map** — TASK-036/037/039 re-scoped to the handoff screens; TASK-055/056 annotated; TASK-043/048/049 design pointers filed in BACKLOG.

**Verification**: unit **423+1 → 451+1**; E2E **115/115** across all five local projects; local prod build clean; user visual sign-off (v3, after 3 revision rounds). PR review: round 1 — 4 findings, all verified real and fixed (`8166e47`); round 2 — reviewer caught **CI red on every push of the branch**: ESLint failed on the Figma-exported vendor JS because flat config ignores the lint script's inert `--ext .ts,.tsx`, and the `build: needs [lint, test]` cascade meant **Build and E2E had never run on the branch**. Fixed by ignoring `docs/**` (`38ce2c0`) → first fully-green CI run (all five checks; reviewer independently verified the jobs executed and the 46-test CI E2E count reconciles with 115 local). Reviewer's final ruling: 7 fixed + 1 accepted, `CLEAN`/`MERGEABLE`.

**Post-merge deploy**: prod verified serving the rebrand (homepage 200 + Ukrainian headline ~2 min after merge; root OG card 200). **The PDP `og:image` 500'd in prod** — Vercel runtime logs show `ENOENT /var/task/public/images/og-logo-ghost.png`: serverless file tracing doesn't include `public/` assets read via `fs.readFileSync`, and only the dynamic PDP route hits it (the root card is statically prerendered at build time, where the file exists). This was an anticipated risk with a prepared fix: `experimental.outputFileTracingIncludes` → follow-up PR #25, merged `acb0c30` the same day — prod PDP og:image verified 200 `image/png` (product photo, Cyrillic name, UAH price, ghost mark all render). The user-approved destructive **prod re-seed also ran the same day** (`SEED_ALLOW_REMOTE=1` against the Neon direct endpoint, after a read-only preflight confirmed the target): prod now serves the 8-product Mirox catalog, verified live via API, PDP, and homepage.

**Acceptance — as shipped** (hedged, per the standing rule): all five ACs ✅, but imagery is **generated placeholder** (hero model + all 8 product galleries + logo PNG — real client photography/vector still owed, TASK-056); announcement slot ships `null`; info-page nav links hidden until TASK-055; Stripe still charges test-mode `usd` (TASK-048). Pre-existing bugs incidentally fixed and disclosed: PDP OG relative-URL crash (Satori needs absolute URLs — this route 500'd in prod for every seeded product before this task), the container-wide `NODE_ENV=development` leak corrupting responsive CSS in local prod builds, and white-on-dark Stripe Elements. Pre-existing bugs found and BACKLOG'd, not fixed: admin Customers/Categories infinite fetch loop, `use(params)` 500s on 4 admin/account routes, the dead `dark:` variant app-wide.

**Learnings**:

- **ESLint `--ext` is inert under v9 flat config** — `eslint .` lints `.js` too, so committed third-party/vendor JS must be `globalIgnores`-ignored, not extension-filtered. The CI-red state was invisible to the code-review skill by design (it scopes out build signal): merge-readiness needs its own check of the actual check-runs, not just review findings.
- **A failing first step in a multi-step CI job silently un-runs everything after it** — lint failing meant typecheck/format:check never executed, and the `needs:` cascade kept Build/E2E from ever running. "Which jobs actually executed?" is a distinct question from "is the badge green?"
- **`public/` assets are not traced into Vercel function bundles** — `fs.readFileSync(public/…)` works locally and in statically-prerendered routes (build-time disk) but ENOENTs in dynamic serverless routes; `outputFileTracingIncludes` is the fix. The root/PDP OG asymmetry (static vs dynamic) is why only one of two identical-looking routes broke.
- **Chromium `fullPage` screenshots can drop GPU-composited layers** (the hero photo vanished from the stitched capture while live DOM was correct) — capture with a tall viewport instead; don't debug the page for a screenshot artifact.
- **Playwright clicks racing hydration** silently no-op on `next/link` before the router attaches — wait for a post-hydration-only signal (here: the CookieConsent banner) before interacting; same family as the WebKit pre-hydration `fill()` lesson.

### [2026-07-27] Homepage Polish & Art Direction

**Plan**: [docs/archive/plans/2026-07-24_homepage-polish-art-direction.md](../archive/plans/2026-07-24_homepage-polish-art-direction.md)
**Spec**: [2026-07-24-mirox-homepage-polish-design.md](../superpowers/specs/2026-07-24-mirox-homepage-polish-design.md)
**PR**: [#23](https://github.com/GoodAlex223/dropshipping-test/pull/23) — merged `987831e`

**Origin**: A post-completion **visual audit** (screenshot-vs-concept, Playwright against live prod) of the TASK-035 homepage — the user observed the deployed page didn't match `docs/reference/mirox-concept-screenshot.jpg`. The audit's headline finding: the "empty void below the hero" was **scroll-reveal working as designed, not a dead page** — `FadeIn` started every section at `opacity:0` and its `IntersectionObserver` never fired on load, so the page _looked_ broken. Nine findings, split content-blocked (real photos/catalog → TASK-056/036/039) vs. buildable-now. This task shipped the buildable-now craft.

**Summary**: `FadeIn` flipped to visible-by-default (fixes blank-until-scroll); monochrome discount badge (was red `destructive`); branded Mirox "M" fallback for missing/broken product images; `--shadow-soft` token + moderate `.glass` utility, with soft resting elevation + `hover-lift` on cards; "Why choose us" rebuilt as a dark by-the-numbers stats block (real gated `site.claims`); "Follow us" as glass social tiles distinct from the footer; art-directed no-photo hero (gradient + desaturated grain + ghosted "M" watermark + staggered headline). Executed subagent-driven — a fresh implementer + independent spec/quality reviewer per task, then an opus whole-branch review.

**Key changes**:

- **Motion (F2)** — `FadeIn` renders `opacity-100` in SSR and adds a CSS `.animate-fade-up` entrance only when motion is allowed; the `IntersectionObserver` gate is gone. Invariants: no-JS-safe, nothing stuck hidden, reduced-motion honoured, `[data-testid='product-card']` E2E signal preserved.
- **Palette (F4)** — discount badge → `variant="default"` monochrome pill.
- **New file** — `src/components/products/ProductImage.tsx` (`"use client"`) owns the image + blur placeholder and renders the branded "M" fallback on `onError`; `ProductCard` stays a server component.
- **Sections** — `WhyChooseUs` dark stats block; `SocialLinks` gained a `variant: "inline" | "tiles"` prop (footer inline unchanged, homepage tiles); `Hero` `!hasImage` branch art-directed. `public/grain.svg` static asset.
- **Tokens** — `--shadow-soft` (+ dark re-skin) and `.glass` in globals.css; `[data-surface="dark"] .hover-lift:hover` white-glow override (black shadow is invisible on black).

**Verification**: unit **415+1 → 423+1**; lint / typecheck / build green; opus whole-branch review merge-ready (its one Important finding — a dead `--shadow-soft` token — fixed in-branch). CI green on `main`; **prod deploy verified serving the fix** — screenshot of `dropshipping-test.vercel.app` shows the whole page visible on load (`hiddenTextBlocks: 0`, was 4), art-directed hero, monochrome badges, branded image fallbacks, stats block and social tiles.

**Acceptance — as shipped**: all buildable-now craft ✅. Still content-blocked (unchanged, tracked): real hero photography + real clothing catalog (TASK-056), UAH pricing (TASK-039), rich card interactions (TASK-036). The deployed catalog is still placeholder electronics with 404'd images (now shown as the branded "M" fallback rather than blank).

**Learnings**:

- **Green CI ≠ visual fidelity.** TASK-035 passed every automated gate and six review rounds yet shipped a page that _looked broken_ on load — because acceptance was textual and nobody compared the rendered page to the concept. The **visual-fidelity sign-off** (a human comparing the deployed page to the reference) is now the standing prevention for design tasks; backlogged.
- **`grep | head` masks grep's exit code → false-green compiled-CSS checks**, and Next's prod CSS minifier silently drops an inline-`data:`-URI rule with a nested `url(#id)` (use a static asset). See [[css-verification-and-next-minifier-gotchas]]. Verify the _compiled_ output with grep's real exit status.
- **Per-task reviews can't see a created-but-never-consumed token** — `--shadow-soft` was added in task 1 and wired to nothing until the whole-branch review caught it. Cross-task dead code is the final review's job.

### [2026-07-21] TASK-035 - Homepage Rebrand

**Plan**: [docs/archive/plans/2026-07-19_task-035-homepage-rebrand.md](../archive/plans/2026-07-19_task-035-homepage-rebrand.md)
**Spec**: [2026-07-19-task-035-homepage-design.md](../superpowers/specs/2026-07-19-task-035-homepage-design.md)
**Client brief**: [reference/client-brief.md](../reference/client-brief.md)
**PR**: [#21](https://github.com/GoodAlex223/dropshipping-test/pull/21) — merged `0992851`
**Prod hotfix**: [#22](https://github.com/GoodAlex223/dropshipping-test/pull/22) — merged `e89060d` (see "Post-merge production incident" below)

**Summary**: Rebuilt the customer homepage on the TASK-034 Mirox design system — dark typographic hero, benefit strip, "Why choose us", featured + real-bestsellers rails (with a new-arrivals fallback), a testimonials rail from genuine reviews, a social section, an announcement-bar slot, and a rebranded footer. `src/app/(shop)/page.tsx` went from a 255-line generic template to ~66 lines composing tested section components. Copy ships in English, extraction-ready for TASK-039 i18n. Executed subagent-driven: a fresh implementer + independent reviewer per task, then a whole-branch review.

**Key changes**:

- **Content config layer** — `src/content/{brand,site,home}.ts` centralises brand constants, site config (socials, claims, announcement, footer), and homepage copy. `brand.ts` is deliberately **import-free** (it feeds the OG/robots/sitemap/feed runtimes via `seo.ts`); provenance comments mark every client-supplied value as PROVISIONAL.
- **Home sections** — `src/components/home/{Hero,ProductRail,WhyChooseUs,Testimonials}` + shared `common/{AnnouncementBar,BenefitStrip,SocialLinks}`. Hero has two layouts (typographic-complete when `home.hero.image` is `null`, additive photo slot when supplied). Each rail/section renders nothing on empty data.
- **Data layer** — `src/lib/product-queries.ts` (`getFeaturedProducts`, `getNewArrivals`, `getBestsellers` with a `source: "orders"|"backfilled"|"mixed"` flag so new arrivals are never mislabelled as bestsellers) and `src/lib/review-queries.ts` (`getTestimonials`). New `@@index([productId])` on `OrderItem` (migration `20260719104108`), shared with TASK-036.
- **SEO/branding** — `seo.ts` falls back to `BRAND_NAME` not `"Store"`; a site-wide code-generated `src/app/opengraph-image.tsx` (fixed in a PR #21 code-review round to actually render — `getDefaultMetadata()` had been pinning the stale PNG); `public/manifest.json` rebranded.
- **Footer** — Mirox tagline, reuses `SocialLinks`/`BenefitStrip`, 7 dead links removed (routes spawned as TASK-055).

**Verification**: typecheck / lint / build / `format:check` all pass. Tests **336+1 → 415+1** on the branch (+2 → **417+1** with the hotfix). CI green on `main`; Vercel Git-integration production deploy verified.

**Acceptance criteria — as shipped** (precise, not aspirational):

- ✅ First screen: slogan ("STYLE. QUALITY. CONFIDENCE."), subtitle, two CTAs.
- ✅ Benefit strip and "Why choose us" blocks present.
- ✅ Social section (Instagram, TikTok, Telegram).
- ✅ Announcement-bar slot built (dismissible, cross-tab) — ships with `site.announcement = null` because its only candidate copy was an unimplemented free-delivery promise; renders nothing until the client supplies real copy.
- ⚠️ Hero real photography **not supplied** — ships typographic-complete with `home.hero.image = null`; the photo is a one-line addition once the client provides one (tracked in TASK-056).
- ✅ Follower counters gated on real numbers (tested); none supplied, so none render.

**Post-merge production incident** (→ PR #22): the homepage 500'd on every prod request while `/products`/`/categories` were fine. Root cause (Vercel runtime logs, `P2021`): `getTestimonials()` queried a `reviews` table that **did not exist in production** — the prod DB schema had silently drifted since Feb because **nothing applied `prisma migrate deploy` on deploy** (`build` was `generate && next build`; the Actions deploy job is a no-op). TASK-035 was simply the first code to put a server-side review query in the homepage render path. Fixed two ways: (1) `safeSection()` wraps each homepage query so a failed section degrades to hidden, never a 500; (2) a `vercel-build` script runs `prisma migrate deploy` (via `DIRECT_URL`, non-fatal) on every Vercel deploy. Verified: prod `/` 200, all 5 pending migrations applied, zero runtime errors, `reviews`/`subscribers` tables now queryable. Incidentally restored reviews + newsletter, silently broken in prod since February.

**Learnings**:

- A CI-green, well-reviewed PR still took prod down: **CI runs plain Postgres with a clean seed, production runs the Neon adapter against a drifted schema** — the one path CI never exercises. Green checks proved the code, not the deployed database.
- **"Deploy succeeded" ≠ "deployed"**: the Actions Deploy badge is a validated no-op; the real deploy is the Vercel Git integration. Always verify the actual production URL and a DB-backed route, not the badge. (See [[claude-md-auto-managed-no-regeneration]] for the parallel "green artifact ≠ real" lesson.)
- A decorative section must never be able to 500 the whole page — resilient composition (`safeSection`) is the default posture for a render path that fans out data queries.
- Several "tests that cannot fail" were caught by the review loop, incl. one only CI could surface (a later doc/config change silently invalidated an E2E assertion).

**Note**: during the branch a subagent deleted `_liqpay_check_tmp.mjs`, an untracked user scratch file at the repo root (never git-tracked, not in any stash) — unrecoverable. Disclosed rather than buried.

### [2026-07-18] TASK-034 - Mirox Design System & Rebrand Foundation

**Plan**: [docs/archive/plans/2026-07-17_task-034-design-system.md](../archive/plans/2026-07-17_task-034-design-system.md)
**Spec**: [2026-07-17-mirox-design-system-design.md](../superpowers/specs/2026-07-17-mirox-design-system-design.md)
**PR**: [#19](https://github.com/GoodAlex223/dropshipping-test/pull/19) — merged `adaa278`

**Summary**: Black/white luxury-minimal design system for the Mirox Shop rebrand, built token-first so later design files re-skin tokens rather than components. Executed as 12 TDD tasks with a per-task review gate plus a final whole-branch review.

**Key changes**:

- **Design tokens + section inversion** — one fixed Mirox theme on `:root`; `[data-surface="dark"]` re-skins a subtree by overriding the same variables. Radius `0.25rem`; motion tokens (`--ease-mirox`, 150/250/400ms). The `.dark` block and the storefront theme switcher are gone.
- **Typography** — Manrope headings (variable font) + Inter body, both with `cyrillic-ext` so `₴` (U+20B4) renders for the Ukraine launch.
- **`<Logo/>`** — code-built wordmark + bag-with-M glyph, `currentColor`-driven, link-less; drop-in slot for an official SVG.
- **Motion primitives** — `<FadeIn>` (reads `prefers-reduced-motion` via `useSyncExternalStore`), `.animate-fade-up`, `.hover-lift`; all no-op under reduced motion.
- **`next-themes` excised from the storefront** — closed a real contamination path where visiting `/showcase/bold` left the storefront themed; showcase now scopes its themes to its own subtree.
- **Shared chrome** — Header and Footer as dark surfaces; monochrome stars/review bars; shared `src/lib/order-status.ts` replacing the map duplicated across 4 order pages; checkout, newsletter, 404 and account-order-detail neutralized.
- **Two-layer colour guard** — a utility-class guard over 11 paths/38 files, plus a token-layer test asserting the Mirox tokens are achromatic. Both were proven to fail before being trusted.

**Verification**: `typecheck` / `lint` (zero warnings) / `format:check` / `build` all pass. Tests **246+1 → 336+1**. CI green on `main`; production deployed by the Vercel Git integration and verified serving the rebrand.

**Acceptance criteria — as shipped** (deliberately precise, not aspirational):

- ✅ Tokens defined and consumed by shared components (verified in compiled CSS).
- ⚠️ Header/Footer actively restyled; **buttons and cards were re-coloured and re-radiused via tokens only** — no bespoke treatment. The token theory holds mechanically.
- ⚠️ Animation primitives available and reduced-motion-safe, but **zero consumers yet** — unexercised in a real browser.
- ⚠️ Monochrome across the token layer and every TASK-034-owned surface; **4 bright utilities remain on deferred pages** (cart ×3, PDP ×1), regression-guarded and scheduled for TASK-036/043.

**Learnings**:

- A CSS token that is defined but **not registered in `@theme`** is a silent no-op — `text-destructive-foreground` shipped as a dead class that typecheck, lint and tests could not see. Only compiled-CSS inspection caught it; registering it also repaired 7 pre-existing broken sites.
- `[data-surface="dark"]` re-scopes tokens for **all descendants**, so any descendant using `bg-background` collapses into the surface. This produced a real WCAG failure (newsletter input at 1.34:1) that the wrapper itself looked fine through.
- CSS `color` inherits as an **already-resolved** value, so redefining `--foreground` on a descendant cannot retroactively change it — the inversion needed an explicit re-assertion in `@layer base`.
- "Neutralize page X" must be enumerated **per file**: `checkout/page.tsx` was cleaned while its sibling `checkout/confirmation/page.tsx` silently escaped.
- Six review rounds produced **zero runtime defects but repeated prose drift** — comments and docs describing the change went stale faster than the code did.

### [2026-07-17] TASK-038b - Ukraine Payments & Delivery Research Spike

**Plan**: [docs/archive/plans/2026-07-16_task-038b-payments-delivery-spike.md](../archive/plans/2026-07-16_task-038b-payments-delivery-spike.md)
**Spec**: [2026-07-16-ukraine-payments-delivery-design.md](../superpowers/specs/2026-07-16-ukraine-payments-delivery-design.md)
**Deliverable**: [2026-07-16-ukraine-payments-delivery-decision.md](../superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md)

**Summary**: Decision doc, **no product code** (`src/` untouched). Settles the Ukraine gateway choice, scopes Nova Poshta, and fixes the UAH strategy so TASK-048/049 can be planned without re-discovery. Method: Ultracode research fan-out across 8 topics (5 gateways + Nova Poshta + COD/legal + currency) piped through **adversarial verification of every claim** against primary sources. **120 claims researched, all 120 verified — 77 confirmed, 33 disputed, 10 unverifiable (27.5% dispute rate on the raw research).** All four acceptance criteria met.

**The central finding is methodological**: single-pass research would have shipped a fluent, confidently-worded, **wrong** launch-gating document. Three of the four plan-changing findings came from the verifier _contradicting_ the researcher. Two failure modes recurred and are worth naming: **citing pages never actually loaded** (search-index snippets reported as sources — this produced the Fondy error) and **conflating adjacent-but-distinct products**. Neither is detectable by reading the research alone.

**Key Findings**:

- **Fondy disqualified on licensing, not price** — its Ukrainian entity ТОВ «ФК "ЕЛАЄНС"» (EDRPOU 38905834) had NBU licence 21/778-рк **revoked 2024-07-22**, per the NBU's own machine-readable register. The raw research had it as a live candidate. Compounding: `fondy.ua` is TCP-unreachable from our network, so every Ukraine-side claim was sourced to pages never loaded; `docs.fondy.io` documents the **UK** entity (FONDY LTD) and says nothing about Ukrainian acquiring.
- **Plata by mono cannot offer installments via the acquiring API** — `paymentScheme` (incl. `bnpl_parts_4`) exists only in _response_ schemas; a merchant can observe a buyer's scheme but not offer BNPL. Instalments are a separate product («Покупка Частинами», 3–25 instalments) where **the merchant pays the commission**.
- **monobank requires a Ukrainian-language site** for internet acquiring → **TASK-039 (i18n) is a hard prerequisite for payments** under that branch. TODO.md TASK-039 updated with this escalation.
- **Nova Poshta's postomat filter UUID was inverted** in the research — the claimed `9a68df70-…` is «Вантажне(ий)» and returns `CategoryOfWarehouse: Branch`; the real «Поштомат» ref is `f9316480-…`. Building on it would have shipped **branch pickups to customers who chose a locker**.

**Recommendation (conditional — turns on facts only the client holds, §5.3)**: already banks with monobank + no installments → **Plata by mono**; **any other case → LiqPay** (safest default; only candidate settling to _any_ bank's IBAN); installments a primary lever → **WayForPay** (9 bank programs vs LiqPay's 2); Portmone only on a specific reason. Branches A and B are both 1.3%/2% — **fee is not the differentiator**; bank lock-in vs onboarding speed is.

**Key Changes** (docs only):

- `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` — the deliverable (9 sections + Sources): two-rail model (online gateway **and** NP COD, with opposite order lifecycles), 5-gateway × 16-field matrix, conditional decision tree + 9-item client prerequisites checklist, NP scoping (all 6 `ServiceType` modes, live-verified refs), single-UAH strategy, and an integration blueprint seeding TASK-048/049
- `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-design.md` — the spike's spec (scope, candidate set, methodology, doc outline)
- `docs/archive/plans/2026-07-16_task-038b-payments-delivery-spike.md` — the 8-task plan
- `docs/planning/BACKLOG.md` — `[2026-07-17]` group: devcontainer OOM investigation (5 entries)
- `docs/planning/TODO.md` — TASK-039 dependency escalation

**Blueprint decisions beyond the task's ask** (§8): a **`PaymentGateway` adapter interface** so TASK-048 is not blocked waiting on the client's legal-entity answer; a new **`AWAITING_COD`** `PaymentStatus` because the COD rail ships before payment, so today's `PENDING` would conflate "abandoned cart" with "in transit awaiting collection"; and the §8.4 schema delta scoped as **one migration** per the program's one-migration-per-PR rule.

**Verification**: documentary — 9 sections intact, zero dangling cross-references, zero placeholders, every quantitative claim carrying a primary-source citation or an explicit unverifiable tag. No code changed, so no test impact; CI green on the merge regardless (Lint/Typecheck, Unit 246, Build, E2E).

**PR**: [#18](https://github.com/GoodAlex223/dropshipping-test/pull/18) — merged `cebbbe5`, all 6 checks green, Vercel production deploy live. Branch `feat/task-038b-payments-delivery-research`, 10 commits: `2e8d682` (spec), `7321c09` (plan), `76d7e39` (skeleton), `aecdefd` (two-rail + matrix), `346687f` (recommendation + prerequisites), `b15e640` (NP + COD), `aff2bb4` (UAH + blueprint), `87d60ff` (risks + audit), `34f5f53` (OOM backlog), `92b4e1f` (review fixes).

**Code review**: 3 findings, all the deliverable failing rules it wrote for itself (broken headline arithmetic; the mandated Support column dropped while a Card-fee row-split masked the count; uncited payout limits). All fixed in `92b4e1f`; re-review clean. **The statistic finding's diagnosis was wrong and was pushed back on**: the reviewer inferred 145 was the true denominator, but 120 claims and 145 verdicts are both real (16 claims were re-checked during crash/resume cycles) — the bug was a verdict-level breakdown attached to a claim-level count. Following the suggestion would have introduced a new error. Two sub-threshold findings were also acted on: the plan had been written to `docs/superpowers/plans/` (the writing-plans skill default) instead of `docs/planning/plans/` per global CLAUDE.md — the skill explicitly defers to user preference and I followed the default past the override; and §3 carried nine figures with zero citations.

**Execution note**: the research workflow was **OOM-killed three times** mid-run (devcontainer, not a Docker bug — `oom_kill 1`, 8.45 GiB peak vs 9.7 GiB total, 14 concurrent agents). Resume proved unreliable — it replayed the head and left Fondy and Plata by mono with **zero** verification across all three attempts while the raw verdict count climbed 80→93→126, which looked like progress and wasn't. The gap was closed by 3 **foreground** agents (one per topic), which also did the job better. Investigation Phase 1 complete and BACKLOG'd; root cause **not yet confirmed by repro**.

**Spawned Tasks**: 5 BACKLOG entries under `[2026-07-17] From: TASK-038b workflow crashes`, plus follow-ups under `[2026-07-17] From: TASK-038b Completion`.
**Open Decisions / Blockers for downstream**: (1) the 9-item client prerequisites checklist (§5.3) must be answered before TASK-048 can pick a single gateway — including РРО/ПРРО status, which needs an accountant, not us; (2) whether the **classic** NP API offers a status webhook is **unresolved** (devportal Cloudflare-blocked) and gates TASK-049's polling design — plan for polling, treat push as upside; (3) all published rates are negotiable — real economics need sales quotes.

---

### [2026-07-16] TASK-038a - Prework: WebKit E2E Diagnosis, sharp, CI Coverage

**Plan**: [docs/archive/plans/2026-07-15_task-038a-prework.md](../archive/plans/2026-07-15_task-038a-prework.md)
**Summary**: Resolved the two decisions blocking v1.3 feature work plus a CI coverage gap, per spec [2026-07-15-task-038a-prework-design.md](../superpowers/specs/2026-07-15-task-038a-prework-design.md). Diagnosed the WebKit-only E2E "can filter products by search" failure using a `page.route`-delay discriminating experiment and a `pressSequentially`-vs-`fill()` comparison, confirmed it is a **test artifact, not a product bug**, added `sharp` as a runtime dependency for the standalone deploy path, and added `webkit` to the CI E2E matrix (previously chromium-only, which is why this bug class was invisible).

**Branch decision (spec §4.3) — Branch B: test artifact, no product fix**:
Root cause: the test called `searchInput.fill()` gated only on element visibility (paint), not React hydration/interactivity. On WebKit engines only, a programmatic `fill()` issued before hydration produces an `input` event that never reaches React's synthetic event system, so the controlled `search` state stayed `""`; `handleSearch` → `updateFilters({ search: "" || null })` then correctly deletes the (never-set) falsy `search` key, so the URL param never appears — `/products?page=1` instead of `/products?search=test&page=1`. This is not the same failure mode as a user typing: real keystrokes via `pressSequentially` survived 4/4 on WebKit even pre-hydration, and Chromium throttled to 8x CPU (also caught un-hydrated) still survived — ruling out both "WebKit can't type" and "generic timing race" as explanations. **No file under `src/` was touched — the product code was correct throughout.** `docs/planning/BACKLOG.md`'s prior "pre-existing product bug" claim (logged 2026-07-14 under the TASK-033 Resumption Audit) has been corrected in place to record the disproof, per the evidence above.

**Key Changes**:

- `tests/e2e/products.spec.ts`: the test now waits for `[data-testid='product-card']` (a hydration-only render signal — cards only appear from a client-side post-hydration fetch effect) before touching the search input
- `package.json` / `package-lock.json`: added `sharp ^0.35.3` to `dependencies` (not `devDependencies` — `next.config.mjs` uses `output: "standalone"`, which needs `sharp` at serve time for `next/image` optimization)
- `.github/workflows/ci.yml`: added `webkit` to the Playwright browser install (line 136) and the E2E run (line 161); `Mobile Safari` deliberately excluded from CI (same engine as `webkit`, and CI runs `workers: 1` so each added project costs a full serial pass — flagged to BACKLOG for TASK-040)
- `docs/planning/BACKLOG.md`: `:345` (sharp) marked resolved; `:361` (WebKit) corrected in place — "product bug" claim disproven, actual root cause and fix documented; 6 new entries added under `[2026-07-16] From: TASK-038a`
- `.prettierignore`: added `.superpowers`, `playwright-report`, `test-results` — `npm run format:check` was failing on 28 generated artifacts (24 gitignored agent scratch + 4 E2E run outputs) and zero source files, making the check unusable locally; consistent with the file's existing exclusion of other generated dirs (`.next`, `dist`, `build`, `coverage`)

**Verification**: unit 246 passed + 1 todo; lint/typecheck/build PASS; `format:check` PASS (after the `.prettierignore` fix above). E2E 84/85 — up from the TASK-033 baseline of 83/85: chromium 16/17, firefox 17/17, webkit 17/17, Mobile Chrome 17/17, Mobile Safari 17/17. Both previously-failing tests (webkit and Mobile Safari "can filter products by search") now pass. The one remaining failure, `[chromium] navigation.spec.ts "can navigate to categories page"`, is a pre-existing, intermittent `next dev` cold-compile flake unrelated to this work (reproduced ~2/3 in isolation; `navigation.spec.ts` is byte-identical to `main`, `src/` untouched on this branch) — BACKLOG'd.

**PR**: [#17](https://github.com/GoodAlex223/dropshipping-test/pull/17) — all checks green, including the first-ever `webkit` CI run (34/34 in 57.7s: 17 chromium + 17 webkit). Branch `feat/task-038a-prework`, commits: `e5ff8ef` (test fix + BACKLOG:361 correction), `69f8682` (sharp), `9fe4732` (ci: webkit), completion/review commits `b91b332`, `0ee5f01`, `fcd59cd`, plus earlier spec/plan commits `84886e4`, `3e4ce8f`, `0925bd8`, `5230d84`.
**Spawned Tasks**: 6 BACKLOG entries added under `[2026-07-16] From: TASK-038a` — shared interact-before-hydration pattern unexercised in `products.spec.ts`/`cart.spec.ts`/`navigation.spec.ts`, the chromium cold-compile flake, `page.route` race-testing as a reusable pattern, `sharp`'s undocumented Node ≥20.9.0 floor, CI `workers: 1` serial-cost ahead of TASK-040, and auditing remaining BACKLOG entries for other unverified root-cause claims.
**Open Decision**: none — both TODO.md decisions (WebKit fix-vs-defer, sharp add-vs-backlog) are now resolved.

---

### [2026-07-14] TASK-033 - Post-Freeze Resumption Validation

**Plan**: [docs/archive/plans/2026-07-14_task-033-resumption.md](../archive/plans/2026-07-14_task-033-resumption.md)
**Summary**: First task of the Mirox Shop program (spec: [2026-07-14-mirox-shop-program-design.md](../superpowers/specs/2026-07-14-mirox-shop-program-design.md)). Re-validated the codebase after the 5-month freeze: conservative dependency audit reduced vulnerabilities 32→6 (0 critical; remaining need major upgrades, deferred to BACKLOG), full validation baseline (lint/format/typecheck/unit 246/build green; E2E 83/85 with one pre-existing WebKit-only bug documented), created WEEKLY.md, promoted v1.3 tasks TASK-034..040 to TODO.md. Executed via subagent-driven development (5 tasks, per-task spec+quality reviews, final whole-branch review: READY TO MERGE).
**Key Changes**:

- `package-lock.json`: 151 packages bumped, 35 removed, 1 added — lockfile-only, `package.json` untouched (conservative policy)
- New `docs/planning/WEEKLY.md`; `TODO.md` rewritten with TASK-034..040 (priorities, dependencies, acceptance criteria)
- 4 BACKLOG entries: Next.js 14→16 security majors, nodemailer chain (blocked by @auth/core pin), WebKit E2E search-filter bug, stale seed-count docs
- Program design spec committed; docs/README.md, CLAUDE.md, ROADMAP.md refreshed per PR review findings (stale state, v1.2.0 tag commit corrected to 1ab109a)

**PR**: [#16](https://github.com/GoodAlex223/dropshipping-test/pull/16) (merge commit c07e474)
**Spawned Tasks**: 4 BACKLOG entries from audit/validation + repo-hygiene extractions (see BACKLOG `[2026-07-14] From: TASK-033 Completion`)
**Open Decision**: WebKit E2E fix-vs-defer before v1.3 feature work (spec requires green baseline)

---

## Release Tag

### [2026-02-12] v1.2.0 — Freeze Complete

All MVP implementation (TASK-001 through TASK-016), post-MVP features (TASK-017 through TASK-024), and freeze cleanup (TASK-025 through TASK-032) are complete. Project tagged as `v1.2.0` on main.

---

## 2026-02 (February)

### [2026-02-12] TASK-032 - Freeze Finalization & Release Tag

**Plan**: N/A (finalization task, no plan document)
**Summary**: Final freeze step — verified all TASK-027 through TASK-031 complete, updated ROADMAP.md with freeze completion status and post-freeze resumption guide, cleaned up TODO.md, ran full validation (build, unit tests, E2E tests), and tagged release as `v1.2.0` on main.
**Key Changes**:

- Updated ROADMAP.md: marked all freeze tasks complete, updated timeline, added post-freeze resumption section
- Updated TODO.md: cleared tasks, added freeze complete summary with next steps
- Verified all 6 freeze tasks (TASK-027 through TASK-032) completed
- Final validation: build, 245+ unit tests, E2E tests all passing
- Git tag `v1.2.0` created on main branch

**Spawned Tasks**: 0 (freeze complete, future work in BACKLOG.md)

---

### [2026-02-12] TASK-031 - Code Quality Sweep

**Plan**: N/A (cleanup task, no plan document)
**Summary**: Final code quality pass resolving all 24 ESLint warnings to zero. Migrated 10 `<img>` tags to `next/image`, removed ~120 lines of dead code from utility files, fixed 12 unused imports/variables, resolved a `useCallback` missing dependency, and moved 2 inline TODO comments to BACKLOG.md. 27 files changed, 110 insertions, 262 deletions.
**Key Changes**:

- Migrated all `<img>` to `next/image` across 9 shop/component files (10 instances)
- Removed dead code: 4 unused functions from image-utils.ts, 2 exports from web-vitals.ts, `generateSku()` from api-utils.ts
- Fixed 12 unused imports/variables in 8 files (Header, CartDrawer, category-client, product-detail-client, admin routes, PaymentForm, global-setup)
- Fixed `react-hooks/exhaustive-deps` in ImageUploader.tsx (wrapped `uploadFile` in `useCallback`)
- Added `coverage/**` to ESLint globalIgnores
- Removed 2 TODO comments from confirm-order/route.ts, added to BACKLOG.md
- Updated 3 generateSku tests removed from api-utils.test.ts

**Commit**: 901ddbd
**Spawned Tasks**: 2 items added to BACKLOG.md (tax calculation, supplier order queue)

---

### [2026-02-11] TASK-030 - Documentation Finalization

**Plan**: [docs/archive/plans/2026-02-10_task-030-documentation-finalization.md](../archive/plans/2026-02-10_task-030-documentation-finalization.md)
**Summary**: Comprehensive documentation audit and update of 15+ files across 4 priority phases. Fixed version numbers (Next.js 16→14, Prisma 7→6), added missing features to all docs (reviews, newsletter, analytics, social sharing, performance), created MIT LICENSE, and updated .env.example with correct Docker Compose port mappings. Quality review with 3 parallel code-reviewer agents found and fixed 8 additional issues.
**Key Changes**:

- Phase 1: Rewrote ROADMAP.md (marked v1.1/v1.2 complete, added Freeze Week), created MIT LICENSE
- Phase 2: Full rewrites/updates of README.md, PROJECT.md, ARCHITECTURE.md, PROJECT_CONTEXT.md
- Phase 3: Added Review/Subscriber/VerificationToken tables to schema.md, 17 endpoints to endpoints.md, 6 testing sections (53 items) to TESTING_CHECKLIST.md, updated strategy.md coverage numbers
- Phase 4: Updated docs/README.md dates, archive index, .env.example ports/comments
- Quality review: Fixed zod/resend/web-vitals versions, missing VerificationToken table, newsletter 410 status code, user count, archive index gaps, AUTH_TRUST_HOST comment
- 16 files changed, 1172 insertions, 329 deletions

**Commit**: c6e3fdc
**Spawned Tasks**: 4 items added to BACKLOG.md (doc freshness script, API docs generation, schema docs generation, link checker)

---

### [2026-02-10] TASK-029 - Technical Debt Cleanup

**Summary**: Addressed 6 technical debt items from code review findings. Added NaN guards to review rating filters, merged duplicate JSON-LD functions, extracted shared Review types, simplified seed data typing, added comparePrice cross-field validation, and removed all console.error from API routes (~60 occurrences across 41 files). Code review caught and fixed a ZodEffects/.partial() breaking change and an unsafe non-null assertion.
**Key Changes**:

- Added parseInt NaN validation in review API rating filters (2 routes)
- Merged `getReviewsJsonLd()` into `getProductJsonLd()` — single Product JSON-LD per page
- Extracted `ReviewWithUser` and `RatingDistribution` interfaces to `src/types/index.ts`
- Added `SubscriberSeedData` interface, simplified seed.ts with optional chaining
- Split `productBaseSchema` (ZodObject) from `productSchema` (ZodEffects) for safe `.partial()` usage
- Added comparePrice > price validation on both server and client side
- Removed ~60 console.error calls, converted unused `catch(err)` to bare `catch`
- Added 4 new unit tests for NaN/out-of-range rating filter handling
- Total: 249 tests passing, 0 lint errors, typecheck clean

**Commit**: dcf654d
**Spawned Tasks**: 3 items added to BACKLOG.md (structured logging, partial update validation, E2E test)

---

### [2026-02-09] TASK-028 - Test Coverage Improvement

**Summary**: Added 158 new unit tests covering review APIs, newsletter APIs, api-utils helpers, newsletter utilities, and SEO functions. Established shared test infrastructure and documented coverage baseline (89.82% stmts, 93.19% branches, 98.71% functions).
**Key Changes**:

- Created `tests/helpers/api-test-utils.ts` with `createNextRequest()` and `createRouteParams()` helpers
- Created 6 new test files: api-utils, newsletter, reviews-api, admin-reviews-api, newsletter-api, admin-newsletter-api
- Extended seo.test.ts with 18 new tests for metadata generators and JSON-LD
- Total: 245 tests passing (87 existing + 158 new), lint/typecheck clean

**Commit**: 1bac9b0
**Spawned Tasks**: 4 items added to BACKLOG.md (integration tests, NaN fix, remaining API tests, P2002 testing)

---

### [2026-02-09] TASK-027 - Dependency Audit & Security Patches

**Plan**: [docs/archive/plans/2026-02-09_task-027-dependency-audit.md](../archive/plans/2026-02-09_task-027-dependency-audit.md)
**Summary**: Ran full security audit, fixed 1 HIGH vulnerability (fast-xml-parser via AWS SDK), updated 30 packages to latest patch/minor versions, documented 2 deferred Next.js vulnerabilities requiring major upgrade.
**Key Changes**:

- Fixed fast-xml-parser HIGH vulnerability by updating AWS SDK 3.965→3.985
- Updated 28 packages within semver ranges + 2 explicit bumps (lucide-react, eslint-config-next)
- Updated Stripe API version in `src/lib/stripe.ts` to match SDK update
- Documented 7 packages intentionally kept at older major versions with reasoning
- All verification passed: lint, typecheck, 87/87 tests, production build

**Commit**: c4a3aa7
**Spawned Tasks**: 3 items added to BACKLOG.md (Next.js 16 upgrade, Prisma 7 migration, Dependabot setup)

---

### [2026-02-06] TASK-022 - Demo Content Enhancement

**Summary**: Enhanced seed data with realistic demo content for better site presentation.

**Key Changes**:

- Modularized seed data into `prisma/seed-data/` (users, categories, products, orders, reviews, subscribers)
- Expanded from 5 to 21 products with Unsplash images, brands, barcodes, and MPNs
- Added category hierarchy (4 top-level + 11 subcategories with images)
- Added 4 test customers for realistic order/review authorship
- Added 7 demo orders in various statuses (PENDING, PROCESSING, SHIPPED, DELIVERED)
- Added 8 demo reviews with star ratings, comments, and admin replies
- Added 6 newsletter subscribers across all statuses (PENDING, ACTIVE, UNSUBSCRIBED)

**Files Created**:

- `prisma/seed-data/users.ts` — Admin + 4 test customers
- `prisma/seed-data/categories.ts` — 4 top-level + 11 subcategories
- `prisma/seed-data/products.ts` — 21 products with rich data
- `prisma/seed-data/orders.ts` — 7 orders with items
- `prisma/seed-data/reviews.ts` — 8 reviews
- `prisma/seed-data/subscribers.ts` — 6 newsletter subscribers

**Files Modified**:

- `prisma/seed.ts` — Refactored to orchestrate modular seed data imports

**Commit**: 03364ec

---

## 2026-01 (January)

### [2026-01-05] - Phase 1: Foundation

**Task Reference**: TODO.md TASK-001, TASK-002, TASK-003
**Plan Document**: [docs/archive/plans/2026-01-05_dropshipping-mvp-plan.md](../archive/plans/2026-01-05_dropshipping-mvp-plan.md)

**Implementation**:

#### 1.1 Project Setup (TASK-001)

- Initialized Next.js 16 with TypeScript
- Configured Tailwind CSS v4 + shadcn/ui (17 components)
- Set up Prisma 7 with PostgreSQL adapter
- Configured ESLint, Prettier, Husky with lint-staged
- Created Docker Compose: PostgreSQL (port 5433), Redis (port 6380), Adminer (port 8080)
- Created .env.example with all environment variables

#### 1.2 Database & Auth (TASK-002)

- Created Prisma schema with 15 models
- Ran initial migration
- Implemented NextAuth.js v5 with credentials provider
- Created registration API endpoint with bcrypt hashing
- Implemented login/register pages with React Hook Form + Zod validation
- Added role-based middleware (protected routes: /account, /checkout; admin routes: /admin)
- Created seed script with test accounts:
  - Admin: admin@store.com / admin123
  - Customer: customer@example.com / customer123
- Seeded 4 categories, 5 products, 1 supplier, 4 settings

#### 1.3 Basic UI Shell (TASK-003)

- Created shop layout with Header/Footer wrapper
- Created admin layout with collapsible sidebar
- Created AdminSidebar component with navigation
- Created admin dashboard page with stats cards
- Enhanced mobile navigation with full user menu in drawer
- Created homepage with hero section, features, and CTAs

**Key Decisions**:

- Next.js App Router: Modern patterns, better DX
- Prisma ORM: Type-safe database queries
- Zustand for state: Lightweight, TypeScript-friendly

---

### [2026-01-05] - Phase 2: Product Catalog

**Task Reference**: TODO.md TASK-004, TASK-005

#### 2.1 Admin Product Management (TASK-004)

- Created API utility functions for admin route protection
- Implemented Product CRUD API routes with images
- Built admin product list page with data table, filters, pagination
- Set up S3 image upload with presigned URLs
- Implemented CSV import functionality

#### 2.2 Customer Product Display (TASK-005)

- Created public products API with pagination, search, filters
- Built ProductCard component with discount badges
- Updated homepage with real data
- Created product listing page with search, filters, sorting
- Created product detail page with image gallery, variants, add to cart
- Created categories listing and category pages
- Implemented search dialog with Ctrl+K shortcut

#### 2.3 Category Management

- Created admin category CRUD API
- Implemented circular reference prevention for nested categories
- Built admin category management page
- Added category navigation dropdown to shop Header

**Key Decisions**:

- S3 presigned URLs: Secure, direct browser uploads
- Decimal to string conversion: Prisma Decimal serialization
- Category hierarchy: Self-referencing relation

---

### [2026-01-05] - Phase 3: Shopping Cart & Checkout

**Task Reference**: TODO.md TASK-006, TASK-007

#### 3.1 Shopping Cart (TASK-006)

- Verified cart store with Zustand and persist middleware
- Created cart page with desktop table and mobile card views
- Created cart validation API for stock checking
- Built CartDrawer component with slide-out sheet
- Integrated CartDrawer into shop layout

#### 3.2 Checkout (TASK-007)

- Installed and configured Stripe packages
- Created Stripe server and client configuration
- Built checkout page with multi-step form:
  - Step 1: Contact & Shipping Address
  - Step 2: Shipping method selection
  - Step 3: Stripe Payment Element
- Created PaymentForm component with Stripe Elements
- Created payment intent API with cart validation
- Created order confirmation API with stock decrement
- Built confirmation page
- Created email utility with Resend for order confirmations

**Key Decisions**:

- Multi-step checkout: Better UX, clearer progress
- Stripe Elements: PCI-compliant, handles card details
- Stock validation at checkout: Prevents overselling

---

### [2026-01-05] - Phase 4: Order Management

**Task Reference**: TODO.md TASK-008, TASK-009

#### 4.1 Customer Orders (TASK-008)

- Created customer orders API endpoints
- Created account layout with sidebar navigation
- Built account overview page
- Built order history page with status filter, pagination
- Built order detail page with status timeline

#### 4.2 Admin Orders

- Created admin orders API with search, filters, date range, export
- Built admin orders list page with data table
- Built admin order detail page with status updates, supplier orders section

#### 4.3 Supplier Integration (TASK-009)

- Created supplier CRUD API endpoints
- Built admin supplier management page
- Built admin supplier detail page with connection testing
- Implemented order forwarding queue with BullMQ
- Created supplier service for order forwarding and status sync
- Built background workers for order processing
- Added npm scripts for workers

**Key Decisions**:

- BullMQ for queues: Reliable, Redis-backed job processing
- Order status timeline: Visual progress tracking
- Supplier orders separation: Support for multi-supplier orders

---

### [2026-01-05] - Phase 5.1-5.2: SEO & Testing

**Task Reference**: TODO.md TASK-010, TASK-011

#### 5.1 SEO & Performance (TASK-010)

- Created SEO configuration utility with metadata generators
- Updated root layout with enhanced metadata
- Refactored product detail page for server-side SEO
- Refactored category page for server-side SEO
- Created sitemap.ts for dynamic sitemap generation
- Created robots.ts configuration
- Enhanced next.config.ts for performance:
  - Image optimization with AVIF, WebP
  - Package import optimization
  - Compression enabled
- Added loading states for all major pages

#### 5.2 Testing (TASK-011)

- Installed and configured Vitest for unit testing
- Created 39 unit tests (cart store, SEO utilities)
- Installed and configured Playwright for E2E testing
- Created E2E tests for critical flows (navigation, products, cart)
- Created manual testing checklist (docs/TESTING_CHECKLIST.md)
- Fixed middleware Edge runtime compatibility

### [2026-01-07] - Phase 5.3: Deployment

**Task Reference**: TODO.md TASK-012
**Plan Document**: [docs/archive/plans/2026-01-05_dropshipping-mvp-plan.md](../archive/plans/2026-01-05_dropshipping-mvp-plan.md)

**Implementation**:

#### 5.3 Deployment (TASK-012)

- Created GitHub Actions CI/CD workflows:
  - `.github/workflows/ci.yml` - Lint, type check, unit tests, build, E2E tests
  - `.github/workflows/deploy.yml` - Vercel and VPS deployment options
  - E2E tests with PostgreSQL and Redis service containers
- Set up Sentry error monitoring:
  - Installed `@sentry/nextjs` package
  - Created sentry config files (client, server, edge)
  - Created `instrumentation.ts` for Next.js integration
  - Updated `next.config.ts` with Sentry webpack plugin
- Created health check endpoint (`/api/health`):
  - Database connectivity check with latency
  - Redis connectivity check (optional)
  - Returns status: ok, degraded, or error
- Created PM2 ecosystem configuration:
  - `ecosystem.config.js` with web and workers processes
  - Cluster mode for web, fork mode for workers
- Created Docker production files:
  - `Dockerfile` - Multi-stage build with standalone output
  - `Dockerfile.workers` - Background workers container
  - `docker-compose.prod.yml` - Full production stack
  - `.dockerignore` - Build exclusions
- Updated deployment documentation (docs/deployment/setup.md):
  - Complete setup guide with all deployment options
  - CI/CD pipeline reference
  - Monitoring setup instructions
  - Pre-deployment checklist

**Key Decisions**:

- GitHub Actions for CI/CD: Native integration, free for public repos
- Sentry for monitoring: Industry standard, good Next.js integration
- Docker with standalone output: Smaller images, faster deployments
- PM2 for VPS: Mature process manager, cluster mode support

---

### [2026-01-13] - Phase 5.4: Demo Deployment

**Task Reference**: TODO.md TASK-016
**Plan Document**: [docs/archive/plans/2026-01-05_dropshipping-mvp-plan.md](../archive/plans/2026-01-05_dropshipping-mvp-plan.md)

**Implementation**:

#### 5.4 Demo Deployment (TASK-016)

- Created Neon account and PostgreSQL database (free tier)
- Deployed application to Vercel (free tier)
- Configured environment variables:
  - DATABASE_URL (Neon connection string)
  - NEXTAUTH_SECRET (secure random value)
  - NEXTAUTH_URL (Vercel deployment URL)
  - Stripe test keys
- Fixed authentication issues:
  - Added `runtime = "nodejs"` to auth routes for bcrypt compatibility
  - Fixed db.ts to throw error instead of creating broken client
  - Added NEXTAUTH_SECRET environment validation
  - Created global and auth-specific error boundaries
- Fixed form validation issues:
  - Added forwardRef to Input component for React Hook Form compatibility
  - Added forwardRef to Button component for dropdown trigger compatibility
- Fixed API route static rendering issues:
  - Added `force-dynamic` to cart/validate, categories, orders, products routes
- Verified deployment works:
  - Homepage loads with products
  - Authentication (login/register) functional
  - Cart and checkout operational

**Key Learnings**:

- shadcn/ui components need forwardRef for React Hook Form and Radix compatibility
- API routes using searchParams/headers need `export const dynamic = "force-dynamic"`
- Auth routes need explicit `runtime = "nodejs"` for bcrypt in serverless environments
- Environment variable validation should fail fast, not create broken clients

**Issues Identified for Backlog**:

- Email verification not implemented
- Password reset functionality missing
- OAuth providers (Google, etc.) not configured
- Rate limiting on auth endpoints not implemented
- Session timeout not explicitly configured

---

### [2026-01-22] - TASK-017: SEO Technical Setup

**Plan Document**: [docs/archive/plans/2026-01-22_seo-technical-setup.md](../archive/plans/2026-01-22_seo-technical-setup.md)

**Summary**: Completed SEO technical foundation by adding metadata to all public pages, implementing hreflang tags, wiring up unused metaTitle/metaDesc database fields, and creating missing asset files.

**Key Changes**:

- Extended `src/lib/seo.ts` with 4 new metadata helpers + hreflang support
- Added custom metadata exports to home, products listing, categories listing, login, register pages
- Refactored products listing and auth pages to server component wrappers (for `generateMetadata` support)
- Wired up `metaTitle` and `metaDesc` Product fields in product detail page
- Created placeholder asset files: `og-image.png`, `manifest.json`, `favicon-16x16.png`, `apple-touch-icon.png`

**Files Modified**: 8 | **Files Created**: 7

**Spawned Tasks**: None

---

### [2026-02-01] - TASK-018: Analytics Integration

**Plan Document**: [docs/archive/plans/2026-02-01_analytics-integration.md](../archive/plans/2026-02-01_analytics-integration.md)

**Summary**: Integrated Google Tag Manager with full GA4 e-commerce tracking (9 events) across the storefront, gated behind a GDPR-compliant cookie consent banner with Zustand persistence.

**Key Changes**:

- Created `src/lib/analytics.ts` with GA4 types and 9 event tracking functions
- Created `src/components/common/CookieConsent.tsx` with consent banner and conditional GTM loading
- Created `src/components/analytics/PurchaseTracker.tsx` for server-rendered confirmation page
- Added tracking to product listings, product detail, cart, checkout, and confirmation pages
- GTM ID validated with regex to prevent XSS, pushDataLayer wrapped in try/catch for resilience

**Files Created**: 3 | **Files Modified**: 10

**Spawned Tasks**: 4 items added to BACKLOG.md (multi-currency, additional events, server-side tracking, analytics dashboard)

---

### [2026-02-02] - TASK-019: Social Sharing Enhancement

**Plan Document**: [docs/archive/plans/2026-02-02_task-019-social-sharing.md](../archive/plans/2026-02-02_task-019-social-sharing.md)

**Summary**: Added dynamic OG image generation for product pages and social share buttons (Facebook, X/Twitter, Pinterest, WhatsApp, Telegram, Copy Link, native share) with GA4 share event tracking.

**Key Changes**:

- Created `src/lib/share-utils.ts` with platform-specific share URL builders and Web Share API utilities
- Created `src/components/products/SocialShareButtons.tsx` client component with 5 platforms + copy link + mobile native share
- Created `src/app/(shop)/products/[slug]/opengraph-image.tsx` with branded dark gradient, product image, name, and price
- Added `trackShare()` GA4 event to `src/lib/analytics.ts`
- Removed manual OG images from `seo.ts` (now handled by Next.js file convention)
- Updated 2 SEO tests to match new OG image behavior

**Files Created**: 3 | **Files Modified**: 6

**Spawned Tasks**: 5 items added to BACKLOG.md (category OG images, share count tracking, email sharing, admin OG preview, replace placeholder OG)

---

### [2026-02-02] - TASK-020: Google Shopping Feed Preparation

**Summary**: Created a public Google Shopping XML product feed endpoint with Zod validation, added brand/MPN product identifier fields to the schema, and updated admin forms and CSV import to support the new fields.

**Key Changes**:

- Created `/feed/google-shopping.xml` route generating RSS 2.0 XML with Google Shopping `g:` namespace
- Created `src/lib/validations/google-shopping.ts` with strict Zod schema (price format, GTIN, availability enums)
- Added `brand` and `mpn` fields to Product model with Prisma migration
- Updated admin ProductForm with "Product Identifiers" card (brand, barcode/GTIN, MPN)
- Updated product API routes (create, update) and CSV import to handle new fields
- Added 38 unit tests for feed validation

**Files Created**: 4 | **Files Modified**: 8

**Spawned Tasks**: 5 items added to BACKLOG.md (seed demo data, validate with Merchant Center, additional feed formats, google_product_category mapping, comparePrice validation)

---

### [2026-02-03] - TASK-021: Performance Optimization

**Summary**: Added performance optimization layer with Core Web Vitals tracking, image blur placeholders, resource hints, and deferred font loading.

**Key Changes**:

- Created `src/lib/db-cache.ts` with React.cache() wrappers for request deduplication
- Created `src/lib/image-utils.ts` with blur placeholders (shimmer SVG) and responsive sizes
- Created `src/lib/web-vitals.ts` with Core Web Vitals reporting to GA4 via GTM
- Created `WebVitalsReporter.tsx` client component tracking CLS, LCP, FCP, TTFB, INP
- Created `ResourceHints.tsx` with preconnect/dns-prefetch domain constants
- Added blur placeholders to ProductCard and product detail images
- Optimized theme fonts (Playfair, Lora) with `preload: false` and `display: swap`
- Added resource hints in root layout for Stripe, GTM, Google domains

**Files Created**: 6 | **Files Modified**: 4

**Spawned Tasks**: None (ISR deferred due to force-dynamic requirement for client contexts)

---

### [2026-02-04] - TASK-025: Fix E2E Test Infrastructure

**Summary**: Fixed E2E tests failing in CI due to missing `prisma.seed` configuration in package.json. Also eliminated duplicate build, fixed port mismatch, added pre-test database validation, and fixed categories test selector.

**Key Changes**:

- Added `prisma.seed` config to package.json (root cause — `npx prisma db seed` was a no-op without it)
- Removed duplicate `npm run build` from Playwright webServer command in CI
- Created `tests/global-setup.ts` to validate seed data exists before tests run
- Fixed categories heading selector in navigation.spec.ts (`level: 1` for strict mode)
- Added `PORT: "3000"` to CI env vars to align with NEXTAUTH_URL
- Added stdout/stderr piping to Playwright webServer for debugging

**Files Created**: 1 | **Files Modified**: 4

**Spawned Tasks**: 2 items added to BACKLOG.md (Prisma 7 config migration, E2E test database isolation)

---

### [2026-02-04] - TASK-026: Fix Vercel Deploy in CI

**Plan**: [docs/archive/plans/2026-02-04_task-026-fix-vercel-deploy-ci.md](../archive/plans/2026-02-04_task-026-fix-vercel-deploy-ci.md)

**Summary**: Fixed deploy workflow failing on every push to main by adding secret validation with graceful skip/fail behavior, VERCEL_ORG_ID/VERCEL_PROJECT_ID env vars per Vercel's recommended CI pattern, and improved notify job.

**Key Changes**:

- Added validation step checking 4 required secrets before Vercel deployment
- Graceful skip when secrets missing and DEPLOYMENT_TARGET unset (CI stays green)
- Hard fail with clear error when DEPLOYMENT_TARGET=vercel but secrets missing
- Added VPS secret validation for consistency
- Improved notify job to distinguish real deployment from graceful skip
- Updated deployment documentation with validation behavior and troubleshooting

**Files Modified**: 3 (deploy.yml, setup.md, CLAUDE.md)

**Spawned Tasks**: 3 items added to BACKLOG.md (PR deploy preview, status badge, Slack notifications)

---

## 2026-02 (February) — Continued

### [2026-02-05] - TASK-023: Customer Feedback & Review System

**Summary**: Implemented complete customer review system with verified purchase validation, admin moderation (reply, hide/show, delete), star ratings, and SEO JSON-LD structured data.

**Key Changes**:

- Added Review model to Prisma schema with unique constraint (one review per product per user), cascade deletes
- Created 4 customer API routes: public reviews list, create review (verified purchase), update/delete own, eligibility check
- Created 4 admin API routes: list with filters, get/delete, reply management, visibility toggle
- Built 6 UI components: StarRating, ReviewStats, ReviewForm, ReviewItem, ReviewList, ReviewSection
- Integrated ReviewSection into product detail page with server-side data fetching
- Added `getReviewsJsonLd()` for AggregateRating + Review JSON-LD structured data
- Created admin reviews management page with search, filters, reply dialog, and bulk actions
- Added Reviews link to admin sidebar navigation
- Fixed race condition with P2002 unique constraint error handling
- Added cascade delete on Order→Review relation to prevent orphaned reviews

**Files Created**: 18 | **Files Modified**: 8

**Spawned Tasks**: 6 items added to BACKLOG.md (shared types extraction, API tests, E2E tests, sorting options, DB constraint, seed data)

---

### [2026-02-05] - TASK-024: Email Newsletter Subscription

**Summary**: Implemented complete double opt-in newsletter subscription system with footer signup form, admin management panel, CSV export, and dashboard integration. Code review hardened security with HMAC unsubscribe tokens, XSS prevention, P2002 race handling, and CSV formula injection protection.

**Key Changes**:

- Added Subscriber model to Prisma schema (PENDING/ACTIVE/UNSUBSCRIBED status, confirmation token with 24h expiry)
- Created public API: subscribe (with P2002 race condition handling), confirm (token validation), unsubscribe (HMAC-SHA256 verification)
- Created admin API: paginated list with search/filter, status toggle, delete, CSV export with formula injection prevention
- Built newsletter utilities: crypto-random tokens, HMAC unsubscribe tokens, URL builders, HTML escaping
- Created HTML email template with XSS-safe rendering and optional unsubscribe link
- Built NewsletterSignup client component embedded in server Footer (merged Support+Company into Help column)
- Created confirmation and unsubscribe landing pages with Suspense wrappers
- Built admin newsletter management page with search, status filter, table, dropdown actions, delete dialog, pagination, CSV export
- Added subscriber count card to admin dashboard, Newsletter link to admin sidebar

**Files Created**: 14 | **Files Modified**: 6

**Spawned Tasks**: Items added to BACKLOG.md (email marketing platform docs, unit/E2E tests, bulk actions, subscriber analytics)

---

## Statistics

| Month   | Tasks Completed | Key Deliverables                                                                                                                                                                                                               |
| ------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-01 | 17              | Full MVP + Demo Deployed + SEO Technical Setup                                                                                                                                                                                 |
| 2026-02 | 13              | GA4 Analytics, Social Sharing, Google Shopping Feed, Performance, E2E Fix, Deploy Fix, Customer Reviews, Newsletter, Dependency Audit, Test Coverage, Technical Debt Cleanup, Documentation, Code Quality, Freeze Finalization |

---

## Notes

- **MVP implementation is COMPLETE** (All phases 1-5.4 finished)
- Demo site deployed to Vercel with Neon PostgreSQL
- Comprehensive execution log available in MVP plan document
- Test accounts available for development/testing:
  - Admin: admin@store.com / admin123
  - Customer: customer@example.com / customer123
