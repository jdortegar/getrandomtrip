# Local currency display — reference prices in the visitor's currency, charges in USD

Objective: let visitors see trip prices in their local currency as a display-only reference while every Stripe charge stays in USD.
Branch: `feat/local-currency-display` (from `develop`) · Delivery: `ask-on-risk` · Test runner: `npx vitest run <path>`.

## Specs

- **S1 — Display only.** "display-only, keep charging in USD". No Stripe change; Adaptive Pricing rejected (unsupported on Payment Intents API; ARS not supported).
- **S2 — Detection.** "auto-detection set the currency". Country from Netlify geo headers maps to one local currency. Selector offers only USD + detected currency ("a"); "for US hide the selector". Assumption: also hidden when the detected currency is USD or detection/rates fail.
- **S3 — USD primary.** "dollars will be always the primary option and when user select another currency we need a disclaimer of a toast saying prices are for reference, charges will be in dollars". USD is the default; selecting the local currency shows a toast.
- **S4 — Replace when selected.** "local price replace dollars when toogle is on" on browsing surfaces, prefixed with "≈".
- **S5 — Selector UI.** "lets use a dropdown in the navbar", "same style as the language selector". Mobile: pill next to the language pill in the drawer footer ("a").
- **S6 — Persistence.** Session cookie only ("b").
- **S7 — Scope.** Browse/booking surfaces convert. Checkout (incl. split share / top-up pay): USD primary + "≈ local" secondary + permanent disclaimer; ARS adds a card taxes/fees (percepciones) note ("b"). Post-payment, admin, tripper: USD only. ("agree")
- **S8 — Filters.** "a, converted values are just for display" — budget filter values and URLs stay USD; labels convert.
- **S9 — Rates.** Free API with ARS (open.er-api.com), server-side, 24h cache ("a"); on failure the selector hides and USD shows.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2, S9 | inline | done, verified | dc33cd6b |
| T2 | S3, S5, S6 | inline | done, verified | dc33cd6b |
| T3 | S4, S7, S8 | inline | done, verified | cf5a4aa7 |
| T4 | S7 | inline | done, verified | ec9e0b19 |

Route evidence: no Writer trigger — units depend on T1/T2 context; parent writes inline.

## Log

- **L1 (2026-10-29)** — User request: "I need that the user sees the trip prices in his local currency, maybe a toggle could work, does stripe can accept payment in multiple currencie, search docs, or we can leave dollars but in the checkout add a disclaimer that charges will be in dollars /grill-me". Design resolved via grill-me Q1–Q12 (see Specs).
- **L2** — Engram mirror pending: no Engram tools available in this session.
- **L3** — Test-first exception: T1 tests were written right after the code (no RED observed); T2–T4 assertions added alongside. USD text at every call site is preserved byte-for-byte (`formatPrice(usd, existingUsdLabel)`); existing suites unchanged.
- **L4** — S8 reality: no USD budget slider exists; the USD amounts in filters are the per-filter fee notes (`importantNote3/4`, `filterFeeLine`), converted via `formatPriceText`. `FiltersTab`/`FiltersPanel` have no importers and were left untouched.
- **L5** — Verification: `npm run typecheck` clean, `npm run lint` clean, `npx vitest run` 726 files / 7783 tests passed. Dev probe: `/api/currency` with `x-country: AR` → `{"local":{"currency":"ARS","rate":1539.593}}`; US and no header → `{"local":null}`. Browser UI QA (navbar/drawer/toast, 360px/1280px) not run: no `.env.local` for DB-backed pages. RDD off (global). Next: manual QA on a Netlify deploy preview, then PR to `develop`.
