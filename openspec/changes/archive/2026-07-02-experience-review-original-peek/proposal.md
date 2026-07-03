# Proposal: Per-Field "Peek at Original" in Tripper Review-Copy

## Intent

In the tripper re-review screen (`PENDING_TRIPPER_REVIEW`), the tripper sees only the admin's edited value per changed field (amber ring + summary banner). To compare against their own pre-edit value they must leave the page. This adds a per-field toggle that swaps a changed field's displayed value between the admin's suggestion and the tripper's original, in place, so the tripper can decide to approve/reject with full context.

## Scope

### In Scope
- Per-field peek toggle (`Eye`/`EyeOff` icon) on scalar text fields rendered via shared `FormField` / `TextAreaInput`, only when the field is in `changedFieldSet` AND an original value exists.
- Inline value swap with `line-through` when showing the original; muted italic placeholder ("(no content)") when the original was empty.
- Build `originalDraft` from the already-fetched pristine `original` record and thread it page → client → shell → content → steps, parallel to the existing `form`/`copyDraft` prop.
- 3 new i18n keys (es + en) under `tripperExperiences.form.changedFieldsBanner`.

### Out of Scope
- Multi-select fields (`type`, `season`, `excuseKey`), image fields, and nested list entries (activities, itinerary, accommodations) — these keep amber-ring-only.
- Any change to the existing amber summary banner, the amber ring, or the approve/reject flow.
- List add/remove/reorder diffing (separate, harder problem).
- New schema, snapshot, or DB fields.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `experience-tripper-review`: extend the "Tripper Review Screen" requirement so changed scalar fields expose a per-field original-vs-suggestion peek in `adminReadOnly` mode.

## Approach

No new data: the pristine `original` is guaranteed untouched during the `PENDING_TRIPPER_REVIEW` window (`send-to-tripper` only flips status + clears the lock). Construct `originalDraft: ExperienceFormDraft` in `review-copy/page.tsx` mirroring the existing `copyDraft` build, then thread it down as an optional prop. Extend `FormField` and `TextAreaInput` with a single OPT-IN prop (undefined by default → zero behavior change for the ~20 other call sites) that reuses the existing absolute-positioned toggle-button structure (`FormField.tsx:49-61`). Because this form is ALWAYS `isReadOnly` (`mode="adminReadOnly"` → disabled fieldset), swapping the input's own displayed value is safe — no live-edit conflict. Icons are deliberately inverted vs. the password convention (`EyeOff` = showing admin edit, `Eye` = showing original). Tooltip uses the lightweight CSS `group-hover` pill pattern from `TableIconButton`, not Radix.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `review-copy/page.tsx` | Modified | Build `originalDraft` from `original` |
| `TripperReviewCopyClient.tsx`, `NewExperienceShell.tsx`, `ExperienceFormContent.tsx` | Modified | Thread `originalDraft` prop |
| `src/components/ui/FormField.tsx`, `TextAreaInput.tsx` | Modified | Opt-in peek toggle prop |
| Step files (`AboutExperienceStep`, `AboutDestinationStep`, `LogisticsTransportStep`, `CapacityDurationStep`, `CapacityPricingStep`) | Modified | Wire peek prop on changed scalar fields |
| `src/dictionaries/es.json`, `en.json` | Modified | 3 new keys (peek tooltips + noContent) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Opt-in prop leaks toggle into other call sites | Low | Prop undefined by default; icon renders only when original passed |
| Original stale/mutated during window | Low | `send-to-tripper` never touches content fields |
| Field list wrong (select/DaysInput fields) | Med | Verify each step; wire only `FormField`/`TextAreaInput` scalars |
| Empty-original looks broken | Low | Muted italic "(no content)" placeholder |

## Rollback Plan

Additive and self-contained. Revert the 3 UI/prop commits and the dictionary keys. The opt-in prop defaulting to undefined means removal restores prior behavior with no data or schema impact.

## Dependencies

- Existing `experience-approval-flow-v2` flow (`changedFields`, `adminReadOnly` mode) — already shipped.

## Success Criteria

- [ ] Changed scalar fields show a peek toggle; unchanged and out-of-scope fields do not.
- [ ] Toggling swaps admin↔original value in place with `line-through`; empty original shows the placeholder.
- [ ] Other `FormField`/`TextAreaInput` call sites are visually and behaviorally unchanged.
- [ ] 3 keys present in both locales; `npm run typecheck` and `npm run lint` pass.
