# TASK-038b — Ukraine Payments & Delivery Research Spike — Design

**Date**: 2026-07-16
**Status**: Approved by user (brainstorming session)
**Task**: [TASK-038b] Payments & delivery research spike (Ukraine) — v1.3 "Mirox Rebrand Demo", Track B
**Program spec**: [Mirox Shop Program Design](./2026-07-14-mirox-shop-program-design.md)
**Type**: Research spike — **decision doc, no product code**

---

## 1. Purpose

TASK-038b de-risks the v1.4 payment/delivery integration (TASK-048 gateway, TASK-049 Nova Poshta) by settling three questions **before** any code is written:

1. Which payment gateway does Mirox Shop use, given Stripe does not onboard Ukrainian merchants?
2. How does Nova Poshta delivery — including cash/card-on-delivery — integrate at checkout?
3. What is the UAH currency strategy?

This document is the **spec for the spike**: it defines the spike's scope, research methodology, and the exact structure of the decision document the spike produces. It is not itself the decision document.

### Two documents — do not conflate

| Document                           | Path                                                                      | When written                     | Consumed by                         |
| ---------------------------------- | ------------------------------------------------------------------------- | -------------------------------- | ----------------------------------- |
| **Spec** (this file)               | `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-design.md`   | Now (brainstorming)              | Implementation plan (writing-plans) |
| **Decision doc** (the deliverable) | `docs/superpowers/specs/2026-07-16-ukraine-payments-delivery-decision.md` | During execution, after the plan | TASK-048, TASK-049 planning         |

The spec commits us to producing the decision doc; the decision doc is **not** written during brainstorming.

---

## 2. Decisions made during brainstorming

| Question                     | Decision                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment method scope         | Online card gateway **and** Nova Poshta COD (накладений платіж) — two rails, both in scope                                                   |
| Merchant legal/banking facts | Unknown → **conditional** recommendation (decision tree by legal entity + bank) with a prerequisites checklist for the client to confirm     |
| Nova Poshta delivery modes   | Branch (відділення) + postomat (locker) + courier (адресна) — all three scoped; branch/postomat prioritized for launch                       |
| Online-card features scored  | Card acquiring + Apple/Google Pay + installments (оплата частинами)                                                                          |
| Currency strategy            | **Single UAH** — display, storage, and charges in UAH; includes `Order.currency` default `USD`→`UAH` migration                               |
| Research rigor               | Ultracode research fan-out + **adversarial verification**; every fee/capability cited to a primary source with a "verified 2026-07-16" stamp |
| Deliverable depth            | Decision **plus integration blueprint** seeding TASK-048/049 (not a decision-only memo)                                                      |

---

## 3. Scope boundaries

**In scope**

- Evaluate UA-native payment gateways on fees, eligibility, API, refunds, webhooks, wallets, installments.
- Model the **two payment rails**: online prepayment (gateway) and Nova Poshta COD, including how COD cash collected by NP is remitted and reconciled back to the merchant.
- Scope the Nova Poshta API for all three delivery modes plus cost calculation and the branch/postomat picker.
- Define the single-UAH strategy, including the schema migration and the hand-off to TASK-039 (i18n / price formatting).
- Produce an integration blueprint concrete enough to seed TASK-048 and TASK-049 planning without re-discovery.

**Out of scope**

- Any product code or proof-of-concept API calls (belongs in TASK-048/049).
- Opening merchant accounts or committing to a gateway contract — the client's decision.
- Binding legal/tax advice — legal-entity and tax-group implications are flagged "confirm with accountant," not asserted as fact.

---

## 4. Gateway candidate set

The task named four; the spike evaluates **five** to keep the matrix credible and avoid a 4-way that maps one bank to each candidate. Verifying current ownership/mergers is an explicit job of the adversarial pass — this market has consolidated (Fondy/WayForPay lineage; "monobank acquiring" is marketed as _Plata by mono_).

1. **LiqPay** (PrivatBank)
2. **WayForPay**
3. **Fondy**
4. **monobank acquiring / Plata by mono**
5. **Portmone**

---

## 5. Research methodology & rigor

- **Fan-out**: one research agent per gateway, plus one for Nova Poshta, one for the COD / legal-entity rail, and one for currency + i18n interplay. Each returns a **structured, cited findings object**.
- **Adversarial verify**: a second agent re-checks every fee, eligibility, and capability claim against the **primary source** (official pricing and API docs), flagging conflicts rather than averaging them.
- **Citations**: every quantitative claim carries a primary-source URL and a **"verified 2026-07-16"** stamp. Facts not publicly verifiable (negotiated fees, exact onboarding SLAs) are marked **"requires merchant confirmation / sales quote"** — never guessed.
- **Execution gate**: running the Ultracode Workflow is billed and requires the user's explicit go-ahead at execution time. This spec and the plan define the workflow; they do not auto-run it.

---

## 6. Decision-doc structure (the deliverable's outline)

The decision document will contain these sections:

1. **Executive summary + recommendation** — the conditional decision tree up top (e.g. _ФОП + existing monobank → Plata by mono; ТОВ / needs fast onboarding → WayForPay/Fondy; PrivatBank customer → LiqPay_), stated as "if X then Y," with the single prerequisites checklist.
2. **Context & constraints** — UA-only, legal entity unknown, language law (UA default), single UAH, existing Stripe wiring being replaced.
3. **Two-rail payment model** — online prepayment vs Nova Poshta COD side by side; where each sits in checkout; how COD cash is remitted and reconciled.
4. **Gateway comparison matrix** — one row per candidate; columns: % + fixed fee, settlement currency/period, **eligibility by entity type (ФОП vs ТОВ)**, onboarding time/docs, API quality, webhooks, refunds (full/partial), Apple/Google Pay, installments (оплата частинами), recurring, sandbox/test mode, payout hold terms, PCI scope, support. Every cell cited.
5. **Conditional recommendation + prerequisites checklist** — decision tree expanded with rationale; exact client facts to confirm (legal form, tax group, current bank, expected volume/AOV, need for installments).
6. **Nova Poshta scoping** — API auth (API key), address model (cities → warehouses/postomats), cost calc (`getDocumentPrice`), tracking; the three delivery modes; the COD money-flow + reconciliation; branch/postomat picker UX at checkout.
7. **UAH currency strategy** — single-UAH rationale; `Order.currency` default `USD`→`UAH` migration; price display/formatting hand-off to TASK-039 (i18n); rounding; VAT/tax display note.
8. **Integration blueprint (seeds TASK-048/049)** — chosen-gateway API surface (charge / webhook events / refund endpoints), COD reconciliation flow, NP endpoints + checkout UX changes, Prisma/schema deltas (new `Order.paymentMethod` values, delivery fields, NP refs), env vars, feature-flag + test-mode plan, and the sequencing note honoring the program's "one schema migration per PR / no two schema-changing PRs in flight" rule.
9. **Risks, open questions, decision log.**

---

## 7. Acceptance-criteria mapping

| Task acceptance criterion                                                 | Satisfied by                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------- |
| Comparison matrix of ≥3 gateways with fees and API capabilities           | §4 candidate set → decision-doc §4 (5 candidates) |
| Recommended gateway with rationale; merchant-account prerequisites listed | decision-doc §1, §5                               |
| Nova Poshta integration scoped (API, branch picker, cost calc)            | decision-doc §6                                   |
| UAH pricing strategy defined (single- vs multi-currency)                  | decision-doc §7                                   |

---

## 8. Definition of done

- All four task acceptance criteria met.
- The decision-doc §8 integration blueprint is concrete enough that TASK-048 and TASK-049 can be planned without re-discovery.
- The recommendation is actionable the moment the client confirms the prerequisites checklist.
- Every quantitative claim in the decision doc is cited to a primary source with a "verified 2026-07-16" stamp; unverifiable facts are marked as requiring merchant confirmation, not guessed.

---

## 9. Risks & open questions

1. **Negotiated fees are opaque** — published rates are starting points; real rates depend on volume and negotiation. The doc uses published rates and flags where a sales quote is needed.
2. **Market consolidation** — gateway ownership has shifted; stale sources may misstate who owns what. The adversarial pass verifies current ownership before relying on any capability claim.
3. **Legal-entity dependency** — the recommendation branches on facts only the client holds. If those facts arrive late, the decision doc still stands as a decision tree; only the final single pick waits on confirmation.
4. **COD reconciliation complexity** — NP COD introduces a settlement/remittance flow with its own webhooks and timing that the gateway rail does not have. Under-scoping it here would surface as rework in TASK-049.
5. **Currency migration touches live data** — the `USD`→`UAH` default change is a schema migration; it coordinates with the program's one-migration-per-PR rule and with TASK-039.

---

## 10. Next step

After user review of this spec, invoke the writing-plans skill to produce the implementation plan for conducting the research fan-out and writing the decision document.
