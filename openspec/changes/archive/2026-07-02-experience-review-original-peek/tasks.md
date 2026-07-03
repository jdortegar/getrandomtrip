# Tasks: Per-Field "Peek at Original" in Tripper Review-Copy

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 220–320 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Single-concern, additive change (opt-in `peek` prop, 3 fields, ~9 files). Most edits are small (new prop, a few JSX lines); no schema/migration. Splitting would fragment a tightly-coupled data flow (page → client → shell → content → step) with no independent shippable slice.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full feature (Phases 1–6) | PR 1 (base: main) | No natural split point; ship as one PR |

---

## Phase 1: Foundation — i18n

- [x] 1.1 Add `changedFieldsBanner.peekShowOriginal`, `peekShowSuggestion`, `noContent` to `src/lib/types/dictionary.ts`
- [x] 1.2 Add the same keys (es copy) to `src/dictionaries/es.json`
- [x] 1.3 Add the same keys (en copy) to `src/dictionaries/en.json`

## Phase 2: FormField peek capability (TDD)

- [x] 2.1 RED — write failing tests for `FormField`: toggle swaps value + `line-through`, empty original shows placeholder, no button when `type="password"`
- [x] 2.2 GREEN — export `FieldPeek` interface; add `peek?: FieldPeek` prop, toggle button, `displayValue`/`line-through`/placeholder swap in `FormField.tsx` (design.md interface + composition)
- [x] 2.3 REFACTOR — clean up conditional className composition; confirm other `FormField` call sites unaffected

## Phase 3: TextAreaInput peek capability (TDD)

- [x] 3.1 RED — write failing tests for `TextAreaInput`: same swap/placeholder behavior, char count reflects displayed value
- [x] 3.2 GREEN — wrap `<textarea>` in `relative` div; add `peek?: FieldPeek`, top-right toggle button, same swap logic in `TextAreaInput.tsx`
- [x] 3.3 REFACTOR — dedupe swap/placeholder logic with `FormField.tsx` if a natural shared helper emerges

## Phase 4: originalDraft data flow

- [x] 4.1 `review-copy/page.tsx`: build `originalDraft` from `original`, mirroring the existing `copyDraft` construction; pass to client
- [x] 4.2 `TripperReviewCopyClient.tsx`: accept and thread `originalDraft` prop
- [x] 4.3 `NewExperienceShell.tsx`: accept and thread `originalDraft` prop

## Phase 5: Peek state + step wiring (TDD)

- [x] 5.1 RED — write failing unit test for `makePeek` eligibility: returns `FieldPeek` only when field is in `changedFieldSet` and `originalDraft` is defined; empty original yields placeholder
- [x] 5.2 GREEN — `ExperienceFormContent.tsx`: add `peekedFields: Set<string>` state, `togglePeek`, `makePeek(field)` helper; pass `peek={makePeek}` to `AboutExperienceStep`
- [x] 5.3 `AboutExperienceStep.tsx`: accept `peek` prop; wire into `title`/`teaser`/`description` `FormField`/`TextAreaInput` calls

## Phase 6: Regression & Quality Gate

- [x] 6.1 Run full `FormField`/`TextAreaInput` test suites; confirm the ~20 other call sites render unchanged (no `peek` prop passed)
- [x] 6.2 Run `npm run typecheck`
- [x] 6.3 Run `npm run lint` — BLOCKED: pre-existing repo-wide tooling breakage, unrelated to this change (see Issues Found)
- [x] 6.4 Manual QA: performed live by the user on the real review-copy screen. Found and fixed 4 real bugs the automated apply/verify pass couldn't catch: peek toggle unclickable inside `<fieldset disabled>`, TinyMCE controlled-value swap silently overwriting the admin's edit, sticky bar rendering behind the site navbar, and both approve/reject buttons sharing one loading flag. See design.md → "Post-Verify Extensions" for the full account.

## Phase 7: Scope Extension — Nested Lists, RichTextInput, Sticky Actions (post-verify)

Driven directly by user QA on the shipped feature — see design.md → "Post-Verify Extensions" for the technical account of each item.

- [x] 7.1 `experience-form-peek.ts`: add `resolveEntryPeek<Entry>()` for per-index, per-field peek eligibility on array entries (diff key + original entry + current value)
- [x] 7.2 `LogisticsAccommodationStep.tsx`: wire peek + per-field amber ring on `hotelName`, `hotelLink`, `referredLink`; remove the old whole-card ring
- [x] 7.3 `ActivitiesListStep.tsx`: wire peek + per-field ring on `name`; layout fix (hotel name full-width row, link fields on their own row)
- [x] 7.4 `field-peek.tsx`: convert toggle from native `<button>` to `<span role="button" tabIndex={0}>` — native buttons are disabled by an ancestor `<fieldset disabled>` regardless of their own `disabled` state
- [x] 7.5 `RichTextInput.tsx`: add peek support via a static `dangerouslySetInnerHTML` preview (editor unmounts while peeking) instead of a controlled-value swap, after the TinyMCE write-back corruption was found; wire `description`/`risks` in `ActivitiesListStep.tsx`
- [x] 7.6 Fix peek toggle visibility (`z-10`, positioned outside TinyMCE's own DOM) and tooltip clipping (rounding/`overflow-hidden` moved to the inner content box, not the outer wrapper holding the tooltip)
- [x] 7.7 `ReviewActionsBar.tsx` (new): sticky bar combining the changed-fields summary and approve/reject actions, offset below the site navbar via `var(--rt-header-h, 64px)`; remove the old per-tab banner and bottom-of-tab actions from `ExperienceFormContent.tsx`
- [x] 7.8 `TripperReviewCopyClient.tsx`: replace shared `saving` boolean with `pendingAction: "approve" | "reject" | null` so only the clicked button shows its spinner
- [x] 7.9 Added regression tests: `resolveEntryPeek` (5 cases), `RichTextInput` peek (4 cases, including an explicit assertion that toggling never calls `onChange`)
- [x] 7.10 Re-run `npm run typecheck` and `npm run test` after each change in this phase — final state: typecheck clean, 198/204 tests passing (6 pre-existing unrelated `xsed` failures, confirmed via `git stash` before this change began)
