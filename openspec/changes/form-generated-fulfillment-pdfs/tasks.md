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
| [x] 1.9b | D/providerSnapshots.ts: legacy/current explicit-role candidates and selection. |
| [x] 1.9c | D/providerSnapshots.ts: creation-only provider/itinerary application; draft isolation. |
| [x] 2.1 | prisma/schema.prisma: draft/outbox identities, dispositions, durable receipts/tombstones and indexes; schema/DTO isolation. Applied to approved development/staging DB; post-diff empty. |
| [x] 2.2a | src/lib/db/tripDocumentLocks.ts: injectable ordered owner→trips→drafts→documents→outbox locks; sorted/deduplicated IDs, live ownership and rollback contract tests. |
| [x] 2.2b1 | src/lib/db/tripDocumentCandidates.ts: immutable exact-key candidates, ordered-lock registration before PUT; identity/collision/commit-failure tests. |
| [x] 2.2b1-hardening | Candidate URL namespace alignment with cleanup planner; unsafe identity rejection before transactions and valid Unicode/byte-boundary regressions. |
| [x] 2.2b2 | Candidate adoption/expiry/retained receipts in caller's locked transaction; identity/delete-state/rollback and ambiguous-outcome reconciliation tests. |
| [x] 2.2c1 | src/lib/db/tripDocumentCancellation.ts: caller-transaction scoped candidate cancellation; sorted outbox locks, retained-publication exclusion and deletion identity tests. |
| [x] 2.2c2a | D/cleanupTargets.ts: pure namespace/ownership-safe immutable target planning; one prefix or legacy key per deterministic job, bounds/dedup tests. |
| [x] 2.2c2b | Caller-transaction immutable tombstone registration; retry identity/collision/rollback tests, no candidate overwrite or schedule reset. |
| [x] 2.2d | D/cleanup.ts: exact-key tombstone execution after parent deletion; retain after absence, test late PUT/successful SDK retry. |
| [ ] 2.2e | D/cleanup.ts: bounded prefix tombstone execution; pagination, partial failure and continuing sweep tests. |
| [ ] 2.3 | netlify/functions/: authenticated hourly cleanup worker; bounded batches, capped backoff, durable rescheduling/alerts, including absent keys. |
| [ ] 2.4 | D/drafts.ts: revision-controlled CRUD using 2.2a locks; live ownership/conflict tests. |
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

- [x] Transient activity renderer subunit of2.11–2.15: generation validation, bilingual A4 output,4MiB guard, real render/pagination checks. Persistent lifecycle integration remains pending.

- [x] Transient dinner renderer subunit of2.11–2.15: bilingual output, generation guard,4MiB limit and real pagination QA; persistent delivery pending.

## Completed transient subsets (not original persistent-task completion)
- [x] Hotel admin form→private PDF preview (`1e6ffbeb`), no saved drafts/attachments/email.
- [x] Activity endpoint, bilingual scalar/repeatable editor, request lifecycle and dashboard preview (`0380c106`–`e82c14c8`).
- [x] Dinner endpoint, bilingual scalar/menu editor, request lifecycle and dashboard preview (`72e8c0c3`–`f4e3db5c`).
- [ ] XSED roadmap vertical preview, font/QR fidelity and remaining persistent lifecycle/publication requirements.
- [ ] Browser PDF painting, full build/Netlify preview and external deploy-hook verification; sample dinner POST and360/1280 no-overflow checks passed only.

- [x] Experience-roadmap transient renderer subset: authored itinerary, optional schedule/map, EN/ES/size validation and actual PDF QA; endpoint/editor still pending.

- [x] Experience-roadmap transient endpoint/editor/hook/dashboard preview (`b7548a8c`); no persistent delivery.
- [x] XSED transient renderer subset: authored directions/schedule/map, EN/ES/4MiB validation and real PDF QA; endpoint/editor pending.
