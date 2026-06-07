# Apply Progress: notifications-experience

## Change: notifications-experience
## Mode: Standard
## PR Slice: PR 1 of 2 (Phases 1 and 2 — locale preference foundation)
## Status: 6/10 tasks complete

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

---

## Remaining Tasks (NOT in this PR)

### Phase 3: Core Implementation — Email Templates

- [ ] 3.1 Create `src/emails/ExperienceApproved.tsx`
- [ ] 3.2 Create `src/emails/ExperienceRejected.tsx`

### Phase 4: Integration — Admin Route Side Effects

- [ ] 4.1 Git-rename `approve/route.ts` → `route.tsx`
- [ ] 4.2 Git-rename `reject/route.ts` → `route.tsx`
- [ ] 4.3 `approve/route.tsx` — add sendMail side effect
- [ ] 4.4 `reject/route.tsx` — add sendMail side effect

### Phase 5: Verification (deferred to PR 2 / sdd-verify)

- [ ] 5.1–5.8 Manual and automated verification

---

## Files Changed

| File | Action | What |
|------|--------|------|
| `src/types/next-auth.d.ts` | Modified | Added `locale?: "es" \| "en" \| null` to Session["user"] |
| `src/lib/auth.ts` | Modified | Added locale seed on create; added locale to session select + assignment |
| `prisma/schema.prisma` | Modified | Added `locale String?` field to User model |
| `src/app/api/user/locale/route.ts` | Created | PATCH endpoint for locale persistence |
| `src/hooks/useSyncLocale.ts` | Created | Client hook for fire-and-forget locale sync |
| `src/components/providers/SyncLocale.tsx` | Created | Client wrapper component for SyncLocale hook |
| `src/app/[locale]/layout.tsx` | Modified | Mounted SyncLocale inside SessionProvider |

---

## Deviations from Design

**Schema migration required (not in design):** The design stated `User.locale String?` already exists at `schema.prisma:447`. That line refers to `XsedNotificationSignup.locale`, not the `User` model. The field did not exist on `User`. Added `locale String?` to the User model and ran `prisma generate`. A DB migration (`db:push` or `db:migrate`) is required before deploying.

---

## Workload / PR Boundary

- Mode: chained PR slice (stacked-to-main)
- Current work unit: PR 1 — User locale persistence + sync
- Boundary: starts at type extension, ends at layout mount; no email or admin route code
- Estimated review budget impact: ~80 changed lines (well within 400-line budget)

---

## Verification

- `npm run typecheck` — 0 errors after adding schema field and running `prisma generate`
- `npm run db:generate` — Prisma client regenerated successfully
