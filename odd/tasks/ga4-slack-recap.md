# GA4 daily Slack recap

## Objective
Post a daily recap of site traffic (GA4) to the `#analytics` Slack channel.

## Problem / why
The team has no passive visibility into how many people visit the site, from where, and what they do. GA4 has the data but no native Slack push.

## Decisions (grill session 2026-10-02)
- Source: GA4 Data API (REST `properties/{id}:runReport`), not the DB. Consent-gated, so numbers undercount; message says so.
- Runs in-app: Netlify scheduled function -> `POST /api/internal/analytics-recap` (Bearer `CRON_SECRET`) -> GA4 -> Slack webhook. Mirrors `sales-notifications`.
- No `@google-analytics/data` dependency: JWT signed with `node:crypto` + `fetch` (avoids gRPC/google-gax bundle weight).
- Schedule: daily `0 12 * * *` UTC (09:00 America/Argentina/Buenos_Aires, no DST). Covers `yesterday` vs `8daysAgo` (same weekday last week), GA4 property timezone.
- Content: visitors (activeUsers), new users, sessions, page views with week-over-week %; top 5 countries; top 5 channel groups; top 5 pages; actions (sign_up, generate_lead, waitlist_join, purchase) counts; consent caveat footer.
- Channel: `#analytics` via dedicated Slack app "Randomtrip Analytics" webhook.
- Auth: dedicated read-only GCP service account with GA4 Viewer on the production property (email and property ID live only in Netlify env; never commit them — Netlify secrets scanning fails the build).
- Message copy is internal ops text (not site UI) -> English, no i18n dictionary.

## Env
`SLACK_ANALYTICS_WEBHOOK_URL`, `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY` (`\n`-escaped, unescaped in code), existing `CRON_SECRET`.

## TDD
Strict TDD: enabled (session config). Runner: `npx vitest run <path>` (`npm test` = `vitest run`).

## Tasks
- [x] T1 GA4 client: service-account JWT access token + `runReport` (delegated writer)
- [x] T2 Recap fetch: build the GA4 report requests and map rows into a typed `DailyRecap` (delegated writer)
- [x] T3 Slack formatter + sender: pure `formatRecapMessage`, `postToSlack` (delegated writer)
- [x] T4 Internal route `api/internal/analytics-recap` with CRON_SECRET auth + Netlify scheduled function (delegated writer)
- [x] T5 `env.example` entries + docs note (delegated writer)
- [x] T6 Checks: `npx vitest run` on new tests, `npm run typecheck`, `npm run lint`
- [x] T7 Live smoke: post one real recap to `#analytics` — user-run 2026-10-02, output `posted`

Route: delegated direct — writer trigger (5+ non-trivial files).

## Acceptance criteria
- Production-only (same deployment guard as sales notifications); non-prod returns 204.
- Missing/invalid config -> 500 "misconfigured", never logs secrets.
- GA4 or Slack failure -> 503, no partial Slack post.
- Formatter output matches the agreed layout; zero-traffic day renders without NaN/Infinity (show "new" or "–" when last week is 0).

## Progress
- Credentials verified 2026-10-02 via read-only GA4 runReport (yesterday by country returned rows).
- Commits: none yet (user approves every commit).
- Engram mirror `odd/ga4-slack-recap/tasks`: PENDING (mem_save failed: multiple active runtime sessions).

## Verification evidence (writer, 2026-10-02)
- `npx vitest run src/lib/analytics-recap src/app/api/internal/analytics-recap src/lib/__tests__/deploymentJobs.test.ts`: 9 files, 75 tests passed
- `npx vitest run src/lib/sales` (regression): passed
- `npm run typecheck`: no errors
- `npm run lint`: no errors, 0 warnings (lint covers `src` only; `netlify/functions` is not linted)

## Files
Created: `src/types/analyticsRecap.ts`, `src/lib/analytics-recap/{ga4Client,fetchDailyRecap,formatRecapMessage,postToSlack,readAnalyticsRecapConfig,runAnalyticsRecap}.ts` (+ `__tests__/` for each and `schedule.test.ts`), `src/app/api/internal/analytics-recap/route.ts` (+ `__tests__/route.test.ts`), `netlify/functions/analytics-recap.ts`.
Modified: `env.example` (GA4/Slack block), `src/lib/__tests__/deploymentJobs.test.ts` (added `analytics-recap` to jobs).

## Next step
Commit (excluding public/videos/hero-solo-video.mp4) after user approval, then committed-only review.

## Parent verification (2026-10-02)
- Spot check re-run: `npx vitest run src/lib/analytics-recap src/app/api/internal/analytics-recap src/lib/__tests__/deploymentJobs.test.ts` → 9 files, 78 tests passed; `npm run typecheck` → clean.
- Structural readback of route, netlify function, formatter, GA4 client, config reader: matches decisions.
- `public/videos/hero-solo-video.mp4` shows modified in fresh worktrees (committed as raw binary despite `*.mp4 filter=lfs`); unrelated, must be excluded from commits.
- RDD: pending until the user approves a work-unit commit (candidate = commit, reviewed with `--committed-only`).
- T7 live smoke: user ran it locally against prod creds → `posted` (message content not inspected by agent).
