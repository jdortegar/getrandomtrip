# Design: Transactional Emails — Complete the Catalogue

## Technical Approach

Option B from the proposal: a centralized email service at `src/lib/email/index.ts` exposing one named async function per lifecycle email. Each function owns its data fetch (Prisma), locale resolution, template render, and `sendMail` call. Callers in request paths invoke fire-and-forget (`void send...()`) so email never blocks an HTTP response. Templates live in `src/emails/` and replicate `ExperienceApproved.tsx` exactly (default React component + named `subjects` export + internal bilingual `copy`). No inline template logic at trigger sites.

## Architecture Decisions

| # | Decision | Choice | Rejected | Rationale |
|---|----------|--------|----------|-----------|
| D1 | Service shape | Named async fns keyed by domain id (`sendBookingConfirmed(tripRequestId, userId)`) in one file | One generic `send(type, payload)` dispatcher | Explicit signatures are type-safe, self-documenting, and each fn fetches only the data it needs |
| D2 | Template shape | Mirror `ExperienceApproved.tsx`: default component + `subjects` export + internal `copy` | New shared layout component | Consistency with the one live template; zero new abstraction; test script already expects this shape |
| D3 | BookingConfirmed idempotency | Fire only inside the existing `status === "APPROVED"` block in `updatePaymentFromStripeWebhook`, gated so the pre-update `payment.status` was NOT already APPROVED/COMPLETED | Track a `confirmationEmailSentAt` column | The fn runs only on the APPROVED transition that also sets CONFIRMED; the existing `TERMINAL_STATUSES` guard already blocks duplicate terminal events. No schema change |
| D4 | Admin PATCH branching | After `prisma.tripRequest.update`, branch on the resolved transition: REVEALED, COMPLETED, CANCELLED — each independent | Single notify call | One PATCH can only carry one `nextStatus`; reveal also triggers when `actualDestination` is set without status |
| D5 | WelcomeEmail placement | Inside `if (account?.provider === "google" && !dbUser)` in `signIn`, after `prisma.user.create`, using `void sendWelcomeEmail(dbUser.id)` | jwt/session callbacks | Those run on every request; the `!dbUser` branch is the only true new-account path |
| D6 | ExperienceSubmitted recipient | `to: process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com"`, Spanish only | Per-tripper locale | Internal admin notification; no user locale involved |
| D7 | CTA URLs | Absolute `https://getrandomtrip.com/${locale}/dashboard` (template-local `BASE_URL`) | Relative/env-based | Matches `ExperienceApproved.tsx` `BASE_URL`; emails need absolute links |

## Data Flow

    Trigger site (webhook / PATCH / signIn)
         │  void sendXxx(domainId, userId)   ← fire-and-forget, never awaited
         ▼
    src/lib/email/index.ts :: sendXxx
         │  Prisma fetch (user.locale, trip/experience fields)
         │  locale = user.locale ?? "es"
         │  render Template({ ...props, locale })
         ▼
    sendMail({ to, subject: subjects[locale], content: { react } })
         │  try/catch → console.error("[email]", err)   ← swallowed
         ▼
    Resend

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/email/index.ts` | Create | 7 named send fns, each: fetch → resolve locale → render → sendMail, all try/catch wrapped |
| `src/emails/BookingConfirmed.tsx` | Create | Client, ES/EN, CTA → dashboard |
| `src/emails/PaymentFailed.tsx` | Create | Client, ES/EN, CTA → retry checkout |
| `src/emails/DestinationRevealed.tsx` | Create | Client, ES/EN, shows revealed destination |
| `src/emails/TripCancelled.tsx` | Create | Client, ES/EN |
| `src/emails/TripCompleted.tsx` | Create | Client, ES/EN |
| `src/emails/ExperienceSubmitted.tsx` | Create | Admin, ES only, links to review queue |
| `src/emails/WelcomeEmail.tsx` | Create | Client, ES/EN, onboarding CTA |
| `src/lib/db/payment.ts` | Modify | In `updatePaymentFromStripeWebhook`, capture `payment.status` before update; inside APPROVED block, if prior status not APPROVED/COMPLETED, `void sendBookingConfirmed(payment.tripRequestId, payment.userId)`. Add `void sendPaymentFailed(...)` on FAILED |
| `src/app/api/stripe/webhook/route.ts` | Modify | No change if PaymentFailed handled in `payment.ts`; otherwise branch on `newStatus === "FAILED"` |
| `src/app/api/admin/trip-requests/[id]/route.ts` | Modify | After update, branch on transition → reveal/completed/cancelled send fns |
| `src/app/api/tripper/experiences/[id]/submit/route.ts` | Modify | After PENDING_REVIEW update, `void sendExperienceSubmitted(experience.id, user.id)` |
| `src/lib/auth.ts` | Modify | After Google `user.create`, `void sendWelcomeEmail(dbUser.id)` |
| `scripts/send-test-email.ts` | Modify | Register all 7 templates with sample props |

## Interfaces / Contracts

```ts
// src/lib/email/index.ts
export async function sendBookingConfirmed(tripRequestId: string, userId: string): Promise<void>;
export async function sendPaymentFailed(tripRequestId: string, userId: string): Promise<void>;
export async function sendDestinationRevealed(tripRequestId: string, userId: string): Promise<void>;
export async function sendTripCancelled(tripRequestId: string, userId: string): Promise<void>;
export async function sendTripCompleted(tripRequestId: string, userId: string): Promise<void>;
export async function sendExperienceSubmitted(experienceId: string, tripperId: string): Promise<void>;
export async function sendWelcomeEmail(userId: string): Promise<void>;
```

Each body: `try { fetch; render; await sendMail(...); } catch (err) { console.error("[email]", err); }`. Never throws. Each template: `export default function T(props): JSX` + `export const subjects: { es: string; en: string }`.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Manual render | All 7 templates render in ES/EN | `npx tsx scripts/send-test-email.ts <Name>` with sample props |
| Integration | Triggers fire on real events, no double-send | Stripe test webhook (succeeded twice), admin PATCH per transition, new Google sign-in |
| Type | Service + templates compile | `npm run typecheck` |

## Migration / Rollout

No migration required. Purely additive — no schema or data changes. Rollback = remove `@/lib/email` imports at trigger sites; service and templates stay dormant.

## Open Questions

- [ ] PaymentFailed home: in `payment.ts` (consistent with BookingConfirmed) vs. webhook route — recommend `payment.ts` for one trigger surface.
- [ ] DestinationRevealed dual trigger (status=REVEALED and actualDestination-only) — fire on either, guard against double if both arrive in one PATCH.
