# Proposal: Destination Reveal Flow

## Intent

The reveal experience is broken and incomplete. Three concrete problems:

1. `reveal-destination/RevealDestinationClient.tsx` calls a phantom external API (`${NEXT_PUBLIC_BACKEND_API_URL}/api/reveal`) — nothing links to it. Dead code.
2. `api/bookings/route.ts` is a stub: fakes a UUID, writes nothing, called by nothing. Dead code.
3. Admins manually flip status to `REVEALED` with no reminder; clients have no dedicated reveal moment.

We need an automated, time-driven reveal flow that reminds admins to assign destinations, auto-reveals on schedule, and gives clients a real reveal page.

## Scope

### In Scope
- Schema: `TripRequest.destinationAssignmentNotifiedAt` (DateTime?); add `ADMIN` to `NotificationAudience`.
- Netlify scheduled function `destination-reveal.ts` (hourly `0 * * * *`) → `POST /api/internal/destination-reveal` with `Bearer ${CRON_SECRET}`.
- Cron logic: T-72h admin assignment reminder pass; T-48h client auto-reveal pass.
- New client reveal page `/{locale}/dashboard/trips/[id]/reveal` (pre-reveal countdown + post-reveal hero).
- New `DestinationAssignmentReminder` admin email; update `DestinationRevealed` email CTA to the reveal page.
- Client dashboard trip cards link to reveal/countdown for CONFIRMED and REVEALED trips.
- Delete dead code: `reveal-destination/` route, `api/bookings/route.ts`, `/reveal-destination` from `secureClientPaths.ts`.

### Out of Scope
- Itinerary details page `/dashboard/trips/[id]/details` (referenced as CTA target only).
- Payment, status flow before `CONFIRMED`, experience authoring.
- Push/SMS channels; only in-app + email.

## Capabilities

### New Capabilities
- `destination-reveal`: time-driven cron passes (T-72h admin reminder, T-48h auto-reveal), reveal-eligibility rules, and the `destinationAssignmentNotifiedAt` contract.

### Modified Capabilities
- `05-client-dashboard`: client reveal page + trip-card reveal entry points.
- `06-xsed`: new admin reminder email; `DestinationRevealed` CTA retarget.

## Approach

Hourly Netlify scheduled function calls an internal authenticated route. Pass 1 (T-72h): for `CONFIRMED` trips with `startDate <= now+72h` and `destinationAssignmentNotifiedAt IS NULL`, notify all admins (in-app `Notification` audience `ADMIN` + `DestinationAssignmentReminder` email), then stamp `destinationAssignmentNotifiedAt`. Pass 2 (T-48h): for `CONFIRMED` trips with `startDate <= now+48h` and `experienceId IS NOT NULL`, set `REVEALED` + `destinationRevealedAt`, send `DestinationRevealed`. Trips without an experience stay `CONFIRMED` and re-escalate via Pass 1. Reveal page reads `/api/trips/[id]`; renders countdown pre-reveal, hero + CTA post-reveal.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | New field + enum value |
| `netlify/functions/destination-reveal.ts` | New | Hourly scheduler |
| `src/app/api/internal/destination-reveal/route.ts` | New | Cron logic |
| `src/app/[locale]/dashboard/trips/[id]/reveal/` | New | Reveal page |
| email templates | New/Modified | Reminder email + CTA update |
| `src/app/[locale]/(secure)/reveal-destination/` | Removed | Dead code |
| `src/app/api/bookings/route.ts` | Removed | Dead stub |
| `src/lib/helpers/secureClientPaths.ts` | Modified | Drop dead path |
| client dashboard trip cards | Modified | Reveal entry points |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cron double-fires / double-reveal | Med | Idempotent guards on `destinationAssignmentNotifiedAt` and status |
| Trip never assigned an experience | Med | Stays `CONFIRMED`, re-escalates to admins each pass |
| Migration on prod data | Low | Nullable column + additive enum value; safe |
| Deleting live route | Low | Confirm zero references before removal in apply |

## Rollback Plan

Revert the deploy. Schema rollback: drop `destinationAssignmentNotifiedAt` (nullable, no backfill); `ADMIN` enum value is additive and safe to leave. Disable the scheduled function by removing it from `netlify.toml` if reveal misbehaves in prod.

## Dependencies

- `CRON_SECRET` env var (existing pattern, see `xsed-notify.ts`).
- Existing `Notification` model + email infrastructure.

## Success Criteria

- [ ] CONFIRMED trip within 72h with no experience triggers admin reminder (in-app + email) exactly once.
- [ ] CONFIRMED trip within 48h with an experience auto-transitions to REVEALED and emails the client.
- [ ] Client reveal page shows countdown pre-reveal and hero + "Ver Itinerario" CTA post-reveal.
- [ ] Dead code (`reveal-destination/`, `api/bookings`) removed; typecheck + lint pass.
- [ ] All new UI strings localized in `es` and `en`.
