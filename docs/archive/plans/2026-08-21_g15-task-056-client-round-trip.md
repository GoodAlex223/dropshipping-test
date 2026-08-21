# G15 — TASK-056 Client Round-Trip (part 1: consolidated ask draft)

**Last Updated**: 2026-08-21
**Task**: TASK-056 (Client content inventory) · WEEKLY [G15](../../planning/WEEKLY.md#g15-task-056-client-round-trip-solo)
**Branch**: `feat/g15-task-056-client-round-trip`
**Status**: COMPLETE 2026-08-21 — both parts landed Friday: the ask drafted, reviewed twice (user edits + the branded-goods advisory), and **sent by the user the same day**, four days ahead of the Monday plan; per-item tracking live on TODO TASK-056 (21 rows, all 📨)

---

## Scope

Draft the consolidated client-facing ask document (Ukrainian, messenger-copy-paste format) from the
TASK-056 checklist + riders, and scaffold per-item response tracking on TODO.md TASK-056. Bounded
task — design approved in-chat 2026-08-21 (brainstorming, bounded path); no spec.

**User rulings (2026-08-21, this session)**:

1. **Delivery format: messenger copy-paste.** UA markdown in the repo, structured so each section
   pastes cleanly into Telegram/Viber/email — numbered items, no tables/markdown links in the
   client text, no internal repo paths (those live only in the internal tracking table).
2. **§5.3 payments questionnaire stays OUT.** The decision doc §5.3 client prerequisites
   (ФОП/РРО/ПРРО, gateway inputs) are not in the ask — payments (TASK-048) remain client-initiated
   per the standing steer. Legal-page copy (which also gates §5.3) is in the ask regardless.

**Out of scope**: the 3 real products' intake (G16 — the ask only acknowledges receipt and requests
their gaps: back-view photos, size charts, GTIN/brand data); any implementation against responses
(processed as interrupts per WEEKLY § Parallel Work).

## Deliverables

1. `docs/reference/2026-08-21-client-ask.md` — the client-facing UA ask, 21 numbered items in 7
   thematic blocks (домен і пошта / контакти і оплата / фото і бренд / брендові товари / тексти
   сторінок / маркетинг / російська версія), with 🔴 markers on the launch-blocking items
   (1, 2, 9 after review round 1; 8 and the legal item were demoted by user ruling) and a
   how-to-respond + priority-order framing. Internal preamble marks what is deliberately excluded
   and what review round 1 added.
2. TODO.md TASK-056 — response-tracking table (20 rows keyed to the ask's item numbers, with the
   internal code/env touchpoint per row), status legend, send-date placeholder; Status line updated.
3. Convention plumbing — this plan; docs/README.md rows for the ask doc + this plan; date bumps.

## Verification

- `npm run test:run -- docs-freshness` green (index rows, dates, link resolution, prettier
  idempotence)
- `npx prettier --check` on touched markdown
- Coverage cross-check: every WEEKLY G15 item-1 element and every TASK-056 AC + rider appears in
  the ask (mapping recorded in the tracking table)

## Progress Log

- **2026-08-21** — Branch created; brainstorming (bounded path): context from WEEKLY G15, TODO
  TASK-056 (+G8/G9 riders), messages/README.md RU nuance list, BACKLOG [2026-08-11] Ukrposhta
  entry, `brand.ts`/`site.ts`/`checkout.ts` CLIENT-SUPPLIED markers. Two user rulings recorded
  above; design approved in chat. Drafting the ask document.
- **2026-08-21** — All three deliverables written: the 20-item UA ask
  (`docs/reference/2026-08-21-client-ask.md`), the TODO.md TASK-056 tracking table (20 rows,
  send-date placeholder, status line updated), WEEKLY G15 item 1 ticked, docs/README.md rows +
  date bumps. Coverage cross-check done: all 14 WEEKLY item-1 elements and all TASK-056 ACs +
  G8/G9 riders map to ask items (see the tracking table's touchpoint column). Verification next.
- **2026-08-21** — Committed `9ff1fd7` (docs-freshness 100/100 green). User review round: user
  edited items 5/7/8/14 in place (softeners: prepay + NP key «не обов'язкові», hero «можемо
  залишити і так», legal «можемо накидати за допомогою ШІ») and challenged item 9's back-view
  claim. **Verified against the actual delivery** (`docs/real_products/`, 25 photos + 3 TG
  descriptions, all reviewed): photo coverage is far better than the planning record assumed —
  item 9 corrected (back views missing only for the black zip-hoodie and all half-zip colors; the
  backpack set is complete). **Major find: all 3 products are third-party branded — Palm Angels /
  Polo Ralph Lauren / Lacoste, likely replicas** (prices 4–10× under retail, replica-seller copy);
  recorded in memory ([[real-products-are-third-party-branded]]), surfaced to the user — affects
  the Google Shopping feed, brand fields, and G16 intake; ask item 13 is moot for these three.
  Bonus: descriptions reveal real TG touchpoints (t.me/mirox_vidgyk, @mirox_manager) → item 15.
- **2026-08-21, review round 1 rulings (user)** — (1) the branded-goods advisory goes **into the
  written ask** (supersedes the raise-it-verbally recommendation): new Блок 4 ⚠️ item 14 tells the
  client these products won't enter the Google feed, flags the seller-side legal/gateway risk, and
  asks the positioning questions (brand-in-card vs neutral, оригінал/репліка labeling, Mirox Shop
  as a multibrand store — the user confirmed the Mirox clothing brand does not exist yet); items
  14→15…20→21 renumbered, tracking table matched. (2) 🔴 removed from hero (8) and legal (now 15)
  per user — remaining blockers 1, 2, 9. (3) Main TG channel **confirmed t.me/mirox_shop** (the
  placeholder was already correct); t.me/mirox_vidgyk is the reviews channel — item 16 updated,
  display question added. (4) `docs/real_products/` gitignored (4.1 MB source photos, headed for
  S3 at G16 intake).
- **2026-08-21, close-out** — round-1 changes committed `b84c474`. **The user sent the ask the
  same day** (via messenger, ahead of the Mon 2026-08-25 plan) → send date + 📨 statuses recorded
  on the TODO TASK-056 tracking table; WEEKLY G15 items both ticked. Extractions → BACKLOG
  `[2026-08-21]` group: feed branded-goods exclusion mechanism (pre-G16) + client-answer-gated
  multibrand copy sweep. Plan archived. Group closes at merge; responses from here are interrupts.
