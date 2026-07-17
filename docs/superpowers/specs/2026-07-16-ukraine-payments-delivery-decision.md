# Mirox Shop — Ukraine Payments & Delivery Decision

**Status:** Draft — research in progress
**Verified as of:** 2026-07-16
**Spec:** ./2026-07-16-ukraine-payments-delivery-design.md
**Feeds:** TASK-048 (gateway integration), TASK-049 (Nova Poshta integration)

> Every quantitative claim below cites a primary source with a "verified 2026-07-16" stamp. Claims that cannot be verified from public sources are tagged **[requires merchant confirmation]**.

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
