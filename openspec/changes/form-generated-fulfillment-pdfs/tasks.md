# Tasks: Form-generated Fulfillment PDFs

## Review Workload Forecast

Estimated changed lines: 9,000–14,000 (tests, dictionaries, SDD, assets/config, lockfile included).
Delivery strategy: auto-chain
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

Tracker: `codex/form-generated-fulfillment-pdfs`; first child targets tracker, subsequent children target predecessors. Ranges=separate children. Budget 200–350 lines/child; ceiling 400 including evidence/docs. Rollback: revert child; retain data.

Lockfile 2.8: request `size:exception` if unsplittable >400; unapproved, earlier units unblocked. User approved the issues-disabled issue-link exception only; PR creation is unblocked, size ceiling unchanged.

## Execution contract

Predecessor → behavior+adjacent tests. STRICT TDD: RED → GREEN → independent triangulation → refactor/regression; record `npm run test -- <paths>` evidence in apply-progress. Include EN/ES copy with UI. Source files <300 lines.

Path aliases: D=`src/lib/trip-documents/`; A=`src/app/api/admin/trip-requests/[id]/document-drafts/`; U=`src/components/app/admin/trip-fulfillment/`.

## Work units

| Task | Deliverable and verification boundary |
|---|---|
| [x] 0.1 | Proposal/state tracker seed; inspect completeness. |
| [x] 0.2 | Design/specs/tasks planning child; inspect traceability. |
| [x] 1.1 | D/documentMetadata.ts + D/__tests__/documentMetadata.test.ts: metadata validation. |
| [x] 1.2 | D/validationPrimitives.ts: calendar/time/range, HTTPS, bounds. |
| [x] 1.3 | D/parsers/xsedRoadmap.ts + src/lib/types/: XSED partial/full/unknown-shape validation. |
| [x] 1.4 | D/parsers/experienceRoadmap.ts + src/lib/types/: experience roadmap and date-range validation. |
| [x] 1.5 | D/parsers/hotelVoucher.ts + src/lib/types/: hotel voucher, provider and inclusion validation. |
| [x] 1.6 | D/parsers/activityVoucher.ts + src/lib/types/: activity voucher; partial/full/unknown-shape. |
| [x] 1.7 | D/parsers/dinnerVoucher.ts + src/lib/types/: dinner voucher; partial/full/unknown-shape. |
| [x] 1.8 | D/snapshots.ts: buyer/trip/locale snapshots; no inferred claims. |
| [x] 1.9a | D/sourceText.ts: bounded non-executing plain-text/HTML normalization. |
| [ ] 1.9b | D/providerSnapshots.ts: legacy/current explicit-role candidates and selection. |
| [ ] 1.9c | D/providerSnapshots.ts: creation-only provider/itinerary application; draft isolation. |
| [ ] 2.1 | prisma/schema.prisma: draft/outbox candidate dispositions, immutable identities, non-cascading receipts/tombstones and due-time indexes; schema/DTO isolation. |
| [ ] 2.2 | D/cleanup.ts: pre-write registration, locked cancellation/expiry, retained exclusion and compact tombstone sweeps; test late PUT after absence, including successful SDK retry. |
| [ ] 2.3 | netlify/functions/: authenticated hourly cleanup worker; bounded batches, capped backoff, durable rescheduling/alerts, including absent keys. |
| [ ] 2.4 | D/drafts.ts: revision-controlled CRUD; shared owner→trip→draft→document→outbox locking, sorted IDs, live ownership/conflicts. |
| [ ] 2.5 | A/route.ts: authenticated creation/list; isolation. |
| [ ] 2.6 | A/[draftId]/route.ts: read/edit authorization/concurrency. |
| [ ] 2.7 | Draft deletion: cancel previews/unfinished publications under locks; retained publications/attachment survive; test paused writes. |
| [ ] 2.8 | package manifests/lockfile: renderer-v4/QR dependencies; import smoke. |
| [ ] 2.9 | assets/pdf/, next.config.js: licensed bundled assets/tracing. |
| [ ] 2.10 | D/pdf/: shared A4/locale/links/QR layout. |
| [ ] 2.11–2.15 | Five PDF templates, separately; content/pagination. |
| [ ] 2.16 | D/render.ts: register candidate before PUT; revision-bound atomic preview/retained receipt; test size/races, expiry and process/acknowledgement loss. |
| [ ] 2.17 | A/[draftId]/render+preview endpoints: authenticated bytes/error. |
| [ ] 2.18 | D/publish.ts: byte-identical atomic document/draft/receipt adoption; test concurrent attach and ambiguous commit reconciliation without unsafe cleanup. |
| [ ] 2.19 | Confirmed replacement: stable IDs/retained history/email timestamps; test commit-response loss followed by supersession. |
| [ ] 2.20 | A/[draftId]/attach endpoint: authorize/live-owner checks, committed retry before revision/replacement checks; stale/mismatched/deleted attachment tests. |
| [ ] 2.21 | Attachment deletion: preserve/unlink draft, cancel all generations/pending replacements; test ordered-lock attach/delete race and late writes. |
| [ ] 2.22–2.24 | Two trip-delete routes/account deletion separately: ordered-lock cancellation, generated prefixes/legacy keys, buyer-owned scope not uploader/tripper; tombstones survive cascades. |
| [ ] 3.1–3.2 | U/shell/client-hook separately: accessibility/loading/error/save. |
| [ ] 3.3 | U/repeatables: stable-ID add/remove/reorder. |
| [ ] 3.4–3.8 | Five forms separately; edits/validation/localization. |
| [ ] 3.9 | U/draft panel: entry/list/template/state integration. |
| [ ] 3.10 | U/preview-publication: preview/attach/confirmed-replace. |
| [ ] 3.11 | U/dirty guards: close/Escape/unload; independent trip-save. |
| [ ] 4.1 | Upload/traveler/email compatibility regressions against baseline. |
| [ ] 4.2 | Ten bilingual PDF fixtures; long-content/link/QR visual QA. |
| [ ] 4.3 | 360/1280 UI; typecheck/tests/lint/build; Netlify preview verification. |

First implementation: 1.1 typed label/country/locale field-path errors; draft blanks accepted; generation requires 1–120-character label/catalog country; en/es only. Boundary tests; no routes/schema/dependencies/UI.

Verify DB target before application. Baseline: 1742passed/20failed/broken-next-lint; no regressions/production deployment.
