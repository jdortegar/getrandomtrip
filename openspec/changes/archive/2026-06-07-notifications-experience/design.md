# Design: Experience Review Email Notifications + User Locale Preference

## Context

Two coupled capabilities ship together:

1. **`user-locale-preference`** — persist the user's chosen UI locale (`es` | `en`) on `User.locale` so server-side email rendering can pick the right language.
2. **`experience-notifications`** — fire proactive Resend emails to the experience owner when an admin approves or rejects a `PENDING_REVIEW` experience.

The two are sequenced: locale persistence is the data source that the notification layer reads (`owner.locale`) to choose the email variant. Without (1), every email defaults to `es` and the locale-selection success criterion cannot be met for users who browse in `en`.

The codebase already provides the full delivery substrate: `sendMail` (Resend wrapper, `src/lib/helpers/sendMail.ts`) accepts a React element directly, and `@react-email/components` templates already exist (`NewsletterGoLive.tsx`) to copy the style from. `User.locale String?` already exists in the schema (`prisma/schema.prisma:447`), so **no migration is required**.

## Architecture Approach

**Pattern: side-effect-after-commit, fire-and-forget.** Notifications are a non-transactional side effect appended after the existing DB status update. The HTTP contract of the admin routes is invariant — the response is identical whether the email succeeds, fails, or Resend is down. This keeps the admin action atomic and the notification best-effort, matching the proposal's risk posture (Resend outage must never block an approval).

**Layering:**

```
┌─────────────────────────────────────────────────────────────┐
│ API route (approve / reject)                                 │
│   1. auth + state guards (UNCHANGED)                         │
│   2. prisma.experience.update (status transition) (UNCHANGED)│
│   3. SIDE EFFECT: load owner, render template, sendMail      │  ← new
│   4. return NextResponse (UNCHANGED)                         │
└─────────────────────────────────────────────────────────────┘
        │ renders
        ▼
┌─────────────────────────────────────────────────────────────┐
│ src/emails/ExperienceApproved.tsx / ExperienceRejected.tsx  │  ← new
│   self-contained React Email component                       │
│   internal `copy` object keyed by locale                     │
└─────────────────────────────────────────────────────────────┘
        │ dispatched by
        ▼
┌─────────────────────────────────────────────────────────────┐
│ src/lib/helpers/sendMail.ts (UNCHANGED — reuse as-is)       │
└─────────────────────────────────────────────────────────────┘
```

The locale-preference capability is an orthogonal slice:

```
┌──────────────────────────────────────────────────────────────┐
│ src/hooks/useSyncLocale.ts (new client hook)                 │
│   compares params.locale vs session.user.locale,            │
│   fire-and-forget PATCH /api/user/locale                    │
└──────────────────────────────────────────────────────────────┘
        │ calls
        ▼
┌──────────────────────────────────────────────────────────────┐
│ src/app/api/user/locale/route.ts (new — PATCH only)         │
│   getServerSession → validate → prisma.user.update          │
└──────────────────────────────────────────────────────────────┘
        │ feeds
        ▼
┌──────────────────────────────────────────────────────────────┐
│ User.locale (read later by notification side effect)        │
└──────────────────────────────────────────────────────────────┘
```

## Components and Data Flow

### Capability 1: user-locale-preference

**1a. Seed locale on OAuth user creation** — `src/lib/auth.ts` (`signIn` callback, the `prisma.user.create` block ~line 86)
Add `locale: "es"` to the `data` object so new Google users start with a deterministic preference instead of `null`. Existing users keep `null` and are treated as `es` by the notification fallback.

**1b. Expose `locale` in the session** — REQUIRED, surfaced during design.
The current `session` callback (`src/lib/auth.ts:134`) does **not** select or assign `locale`, and the `Session.user` type (`src/types/next-auth.d.ts`) does not declare it. The client sync compares `params.locale !== session.user.locale`; without this, the comparison is always truthy and the hook PATCHes on every navigation. Two edits:
- `src/types/next-auth.d.ts`: add `locale?: "es" | "en" | null;` to `Session["user"]`.
- `src/lib/auth.ts` session callback: add `locale: true` to the `dbUser` select, and `session.user.locale = dbUser.locale as "es" | "en" | null;` to the assignment block.

**1c. PATCH route** — `src/app/api/user/locale/route.ts` (new)
```
PATCH /api/user/locale
  body: { locale: "es" | "en" }
  auth: getServerSession(authOptions); 401 if no session.user.id
  validate: locale ∈ {"es","en"} else 422 { error: "invalid_locale" }
  effect: prisma.user.update({ where: { id }, data: { locale } })
  response: 200 { locale }
```
No locale-prefix (API routes are not locale-scoped per project conventions). Mirror the auth/guard shape of the admin routes (session check first, typed body parse).

**1d. Client sync hook** — `src/hooks/useSyncLocale.ts` (new)
Decision below (D1): a dedicated hook, not inline in `layout.tsx`. The hook:
```ts
"use client";
useSyncLocale(): void
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  useEffect(() => {
    const current = session?.user?.locale;
    if (!session?.user?.id) return;          // only for authed users
    if (current === locale) return;          // already in sync
    void fetch("/api/user/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    }).catch(() => {});                       // fire-and-forget
  }, [session?.user?.id, session?.user?.locale, locale]);
```
Mounted via a thin client wrapper component. `layout.tsx` is an async **server** component, so it cannot call the hook directly. Add a tiny `"use client"` component (e.g. `src/components/providers/SyncLocale.tsx`) that calls `useSyncLocale()` and returns `null`, rendered inside the existing `SessionProvider` in `src/app/[locale]/layout.tsx` next to `SetLocaleLang`. This keeps the layout a server component and gives the hook access to `useSession`.

> Note: persisting locale does NOT immediately refresh the session token (JWT). That is acceptable — the next session refresh picks up the new `locale`, and the email path reads `owner.locale` directly from the DB at send time, so notifications always use the freshest value regardless of token staleness.

### Capability 2: experience-notifications

**2a. Approve route** — `src/app/api/admin/experiences/[id]/approve/route.ts`
After the `prisma.experience.update` (line ~69-77) commits and before `return NextResponse.json(...)`, add the side effect. The `update` already returns the full row (no `select`), so `updated.title` and `updated.ownerId` are available. The owner email/name/locale are NOT on the experience row, so do **one** extra lightweight query:
```ts
const owner = await prisma.user.findUnique({
  where: { id: updated.ownerId },
  select: { email: true, name: true, locale: true },
});
if (owner?.email) {
  const locale = owner.locale === "en" ? "en" : "es";   // default es
  void (async () => {
    try {
      await sendMail({
        to: owner.email,
        subject: locale === "en"
          ? "Your experience was approved"
          : "Tu experiencia fue aprobada",
        content: {
          react: <ExperienceApproved
            tripper={owner.name}
            experienceTitle={updated.title}
            locale={locale}
          />,
        },
      });
    } catch (err) {
      console.error("[notifications] approve sendMail failed:", err);
    }
  })();
}
```
The file must be renamed nothing — but JSX in a `.ts` route requires it to be `.tsx`. **Decision D4 below.**

**2b. Reject route** — `src/app/api/admin/experiences/[id]/reject/route.ts`
Same shape, after the `update` (line ~69-76). `reviewNote` is already computed locally (line 58-59) and persisted, so pass it directly to the template. Use `ExperienceRejected` with `reviewNote={reviewNote}` and the reject subject.

**2c. Subject strings.** Keep the subject inline in the route (locale-branched) OR export a `subjects` map from each template module. Decision D5 below: export a `subjects` constant from each template file so subject and body copy stay co-located and locale-consistent.

**2d. Email templates** — `src/emails/ExperienceApproved.tsx`, `src/emails/ExperienceRejected.tsx` (new)
- Props: `ExperienceApproved { tripper: string; experienceTitle: string; locale: "es" | "en" }`; `ExperienceRejected` adds `reviewNote: string`.
- Internal `copy` object: `const copy = { es: {...}, en: {...} }` keyed by locale, holding heading, body lines, CTA label, and footer text. `ExperienceRejected.es/en` additionally has a label preceding the `reviewNote` block (e.g. "Nota del revisor:" / "Reviewer note:").
- Export a `subjects = { es: string, en: string }` constant for the route to consume.
- Style: copy the inline-CSS `React.CSSProperties` style objects and `@react-email/components` imports (`Html, Head, Font, Preview, Body, Container, Section, Heading, Text, Button, Link`) from `NewsletterGoLive.tsx`. Reuse the brand palette: container `#ffffff` on `#f5f5f5` body, CTA button `#facc15` text `#1f2937`, headings Barlow Condensed `#3f3f3f`, body Barlow `#5A5858`/`#888`. CTA button links to the tripper dashboard experiences view on `https://getrandomtrip.com`. The rejected template renders the `reviewNote` inside a distinct panel `Section` (light background, e.g. `#fdf9f9`) so the actionable feedback stands out.
- `<Html lang={locale}>` and `<Preview>` localized.

## ADR-style Decisions

### D1 — Client locale sync lives in a dedicated hook, not inline in layout
**Decision:** `src/hooks/useSyncLocale.ts` + a thin `SyncLocale` client wrapper component, mounted in the existing `SessionProvider` tree.
**Rationale:** `src/app/[locale]/layout.tsx` is an async server component; hooks (`useSession`, `useEffect`, `useParams`) cannot run there. A dedicated hook keeps the side effect testable in isolation, keeps the layout declarative, and isolates the fire-and-forget concern. Matches the project convention of single-responsibility client providers (`SetLocaleLang`).
**Rejected:** inlining a `useEffect` in the layout — impossible without converting the layout to a client component, which would lose `await getDictionary()` server rendering and force the whole subtree client-side.

### D2 — `session.user.locale` must be added to the session callback + type
**Decision:** Extend the session select and `next-auth.d.ts` to carry `locale`.
**Rationale:** The sync hook's idempotency depends on comparing the persisted locale against the URL locale. Without the session exposing `locale`, the hook would PATCH on every navigation (wasteful, racey).
**Rejected:** comparing against `localStorage` or a cookie — adds a second source of truth that can drift from the DB; the session already round-trips DB user fields, so locale belongs there.

### D3 — `sendMail` receives the React element directly (no `renderAsync`)
**Decision:** Pass `content: { react: <Template .../> }` to `sendMail`; do not pre-render with `@react-email/render`.
**Rationale:** `sendMail` (lines 27-28) already forwards `{ react }` straight to `resend.emails.send`, and Resend renders React Email components server-side. Adding `renderAsync` would duplicate work the helper already delegates and introduce an unused dependency path. Confirmed by reading the helper signature (`SendMailParams.content` accepts `{ react: React.ReactElement }`).
**Rejected:** `renderAsync` to HTML string — unnecessary; only needed if we wanted to inspect/store the HTML, which we don't.

### D4 — Rename approve/reject routes from `.ts` to `.tsx`
**Decision:** Rename `route.ts` → `route.tsx` for both admin approve and reject routes (Next.js resolves both extensions for route handlers).
**Rationale:** The side effect renders JSX (`<ExperienceApproved .../>`). TypeScript will not parse JSX in a `.ts` file. The alternative — calling `React.createElement(ExperienceApproved, {...})` — avoids the rename but is noisier and inconsistent with how templates are authored elsewhere.
**Rejected:** `React.createElement` in `.ts` — works but reduces readability; the `.tsx` rename is the cleaner, convention-aligned choice. (Tasks phase must note this is a git rename, not a new file.)

### D5 — Subjects co-located with templates
**Decision:** Each template file exports `subjects = { es, en }` consumed by the route.
**Rationale:** Subject and body copy are the same localized asset; co-locating prevents the subject drifting out of sync with the body when copy is edited. The route imports `{ default as ExperienceApproved, subjects as approvedSubjects }`.
**Rejected:** hardcoded subject strings in the route — splits the copy across two files and two locales, easy to desync.

### D6 — Owner loaded via a separate `findUnique`, not an expanded select on `update`
**Decision:** Issue one extra `prisma.user.findUnique({ select: { email, name, locale } })` keyed by `updated.ownerId` after the update.
**Rationale:** The existing `update` calls use the `(prisma.experience.update as any)` escape hatch with no `select`, returning the scalar row including `ownerId` and `title`. Adding a relational `include: { owner: {...} }` would force restructuring the `as any` typing and risk widening the returned shape. A targeted second query is cheaper to reason about, runs after the response-critical write, and only fetches three fields. Latency is immaterial because it executes inside the fire-and-forget path conceptually adjacent to the send.
**Rejected:** `include: { owner: { select: {...} } }` on the `update` — entangles the typed-escape-hatch update and the notification concern; marginal query savings not worth the coupling.

## Integration Points

| Touchpoint | Type | Contract impact |
|------------|------|-----------------|
| `sendMail` (`src/lib/helpers/sendMail.ts`) | Reused as-is | None — `{ react }` content path already supported |
| `prisma.user.update` (locale PATCH) | New caller | Writes `locale` scalar only |
| `prisma.user.findUnique` (owner load) | New caller | Read-only, 3 fields |
| `session` callback (`src/lib/auth.ts`) | Extended | Adds `locale` to select + assignment |
| `next-auth.d.ts` Session type | Extended | Adds optional `locale` field |
| `src/app/[locale]/layout.tsx` | Extended | Mounts `<SyncLocale />` inside `SessionProvider` |
| Admin approve/reject routes | Extended + renamed `.ts`→`.tsx` | HTTP response UNCHANGED; side effect added |

## Data Flow Summary

1. User toggles UI language → URL locale changes → `useSyncLocale` fires `PATCH /api/user/locale` → `User.locale` persisted.
2. Admin approves/rejects experience → status update commits → route loads `owner.locale` → renders ES/EN template → `sendMail` dispatches via Resend → admin HTTP response returns regardless of email outcome.

## Risks and Assumptions

- **Session staleness (assumption):** persisting `locale` does not force-refresh the JWT; the email path reads DB `owner.locale` directly, so this is harmless. UI-side the new value lands on next session refresh. Accepted.
- **`.ts`→`.tsx` rename (risk):** must be done as a rename so import paths and Next.js route resolution are preserved; tasks phase must flag this explicitly to avoid a stray duplicate `route.ts` shadowing the handler.
- **Existing users with `locale = null` (assumption):** treated as `es` by the `owner.locale === "en" ? "en" : "es"` guard. No backfill migration in scope.
- **`updated.title` availability (verified):** the `update` returns the full row; `title` is a non-null scalar (`schema.prisma:150`). Safe to read.
- **Validation parity (assumption):** the PATCH route is the only writer of `User.locale`; it must reject any value outside `{es,en}` to keep the email locale guard total.
- **Unresolved:** whether the CTA deep-link target (tripper dashboard experiences URL) should be locale-prefixed in the email. Recommend `https://getrandomtrip.com/${locale}/dashboard/tripper/experiences`; tasks phase confirms the exact path.
