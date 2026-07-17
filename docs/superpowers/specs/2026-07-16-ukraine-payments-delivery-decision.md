# Mirox Shop — Ukraine Payments & Delivery Decision

**Status:** Draft — research in progress
**Verified as of:** 2026-07-16
**Spec:** ./2026-07-16-ukraine-payments-delivery-design.md
**Feeds:** TASK-048 (gateway integration), TASK-049 (Nova Poshta integration)

> Every quantitative claim below cites a primary source with a "verified 2026-07-16" stamp. Claims that cannot be verified from public sources are tagged **[requires merchant confirmation]**.

## 1. Executive summary & recommendation

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

- Cost: **2% + 20 UAH** standard; **1% + 10 UAH** on a business contract — charged on the money-transfer leg. (Official NP page; behaviourally confirmed against the live API's `CostRedelivery`, which matched `0.02·N + 20` across all tested amounts.)
- Ceiling: **399,999 UAH** per single післяплата.
- Remittance: **same-day ("день у день") only with a NovaPay account**; **next business day** for all other banks. This is a cash-flow constraint, not a detail.
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

**WayForPay** — flat 2% per successful transaction, no fixed component, free onboarding, **no fee on refunds or hold cancellations**; individually set in some cases [help.wayforpay.com/view/3342384]. Settlement **UAH only** ("Відшкодування коштів доступне тільки у валюті гривня"), next banking day, banking days only [help.wayforpay.com/uk/view/3342386]. ФОП and ТОВ both standard tracks; ФОП needs виписка з ЄДР; ТОВ needs статут, наказ, protocol, bank statement, financial reporting [help.wayforpay.com/view/13730003]. Onboarding fully online in 6 steps with id.gov.ua / Diia.Signature and automatic activation [help.wayforpay.com/view/1737806]. Refunds full+partial via REFUND API, HMAC_MD5 signature [wiki.wayforpay.com/en/view/852115]. ⚠️ **Installments are the widest of any candidate — nine bank programs**: monobank «Покупка частинами», PrivatBank «Оплата частинами» + «Миттєва розстрочка», A-Bank ×2, Globus Bank, and others [help.wayforpay.com/view/962875452]. ⚠️ **Sandbox is weaker than claimed**: the primary source documents only _shared_ test merchant credentials (`test_merch_n1`), not a per-merchant sandbox [wiki.wayforpay.com/en/view/852472]. Widget requires no merchant PCI DSS certification [wiki.wayforpay.com/view/852091]. ⚠️ Entity: ТОВ ФК «ВЕЙ ФОР ПЕЙ», EDRPOU 39626179, registered 2015, share capital 65,500,000 UAH, status active, no reorganisation records [clarity-project.info/edr/39626179].

**Plata by mono (monobank / АТ «Універсал Банк»)** — 1.3% Ukrainian-issued / 2% foreign for internet acquiring; **0 UAH monthly**; no fixed fee. Marketing says "від 1,3%" but that wording appears **only in an SEO meta description** — every customer-facing surface states a flat rate, so "individually negotiable" is an unsourced inference [monobank.ua/en/knowledge-base/acquiring/index]. Settlement T+1 UAH **to a monobank business account — this is a hard prerequisite**, not a preference [same]. ФОП: any registered ФОП with an open monobank ФОП business account, no tax-group restriction in public docs. ТОВ: eligible with a monobank legal-entity account; self-service onboarding is ФОП-oriented, ТОВ routed via support [monobank.ua/en/knowledge-base/acquiring/signup]. Self-service connection under 10 minutes; approval ~10 minutes [same]. ⚠️ **Webhooks fire on every status change _except_ `expired`** — verbatim: "окрім статусу `expired`". An invoice that simply lapses (24 h default validity) **never** produces a callback and must be polled or timed out locally [api.monobank.ua/docs/acquiring.html]. Refunds full+partial via `POST /api/merchant/invoice/cancel`, asynchronous with its own status lifecycle [same]. ⚠️ **Installments are not available through the acquiring API**: `paymentScheme` (incl. `bnpl_parts_4`) exists **only in response schemas** — a merchant can observe which scheme a buyer used but cannot offer BNPL. The real product is a **separate API, «Покупка Частинами»** (`/api-docs/chast`; `/api/order/create|state|confirm`), **3–25 instalments**, and **the merchant pays the commission** ("комісію сплачує магазин") [monobank.ua/api-docs/chast]. ⚠️ Recurring: "Токенізація недоступна за замовчуванням" — must contact support to enable [api.monobank.ua/docs/acquiring.html]. Hosted redirect to `pay.mbnk.biz` keeps SAQ-A scope. Ownership: licensed entity is АТ «Універсал Банк», NBU licence №92, TAS Group; monobank is a brand, not a separate bank [monobank.ua footer]. **⚠️ Launch-gating eligibility item the research missed: monobank's internet-acquiring checklist requires a Ukrainian-language version of the site**, an About/offer section, contacts, and products with photo/description/price.

**Portmone** — 2% per successful card payment for internet shops; **BankPay (bank-app/QR) 1%**; no connection or monthly fee; individual rates offered above ~500,000 UAH/month turnover [business.portmone.com.ua/tariffs]. ❓ Settlement: UAH-only payout confirmed, but the **payout period is not settleable from public sources** [business.portmone.com.ua/ecommerce]. ФОП («Самозайняті особи» is a listed merchant category) and ТОВ both eligible; no tax-group restriction published [business.portmone.com.ua/tariffs]. **Onboarding 3–10 business days** — by far the slowest candidate; requires KYC/AML financial monitoring and a signed cooperation agreement [business.portmone.com.ua/ecommerce]. Webhooks: S2S POST on completion; H2H async notifications (`mode=1111`) in XML BILLS / XML PAY_ORDERS / JSON [docs.portmone.com.ua/docs/en/PortmoneHostToHostEng]. Refunds full+partial via `return`; requires original in PAYED status; **processed only after the operational day closes** [docs.portmone.com.ua/docs/en/PaymentGatewayEng]. ⚠️ Apple/Google Pay supported with official guides, **but Portmone ships no native iOS/Android SDKs** — its guides direct developers to Apple's own PassKit framework [docs.portmone.com.ua/en/docs/en/APayEng]. Installments: «Оплата частинами» aggregating 6 bank programs (monobank 3–25 payments buyer-fee 0%, PrivatBank 3–24, Oschadbank, PUMB, OTP…) [business.portmone.com.ua/installments]. Sandbox exists but is **enabled by account-manager request, not self-service** [docs.portmone.com.ua/docs/en/PaymentGatewayEng]. ⚠️ **Ownership changed: Portmone is no longer a Kaspi.kz subsidiary.** Kaspi.kz disposed of the Portmone payments service in **September 2025**, deconsolidating the Ukrainian asset, per Kaspi.kz's own 2025 annual financial report. Any source describing Portmone as Kaspi-owned is stale.

**Fondy — ⚠️ DISQUALIFIED pending proof of a licensed route.** The NBU's own machine-readable Register of Payment Infrastructure (`RPI_lic_fin-payment_services.xlsx`, bank.gov.ua, downloaded 2026-07-17) lists at row 18: **ТОВ «ФК "ЕЛАЄНС"», EDRPOU 38905834, licence 21/778-рк issued 2023-04-30, «Дата відкликання» (revocation date) = 2024-07-22.** There is no verified licensed Ukrainian entity behind "Fondy Ukraine acquiring," and no Fondy/Елаєнс entry was found in the NBU commercial-agents register. A secondary source claims Fondy "resumed under partner-bank licences"; that could **not** be confirmed from any primary source and is not treated as established here.

Two compounding problems make Fondy's Ukrainian numbers unusable rather than merely unverified:

1. **`fondy.ua` is unreachable at the TCP layer** from this environment (curl times out with 0 bytes — not an HTTP error). Every Ukraine-side claim in the original research was attributed to pages the researcher **never actually loaded**, read from search-index snippets instead. Search snippets are not primary sources; this is precisely the gap that produced the ownership error.
2. **`docs.fondy.io` documents the UK entity** (FONDY LTD, FCA-authorised EMI). Its technical claims verified well — webhook retry back-off is exactly 2/60/300/600/3600/86400 s, reversal semantics, `pay.fondy.eu` hosted-checkout pattern, `/api/recurring` token flow all match — but that is **evidence about the UK operation and says nothing about Ukrainian acquiring**. Its UK pricing (£0.2/€0.2 + from 0.9%) is not a Ukrainian tariff.

⚠️ Also: the Fondy sandbox publishes test currencies **GBP, EUR, USD, PLN, CZK — no UAH**, so a UAH checkout could not be exercised end-to-end pre-launch even if licensing were resolved [docs.fondy.io/gateway/test-gateway-payments].

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
