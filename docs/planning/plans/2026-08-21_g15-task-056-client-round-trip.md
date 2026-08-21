# G15 — TASK-056 Client Round-Trip (part 1: consolidated ask draft)

**Last Updated**: 2026-08-21
**Task**: TASK-056 (Client content inventory) · WEEKLY [G15](../WEEKLY.md#g15-task-056-client-round-trip-solo)
**Branch**: `feat/g15-task-056-client-round-trip`
**Status**: IN PROGRESS — part 1 (Fri Aug 21 draft, user-approved head start); part 2 (hand-off + send-date recording) runs Mon Aug 25

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

1. `docs/reference/2026-08-21-client-ask.md` — the client-facing UA ask, 20 numbered items in 6
   thematic blocks (домен і пошта / контакти і оплата / фото і бренд / тексти сторінок / маркетинг /
   російська версія), with 🔴 markers on the launch-blocking items (1, 2, 8, 9, 14) and a
   how-to-respond + priority-order framing. Internal preamble marks what is deliberately excluded.
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
