# Proposal: Form-generated Fulfillment PDFs

## Intent

Generate fulfillment PDFs from admin forms, preserving uploads, access and emails.

## Scope

### In Scope
- Five templates: XSED/experience roadmaps and hotel/activity/dinner vouchers; template-specific fields and reorderable content.
- Generate beside upload; responsive form/preview editor; incomplete saved drafts, validated previews, explicit attachment/replacement and unsaved-change warnings, independent of trip Save changes.
- Editable snapshot prefills; English/Spanish defaulting to buyer language; translated standard copy, unchanged custom text and admin-controlled reservation/payment/confirmation wording.
- Per-trip repeatable instances; private drafts; branded multipage A4 PDFs, page numbers, location links and optional locally generated HTTPS-provider QR codes.

### Out of Scope
- Shared-template editing, automatic translation, route planning, shared-experience itinerary mutation, inferred supplier confirmations, automatic correction emails and version-history UI.

## Capabilities

### New Capabilities
- `trip-document-authoring`: Admin-only draft CRUD, forms, prefills, locale, validation, optimistic revisions, previews and editor states.
- `trip-document-pdf-rendering`: Five branded templates, bundled assets, pagination, links, QR generation, private previews and recoverable 4 MiB output limit.

### Modified Capabilities
- `trip-fulfillment-documents`: Byte-identical preview publication, idempotent attachment, stable-ID confirmed replacement, retained superseded blobs, independent draft/attachment deletion and storage cleanup. Authorization, country catalog, traveler gates and email eligibility remain unchanged.

## Approach

Add separate `TripDocumentDraft` with template/version, locale, metadata, validated data, revision, preview metadata and optional `TripDocument` link. Admin endpoints expose authenticated URLs, never storage keys. Use server-side `@react-pdf/renderer` v4 `renderToBuffer`, bundled fonts/logo; never fetch provider URLs. Publish exact preview bytes into distinct immutable blobs; reject stale previews/conflicts. Retain superseded blobs until document/trip deletion; clean account cascades. Draft/attachment deletion is independent. Never reset email timestamps.

## Affected Areas

| Area | Impact |
|---|---|
| `prisma/schema.prisma` | Additive draft persistence |
| `src/app/api/`, `src/lib/` | Draft/publication APIs, rendering, storage cleanup |
| `src/components/app/admin/trip-fulfillment/` | Editor entry and draft management |
| `src/dictionaries/` | English/Spanish copy |

## Risks

| Risk | Mitigation |
|---|---|
| Draft leakage or races | Separate storage/model; authorization and revision tests |
| PDF overflow/runtime limits | Multipage visual QA; size cap; Netlify deploy-preview smoke test |
| Large change | Auto-chain reviewable slices into a feature branch |
| PR creation | Issues disabled; approved-issue prerequisite blocks PRs, not local work |

## Rollback Plan

Revert entrypoints/endpoints; retain additive schema, drafts, published PDFs, blobs and email timestamps.

## Dependencies

- PDF/QR runtimes, local brand assets; verified database target before schema application.

## Success Criteria

- [ ] All five templates work in both languages with long content and editable drafts.
- [ ] Preview/publication bytes match; access, conflicts, replacement and cleanup tests pass.
- [ ] Existing uploads/downloads/emails remain compatible; strict TDD, typecheck, lint, tests and build pass.
- [ ] 360/1280 px UI, PDFs/QRs and Netlify deploy preview verified.
