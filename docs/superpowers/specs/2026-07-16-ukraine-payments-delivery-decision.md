# Mirox Shop — Ukraine Payments & Delivery Decision

**Status:** Complete
**Verified as of:** 2026-07-16 — 2026-07-17 (research 07-16; Fondy / Plata by mono / Nova Poshta re-verification 07-17)
**Spec:** ./2026-07-16-ukraine-payments-delivery-design.md
**Feeds:** TASK-048 (gateway integration), TASK-049 (Nova Poshta integration)

> **How to read the evidence in this document.** Every claim was researched and then **adversarially re-checked against its primary source** by a second pass instructed to refute it. 120 claims, 120 verified: **93 confirmed, 42 disputed, 10 unverifiable**. Markers used throughout:
>
> - ✅ — confirmed against a primary source.
> - ⚠️ — **the value shown is the verifier's correction**; the original research was wrong. Never use a pre-correction figure from any earlier draft or the raw findings.
> - ❓ — **not settleable from public sources** (negotiated rates, private SLAs). These require merchant confirmation or a sales quote. **No figure here is a guess** — where we could not verify, we say so instead of filling the gap.
> - **[live]** — verified _behaviourally_ against a production API rather than a doc page (see §6).

## 1. Executive summary & recommendation

Stripe does not onboard Ukrainian merchants, so Mirox Shop needs a Ukrainian gateway. This document settles that choice, scopes Nova Poshta delivery, and fixes the currency strategy, so that TASK-048 and TASK-049 can be planned without re-discovery.

**The headline: this is not one payment integration, it is two.** Ukrainian e-commerce runs on two rails — an online card gateway **and** Nova Poshta cash-on-delivery (післяплата) — with **opposite order lifecycles** (`paid → ship` vs `ship → maybe paid`). Building only the gateway would forfeit the way a large share of Ukrainian customers actually buy. See §3.

**Gateway recommendation** — conditional, because it turns on facts only the client holds (§5.3):

| If…                                                                | Then                        | Why                                                                                                                        |
| ------------------------------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Already banks with **monobank**, installments not needed at launch | **Plata by mono**           | Live in <10 min; 1.3%/2%; 0 UAH/mo. Costs: monobank account mandatory, UA-language site mandatory, no installments via API |
| **Any other case** — wants bank freedom and/or native installments | **LiqPay** ← safest default | Only candidate that settles to **any bank's** IBAN; 1.3%/2% published; ~24 h approval; installments built in               |
| **Installments are a primary conversion lever**                    | **WayForPay**               | 2% flat buys **nine** bank installment programs vs LiqPay's two; no refund fee                                             |
| BankPay 1% is material, or a relationship exists                   | **Portmone**                | Otherwise loses: 3–10 **business days** onboarding, payout period unverifiable                                             |
| —                                                                  | **~~Fondy~~ DISQUALIFIED**  | NBU licence of its Ukrainian entity **revoked 2024-07-22**                                                                 |

Branches A and B are both 1.3%/2%: **fee is not the differentiator** — bank lock-in versus onboarding speed is.

**Four findings that change the plan** (each caught by adversarial verification _contradicting_ the initial research — see §9):

1. **Fondy is disqualified on licensing**, not on price. ТОВ «ФК "ЕЛАЄНС"» lost its NBU licence on 2024-07-22 (NBU's own register). The original research had it as a live candidate.
2. **Plata by mono cannot offer installments** through the acquiring API — `paymentScheme` is read-only reporting. Instalments are a **separate product** where **the merchant pays the commission**.
3. **monobank requires a Ukrainian-language site** to approve internet acquiring. This makes **TASK-039 (i18n) a hard prerequisite for payments** under Branch A — not a parallel track — and it converges with the language-law requirement already in the program spec.
4. **Nova Poshta's postomat filter UUID was inverted** in the research; building on it would have shipped **branch pickups to customers who chose a locker**. See §6.

**Nova Poshta** (§6): one API covers branch, postomat, and courier. COD splits into two products with different tariffs and different eligibility — and **«Контроль оплати» is legal-entity-only**, so a ФОП must take the NovaPay route. One open question remains for a human: whether the classic API offers a status webhook (the devportal is Cloudflare-blocked) — this gates TASK-049's polling design.

**Currency** (§7): **single UAH**. Every viable candidate settles in UAH only; NP COD is UAH. Requires migrating the `Order.currency` default from `"USD"`.

**Status of the evidence:** 120 claims researched, **120 verified** against primary sources — 93 confirmed, **42 disputed**, 10 unverifiable. A ~29% dispute rate on the raw research is the reason this document exists in this form; unverifiable figures are tagged, never guessed.

## 2. Context & constraints

**Business context.** Mirox Shop is a real production launch in Ukraine (not a demo), selling men's clothing. Ukraine-only: no diaspora or cross-border sales in scope.

**Constraints fixed before this research began** (from the brainstorming session, §9 decision log):

| Constraint                                                                 | Consequence                                                                                  |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Stripe does not onboard Ukrainian merchants                                | The existing payment integration must be **replaced**, not extended                          |
| Merchant's legal entity and bank are **unknown**                           | The recommendation must be a decision tree + prerequisites checklist (§5), not a single pick |
| **Ukrainian language law** — UA must be the default customer-facing locale | Converges with monobank's acquiring requirement (§4.2)                                       |
| **Single UAH** — display, storage, charges                                 | §7; every viable gateway settles UAH-only anyway                                             |
| Both rails in scope — online card **and** NP COD                           | §3                                                                                           |

**Code being replaced.** The current checkout is Stripe-shaped throughout:

- [`src/lib/stripe.ts`](../../../src/lib/stripe.ts) — lazy Stripe client (`apiVersion: "2026-01-28.clover"`), plus `SHIPPING_METHODS` hardcoded in **USD** (`standard 5.99` / `express 12.99` / `overnight 24.99`) and `calculateOrderTotals(subtotal, shippingMethodId, taxRate = 0)`.
- [`src/app/api/checkout/create-payment-intent/`](../../../src/app/api/checkout/create-payment-intent/) and [`confirm-order/`](../../../src/app/api/checkout/confirm-order/) — the payment-intent flow.
- `prisma/schema.prisma` — `Order.currency String @default("USD")` (line 249); `paymentIntent String?` (Stripe-specific naming); `paymentMethod String?` (untyped); `PaymentStatus { PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED }`.

Three of these carry hidden assumptions that the two-rail model breaks:

1. **`SHIPPING_METHODS` is a static USD price list.** Nova Poshta shipping is _computed per shipment_ from city refs + weight (§6.4). The static list cannot survive; shipping cost becomes an API call.
2. **`PaymentStatus` assumes pay-then-ship.** On the COD rail an order legitimately ships while unpaid (§3), so `PENDING` would have to mean both "customer abandoned checkout" and "shipped, awaiting collection" — two states that need different operational handling (§8.4).
3. **`taxRate = 0` is currently an accident that happens to be right.** For a non-VAT-registered single-tax ФОП, zero is not a placeholder — it is _required_ that no VAT line is displayed at all (§7.6). This must become a deliberate, documented behaviour rather than an unexamined default.

**Program constraints that bind the blueprint:** one schema migration per PR; never two schema-changing PRs in flight simultaneously ([program spec](./2026-07-14-mirox-shop-program-design.md) §5). TASK-048 and TASK-049 both touch `Order` — see §8.7.

## 3. Two-rail payment model (online prepayment + Nova Poshta COD)

Ukrainian e-commerce runs on two payment rails with **different order lifecycles**. This is the single most important structural fact in this document: it is not "a gateway plus a shipping integration," it is two distinct money flows that the `Order` model must represent separately.

### Rail A — Online prepayment (card via gateway)

Customer pays at checkout; the gateway confirms via webhook; funds settle to the merchant's bank account. Lifecycle: **paid → fulfil → ship**. The merchant has the money before the goods leave.

- Cost: 1.3–2% of order value (see §4).
- Settlement: UAH, next banking day for every viable candidate.
- Merchant bears: gateway fee, chargeback exposure, PCI scope (minimal with hosted checkout).
- Failure mode: payment fails at checkout — cart abandoned, no goods move.

### Rail B — Nova Poshta COD (післяплата / накладений платіж)

Customer pays cash or card at the Nova Poshta branch on collection; NP collects the money and remits it to the merchant. Lifecycle: **fulfil → ship → _maybe_ paid**. The goods leave before the merchant has the money.

- Cost — **two different products, two different tariffs.** Getting these confused is the most common modelling error here:
  - **COD → sender's card** (the retail default): **1% + 10 UAH** to a NovaPay card (money in ~30 min), **2% + 20 UAH** to any other card or in cash (next business day). Behaviourally confirmed against the live API's `CostRedelivery`, which matched `0.02·N + 20` exactly across all tested amounts.
  - **COD → business account** (NovaPay «Зарахування післяплати на рахунок», the merchant-grade route): _Universal_ tariff — **0.5%** credited to a NovaPay account **same day**, **1.3%** to any other bank **next business day**. _Standard_ tariff (recipient pays the whole fee) — 2.5% / 3.3%.
- Ceiling: **399,999 UAH** per single післяплата (both routes).
- **Eligibility trap:** the classic contract-based **«Контроль оплати» requires the sender to be a legal entity (юридична особа)**. A ФОП cannot use it — a ФОП must go via the NovaPay «післяплата на рахунок» route, whose business accounts do serve both ФОП and legal entities. This makes the COD rail's shape depend on the merchant's legal form, exactly like the gateway choice does.
- Reconciliation: NovaPay emails a payment register (реєстр виплат) to the address named in the COD agreement; the merchant can also view a COD statement (виписка) in the NovaPay app.
- Merchant bears: COD fee, **non-redemption risk** (customer never collects → merchant eats return shipping and gets no sale), and a cash-flow delay.
- Failure mode: parcel unredeemed — goods travel twice, revenue zero. This risk has no analogue on Rail A and is the reason most UA stores still offer both.

### Why both rails, and what it costs us

COD is how a large share of Ukrainian shoppers buy; shipping without it forfeits real revenue. But COD is _not_ free-to-implement: it needs its own reconciliation path mapping an NP money-leg back to an order, and it inverts the payment/fulfilment ordering that the current Stripe-shaped `Order` model assumes.

Two distinctions that are easy to get wrong and expensive to discover late:

- **післяплата ≠ «Контроль оплати».** They are different products. Післяплата is declared via `backwardDeliveryData` on the EW document. «Контроль оплати» is a **separate `AfterpaymentOnGoodsCost` field requiring a NovaPay contract**. The research initially conflated them; verification separated them.
- **Reconciliation mechanism is not settled.** Nova Post _international_ publishes webhooks (`POST /tracking-push/subscribers`, ~20 events, `X-NP-Key`). For the **classic** Ukrainian API, whether a status webhook exists could **not** be resolved from primary sources — `developers.novaposhta.ua` is Cloudflare-blocked (403/530), and a keyless probe returns an identical error for a known-fake method as for the claimed subscribe method (auth gates before method resolution), so the probe cannot distinguish "absent" from "needs a key". See §6 and §9 — **this is an open question a human must close before TASK-049 locks its polling design.** Live evidence gathered meanwhile: classic tracking states include **code 16, «Зворотна доставка - грошовий переказ»**, a strong candidate signal for the COD money-leg.

## 4. Gateway comparison matrix

**Verdict markers:** ✅ value confirmed against a primary source · ⚠️ **value shown is the verifier's correction** — the original research was wrong · ❓ not settleable from public sources.

**Candidates:** five researched, **four viable**. Fondy is disqualified on licensing grounds (see below and §5) but is retained here because the disqualification is itself a finding.

### 4.1 At-a-glance

| Field                | LiqPay                                            | WayForPay                                | Plata by mono                                                             | Portmone                                      | Fondy                                 |
| -------------------- | ------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------- |
| **Card fee**         | 1.3% UA / 2% foreign ✅                           | 2% flat ✅                               | 1.3% UA / 2% foreign ✅                                                   | 2% e-com; 1% BankPay ✅                       | ~2.5–2.7% ❓                          |
| **Fixed fee**        | none ✅                                           | none ✅                                  | none; 0 UAH/mo ✅                                                         | none ✅                                       | none ❓                               |
| **Settlement**       | UAH, next op. day ✅                              | UAH only, next banking day ✅            | UAH, T+1 ✅                                                               | UAH payout ❓ period                          | UAH, ~T+3 ❓                          |
| **Eligibility ФОП**  | Yes, IBAN any bank ✅                             | Yes ✅                                   | Yes — **monobank business account required** ✅                           | Yes ✅                                        | ❓                                    |
| **Eligibility ТОВ**  | Yes ✅                                            | Yes ✅                                   | Yes — monobank legal-entity acct; onboard via support ✅                  | Yes ✅                                        | ❓                                    |
| **Onboarding**       | ≤15 min registration ⚠️ (ceiling, not average)    | Fully online, 6 steps, Diia signature ✅ | <10 min self-service ✅                                                   | **3–10 business days** ✅                     | ❓                                    |
| **API docs**         | UA/EN ✅                                          | UA/EN ✅                                 | UA body copy; `/en/` is a shell ✅                                        | UA/EN ✅                                      | EN — **UK entity only** ✅            |
| **Webhooks**         | POST data+signature ⚠️                            | POST to serviceUrl ⚠️                    | ⚠️ **no callback on `expired`** — must poll                               | S2S POST; H2H async ✅                        | Signed POST ✅                        |
| **Refunds**          | Full + partial ⚠️                                 | Full + partial, no extra fee ✅          | Full + partial, async ✅                                                  | Full + partial ✅                             | Full + partial ✅                     |
| **Apple/Google Pay** | Both ✅                                           | Both, no extra cert ✅                   | Both ✅                                                                   | ⚠️ Both, but **no native SDKs** (use PassKit) | Both ✅                               |
| **Installments**     | Оплата частинами + Миттєва розстрочка; 1–24 mo ⚠️ | ⚠️ **9 bank programs** — widest          | ⚠️ **NOT via acquiring API** — separate product, merchant pays commission | 6 bank programs ✅                            | ❓                                    |
| **Recurring**        | Yes ✅                                            | Yes ✅                                   | ⚠️ **tokenization off by default** — support request                      | Yes ✅                                        | Yes ✅                                |
| **Sandbox**          | Full; per-merchant `sandbox_` keys ✅             | ⚠️ **shared test creds only**            | Test token; no terminal needed ✅                                         | By account-manager request ✅                 | ⚠️ **no UAH test currency**           |
| **Payout hold**      | ❓                                                | ❓                                       | ❓ none published                                                         | ❓                                            | ❓                                    |
| **PCI scope**        | Hosted → SAQ-A ✅                                 | Hosted/widget → no cert ⚠️               | Hosted redirect → SAQ-A ✅                                                | Hosted/widget → SAQ-A ✅                      | Hosted → SAQ-A ✅                     |
| **Ownership**        | PrivatBank, 100% state-owned ✅                   | ТОВ ФК «ВЕЙ ФОР ПЕЙ», active ⚠️          | АТ «Універсал Банк», NBU лic. №92 ✅                                      | ⚠️ **no longer Kaspi.kz** — sold 09/2025      | ⚠️ **NBU licence REVOKED 2024-07-22** |

### 4.2 Per-gateway detail & citations

All sources verified 2026-07-16, except Fondy / Plata by mono / Nova Poshta re-verification, completed 2026-07-17.

**LiqPay (PrivatBank)** — 1.3% Ukrainian-issued cards / 2% foreign, percentage-only, no fixed fee; "Individual" plan negotiable above scale [liqpay.ua/tariffs]. Settlement UAH no later than the next operational day, credited daily [liqpay.ua/information/terms]. ФОП eligible to an IBAN at any bank; ТОВ requires passport+RNOKPP, статут, signatory authority [liqpay.ua/information/instructions/registration]. Registration "up to 15 minutes" — ⚠️ a published _ceiling_, not an average [liqpay.ua/information/handbook/activation]. Callbacks POST `data`+`signature` to `server_url`; final states include success/failure/error/reversed [liqpay.ua/en/doc/api/callback]. Refunds full or partial, amount managed via API, `action="refund"` [liqpay.ua/en/doc/api/internet_acquiring/refund]. Installments: «Оплата частинами» + «Миттєва розстрочка», 1–24 months, 300–300,000 UAH; ⚠️ who sets the term differs by product [liqpay.ua/methods/paypart]. Sandbox: per-merchant `sandbox_`-prefixed keys, `sandbox=1` flag, published test cards [liqpay.ua/en/doc/api/testing]. Ownership: brand of JSC CB PrivatBank, 100% state-owned since the 2016 nationalisation; no 2025–26 ownership change found [privatbank.ua/en/liqpay-oplaty].

**WayForPay** — flat 2% per successful transaction, no fixed component, free onboarding, **no fee on refunds or hold cancellations**; individually set in some cases [help.wayforpay.com/view/3342384]. Settlement **UAH only** ("Відшкодування коштів доступне тільки у валюті гривня"), next banking day, banking days only [help.wayforpay.com/uk/view/3342386]. ФОП and ТОВ both standard tracks; ФОП needs виписка з ЄДР; ТОВ needs статут, наказ, protocol, bank statement, financial reporting [help.wayforpay.com/view/13730003]. Onboarding fully online in 6 steps with id.gov.ua / Diia.Signature and automatic activation [help.wayforpay.com/view/1737806]. Refunds full+partial via REFUND API, HMAC*MD5 signature [wiki.wayforpay.com/en/view/852115]. ⚠️ **Installments are the widest of any candidate — nine bank programs**: monobank «Покупка частинами», PrivatBank «Оплата частинами» + «Миттєва розстрочка», A-Bank ×2, Globus Bank, and others [help.wayforpay.com/view/962875452]. ⚠️ **Sandbox is weaker than claimed**: the primary source documents only \_shared* test merchant credentials (`test_merch_n1`), not a per-merchant sandbox [wiki.wayforpay.com/en/view/852472]. Widget requires no merchant PCI DSS certification [wiki.wayforpay.com/view/852091]. ⚠️ Entity: ТОВ ФК «ВЕЙ ФОР ПЕЙ», EDRPOU 39626179, registered 2015, share capital 65,500,000 UAH, status active, no reorganisation records [clarity-project.info/edr/39626179].

**Plata by mono (monobank / АТ «Універсал Банк»)** — 1.3% Ukrainian-issued / 2% foreign for internet acquiring; **0 UAH monthly**; no fixed fee. Marketing says "від 1,3%" but that wording appears **only in an SEO meta description** — every customer-facing surface states a flat rate, so "individually negotiable" is an unsourced inference [monobank.ua/en/knowledge-base/acquiring/index]. Settlement T+1 UAH **to a monobank business account — this is a hard prerequisite**, not a preference [same]. ФОП: any registered ФОП with an open monobank ФОП business account, no tax-group restriction in public docs. ТОВ: eligible with a monobank legal-entity account; self-service onboarding is ФОП-oriented, ТОВ routed via support [monobank.ua/en/knowledge-base/acquiring/signup]. Self-service connection under 10 minutes; approval ~10 minutes [same]. ⚠️ **Webhooks fire on every status change _except_ `expired`** — verbatim: "окрім статусу `expired`". An invoice that simply lapses (24 h default validity) **never** produces a callback and must be polled or timed out locally [api.monobank.ua/docs/acquiring.html]. Refunds full+partial via `POST /api/merchant/invoice/cancel`, asynchronous with its own status lifecycle [same]. ⚠️ **Installments are not available through the acquiring API**: `paymentScheme` (incl. `bnpl_parts_4`) exists **only in response schemas** — a merchant can observe which scheme a buyer used but cannot offer BNPL. The real product is a **separate API, «Покупка Частинами»** (`/api-docs/chast`; `/api/order/create|state|confirm`), **3–25 instalments**, and **the merchant pays the commission** ("комісію сплачує магазин") [monobank.ua/api-docs/chast]. ⚠️ Recurring: "Токенізація недоступна за замовчуванням" — must contact support to enable [api.monobank.ua/docs/acquiring.html]. Hosted redirect to `pay.mbnk.biz` keeps SAQ-A scope. Ownership: licensed entity is АТ «Універсал Банк», NBU licence №92, TAS Group; monobank is a brand, not a separate bank [monobank.ua footer]. **⚠️ Launch-gating eligibility item the research missed: monobank's internet-acquiring checklist requires a Ukrainian-language version of the site**, an About/offer section, contacts, and products with photo/description/price.

**Portmone** — 2% per successful card payment for internet shops; **BankPay (bank-app/QR) 1%**; no connection or monthly fee; individual rates offered above ~500,000 UAH/month turnover [business.portmone.com.ua/tariffs]. ❓ Settlement: UAH-only payout confirmed, but the **payout period is not settleable from public sources** [business.portmone.com.ua/ecommerce]. ФОП («Самозайняті особи» is a listed merchant category) and ТОВ both eligible; no tax-group restriction published [business.portmone.com.ua/tariffs]. **Onboarding 3–10 business days** — by far the slowest candidate; requires KYC/AML financial monitoring and a signed cooperation agreement [business.portmone.com.ua/ecommerce]. Webhooks: S2S POST on completion; H2H async notifications (`mode=1111`) in XML BILLS / XML PAY_ORDERS / JSON [docs.portmone.com.ua/docs/en/PortmoneHostToHostEng]. Refunds full+partial via `return`; requires original in PAYED status; **processed only after the operational day closes** [docs.portmone.com.ua/docs/en/PaymentGatewayEng]. ⚠️ Apple/Google Pay supported with official guides, **but Portmone ships no native iOS/Android SDKs** — its guides direct developers to Apple's own PassKit framework [docs.portmone.com.ua/en/docs/en/APayEng]. Installments: «Оплата частинами» aggregating 6 bank programs (monobank 3–25 payments buyer-fee 0%, PrivatBank 3–24, Oschadbank, PUMB, OTP…) [business.portmone.com.ua/installments]. Sandbox exists but is **enabled by account-manager request, not self-service** [docs.portmone.com.ua/docs/en/PaymentGatewayEng]. ⚠️ **Ownership changed: Portmone is no longer a Kaspi.kz subsidiary.** Kaspi.kz disposed of the Portmone payments service in **September 2025**, deconsolidating the Ukrainian asset, per Kaspi.kz's own 2025 annual financial report. Any source describing Portmone as Kaspi-owned is stale.

**Fondy — ⚠️ DISQUALIFIED pending proof of a licensed route.** The NBU's own machine-readable Register of Payment Infrastructure (`RPI_lic_fin-payment_services.xlsx`, bank.gov.ua, downloaded 2026-07-17) lists at row 18: **ТОВ «ФК "ЕЛАЄНС"», EDRPOU 38905834, licence 21/778-рк issued 2023-04-30, «Дата відкликання» (revocation date) = 2024-07-22.** There is no verified licensed Ukrainian entity behind "Fondy Ukraine acquiring," and no Fondy/Елаєнс entry was found in the NBU commercial-agents register. A secondary source claims Fondy "resumed under partner-bank licences"; that could **not** be confirmed from any primary source and is not treated as established here.

Two compounding problems make Fondy's Ukrainian numbers unusable rather than merely unverified:

1. **`fondy.ua` is unreachable at the TCP layer** from this environment (curl times out with 0 bytes — not an HTTP error). Every Ukraine-side claim in the original research was attributed to pages the researcher **never actually loaded**, read from search-index snippets instead. Search snippets are not primary sources; this is precisely the gap that produced the ownership error.
2. **`docs.fondy.io` documents the UK entity** (FONDY LTD, FCA-authorised EMI). Its technical claims verified well — webhook retry back-off is exactly 2/60/300/600/3600/86400 s, reversal semantics, `pay.fondy.eu` hosted-checkout pattern, `/api/recurring` token flow all match — but that is **evidence about the UK operation and says nothing about Ukrainian acquiring**. Its UK pricing (£0.2/€0.2 + from 0.9%) is not a Ukrainian tariff.

⚠️ Also: the Fondy sandbox publishes test currencies **GBP, EUR, USD, PLN, CZK — no UAH**, so a UAH checkout could not be exercised end-to-end pre-launch even if licensing were resolved [docs.fondy.io/gateway/test-gateway-payments].

## 5. Conditional recommendation & prerequisites checklist

### 5.0 Gate 0 — applies to every branch

**No gateway can be connected without a registered ФОП or ТОВ.** Every Ukrainian card-acquiring gateway (LiqPay, WayForPay, Portmone, Plata by mono) requires a registered business with a **business current account** (not personal) and a **public offer + return policy published on the site**. A private individual cannot legally connect internet acquiring for commercial sales [liqpay.ua/information/instructions/registration].

If the client is not yet registered, that — not the gateway choice — is the launch's critical path.

### 5.1 The decision tree

**Branch A — ФОП/ТОВ already banking with monobank, and installments are not required at launch → _Plata by mono_.**
Fastest path to live: self-service onboarding under 10 minutes, 1.3% domestic / 2% foreign, 0 UAH monthly, T+1 settlement.
_Accept these costs:_ a **monobank business account is mandatory** (bank lock-in); the site **must have a Ukrainian-language version** before approval; **no installments** via the acquiring API; and the `expired`-status webhook gap forces local invoice timeout handling.

**Branch B — wants bank-agnostic settlement and/or native installments → _LiqPay_. ← the safest default**
Settles to an IBAN business account of a ФОП **or** legal entity **at any bank** — no banking relationship forced. Published 1.3% domestic / 2% foreign, next-operational-day settlement, application processed in ~24 h, and installments («Оплата частинами», «Миттєва розстрочка», 1–24 months, 300–300,000 UAH) are built in rather than bolted on.
_Caveat:_ the published tariff is indicative — the real commission is **set per merchant/MCC on contract**, so the 1.3% is a starting point, not a quote.

**Branch C — installments are a primary conversion lever → _WayForPay_.**
Pay 2% flat (higher than A/B) to buy the widest installment reach of any candidate: **nine bank programs** (monobank, PrivatBank ×2, A-Bank ×2, Globus, …) versus LiqPay's PrivatBank-only pair. Also charges **no fee on refunds or hold cancellations**, and onboards fully online via Diia.Signature.
_Caveat:_ sandbox is **shared test credentials only**, not a per-merchant environment — weaker pre-launch testing than A or B.

**Branch D — _Portmone_: only on a specific reason.** Choose it if BankPay at 1% is material to the mix or a relationship already exists. Otherwise it loses on every axis that matters here: **3–10 business days** onboarding (slowest by an order of magnitude), payout period not publicly verifiable, and no native wallet SDKs.

**Disqualified — _Fondy_.** Not a ranking; an eligibility failure. The NBU register records the licence of its Ukrainian entity ТОВ «ФК "ЕЛАЄНС"» as **revoked 2024-07-22**. Do not plan TASK-048 against Fondy unless the client obtains **written proof of a current licensed route** (see §4.2 and §9).

### 5.2 How to read this tree

Branches A and B are both 1.3%/2% — **fee is not the differentiator between them**. The real trade is: _Plata by mono buys onboarding speed at the price of bank lock-in and no installments; LiqPay buys bank freedom and native installments at the price of a negotiated (not published) rate._ If the client already banks with monobank and wants to be live fastest, take A. In every other case, **B is the safest default** — it is the only candidate that imposes no banking relationship at all.

### 5.3 Prerequisites checklist — confirm with the client before TASK-048 starts

The recommendation resolves to a single gateway the moment these are answered. Until then, all branches stay live.

- [ ] **1. Legal form — ФОП or ТОВ?** _(Gates everything, including the COD rail.)_
- [ ] **2. If ФОП — which single-tax group?** **Group 3 is the fit** for e-commerce card acceptance: sells to anyone including legal entities, no employee cap, **5%** of turnover (non-VAT-registered) or **3%** (VAT-registered) [Tax Code Art. 291.4, 293.3]. **Group 2 cannot sell to legal entities** (population + single-tax payers only). Group 1 is RRO-exempt but far too restricted for this.
- [ ] **3. Expected annual turnover vs the Group 3 ceiling — 10,091,049 UAH for 2026** (1167 × the 8,647 UAH minimum wage effective 2026-01-01, per Law No. 4695-IX). Exceeding it triggers the Art. 293.5 **penalty** rate.
- [ ] **4. VAT-registered?** _(Selects 3% vs 5% on Group 3; also drives ПДВ display — see §7.)_
- [ ] **5. Current bank — monobank, PrivatBank, or other?** _(This is the A-vs-B switch.)_
- [ ] **6. Are installments wanted at launch?** _(If yes and breadth matters → Branch C. Note Plata by mono cannot offer them via the acquiring API at all.)_
- [ ] **7. РРО/ПРРО status — confirm with an accountant, not with us.** General rule under Law 265/95-ВР + Tax Code п.296.10: a settlement operation **for goods** with card acceptance / internet acquiring generally **requires a fiscal receipt** via an RRO or software ПРРО (the free State Tax Service «ПРРО Каса», or checkbox). Main carve-out: ФОП Group 1. **This document does not give tax advice and this item must not be treated as settled by it.**
- [ ] **8. NovaPay account — yes or no?** _(Sets the COD economics: 0.5% same-day vs 1.3% next-business-day to another bank.)_
- [ ] **9. Site prerequisites acknowledged:** public offer + return policy published (**all** gateways); **Ukrainian-language site version** (monobank specifically — and see §7 for why this converges with the language law).

> **A ТОВ correction worth stating explicitly**, because the raw research got it backwards and it would have skewed this tree: a ТОВ on Group 3 pays **the same 5%/3% as a ФОП — not double**. The 10%/6% figure is an Art. 293.5 **penalty** (applied to income over the limit and similar breaches), not a ТОВ's normal operating rate. Legal form should therefore be chosen on liability, ownership, and turnover headroom — **not** on a single-tax-rate penalty that does not exist.

## 6. Nova Poshta scoping

> **Sourcing note.** `developers.novaposhta.ua` is Cloudflare-blocked (403/530) from our environment. Where marked **[live]**, facts below were verified **behaviourally against the production API** (`https://api.novaposhta.ua/v2.0/json/`, which answers directory and pricing methods with an empty `apiKey`) — a _stronger_ primary source than a doc page, since it reflects what the API actually does. This is what caught four of the five corrections in this section.

### 6.1 Platform fork — settle this first

There are **two different Nova Poshta APIs**, and they are not interchangeable:

|          | **Classic Ukraine API** ← assume this                               | **Nova Post international**                                                              |
| -------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Base     | `POST https://api.novaposhta.ua/v2.0/json/` (XML at `/v2.0/xml/`)   | `https://api.novapost.com/v.1.0/` (sandbox `api-stage.novapost.pl/v.1.0/`)               |
| Auth     | **Static API key inside the JSON body of every call.** No OAuth/JWT | `GET /clients/authorization?apiKey=…` → short-lived **JWT** in an `Authorization` header |
| Style    | `modelName` / `calledMethod` envelope                               | REST                                                                                     |
| Webhooks | **Unresolved — see §6.6**                                           | **Yes** — `POST /tracking-push/subscribers`                                              |

The classic API is the one that carries `getCities`, `getWarehouses`, `getDocumentPrice`, `getStatusDocuments`, and `backwardDeliveryData`, so it is what a Ukrainian storefront targets. **Confirm which platform the client's account is actually on before TASK-049 starts** — the auth models are incompatible.

**Request envelope (classic):**

```json
{
  "apiKey": "…",
  "modelName": "Address|InternetDocument|TrackingDocument|CommonGeneral",
  "calledMethod": "getCities|getWarehouses|getDocumentPrice|…",
  "methodProperties": {}
}
```

The key is generated by the merchant in the business cabinet (new.novaposhta.ua → Settings → Security/API).

### 6.2 Address model

- **`Address.getCities`** → `CityRef`. **This is the ref that `CitySender`/`CityRecipient` expect** in pricing and waybill creation.
- **`Address.getSettlements`** → `SettlementRef`. The broader directory of all populated places incl. villages; pair with `searchSettlements` / `getSettlementAreas` / `getSettlementStreets`.
- **Rule of thumb:** `CityRef` for pricing and waybill fields; `SettlementRef` **only** for address-search UX. Mixing them is a silent failure — they are not interchangeable.

### 6.3 Branch vs postomat — ⚠️ the inverted-UUID trap

`Address.getWarehouses` returns **branches _and_ lockers together**, filtered by `CityRef`/`CityName`. To get **only** postomats, filter on `TypeOfWarehouseRef`.

**The original research had this exactly backwards.** `Address.getWarehouseTypes` returns exactly **five** types **[live]**:

| `TypeOfWarehouseRef`                       | Type                                           |
| ------------------------------------------ | ---------------------------------------------- |
| **`f9316480-5f2d-425d-bc2c-ac7cd29decf0`** | **«Поштомат»** ← the locker filter             |
| `9a68df70-0267-42a8-bb5c-37f427e36ee4`     | «Вантажне(ий)» — cargo branch                  |
| `841339c7-591a-42e2-8233-7a0a00f0ed6f`     | «Поштове(ий)»                                  |
| `6f8c7162-4b72-4b0a-88e5-906948c6a92f`     | «Поштове відділення з обмеження» (Parcel Shop) |
| `95dc212d-479c-4ffb-a8ab-8c1b9073d0bc`     | «Поштомат ПриватБанку»                         |

The research named `9a68df70-…` as the postomat filter. It is **«Вантажне(ий)»**, and filtering by it returns `CategoryOfWarehouse: Branch` **[live]** — i.e. TASK-049 would have **shipped branch pickups to every customer who chose a locker**, silently and plausibly. Also: **«Поштомат InPost» does not exist** — there are five live types, not six.

### 6.4 Shipping cost — `InternetDocument.getDocumentPrice`

**Genuinely required [live]:** `ServiceType`, `CitySender` (CityRef), `CityRecipient` (CityRef), and `Weight` (or `VolumeGeneral`).

⚠️ **`Cost` and `CargoType` are _not_ required** — the call succeeds without them and the server defaults `AssessedCost`. (The research listed both as mandatory.) Still **supply `Cost`**: it sets the declared/assessed value.

⚠️ **`CargoType: 'Money'` is rejected here** with `Incorrect CargoType`. Valid values **[live]** are `Parcel`, `Cargo`, `Documents`, `TiresWheels`, `Pallet` (`CommonGeneral.getCargoTypes`). `Money` is valid **only** as a _backward-delivery_ CargoType (§6.5). `TiresWheels` additionally requires `CargoDetails`.

### 6.5 Delivery modes & COD declaration

**`ServiceType`** is a string enum pairing sender leg → recipient leg. Exactly six values **[live]** via `getServiceTypes`, sender-leg-first:

| `ServiceType`        | Mode                                                     |
| -------------------- | -------------------------------------------------------- |
| `WarehouseWarehouse` | **Branch pickup** — customer collects at a відділення    |
| `WarehousePostomat`  | **Postomat** — customer collects from a locker           |
| `DoorsPostomat`      | Courier pickup from sender → locker                      |
| `WarehouseDoors`     | Drop at branch → **courier to customer's door**          |
| `DoorsWarehouse`     | Courier pickup from sender → customer collects at branch |
| `DoorsDoors`         | Full courier door-to-door                                |

Price probe corroborates the semantics: `DoorsDoors` 210 > `WarehouseWarehouse` 90 **[live]**.

**COD is declared at waybill creation** (`InternetDocument.save`), not at pricing:

```json
"BackwardDeliveryData": [
  { "PayerType": "Recipient", "CargoType": "Money", "RedeliveryString": "<amount UAH>" }
]
```

`CargoType: 'Money'` is what makes it a money COD. Live enums: `getBackwardDeliveryCargoTypes` → `[Documents, Money]`; `getTypesOfPayers` → `[Sender, Recipient, ThirdPerson]` **[live]**. **Default is `PayerType: 'Recipient'`** — the customer pays the COD fee unless you decide otherwise, which is a pricing/UX decision, not a default to accept unthinkingly.

⚠️ **«Контроль оплати» is NOT built on backward-delivery.** It is a **separate waybill field, `AfterpaymentOnGoodsCost`, requiring a NovaPay contract** — and, per §3, requires the sender to be a **legal entity**. The research conflated the two mechanisms; they must be modelled separately.

**COD limits:** **399,999 UAH** per single післяплата — the per-shipment ceiling, stated on the primary source. Do not confuse it with the **card-payout** limits (100,000 UAH to a NovaPay card; 29,999 UAH to other Ukrainian bank cards; ~349,999 UAH rolling monthly), which cap the _payout_, not the shipment.

### 6.6 Tracking & reconciliation

**`TrackingDocument.getStatusDocuments`** — batch: `Documents: [{ DocumentNumber: "<TTN>", Phone: "<optional>" }]` (supplying `Phone` unlocks extra fields). Response carries `StatusCode` + `Status`, `ScheduledDeliveryDate`, `ActualDeliveryDate`, `DocumentCost`, `AnnouncedPrice`, `AmountToPay`/`AmountPaid`, and — the part that matters for the COD rail — **`RedeliverySum`, `RedeliveryNum` (the money-transfer waybill number), `RedeliveryPayer`, `RedeliveryServiceCost`, `RedeliveryPaymentCardRef`/`Description`**. These fields are how a COD money-leg is matched back to an order.

**⚠️ Open question — must be closed before TASK-049 locks its design.** Whether the **classic** API offers a status webhook is **unresolved**. The devportal is Cloudflare-blocked, and a keyless probe returns an _identical_ `User is undefined` error for a known-fake method as for the claimed `subscribeToStatusUpdate` — auth gates before method resolution, so the probe **cannot** distinguish "does not exist" from "needs a key". We did not guess.

What is established:

- **Nova Post international does have webhooks** (the research claimed otherwise — the reverse of what the portal says): `POST /tracking-push/subscribers` with a merchant callback URL accepting JSON POST, ~20 event types (`ReadyToShip`, `Received`, `ChangeTime`, `Returned`, `Refused`, …), secured by a secret token in a header defaulting to **`X-NP-Key`**.
- On the classic side, tracking **status code 16 — «Зворотна доставка - грошовий переказ»** is a strong candidate signal for the COD money-leg **[live]**.

**Plan for polling, treat webhooks as upside**: design TASK-049 around polling `getStatusDocuments` (which is certain to work), and adopt push only if a human confirms a classic-API webhook by opening the 403'd devportal from an unblocked network.

### 6.7 Branch/postomat picker — checkout UX

Two dependent selects, both server-proxied so the API key never reaches the browser:

1. **City** — autocomplete over `getCities` (or `searchSettlements` for village-level reach) → hold `CityRef`.
2. **Pickup point** — `getWarehouses` filtered by that `CityRef`, plus `TypeOfWarehouseRef` when the customer chose a locker (**`f9316480-…`**, §6.3) → hold the warehouse `Ref`.
3. **Courier modes** need a street-level address instead (`getSettlementStreets`), not a warehouse ref.

The chosen `ServiceType` (§6.5) and the warehouse/address ref must agree — a `WarehousePostomat` waybill carrying a branch ref is exactly the failure the inverted UUID would have produced. Directories are large and change slowly: cache them (daily refresh is ample) rather than calling per keystroke.

## 7. UAH currency strategy

### 7.1 Decision: single UAH

**Store, display, and charge in UAH only. Retire the multi-currency ambition.**

This is not a preference — it is what the rails allow. **All mutual settlements within Ukraine are legally in UAH**, and every viable candidate settles UAH-only to the merchant's account regardless of what currency the checkout accepted (verified for all five: LiqPay, WayForPay, Plata by mono, Portmone, Fondy). NP COD is UAH by construction. Multi-currency would add per-currency pricing, FX handling, and reconciliation complexity for **zero settlement benefit** — the money arrives as hryvnia either way.

### 7.2 Storage — no schema change needed for precision

`Decimal(10, 2)` is **adequate** and already used throughout (`price`, `subtotal`, `shippingCost`, `discount`, `tax`, `total`, `unitPrice`, `totalPrice`; `weight` is `Decimal(10,3)`). It permits up to **99,999,999.99** — ample for order totals well above the ФОП Group 3 ceiling.

⚠️ One consequence to plan for: **UAH amounts are ~40× larger than the USD figures** currently in the codebase. Existing seed data and any hardcoded prices become nonsense at face value and must be re-denominated, not merely relabelled.

### 7.3 The migration — smaller than it looks, with one trap

`Order.currency` is `String @default("USD")` at `prisma/schema.prisma:249`. Changing the Prisma default generates exactly:

```sql
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'UAH';
```

**This changes the column default only — it does not rewrite existing rows.** Two follow-ups the migration will not do for you:

- Application code that passes `currency` **explicitly** on order creation must be updated; the default only covers rows that omit it.
- **⚠️ Never reinterpret historical rows as UAH.** Existing orders hold `currency='USD'` with USD-denominated Decimals. Treating them as UAH would misstate historical revenue by ~40×. **Keep the `currency` column** (do not drop it), render every order using _its own stored currency_, and gate any "assume UAH" formatting on `currency = 'UAH'`.

### 7.4 Display & formatting — hand-off to TASK-039

UAH is ISO 4217 **UAH / numeric 980**; sub-unit is the kopiyka (100 per hryvnia), always shown as two digits.

**uk-UA convention** — and it differs from en-US on every axis, so `toFixed(2)` + `"$"` string-concat will be wrong three ways:

- thousands separator: **non-breaking space** (not a comma)
- decimal separator: **comma** (not a period)
- symbol placement: **after** the amount — `1 234,56 ₴` or `1 234,56 грн`
- per **ДСТУ 3582:2013**, `грн` takes **no trailing period**

Use `Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' })` rather than hand-rolling. This lands in TASK-039 (i18n) — but note the dependency direction: **TASK-039 is a prerequisite for payments under Branch A**, not a downstream cosmetic pass.

### 7.5 Cash rounding — applies to the COD rail only

**NBU Board Resolution No. 115 (08.09.2025):** since **2025-10-01** the 10-kopiyka coin is being withdrawn, so **cash** grand totals round to the nearest 0 or 50 kopiykas:

| Kopiykas | Rounds to       |
| -------- | --------------- |
| 1–24     | `.00` (down)    |
| 25–49    | `.50` (up)      |
| 51–74    | `.50` (down)    |
| 75–99    | next `.00` (up) |

(This supersedes the nearest-10-kopiykas rule of Resolution No. 148/2019.)

**Card payments are exact — no rounding.** This matters specifically because the COD rail can be settled in **cash** at the branch: the amount a customer physically pays may differ by up to 24 kopiykas from the order total. Reconciliation logic must tolerate that delta rather than treat it as a mismatch.

### 7.6 ПДВ (VAT) display

**VAT status depends on VAT registration, _not_ on legal form** — ФОП vs ТОВ does not determine it. Single-tax ФОП on groups 2/3 at 5% are **not required to register for VAT** even above the 1M UAH threshold, so most small ФОП are non-VAT.

**A non-VAT payer must not display any VAT line at all** — the price is simply the full amount, `без ПДВ`. The current `taxRate = 0` default and the `Order.tax` field are therefore _correct_ for the likely case, but must become deliberate: keep tax at zero and render no VAT line unless prerequisite #4 (§5.3) comes back "VAT-registered".

### 7.7 Minor units — an integration detail that bites

**Plata by mono expects amounts in minor units**: invoices default to `ccy=980` with `amount` in **kopiykas** — `4200` means **42.00 UAH**. A gateway adapter that passes hryvnias where kopiykas are expected undercharges by 100×. Each adapter must own its own unit conversion (§8.2).

## 8. Integration blueprint (seeds TASK-048/049)

### 8.1 Strategy — build to an interface, not to a gateway

The gateway choice is **conditional on client facts we do not have** (§5.3). Rather than let TASK-048 block on that answer, build against a **narrow adapter interface** and implement the chosen gateway behind it. All viable candidates are the same shape — hosted redirect + signed webhook + server-to-server refund — so the interface is cheap and swapping adapters is a contained change rather than a rewrite.

```ts
// src/lib/payments/types.ts
export interface PaymentGateway {
  /** Create a payment; returns where to send the customer. */
  createPayment(order: OrderForPayment): Promise<{ redirectUrl: string; externalId: string }>;
  /** Verify signature and normalise the provider's callback into one event shape. */
  parseWebhook(req: Request): Promise<PaymentWebhookEvent>;
  /** Full refund when amount is omitted; partial otherwise. */
  refund(externalId: string, amount?: Decimal): Promise<RefundResult>;
}
```

Adapters: `src/lib/payments/liqpay.ts`, `src/lib/payments/plata.ts`. Selected at runtime by `PAYMENT_GATEWAY` (§8.5). Each adapter owns its own signature scheme **and its own unit conversion** (§7.7).

### 8.2 Gateway API surface (per candidate)

|             | **LiqPay** (Branch B)                                                                             | **Plata by mono** (Branch A)                                                |
| ----------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Create      | `action="pay"`, server-to-server to `https://www.liqpay.ua/api/request`; hosted Checkout redirect | `POST /api/merchant/invoice/create` → `pageUrl` (`pay.mbnk.biz`)            |
| Amount unit | hryvnias                                                                                          | **kopiykas** (`ccy=980`)                                                    |
| Webhook     | POST `data` + `signature` → `server_url`; final states `success`/`failure`/`error`/`reversed`     | POST to `webHookUrl` on status change — **except `expired`**                |
| Signature   | base64 + SHA-1 over `private_key + data + private_key`                                            | **`X-Sign`, ECDSA**                                                         |
| Refund      | `action="refund"`; amount controls full vs partial                                                | `POST /api/merchant/invoice/cancel`; **asynchronous**, own status lifecycle |
| Sandbox     | per-merchant `sandbox_`-prefixed keys; `sandbox=1`                                                | test token from `api.monobank.ua`; no acquiring permission needed           |

⚠️ **Two adapter-specific gotchas that are not symmetric:**

- **Plata never calls back on `expired`.** An invoice that lapses (24 h default) produces **no** webhook, ever. The adapter must run a local timeout/poll to reap stale invoices, or orders will sit in `PENDING` forever.
- **Plata's refund is asynchronous** — `cancel` returns before the refund resolves, so the refund's own status lifecycle must be polled. LiqPay's is synchronous. Do not model refunds as instant.

### 8.3 COD reconciliation flow (Rail B)

The money-leg is a **separate waybill** from the parcel. Reconciliation is the job of matching it back to the order:

1. **Checkout** — customer picks COD; order created with `paymentMethod = COD_NOVA_POSHTA`, `paymentStatus = AWAITING_COD` (§8.4).
2. **Fulfilment** — create the waybill (`InternetDocument.save`) with `BackwardDeliveryData: [{ PayerType: 'Recipient', CargoType: 'Money', RedeliveryString: '<total>' }]` (§6.5). Store the returned TTN.
3. **In transit** — poll `TrackingDocument.getStatusDocuments` (§6.6). Persist **`RedeliveryNum`** — the money-transfer waybill number — as soon as it appears; **this is the join key** between the parcel and the money.
4. **Collected** — customer pays at the branch. Watch for status **code 16 «Зворотна доставка - грошовий переказ»**, the COD money-leg signal.
5. **Remitted** — NovaPay credits the account (same-day to NovaPay, next business day elsewhere — §3) and emails a **payment register (реєстр виплат)**. Match register rows to orders by `RedeliveryNum`; set `paymentStatus = PAID`, stamp `codSettledAt`.
6. **Never collected** — parcel returns. Order must move to a returned/cancelled state and stock be restored. **This path has no analogue on Rail A and is the one most likely to be forgotten.**

Tolerate a **≤24 kopiyka delta** on cash-settled orders (§7.5) rather than flagging a mismatch.

### 8.4 Schema deltas — one migration

```prisma
model Order {
  currency        String        @default("UAH")   // was "USD" (line 249)
  paymentMethod   PaymentMethod @default(ONLINE_CARD)  // was untyped String?
  externalPaymentId String?     // supersedes Stripe-specific `paymentIntent`
  // --- delivery (TASK-049) ---
  deliveryMode    DeliveryMode?
  npCityRef       String?       // Address.getCities   → CityRef
  npWarehouseRef  String?       // Address.getWarehouses → Ref (branch or postomat)
  npTtn           String?       // parcel waybill
  // --- COD money-leg (Rail B) ---
  codAmount       Decimal?      @db.Decimal(10, 2)
  codRedeliveryNum String?      // TrackingDocument RedeliveryNum — the reconciliation join key
  codSettledAt    DateTime?
  @@index([codRedeliveryNum])
}

enum PaymentMethod { ONLINE_CARD  COD_NOVA_POSHTA }
enum DeliveryMode  { BRANCH  POSTOMAT  COURIER }   // → ServiceType (§6.5)

enum PaymentStatus {
  PENDING          // checkout not completed
  AWAITING_COD     // NEW — shipped, money not yet collected (Rail B only)
  PAID
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}
```

**Why `AWAITING_COD` earns its place:** without it, `PENDING` means both "customer abandoned checkout" and "goods are in transit awaiting collection." Those need opposite operational responses — chase the cart vs chase the parcel — and conflating them makes the COD funnel unmeasurable.

`Order.trackingNumber` already exists and could carry the TTN; `npTtn` is proposed instead to keep the NP waybill distinct from the generic tracking field the supplier-forwarding workers already use. **Decide this in TASK-049's plan** — it is a naming call, not a research question.

### 8.5 Environment variables

```bash
# Retire (Stripe)
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Add — adapter selection
PAYMENT_GATEWAY=liqpay            # liqpay | plata

# Add — Branch B (LiqPay)
LIQPAY_PUBLIC_KEY=
LIQPAY_PRIVATE_KEY=               # also the webhook signature secret

# Add — Branch A (Plata by mono)
MONOBANK_ACQUIRING_TOKEN=         # X-Token

# Add — Nova Poshta (TASK-049)
NOVAPOSHTA_API_KEY=
NOVAPOSHTA_SENDER_CITY_REF=
NOVAPOSHTA_SENDER_WAREHOUSE_REF=
```

Follow the existing runtime-validation pattern (`NEXTAUTH_SECRET`/`DATABASE_URL`) with descriptive errors, and keep the NP key **server-side only** — the picker (§6.7) proxies through our API rather than calling NP from the browser.

### 8.6 Feature flag & test-mode plan

- **Flag the new checkout** until a real merchant account exists. The gateway decision needs client facts (§5.3), and merchant approval is not instant (3–10 business days for Portmone; ~24 h LiqPay).
- **Nova Poshta needs no key to start**: directory methods (`getCities`, `getWarehouses`, `getWarehouseTypes`, `getDocumentPrice`) answer with an **empty `apiKey`** [live]. The entire picker and cost calculator can be built and tested before the client has an NP account — **so TASK-049 is not blocked on merchant onboarding at all.** Only waybill creation needs a real key.
- **Gateway sandboxes** differ in strength: LiqPay per-merchant `sandbox_` keys and Plata's open test token are both usable pre-approval; WayForPay offers only shared credentials; Fondy's sandbox has **no UAH** currency (moot — disqualified).
- **E2E**: add a checkout spec per rail. Apply the WebKit hydration-wait pattern from TASK-038a (wait for a post-hydration render signal before `fill()`), since the checkout form is exactly the interaction class that bug affected.

### 8.7 Sequencing

1. **TASK-039 (i18n) first if Branch A.** monobank will not approve internet acquiring without a Ukrainian-language site (§4.2). Under Branch A this is a hard blocker on payments; under B/C/D it is merely the language law.
2. **The §8.4 delta is one migration** — currency default + payment/delivery fields + enum values land together, in **one PR**, per the program's one-migration-per-PR rule.
3. **Do not run TASK-048 and TASK-049 migrations concurrently.** Both touch `Order`; the program spec forbids two schema-changing PRs in flight. Land the combined delta once, then build the two integrations against it.
4. **Close the §6.6 webhook question before TASK-049 locks its polling design** — plan for polling, treat push as upside.

## 9. Risks, open questions & decision log

### 9.1 Risks

1. **Published rates are starting points, not quotes.** Every candidate reserves individual pricing. LiqPay's own registration flow states the commission is set **per merchant/MCC on contract**; WayForPay says the rate is "set individually depending on your turnover"; Portmone offers custom rates above ~500,000 UAH/month. The §4 figures are the **published** tariffs — real economics require sales quotes (§9.2, item 3).
2. **Market consolidation makes stale sources actively dangerous.** Two of five candidates' ownership claims were wrong in the raw research: Portmone is no longer Kaspi.kz-owned (sold 09/2025), and Fondy's Ukrainian licence is revoked. Any figure sourced from a blog, aggregator, or comparison site should be assumed stale until checked against a primary register.
3. **The recommendation is only as good as prerequisite #1.** The tree branches on the client's legal entity and bank (§5.3). If those answers change later — e.g. ФОП → ТОВ for liability reasons — revisit §5, because the COD rail's eligibility (§3) changes with them too, not just the gateway.
4. **COD reconciliation is the highest-complexity item in the whole program.** It spans a separate money waybill, an emailed register, a cash-rounding delta, and a return path for unredeemed parcels (§8.3). It is also the most likely to be under-estimated, because none of it exists on the Stripe-shaped path being replaced.
5. **The currency migration touches live data.** The `USD → UAH` default change is trivial SQL; the trap is historical rows (§7.3). Misreading them as UAH would misstate revenue ~40×.
6. **Fondy's disqualification rests on our reading of the NBU register.** It is a strong primary source, and we found no counter-evidence — but if the client holds **written proof** of a current licensed route (e.g. operating under a partner bank's licence), that evidence outranks this document and Fondy should be re-evaluated. A secondary source alleging exactly this exists; we could not confirm it and did not rely on it.
7. **Environment reachability shaped what could be verified.** `fondy.ua` is TCP-unreachable and `developers.novaposhta.ua` is Cloudflare-blocked from our network. This is a _research_ limitation, not a fact about those services — someone on an unblocked network may verify more (§9.2). It is also the direct cause of Fondy's eight ❓ claims.

### 9.2 Open questions

| #   | Question                                                                                                                                                   | Blocks                  | Who resolves                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------- |
| 1   | Does the **classic** NP API offer a status webhook? Devportal is Cloudflare-blocked; a keyless probe cannot distinguish "absent" from "needs a key" (§6.6) | TASK-049 polling design | Human, from an unblocked network |
| 2   | Which NP platform is the client's account on — **classic** or **Nova Post international**? Auth models are incompatible (§6.1)                             | TASK-049                | Client                           |
| 3   | **Negotiated rates** for LiqPay / WayForPay / NovaPay — published figures are indicative only                                                              | TASK-048 economics      | Client, via sales quote          |
| 4   | Portmone's **payout period** — not publicly verifiable (§4.2)                                                                                              | Only if Branch D chosen | Client, via contract             |
| 5   | NP **«Контроль оплати» agreement terms** (payout frequency, register cadence, minimum volume) — disclosed only at business onboarding                      | TASK-049 COD rail       | Client                           |
| 6   | The 9 **prerequisites** in §5.3                                                                                                                            | The single gateway pick | Client (+ accountant for #7)     |

**A source tension worth recording rather than smoothing over:** WayForPay's commission page publishes a flat **2%**, while its own sales copy elsewhere says the rate is "set individually depending on your turnover." Both are WayForPay's words. We report 2% as the _published_ rate and flag it as negotiable — we did not average the two or pick the flattering one.

### 9.3 Decision log

Decisions taken in the 2026-07-16 brainstorming session, before research began — these framed the whole spike:

| #   | Decision                                                          | Rationale                                                                                                  |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Both rails in scope** — online card **and** NP COD              | COD is how a large share of UA customers buy; a card-only doc would have mis-scoped the whole v1.4 Track B |
| 2   | **Conditional recommendation**, not a single pick                 | Legal entity + bank are unknown and are the dominant variables                                             |
| 3   | **All three NP modes** (branch + postomat + courier)              | One API covers all three; scoping them together avoids a second spike                                      |
| 4   | Score **cards + wallets + installments**                          | Installments are a real UA conversion lever and support varies sharply — vindicated by finding #2 (§1)     |
| 5   | **Single UAH**                                                    | UA-only launch; all domestic settlement is legally UAH                                                     |
| 6   | **Multi-source + adversarial verification**, primary sources only | Vindicated: a **~29% dispute rate** on raw research, incl. two ownership errors and an inverted UUID       |
| 7   | **Decision + integration blueprint**, not a decision-only memo    | The task's stated output feeds TASK-048/049; §8 is that hand-off                                           |

**Decision 6 deserves a note for future spikes.** The initial research was fluent, confidently worded, and cited URLs — and was wrong on 42 of 120 claims, including several it marked high-confidence. Three of the four findings in §1 came from the verifier _contradicting_ the researcher, and one (the Fondy licence) inverts a candidate's viability entirely. Two failure modes recurred and are worth naming: **citing pages that were never actually loaded** (search-index snippets reported as sources — this produced the Fondy error), and **conflating adjacent-but-distinct products** (післяплата vs «Контроль оплати»; `paymentScheme` reporting vs the instalments product). Neither is detectable by reading the research alone; both were caught only by re-opening the primary source. **Do not author a launch-gating document from single-pass research.**

## Sources

Grouped by topic. **Primary sources** (official pricing, API docs, state registers) carry the claims; **corroborating sources** are named where they were used to cross-check, and never as the sole basis for a figure.

**LiqPay** — _primary:_ liqpay.ua/tariffs · liqpay.ua/information/terms · liqpay.ua/information/instructions/registration · liqpay.ua/information/handbook/activation · liqpay.ua/en/doc/api/callback · liqpay.ua/en/doc/api/internet_acquiring · liqpay.ua/en/doc/api/internet_acquiring/refund · liqpay.ua/en/doc/api/testing · liqpay.ua/methods/paypart · privatbank.ua/en/liqpay-oplaty · conditions-and-rules.privatbank.ua

**WayForPay** — _primary:_ help.wayforpay.com/view/3342384 (commission) · help.wayforpay.com/uk/view/3342386 (payouts) · help.wayforpay.com/view/13730003 (eligibility/docs) · help.wayforpay.com/view/1737806 (onboarding) · help.wayforpay.com/view/3342410 · help.wayforpay.com/view/962875452 (installment programs) · wiki.wayforpay.com/en/view/852102 · /852115 (refunds) · /852472 (test details) · wiki.wayforpay.com/view/852091. _Corroborating (entity register):_ clarity-project.info/edr/39626179 · youcontrol.com.ua

**Plata by mono (monobank / АТ «Універсал Банк»)** — _primary:_ monobank.ua/en/knowledge-base/acquiring/index (tariffs) · monobank.ua/en/knowledge-base/acquiring/signup (eligibility, onboarding, site checklist) · api.monobank.ua/docs/acquiring.html (spec v2410 — webhooks, refunds, `paymentScheme`, tokenization, sandbox) · monobank.ua/api-docs/chast (Покупка Частинами API) · monobank.ua footer (licensed entity). _Corroborating:_ umaef.org (Oct 2025 release) · en.wikipedia.org/wiki/Monobank\_(Ukraine) · forbes.ua (equity estimate — labelled as an estimate, not disclosed figures)

**Portmone** — _primary:_ business.portmone.com.ua/tariffs · business.portmone.com.ua/ecommerce · business.portmone.com.ua/installments · docs.portmone.com.ua/docs/en/PaymentGatewayEng · docs.portmone.com.ua/docs/en/PortmoneHostToHostEng · docs.portmone.com.ua/en/docs/en/APayEng · ir.kaspi.kz (2025 annual financial report — the disposal). _Corroborating:_ aimgroup.com (2026-03-17 report of the disposal)

**Fondy** — _primary:_ **bank.gov.ua/files/N_bank/217/RPI_lic_fin-payment_services.xlsx** (NBU Register of Payment Infrastructure — row 18, licence revocation 2024-07-22; downloaded 2026-07-17) · docs.fondy.io/_ and docs.fondy.eu/_ (**UK entity FONDY LTD** — technical claims only; not evidence about Ukrainian acquiring) · docs.fondy.io/gateway/test-gateway-payments (test currencies). ⚠️ _Unreachable:_ fondy.ua/\* — TCP timeout from our network; **no Ukraine-side tariff or eligibility claim could be sourced**.

**Nova Poshta** — _primary [live]:_ **`https://api.novaposhta.ua/v2.0/json/`** — `Address.getWarehouseTypes`, `Address.getWarehouses`, `InternetDocument.getDocumentPrice`, `CommonGeneral.getCargoTypes`, `getBackwardDeliveryCargoTypes`, `getTypesOfPayers`, `getServiceTypes` (behavioural verification). _Primary (docs/tariffs):_ novaposhta.ua/financial-services/money-transfer/to-sender (COD fee + 399,999 UAH cap) · novapay.ua/pisljaplata-na-rahunok (COD-to-account tariffs + timing) · novapay.ua/en/biznes-tarifi · novaposhta.userecho.com/knowledge-bases/2/articles/19-kontrol-oplati («Контроль оплати» eligibility) · api-portal.novapost.com (international API + webhooks). ⚠️ _Cloudflare-blocked:_ developers.novaposhta.ua — 403/530; this is why the live API was used instead.

**Legal / tax** — _primary:_ zakon.rada.gov.ua/laws/show/2755-17 (Tax Code — Art. 291.4, 293.3, 293.5) · zakon.rada.gov.ua/go/4695-20 (Law No. 4695-IX, State Budget 2026 — the 8,647 UAH minimum wage driving the 10,091,049 UAH Group 3 cap) · zakon.rada.gov.ua/laws/show/265/95-вр (RRO law). _Corroborating:_ i.factor.ua (ТОВ single-tax rate analysis). **Nothing in this section is legal or tax advice — see §5.3 item 7.**

**Currency** — _primary:_ NBU Board Resolution No. 115 of 08.09.2025 (cash rounding to 0/50 kopiykas from 2025-10-01, superseding Resolution No. 148/2019) · ISO 4217 (UAH / 980) · ДСТУ 3582:2013 (`грн` without trailing period)

## Acceptance-criteria coverage

| Criterion                                               | Section |
| ------------------------------------------------------- | ------- |
| Comparison matrix of ≥3 gateways with fees & API        | §4      |
| Recommended gateway + rationale; merchant prerequisites | §1, §5  |
| Nova Poshta scoped (API, branch picker, cost calc)      | §6      |
| UAH pricing strategy (single vs multi)                  | §7      |

All four criteria are satisfied. Sources are listed above, before this table.
