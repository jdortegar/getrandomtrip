# Local currency display — reference prices in the visitor's currency, charges in USD

Objective: let visitors see trip prices in their local currency as a display-only reference while every Stripe charge stays in USD.
Branch: `feat/local-currency-display` (from `develop`) · Delivery: `ask-on-risk` · Test runner: `npx vitest run <path>`.

## Specs

- **S1 — Display only.** "display-only, keep charging in USD". No Stripe change; Adaptive Pricing rejected (unsupported on Payment Intents API; ARS not supported).
- **S2 — Detection.** "auto-detection set the currency". Country from Netlify geo headers maps to one local currency. Selector offers only USD + detected currency ("a"); "for US hide the selector". Assumption: also hidden when the detected currency is USD or detection/rates fail.
- **S3 — USD primary.** *(Superseded by S10.)* "dollars will be always the primary option and when user select another currency we need a disclaimer of a toast saying prices are for reference, charges will be in dollars". USD is the default; selecting the local currency shows a toast.
- **S4 — Replace when selected.** "local price replace dollars when toogle is on" on browsing surfaces, prefixed with "≈".
- **S5 — Selector UI.** *(Superseded by S10: selector removed.)* "lets use a dropdown in the navbar", "same style as the language selector". Mobile: pill next to the language pill in the drawer footer ("a").
- **S6 — Persistence.** *(Superseded by S10: nothing to persist.)* Session cookie only ("b").
- **S7 — Scope.** Browse/booking surfaces convert. Checkout (incl. split share / top-up pay): USD primary + "≈ local" secondary + permanent disclaimer; ARS adds a card taxes/fees (percepciones) note ("b"). Post-payment, admin, tripper: USD only. ("agree")
- **S8 — Filters.** *(Superseded by S10: filter notes stay USD-only.)* "a, converted values are just for display" — budget filter values and URLs stay USD; labels convert.
- **S9 — Rates.** Free API with ARS (open.er-api.com), server-side, 24h cache ("a"); on failure the selector hides and USD shows.
- **S10 — Always-on reference line (2026-11-09).** "lets remove the currency selector and show the local currency next to the USD price like the example". USD stays the main price with "≈ $539.000 ARS" below it on main prices only ("a"): level/experience cards, journey summary totals, XSED summary, checkout total, share and top-up amounts. Add-ons and filter fee notes stay USD-only. Rounded to 3 significant figures ("b"); "$" currencies append the ISO code. "leave the prices in local currency are referencial notification in the toast" + "include it on country welcome notification if currency is not dollars": the home page welcome toast gets a currency-note line ("a": home page only).

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2, S9 | inline | done, verified | dc33cd6b |
| T2 | S3, S5, S6 | inline | done, verified | dc33cd6b |
| T3 | S4, S7, S8 | inline | done, verified | cf5a4aa7 |
| T4 | S7 | inline | done, verified | ec9e0b19 |
| T5 | S10 | inline | done, verified | see L7 |

Route evidence: no Writer trigger — units depend on T1/T2 context; parent writes inline.

## Log

- **L1 (2026-10-29)** — User request: "I need that the user sees the trip prices in his local currency, maybe a toggle could work, does stripe can accept payment in multiple currencie, search docs, or we can leave dollars but in the checkout add a disclaimer that charges will be in dollars /grill-me". Design resolved via grill-me Q1–Q12 (see Specs).
- **L2** — Engram mirror pending: no Engram tools available in this session.
- **L3** — Test-first exception: T1 tests were written right after the code (no RED observed); T2–T4 assertions added alongside. USD text at every call site is preserved byte-for-byte (`formatPrice(usd, existingUsdLabel)`); existing suites unchanged.
- **L4** — S8 reality: no USD budget slider exists; the USD amounts in filters are the per-filter fee notes (`importantNote3/4`, `filterFeeLine`), converted via `formatPriceText`. `FiltersTab`/`FiltersPanel` have no importers and were left untouched.
- **L5** — Verification: `npm run typecheck` clean, `npm run lint` clean, `npx vitest run` 726 files / 7783 tests passed. Dev probe: `/api/currency` with `x-country: AR` → `{"local":{"currency":"ARS","rate":1539.593}}`; US and no header → `{"local":null}`. Browser UI QA (navbar/drawer/toast, 360px/1280px) not run: no `.env.local` for DB-backed pages. RDD off (global). Next: manual QA on a Netlify deploy preview, then PR to `develop`.
- **L6 (2026-11-09)** — User change: "i want to change the current approach, lets remove the currency selector and show the local currency next to the USD price like the example". Grill-me answers: "a, leave the prices in local currency are referencial notification in the toast"; "include it on country welcome notification if currency is not dollars"; "a"; "b".
- **L7** — T5: selector, toast, cookie and add-on/filter conversions removed (files restored to `develop`); `LocalPriceApprox` added under main prices; welcome toast `description` = `geoWelcome.currencyNote`. Checks: typecheck clean, lint clean, `npx vitest run` 726 files / 7787 tests passed.
