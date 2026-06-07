# Proposal: Experience Review Email Notifications

## Intent

Trippers learn that an experience was approved or rejected only by reopening the dashboard. The rejection note already exists but is surfaced passively inline. We need PROACTIVE email notifications so a tripper knows immediately when an admin acts, closing the feedback loop on the `experience-approval-flow` (already shipped). Resend is fully wired (`src/lib/helpers/sendMail.ts`), so this is additive and low-risk.

## Scope

### In Scope
- `ExperienceApproved` email template (`src/emails/ExperienceApproved.tsx`)
- `ExperienceRejected` email template (`src/emails/ExperienceRejected.tsx`), surfacing `reviewNote`
- Approve route: expand Prisma select to load `owner { email, name }` + fire-and-forget `sendMail`
- Reject route: expand Prisma select to load `owner { email, name }` + `reviewNote` + fire-and-forget `sendMail`
- ES/EN template variants, locale from owner preference, default `es`

### Out of Scope
- In-app notification inbox (future change)
- Notification preferences / unsubscribe controls
- Any Prisma schema migration
- Notifications for other lifecycle events (submit, edit-revert)

## Capabilities

### New Capabilities
- `experience-notifications`: email delivery contract for approve/reject admin actions — templates, locale selection, fire-and-forget dispatch guarantees.

### Modified Capabilities
- None. `admin-experience-review` API contracts (status transitions, response codes) are unchanged; notifications are a side effect appended after the existing DB update.

## Approach

After the existing status update commits in each route, re-select (or extend the existing select) to obtain `owner.email` and `owner.name`. Render the matching React Email template and dispatch via `sendMail`, wrapped in `try/catch` that logs and swallows errors. The HTTP response is unchanged whether the email succeeds or fails. Templates mirror the existing `NewsletterGoLive.tsx` / `XsedCampaign.tsx` style (inline CSS, `@react-email/components`, brand colors).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/emails/ExperienceApproved.tsx` | New | Approval template (ES/EN) |
| `src/emails/ExperienceRejected.tsx` | New | Rejection template with `reviewNote` (ES/EN) |
| `src/app/api/admin/experiences/[id]/approve/route.ts` | Modified | Load owner, fire-and-forget send |
| `src/app/api/admin/experiences/[id]/reject/route.ts` | Modified | Load owner + reviewNote, fire-and-forget send |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Resend outage blocks admin action | Low | Fire-and-forget `try/catch`; never re-throw; HTTP response unchanged |
| Wrong locale in email | Med | Read owner locale preference; default `es` |
| Extra Prisma query latency | Low | Single field expansion on existing query, async send |

## Rollback Plan

Revert the two route edits to their prior Prisma select and remove the `sendMail` calls; delete the two template files. No schema or data changes, so no migration rollback is needed. The approval flow continues to work without emails.

## Dependencies

- Resend env vars (`RESEND_API_KEY`, `EMAIL_FROM`) — already configured
- `src/lib/helpers/sendMail.ts` — already present

## Success Criteria

- [ ] Approving an experience sends the owner an `ExperienceApproved` email
- [ ] Rejecting sends an `ExperienceRejected` email containing the `reviewNote`
- [ ] Email failure never changes the admin action HTTP response
- [ ] Emails render in ES or EN per owner locale, defaulting to ES
- [ ] `npm run typecheck` and `npm run lint` pass
