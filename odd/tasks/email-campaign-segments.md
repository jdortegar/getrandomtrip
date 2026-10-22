# Email campaign segments

## Objective

Let admins create their own contact segments, assign contacts to them, and target campaigns at any segment — instead of the fixed `ContactSource` pair (waitlist / friends & family).

## Decisions (2026-10-19)

1. New `Segment` table (name, description) managed from a new **Segments** admin tab.
2. Contact ↔ segment is **many-to-many** (`ContactSegment`); assigned from an "Edit" action on the Contacts table.
3. "Lista de espera" and "Amigos y familia" become **system segments** (`systemKey` `WAITLIST` / `FRIENDS_FAMILY`): seeded by the migration, current contacts backfilled from `Contact.source`, new waitlist signups and friends & family additions join them automatically. System segments can be renamed but not deleted. `Contact.source` stays as the contact's origin only.
4. Campaigns target segments (`CampaignSegment`); the audience is subscribed contacts in **any** selected segment with the campaign's locale. Existing campaigns are backfilled from `segmentSources`. Sent campaigns keep their recipients (send rows are already stored).
5. Expand only: `Campaign.segmentSources` is kept (no longer read for targeting); a later contract can drop it.
6. Same branch `fix/campaign-editor-save-spacing`, then one PR into `develop` (user choice).

## Tasks

- [ ] S1 — Schema + migration: `Segment`, `ContactSegment`, `CampaignSegment`; seed system segments; backfill memberships and campaign targets (idempotent). Apply to the dev DB only after checks.
- [ ] S2 — Backend: segment repository + admin API (list with member counts, create, rename, delete non-system); contact segment assignment (PATCH `segmentIds`); waitlist/F&F auto-membership; campaign create/update with `segmentIds`; audience and sending by segments; validation + tests.
- [ ] S3 — Admin UI: Segments tab (list, create, rename, delete with confirm); Contacts "Edit" modal (name, locale, segments) and segment filter; campaign editor chips from segments; campaigns list segment filter; es/en copy.

## Checks

Test-first Vitest per task, `npx tsc --noEmit`, `npm run lint`; `prisma validate` + `migrate diff` for S1; manual QA on develop after merge.

## Progress

- 2026-10-19: prior UI commits on the branch: `805d86d5`, `e478dc75`, `1c06c8c4`. Plan written.
- S1+S2 done (route: delegated writer, uncommitted): schema `Segment`/`ContactSegment`/`CampaignSegment`, migration `20261019120000_email_campaign_segments` (matches `migrate diff`; seeds `seg_waitlist` / `seg_friends_family`; backfills), `segments.ts` + `segmentRules.ts`, contacts/campaigns/sending by segments, segments admin API, backfill script memberships. RED observed per module; GREEN 511 tests (writer), 329 email-campaign tests + tsc (parent). Interim UI bridge in `campaignForm.ts` / `campaignListSort.ts` until S3. Risks: app relies on fixed system ids (migration must run first); re-applying the migration re-adds system memberships from `contacts.source`.
- S3 done (route: delegated writer, uncommitted): Segments tab (`SegmentsPageClient`, `SegmentsTable`, `SegmentFormModal`, page + heading), contacts Segments column + filter + `ContactEditModal` + segment picker on add form, editor chips from `GET /segments` (`SegmentChipPicker`, `useSegments`), campaigns list segment filter by id, es/en copy. Interim bridge removed (new campaigns still preselect `SYSTEM_SEGMENT_IDS.WAITLIST`). RED: 12 tests + new suite failed. GREEN: 518 tests across email-campaigns UI/backend/waitlist/scripts, tsc, lint, prisma validate (parent re-run).
- Pending: manual QA (360/1280, rename system segment, in-use delete 409, contact edit with several segments, editor chip counts, list filter); apply migration to dev DB before deploy.
