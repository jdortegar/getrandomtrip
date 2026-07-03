# Delta for experience-tripper-review

## MODIFIED Requirements

### Requirement: Tripper Review Screen

The system MUST provide a read-only view of the review copy when the original is in `PENDING_TRIPPER_REVIEW`. The view MUST display the `changedFields` list so the tripper knows exactly what the admin changed. All inputs MUST be disabled — the tripper cannot edit the copy. For each eligible field — a top-level scalar rendered via `FormField`/`TextAreaInput`/`RichTextInput`, or a scalar sub-field of an `accommodations`/`activities` array entry rendered the same way — that differs from the tripper's original, the view MUST expose a per-field peek toggle so the tripper can swap the displayed value between the admin's suggested value and the tripper's own original value, in place, without leaving the page. Toggling MUST change only the displayed value — the copy's actual field values, which are applied on approve, MUST NOT be affected by which value was on display. The changed-fields summary and the approve/reject actions MUST render together in a sticky bar pinned below the site header, reachable from every tab and scroll position, not only after navigating to a specific tab.

(Previously: the read-only view showed only the admin's edited value per changed field, with no way to inspect the tripper's original value without leaving the page; peek was scoped only to `title`/`teaser`/`description` on the About step, and approve/reject only appeared at the bottom of the last tab.)

#### Scenario: Review screen shows changed fields

- GIVEN an original in `PENDING_TRIPPER_REVIEW` with a review copy
- WHEN the tripper opens the experience
- THEN a read-only form renders in `adminReadOnly` mode
- AND a `changedFields` summary is visible (e.g. "Admin changed: description, heroImage")

#### Scenario: PATCH blocked during PENDING_TRIPPER_REVIEW

- GIVEN an experience in `PENDING_TRIPPER_REVIEW`
- WHEN any PATCH request is sent to the tripper experiences endpoint
- THEN the API MUST return 409

#### Scenario: Peek toggle appears only on eligible changed fields

- GIVEN a field in `changedFields` rendered via `FormField` or `TextAreaInput` in `adminReadOnly` mode with an available original value
- WHEN the tripper views the review screen
- THEN a peek toggle icon renders next to the field, defaulting to `EyeOff` with tooltip "Click to see original content" / "Ver contenido original"

#### Scenario: Peek toggle absent on non-eligible fields

- GIVEN a field that is either unchanged, or is rendered via multi-select, image upload, `DaysInput`/`DurationInput`, a native `<select>`, or any field within an `itinerary` entry
- WHEN the tripper views the review screen
- THEN no peek toggle icon renders for that field, regardless of its changed status

#### Scenario: Peek toggle on a changed nested list entry field

- GIVEN `changedFields` includes the array-level key (`hotels` for `accommodations`, `activities` for `activities`) AND a specific entry's scalar sub-field (e.g. `accommodations[0].hotelName`, `activities[1].description`) differs from the original entry at the same index
- WHEN the tripper views that entry
- THEN a peek toggle renders on that specific field only — sibling fields within the same entry that did not individually change show no toggle, even though the entry's parent array is flagged changed
- AND if the admin added a new entry with no original counterpart at that index, no peek toggle renders for any field in that entry

#### Scenario: Peek toggle on a RichTextInput field swaps to a static preview, not the live editor

- GIVEN a changed `description` or `risks` field (rendered via `RichTextInput`/TinyMCE) with an eligible original value
- WHEN the tripper toggles the field to show the original
- THEN the TinyMCE editor unmounts and a static read-only preview of the original HTML renders in its place, struck through
- AND toggling back remounts the live editor showing the admin's edited HTML, unchanged from before the toggle
- AND at no point does toggling call the field's `onChange` — TinyMCE's `setcontent` event firing on a controlled-value swap MUST NOT be used to drive this preview, since that would let TinyMCE's own change-detection silently overwrite the admin's edit with the original

#### Scenario: Toggling swaps the displayed value to the original

- GIVEN an eligible changed field currently showing the admin's edited value with an `EyeOff` icon
- WHEN the tripper clicks the peek toggle
- THEN the field's displayed value swaps in place to the tripper's original value with `line-through` styling
- AND the icon becomes `Eye` with tooltip "Click to see admin's suggestion" / "Ver sugerencia del admin"
- AND clicking the icon again reverts the field to the admin's edited value and the `EyeOff` icon
- AND each field's toggle state is independent of every other field's toggle state

#### Scenario: Empty original value shows a placeholder

- GIVEN an eligible changed field whose original value was an empty string
- WHEN the tripper toggles the field to show the original value
- THEN the field displays a muted italic placeholder "(no content)" / "(sin contenido)" instead of a blank value

#### Scenario: Approve applies the copy's real value regardless of toggle state

- GIVEN an eligible changed field currently toggled to display the tripper's original value
- WHEN the tripper approves the copy
- THEN the original is overwritten with the copy's actual edited value for that field, not the value that was on display at the moment of approval

#### Scenario: Unrelated fields and call sites render unchanged

- GIVEN a field within the review screen that is not in `changedFields`, or any `FormField`/`TextAreaInput` usage outside the tripper review-copy screen
- WHEN the form renders
- THEN no peek toggle icon appears and no visual or behavioral change occurs, because the peek capability is an opt-in prop that defaults to inactive

#### Scenario: Changed-fields summary and approve/reject actions are always reachable

- GIVEN a review copy with one or more changed fields
- WHEN the tripper switches tabs or scrolls the page
- THEN a single bar showing the changed-fields summary and the Approve/Reject actions stays pinned directly below the site header at all times
- AND no separate per-tab banner or bottom-of-tab action area duplicates this content

#### Scenario: Approve/reject show independent loading state

- GIVEN the tripper clicks either Reject or Approve
- WHEN the request is in flight
- THEN only the clicked button shows its loading spinner; the other button shows its normal icon
- AND both buttons are disabled until the request settles, preventing a second concurrent submission
