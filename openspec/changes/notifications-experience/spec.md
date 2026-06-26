# Spec: notifications-experience

## Change Summary

Two new capabilities are introduced: (1) `user-locale-preference` — persisting and syncing the authenticated user's preferred locale; (2) `experience-notifications` — proactive email delivery to tripper owners when an admin approves or rejects their experience.

---

# user-locale-preference Specification

## Purpose

Ensures every authenticated user has a locale preference stored server-side so that system-generated emails are sent in the user's language.

## Requirements

### Requirement: Default Locale on Sign-In

The system MUST set `User.locale = "es"` for any user created via the NextAuth signIn callback if no locale is already stored.

#### Scenario: New user gets default locale

- GIVEN a user signs in for the first time via Google OAuth
- WHEN the NextAuth signIn callback runs
- THEN `User.locale` is set to `"es"` in the database

#### Scenario: Existing user locale is not overwritten

- GIVEN a user with `User.locale = "en"` signs in
- WHEN the NextAuth signIn callback runs
- THEN `User.locale` remains `"en"` — it is NOT reset to `"es"`

---

### Requirement: Locale Update API

The system MUST expose `PATCH /api/user/locale` that accepts `{ locale: "es" | "en" }`, updates `User.locale` for the authenticated user, and returns 200.

The endpoint MUST reject unauthenticated requests with 401. It MUST reject invalid locale values with 422. It MUST NOT require any other body fields.

#### Scenario: Valid locale update

- GIVEN an authenticated user with `User.locale = "es"`
- WHEN `PATCH /api/user/locale` is called with `{ locale: "en" }`
- THEN the response is 200 and `User.locale` is `"en"` in the database

#### Scenario: Unauthenticated request rejected

- GIVEN no valid session
- WHEN `PATCH /api/user/locale` is called
- THEN the response is 401

#### Scenario: Invalid locale value rejected

- GIVEN an authenticated user
- WHEN `PATCH /api/user/locale` is called with `{ locale: "fr" }`
- THEN the response is 422

---

### Requirement: Client-Side Locale Sync

On app load, the locale layout MUST call `PATCH /api/user/locale` fire-and-forget when the URL locale differs from `session.user.locale`.

This sync is best-effort: failures MUST be silently swallowed and MUST NOT block rendering or user interaction.

#### Scenario: Locale mismatch triggers sync

- GIVEN an authenticated user with `User.locale = "es"` navigating to the `/en` locale URL
- WHEN the locale layout mounts
- THEN `PATCH /api/user/locale` is called with `{ locale: "en" }` in the background

#### Scenario: Locale match skips sync

- GIVEN an authenticated user with `User.locale = "en"` on the `/en` locale URL
- WHEN the locale layout mounts
- THEN no `PATCH /api/user/locale` call is made

#### Scenario: Sync failure does not affect UX

- GIVEN the `PATCH /api/user/locale` call fails with a network error
- THEN the page renders normally with no error shown to the user

---

# experience-notifications Specification

## Purpose

Delivers proactive email notifications to experience owners when an admin approves or rejects their experience, using the owner's stored locale preference.

## Requirements

### Requirement: ExperienceApproved Email Template

The system MUST provide a `src/emails/ExperienceApproved.tsx` React Email template. The template MUST accept props: `ownerName: string`, `experienceTitle: string`, `locale: "es" | "en"`. All visible copy MUST be rendered in the language specified by `locale`.

#### Scenario: Template renders in Spanish

- GIVEN `locale = "es"`
- WHEN the template is rendered
- THEN all headings, body copy, and CTA are in Spanish

#### Scenario: Template renders in English

- GIVEN `locale = "en"`
- WHEN the template is rendered
- THEN all headings, body copy, and CTA are in English

---

### Requirement: ExperienceRejected Email Template

The system MUST provide a `src/emails/ExperienceRejected.tsx` React Email template. The template MUST accept props: `ownerName: string`, `experienceTitle: string`, `reviewNote: string`, `locale: "es" | "en"`. The `reviewNote` MUST be displayed verbatim. All visible copy MUST be rendered in the language specified by `locale`.

#### Scenario: Rejection note is visible in email

- GIVEN `reviewNote = "The hero image is too small"`
- WHEN the template is rendered
- THEN the exact text "The hero image is too small" appears in the email body

#### Scenario: Template renders in correct locale

- GIVEN `locale = "en"`
- WHEN the template is rendered
- THEN all system copy (headings, CTAs) is in English while `reviewNote` is rendered verbatim

---

### Requirement: Approve Route Sends Notification

After a successful approve DB update, the approve route MUST load `owner { email, name, locale }` from the experience record, select the `ExperienceApproved` template in the owner's locale (defaulting to `"es"` if `owner.locale` is null), and call `sendMail` fire-and-forget inside a `try/catch`.

A `sendMail` failure MUST be caught, logged, and swallowed. The HTTP response of the approve action MUST be identical whether the email succeeds or fails.

#### Scenario: Approval triggers email to owner

- GIVEN an experience in `PENDING_REVIEW` with an owner who has `locale = "en"`
- WHEN an admin approves the experience
- THEN an `ExperienceApproved` email is dispatched to `owner.email` in English
- AND the approve route returns 200 regardless of email outcome

#### Scenario: Null owner locale defaults to ES

- GIVEN an experience owner with `locale = null`
- WHEN an admin approves the experience
- THEN the email is rendered and sent in Spanish

#### Scenario: sendMail failure does not affect admin action

- GIVEN `sendMail` throws an error
- WHEN an admin approves the experience
- THEN the experience status is still set to `ACTIVE`
- AND the approve route returns 200

---

### Requirement: Reject Route Sends Notification

After a successful reject DB update, the reject route MUST load `owner { email, name, locale }` and `reviewNote` from the experience record, select the `ExperienceRejected` template in the owner's locale (defaulting to `"es"`), and call `sendMail` fire-and-forget inside a `try/catch`.

A `sendMail` failure MUST be caught, logged, and swallowed. The HTTP response of the reject action MUST be identical whether the email succeeds or fails.

#### Scenario: Rejection triggers email to owner

- GIVEN an experience in `PENDING_REVIEW` with `reviewNote = "Missing price range"` and owner `locale = "es"`
- WHEN an admin rejects the experience
- THEN an `ExperienceRejected` email is dispatched to `owner.email` in Spanish
- AND the email body contains "Missing price range"

#### Scenario: sendMail failure does not affect admin action

- GIVEN `sendMail` throws an error
- WHEN an admin rejects the experience
- THEN the experience status is still set to `DRAFT`
- AND the reject route returns 200

---

## API Contract — `PATCH /api/user/locale`

| Field | Rule |
|-------|------|
| Auth | MUST be authenticated (any role) |
| Body | `{ locale: "es" \| "en" }` |
| Success | `User.locale` updated; returns 200 |
| 401 | No valid session |
| 422 | `locale` value is not `"es"` or `"en"` |

---

## Out of Scope

- In-app notification inbox
- Notification preferences or unsubscribe controls
- Email delivery for any lifecycle event other than approve/reject
- Any new Prisma schema migration (`User.locale` already exists)
