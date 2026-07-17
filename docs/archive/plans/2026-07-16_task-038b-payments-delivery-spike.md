# Ukraine Payments & Delivery Research Spike — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the launch-gating decision document that settles Mirox Shop's Ukraine payment gateway, Nova Poshta delivery integration, and UAH currency strategy — feeding TASK-048 (gateway) and TASK-049 (Nova Poshta).

**Architecture:** This is a research spike, not a code change. Execution runs an Ultracode research fan-out workflow (one agent per gateway + Nova Poshta + COD/legal rail + currency), pipes each topic through an adversarial-verification stage, then a human-in-the-loop authoring pass writes the decision document section by section from the verified findings. The single committed deliverable is `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md`. No `src/` files change.

**Tech Stack:** Markdown deliverable; Workflow tool (Ultracode) for the research fan-out; WebSearch/WebFetch + context7 for primary-source retrieval; scratchpad for intermediate findings.

**Spec:** [2026-07-16-ukraine-payments-delivery-design.md](../../superpowers/specs/2026-07-16-ukraine-payments-delivery-design.md)

## Global Constraints

_Every task's requirements implicitly include this section. Values copied verbatim from the spec._

- **No product code.** This task touches no `src/` files, runs no PoC API calls, and opens no merchant accounts. The only committed outputs are the decision doc and the completion doc-updates.
- **Citation rule.** Every quantitative claim (fee, limit, timing, capability) carries a primary-source URL and a **"verified 2026-07-16"** stamp. Facts not publicly verifiable (negotiated fees, exact onboarding SLAs) are marked **"requires merchant confirmation / sales quote"** — **never guessed**.
- **Gateway candidate set (exactly five):** LiqPay, WayForPay, Fondy, monobank acquiring / Plata by mono, Portmone.
- **Conditional recommendation.** The recommendation is a decision tree keyed on legal entity (ФОП vs ТОВ) + bank, plus a prerequisites checklist for the client to confirm — not a single unconditional pick.
- **Two payment rails, both in scope:** online card gateway **and** Nova Poshta COD (накладений платіж), including how COD cash is remitted and reconciled to the merchant.
- **Nova Poshta modes:** branch (відділення) + postomat (locker) + courier (адресна); branch/postomat prioritized. Cover cost calc and the branch/postomat picker.
- **Currency:** single UAH — display, storage, charges. The `Order.currency` default `USD`→`UAH` migration is **documented in the blueprint, not executed** in this task.
- **Ultracode Workflow is billed** and requires the user's explicit go-ahead before running (Task 2 is gated).
- **Blueprint honors the program rule:** one schema migration per PR; no two schema-changing PRs in flight simultaneously.

---

## File Structure

**Committed (in git):**

- Create: `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` — the single deliverable (9 sections + Sources appendix).
- Modify at completion: `docs/planning/TODO.md`, `docs/planning/DONE.md`, `docs/planning/WEEKLY.md`, `docs/README.md` (index the new doc).

**Not committed (scratchpad — `/tmp/claude-0/-workspaces-dropshipping/c6ceb29f-71c8-4c62-8c93-88fddf097e9f/scratchpad/`):**

- `findings-<topic>.json` — one structured, verified findings object per research topic. Raw research artifacts; the decision doc carries the cited conclusions, so these stay out of git.
- The Workflow journal (`journal.jsonl`) holds each agent's raw return for audit.

**Structured findings schema** (every research agent returns this shape; used in Task 2):

```json
{
  "topic": "gateway:liqpay | gateway:wayforpay | gateway:fondy | gateway:plata-mono | gateway:portmone | nova-poshta | cod-legal | currency",
  "claims": [
    {
      "field": "card_fee_percent",
      "value": "e.g. 2.75% + 0 UAH",
      "sourceUrl": "https://primary-source",
      "verifiedDate": "2026-07-16",
      "confidence": "high | medium | low",
      "needsMerchantConfirmation": false,
      "notes": ""
    }
  ],
  "openQuestions": ["strings"]
}
```

**Adversarial-verify return** (per claim, Task 2 verify stage):

```json
{
  "field": "card_fee_percent",
  "verdict": "CONFIRMED | DISPUTED | UNVERIFIABLE",
  "agrees": true,
  "correctedValue": "only if DISPUTED",
  "sourceUrl": "https://primary-source-checked",
  "note": ""
}
```

**Gateway matrix columns** (the 15 fields each gateway agent researches; become the columns of decision-doc §4):

1. Card fee (% + fixed) 2. Settlement currency + payout period 3. Eligibility — ФОП 4. Eligibility — ТОВ 5. Onboarding time + required docs 6. API quality / docs language 7. Webhooks (events, reliability) 8. Refunds (full/partial) 9. Apple Pay / Google Pay 10. Installments (оплата частинами) 11. Recurring 12. Sandbox / test mode 13. Payout hold / reserve terms 14. PCI scope (hosted redirect vs direct API) 15. Support (channels, language). Plus **current ownership/status** (verify consolidation claims).

---

## Task 1: Decision-doc skeleton

**Files:**

- Create: `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md`

**Interfaces:**

- Produces: the 9 section headers + Sources appendix that Tasks 3–7 fill. Header text must match exactly so later tasks anchor to it.

- [ ] **Step 1: Create the skeleton file**

Write the file with this exact structure (headers only + a status banner; no findings yet):

```markdown
# Mirox Shop — Ukraine Payments & Delivery Decision

**Status:** Draft — research in progress
**Verified as of:** 2026-07-16
**Spec:** ./2026-07-16-ukraine-payments-delivery-design.md
**Feeds:** TASK-048 (gateway integration), TASK-049 (Nova Poshta integration)

> Every quantitative claim below cites a primary source with a "verified 2026-07-16" stamp. Claims that cannot be verified from public sources are tagged **[requires merchant confirmation]**.

## 1. Executive summary & recommendation

## 2. Context & constraints

## 3. Two-rail payment model (online prepayment + Nova Poshta COD)

## 4. Gateway comparison matrix

## 5. Conditional recommendation & prerequisites checklist

## 6. Nova Poshta scoping

## 7. UAH currency strategy

## 8. Integration blueprint (seeds TASK-048/049)

## 9. Risks, open questions & decision log

## Acceptance-criteria coverage

| Criterion                                               | Section |
| ------------------------------------------------------- | ------- |
| Comparison matrix of ≥3 gateways with fees & API        | §4      |
| Recommended gateway + rationale; merchant prerequisites | §1, §5  |
| Nova Poshta scoped (API, branch picker, cost calc)      | §6      |
| UAH pricing strategy (single vs multi)                  | §7      |

## Sources

_Primary-source URLs, grouped by topic; populated as sections are written._
```

- [ ] **Step 2: Verify the skeleton has all 9 sections**

Run: `grep -c '^## [1-9]\.' docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md`
Expected: `9`

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md
git commit -m "docs: Add Ukraine payments/delivery decision-doc skeleton"
```

---

## Task 2: Research fan-out + adversarial verification (Ultracode Workflow) — ⛔ GATED

**⛔ STOP: This task runs a billed Ultracode Workflow. Get the user's explicit go-ahead before invoking it.**

**Files:**

- Create (scratchpad, not git): `findings-<topic>.json` × 8 topics.

**Interfaces:**

- Consumes: the structured findings schema and matrix columns from the File Structure section.
- Produces: 8 verified findings objects (5 gateways + `nova-poshta` + `cod-legal` + `currency`) that Tasks 3–7 draw from. Each claim carries a verdict (`CONFIRMED`/`DISPUTED`/`UNVERIFIABLE`) from the verify stage.

- [ ] **Step 1: Confirm go-ahead**

Ask the user: "Ready to run the billed research workflow now?" Proceed only on yes.

- [ ] **Step 2: Run the research workflow**

Invoke the Workflow tool with a script of this shape (fan-out → adversarial-verify pipeline, per the Workflow tool's canonical pattern):

```javascript
export const meta = {
  name: "ua-payments-research",
  description: "Research + adversarially verify UA gateways, Nova Poshta, COD/legal, currency",
  phases: [{ title: "Research" }, { title: "Verify" }],
};

const FINDINGS_SCHEMA = {
  /* structured findings schema from the plan's File Structure */
};
const VERDICT_SCHEMA = {
  /* adversarial-verify return from the plan's File Structure */
};

const GATEWAY_FIELDS = [
  "card_fee_percent_and_fixed",
  "settlement_currency_and_payout_period",
  "eligibility_fop",
  "eligibility_tov",
  "onboarding_time_and_docs",
  "api_quality_and_docs_language",
  "webhooks",
  "refunds_full_partial",
  "apple_google_pay",
  "installments_oplata_chastynamy",
  "recurring",
  "sandbox_test_mode",
  "payout_hold_reserve",
  "pci_scope",
  "support",
  "current_ownership_status",
];

const TOPICS = [
  ...["LiqPay", "WayForPay", "Fondy", "Plata by mono (monobank acquiring)", "Portmone"].map(
    (g) => ({
      key: `gateway:${g}`,
      prompt: `Research the Ukrainian payment gateway "${g}" for a men's-clothing e-commerce launch. For EACH field, give the current value with a PRIMARY-SOURCE URL (official pricing/API/docs pages) and today's date 2026-07-16. If a value is not public (negotiated fee, exact onboarding SLA), set needsMerchantConfirmation=true instead of guessing. Fields: ${GATEWAY_FIELDS.join(", ")}. Prefer official docs; note doc language (UA/EN).`,
    })
  ),
  {
    key: "nova-poshta",
    prompt: `Scope the Nova Poshta API for checkout: auth (API key), address model (getCities/getSettlements, getWarehouses incl. postomat filtering), cost calc (getDocumentPrice params), tracking (getStatusDocuments), the three delivery modes (WarehouseWarehouse branch, postomat, WarehouseDoors/DoorsWarehouse courier), and cash-on-delivery (backwardDeliveryData / накладений платіж): how it's declared, its fee, remittance timing, and reconciliation (webhook vs polling). Cite official developers.novaposhta.ua docs, verified 2026-07-16.`,
  },
  {
    key: "cod-legal",
    prompt: `Research the Nova Poshta COD money-flow (NP collects cash/card at pickup → remits to merchant bank: fees, timing, reconciliation) AND the mapping from Ukrainian legal entity (ФОП tax groups vs ТОВ) to payment-gateway eligibility and settlement. Flag РРО/ПРРО (cash-register / ПРРО) obligations as "confirm with accountant" — do not assert as legal advice. Cite primary sources, verified 2026-07-16.`,
  },
  {
    key: "currency",
    prompt: `Confirm single-UAH strategy: do the 5 candidate gateways settle in UAH? UAH formatting (₴, separators, kopiykas), rounding, VAT/ПДВ display for ФОП vs ТОВ, and considerations for migrating Order.currency default USD→UAH (Decimal(10,2) adequacy, existing-order handling). Cite primary sources, verified 2026-07-16.`,
  },
];

const results = await pipeline(
  TOPICS,
  (t) =>
    agent(t.prompt, { label: `research:${t.key}`, phase: "Research", schema: FINDINGS_SCHEMA }),
  (findings, t) =>
    parallel(
      (findings?.claims ?? []).map(
        (c) => () =>
          agent(
            `Adversarially verify this claim about ${t.key}. Try to REFUTE it against the PRIMARY source. Claim: ${c.field} = "${c.value}" (source: ${c.sourceUrl}). Return CONFIRMED only if the primary source clearly supports it; DISPUTED with correctedValue if wrong; UNVERIFIABLE if no primary source settles it.`,
            { label: `verify:${t.key}:${c.field}`, phase: "Verify", schema: VERDICT_SCHEMA }
          ).then((v) => ({ ...c, verify: v }))
      )
    ).then((verified) => ({
      topic: t.key,
      claims: verified.filter(Boolean),
      openQuestions: findings?.openQuestions ?? [],
    }))
);

return results.filter(Boolean);
```

- [ ] **Step 3: Persist verified findings to scratchpad**

Write each returned topic object to `scratchpad/findings-<topic>.json`. These are the inputs for Tasks 3–7.

- [ ] **Step 4: Verify the research is usable**

Confirm: (a) all 8 topics returned; (b) each gateway topic covers all 16 fields; (c) every claim has a verdict; (d) DISPUTED claims use the corrected value or are dropped; (e) UNVERIFIABLE fee/eligibility claims are tagged `[requires merchant confirmation]`. If a topic is missing or thin, re-run that single agent before proceeding. (No commit — artifacts stay in scratchpad.)

---

## Task 3: Two-rail model + gateway matrix (decision-doc §3, §4)

**Files:**

- Modify: `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` (§3, §4)

**Interfaces:**

- Consumes: `findings-gateway:*.json`, `findings-cod-legal.json` (COD remittance) from Task 2.

- [ ] **Step 1: Write §3 (two-rail model)**

Describe online prepayment vs Nova Poshta COD side by side: where each sits in checkout, and — from `findings-cod-legal` — how COD cash collected by NP is remitted and reconciled to the merchant (fee, timing, reconciliation mechanism). Cite each factual claim.

- [ ] **Step 2: Write §4 (gateway matrix)**

Build a Markdown table: one row per gateway (all five), one column per matrix field (the 15 + ownership). Fill each cell from the verified findings; every quantitative cell ends with a source link + "verified 2026-07-16", or `[requires merchant confirmation]`. Append each source URL to the Sources appendix.

- [ ] **Step 3: Verify coverage**

Run: `grep -c '| \*\*LiqPay\|WayForPay\|Fondy\|Plata\|Portmone' docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` (sanity: 5 gateway rows present).
Manually confirm: no empty cells; every fee/eligibility cell is cited or tagged `[requires merchant confirmation]`.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md
git commit -m "docs: Add two-rail model + gateway comparison matrix"
```

---

## Task 4: Conditional recommendation + prerequisites (decision-doc §1, §5)

**Files:**

- Modify: `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` (§1, §5)

**Interfaces:**

- Consumes: the §4 matrix + `findings-cod-legal.json` (eligibility mapping).

- [ ] **Step 1: Write §5 (decision tree + prerequisites)**

Author the decision tree with **at least two branches** keyed on legal entity + bank (e.g. _ФОП + existing monobank → Plata by mono; ТОВ or fast-onboarding need → WayForPay/Fondy; PrivatBank customer → LiqPay_), each branch justified from the matrix. Then a **prerequisites checklist** — the exact facts the client must confirm: legal form, tax group, current bank, expected monthly volume/AOV, whether installments are wanted, РРО/ПРРО status.

- [ ] **Step 2: Write §1 (executive summary)**

One-paragraph summary + the decision tree restated at the top so a reader gets the answer first.

- [ ] **Step 3: Verify**

Confirm §5 contains ≥2 conditional branches and a prerequisites checklist with ≥5 items. Confirm §1 restates the recommendation. (Satisfies acceptance criterion 2.)

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md
git commit -m "docs: Add conditional gateway recommendation + prerequisites"
```

---

## Task 5: Nova Poshta scoping (decision-doc §6)

**Files:**

- Modify: `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` (§6)

**Interfaces:**

- Consumes: `findings-nova-poshta.json`, `findings-cod-legal.json`.

- [ ] **Step 1: Write §6**

Cover, each cited to official NP docs: API auth (API key) + base endpoint; address model (cities/settlements → warehouses, postomat filtering); cost calc (`getDocumentPrice` params); tracking; the **three delivery modes** (branch, postomat, courier); the **COD money-flow + reconciliation** (`backwardDeliveryData`, fee, remittance timing); and the **branch/postomat picker UX** at checkout (city autocomplete → warehouse list). Append NP source URLs to Sources.

- [ ] **Step 2: Verify**

Confirm §6 explicitly addresses: all 3 delivery modes, cost calc, the picker, and COD reconciliation. (Satisfies acceptance criterion 3.)

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md
git commit -m "docs: Add Nova Poshta API + COD scoping"
```

---

## Task 6: UAH strategy + integration blueprint (decision-doc §2, §7, §8)

**Files:**

- Modify: `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` (§2, §7, §8)

**Interfaces:**

- Consumes: `findings-currency.json`, §4 matrix (chosen-gateway API surface), §6 (NP endpoints).

- [ ] **Step 1: Write §2 (context & constraints)**

UA-only, legal entity unknown, language law (UA default), single UAH, existing Stripe wiring being replaced. Reference the current code facts: `src/lib/stripe.ts` (Stripe payment intents), `Order.currency` default `"USD"`, hardcoded USD `SHIPPING_METHODS`.

- [ ] **Step 2: Write §7 (UAH currency strategy)**

Single-UAH rationale; the `Order.currency` default `USD`→`UAH` migration (documented, not executed); price formatting/rounding (hand-off to TASK-039 i18n); VAT/ПДВ display note for ФОП vs ТОВ. Cite currency findings. (Satisfies acceptance criterion 4.)

- [ ] **Step 3: Write §8 (integration blueprint)**

For the recommended-gateway path: charge / webhook events / refund endpoints; COD reconciliation flow; NP endpoints + checkout UX changes; **Prisma/schema deltas** (new `Order.paymentMethod` values for COD/online, delivery-mode + NP-ref fields, currency default); env vars; feature-flag + test-mode plan; and the **sequencing note** honoring "one schema migration per PR / no two schema-changing PRs in flight." Make it concrete enough that TASK-048/049 can be planned without re-discovery.

- [ ] **Step 4: Verify**

Confirm §8 contains all enumerated subsections (gateway API surface, COD flow, NP endpoints, schema deltas, env vars, feature flag/test mode, sequencing). Confirm §7 states single-UAH + migration.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md
git commit -m "docs: Add UAH strategy + TASK-048/049 integration blueprint"
```

---

## Task 7: Risks, decision log, citation audit (decision-doc §9 + appendix)

**Files:**

- Modify: `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` (§9, Sources, status banner)

- [ ] **Step 1: Write §9**

Risks (opaque negotiated fees, market consolidation, legal-entity dependency, COD reconciliation complexity, currency migration touching live data), open questions, and a decision log capturing the six brainstorming decisions.

- [ ] **Step 2: Citation audit**

Read the whole doc. For every quantitative claim, confirm it has either a primary-source link + "verified 2026-07-16" or a `[requires merchant confirmation]` tag. Fix any bare claim. Confirm every cited URL also appears in the Sources appendix.

- [ ] **Step 3: Flip the status banner**

Change `**Status:** Draft — research in progress` → `**Status:** Complete`.

- [ ] **Step 4: Verify acceptance-criteria coverage table**

Confirm the four rows in the coverage table each point at a now-written section. All four task acceptance criteria satisfied.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md
git commit -m "docs: Add risks, decision log; complete citation audit"
```

---

## Task 8: Completion & handoff

**⛔ Do this only after the user has approved the decision doc.**

**Files:**

- Modify: `docs/planning/TODO.md`, `docs/planning/DONE.md`, `docs/planning/WEEKLY.md`, `docs/README.md`

- [ ] **Step 1: Transition planning docs**

Move TASK-038b out of TODO.md "Planned"; add a DONE.md entry (plan link, decision-doc link, summary, key decisions); check off TASK-038b in WEEKLY.md (Summary-Table Status → `✅ PR #N` and its Daily-Schedule entry).

- [ ] **Step 2: Index the new docs**

Add the decision doc (and this plan + spec if not already indexed) to `docs/README.md`.

- [ ] **Step 3: Extract backlog/TODO follow-ups**

Per CLAUDE.md task-completion: route ≥2 improvements to BACKLOG.md (🟤 Auto-Generated — e.g. "confirm merchant legal entity", "obtain gateway sales quotes"), and any actionable items to TODO.md. Confirm TASK-048/049 references this decision doc.

- [ ] **Step 4: Commit**

```bash
git add docs/planning/TODO.md docs/planning/DONE.md docs/planning/WEEKLY.md docs/README.md
git commit -m "docs: Complete TASK-038b — transition planning docs"
```

- [ ] **Step 5: Offer PR**

Offer to push the branch and open a PR (`feat/task-038b-payments-delivery-research` → `main`).

---

## Self-Review

**Spec coverage** — every spec section maps to a task:

| Spec section                                  | Task                                          |
| --------------------------------------------- | --------------------------------------------- |
| §2 decisions (6)                              | Global Constraints + §9 decision log (Task 7) |
| §3 scope boundaries                           | Global Constraints                            |
| §4 gateway candidates (5)                     | Task 2 fan-out, Task 3 matrix                 |
| §5 methodology (fan-out + adversarial verify) | Task 2                                        |
| §6 decision-doc structure (9 sections)        | Task 1 skeleton; Tasks 3–7 fill               |
| §7 acceptance-criteria mapping                | Task 1 coverage table; verified in Tasks 3–7  |
| §8 definition of done                         | Task 7 (audit) + Task 8                       |
| §9 risks                                      | Task 7 §9                                     |

**Placeholder scan:** The plan specifies research _method, schema, and structure_ concretely; it deliberately does not pre-fill fee/eligibility values, because producing those verified values is the spike's purpose (Task 2). This is not a placeholder gap — fabricating figures would violate the citation rule.

**Type consistency:** The findings schema, verdict schema, `GATEWAY_FIELDS`, and matrix columns are defined once in File Structure and referenced by Task 2 and Task 3. Decision-doc section numbers (§1–§9) are consistent between the Task 1 skeleton, Tasks 3–7, and the coverage table.
