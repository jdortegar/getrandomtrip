# Document workflow

## Requirements
- The document hub MUST distinguish Attached documents from Private drafts using translated status badges and authoritative published-document data, not merely hide conflicting copy.
- New document MUST open template selection; Upload existing remains secondary and preserves its current upload behavior.
- Editing MUST occur in a dedicated guarded surface, isolated from trip Save changes. Fields MUST be grouped and retain all five templates' inline validation and repeatable controls.
- One sticky action bar MUST offer Save draft and primary Save & preview. Save draft accepts incomplete content. Save & preview validates current edits, waits for a successful save, then renders that returned revision. Conflicts, failed saves, switching drafts or newer edits MUST prevent stale rendering.
- Review MUST offer Back to editing and Attach to trip, or explicit confirmed Replace attached PDF. Attach uses the exact reviewed browser Blob and stable request identity, never rerenders, and preserves existing server digest/revision/expiry checks.
- Delete MUST live in an overflow action with confirmation and preserve published attachments when deleting drafts. Expiry guidance is shown only while reviewing a preview.
- Hub refresh after publication, upload or deletion MUST reconcile attached documents and draft link metadata. Failures MUST be visible/retryable and cannot reset unrelated trip/editor edits or let stale responses overwrite a different trip.
- EN/ES, keyboard/accessibility and360/1280px layouts are required. No automatic email, schema/credential change or actual user-data mutation is authorized by implementation/testing.

## Scenarios
- Save & preview on valid edited revisionN savesN+1, then requests onlyN+1;409 keeps edits and does not render.
- Incomplete draft saves independently, but invalid preview focuses the first field and identifies nested errors.
- Successful attachment refreshes its authoritative row; failed refresh shows a retry state instead of a false empty attached list.
- Closing/switching with unsaved edits prompts; Back to editing preserves fields and invalidates attachment of stale previews after edits.
