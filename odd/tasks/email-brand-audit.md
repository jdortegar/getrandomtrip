# Email brand audit

## Objective

Bring every template in `src/emails/` in line with the brand rules settled on the
BookingConfirmed and AdminNewBooking emails.

## Rules

- Body text, headings, labels, values, subtext: Ink `#383838`.
- Primary CTA button: Ochre `#E5A51C` background, Ink `#383838` text.
- Links (inline anchors, mailto): Deep Teal `#0F5C60`, underlined.
- CTA points at the specific item (trip, post, experience) when its id is in props and a matching route exists.
- Social footer: Instagram, Facebook, LinkedIn (`https://www.linkedin.com/company/getrandomtrip`, `social-linkedin.png`); no X.
- Out of scope: XSED orange (`#d97e4a`) sub-brand accents; status colors with meaning (errors, warnings); backgrounds/borders.

## Route

Delegated direct — writer trigger: ~30 non-trivial template files.

## Tasks

- [x] T1 BookingConfirmed: colors, PNG logo, LinkedIn footer, trip CTA (tests: `__tests__/BookingConfirmed.test.tsx`)
- [x] T2 AdminNewBooking: colors, teal mailto, admin trip CTA (tests: `__tests__/AdminNewBooking.test.tsx`)
- [x] T3 Remaining shared-layout templates: colors + teal links; CTA destinations evaluated (none changed, see T5) (tests: `__tests__/emailBrandRules.test.ts`)
- [x] T4 Own-layout templates (NewsletterGoLive, XsedCampaign, TripStartVouchers): X → LinkedIn (no recolor: designed campaigns)
- [x] T5 Item-specific CTAs for BlogApproved/BlogRejected (`/dashboard/tripper/blog/{id}`) and ExperienceApproved/ExperienceRejected (`/dashboard/tripper/experiences/{id}`): needs an optional/required id prop plus a one-line caller change in `src/app/api/admin/{blogs,experiences}/[id]/{approve,reject}/route.tsx` — done inline: `blogId`/`experienceId` props, routes pass `params.id`, `scripts/send-test-email.ts` updated (tests: `__tests__/tripperReviewCtas.test.tsx`)
- [x] T6 `scripts/email-preview.html` X → LinkedIn. `public/images/newsletter/social-x.png` kept on purpose: emails already sent load it from production.

## Checks

`npx vitest run src/emails`, `npm run typecheck`, `npx eslint src/emails`.

## T3/T4 outcomes

Colors = grey text (#111827, #5A5858, #888, #1f2937, #626262, #6b7280, #9ca3af, #999999) → Ink; #facc15 CTA → Ochre + Ink text.

| Template                                          | Colors                                               | CTA                                                                                | Footer       |
| ------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------ |
| AdminTripContactMessage                           | Ink                                                  | none                                                                               | layout       |
| BlogApproved / BlogRejected                       | Ink, Ochre CTA                                       | `/dashboard/tripper/blog` → `/dashboard/tripper/blog/{blogId}` (T5)              | layout       |
| BlogCopyApproved / BlogCopyRejected               | Ink                                                  | none                                                                               | layout       |
| BlogPendingTripperReview                          | Ink, Ochre CTA                                       | kept: `reviewUrl` already item-specific                                            | layout       |
| BlogSubmitted                                     | Ink, Ochre CTA                                       | kept: already `/dashboard/admin/blog/{blogId}`                                     | layout       |
| CampaignEmail                                     | Ink, Ink CTA text, teal inline + unsubscribe links   | kept: admin-authored URL                                                           | layout       |
| ContactFormSubmission                             | Ink, teal mailto                                     | none                                                                               | layout       |
| DestinationAssignmentReminder                     | Ink, Ink CTA text (amber/red status kept)            | kept: already admin trip                                                           | layout       |
| DestinationRevealed                               | Ink, Ochre CTA (white on dark teaser kept)           | kept: already `/dashboard/trips/{id}/reveal`                                       | layout       |
| ExperienceApproved / ExperienceRejected           | Ink, Ochre CTA                                       | `/dashboard/tripper/experiences` → `.../experiences/{experienceId}` (T5)         | layout       |
| ExperienceCopyApproved / ExperienceCopyRejected   | Ink                                                  | none                                                                               | layout       |
| ExperiencePendingTripperReview                    | Ink, Ochre CTA                                       | kept: `reviewUrl` already item-specific                                            | layout       |
| ExperienceSubmitted                               | Ink, Ochre CTA                                       | kept: already admin experience                                                     | layout       |
| PasswordReset / VerifyEmail                       | Ink, Ochre CTA + Ink text                            | kept: token URL                                                                    | layout       |
| PaymentFailed                                     | Ink, Ochre CTA                                       | kept `/journey`: trip page has no retry-payment action                             | layout       |
| ReviewApprovedForTripper                          | Ink, Ochre CTA (amber stars kept)                    | kept: no per-review route                                                          | layout       |
| TravelerDetailsReminder                           | Ochre CTA + Ink text (unstyled text inherits layout) | kept: already trip URL                                                             | layout       |
| TravelerInvite / TravelerReminder / TripperInvite | Ink, Ochre CTA                                       | kept: invite URL                                                                   | layout       |
| TripCancelled                                     | Ink, Ochre CTA                                       | kept `/contact`: support action, not a list                                        | layout       |
| TripCompleted                                     | Ink, Ochre CTA                                       | kept: already review token                                                         | layout       |
| WelcomeEmail                                      | Ink, Ochre CTA + Ink text                            | kept `/journey`: no item                                                           | layout       |
| XsedDropNotification                              | Ink, teal unsubscribe; XSED button kept              | kept: drop URL                                                                     | layout       |
| NewsletterGoLive                                  | unchanged (#ffc500 CTA kept)                         | n/a                                                                                | X → LinkedIn |
| XsedCampaign                                      | unchanged                                            | n/a                                                                                | X → LinkedIn |
| TripStartVouchers                                 | unchanged                                            | n/a                                                                                | X → LinkedIn |

## Progress

T1–T4 uncommitted on `fix/booking-confirmed-email-colors`. Route: delegated direct (writer). Checks: `npx vitest run src/emails` 137/137 (emailBrandRules RED 21 failing before edits, GREEN after), `npm run typecheck` pass, `npx eslint src/emails src/lib/email` clean, prettier clean on changed files. T5 done inline: 141/141 email tests, typecheck clean. Next: commit split (user decision), T6 done.
