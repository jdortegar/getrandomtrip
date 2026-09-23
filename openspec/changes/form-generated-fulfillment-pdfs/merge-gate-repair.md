# Merge-gate repair detour

## Authorization and scope

The user approved baseline repairs before merging the PDF child PRs, including an ESLint-generated lockfile size exception. That exception does not cover handwritten code. Use auto-chain / feature-branch-chain, with each non-generated work unit at most 400 changed lines. PDF implementation remains preserved on its existing branches; this side chain starts from tracker `a01b276f`.

Do not waive failing tests or change established product behavior to satisfy stale assertions. Keep FAQ's real navigation bug separate from test maintenance. No database or deployment actions belong to this detour.

## Acceptance and tasks

- [x] m1: Repair four API test files (16 stale failures), preserving authorization, review-copy isolation, source/owner/creator rules, filter precedence and pricing rejection guards. No production changes.
- [ ] m1b: Repair three stale UI assertions with semantic completion coverage and appropriate visual verification; do not replace banned CSS-class assertions with new class checks or unrelated value assertions.
- [ ] m2: Fix optional FAQ navigation through test-first production repair; preserve nonempty FAQ validation.
- [ ] m3: Repair Next 16 / ESLint compatibility and generated lockfile; retain meaningful rules and require zero lint errors/warnings.
- [ ] Final gate: full tests, typecheck and lint pass before eligible child merges. Keep unfinished feature tracker off main.

## Verified product contracts

- Blog detail routes fetch by ID, exclude review copies, then authorize owner or admin on RANDOMTRIP source. Test fixtures now exercise TRIPPER content reversion and real fetched non-owner denials, not merely missing rows.
- Admin-created experiences belong to the Randomtrip pseudo-user; `createdById` records the admin. Trippers cannot forge either identity or source.
- `3aa4195c` intentionally replaced the blog format filter with `level=xsed`, which takes precedence over travel type. Tests verify count/list predicates agree.
- Historical cleanup baseline: `a2239833` and its SPEC.md accepted mixed and XSED-only submissions at a flat $250 price; unknown types failed as unpriceable. Develop supersedes those submission assertions: legacy XSED traveler types return HTTP 422 (`incomplete`, `missing: ["type"]`); preserve its canonical XSED-level validation and newer unknown-level fixture.
- `08659e65` intentionally uses primary journey completion colors; `79c4dabe` changed form chrome to gray-100/transparent. These visual-only stale tests are deferred, not silently weakened.

## TDD cycle evidence

| Task | Layer / safety net                                            | RED                                                         | GREEN / triangulation                                                                                                                     | Refactor                                                            |
| ---- | ------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| m1   | Existing route tests; six-file baseline: 19 failed, 39 passed | Reproduced 16 API fixture/expectation failures before edits | Four API files: 54 passed; added four fetched-nonowner role/source cases and two filter variants; strengthened owner/creator/spoof checks | Scoped formatting only; 54 passed again; no production code changed |

Full `npm run test`: **1764 passed, 4 failed** across 237 files (234 passed). Remaining failures are the two sidebar completion assertions, one TextAreaInput chrome assertion and the known FAQ completeness bug. `npm run typecheck` and `git diff --check` pass. Lint remains deferred to m3; no merge-readiness claim yet. Baseline/full logs are local temporary evidence, not repository artifacts.

## Next boundary

For m1b, expose localized completion status as genuine accessible text, retaining existing completion logic and click behavior; test raw-param defaults, true/false overrides and untouched siblings. Do not add test-only attributes or fake ARIA roles. Move cosmetic field-chrome checks to explicit browser visual verification rather than claiming value assertions cover colors. Detailed implementation needs its own bounded review.
