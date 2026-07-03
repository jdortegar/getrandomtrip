# Verify Report: experience-review-original-peek (RE-VERIFY — supersedes prior report)

## Verdict: PASS WITH WARNINGS

This is a re-verify after significant scope growth (Phase 7: entry-level peek,
RichTextInput static preview, sticky `ReviewActionsBar`, independent
approve/reject loading state) found via live user QA on the shipped feature.
Spec, design, and tasks docs were read fresh for this run (not from memory of
the original narrower scope). No CRITICAL findings. 2 WARNING, 2 SUGGESTION.

## Independently reproduced checks

- `npm run typecheck` — clean, zero errors.
- `npm run test` (vitest run) — **Test Files: 2 failed | 29 passed (31). Tests: 6 failed | 198 passed (204).**
  Matches design.md's claimed 198/204 exactly.
- Confirmed the 6 failures are pre-existing and unrelated: `git stash push -u` (stashing all of this
  change's tracked+untracked files), re-ran the two failing suites
  (`src/lib/xsed/__tests__/notifications.test.ts`, `src/app/api/admin/xsed/__tests__/route.test.ts`) —
  identical 6 failures with the change fully removed. `git stash pop` restored the working tree cleanly
  (verified via `git status --short` and `git diff --stat` afterward). `git log` on those two test files
  shows they were introduced in commits `9c5408c6`/`06c20281`, an unrelated "XSED admin drop" feature —
  confirmed unrelated to experiences/review-copy.
- `route.ts` for this change's own files is not touched (`git diff --stat` shows no `route.ts` under
  `tripper/experiences` in the diff) — the PATCH-block-during-review guard is pre-existing, untouched code.

## Spec scenario verification (spec.md)

1. **Review screen shows changed fields** — unchanged pre-existing behavior; `changedFields` banner logic
   preserved, now delegated to `ReviewActionsBar` (see scenario 9 below). Not a regression.
2. **PATCH blocked during PENDING_TRIPPER_REVIEW** — verified in code: `src/app/api/tripper/experiences/[id]/route.ts:158-166`
   returns 409 when `existingExperience.status === "PENDING_TRIPPER_REVIEW"`. **WARNING**: no dedicated test
   file exists for this route's PATCH handler (`approve-copy`/`reject-copy` have their own `__tests__`, this
   one doesn't) — scenario is code-verified but not test-verified. Pre-existing gap, not introduced by this
   change (file is untouched in this diff); not a regression risk, but flagged per the "no test = untested"
   rule.
3. **Peek toggle appears only on eligible changed fields** — verified. `resolveFieldPeek` returns `undefined`
   unless `changedFieldSet.has(field) && originalDraft` is defined. Tooltip text matches spec verbatim:
   `en.json`/`es.json` `peekShowOriginal` = "Click to see original content" / "Ver contenido original".
   Covered by `FormField.test.tsx`/`TextAreaInput.test.tsx` runtime assertions.
4. **Peek toggle absent on non-eligible fields** — verified. Grepped all `peek={...}` call sites: only
   `AboutExperienceStep` (top-level `title`/`teaser`/`description`), `LogisticsAccommodationStep`
   (`hotelName`/`hotelLink`/`referredLink`), `ActivitiesListStep` (`name`/`description`/`risks`). Confirmed
   `AboutDestinationStep.tsx` and `ItineraryStep.tsx` have zero `peek` references — no leakage into
   multi-select, image upload, custom selectors, or itinerary entries.
5. **Peek toggle on a changed nested list entry field** — verified. `resolveEntryPeek<Entry>()` requires
   BOTH `changedFieldSet.has(diffKey)` (array-level, e.g. `"hotels"`) AND
   `originalEntry[entryKey] !== currentValue` (per-field). No `originalEntry` (new admin-added row) →
   `undefined`, by construction. Runtime-tested: `experience-form-peek.test.ts` has 6 passing cases covering
   diffKey-absent, no-original-counterpart, sub-field-unchanged, sub-field-changed, and active-state cases.
   Amber ring correctly derives from `peek(...)` truthiness (`ring(index, key)` in both step files), not the
   coarse array-level flag — confirmed sibling unchanged fields in a changed entry show no ring/toggle.
6. **Peek toggle on a RichTextInput field swaps to a static preview, not the live editor** — verified
   structurally, not just claimed. `RichTextInput.tsx`: while `isPeeking`, the `<Editor>` component is not
   rendered at all (conditional `isPeeking ? <div dangerouslySetInnerHTML> : <Editor value={value} .../>`)
   — the original HTML is **never** passed to the `Editor`'s `value` prop, at any point, in any branch.
   Toggling back remounts `<Editor value={value} .../>` with only the admin's edited HTML — no state
   crossover possible since the two branches are mutually exclusive JSX, not a single controlled swap.
   Test explicitly mocks `Editor` and asserts `onChange` is never called across two toggles
   (`RichTextInput.test.tsx`: "toggling swaps to a static struck-through preview... without touching the
   live editor" — `expect(onChange).not.toHaveBeenCalled()` after both toggle directions).
7. **Toggling swaps the displayed value to the original** — verified in code and by runtime test
   (`FormField.test.tsx`): click toggles input value, adds/removes `line-through`, flips `Eye`/`EyeOff`
   icon and tooltip text, reverts on second click. Each field's toggle independent via per-field
   `Set<string>` (or composite `"accommodations.0.hotelName"` keys for entries) in `ExperienceFormContent`.
8. **Empty original value shows a placeholder** — verified: `resolvePeekDisplay` sets `isEmpty` when
   `peek.active && originalValue.trim() === ""`; both `FormField`/`TextAreaInput`/`RichTextInput` render
   the localized `emptyLabel` (`"(no content)"` / `"(sin contenido)"`) with `italic` (no `line-through`).
   Tested at runtime in all three component test files.
9. **Approve applies the copy's real value regardless of toggle state** — verified architecturally:
   `TripperReviewCopyClient.handleApprove` POSTs to `/api/tripper/experiences/[id]/approve-copy` with no
   request body — the approve action never reads client-side `form`/peek state; the server applies the
   review copy's stored DB values unconditionally. Peek state is pure display state, never serialized.
10. **Unrelated fields and call sites render unchanged** — verified. `peek` is opt-in
    (`peek?: FieldPeek`), defaults to `undefined`; `showPeek = !!peek && ...` short-circuits to `false`
    everywhere else. New tests explicitly assert "renders no peek toggle when peek prop is not provided"
    for `FormField`, `TextAreaInput`, and `RichTextInput`.
11. **Changed-fields summary and approve/reject actions are always reachable** — verified.
    `ReviewActionsBar` is rendered exactly once in `NewExperienceShell.tsx` (not per-tab, not per-substep),
    `sticky` with `style={{ top: "var(--rt-header-h, 64px)" }}`. Confirmed `src/components/Navbar.tsx:95-97`
    is `sticky ... h-16 top-0 ... z-50` — a naive `top-0` on `ReviewActionsBar` would sit directly under/
    behind the navbar's 64px-tall sticky row; the `var(--rt-header-h, 64px)` offset (same variable used by
    `TripperTopbar.tsx` and set by `SiteHeaderOffset.tsx`/`TripperOffset.tsx`) correctly avoids the
    collision. Confirmed old per-tab banner is gone: `ExperienceFormContent.tsx` no longer renders a
    `changedFields` banner in the read-only branch — when `reviewActionsSlot` is passed it renders `null`
    with an explicit comment ("Approve/reject now live in the sticky ReviewActionsBar... nothing to render
    here"); the residual blue "pending" box only fires when `reviewActionsSlot` is absent (a different,
    non-tripper-review caller), not a duplicate.
12. **Approve/reject show independent loading state** — verified. `TripperReviewCopyClient` uses
    `pendingAction: "approve" | "reject" | null` (not a shared boolean); each button's spinner check is
    `pendingAction === "approve"` / `pendingAction === "reject"` independently. Both buttons share
    `disabled={saving}` where `saving = pendingAction !== null`, so a second concurrent submission is still
    blocked while only the clicked button visually spins.

## Design contract verification (design.md, incl. Post-Verify Extensions)

- `FieldPeek` interface (`field-peek.tsx`) matches design exactly.
- `PeekToggleButton` is a `<span role="button" tabIndex={0}>`, not a native `<button>`. Verified WHY:
  `ExperienceFormContent.tsx:228` wraps step content in `<fieldset disabled={isReadOnly}>`; per HTML spec,
  a `<fieldset disabled>` disables every descendant form control including `<button>` regardless of that
  button's own `disabled` attribute — a native button here would in fact be unclickable in the tripper
  review flow (`isReadOnly=true`). The `span[role=button]` + `onClick`/`onKeyDown` (Enter/Space) correctly
  sidesteps this while preserving keyboard accessibility.
- `ReviewActionsBar` sticky offset confirmed against real `Navbar.tsx` markup (see scenario 11 above) —
  not just asserted from the design doc's own claim.
- `pendingAction` state confirmed as the actual mechanism (see scenario 12).
- `ExperienceFormContent.tsx` old bottom-of-tab `reviewActionsSlot`/"Next" logic: confirmed removed for the
  `isReadOnly` branch specifically (renders `null` when `reviewActionsSlot` provided); the non-read-only
  `JourneyActionBar`/"Next" branch is untouched and correctly out of scope (used by the tripper's own
  create/edit flow, not the admin-review flow).
- **WARNING**: `field-peek.tsx`'s `PeekToggleButtonProps.position` type includes a third variant, `"label"`,
  with a docstring claiming it exists "for hosts like `RichTextInput` where a third-party widget (TinyMCE)
  owns the input's own DOM/stacking and can't be reliably overlaid on top of." In the shipped code,
  `RichTextInput.tsx` actually uses `position="textarea"` (an absolute overlay with explicit `z-10`), which
  directly contradicts this docstring — the `"label"` variant is dead code, unused anywhere in the
  codebase (confirmed via grep). This is a leftover from an earlier iteration superseded by the
  Post-Verify z-index fix (7.6) but the type/docstring was never cleaned up. Not a functional bug — purely
  a stale-documentation / dead-code cleanliness issue for a future maintainer.
- **SUGGESTION**: `LogisticsAccommodationStep.tsx`/`ActivitiesListStep.tsx` no longer receive/use a
  `changedFieldSet` prop for entry-level fields (correctly superseded by `peek(...)` truthiness per
  design.md), but `AboutDestinationStep.tsx`/`ItineraryStep.tsx` still take `changedFieldSet` for their own
  (non-peek) amber-ring highlighting — two different highlighting mechanisms now coexist in the same file
  family (`peek`-truthiness-driven ring vs. `changedFieldSet`-driven ring) with no shared abstraction.
  Cosmetic/consistency observation only — both are individually correct and spec-compliant.
- **SUGGESTION**: `resolveEntryPeek`'s `currentValue` comparison is a plain string equality
  (`originalValue === currentValue`) after `String(...)` coercion on both sides in call sites
  (`ActivitiesListStep.tsx` uses `String(form.activities[index]?.[entryKey] ?? "")` while
  `LogisticsAccommodationStep.tsx` passes the raw string field directly since `AccommodationEntry` fields
  are already strings) — functionally correct today (verified: `AccommodationEntry` type is all-string
  fields), but the asymmetric call-site coercion pattern is slightly fragile if a non-string
  `AccommodationEntry` field were ever added without updating the call site. No current bug — noted for
  future defensiveness only.

## Task completion (tasks.md)

All 7 phases (35 sub-tasks including Phase 7.1–7.10) are checked off and match the code state on disk —
verified against the actual diff and file contents, not just the checkbox markers. No task claims
completion without corresponding code found in the repo.

## i18n / dictionary compliance

`peekShowOriginal`, `peekShowSuggestion`, `noContent` present in both `src/dictionaries/es.json` and
`en.json` (lines 3708-3710 in both) and typed in `src/lib/types/dictionary.ts:522-524`. Tooltip strings
match the spec's exact required wording in both locales.

## Unrelated fixes sanity check (per instructions — not part of this delta, not failed over)

- `src/lib/roles.ts`: `dashboardPathFromRole` now returns `/dashboard/admin` for the `admin` role
  (confirmed at line 9) instead of a dead `/admin` placeholder — consistent with design.md's claim.
- `DaysInput.tsx`/`DurationInput.tsx`: both now default `String(value ?? 0)` /
  `String(value?.value ?? 0)` — confirmed nullish-guarded, no more literal `"undefined"` rendering.
- `RoleNotificationsPageClient.tsx`: modified per design.md's claim (row-click replaced with explicit
  `TableIconLink` actions); not independently re-verified against `design-system.md`'s `TableIconButton`
  spec in detail since it's explicitly out of scope for this delta — typecheck/tests already cover it and
  it introduces no new failures.

## Summary of findings

- **CRITICAL**: none.
- **WARNING** (2): (1) PATCH-blocked-during-review scenario has no dedicated test (pre-existing gap,
  untouched file); (2) `field-peek.tsx`'s unused `"label"` position variant has a stale/misleading
  docstring contradicted by the actual `RichTextInput` implementation.
- **SUGGESTION** (2): (1) two coexisting highlighting mechanisms (`peek`-truthiness ring vs.
  `changedFieldSet` ring) across step files with no shared abstraction; (2) asymmetric string-coercion at
  `resolveEntryPeek` call sites — correct today, mildly fragile long-term.

Both WARNINGs are non-blocking for archive: neither reflects a regression or a spec violation in the
shipped behavior — both are the acknowledged debt of a fast-follow bugfix pass (Phase 7), independently
confirmed via runtime test execution and direct source reading rather than trusting design.md's
self-description.
