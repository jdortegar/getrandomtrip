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
- WHEN attachment is requested
- THEN it is rejected without changing published documents

### Requirement: Idempotent Publication and Confirmed Replacement

Duplicate/concurrent attachment requests for the same preview MUST yield the same publication without duplicate rows. Replacement MUST require explicit confirmation, preserve the existing document ID, and atomically switch to validated preview bytes. Without successful replacement, travelers MUST retain the previous PDF. Failed storage/publication MUST preserve the draft and current attachment.

#### Scenario: Retry attachment
- GIVEN concurrent requests or a retried successful attachment
- WHEN the same preview is submitted again
- THEN the same document is returned without duplicate publications

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

Deleting an attachment MUST unlink but preserve its editable draft and remove all current/superseded published blobs. Deleting a draft MUST remove private previews but preserve its attachment. Trip/account deletion MUST remove associated drafts, previews and all published generations. Storage failures MUST remain observable/retryable rather than silently abandoning cleanup.

#### Scenario: Delete attachment, preserve draft
- GIVEN a draft linked to an attachment with superseded bytes
- WHEN the attachment is deleted
- THEN published generations are cleaned and the draft survives unlinked for editing/reattachment

#### Scenario: Delete draft, preserve attachment
- GIVEN a linked draft with private previews
- WHEN the draft is deleted
- THEN previews are cleaned and the published attachment remains readable

#### Scenario: Delete trip or account
- GIVEN generated documents, private previews and superseded blobs
- WHEN their owning trip/account is deleted
- THEN all associated generated records/files are cleaned, including previously unlinked generations

### Requirement: Existing Fulfillment Compatibility

Uploads, destination-country catalog, per-trip isolation, role authorization, authenticated read routes, non-XSED support and traveler gates MUST remain unchanged. Drafts/previews MUST be excluded from email queries. Publication/corrections MUST NOT reset email-send timestamps, send immediate emails or automatically resend corrections; existing scheduled eligibility remains authoritative.

#### Scenario: Visibility and email regression
- GIVEN buyer/companion/outsider/admin callers, pre-reveal and REVEALED/COMPLETED/CANCELLED trips, and sent/unsent emails
- WHEN drafts are edited, previewed, attached or replaced
- THEN existing access/gating and scheduled-email rules remain unchanged, and timestamps and previously sent emails are untouched
