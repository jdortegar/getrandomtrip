# Apply Progress: notifications-experience

## Change: notifications-experience
## Mode: Standard
## PR Slice: PR 1 + PR 2 of 2 (all implementation phases complete)
## Status: 10/10 tasks complete

---

## Completed Tasks

### Phase 1: Foundation — Types and Auth

- [x] 1.1 `src/types/next-auth.d.ts` — added `locale?: "es" | "en" | null` to `Session["user"]`
- [x] 1.2 `src/lib/auth.ts` signIn callback — added `locale: "es"` to `prisma.user.create` data object (only on create guard preserved)
- [x] 1.3 `src/lib/auth.ts` session callback — added `locale: true` to `dbUser` select; assigned `session.user.locale = dbUser.locale as "es" | "en" | null`

### Phase 2: Core Implementation — Locale API and Client Sync

- [x] 2.1 Created `src/app/api/user/locale/route.ts` — PATCH only; 401 on no session; 422 on invalid locale; prisma.user.update; returns 200 `{ locale }`
- [x] 2.2 Created `src/hooks/useSyncLocale.ts` — "use client" hook; useSession + useParams; fire-and-forget PATCH; guards on session.user.id and locale mismatch; correct deps array
- [x] 2.3 Created `src/components/providers/SyncLocale.tsx` — "use client" wrapper; calls useSyncLocale(); returns null
- [x] 2.4 `src/app/[locale]/layout.tsx` — mounted `<SyncLocale />` inside SessionProvider alongside SetLocaleLang

### Phase 3: Core Implementation — Email Templates

- [x] 3.1 Created `src/emails/ExperienceApproved.tsx` — props `{ tripper, experienceTitle, locale }`; internal `copy` object keyed by locale; exports `subjects = { es, en }`; `<Html lang={locale}>` + localized `<Preview>`; CTA links to `https://getrandomtrip.com/${locale}/dashboard/tripper/experiences`; styled matching NewsletterGoLive.tsx (brand palette, Barlow/Barlow Condensed fonts, yellow CTA)
- [x] 3.2 Created `src/emails/ExperienceRejected.tsx` — same shape as 3.1; adds `reviewNote: string` prop; renders `reviewNote` verbatim inside a `Section` with `background: #fdf9f9` and locale-appropriate label ("Nota del revisor:" / "Reviewer note:"); exports `subjects = { es, en }`

### Phase 4: Integration — Admin Route Side Effects

- [x] 4.1 Git-renamed `src/app/api/admin/experiences/[id]/approve/route.ts` → `route.tsx` via `git mv`; confirmed no stray `route.ts` remains
- [x] 4.2 Git-renamed `src/app/api/admin/experiences/[id]/reject/route.ts` → `route.tsx` via `git mv`; confirmed no stray `route.ts` remains
- [x] 4.3 `approve/route.tsx` — after `prisma.experience.update` commits: resolves ownerId from updated row; queries `prisma.user.findUnique` for `{ email, name, locale }`; resolves locale (default "es"); fire-and-forget `sendMail` with `<ExperienceApproved>` and `approvedSubjects[locale]` subject; wrapped in `void (async () => { try { … } catch(err) { console.error("[notifications]", err) } })()`; HTTP response unchanged
- [x] 4.4 `reject/route.tsx` — same shape; passes locally computed `reviewNote` to `<ExperienceRejected>`; uses `rejectedSubjects[locale]`; HTTP response unchanged

---

## Remaining Tasks (deferred to sdd-verify / manual QA)

### Phase 5: Verification

- [ ] 5.1–5.8 Manual and automated verification

---

## Files Changed

### PR 1 (Phases 1–2)

| File | Action | What |
|------|--------|------|
| `src/types/next-auth.d.ts` | Modified | Added `locale?: "es" \| "en" \| null` to Session["user"] |
| `src/lib/auth.ts` | Modified | Added locale seed on create; added locale to session select + assignment |
| `prisma/schema.prisma` | Modified | Added `locale String?` field to User model |
| `src/app/api/user/locale/route.ts` | Created | PATCH endpoint for locale persistence |
| `src/hooks/useSyncLocale.ts` | Created | Client hook for fire-and-forget locale sync |
| `src/components/providers/SyncLocale.tsx` | Created | Client wrapper component for SyncLocale hook |
| `src/app/[locale]/layout.tsx` | Modified | Mounted SyncLocale inside SessionProvider |

### PR 2 (Phases 3–4)

| File | Action | What |
|------|--------|------|
| `src/emails/ExperienceApproved.tsx` | Created | React Email template for approved experience notification |
| `src/emails/ExperienceRejected.tsx` | Created | React Email template for rejected experience notification (includes reviewNote panel) |
| `src/app/api/admin/experiences/[id]/approve/route.tsx` | Renamed + Modified | git mv from .ts; added sendMail side effect after DB update |
| `src/app/api/admin/experiences/[id]/reject/route.tsx` | Renamed + Modified | git mv from .ts; added sendMail side effect after DB update |

---

## Deviations from Design

**PR 1 — Schema migration required (not in design):** The design stated `User.locale String?` already exists at `schema.prisma:447`. That line refers to `XsedNotificationSignup.locale`, not the `User` model. The field did not exist on `User`. Added `locale String?` to the User model and ran `prisma generate`. A DB migration (`db:push` or `db:migrate`) is required before deploying.

**PR 2 — ownerId access via type cast:** The `prisma.experience.update` escape hatch returns an untyped value. `updated.ownerId` and `updated.title` are accessed via `(updated as { ownerId?: string; title?: string })` casts, consistent with the existing escape-hatch pattern in the route. No functional deviation — the design explicitly noted D6 (separate findUnique) and D4 (cast pattern).

---

## Workload / PR Boundary

- Mode: chained PR slice (stacked-to-main)
- PR 1 — User locale persistence + sync (~80 changed lines)
- PR 2 — Email templates + admin route notifications (~130 changed lines)
- Total: ~210 changed lines across both PRs (well within 400-line budget per PR)

---

## Verification

- `npm run typecheck` — 0 errors (verified after all PR 2 changes)
- `npm run db:generate` — Prisma client regenerated successfully (PR 1)
- No stray `route.ts` files at approve or reject paths (confirmed via ls)
