# Tasks: Experience Review Email Notifications + User Locale Preference

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 320–420 |
| 400-line budget risk | Medium–High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: locale-preference (auth + API + hook + layout) → PR 2: email templates + admin routes |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | User locale persistence + sync | PR 1 | types, auth, PATCH route, hook, SyncLocale component, layout mount |
| 2 | Email templates + admin route notifications | PR 2 | depends on PR 1 merged; rename .ts→.tsx; ExperienceApproved/Rejected templates; approve + reject side effects |

---

## Phase 1: Foundation — Types and Auth

- [x] 1.1 `src/types/next-auth.d.ts` — add `locale?: "es" | "en" | null` to `Session["user"]` (satisfies D2, spec: session callback exposes locale)
- [x] 1.2 `src/lib/auth.ts` signIn callback — add `locale: "es"` to the `prisma.user.create` data object so new OAuth users are seeded with a deterministic preference (spec: Default Locale on Sign-In; must preserve the existing-user guard: only write on create, not update)
- [x] 1.3 `src/lib/auth.ts` session callback — add `locale: true` to the `dbUser` select; assign `session.user.locale = dbUser.locale as "es" | "en" | null` in the assignment block (satisfies D2)

## Phase 2: Core Implementation — Locale API and Client Sync

- [x] 2.1 Create `src/app/api/user/locale/route.ts` — PATCH handler only: `getServerSession` → 401 if no session; parse body `{ locale }`; reject non-`"es"|"en"` with 422 `{ error: "invalid_locale" }`; `prisma.user.update` → return 200 `{ locale }` (spec: Locale Update API; three scenarios)
- [x] 2.2 Create `src/hooks/useSyncLocale.ts` — `"use client"` hook; reads `session.user.locale` via `useSession`, URL locale via `useParams`; calls `PATCH /api/user/locale` fire-and-forget (void + `.catch(() => {})`) only when `session.user.id` exists and `current !== locale`; deps array: `[session?.user?.id, session?.user?.locale, locale]` (spec: Client-Side Locale Sync; D5)
- [x] 2.3 Create `src/components/providers/SyncLocale.tsx` — `"use client"` wrapper; calls `useSyncLocale()` and returns `null` (layout cannot call hooks directly — server component constraint)
- [x] 2.4 `src/app/[locale]/layout.tsx` — mount `<SyncLocale />` inside the existing `SessionProvider` tree, alongside `SetLocaleLang` (spec: locale layout must call sync on mount)

## Phase 3: Core Implementation — Email Templates

- [ ] 3.1 Create `src/emails/ExperienceApproved.tsx` — props `{ tripper: string; experienceTitle: string; locale: "es" | "en" }`; internal `copy = { es: {...}, en: {...} }` with heading, body, CTA label, footer; export `subjects = { es: string; en: string }`; `<Html lang={locale}>` + localized `<Preview>`; CTA button links to `https://getrandomtrip.com/${locale}/dashboard/tripper/experiences`; style from `NewsletterGoLive.tsx` (spec: ExperienceApproved template — two locale scenarios)
- [ ] 3.2 Create `src/emails/ExperienceRejected.tsx` — same shape as 3.1; adds `reviewNote: string` prop; renders `reviewNote` verbatim inside a distinct `Section` panel (`background: #fdf9f9`) with a locale-appropriate label ("Nota del revisor:" / "Reviewer note:"); export `subjects = { es: string; en: string }` (spec: ExperienceRejected template — reviewNote visibility, locale rendering)

## Phase 4: Integration — Admin Route Side Effects

- [ ] 4.1 Git-rename `src/app/api/admin/experiences/[id]/approve/route.ts` → `route.tsx` — use `git mv` to preserve history; verify no duplicate `route.ts` exists at that path afterward (D4 risk: stray `.ts` shadowing)
- [ ] 4.2 Git-rename `src/app/api/admin/experiences/[id]/reject/route.ts` → `route.tsx` — same as 4.1
- [ ] 4.3 `approve/route.tsx` — after `prisma.experience.update` commits: query `prisma.user.findUnique({ where: { id: updated.ownerId }, select: { email, name, locale } })`; if `owner?.email`, resolve `locale = owner.locale === "en" ? "en" : "es"`; fire-and-forget `sendMail` with `<ExperienceApproved tripper={owner.name} experienceTitle={updated.title} locale={locale} />` and subject from `approvedSubjects[locale]`; wrap in `void (async () => { try { … } catch(err) { console.error(...) } })()` (spec: Approve Route Sends Notification — three scenarios; D3, D6)
- [ ] 4.4 `reject/route.tsx` — same shape; pass `reviewNote` (already computed) to `<ExperienceRejected>`; use `rejectedSubjects[locale]` (spec: Reject Route Sends Notification — two scenarios)

## Phase 5: Verification

- [ ] 5.1 `npm run typecheck` — zero errors across all modified files (next-auth.d.ts, auth.ts, route files, hooks, templates)
- [ ] 5.2 `npm run lint` — no new ESLint violations; confirm no raw `<img>` in templates
- [ ] 5.3 Manual: sign in as a new Google user → verify `User.locale = "es"` in DB via Prisma Studio
- [ ] 5.4 Manual: switch locale in browser URL → verify `PATCH /api/user/locale` fires once (Network tab) and `User.locale` updates in DB; confirm no re-fire on same locale
- [ ] 5.5 Manual: `PATCH /api/user/locale` with `{ locale: "fr" }` → expect 422; unauthenticated → expect 401
- [ ] 5.6 Manual: admin approves a `PENDING_REVIEW` experience whose owner has `locale = "en"` → verify email arrives in English and status is `ACTIVE` regardless of Resend result
- [ ] 5.7 Manual: admin rejects an experience → verify email contains the exact `reviewNote` text; status is `DRAFT`
- [ ] 5.8 Verify `approve/route.tsx` and `reject/route.tsx` are the only `.ts(x)` files at those paths (no shadowing duplicate)
