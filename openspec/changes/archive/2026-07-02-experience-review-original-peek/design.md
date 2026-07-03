# Design: Per-Field "Peek at Original" in Tripper Review-Copy

## Technical Approach

The tripper review-copy screen is always `mode="adminReadOnly"` (disabled `<fieldset>`), so the input's own displayed value can be swapped safely — there is no live-edit to corrupt. We add a single OPT-IN `peek` prop (undefined by default) to the shared `FormField` and `TextAreaInput`. When present, it renders a toggle button that swaps the shown value between the admin suggestion (the field's live `value`) and the tripper's pristine original, with `line-through` on the original. `originalDraft: ExperienceFormDraft | undefined` is built in `page.tsx` from the already-fetched `original` row and threaded page → client → shell → content. `ExperienceFormContent` owns the peek toggle state and derives a `peek(field)` helper (analogous to the existing `ch()` ring helper) passed only to the one step that renders in-scope scalars. Maps to the proposal's additive, no-schema approach.

## Definitive Field Scope

`resolveStepContent` renders only 5 steps. `LogisticsTransportStep`, `CapacityDurationStep`, `CapacityPricingStep` are **imported nowhere** (confirmed by grep) — they never render and are out of scope. Custom selectors and nested-list `FormField`s are also out (proposal limits scope to top-level `FormField`/`TextAreaInput` scalars).

| Field | Control | Step (rendered?) | In scope |
|---|---|---|---|
| `title` | FormField | AboutExperienceStep ✓ | **Yes** |
| `teaser` | FormField | AboutExperienceStep ✓ | **Yes** |
| `description` | TextAreaInput | AboutExperienceStep ✓ | **Yes** |
| `type`,`season`,`excuseKey` | MultiSelectInput | AboutExperienceStep ✓ | No (multi-select) |
| `minNights`,`heroImage` | DaysInput/upload | AboutExperienceStep ✓ | No |
| `destinationCountry`,`destinationCity` | Country/CitySelector | AboutDestinationStep ✓ | No (custom selector) |
| `hotelName`,`hotelLink`,`referredLink` | FormField (nested `entry[i]`) | LogisticsAccommodationStep ✓ | No (nested list; diff key = `hotels`) |
| `activity name` | FormField (nested `entry[i]`) | ActivitiesListStep ✓ | No (nested; key = `activities`) |
| `itinerary title` | FormField (nested `day[i]`) | ItineraryStep ✓ | No (nested; key = `itinerary`) |
| `minPax`,`maxPax`,`travelTime`,`estimatedCost`,transport/time selects | FormField/select | Transport/Capacity/Pricing (**not rendered**) | No (dead steps) |

**Only `AboutExperienceStep.tsx` needs peek wiring** (3 fields). This corrects the proposal's 5-step estimate.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Prop shape | One grouped optional `peek?: FieldPeek` object | Flat `peekValue`/`peekActive`/`onPeekToggle` props | Grouped object makes it all-or-nothing at the type level; TS forbids partial peek. One shared interface for both inputs. |
| Toggle state owner | Single `Set<string>` in `ExperienceFormContent`; `peek(field)` helper passed down | Local `useState` per step | Keeps steps presentational (mirrors existing `changedFieldSet` flow); one source of truth. |
| Value swap | Override input `value` only when `peek.active`; parent state untouched | Mutate `form` state on toggle | Read-only screen; must never write. Display-only swap is reversible and side-effect-free. |
| Empty original | Show toggle for every changed in-scope field; empty original → placeholder | Suppress toggle when original empty | Revealing "(no content)" tells the tripper the admin *added* content — more context, not less. Resolves proposal's empty-vs-exists ambiguity. |
| Password coexistence | Peek button renders only when `peek && type !== "password"` | Allow both | A field is never both; password toggle is a security control and wins. Prevents overlapping absolute buttons. |
| Tooltip | CSS `group-hover` pill (TableIconButton pattern) | Radix Tooltip | Consistency + zero new deps, per proposal. |
| Icons | `EyeOff` = showing suggestion, `Eye` = showing original | Match password convention | Deliberately inverted per proposal. |

## Interfaces / Contracts

```ts
// shared, exported from FormField.tsx (or a small ui/field-peek.ts)
export interface FieldPeek {
  originalValue: string;             // pristine tripper value ("" if none)
  active: boolean;                   // true = currently showing original
  onToggle: () => void;
  tooltip: { showOriginal: string; showSuggestion: string };
  emptyLabel: string;                // localized "(no content)"
}
// FormFieldProps + TextAreaInputProps each gain:  peek?: FieldPeek;
```

**FormField composition** (destructure `value`, `placeholder`, `peek` out of props):

```ts
const isEmpty = peek?.active && peek.originalValue.trim() === "";
const showPeek = !!peek && !isPasswordField;
const displayValue = peek?.active ? peek.originalValue : value;
// input:
className={cn(formControlClass,
  (isPasswordField || showPeek) && "pr-12",
  peek?.active && !isEmpty && "line-through",
  isEmpty && "italic", className)}
value={displayValue}
placeholder={isEmpty ? peek.emptyLabel : placeholder}
```

Peek button sits in the existing `relative` wrapper as a `group` span (absolute right); icon/tooltip: inactive → `EyeOff` + `tooltip.showOriginal`, active → `Eye` + `tooltip.showSuggestion`.

**TextAreaInput**: wrap `<textarea>` in a new `<div className="relative">`; peek button absolute **top-right** (`right-3 top-3`) to avoid the bottom-right char counter; add `pr-12` when `showPeek`. Same value/placeholder/`line-through`/`italic` swap; char count uses the displayed value length.

## Data Flow

```
page.tsx (build originalDraft from `original`)
  → TripperReviewCopyClient (originalDraft prop)
    → NewExperienceShell (originalDraft prop)
      → ExperienceFormContent  [owns peekedFields:Set, togglePeek, makePeek]
        → AboutExperienceStep (peek={makePeek})  → FormField/TextAreaInput peek={peek("title"|"teaser"|"description")}
```

`makePeek(field)` returns `undefined` unless `changedFieldSet.has(field) && originalDraft !== undefined`; otherwise builds `FieldPeek` from `String(originalDraft[field] ?? "")`, `peekedFields.has(field)`, `togglePeek`, and the 3 new dict strings.

## File Changes

| File | Action | Description |
|---|---|---|
| `review-copy/page.tsx` | Modify | Build `originalDraft` via the same map as `copyDraft` (lines ~73-115), sourced from `original`; pass to client |
| `TripperReviewCopyClient.tsx`, `NewExperienceShell.tsx`, `ExperienceFormContent.tsx` | Modify | Thread `originalDraft`; `ExperienceFormContent` adds peek state + `makePeek`, passes `peek` to `AboutExperienceStep` |
| `AboutExperienceStep.tsx` | Modify | Accept `peek?: (f:string)=>FieldPeek\|undefined`; wire `title`/`teaser`/`description` |
| `FormField.tsx`, `TextAreaInput.tsx` | Modify | Add `peek?: FieldPeek`; toggle button + value/line-through/placeholder swap |
| `src/dictionaries/es.json`, `en.json`, `src/lib/types/dictionary.ts` | Modify | Add `changedFieldsBanner.peekShowOriginal`, `peekShowSuggestion`, `noContent` (both locales + type) |

## originalDraft Construction

Identical mapping logic to `copyDraft`, sourced from `original`. Only `title`/`teaser`/`description` are ever consumed by peek, so `status`/`reviewNote`/list/image fields are irrelevant — but mirroring the full build keeps the object typed and consistent. No field needs special handling.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | `makePeek` eligibility (changed + original present) | Pure-function fixtures |
| Component | Toggle swaps value + `line-through`; empty → placeholder; non-peek call sites unchanged | RTL render of FormField/TextAreaInput |
| Manual | Full review-copy screen: peek each changed scalar; typecheck + lint | QA per success criteria |

## Migration / Rollout

No migration. Purely additive UI; `peek` undefined at all ~20 other call sites → zero behavior change. Rollback = revert the UI/prop/dict commits.

## Open Questions

- [ ] `destinationCountry`/`destinationCity` are scalar and changeable but use custom selectors — intentionally excluded (amber ring only). Confirm acceptable, or defer selector peek to a follow-up.

## Post-Verify Extensions

Everything below was added after the initial `sdd-verify` PASS, during live QA on the actual review-copy screen. The "Definitive Field Scope" table above (3 fields, 1 step) reflects the *original* approved design only — the sections below supersede it for the *shipped* scope.

### Entry-level peek (accommodations, activities)

`changedFields` diffs `hotels`/`activities` as whole JSON-serialized arrays — it can't say which entry or sub-field changed. Added `resolveEntryPeek<Entry>()` (`experience-form-peek.ts`) alongside the existing `resolveFieldPeek()`: given the array-level diff key, the original entry at the same index, and the entry's current (copy) value, it returns a `FieldPeek` only if the array changed **and** this specific sub-field's value differs from the original entry. Composite keys (`accommodations.0.hotelName`) identify each field in the shared `peekedFields` Set. No original counterpart at an index (admin added a new entry) → no peek, by construction. Wired: `hotelName`/`hotelLink`/`referredLink` (`LogisticsAccommodationStep`), `name`/`description`/`risks` (`ActivitiesListStep`). `itinerary` was not wired — out of scope. The per-field amber ring now also reuses `peek(...)` truthiness directly instead of the coarse array-level `changedFieldSet`, so only individually-changed sub-fields ring, not the whole entry.

### RichTextInput (TinyMCE) peek — static preview, not a controlled-value swap

Initially implemented like `FormField`/`TextAreaInput` (swap the controlled `value`). This corrupted data: `@tinymce/tinymce-react`'s `changeEvents` list includes `'setcontent'`, so its own `componentDidUpdate`-driven `editor.setContent()` call (used to sync our controlled swap) fired TinyMCE's change detection, which called our `onEditorChange` — silently overwriting the admin's edit with the original the moment peek was toggled on. Fixed by never feeding the original into the live editor: while peeking, `<Editor>` unmounts entirely and a separate static `<div dangerouslySetInnerHTML>` renders the original HTML (line-through / italic placeholder), same trust boundary already used for TinyMCE-authored content elsewhere (`BlogArticle.tsx`). No shared state with the editor → no write-back path possible, by construction, not by guarding against it after the fact.

The toggle button itself also needed two follow-up fixes: (1) it lives inside the review screen's `<fieldset disabled>`, which — per the HTML spec — disables *every* descendant `<button>` regardless of that button's own `disabled` prop, so it's rendered as a `<span role="button" tabIndex={0}>` instead of a native button (applies to all peek toggles, not just RichTextInput); (2) positioned as an absolute overlay with an explicit `z-10` inside a `relative` (not `overflow-hidden`) outer wrapper — TinyMCE injects its own toolbar DOM outside React's render order with no z-index of its own, so without ours it silently painted over the icon, and the outer `overflow-hidden` (needed for the editor's rounded corners) was clipping the tooltip that pops up above the icon.

### Sticky `ReviewActionsBar`

The changed-fields banner and the approve/reject actions were originally two separate things: a per-tab-rendered banner, and actions only shown after clicking to the *last* tab. Replaced both with one component (`ReviewActionsBar.tsx`), rendered once in `NewExperienceShell` (not per-tab), `sticky` with `top: var(--rt-header-h, 64px)` — offset below the site `Navbar` (`sticky top-0 z-50 h-16`), which otherwise occupies the same viewport row. `ExperienceFormContent`'s old bottom-of-tab `reviewActionsSlot`/"Next" logic was removed entirely; tab navigation still works via the top nav and sidebar (`canNavigateTo` already allows free navigation in this mode).

### Approve/Reject independent loading state

`TripperReviewCopyClient` used one shared `saving: boolean` gating both buttons' spinners — clicking either one showed *both* as loading. Replaced with `pendingAction: "approve" | "reject" | null`; each button's icon checks against its own action. Both stay `disabled` while either request is in flight (unchanged), but only the clicked one visually spins.

### Unrelated fixes found during the same QA pass (not part of this capability)

- `src/lib/roles.ts`: admin post-login redirect pointed at the dead `/admin` route (`// placeholder`) instead of `/dashboard/admin`.
- `DurationInput.tsx` / `DaysInput.tsx`: rendered the literal string `"undefined"` when the underlying numeric value was missing (`String(value.value)` with no nullish guard); now default to `0`.
- Notification list (`RoleNotificationsPageClient.tsx`): whole-row `<Link>` replaced with an explicit `TableIconLink` action (Eye/GitCompare) per design-system.md, since the ambient row-click affordance wasn't discoverable.

These are logged here for traceability but are unrelated bugs, not part of the `experience-tripper-review` capability — no spec changes needed for them.
