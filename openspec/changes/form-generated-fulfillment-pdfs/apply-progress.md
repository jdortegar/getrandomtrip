# Apply Progress: Form-generated Fulfillment PDFs

Mode: Strict TDD. Delivery: auto-chain / feature-branch-chain; no size exception.
Completed: 0.1, 0.2 (planning), 1.1 (metadata), 1.2 (validation primitives), 1.3 (XSED parser), 1.4 (experience roadmap), 1.5 (hotel voucher), 1.6 (activity voucher), 1.7 (dinner voucher), 1.8 (trip snapshots), 1.9a (source text), 1.9b (provider candidates), 1.9c (creation prefills), 2.1 (schema applied to approved development/staging database), 2.2a (live locks), 2.2b1 (candidate registration), 2.2b2 (candidate lifecycle), 2.2c1 (candidate cancellation), 2.2c2a (cleanup targets), 2.2b1-hardening (candidate URL namespace), 2.2c2b (immutable tombstone registration), 2.2d (exact-key execution). Historical foundation checkpoint. Current cumulative implementation through2.24/3.11 is recorded below;2.2e was superseded. Final integrated/live/deployment gates remain.
Historical foundation boundary: pure helpers and additive schema. Subsequent entries record routes, dependencies and UI; no later live application-row/storage mutation or deployment is implied.

## TDD Cycle Evidence

| Task | Test file | Layer / Safety net | RED | GREEN | Triangulate | Refactor |
|---|---|---|---|---|---|---|
| 1.1 | `src/lib/trip-documents/__tests__/documentMetadata.test.ts` | Unit / N/A (new files) | Missing-module failure before implementation | Initial 1/1 passed | Draft blanks: 1 failed → 2 passed; bounds/catalog/locale: 20 failed → 72 passed; shape/types: 60 failed → 134 passed; hidden/symbol fields: 2 failed → 136 passed | Extracted field/limit constants, ordered imports, formatted; 144/144 including catalog regression passed |
| 1.2 | `src/lib/trip-documents/__tests__/validationPrimitives.test.ts` | Unit / N/A (new); 144 existing regression tests passed before work | Missing-module failure before implementation | Initial 1/1 passed | Calendar: 8 failed → 25 passed; time/range: 25 failed → 50 passed; HTTPS: 29 failed → 79 passed; bounds: 8 failed → 87 passed | Extracted limits, bounded UTF-8 allocation, formatted; 231/231 including prior regressions passed |
| 1.3 | `src/lib/trip-documents/parsers/__tests__/xsedRoadmap.test.ts` | Unit / N/A (new); 231 existing regressions passed; review-fix baseline 70/70 | Missing-module failure before implementation | Initial 1/1 passed | Required/metadata: 9 failed → 10 passed; shape/bounds/IDs: 58 failed → 68 passed; consolidated 65 cases; formats: 4 failed → 69 passed; whitespace URL: 1 failed → 70 passed; hidden-field review fix: 3 failed → 73 passed, nested cases → 75 passed | Consolidated structural/error assertions and expected output; rejected hidden descriptors consistently; 306/306 regression tests passed |
| 1.4 | `src/lib/trip-documents/parsers/__tests__/experienceRoadmap.test.ts` | Unit / 306 baseline; new XSED approval test passed before helper extraction | Missing-module failure before implementation | Initial 1/1 passed | Required/shape/bounds/metadata: 43 failed → 44 passed; dates/range: 1 failed → 46 passed | Shared strict-record helper extracted without XSED behavior changes; 353 regressions passed |
| 1.5 | `src/lib/trip-documents/parsers/__tests__/hotelVoucher.test.ts` | Unit / N/A (new); 353 baseline regressions passed | Missing-module failure before implementation | Initial 1/1 passed | Required/shape/bounds/IDs/metadata: 60 failed → 61 passed; formats/range: 7 failed → 70 passed | Shared voucher text validation/types extracted; 423/423 regression tests passed |
| 1.6 | `src/lib/trip-documents/parsers/__tests__/activityVoucher.test.ts` | Unit / N/A (new); 423 baseline regressions passed | Missing-module failure before implementation | Initial 1/1 passed | Required/shape/bounds/IDs/metadata: 56 failed → 61 passed; lowercase date/time: 2 failed → 67 passed | Reused shared voucher/metadata rules, formatted; 490/490 regression tests passed |
| 1.7 | `src/lib/trip-documents/parsers/__tests__/dinnerVoucher.test.ts` | Unit / N/A (new); 490 baseline regressions passed | Missing-module failure before implementation | Initial 1/1 passed | Required/shape/bounds/IDs/metadata: 57 failed → 62 passed; existing shared format rules + inclusive limits: 70 passed | Reused shared voucher/metadata rules, formatted; 560/560 regression tests passed |
| 1.8 | `src/lib/trip-documents/__tests__/snapshots.test.ts` | Unit / N/A (new); 560 baseline regressions passed | Missing-module failure before implementation | Initial 1/1 passed | Template/locale/pax/isolation: 21 failed → 23 passed; invalid/oversized facts: 2 failed → 25 passed; review extended-year cases: 2 failed → 27 passed | Bounded fact/date helpers and readable test alias; nested isolation verified; initial 585/585 and review-fix 587/587 regressions passed |
| 1.9a | `src/lib/trip-documents/__tests__/sourceText.test.ts` | Unit / N/A (new); 587 baseline regressions; review baseline 16/16 | Missing-module failure before implementation | Initial 1/1 passed | Unknown/bounds/HTML: 13 failed; list assertion made semantic; empty-editor failure fixed → 14; escaped tags/links → 16. Review: two body-discovery failures, then head approval failure → 19; bounded bodies → 21 | Named limits, shared bounds, full-fragment walker/head skip; Node 21/21 and aggregate 608/608 passed |
| 1.9b | `src/lib/trip-documents/__tests__/providerSnapshots.test.ts` | Unit / N/A (new); 608 baseline regressions | Missing-module failure before implementation | Initial 1/1 passed | Current/legacy/roles/selection/bounds: 27 failed → 29 passed; merged bounds/no-fetch/source isolation → 31 passed | Shared normalization/bounds, named candidate types, formatted; Node 31/31 and aggregate 639/639 passed |
| 1.9c | `src/lib/trip-documents/__tests__/providerPrefills.test.ts` | Unit / 639 baseline; review safety net 53 passed | Missing-function failure before implementation | Initial 1/1 passed | Narrative/itinerary: 6 failed → 20 passed; joined bounds/claims → 22; edited-legacy HTML review: 3 failed → 23, ordinary text → 24 | Composed helpers, removed unreliable shape-based text-format inference, formatted; initial 661/661 and corrected 663/663 regressions passed |
| 2.1 | `src/lib/trip-documents/__tests__/schema.test.ts`; DTO/email adjacent tests | Schema contract + mocked behavior / 20 affected baseline tests | Missing draft-model contract failed | Initial 1/1 passed | Preview/link/outbox/index contracts: 9 failed → 10 passed; generated metadata + DTO/email isolation → 33 affected tests passed | Preserved published scalars; formatted tests; 696/696 aggregate passed, offline validate/generate and typecheck passed |
| 2.2a | `src/lib/db/__tests__/tripDocumentLocks.test.ts` | Node unit / new files; 11 schema baseline passed | Missing-module failure before implementation | Initial 1/1 passed | Ordering/ownership/missing/conflicts: 17 failed → 18 passed; error/await/input/SQL cases → 22 passed | Shared fixtures/table cases; 22 focused and 718 aggregate passed; typecheck/Prettier passed |
| 2.2b1 | `src/lib/db/__tests__/tripDocumentCandidates.test.ts` | Node unit / new files; 33 lock/schema baseline; review safety net 31 passed | Missing-module failure before implementation | Initial 1/1 passed | Publication/validation: 16 failed → 21 passed; UUID/clock: 3 failed → 31 passed; review key/Int bounds: 4 failed → 35 passed | Shared fixtures/assertions; fixed test callback return type; 35 focused/753 aggregate passed; typecheck/Prettier/diff check passed |
| 2.2b2 | `src/lib/db/__tests__/tripDocumentCandidateLifecycle.test.ts` | Node unit / new files; 57 lock/registration baseline passed | Missing-module failure before implementation | Initial 1/1 passed | Identity/state/expiry: 23 failed → 26 passed; preview and out-of-Date-range clock → 28 passed | Shared clock/fixture controls; 28 focused/781 aggregate passed; typecheck/Prettier/diff check passed |
| 2.2c1 | `src/lib/db/__tests__/tripDocumentCancellation.test.ts` | Node unit / new files; 85 lifecycle/registration/lock baseline passed | Missing-module failure before implementation | Initial 1/1 passed | Scope/state/validation: 16 failed → 20 passed; kind snapshot and retained-retry cancellation → 24 passed | Narrowed locked-row projection; 24 focused/805 aggregate passed; typecheck/Prettier/diff check passed |
| 2.2c2a | `src/lib/trip-documents/__tests__/cleanupTargets.test.ts` | Node pure unit / new files; 27 cancellation/key-builder baseline passed | Missing-module failure before implementation | Initial 1/1 passed | Ownership/namespace/identity/bounds/immutability: 31 failed → 33 passed; review URL-segment regression: 35 baseline → 7 RED → 42 GREEN | Shared identity/key fixtures; explicit four-case UTF-8 table → 35 passed; grouped escaped-dot/query/fragment cases, no further refactor needed; 850 aggregate/typecheck/Prettier/diff checks passed |

Verification: `npm run test -- src/lib/trip-documents/__tests__/documentMetadata.test.ts src/lib/trips/__tests__/destinationCountries.test.ts` → 144 passed (136 new + 8 existing); `npm run typecheck` → pass; targeted Prettier check → pass. Full suite/lint not rerun; known baseline failures unchanged by this isolated unit.

Contract: complete metadata shape; typed field-path errors (`$` for malformed/unknown shape), explicit draft/generation mode. Label trim and 120-character ceiling match uploads; country codes remain exact/case-sensitive across all 24 catalog countries; locale is always en/es. Drafts allow blank label/country only. No inferred defaults or mutations. No design deviations; no approval tests required.

Task 1.2 verification: `npm run test -- src/lib/trip-documents/__tests__/validationPrimitives.test.ts src/lib/trip-documents/__tests__/documentMetadata.test.ts src/lib/trips/__tests__/destinationCountries.test.ts` → 231 passed (87 new + 144 existing); typecheck and targeted Prettier check passed.

Task 1.2 contract: seven pure predicates; real fixed-width calendar dates (Gregorian leap rules), HH:mm wall times, inclusive ordered date ranges, absolute credential-free HTTPS syntax without fetching/host restrictions. Parsers own optional/draft blanks. Bounds allow empty text/arrays, cap text at 4000 JS string units and arrays at 50; serialized request text is capped at 128 KiB UTF-8 bytes, not characters. Request readers must also enforce the exported byte cap while streaming. No design deviations or approval tests required.

Task 1.3 verification: `npm run test -- src/lib/trip-documents src/lib/trips/__tests__/destinationCountries.test.ts` → 306 passed (75 XSED + 231 prior). Typecheck and targeted Prettier passed. Discriminated template/version + metadata + data envelope; strict shapes/bounds and unique nonblank stop IDs always validated. Drafts preserve incomplete text; generation requires scalars/stop title/directions and validates supplied dates/times/HTTPS links. Optional links/date/time may be absent or empty; whitespace-only links cannot publish. Stop order and custom text remain untouched. Review fix rejects non-enumerable properties at every record level: previously validation saw hidden fields that result spreading/JSON would drop. No design deviations.

Task 1.4 verification: `npm run test -- src/lib/trip-documents src/lib/trips/__tests__/destinationCountries.test.ts` → 353 passed (46 experience + 307 prior/approval). Typecheck and targeted Prettier passed. Draft content stays editable; generation validates required scalars, inclusive real travel-date range, nonempty suggested activities, optional date/time/map links. Unique stable IDs/order/authored text preserved; strict shapes/descriptor rules shared with XSED, metadata rules remain centralized. One approval test covers null-prototype envelopes before extraction; no design deviations.

Task 1.5 verification: `npm run test -- src/lib/trip-documents src/lib/trips/__tests__/destinationCountries.test.ts` → 423 passed (70 hotel + 353 prior). Typecheck and targeted Prettier passed. Generation requires holder, authored guest text, valid inclusive stay dates and property name/address. Supplied times/issue date/HTTPS links validate; drafts preserve incomplete formats. Optional reservation/payment/supplier wording remains absent unless authored; inclusions may be empty, supplied items require stable unique IDs and complete titles for generation. Shared voucher text helper currently handles `Date`/`Time`/`Url` suffixes. No design deviations.

Task 1.6 verification: `npm run test -- src/lib/trip-documents src/lib/trips/__tests__/destinationCountries.test.ts` → 490 passed (67 activity + 423 prior). Typecheck and targeted Prettier passed. Generation requires authored participants, provider name/address, real local date/time and at least one program item. Optional inclusions/claims stay absent unless supplied; unique stable IDs/order and authored text survive. Drafts retain incomplete strings while shapes/types/bounds remain strict. Shared voucher helper now also recognizes lowercase `date`/`time`; all 70 hotel regressions pass. No design deviations.

Task 1.7 verification: `npm run test -- src/lib/trip-documents src/lib/trips/__tests__/destinationCountries.test.ts` → 560 passed (70 dinner + 490 prior). Typecheck and targeted Prettier passed. Generation requires authored guests, restaurant name/address, real local date/time and service. Menu arrays may be empty; supplied items preserve order/unique stable IDs and need titles for generation. Optional conditions/holder/claims/links stay absent unless supplied; drafts preserve incomplete content. Existing shared validation reused unchanged. No design deviations.

Task 1.8 verification: `npm run test -- src/lib/trip-documents src/lib/trips/__tests__/destinationCountries.test.ts` → initial 585 passed; review-fix 587 passed (27 snapshot + 560 prior). Unsupported extended/negative years now remain blank through shared ISO-calendar validation. Typecheck and targeted Prettier passed. Creation-only typed source accepts Prisma Date fields; UTC day prefills roadmaps only. Buyer + companion names and valid pax use existing EN/ES dictionary wording; exact `en`, otherwise `es`. Basic destination/title facts copy without mutable references; unknown/oversized facts remain blank, never truncated. All five outputs validate as drafts; nested objects/arrays remain independent. Voucher booking schedules/claims stay blank/absent. Provider/itinerary normalization deferred to 1.9. No design deviations.

Task 1.9a verification: focused Node-environment `sourceText.test.ts` → 16 passed; aggregate document/catalog command → 603 passed; typecheck/targeted Prettier passed. Public existing `@react-email/components.toPlainText` is synchronous and non-DOM; no dependency changes. Plain mode preserves exact text; explicit HTML mode decodes entities and preserves paragraphs/headings/list order without executing markup, fetching URLs or appending hrefs. Limits: 128 KiB UTF-8 input, 4000-character output, depth 64/4096 children; limit/truncation/failure returns blank, not partial content. Only 1.9a implemented after approved a/b/c split.

Task 1.9a review fix: default body discovery silently skipped later bodies beyond width/depth limits (both RED returned `First`). Full-fragment selection uses the marker-aware walker; explicit head skip preserves the prewritten full-document approval test. Under-limit triangulation covers both bodies; empty inline tags isolate the inclusive 4096-child boundary (empty block tags initially exceeded the independent output bound). Final Node 21/21, aggregate 608/608, typecheck, targeted Prettier and diff check passed. No runtime/configuration changes.

Runtime evidence: standalone `tsx` CLI smoke failed on sandbox IPC `listen EPERM` before loading the helper. No escalation/config/environment workaround; the same utility was verified through Vitest's per-file Node environment (0 ms DOM environment). Final Netlify packaging remains a later gate; reusing the React Email public export may affect server bundle size.

Rollback: revert the respective isolated unit. Next: fresh review, then task 2.2. Schema application requires explicit verified-target approval; schema-branch publication also requires deploy-hook verification. No DB/deploy verification claimed.

Task 1.9b verification: Node candidate tests → 31 passed; aggregate document/catalog tests → 639 passed; typecheck/targeted Prettier/diff check passed. Legacy/current hotel facts preserve authored text; current fields take precedence without stale legacy fallback. XSED roles use fixed source/section slots; experience activities never become dinner candidates. Original indices survive filtering; all selection requires an explicit valid index, with no singleton fallback. Contact names remain contact text, service titles never become provider names, links require bounded credential-free HTTPS, and referral/time/confirmation claims remain absent. Results are independent; no saved draft or itinerary is accepted or mutated. Source application remains 1.9c.

Task 1.9c verification: initial Node 22/aggregate 661 passed; review-corrected Node 24/aggregate 663 passed; typecheck/targeted Prettier/diff check passed. Creation-only factory composes buyer defaults, explicit selection and ordered itinerary items with deterministic original-position IDs. Review found editors retain legacy `day` and may omit `durationRhythm` after writing HTML; these are not text-format discriminators. All itinerary descriptions/general-experience activity descriptions/risks now normalize HTML; XSED activity fields stay plain and section bodies normalize HTML. Plain `2 < 3` remains readable. All five outputs pass draft parsers with frozen sources and independent snapshots. Global inclusions/menu breakdowns/booking schedules/payment/supplier claims stay unknown. Bounds fail blank without truncation; no saved draft input or shared-itinerary mutation.

## Planning Refinement: Candidate Lifecycle (Pre-schema)

Documentation-only correction before task 2.1; completed 1.1–1.9a and all TDD/runtime evidence above remain unchanged. Implementation next remains 1.9b; no schema, DB, deployment or runtime verification claimed.

The existing outbox now plans pre-write candidate registration, atomic retained adoption receipts, authorization/live-owner checks before committed-retry recognition, and scoped cancellation under ordered locks. Ambiguous DB outcomes require reconciliation, not exception-driven deletion. Draft deletion cancels previews/unfinished publications but preserves retained published generations; replacement preserves historical bytes and email stamps.

SDK retries mean even successful `set` cannot prove every PUT settled. Compact deletion tombstones therefore survive observed absence with bounded scheduled sweeps/capped backoff and alerts. The achievable guarantee is eventual cleanup after writes quiesce/storage recovers; metadata retention and continuing sweep cost are explicit. Hotel holder is required for generation, unlike the generic optional voucher field.

## Task 2.1: Schema Prepared, Not Applied

Added separate trip-cascading drafts with nullable preview/publication identities and unique optional document link (`SetNull`); added relation-free cleanup jobs with `pending|retained|delete` enum, scalar ownership/receipt identities, JSON targets, expiry/retry metadata and lookup indexes. Deletion tombstones survive owner deletion and observed blob absence. No existing published scalar changed; manual DTO and scheduled-email query isolation pass. Runtime immutability/ownership/cleanup enforcement belongs to later service tasks.

Verification: 11 schema contracts + 3 DTO + 7 email + 12 traveler-route tests passed; full document/catalog/compatibility selection → 696 passed. Typecheck, targeted Prettier and diff check passed. Offline `prisma validate` and `npm run db:generate` passed with explicit dummy `DATABASE_URL` (Client v7.8.0). No DB connection, push/migrate, build, deployment or backfill performed; configured remote DB remains unverified.

Deploy preflight (read-only): `postinstall → npx prisma generate && node scripts/copy-tinymce-to-public.mjs`; `build → next build`; `build:clean → rm -rf .next && npm run build`. Tracked Netlify configuration contains no build command/schema hook; both explicit `db:push` and `db:migrate` mean `prisma db push`, and migration history is empty. Netlify dashboard build-command overrides remain unverified: verify before publishing schema branches, approve database target before applying.

## Task 2.1: Authorized Schema Application (2026-09-23)

User confirmed the configured remote target is development/staging and authorized updating it. Independent review approved exactly 13 additive statements: one enum, two tables (two primary keys), eight indexes and two draft foreign keys; no destructive/unrelated drift. Initial sandbox read-only preflight returned P1001; one narrowly escalated retry succeeded without connection changes. CLI and Next development select the identical `.env` datasource; no process override or `.env.local` database URL.

Immediately before application, a fresh live-to-desired diff matched the reviewed 3,035-byte SQL exactly: SHA256 `5f6a89717a61a8f68471c7f3a3078ef3a6862b7feca33775a8fb88e42058ee25`. `npm run db:push` exited 0, reported synchronization and emitted no Prisma warnings. No data-loss/reset/force flags, schema edits, backfill, build or deployment. This deploys previously TDD-verified schema; no new code/TDD cycle or test run was needed.

Post-application diff exited 0 and contains only `-- This is an empty migration.` Read-only catalog queries restricted to the new objects verified 19 draft/15 cleanup columns, 10 indexes including two primary keys, two draft foreign keys, zero cleanup foreign keys and enum labels `pending|retained|delete`; defaults/nullability/delete actions match. No application rows queried. The metadata client's generic future SSL-mode semantics warning did not change TLS/connection settings.

Sanitized evidence: `/private/tmp/randomtrip-schema-apply-SOOfgp/evidence.json`, `before.sql`, `after.sql`, `new-model-metadata.json`. Prior offline evidence above remains historical; schema is now applied. Live rollback requires a separately reviewed plan, not automatic table drops. Runtime lifecycle enforcement and deployment smoke verification remain pending.

## Task 2.2a: Ordered Live Transaction Locks

Injectable DB helper locks buyer owner → trips → drafts → documents → outbox, with at most five parameterized `ORDER BY id FOR UPDATE` batches. IDs are deduplicated/sorted and inputs snapshotted; missing rows, changed ownership, absent declared parents and contradictory identities reject before callback. Callback/lock errors propagate to the transaction runner. Manual scope types remain separate; no blob I/O/client singleton import. Authorize first; callback owns revision/link/receipt checks and must not acquire earlier lock groups.

Verification: `npm run test -- src/lib/db/__tests__/tripDocumentLocks.test.ts src/lib/trip-documents src/lib/trips/__tests__/destinationCountries.test.ts src/lib/trips/__tests__/tripDocumentDto.test.ts src/lib/email/__tests__/sendTripStartVouchers.test.ts 'src/app/api/trips/[id]/__tests__/route.test.ts'` → 718 passed; typecheck/targeted Prettier/diff checks passed. Unit fakes verify transaction/SQL ordering and rollback propagation, NOT real concurrency or account-scale timing. No DB/network access this slice. Tombstone sweeps after parent deletion must use a separate outbox-only path; scope discovery and actual service/deletion integration remain later tasks. Split 2.2a–e keeps candidate lifecycle/cancellation/exact-key/prefix execution separate; next 2.2b.

## Task 2.2b1: Durable Candidate Registration

Approved b1/b2 split keeps this child registration-only. A server UUID is both receipt primary key and exact-key suffix; one pending INSERT commits before returning frozen identity/key instructions. Duplicate calls get fresh IDs; collisions fail without upsert or altering existing receipts. Preview/publication identities and expiry are snapshotted; expiry is checked after live ordered locks. Explicit reserved document IDs are not existing-row lock targets; no fake attachment is created. JSON targets use `{keys: [exactKey], prefixes: []}`; complete keys above 600 UTF-8 bytes or revisions outside positive PostgreSQL Int reject before transaction. No blob I/O or exception-driven deletion.

Registration tests cover both publication target modes, invalid identities/dates/generators, missing/mismatched ownership, collisions, transaction failures, mutation isolation, ASCII/Unicode 600/601-byte keys and revision 2147483647/2147483648/MAX_SAFE_INTEGER. No real DB/concurrency proof. Adoption/expiry transitions and ambiguous-result reconciliation remain 2.2b2 within the caller's locked transaction; render/publish later recheck revisions/links atomically. Conditional PUT `modified:false` must not authorize deleting pre-existing bytes; storage integration remains later work.

Verification: prior 2.2a aggregate command plus `src/lib/db/__tests__/tripDocumentCandidates.test.ts` → 753 passed; `npm run typecheck`, targeted Prettier and diff check passed. No DB/network/schema/dependency/Git/deploy operations; branches remain local pending external deploy-hook verification.

## Task 2.2b2: Transaction-level Candidate Lifecycle

Exact-identity receipt reads lock only outbox rows; pending retention and the caller's DB-only adoption callback share its transaction. Retained retries skip that callback and return disposition, NOT attachment success: authorize/check live ownership and surviving links before invoking; pending revision/preview checks and pointer writes belong in the callback. Callback errors must abort the outer transaction. Outbox-only conditional expiry changes pending→delete and schedules cleanup without ancestors; retained receipts/targets survive expiry and supersession. No current-key inference, nested transaction or blob I/O.

Verification: prior 2.2b1 aggregate command plus `src/lib/db/__tests__/tripDocumentCandidateLifecycle.test.ts` → 781 passed; typecheck, targeted Prettier and diff check passed. Tests cover every identity field, exact targets, missing/cancelled/expired candidates, lost conditional updates, callback rollback contract, serialized expiry/adoption orders, parent-free expiry and snapshot isolation. Unit fakes do NOT prove live concurrency. No DB/network/schema/dependency/Git/deploy; cancellation/worker and render/publish integration remain later tasks.

## Task 2.2c1: Scoped Candidate Cancellation

Approved c1/c2 split: caller-transaction cancellation only, before deletion/unlink. Authorize and lock buyer owner → all live trips → drafts → documents first, finish scope discovery before this sorted outbox batch, and acquire no ancestors afterward. Draft scope cancels previews/pending publications but preserves retained publications; document scope cancels its publications while preserving previews; trip/account scope uses buyer ownership, not uploader/tripper. Already-delete rows and all immutable targets/identities/retry metadata remain unchanged; changed rows become delete with immediate scheduling. No prefix/legacy tombstones, deletion or blob I/O yet.

Verification: prior 2.2b2 aggregate command plus `src/lib/db/__tests__/tripDocumentCancellation.test.ts` → 805 passed; typecheck, targeted Prettier and diff check passed. Tests cover four scopes, ownership isolation, retained history, idempotency, invalid scopes/clocks, SQL parameters/order, rollback propagation, snapshots and both serialized adoption/cancellation orders using the real lifecycle helper. Unit fakes do NOT prove live concurrency/account-scale timing. No DB/network/schema/dependency/Git/deploy operations. Next c2 registers durable scope/legacy targets; actual service deletion and worker integration remain later tasks.

## Task 2.2c2a: Safe Cleanup Target Planning

Approved c2a/c2b split: pure server planner accepts trusted complete DB snapshots, verifies selected buyer/trip and child linkage, and derives only scope-specific trailing-slash generated prefixes. Draft plans never cover publications. Account expands verified trips, with no owner-root prefix. Legacy trip/UUID keys get one job each; valid generated document keys are covered by prefixes. Rejects unsafe/empty segments (including URL-structural %, ? and #), conflicting facts/key identities, wrong namespaces and targets over 600 UTF-8 bytes. Deep-frozen jobs use deterministic domain-separated SHA256 IDs; reordered/duplicate facts preserve identity. Candidate records are never inputs or modified. Review found that SDK URL interpolation can reinterpret escaped dots/query/fragment characters; seven test-first regressions now reject them. The existing candidate-registration validator needs a separate corrective child.

Verification: prior c1 aggregate command plus this test and `src/lib/storage/__tests__/tripDocumentStore.test.ts` → 850 passed; typecheck, targeted Prettier and diff check passed. Includes ASCII/Unicode exact-600/601-byte keys/prefixes, scope isolation and frozen-source/output checks. Planner cannot establish live authorization or source completeness: callers must verify locked snapshots and persist before cascades. No persistence/storage/DB/network/dependencies/Git mutations; c2b and worker remain deferred. One legacy key per job trades extra rows for bounded, retry-stable work.

## Candidate URL Namespace Hardening (2.2b1 Follow-up)

Local continuation integrates preserved PDF tip `ace55baa` with develop `010d414c`; historical tracker/PR references and all prior evidence above remain unchanged. Candidate registration now rejects URL-structural %, ?, #, whitespace and controls consistently with cleanup planning, across owner/trip/draft/preview/document identities before transaction entry. Valid Unicode identities and complete 600-byte keys remain accepted; 601-byte keys remain rejected. No storage, schema, dependency, API or UI changes.

| Task | Test file | Safety net | RED | GREEN / triangulation | Refactor |
|---|---|---|---|---|---|
| 2.2b1-hardening | `src/lib/db/__tests__/tripDocumentCandidates.test.ts` | 77 registration/planner tests passed | 14 unsafe-input cases failed with wrong lock-scope errors | 95 registration/planner tests passed; 18 unsafe strings across five identity positions, valid ASCII/Unicode byte boundaries | Formatting only; focused regression and typecheck/targeted lint passed |

Verification: `npm run test -- src/lib/db/__tests__/tripDocumentCandidates.test.ts src/lib/trip-documents/__tests__/cleanupTargets.test.ts` → 95 passed; expanded registration/lifecycle/cancellation/locks/planner selection → 169 passed; `npm run typecheck` and targeted ESLint passed. Unit fakes prove pre-transaction rejection, not actual DB concurrency. Next: 2.2c2b immutable tombstone registration. Local cleanup waiting state is cleared; external deploy-hook/schema-publication gate and renderer lockfile size exception remain unresolved. No remote publication or global merge-gate pass claimed.

## Task 2.2c2b: Immutable Tombstone Registration

Caller-transaction helper recomputes deterministic cleanup plans from trusted complete locked facts, inserts sorted missing jobs with conflict skipping, and reads back every immutable field/target. Matching retries preserve attempts, lastError, createdAt and nextAttemptAt; mismatched/candidate collisions abort without overwrites. Acquire the complete scoped cancellation outbox batch after ancestor locks first; register and cascade/unlink in the same transaction, propagating errors. No new subset/ancestor locks, nested transaction or storage I/O. Empty account plans make no DB calls; invalid clocks fail before persistence. Readback uses an ID map rather than quadratic matching.

| Task | Test file | Safety net | RED | GREEN / triangulation | Refactor |
|---|---|---|---|---|---|
| 2.2c2b | `src/lib/db/__tests__/tripDocumentCleanupRegistration.test.ts` | 66 planner/cancellation passed | Missing-module failure | 1 passed; 15 identity/clock/empty-plan failures → 23 passed; missing-readback and retained-candidate coverage → 25 passed | ID-map lookup, formatting; 194 focused regressions passed |

Verification: registration + candidate registration/lifecycle/cancellation/locks + cleanup-planner selection → 194 passed; typecheck, targeted ESLint, Prettier and diff checks passed. Tests cover prefix/legacy jobs, retries, collisions, rollback after insert/read/commit or caller deletion failure, input snapshots, empty/invalid scopes and unrelated retained candidates. Unit transaction fakes do not establish live concurrency. No DB/schema/dependency/worker/endpoint changes. Next: 2.2d exact-key tombstone execution; external deploy-hook gate and renderer dependency size exception remain unchanged.

## Task 2.2d: Parent-independent Exact-key Tombstone Execution

Injected executor reads the durable job without parent lookups and only deletes terminal `delete` dispositions. Pending/retained/missing jobs skip; malformed identities, multi-key/prefix targets, unsafe namespaces and oversized keys reject before storage. Preview/publication keys derive from receipt identities; legacy keys must reproduce the deterministic cleanup-planner job ID. One exact delete per invocation; tombstones remain untouched after success or absence so later sweeps remove late PUT/SDK retry bytes. Read/storage failures propagate; scheduling/backoff and prefix execution remain 2.3/2.2e, not part of this unit.

| Task | Test file | Safety net | RED | GREEN / triangulation | Refactor |
|---|---|---|---|---|---|
| 2.2d | `src/lib/trip-documents/__tests__/cleanup.test.ts` | 67 registration/planner passed | Missing-module failure | 1 passed; 13 unsafe/mismatched-job failures → 20 passed; byte-boundary/legacy-identity/read-failure coverage → 24 passed | Formatting; 218 lifecycle/planner/executor regressions passed |

Verification: exact executor + planner + registration/candidate/lifecycle/cancellation/locks selection → 218 passed; typecheck, targeted ESLint, Prettier and diff checks passed. Fake storage tests cover repeated absent/successful sweeps followed by late PUT, retained/publication safety, failed deletion retry and valid Unicode 600-byte/invalid 601-byte targets. No actual storage deletion, DB, schema, dependency, worker or endpoint operation. Retained jobs require recurring worker scheduling before eventual cleanup is operational; no immediate-permanent-absence guarantee. Next: 2.2e bounded prefix tombstone execution. External publication/dependency gates unchanged.

## Transient Activity Renderer Continuation (2026-09-24)

Recovery: clean develop `186454a5` contains hotel vertical milestone `1e6ffbeb` as ancestor; external home/XSED changes preserved. Prior blocked prefix WIP remains in stash `8bdd8a36` (untracked files in third parent), NOT restored or approved. Historical lifecycle evidence above remains intact. Hotel dependency/render/form/preview work is already committed; user prioritizes usable transient templates, not cleanup/storage. Renderer-only dependency exception was separately approved; historical QR/package exception is not approval for further dependencies.

Activity renderer uses existing generation parser, local logo, hotel-aligned teal/cyan A4 branding, EN/ES copy, authored provider/participants/date/time/program/inclusions/recommendations and optional claims; no inferred confirmation/payment, QR, persistence or network assets. Node boundary rejects output above4MiB. Helvetica fidelity gap remains explicit.

| Unit | RED | GREEN / triangulation | Refactor / verification |
|---|---|---|---|
| Activity renderer | Missing-module failure before source |7 renderer tests +67 activity parser +7 hotel renderer =81 passed |Typecheck and targeted lint passed; actual EN1page/ES4page PDFs inspected, all30 long-program titles/accents extracted |

QA artifacts: `/private/tmp/activity-render-qa/`; logs `/private/tmp/activity-render-{red,green,typecheck}.log`. No DB/schema/install/server/remote operations. Next autonomous unit: guarded activity preview endpoint, then editor/modal integration; publication/storage gates remain pending, prefix work remains deferred.

## Transient Dinner Renderer (2026-09-24)

Hotel and activity vertical previews are retained; activity UI milestone `e82c14c8` is the clean starting point. Dinner follows the inspected gastronomy reference with local branding and authored restaurant/service/menu/conditions only; no inferred reservation/payment claims or QR. Existing dinner parser allows an empty menu when service is supplied. Persistent lifecycle and stashed prefix work remain deferred.

| Unit | RED | GREEN / triangulation | Verification |
|---|---|---|---|
| Dinner renderer | Missing-module failure |8 renderer tests; validation, locale, authored claims, empty menu,4MiB boundary and renderer failure |92 renderer/parser regressions, typecheck/targetlint; actual EN1page/ES4pages,30menu entries, accents and2HTTPSlinks |

Visual QA found separate title/description nodes orphaned headings despite minPresenceAhead. One text flow with orphans/widows keeps headings with descriptions; extracted page-ending assertions failed before and pass after. Latest PNG inspected. Evidence `/private/tmp/dinner-render-qa/` and `/private/tmp/dinner-render-{red,green,typecheck}.log`. Helvetica remains interim. Next: dinner endpoint then editor/preview integration; no DB/install/server/remote work.

## Transient Voucher Delivery Checkpoint (2026-09-24)

Hotel (`1e6ffbeb`), activity (`e82c14c8`) and dinner (`f4e3db5c`) now have complete **transient** admin form→private PDF preview flows. These are local milestones, not completion of the original persistent-draft/publication specification. Activity commits: renderer `0380c106`, endpoint `d47a4aa6`, form `8d45f776`, repeatables `4b51bff2`, request hook `0575162c`, UI `e82c14c8`. Dinner commits: renderer `72e8c0c3`, endpoint `06b59cb1`, form `7479d556`, menu `17f3439a`, hook `da6383a9`, UI `f4e3db5c`.

Both new flows preserve live-admin/trip checks, streamed128KiB request/4MiB PDF limits, generation validation, private/no-store responses, safe errors, editable buyer-locale/date suggestions, authored-only claims and stable repeatables. Hooks abort/ignore stale fetch/blob work and revoke object URLs on edit/replacement/reset/unmount. Modal close/Escape and dirty-only beforeunload guards protect unsaved input. Existing upload and trip-save handlers remain independent; no drafts, storage, attachment or email mutations were added. Dinner copy uses Diners/Comensales, not hotel terminology.

| Scope | Test-first evidence | Verification |
|---|---|---|
| Activity endpoint/form/repeatables/hook/UI | Missing-module or new-behavior RED before each unit; provider-label EN/ES regression repaired |123 endpoint/parser/renderer;82 scalar;80 repeatable;30 hook;71 final focused tests passed |
| Dinner endpoint/form/menu/hook/UI | Missing-module or new-behavior RED before each unit; Diners/Comensales RED4→GREEN21 across form/PDF |153 endpoint/parser/renderer;101 scalar;84 menu;45 hook;80 final focused tests passed |
| Final dinner integration review | Independent review |60 integration tests, typecheck and new-code lint passed; existing dashboard loadTrip effect lint baseline remains unchanged |

Browser QA on the existing server submitted sample dinner data and received an Open PDF preview link. At360px, dialog width360/client358/scroll358; at1280px, dialog width1024/client1022/scroll1022: no horizontal overflow. Blob navigation was not attempted after the earlier policy block, so **browser PDF painting is unverified**. Separate actual Node-rendered PDFs were visually inspected as recorded above; HappyDOM's unsupported blob-iframe warning is not browser-rendering evidence.

Remaining: both roadmap forms/renderers; original draft save/versioning, storage/worker/publication/attach/replace/email integration; licensed-font fidelity, QR and complete shared layout; complete bilingual fixture suite, full build/Netlify preview and external deploy-hook verification. Prefix WIP remains deferred in stash `8bdd8a36`; no restoration or approval implied. The earlier726-line renderer+QR dependency exception remains historical/pending; only the separate renderer-only515-line exception was approved. Original pending task groups below must not be marked complete by these transient subsets.

## Transient Experience Roadmap Renderer (2026-09-24)

Existing voucher milestones and publication-risk history above are unchanged. Experience roadmap now renders only authored origin/destination/date range/duration/heading, ordered suggested activities with optional dates/times, and optional validated HTTPS map link. Local logo, teal/cyan A4 branding, EN/ES labels and4MiB output guard reuse the established pattern; no route planning, map fetch, QR, confirmation or persistence is inferred.

| Unit | RED | GREEN / triangulation | Verification |
|---|---|---|---|
| Experience roadmap renderer | Missing-module failure |9 renderer +46 parser tests passed; invalid ranges/locale/map/empty activities, optional schedule/map, size/failure paths |Typecheck/targetlint; actual EN1page/ES4page PDFs inspected,30stops/accents/map annotation preserved |

QA `/private/tmp/experience-render-qa/`; logs `/private/tmp/experience-render-{red,green,typecheck}.log`. Activity title/schedule/description share an orphan-controlled text flow. Helvetica remains interim. Next: guarded experience-roadmap endpoint and editor/modal, then XSED roadmap; original persistent lifecycle remains pending.

## Transient XSED Roadmap Renderer (2026-09-24)

Experience transient form→private PDF preview completed at `b7548a8c`; prior milestones/history remain unchanged. XSED renders authored origin/destination, departure date/time, driving duration, ordered stop directions with optional schedules and validated HTTPS map. No routing, fetching, confirmation or persistence is inferred.

- RED: missing renderer module; visual QA then exposed unsupported Helvetica arrow, with a failing separator assertion before the ASCII fix.
- GREEN:9 renderer +76 parser tests; typecheck and targeted lint passed. Generation validation, optional fields, EN/ES,4MiB boundary and render failures covered.
- Actual PDF QA: EN1page/ES4pages,30stops, accents, directions and map annotation preserved; inspected page images, no clipping or orphan headings. Local logo/teal-cyan branding; Helvetica remains interim. Evidence `/private/tmp/xsed-render-qa/`, `/private/tmp/xsed-render-{red,green,typecheck}.log`, `/private/tmp/xsed-glyph-red.log`.
- Next: XSED guarded endpoint, editable form, hook and modal. Original persistent lifecycle, QR/font fidelity and deployment verification remain pending.

## Five Transient Preview Flows Complete (2026-09-24)

This cumulative checkpoint supersedes earlier next-template notes without removing their evidence. Hotel `1e6ffbeb`, activity `e82c14c8`, dinner `f4e3db5c`, experience roadmap `b7548a8c` and XSED roadmap `37731d70` now provide admin form→private PDF preview. All five include bilingual editable forms, authored repeatables, guarded streamed requests, generation validation, response limits, safe errors and stale-request/object-URL cleanup. Known trip suggestions remain editable; no automatic routing, travel-type gating, supplier confirmation or persistent attachment is inferred.

- Final combined verification: **658 tests across30 suites passed**, covering allfive parsers/renderers/endpoints/forms/hooks/modal integrations. **69 scoped source/test files lint clean**; nonincremental typecheck passed. Logs and manifests: `/private/tmp/pdf-final-*`.
- Existing dashboard `loadTrip` effect lint error remains; reproduced against HEAD using ESLint stdin. No unrelated cleanup was performed.
- Root browser QA submitted sample experience and XSED roadmap forms; both produced Open PDF preview links. Dialogs had no horizontal overflow at360px and1280px. **Actual browser PDF painting remains unverified**: no blob navigation was attempted after the earlier IAB policy block. Node-rendered PDF visual QA is recorded separately above.
- Original persistent specification remains incomplete: draft save/versioning, storage/publication, attach/replace/email integration, QR/licensed-font fidelity, complete fixtures/build/Netlify preview and external deploy-hook verification are pending. Next implementation scope is **persistent drafts and attachment**, not more template forms.
- Deferred prefix-cleanup WIP stays in stash `8bdd8a36`; no restoration, schema expansion or liveness-fix approval is implied. Prior explicit publication-risk consent and dependency-exception history are unchanged.

## Persistent Draft Contract Foundation (2026-09-24)

First bounded persistent-draft subunit: five-template draft-mode dispatch, strict revision/document PATCH envelope and explicit admin DTO allowlist. Incomplete authored strings remain saveable; generation requirements are not applied. Stored template/version/data are validated before reopening; DTO excludes keys, hashes, internal publication identity and stale preview IDs. Snapshots are not refreshed. This does not yet implement DB CRUD or optimistic conflict enforcement.

RED missing module → GREEN19contract +329parser tests (348total); nonincremental typecheck, targeted lint passed. Evidence `/private/tmp/draft-contract-{red,green,typecheck}.log`. Next: locked revision-controlled create/read/update using existing owner→trip→draft locks, then authenticated collection/item APIs and save/reopen UI. Template/version immutability and revision conflicts are mutation responsibilities, not claims of this pure contract unit.

## Cleanup Scope Amendment (2026-09-24)

Independent audit3137/decision3139 resolved the generated-file prefix liveness blocker by using the existing durable pre-PUT exact-key ledger, not an unsupported resumable SDK cursor. Design/tasks now require fair bounded permanent rescheduling of exact-key tombstones after absence and parent deletion; known uploaded keys remain covered, historical unregistered orphans are excluded. No schema change or stash restoration occurred. Next storage unit: committed candidate registration → raw-key immutable PUT with size/hash metadata; adoption/publication follow before worker scheduling.

## Authenticated Cleanup Scheduling (2026-09-24)

Worker core committed `1d811334`; this adapter follows existing hourly Netlify→internal POST conventions. Internal POST requires CRON_SECRET before invoking one bounded batch, returns only counters and logs sanitized failures. Scheduled fetch rejects redirects/insecure origins and times out at25s; the API declares30s. A fetch abort does not prove remote worker cancellation: durable leases recover interrupted runs. Netlify documents scheduled production functions as non-URL-invocable with30s execution limit: https://docs.netlify.com/build/functions/scheduled-functions/ . Deployment/configuration/runtime invocation remains unverified.

StrictTDD: RED two missing modules → GREEN11 adapter tests/2suites; nonincremental typecheck and scoped lint pass. Worker evidence remains61 tests/3suites in `/private/tmp/worker-green.log`; adapter logs `/private/tmp/schedule-{red,green,typecheck}.log`. No live storage/DB/server activity. Cumulative persistent implementation/task reconciliation follows as a separate documentation unit; prior milestone history is preserved.

## Optional Local QR Images (2026-09-24)

All five wrappers encode supplied optional provider/location/map HTTPS URLs locally and pass PNG buffers to labeled clickable QR blocks. No URL fetching/shortening or extra toggles/schema. Above2,000 UTF-8 bytes, retain the existing clickable link without QR rather than failing a valid document; absent URLs create no QR. Generation validation precedes assets and the4MiB PDF cap remains. RED missing helper/component plus5wrapper assertions → GREEN52tests/6suites; typecheck/scopedlint pass. Real EN/ES hotel PDFs generated; ES page visually inspected. Native Swift Vision decode failed on unavailable ANECF model loading, so decoded payload verification remains a final-QA gate. Evidence `/private/tmp/qr-behavior-*`, `/private/tmp/qr-hotel-{en,es}.pdf`.

## Local Barlow and Publication-neutral Footer (2026-09-24)

All five wrappers register local Barlow only after generation validation; templates use regular/bold Barlow weights. Shared EN/ES footer is now “Travel document” / “Documento de viaje”, valid for both private preview and unchanged published bytes. Baseline54tests → RED20newfailures → GREEN74tests/7suites; nonincremental typecheck/scopedlint pass. Rebuilt XSED EN/ES fixtures: long ES5pages/56,586bytes, embedded/subset Unicode BarlowRegular/Bold confirmed by pdffonts; first/last pages visually inspected with QR and neutral page footers. Full20-fixture QA/buildtrace/deployment still pending. Evidence `/private/tmp/font-integrate-*`, `/private/tmp/xsed-render-qa/`.


## Cumulative Persistent Feature Checkpoint (2026-09-24)

**Implementation complete; final verification incomplete.** Earlier “persistent lifecycle pending” statements describe historical transient milestones, not the current code. Nothing below claims live database concurrency, storage delivery, deployment, or release readiness.

| Implemented boundary | Concrete implementation/evidence |
|---|---|
| Private drafts2.4–2.7 | Five-template incomplete validation/safe DTO; locked create/read/CAS-update/delete; transaction-loaded buyer locale/provider snapshots; admin collection/item APIs. Draft deletion preserves attachment and retained publication receipts. |
| Render2.16–2.17 | Generation dispatcher→committed candidate→immutable raw-key PUT→revision-bound atomic adoption; SHA256/size identity and4MiB guard; authenticated renderPOST and verified stored-byte previewGET. Historical receipt reconciliation handles ambiguous adoption without unsafe deletion. |
| Publication2.18–2.20 | Exact stored bytes, stable request identity, retained publication receipt, explicit stable-ID replacement and email timestamps untouched. Pending/expired request recovery is explicit; no silent new request or rerender-on-attach. |
| Lifecycle2.21–2.24 | Attachment deletion preserves/unlinks draft; two trip-delete routes and account deletion use complete buyer-owned ordered locks, cancellation and known-key intents in the cascade transaction. Uploader/tripper associations do not define cleanup scope. |
| Worker2.3 | Real Prisma/Netlify20-job ordered skip-locked selection, conditional TTL expiry, claim lease/CAS scheduling, permanent success/absence sweeps, capped sanitized failure backoff. Authenticated hourly adapter committed `531b5fc4`; core `1d811334`. |
| Authoring3.1–3.11 | All five forms/repeatables, independent incomplete Save draft, conflict preservation/confirmed reload, saved-byte preview, explicit attach/replace, stable publication refresh event, confirmed draft deletion, dirty/unload guards and abort/stale-response protection. |
| Entry consolidation | Five redundant dashboard transient launchers removed; retained compatibility components/endpoints. Single EN/ES Generate document panel beside upload, automatic provider/draft load, gated creation and visible retry. Parent browser panel360/1280no-overflow; no draft/editor/attachment mutation tested live. |
| Assets2.8–2.15 | Renderer and QR installed with scripts disabled, generated Prisma unchanged; licensed local Barlow and six explicit tracing patterns; all five templates have local optional QR and neutral preview/publication footer. Font integration `c35f1f15`; QR `2734d1e2`. |

### Cumulative TDD / verification evidence

These are per-unit results, not an additive unique-test total. Earlier tables and progress sections remain intact.

| Boundary | RED → GREEN / regression | Evidence |
|---|---|---|
| Draft contracts/backend/API | Missing/new behavior failures before implementations; guarded source/owner/revision/DTO tests | `/private/tmp/draft-contract-*`, adjacent `src/lib/db/__tests__` and admin draft API tests |
| Render/publication | Validation/adoption/receipt/replacement failure cases; real bytes and fake storage; selected dispatcher/retirement scope strengthened after review | `/private/tmp/attach-*`, `/private/tmp/attach-api-*`, `/private/tmp/preview-get-*`; reviewed render `84476f2a`, initial publication `8ea690be` |
| Deletion | Attachment route9RED→38tests; cascade helper missing-moduleRED→78tests; admin trip8RED→25; buyer trip7RED→24; account7RED→32 | `/private/tmp/{attachment-route,cascade-cleanup,admin-trip-delete,second-trip,account-delete}-*` |
| Scheduling | Core missing-moduleRED→61tests/3suites; adapter missing-moduleRED→11tests/2suites | `/private/tmp/{worker,schedule}-*` |
| Draft-delete UI / consolidation |5RED→37tests; automatic-load2RED plus stale-load triangulation→40tests/4suites | `/private/tmp/{draft-delete-ui,consolidate}-*`; nonincremental typecheck/new scoped lint passed; installed Next SWC transform passed |
| QR / fonts | QR missing helper plus5wrapper failures→52tests; font integration20RED→74tests/7suites | `/private/tmp/{qr-behavior,font-integrate}-*`; actual PDFs/local assets, no URL fetch |

### Final QA status — not release-ready

- Report `/private/tmp/pdf-final-visual-qa/report.md`:20fresh fixtures,56A4pages,max57,374bytes, all five contact sheets inspected without clipping/overlap; both Barlow weights embedded, accents/page counters/30long-item headings preserved. All32 standard HTTPS destinations exist as clickable annotations and decode from actual150dpi raster QR crops.
- **Documented limitation:**2,000-byte dense URL produces88,785-byte PDF;100pt QR fails150dpi decoding but exact destination decodes at300dpi. This satisfies scannability; the spec does not require150dpi, so no new acceptance blocker is imposed. Low-resolution scanning is not universally reliable; full clickable URL is intact.
- Earlier343files/3,613tests checkpoint is historical. Frozen `0e3211de` final rerun passes345suites/3,654tests and nonincremental typecheck (`/private/tmp/pdf-final-full-tests.log`, `/private/tmp/pdf-final-full-typecheck.log`). Full lint baseline is53errors/11warnings, not only the dashboard effect; new scoped lint passes, no blanket repository-lint pass claimed.
- Live DB concurrency/commit-loss, actual stored publication/browser painting, cleanup late-write recovery, Netlify preview/cron/secret/external hook smoke remain unverified. Isolated production build/traces subsequently passed as recorded below. No production deploy, new schema/client generation or live application mutation was performed for this checkpoint.
- Original prefix WIP stash remains untouched. Do not archive: resolve remaining QA findings, run final verification, and record deployment gates explicitly.


### Frozen-state compatibility audit (0e3211de)

Current implementation branch `codex/pdf-unified-workflow`, independent review PASS. Read-only inspection of upload POST, traveler list/stream, safe document DTO and trip-start email confirms publication compatibility: all consume TripDocument, never private draft content/preview keys. Existing auth/visibility boundaries remain; upload behavior unchanged and generated attachment uses the same published-row DTO/stream path. Final full-suite evidence includes51 relevant tests across upload, stream, delete, email, DTO and visibility suites; explicit private-draft exclusion cases pass. Task4.1 code/regression gate complete, while actual browser published PDF painting/live email/storage delivery remains pending. No source edits or new tests during isolated build verification.


### Isolated production build and asset tracing
Frozen `0e3211de` built successfully in `/private/tmp/getrandomtrip-prod-verify.y4rn6B`:190/190pages and type checks, no DB fallback/errors. All six render-route NFT manifests include BarlowRegular, BarlowBold, OFL and logo (24required asset entries), confirmed in `/private/tmp/pdf-final-build-traces.json`. Verification runtime wasNode25, not configured NetlifyNode20: deployment/runtime smoke remains open. The working-tree3010server was not restarted; parent confirmed it remained alive. No live DB/storage mutation is implied by the isolated build.

## Browser-memory Preview Contract — MP1 (2026-09-24)

User approved preview without storage upload; persistence only on explicit Attach. Prior stored-preview implementation/evidence above is historical, not overwritten. Live diagnosis separately proved Netlify Blobs401 at store stage, not renderer failure.

Added isolated bindMemoryDocumentPreview/verifyMemoryDocumentPreview contract: existing server-owned DB digest/revision/size and opaque UUIDv7 identity, previewKey=null, one-hour expiry unaffected by updatedAt. Live ordered locks and exact-byte comparison reject foreign/stale/tampered previews; no storage call/candidate or server-memory cache. RED missing module then8tests GREEN; endpoint/client/publication integration remains pending MP2/MP3. Existing diagnostics changes remain a separately reviewed unit; no live DB/storage calls, schema changes or credential edits in MP1.

### MP2 — Direct render response and reviewed browser Blob
Render now binds metadata and returns private PDF bytes with identity/revision headers, without storage/candidate registration; existing obsolete stored-preview receipts still retire via ordered exact-key cleanup. Client accepts direct PDF and legacy JSON/GET responses, retains the exact direct Blob across ambiguous Attach retries with stable request ID, and discards late blobs on identity changes. Tests RED then63tests/4suites GREEN; nonincremental typecheck and scoped lint PASS. MP2 incremental code/test budget232lines; Attach sends bounded-PDF transport but server support/final expiry checks remain MP3, so no attachment/browser-publication completion claim.

### MP3 — Explicit byte-verified Attach
Attach accepts at most4MiB streamed raw PDF after live admin/trip checks, with bounded identity headers; legacy JSON/stored previews remain supported. Locked DB digest/size/current revision/identity checks reject arbitrary or stale browser bytes before PUT. Final atomic publication independently rechecks immutable one-hour expiry; matching retained receipt retries remain successful after expiry/edits without another PUT. Browser keeps the reviewed Blob/request identity across ambiguous retries. Bilingual UI now says Preview PDF and explains browser-only lifetime/explicit persistence. RED then95tests/6suites GREEN; nonincremental typecheck/scoped lint PASS. Parent verified live hotel preview succeeds without storage401; embedded PDF painting remains unverified in IAB. No actual Attach, email, credential or schema mutation performed by this implementation; Netlify authorization still blocks publication until repaired.

Combined local checkpoint:349suites/3,706tests PASS (`/private/tmp/pdf-memory-final-tests.log`), nonincremental typecheck and scoped lint PASS. This supersedes only the local test count, not historical evidence or outstanding live publication/Netlify gates.

Parent live browser checkpoint: all five TEST ONLY draft previews generated successfully with no alerts and an Attach action, without live Attach/email. Embedded PDF painting remains unverified because IAB blob navigation is security-blocked; no bypass attempted. Subsequent approved UI redesign is tracked separately in `pdf-document-workflow`.
