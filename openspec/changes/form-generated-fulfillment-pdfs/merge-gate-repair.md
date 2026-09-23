# Merge-gate repair detour

## Authorization and scope

The user approved baseline repairs before merging the PDF child PRs, including an ESLint-generated lockfile size exception. That exception does not cover handwritten code. Use auto-chain / feature-branch-chain, with each non-generated work unit at most 400 changed lines. PDF implementation remains preserved on its existing branches; this side chain starts from tracker `a01b276f`.

Do not waive failing tests or change established product behavior to satisfy stale assertions. Keep FAQ's real navigation bug separate from test maintenance. No database or deployment actions belong to this detour.

## Acceptance and tasks

- [x] m1: Repair four API test files (16 stale failures), preserving authorization, review-copy isolation, source/owner/creator rules, filter precedence and pricing rejection guards. No production changes.
- [x] m1b: Repair three stale UI assertions with semantic completion coverage and appropriate visual verification; do not replace banned CSS-class assertions with new class checks or unrelated value assertions.
- [x] m2: Separate optional FAQ navigation/submission eligibility from completion checkmarks; preserve existing partial-entry acceptance and required-field gates.
- [ ] m3: Repair Next 16 / ESLint compatibility and generated lockfile; retain meaningful rules and require zero lint errors/warnings.
- [ ] Final gate: full tests, typecheck and lint pass before eligible child merges. Keep unfinished feature tracker off main.

## Verified product contracts

- Blog detail routes fetch by ID, exclude review copies, then authorize owner or admin on RANDOMTRIP source. Test fixtures now exercise TRIPPER content reversion and real fetched non-owner denials, not merely missing rows.
- Admin-created experiences belong to the Randomtrip pseudo-user; `createdById` records the admin. Trippers cannot forge either identity or source.
- `3aa4195c` intentionally replaced the blog format filter with `level=xsed`, which takes precedence over travel type. Tests verify count/list predicates agree.
- Historical cleanup baseline: `a2239833` and its SPEC.md accepted mixed and XSED-only submissions at a flat $250 price; unknown types failed as unpriceable. Develop supersedes those submission assertions: legacy XSED traveler types return HTTP 422 (`incomplete`, `missing: ["type"]`); preserve its canonical XSED-level validation and newer unknown-level fixture.
- `08659e65` intentionally uses primary journey completion colors; `79c4dabe` changed form chrome to gray-100/transparent. m1b replaces completion assertions with localized accessibility behavior; explicit manual browser evidence covers TextArea visuals.
- Blog-review-flow spec requires only title, cover and content. Payload building drops fully blank FAQ rows but preserves partial entries; submit validation ignores FAQ. `isBlogTabEligible` now permits optional FAQ while `isBlogTabComplete` retains filled-entry checkmarks. Shell forward navigation and form Continue/final-submit use eligibility; no backend/payload/copy changes.

## TDD cycle evidence

| Task | Layer / safety net                                                | RED                                                                                                                                       | GREEN / triangulation                                                                                                                     | Refactor                                                                  |
| ---- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| m1   | Existing route tests; six-file baseline: 19 failed, 39 passed     | Reproduced 16 API fixture/expectation failures before edits                                                                               | Four API files: 54 passed; added four fetched-nonowner role/source cases and two filter variants; strengthened owner/creator/spoof checks | Scoped formatting only; 54 passed again; no production code changed       |
| m2   | Helper/shell-helper/submit baseline: 44 passed, known FAQ failure | New eligibility helper: six missing-function failures; real shell/content controls: three disabled-Next failures before production change | 31 passed after minimum fix; answer-only/filled FAQ and checkmark triangulation → 59 focused tests passed                                 | Scoped formatting only, 33 helper/UI tests passed again; full suite below |
| m1b | Sidebar/TextArea baseline: 7 passed, 3 known stale failures | Five missing-description failures; triangulation: four locale/disabled-description failures, then two disabled-key bubbling failures | 5 initial GREEN; 23 sidebar/TextArea passed after locale, precedence, opt-in, navigation and disabled-state cases | Deduplicated event helper, object-row completed-ID matrix; 32 focused passed after formatting |

m1 full `npm run test`: **1764 passed, 4 failed** across 237 files (234 passed). Remaining failures were the two sidebar completion assertions, one TextAreaInput chrome assertion and the FAQ completeness bug. Typecheck and diff checks passed. Baseline/full logs are local temporary evidence, not repository artifacts.

m2 full `npm run test`: **1779 passed, 3 failed** across 238 files (236 passed): only the deferred sidebar/TextAreaInput assertions remain. Typecheck, new-test Prettier and diff checks pass; existing files received scoped formatting only. Eight real-shell UI tests cover empty/default/partial/filled FAQs, retained checkmarks, Continue, submission confirmation, and title/cover/content blockers. One navigation-module mock plus a fail-closed fetch guard; no CSS assertions or external I/O. An initial test-table argument-spreading mistake was corrected and RED rerun before production edits. Lint remains m3; no merge-readiness claim.

m1b full `npm run test`: **1795 passed across 238 files**. Typecheck (`--incremental false`), test-file Prettier and diff checks pass; production edits are scoped. Actual JourneyPageClient supplies EN/ES completion labels; useId descriptions preserve existing precedence and visuals. No TextArea production edits. Add-ons are custom `role="button"` divs with `aria-disabled` and `tabIndex=-1`: synthetic Enter/Space reproduced parent navigation, now stopped before the disabled guard. This proves defensive event handling, not ordinary Tab reachability or assistive-technology behavior.

Independent browser verification (reviewed by the root agent) used actual TextAreaInput/FormField plus compiled project CSS: gray-100/transparent chrome, teal keyboard focus, original strike, empty italic placeholder and EN/ES accessible actions. Evidence: `/private/tmp/getrandomtrip-textarea-27jvHn/evidence/README.md` and `01-default.png` through `04-empty-original-peek.png`. Isolated system-font fixture, not full Next/authenticated layout or automated visual regression; server stopped. Value/count/toggle/placeholder/label tests remain, but do not claim to verify colors.

## Next boundary

Fresh-review m1b, then m3 lint tooling. The separate lint preflight found broader existing debt; do not waive rules or silently expand this repair. No merge-readiness claim until lint also passes.
