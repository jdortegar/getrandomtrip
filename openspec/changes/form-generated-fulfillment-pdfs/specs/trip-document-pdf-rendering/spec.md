# Trip Document PDF Rendering Specification

## Purpose

Produce branded, privately previewable PDFs from validated document drafts.

## Requirements

### Requirement: Branded Multipage Output

All five templates MUST preserve the supplied references' visual identity using locally bundled brand/font assets. PDFs MUST use A4 pages, readable typography and page numbering. Repeating content MUST preserve authored order and paginate without clipping, overlap or lost content. English/Spanish standard text and accented characters MUST render correctly; custom text MUST not be translated.

#### Scenario: Template and locale coverage
- GIVEN complete data for each of five templates in both locales
- WHEN PDFs are generated
- THEN all ten outputs contain their expected fields, translated labels, brand assets and legible accents

#### Scenario: Long content pagination
- GIVEN long descriptions and many stops, activities, inclusions or menu items
- WHEN rendered across pages
- THEN every item appears in order with correct page numbering and no clipped or overlapping content

### Requirement: Safe Links and Optional QR Codes

Provided map/location links MUST remain clickable. Optional provider QR codes MUST encode a validated HTTPS URL and remain scannable in the PDF. QR generation MUST be local; generation MUST NOT fetch provider URLs. Missing optional links MUST omit their affordances cleanly.

#### Scenario: Provider QR fidelity
- GIVEN a valid HTTPS provider URL and location link
- WHEN the PDF is generated and its QR decoded
- THEN the QR resolves to the supplied URL, the location annotation matches, and no provider network request occurs

#### Scenario: Invalid or absent provider link
- GIVEN an absent provider URL or a non-HTTPS URL
- WHEN preview is requested
- THEN absence omits the QR while an invalid supplied URL yields an actionable validation error

### Requirement: Private Revision-Bound Preview

Preview bytes MUST persist privately against the rendered draft revision and remain accessible only through authenticated admin routes. A concurrent draft edit MUST prevent an obsolete render from becoming attachable. Previewing MUST not publish a document or change traveler visibility/email eligibility.

#### Scenario: Edit while rendering
- GIVEN preview generation for revision N is in progress
- WHEN the draft changes to N+1 before generation completes
- THEN the N output cannot be attached as the current preview and N+1 edits survive

### Requirement: Recoverable Output Limits

Generated PDFs MUST NOT exceed 4 MiB. Rendering/storage failure or oversized output MUST preserve the draft, return a recoverable error, and leave existing published documents unchanged; no failed preview MAY become attachable.

#### Scenario: Oversize or infrastructure failure
- GIVEN a saved draft with an existing published attachment
- WHEN rendering/storage fails or output exceeds 4 MiB
- THEN the admin can retry/correct the draft and the prior attachment remains available unchanged

#### Scenario: Boundary size
- GIVEN otherwise valid output of exactly 4 MiB
- WHEN preview storage succeeds
- THEN preview is accepted without changing published content
