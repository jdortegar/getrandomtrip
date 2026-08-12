# Design: Trip Contact Email

Implements `proposal.md`. All ten Resolved Decisions are treated as settled input. This document only resolves HOW.

**Revision note (2026-08-11):** the orchestrator reversed this document's original Open Question #1 recommendation. The prefill is now built in the **traveler's** locale, not the admin's dashboard locale (Resolved Decision #10). `AdminTripUser` gains a `locale` field and both admin trip-request GET routes add it to their existing `prisma.user` select — see the updated Interfaces/Contracts sections below. Open Question #1 is now closed.

## Technical Approach

Four additive layers, built bottom-up so each has something real to test against:

```
ContactTravelerModal (client)          ← owns compose state + fetch
        │ POST { subject, body }
        ▼
/api/admin/trip-requests/[id]/contact  ← requireAdmin → resolve → await send → audit row
        │                                          │
        │ sendAdminTripContactMessage(...)         └─ prisma.tripContactMessage.create (BOTH branches)
        ▼
src/lib/email/index.ts (awaitable, throws)
        │ React.createElement(AdminTripContactMessage, { locale: resolveLocale(traveler.locale) })
        ▼
sendMail() → Resend
```

The only non-additive edit is `TripFulfillmentHeader.tsx`'s `<a href="mailto:">` → `<button onClick>`.

## Architecture Decisions

### ADR-1: The awaitable send function co-locates in `src/lib/email/index.ts`

| Option | Tradeoff | Decision |
|---|---|---|
| Co-locate in `index.ts` | Reuses module-private `resolveLocale` (index.ts:72) with zero API surface change; sits next to the 23 siblings it deliberately diverges from, where the divergence is visible in review | **Chosen** |
| New file + `export resolveLocale` | Widens the email module's public API for one caller; proposal says "compose, do not re-express" | Rejected |
| Retrofit siblings to awaitable | Explicitly out of scope | Rejected |

Signature — takes **already-resolved data**, not IDs:

```ts
/**
 * DIVERGES from every other send* function in this module on purpose: it is
 * `await`-able and it THROWS. A human is watching the modal for a real result
 * (Resolved Decision #6). Do NOT wrap this in `void (async () => …)()`.
 */
export async function sendAdminTripContactMessage(params: {
  adminEmail: string;                                       // replyTo (Decision #5)
  body: string;                                             // admin plain text, verbatim
  subject: string;
  traveler: { email: string; locale: string | null; name: string };
}): Promise<void>;
```

It calls `resolveLocale(params.traveler.locale)` internally (locale resolution stays inside the email module per Decision #2), builds the element, and `await sendMail({ to, subject, replyTo: adminEmail, content: { react } })`. No `try/catch` — `sendMail` throws on Resend error *and* on missing `RESEND_API_KEY`, and that propagation is exactly what produces the `FAILED` audit row. Returns `void`; the Resend message id is not persisted (no column for it, and Decision #7 forbids delivery-confirmation semantics).

**Why resolved data instead of IDs** (the 23 siblings take IDs): the route must load the traveler anyway (404 semantics) and the admin's email anyway (Decision #9 denormalization). Passing IDs would duplicate both queries, and it keeps the function unit-testable with only `sendMail` mocked — no prisma mock.

### ADR-2: Modal state is lifted to the page; the header stays presentational

Every other trip-fulfillment child (`TripDocumentsTable`, `AddTripDocumentForm`, `TripDangerZone`) receives callbacks from `AdminTripFulfillmentPageClient` and owns no orchestration. The header gets `onContactTraveler: () => void`; the page owns `contactOpen` and renders `<ContactTravelerModal>`. This keeps the existing `TripFulfillmentHeader.test.tsx` (plain `createRoot` render, no portal) valid and keeps Radix Dialog out of the header's test surface. The modal itself owns its `fetch`, exactly like `UserRoleModal`.

### ADR-3: Body paragraph splitting lives in the template, exported as a pure helper

`toParagraphs(body)` is exported from `AdminTripContactMessage.tsx` so the newline-split rule (Decision #3) is testable without rendering react-email in jsdom. Compose-time prefill/validation logic goes in a sibling `contactTravelerModalHelpers.ts` — exact precedent: `userRoleModalHelpers.ts` + `__tests__/userRoleModalHelpers.test.ts`.

### ADR-4: Failed send is a non-2xx with an `error` key, not a 200 envelope

`AddTripDocumentForm` already maps `body.error` → `fulfillmentDict.errors[key]`. Reusing that contract means the modal needs no second error-shape branch. Send failure → `502` `{ error: "send_failed" }` (upstream provider failed, not a client error).

## Interfaces / Contracts

### Prisma — `prisma/schema.prisma`

New model, placed immediately after `TripDocument` (ends line 200); the enum joins the ENUMS block next to `TripRequestStatus` (line ~535).

```prisma
/// Write-only audit trail of admin→traveler contact emails: one row per send
/// attempt. Audit metadata ONLY — MUST NOT be read as an authorization,
/// idempotency, or delivery-confirmation input (see design.md ADR-1/#7).
model TripContactMessage {
  id            String            @id @default(cuid())
  tripRequestId String
  /// Admin-authored subject, exactly as sent. Max 200 chars app-side.
  subject       String
  /// Admin-authored PLAIN TEXT body, exactly as sent. Max 4000 chars app-side.
  body          String            @db.Text
  /// Audit metadata ONLY — MUST NOT be read as an authorization input.
  /// Nulled if the admin account is deleted; `adminEmail` below survives.
  adminId       String?
  /// Denormalized sending admin address, captured at send time so the row stays
  /// readable for support/dispute lookups after account deletion (Decision #9).
  adminEmail    String
  status        TripContactStatus
  /// Failure detail from sendMail/Resend when FAILED; null on SENT. Truncated to 500.
  error         String?
  createdAt     DateTime          @default(now())

  tripRequest TripRequest @relation(fields: [tripRequestId], references: [id], onDelete: Cascade)
  admin       User?       @relation("TripContactMessagesSent", fields: [adminId], references: [id], onDelete: SetNull)

  @@index([tripRequestId, createdAt])
  @@map("trip_contact_messages")
}

enum TripContactStatus {
  SENT
  FAILED
}
```

Back-relations:
- `TripRequest` (after `tripDocuments`, line 170): `contactMessages TripContactMessage[]`
- `User` (after `tripDocumentsUploaded`, line 96): `tripContactMessagesSent TripContactMessage[] @relation("TripContactMessagesSent")`

`onDelete: Cascade` + `@@index([tripRequestId, createdAt])` + snake_case `@@map` mirror `TripDocument` (schema.prisma:195-199) and `Payment` (:325). `adminId`'s `String?` + `SetNull` + doc comment mirror `TripDocument.uploadedById` (:191-196). Applied with `prisma db push` — the artifact is the schema diff, no migration file.

### Email template — `src/emails/AdminTripContactMessage.tsx`

Follows `TripCancelled.tsx` (locale-keyed `copy` const + `subjects` map), not `AdminNewBooking.tsx`'s single-locale `subject`, because this one is traveler-facing.

```tsx
interface AdminTripContactMessageProps {
  body: string;              // raw admin text, newlines intact
  locale: "es" | "en";
  subject: string;           // used for <Preview> only
}

export function toParagraphs(body: string): string[];  // split /\r?\n/, trim, drop empties
export const subjects = { es: "…", en: "…" };          // generic fallback; route uses admin's subject
export default function AdminTripContactMessage({ body, locale, subject }: …)
```

Renders `<EmailLayout locale={locale} preview={subject}>` → `<Heading style={heading}>{c.heading}</Heading>` (localized constant, e.g. "Un mensaje del equipo" / "A message from the team") → `toParagraphs(body).map((p, i) => <Text key={i} style={bodyText}>{p}</Text>)`. Inline `React.CSSProperties` objects copied from `TripCancelled` (`heading` 42px Barlow Condensed uppercase, `bodyText` 14px Barlow centered, `margin: "0 auto 16px"`).

**No CTA button.** Every other template's CTA drives the traveler somewhere; here the intended action is *reply to the admin* (`replyTo`), and a competing button would undercut it. The admin's `subject` is deliberately NOT the `<Heading>` — the 42px uppercase style would mangle a long free-text subject.

### API route — `src/app/api/admin/trip-requests/[id]/contact/route.ts`

```
POST  body: { subject: string; body: string }
200 → { message: { id, status: "SENT", createdAt } }
400 → { error: "invalid_request", field: "subject" | "body" }
401 → { error: "Unauthorized" }   403 → { error: "Forbidden" }    (both from requireAdmin)
404 → { error: "trip_not_found" }
502 → { error: "send_failed" }    (FAILED audit row IS persisted)
500 → { error: "Internal server error" }
```

Exact sequence:
1. `const auth = await requireAdmin(); if (!auth.ok) return auth.errorResponse;`
2. `await request.json()` inside `try` → `400 invalid_request` on parse failure.
3. Validate: `subject.trim()` length 1–**200**, `body.trim()` length 1–**4000**. `200` matches practical mail-client subject limits and scales the existing `label` ceiling of 120 (`trip-documents/route.ts:44`); `4000` is ~600 words — generous for a plain-text note, bounds the `@db.Text` column, and is the same number the modal passes to `TextAreaInput maxLength` so client and server agree.
4. `prisma.tripRequest.findUnique({ where: { id }, select: { id: true, user: { select: { email: true, name: true, locale: true } } } })` → `404` if null. **No status filter** (Decision #8).
5. `prisma.user.findUnique({ where: { id: auth.adminId }, select: { email: true } })` → null is a `500` (unreachable: `requireAdmin` just read that row, `User.email` is non-nullable).
6. `try { await sendAdminTripContactMessage(...); status = "SENT" } catch (err) { status = "FAILED"; error = String(err.message).slice(0, 500); console.error("[admin/trip-contact] send failed", err) }`
7. `prisma.tripContactMessage.create({ data: { tripRequestId, subject, body, adminId: auth.adminId, adminEmail, status, error } })` — runs in **both** branches. If this write itself throws after a `SENT`, log loudly and still return `200`: the email really did go out and the row is support metadata, never authorization.
8. Respond `200` on `SENT`, `502` on `FAILED`.

Send strictly precedes the audit write, per the proposal's risk mitigation. `export const dynamic = "force-dynamic"` and `runtime = "nodejs"` as in `trip-documents/route.ts`.

### Modal — `src/components/app/admin/trip-fulfillment/ContactTravelerModal.tsx`

```tsx
interface ContactTravelerModalProps {
  copy: MarketingDictionary["adminTripFulfillment"];   // needs contactModal + errors — admin's own UI chrome
  onClose: () => void;
  open: boolean;
  traveler: { email: string; locale: string | null; name: string };  // AdminTripUser slice, now with locale
  tripId: string;
}
```

Two locales are in play, deliberately kept separate: `copy` (the `fulfillmentDict` slice, already resolved server-side to the **admin's** dashboard locale) drives every piece of UI chrome the admin reads — title, field labels, buttons, error text. The **prefilled subject/body content**, per Resolved Decision #10, must instead match the **traveler's** locale so the finished email is coherent by default. Since client components can't call the async `getDictionary()`, the modal imports both locale JSONs statically (the established pattern in `.claude/rules/i18n-and-types.md`'s "Using Dictionaries in Client Components" section):

```ts
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

export function resolveContactLocale(locale: string | null): "es" | "en" {
  return locale === "en" ? "en" : "es";   // mirrors resolveLocale (email/index.ts:72) exactly
}
```

`resolveContactLocale` lives in `contactTravelerModalHelpers.ts` as a pure, RED-testable function — it is NOT imported from `src/lib/email/index.ts` (that module is server-only and `resolveLocale` is private); it is a deliberate one-line duplicate of the same rule, kept in sync by the shared test asserting `locale === "en" ? "en" : "es"` in both places.

State: `subject`, `body`, `sending`, `error: string`, `sent: boolean`. A `useEffect` keyed on `[open, traveler.name, traveler.locale]` resets everything and rebuilds the prefill from the **traveler's** locale dictionary, not `copy`:

```ts
const prefillDict = resolveContactLocale(traveler.locale) === "en" ? enCopy : esCopy;
setSubject(prefillDict.adminTripFulfillment.contactModal.prefillSubject);
setBody(interpolateTemplate(prefillDict.adminTripFulfillment.contactModal.prefillBody, { userName: traveler.name }));
```

`prefillBody` carries literal `\n\n` between greeting / placeholder line / sign-off, which `toParagraphs` later turns into separate `<Text>` blocks. Structure copies `UserRoleModal` exactly: `<Modal className="… max-w-lg …" onOpenChange showCloseButton>` → `DialogHeader` with a `Mail` icon in a `h-9 w-9 rounded-full bg-light-blue/10` puck + `DialogTitle`/`DialogDescription` (`traveler.email`) → body with `<FormField id="contact-subject" maxLength={200}>` and `<TextAreaInput id="contact-body" maxLength={4000}>` (must pass `maxLength` — the primitive defaults to 280) → red `text-sm font-medium text-red-600` error line → `DialogFooter` with secondary Cancel and primary Send (`disabled={sending || !canSend}`, label swaps to `copy.contactModal.sending`).

`canSend` / prefill construction live in `contactTravelerModalHelpers.ts` as pure functions. On non-2xx, map `body.error` through `copy.errors[key] ?? copy.errors.generic` — same mapping as `AdminTripFulfillmentPageClient.handleAddDocument`. On success, set `sent: true`, show `successTitle`/`successBody`, and swap the primary button to `close`.

### Header — `src/components/app/admin/trip-fulfillment/TripFulfillmentHeader.tsx`

Lines 70-73 only. New required prop `onContactTraveler: () => void`; the `<a href={mailto}>` becomes `<button className={styles.backLink} onClick={onContactTraveler} type="button">` keeping the same `Mail` icon, `copy.contactTraveler` label, `styles.backLink` class, and right-hand position in the same flex row. Nothing else in the file changes. Add `"use client"` — it now takes an event handler.

### Dictionary — `src/lib/types/dictionary.ts`, `src/dictionaries/{es,en}.json`

Extend the existing `AdminTripFulfillmentDict` with a nested `contactModal`, rather than adding a sibling top-level section: the header's `contactTraveler` label already lives there and the page already slices `fulfillmentDict` to it, so a sibling section would thread a second slice through two components for one feature.

```ts
contactModal: {
  title: string;
  description: string;          // interpolated with {{userName}}
  subjectLabel: string;
  subjectPlaceholder: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  /** Prefilled subject (Decision #4). */
  prefillSubject: string;
  /** Prefilled body. Interpolated with {{userName}}; \n\n separates paragraphs. */
  prefillBody: string;
  send: string;
  sending: string;
  cancel: string;
  close: string;
  successTitle: string;
  successBody: string;          // interpolated with {{email}}
};
// plus, inside the existing `errors` map:
send_failed: string;
```

Email-template copy stays in the template's locale-keyed `copy` const (the established convention for all 23 templates, and explicitly allowed by `.claude/rules/i18n-and-types.md`'s locale-keyed-map escape hatch); everything the admin sees goes in both JSON dictionaries.

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | `TripContactMessage`, `TripContactStatus`, 2 back-relations |
| `src/emails/AdminTripContactMessage.tsx` | Create | Template + `toParagraphs` + `subjects` |
| `src/emails/__tests__/AdminTripContactMessage.test.tsx` | Create | `toParagraphs` + `subjects` RED tests |
| `src/lib/email/index.ts` | Modify | `sendAdminTripContactMessage` (awaitable, throws) |
| `src/lib/email/__tests__/sendAdminTripContactMessage.test.ts` | Create | Locale / replyTo / rejection RED tests |
| `src/app/api/admin/trip-requests/[id]/contact/route.ts` | Create | Guarded POST; send + audit |
| `src/app/api/admin/trip-requests/[id]/contact/__tests__/route.test.ts` | Create | Auth, validation, SENT/FAILED RED tests |
| `.../trip-fulfillment/ContactTravelerModal.tsx` | Create | Compose modal |
| `.../trip-fulfillment/contactTravelerModalHelpers.ts` | Create | Pure prefill + `canSend` |
| `.../trip-fulfillment/__tests__/contactTravelerModalHelpers.test.ts` | Create | Helper RED tests |
| `.../trip-fulfillment/TripFulfillmentHeader.tsx` | Modify | `<a mailto>` → `<button>` + new prop |
| `.../trip-fulfillment/__tests__/TripFulfillmentHeader.test.tsx` | Modify | Pass `onContactTraveler`; assert button not anchor |
| `.../trip-requests/[id]/AdminTripFulfillmentPageClient.tsx` | Modify | `contactOpen` state + render modal |
| `src/lib/types/dictionary.ts` | Modify | `contactModal` + `errors.send_failed` |
| `src/dictionaries/{es,en}.json` | Modify | Both locales, same keys |

## Testing Strategy (Strict TDD — RED first, per unit)

Vitest, colocated `__tests__/`, following `src/app/api/admin/trip-requests/[id]/__tests__/route.test.ts` (mock `next-auth` + `@/lib/auth` + `@/lib/prisma`, dynamic `await import("../route")`, `NextRequest`, `vi.resetAllMocks()` in `beforeEach`) and `TripFulfillmentHeader.test.tsx` (`createRoot` + `act`, `IS_REACT_ACT_ENVIRONMENT = true`).

**RED order:**

1. `toParagraphs` — multi-newline body → N trimmed paragraphs; blank lines dropped; single-line body → 1. `subjects.es !== subjects.en`, both non-empty.
2. `sendAdminTripContactMessage` (mock `@/lib/helpers/sendMail` only) — `to` = traveler email; `replyTo` = admin email; `locale: "en"` → `en` element prop, `null`/`"pt"` → `es`; **rejects** when `sendMail` rejects (proves the divergence from the fire-and-forget siblings — this is the load-bearing test).
3. Route — `401` no session; `403` non-admin; `400` on empty subject, empty body, 201-char subject, 4001-char body, each with **no** `sendAdminTripContactMessage` and **no** `create` call; `404` unknown trip; `200` + `create` called once with `status: "SENT"`, `adminEmail`, `error: null`; send rejects → `502` + `create` with `status: "FAILED"` and a non-null truncated `error`; a `CANCELLED` trip still sends (no status gating).
4. `contactTravelerModalHelpers` — prefill interpolates `{{userName}}`; `canSend` false on blank/whitespace subject or body and while sending, true otherwise.
5. Header — renders a `<button>` (not an `<a href^="mailto:"`) and invokes `onContactTraveler` on click.

The modal's own render is covered by (4) + (5) plus manual QA. Radix Dialog portals in jsdom are not worth new test infrastructure for a single-PR change.

## Migration / Rollout

`prisma db push` against the target `DATABASE_URL`. No data migration, no backfill, no feature flag — the table starts empty and nothing reads it. Revert is `git revert` + an optional manual `DROP TABLE trip_contact_messages`.

## Open Questions

- [ ] **Prefill locale vs. shell locale.** The prefill is built in the *admin's* dashboard locale (the only locale available client-side — `AdminTripUser` carries no `locale`, by design), while the `EmailLayout` shell renders in the *traveler's* locale per Decision #2. A Spanish-speaking admin can therefore send Spanish body text inside an English shell. Recommendation: **accept for this change** (Decisions #2/#4 are final, scope guardrail is one PR); a coherent prefill would require exposing `user.locale` on the existing GET route. Flagged for the orchestrator.
- [ ] **Audit write failure after a successful send returns `200`.** Recommendation: keep it — the send is the user-visible truth and the row is support metadata (matches the proposal's risk mitigation "log loudly"). Noted so nobody later reads a `200` as proof a row exists.
