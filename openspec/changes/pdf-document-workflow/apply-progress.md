# Apply progress

## U1 — Safe asynchronous save result
Draft requests return their server DTO only after the current response is adopted. Save accepts the generation-validated current document and returns its saved revision, enabling the next UI unit to render that revision rather than a stale closure.409 and stale edit/trip-switch completions return no result and preserve newer edits.

Baseline13hooktests; RED new save-result assertion failed; GREEN35tests/2suites. Nonincremental typecheck/scoped lint checked. Editor workflow and document synchronization remain next; no claim that UI redesign or contradictory list state is fixed yet. Existing feature history stays in form-generated-fulfillment-pdfs; new change records only approved workflow work.

## U2 — Authoritative attached-document synchronization and navigation
Added `useAttachedDocuments` with explicit ready/loading/error states, independent published-row refresh, response sequence guards, and required-linked-document checks retained across retries. Parent upload/remove updates invalidate old in-flight refreshes; publication refresh changes document rows only, never the editable trip snapshot. Linked draft discovery repairs the previously independent parent list. Refresh failures remain visible and retryable, including in the review dialog. Existing uploads stay behind a secondary disclosure.

The hub distinguishes private drafts from editable copies of attached documents. Published documents stay in the authoritative table above. New document opens explicit template/provider selection; no automatic draft mutation occurs simply by opening selection.

## U3 — Guarded edit/review workflow
Added focused list, picker, feedback, review and workflow hooks. One editor actionbar offers incomplete Save draft and validated Save & preview. The latter waits for the adopted server DTO and updated hook identity before rendering its revision. Failed/conflicting saves cannot render; editing/closing cancels pending render intents. Form-level preview submit actions are omitted in this context (standalone legacy actions preserved). Dialog Escape/outside-close and explicit close preserve dirty-confirmation behavior. Review returns to the editor or explicitly attaches/replaces exact reviewed bytes through the unchanged delivery hook. Replacement is confirmed; already-published preview cannot be republished from the same review action. Draft deletion is a confirmed overflow action, never an attachment deletion.

## U4 — Grouping, translations and verification
All five template forms now group document metadata, booking/route, provider and detailed content. Repeatable controls and path-aware validation remain unchanged. New copy exists in EN/ES. Modal surface explicitly carries fulfillment CSS variable scope: portaling otherwise lost `--ink`, making primary buttons invisible; root browser QA caught and verified the fix. Template selectors reuse FormSelectField, links Button, statuses StatusIndicatorBadge. Component files remain below300lines.

### TDD cycle evidence
| Unit | Safety net | RED | GREEN / triangulation | Refactor |
| --- | --- | --- | --- | --- |
| U1 |13 original hooktests|Save-result assertion failed before implementation|35tests/2suites; stale edit/trip switches and409 covered|Adopted DTO return contract retained|
| U2 |5 inherited hooktests,18 original paneltests passing|New required-link retry regression failed ready vs error|6hooktests; failed refresh preserves rows, trip switch/upload invalidate stale response, retry verifies required links|Extracted authoritative state and hub synchronization|
| U3 |18 original paneltests passed before workflow rewrite|New workflow tests written against nonexistent workflow labels/components before implementation|13paneltests: validated save-then-render revision, incomplete-save,409, inline422, dirty guards, ENES retry, exact Blob attachment, refresh failure/retry, confirmed replacement, draft-only delete|Split focused components and save-preview coordinator; removed duplicate submit|
| U4 |Original template/editor tests passed|Five grouped-editor scenarios added before grouping implementation|Five templates assert grouped sections and no duplicate submits; existing repeatable/field validation suite preserved|Reusable fieldgroup/submit-context, local dictionaries, portal token scope|

### Verification status
- Full test suite: initial350suites/3711testsPASS; final rerun after2additional regression tests pending recorded below.
- Nonincremental TypeScript: PASS before final rerun.
- Scoped feature ESLint: PASS before final rerun.
- Parent page retains its existing `react-hooks/set-state-in-effect` diagnostic on initial `loadTrip` effect; not a new feature diagnostic. No global lint-clean claim.
- Root fresh review: no blocking findings; root browser QA verified1280desktop and360mobile (body360/dialog328, no horizontal overflow), opaque editor and visible actions. Root is checking unchanged mock preview generation, no attach/delete.
- No commit, push, PR, schema, credentials or deployment change. Unrelated concurrent GeoWelcome edits left untouched.

### Review boundaries / next steps
U1 save contract; U2 synchronization hook+parent wiring; U3 focused picker/list/review/editor hooks; U4 per-template grouping slices+copy/regressions. Automatic feature-branch-chain remains selected; this run produces reviewed internal units only, not release PRs. Root should record live preview outcome, final command results, and any remaining QA limitation before closing verification.

### Final writer verification
- Full suite: **350 suites / 3,713 tests PASS**, `/private/tmp/pdf-workflow-full-tests.log`.
- Nonincremental TypeScript and scoped feature lint: **PASS**, `/private/tmp/workflow-typecheck.log`, `/private/tmp/workflow-scoped-lint.log`.
- Root browser QA: existing mock Activity Save & preview reached Review PDF with Back to editing / Attach. No actual attachment/deletion. Embedded PDF remains blank in IAB, the known browser limitation; do not claim PDF visual content verified here.
- Review stage scroll polish: wrote regression first (RED retained140px instead of0), then ref/effect resets stage scroll; GREEN13paneltests with edit→review and review→edit cases. `/private/tmp/workflow-scroll-red.log`, `/private/tmp/workflow-scroll-green.log`. No render-time DOM mutation.
- Root fresh reviewer reported no blocking findings. Final feature components ≤300lines (panel299). Publication/server/email contracts unchanged.
- Final two replacement/deletion fixture tests use explicitly typed DTOs; final nonincremental typecheck catches and resolves accidental literal-null fixture typing without production changes.
