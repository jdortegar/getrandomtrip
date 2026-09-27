# Launch audit — 27 September 2026

## Decision: do not sign off on launch yet

The initial audit found verified security, booking, payment-consistency, and date-handling defects. The source fixes below are implemented and independently reviewed locally; the final regression suite passes **430 files / 4,379 tests**. This is **not launch sign-off**: Stripe's blank card fields remain unexplained, successful transactional E2E is incomplete, and the deployed release has not been verified against these changes.

Baseline: `develop` at `8b00b997`. Browser: local development server on port 3010, plus canonical production at `https://getrandomtrip.com`. Deployed commit identity was not verified. Findings describe current behavior, not regressions attributed to a particular commit.

## Changes made during this audit

The two calendar fixes explicitly requested during testing were implemented first:

- Capitalize the first character of localized month captions and accessible grid labels.
- Fit all seven calendar columns inside the padded card on mobile; preserve navigation, date callbacks and range highlighting.

Changed implementation: `src/components/journey/JourneyDatesPicker.tsx`; regression coverage: `src/components/journey/__tests__/JourneyDatesPicker.test.tsx`.

Browser proof: at 360px, the previous 294px grid extended to x=343 beyond its card. The corrected grid is approximately 262px and ends at x=311, inside the card. Sunday 11 October is fully visible/selectable and highlights the 11–13 October range. At 1280px, both grids are 308px wide and contained; neither viewport has document-level horizontal overflow. Spanish captions show `Septiembre`/`Octubre`; English capitalization is covered by regression tests.

The audit and local remediation did not deploy the application, complete a payment, or create an account. The initial audit was read-only apart from browser-local drafts/consent. During the subsequent authorized test-payment workflow, opening checkout changed one disposable unpaid trip to PENDING_PAYMENT. Private test-account details are omitted from this public report.

### Local remediation status

The findings below retain **pre-fix evidence and line references**, not current-source assertions.

| Work unit                                                                  | Status / proof                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Buyer lifecycle authorization                                              | Fixed: enum validation, privileged-status denial, payment/version guards including status-only edits; legitimate admin flow retained.                                                                                                                                                                                                |
| Public experiences                                                         | Fixed: explicit public field allowlist, published originals only; authenticated settings endpoint retains draft counts.                                                                                                                                                                                                              |
| Pre-reveal trip visibility                                                 | Fixed: shared reveal-aware DTO across create/list/detail and defensive dashboard rendering. Existing intentional CANCELLED visibility is preserved for refund evidence.                                                                                                                                                              |
| Security verification                                                      | 182 focused tests and typecheck passed; fresh independent review found no issues and independently passed 77 tests. No real PostgreSQL concurrency proof.                                                                                                                                                                            |
| Scratch scrolling / CSS purity                                             | Fixed: body locks only for an actually displayed scratch gate; global body selector moved from the CSS module to global CSS. Isolated webpack recheck no longer reports CSS purity failure; browser pre-reveal detail has no scratch lock.                                                                                           |
| Payment consistency / ownership                                            | Fixed: atomic approval and booking transition, legacy repair, owner check before fallback, and consistent TripRequest → Payment lock order. Fresh re-review found no issues.                                                                                                                                                         |
| Payment result                                                             | Server approval plus confirmed booking now required for celebration, purchase tracking, and paid totals. Browser missing-reference route shows an explicit error/dashboard link, not success.                                                                                                                                        |
| Payment readiness                                                          | Fixed: loading, disabled Pay before readiness, 20-second load failure, and retry with a fresh loader after rejection. Browser verified readiness/error safeguards; independent re-review found no issues. **Underlying blank Stripe fields remain unresolved.**                                                                      |
| Payment verification                                                       | Initial independent 95 tests across 10 suites; corrected follow-up passed 94 writer tests and 63 independent tests. Neutral localized result metadata/eyebrow also verified. No card payment completed.                                                                                                                              |
| Date eligibility / display, English UI, fabricated ratings, media and docs | Fixed: UTC +7-day ordinary journey validation (XSED retains its own policy), UTC dashboard/detail/deadline dates, EN planner/card subtitles, removed fabricated rating, real-only hero sources, canonical docs. Initial 217 tests pass under UTC−3; independent P2 review passed 122 tests with no findings.                         |
| Invalid-date recovery                                                      | Fixed: separate machine-readable error code maps to EN/ES copy and a localized dashboard link instead of futile Retry. 66 writer tests and 15 independent tests pass; review clear. No automatic rescheduling.                                                                                                                       |
| Next page export contract                                                  | Removed the unsupported journey page helper re-export and extracted six helper exports from four API routes. Added an export-name guard over all 212 Next entrypoints. Fresh reviews found no issues; preserved Next-generated contract validation passes. Cron auth/handler and upload logic were independently verified unchanged. |

Browser rechecks confirmed Oct 3 (+6 days) disabled and Oct 4 (+7 days) enabled on September 27, retained 360px calendar containment, English planner and all six card subtitles, dashboard calendar-date rendering, and a CONFIRMED card showing only “Surprise Destination.” Reloading the authorized stale checkout now rejects departure eligibility and offers no Pay button; the trip was not rescheduled. Checkout no longer displays the fabricated rating and requests only the existing MP4 hero source.

The adjacent trip-detail regression now shows the same departure/return dates in hero and details; the companion deadline no longer shifts one day earlier. Fresh review passed six focused tests with no findings. Browser verified both localized invalid-date messages and recovery links, plus neutral “Payment status” result metadata. These checks do not establish whole-site localization or visual completeness.

## Original P1 findings — locally remediated

### 1. Buyers can set privileged booking statuses

**Evidence:** independent static reviews of `src/app/api/trip-requests/route.ts:120–121,380–406`.

The authenticated owner may submit a status-only update such as `CONFIRMED` or `REVEALED`. Status is copied directly from the request; pricing/party guards do not run for a status-only update. Ownership is not authorization for these lifecycle transitions. Creation also accepts a caller-supplied status.

**Impact:** premature confirmation/reveal and access to status-gated fulfillment. This does not settle or modify a Payment record; it is not proof of a free successful payment.

**Required proof after fixing:** ordinary buyers cannot set privileged statuses; payment/reveal transitions occur only through authorized server workflows. Test both creation and update.

### 2. Anonymous experience API exposes private fields and active drafts

**Evidence:** `src/app/api/experiences/route.ts:24–47`; full scalar serialization; private fields in `prisma/schema.prisma:401–402`.

GET has no authentication check. An active-owner/tripper filter does not enforce publication status, and complete records contain `adminNotes`, `supplierNotes`, itinerary and destination fields when populated. DRAFT records can also be active.

**Required proof:** explicit public response allowlist, published-only public query, and regression tests proving private fields/drafts are absent. No live exploitation or private-data enumeration was performed.

### 3. Surprise destinations are disclosed before reveal

**Evidence:** static verification plus a local browser reproduction: a CONFIRMED traveler dashboard card shows its destination while still offering a countdown.

- `src/app/api/trip-requests/route.ts:263–279` serializes the complete linked experience before reveal.
- `src/app/api/trips/route.ts:64–69,96–112` exposes `actualDestination` (this endpoint does not load itinerary).
- `src/app/api/trips/[id]/route.ts:82–89` removes itinerary but retains destination fields.
- `src/components/app/dashboard/traveler/UpcomingTripsList.tsx:108` and `TravelerTripsTable.tsx:197–198` render destination without a reveal-status condition.

**Required proof:** apply one server-side visibility policy to every traveler list/detail response and ensure dashboard cards obey the same policy. Test buyer and companion access before and after reveal.

### 4. Payment approval and booking confirmation can partially commit

**Evidence:** `src/lib/db/payment.ts:239–258`, with terminal-payment early return at `208–214`; independently reviewed call sites and tests.

Payment is updated to APPROVED before a separate trip-confirmation update. If the latter fails, retries see the terminal Payment and return without repairing the trip. Existing duplicate/race tests do not cover a failure between these writes.

**Impact:** a charged customer can retain an unconfirmed booking.

**Required proof:** atomic transition or an idempotent repair strategy; inject a failure between approval and booking confirmation and verify retry recovery without duplicate fulfillment.

## P2 findings — functional and UI gaps

| Finding                                              | Reproduction / evidence                                                                                                                                                                                                                                                              | Source                                                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Past departures accepted despite seven-day hint      | On 27 September, the picker accepted 26–28 September and enabled Next. No role exemption; ordinary journey save/checkout lacks corresponding minimum-date validation. No booking submitted.                                                                                          | `JourneyDatesPicker.tsx` selection handler/DayPicker props; `src/lib/helpers/journey.ts:486–487`; `src/app/api/trip-requests/route.ts:67–71,190–214` |
| Payment-success screen does not require success      | Processing/PENDING or failed summary retrieval retains success heading/confetti; any returned summary shows total paid. Missing intent can leave indefinite placeholders. Static verification only.                                                                                  | `src/app/[locale]/(secure)/checkout/CheckoutResultSuccess.tsx:72–74,109–134,184–192,262–268`                                                         |
| Departures display one day early in UTC−3            | Pending-trip rows displayed one day before the date encoded in their edit URLs; reproduced with multiple dates. ISO midnight UTC is formatted in browser-local time.                                                                                                                 | `src/components/app/dashboard/UnpaidTripsAlert.tsx:29–30,112–118`; same pattern in `UpcomingTripsList.tsx:84–87`, `TravelerTripsTable.tsx:170–173`   |
| English tripper planner contains Spanish UI          | `/en/trippers/david` has English navigation but Spanish planner headings, country/city labels and CTA. Excludes the biography, which is user-provided content.                                                                                                                       | `src/components/tripper/TripperPlanner.tsx:100–101,109,150–177,191`                                                                                  |
| English traveler-card subtitles stay Spanish         | English card names coexist with Spanish descriptions.                                                                                                                                                                                                                                | `src/lib/data/traveler-types/index.ts:184–213,226–234`                                                                                               |
| Hardcoded rating/review counts                       | Journey shows `7.0 (10)` regardless of product; checkout duplicates it.                                                                                                                                                                                                              | `src/components/journey/JourneySummary.tsx:250–251`; `src/app/[locale]/(secure)/checkout/page.tsx:424–425`                                           |
| Deployed legacy Spanish route returns 404            | Production `/packages` returned 404 twice. Local and production `/en/packages` correctly redirect; destination group catalogs return 200. Deployment root cause is not established.                                                                                                  | `next.config.js:34–37`                                                                                                                               |
| Documented Netlify alias differs from canonical site | Alias homepage serves an older response; its `/en` and `/experiences` return 404. Canonical custom domain serves these paths.                                                                                                                                                        | `README.md:4`; `AGENTS.md:13`; canonical source `src/lib/seo/urls.ts:4–6`                                                                            |
| Stripe element loading has no recovery state         | In the in-app browser, Stripe fields stayed blank through a reload. Pay Now was enabled; an empty-card submission remained Processing for over two minutes. No card was entered. The frame-loading cause is unproven; missing app-side readiness/error recovery is source-confirmed. | `src/components/app/checkout/StripePaymentForm.tsx:147–177`; `CheckoutContactCard.tsx:344–389`                                                       |
| Checkout requests a missing WebM video               | Active Chrome console reports `/videos/hero-video-1.webm` 404. The hero derives the WebM path from an MP4 path without checking whether the companion asset exists. MP4 fallback exists; this is not evidence that all hero video playback fails.                                    | `src/components/journey/HeaderHero.tsx:118`                                                                                                          |

## Authorized test-payment E2E follow-up

**Status: incomplete; no successful or declined card payment has been tested.** Testing was explicitly authorized for one disposable unpaid trip with Stripe test cards and resulting booking emails. Unrelated trips and contact fields were not edited. This public report excludes account identifiers, provider identifiers, profile values, trip dates, and amounts.

| Check                          | Evidence / result                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment environment            | Both configured Stripe keys are TEST; webhook signing configuration is present. No secret values are included.                                                                                                |
| Scoped baseline                | One disposable SAVED trip and one existing PENDING payment; no settlement or webhook evidence.                                                                                                                |
| Checkout initialization        | Summary and prefilled contact fields load. Trip becomes PENDING_PAYMENT; original pending payment/intent and amount are retained. Profile-field comparisons show no value changes.                            |
| Original card form             | Stripe accessory/easel frames remain blank and approximately 2px high, including after reload. No card fields were available.                                                                                 |
| Original empty-card validation | Pay was enabled before readiness; an empty submission stayed Processing without recovery during the observed two-minute window. No card was entered. This missing readiness guard has now been fixed.         |
| Post-attempt database check    | One original trip/payment, PENDING_PAYMENT/PENDING, same intent, and no settlement or webhook evidence. Profile values remain unchanged; an earlier profile-save attempt advanced the owner update timestamp. |
| Browser compatibility          | The blank frame reproduced in an authenticated native Chrome session as well as the embedded browser. No credentials were extracted and no Pay action was performed in the native-browser retry.              |
| Post-fix stale checkout        | The stale departure now fails server-side validation before payment initialization. Localized recovery directs the user to review dates; no trip was rescheduled to bypass the guard.                         |

This is **not proof of a production Stripe outage**. Environment versus integration root cause remains unresolved. No authored Stripe-blocking CSP or global Stripe-frame CSS was found, but effective runtime headers and network delivery are not established. The missing readiness/load-error handling is fixed; the blank-field cause is not.

Stripe diagnostics contained advisory messages about API generation, HTTP/wallet/domain requirements, and unsupported disabled-style properties, not a demonstrated fatal card error. An Elements instance count of two alone does not establish a mismatch. The existing TEST intent remains `requires_payment_method`, with card enabled and no last payment error; scoped retrieval with configured test credentials succeeded. Runtime key fingerprint comparison matched. Removing custom appearance/fonts in a controlled A/B did not restore fields; original appearance was restored.

Post-guard database inspection still shows one original pending payment and unchanged profile values. Update timestamps advanced during earlier checkout initialization, so the records are not claimed unchanged across the entire test interval. Private redacted evidence is retained locally and is not part of this repository.

**Still required:** decline/retry, 3DS, successful payment, persisted APPROVED/CONFIRMED state, real concurrent duplicate/replay behavior, signed webhook delivery, and email delivery. Client confirmation alone does not prove webhook delivery because fallback and webhook share settlement. Test-mode settlement still invokes real booking email paths; a safe email sink is preferable. Post-commit email delivery is not durable without an outbox/retry mechanism.

## Quality gates and build limits

| Check                                             | Result                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline TypeScript                               | PASS                                                                                                                                                                                                                                                                                                                          |
| Baseline Vitest                                   | PASS: 415 files, 4,259 tests                                                                                                                                                                                                                                                                                                  |
| Baseline repository lint                          | FAIL: 51 errors, 10 warnings across 46 files; predominantly React set-state-in-effect rules                                                                                                                                                                                                                                   |
| Calendar focused tests                            | PASS: 10 tests across picker/details tests; regression red-to-green verified                                                                                                                                                                                                                                                  |
| Calendar TypeScript/scoped lint/format/diff check | PASS                                                                                                                                                                                                                                                                                                                          |
| Final regression after both calendar fixes        | PASS: 416 files, 4,263 tests; full TypeScript and scoped ESLint pass; independent diff review found no actionable defects                                                                                                                                                                                                     |
| Default production build                          | INCONCLUSIVE: isolated no-credentials build remained in compile and was stopped after 5m13s; no app-specific failure reported by Turbopack                                                                                                                                                                                    |
| Webpack diagnostic build                          | FAIL: CSS-module purity error at `src/components/app/dashboard/traveler/traveler-trip-details.module.css:698` (`:global(body.rt-scratch-locked)`), plus environmental Google Fonts DNS failures                                                                                                                               |
| Final remediation regression                      | PASS: **430 files / 4,379 tests**; full nonincremental TypeScript and diff check pass                                                                                                                                                                                                                                         |
| Final scoped lint                                 | Initial 68 changed TS/TSX files: 5 errors / 1 warning, all reproduced pre-existing effect/dependency sites. Later page/route contract batches pass scoped lint; no new scoped violations                                                                                                                                      |
| Remediation webpack diagnostic                    | Final isolated Node 24.19 webpack compilation and Next TypeScript validation PASS after CSS/export fixes and approved font-fetch access. Full build stops at page-data collection: the intentionally credential-free snapshot has no DATABASE_URL, so Prisma cannot initialize. This is NOT a complete production-build pass. |

The original webpack CSS error was real for that bundler and is now fixed. Initial scratch-build dependency symlink limitations were isolated tooling problems. Diagnostic builds used copied dependencies, no `.env` files/inherited credentials, and separate `.next` output; the development server was not stopped. The initial audit used Node 25.9.0; final remediation checks used bundled Node 24.19.0. Netlify specifies Node 20. A complete build with the production runtime and approved environment configuration remains required; no fake database or live credentials were added to bypass this boundary.

## Coverage and limits

### Executed

- 102 GET/HEAD checks (100 unique method/URLs) across local and canonical production: public ES/EN pages, sampled tripper/blog details, legal pages, known redirects, anonymous auth responses, robots/sitemap, and 20 asset checks. No sampled 500 responses.
- Real-browser inspection of local landing/catalog, journey origin/date controls, mobile/desktop calendars, tripper directory/profile, English language navigation, traveler dashboard, and English XSED countdown/closed-sale state.
- Mobile journey preferences: the first optional filter stays free; adding another updates the per-traveler surcharge and total correctly. Local draft only; final journey Pay CTA not executed.
- Production anonymous waitlist, consent dismissal, login modal and empty-login/invalid-empty-recovery validation at desktop/mobile. No credentials or recovery emails submitted.
- Initial console checks showed no JavaScript errors; local Next image warnings about sizing were observed. The active-Chrome checkout follow-up additionally exposed the missing WebM request and Stripe advisory/style warnings described above.
- Independent read-only confirmation of the five highest-risk code findings.

### Not certified

- Completed registration, email verification/recovery delivery, OAuth callback, isolated buyer/companion/tripper/admin permissions matrix.
- Full journey-to-paid-booking, payment decline/3DS/processing/refund, webhook delivery/retry, inventory races, fulfillment uploads/downloads, and operational email delivery.
- Whole-site visual/a11y audit, every breakpoint/browser, complete asset/link crawl or performance benchmark. Browser inspection used the existing local privileged session for authenticated reads; it does not prove ordinary-user authorization.
- A production-equivalent successful build or deployment SHA parity.

No dedicated maintained browser E2E script/config was found. Vitest uses happy-dom, not a real-browser E2E runner. Browser binaries/transitive automation packages alone do not establish E2E coverage.

### Important environment boundaries

Production still displays the intentional waitlist gate. Both local/custom-domain checks report `gateEnabled=true`, `noindex,nofollow`, and an empty sitemap. This is a launch decision/checklist item, not a defect to silently bypass. English blog API currently contains no articles, a content-readiness gap.

Opening valid checkout itself creates/reprices a Stripe intent and Payment; the final journey checkout CTA can save/reuse the latest active TripRequest, even with a fresh draft ID. The initial read-only audit stopped before these actions. The follow-up used only the explicitly authorized existing disposable trip, verified test keys, and acknowledged email effects. A disposable staging database and safe email sink remain preferable for repeatable broad transactional testing.

## Evidence and next steps

Final remediation evidence: `batch-freeze-gate-results.json`, `batch-freeze-build-webpack-node24.log`, and the generated-contract/typecheck logs under `/private/tmp/getrandomtrip-launch-20260927/`. Independent review covered security, P2 UI/date behavior, payment recovery/locking, and framework export fixes.

Raw initial audit logs: `/private/tmp/getrandomtrip-launch-20260927/`. HTTP summary and responses: `http/summary.json`, `http/verified-results.json`. These temporary evidence paths may be cleaned by the operating system; durable findings are preserved in this report and project memory.

1. Resolve the blank Stripe fields in the target runtime, then use explicitly approved future-dated disposable data for decline/3DS/success/webhook/email E2E.
2. Resolve existing repository lint debt and obtain a full production-runtime build with approved database/environment configuration and deployment settings.
3. Review and deploy the local fixes through the normal release process; verify release SHA and production `/packages` redirect parity.
4. Repeat a non-destructive deployed smoke test and confirm the authorized gate/indexing transition only after release acceptance.
