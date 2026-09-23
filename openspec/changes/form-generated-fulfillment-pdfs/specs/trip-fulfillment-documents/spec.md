# Delta for Trip Fulfillment Documents

## ADDED Requirements

### Requirement: Explicit Byte-Identical Publication

Only explicit admin attachment of a current validated preview MUST publish a generated document. Published bytes MUST equal preview bytes exactly, without rerendering, and MUST occupy a separate immutable private storage reference. Label and destination-country validation MUST retain existing rules. Draft existence alone MUST NOT confirm fulfillment.

#### Scenario: Preview becomes an attachment
- GIVEN a valid current preview and no linked attachment
- WHEN an admin attaches it
- THEN one TripDocument is created with identical PDF bytes at a distinct private reference, available through existing authenticated reads

#### Scenario: Stale or missing preview
- GIVEN no successful preview or a preview preceding the current draft revision
- WHEN a new publication is requested rather than a matching committed retry
- THEN it is rejected without changing published documents

### Requirement: Idempotent Publication and Confirmed Replacement

Duplicate/concurrent attachment requests for the same preview MUST yield the same publication without duplicate rows. Replacement MUST require explicit confirmation, preserve the existing document ID, and atomically switch to validated preview bytes. Without successful replacement, travelers MUST retain the previous PDF. Failed storage/publication MUST preserve the draft and current attachment.

#### Scenario: Retry attachment
- GIVEN concurrent requests or a retried successful attachment
- WHEN the same preview is submitted again
- THEN the same document is returned without duplicate publications

#### Scenario: Ambiguous publication result
- GIVEN publication committed but its response was lost, possibly followed by a newer publication
- WHEN an authorized admin retries the same preview for the still-live owning draft and linked document
- THEN its retained receipt yields the same document without duplicate publication, replacement confirmation or deletion of either published generation

#### Scenario: Correct a published document
- GIVEN an attached PDF and a newer preview
- WHEN replacement is cancelled, fails, or lacks confirmation
- THEN the original document remains unchanged; confirmed successful replacement retains its ID and serves the new preview bytes

### Requirement: Retain Published History Privately

Superseded published bytes MUST remain privately available to in-flight downloads/emails until document/trip/account deletion. Version-history UI MUST NOT be introduced. Subsequent preview updates MUST NOT mutate published bytes.

#### Scenario: Email already reading old bytes
- GIVEN an email/download has captured the previous published reference
- WHEN replacement succeeds and the draft is edited again
- THEN the captured bytes remain readable and both publications remain immutable

### Requirement: Independent Deletion and Complete Cleanup

Deleting an attachment MUST unlink but preserve its editable draft and remove all current/superseded published blobs. Deleting a draft MUST remove private previews but preserve its attachment. Trip/account deletion MUST remove associated drafts, previews and all published generations. Deletion MUST cancel unfinished publication candidates without deleting retained publications outside its scope. Durable cleanup tombstones MUST survive cascades and remain scheduled after observed absence; failures MUST stay observable/retryable. Cleanup MUST eventually remove scoped bytes after outstanding writes quiesce and storage recovers, not promise immediate permanent absence.

#### Scenario: Delete attachment, preserve draft
- GIVEN a draft linked to an attachment with superseded bytes
- WHEN the attachment is deleted
- THEN published generations are cleaned and the draft survives unlinked for editing/reattachment

#### Scenario: Delete draft, preserve attachment
- GIVEN a linked draft with private previews and an unfinished publication
- WHEN the draft is deleted
- THEN preview/unfinished-publication candidates are cancelled and cleaned, while retained published generations and the attachment remain readable

#### Scenario: Delete trip or account
- GIVEN generated documents, private previews and superseded blobs
- WHEN their owning trip/account is deleted
- THEN associated drafts and generated files are cleaned, including previously unlinked generations, while compact cleanup tombstones remain retryable

#### Scenario: Late storage write after deletion
- GIVEN a scoped deletion tombstone and a sweep that observed no remaining bytes
- WHEN an earlier storage PUT completes later, including an SDK retry after another attempt returned success
- THEN cancelled candidates cannot be adopted; bounded scheduled sweeps continue after absence and remove the late bytes once writes quiesce and storage recovers

### Requirement: Existing Fulfillment Compatibility

Uploads, destination-country catalog, per-trip isolation, role authorization, authenticated read routes, non-XSED support and traveler gates MUST remain unchanged. Drafts/previews MUST be excluded from email queries. Publication/corrections MUST NOT reset email-send timestamps, send immediate emails or automatically resend corrections; existing scheduled eligibility remains authoritative.

#### Scenario: Visibility and email regression
- GIVEN buyer/companion/outsider/admin callers, pre-reveal and REVEALED/COMPLETED/CANCELLED trips, and sent/unsent emails
- WHEN drafts are edited, previewed, attached or replaced
- THEN existing access/gating and scheduled-email rules remain unchanged, and timestamps and previously sent emails are untouched
