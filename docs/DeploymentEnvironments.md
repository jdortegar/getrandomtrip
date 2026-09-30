# Develop and preview isolation

Production and nonproduction use the same Netlify site, but never the same
application database or Blob stores. Develop and all PR previews currently share
**one nonproduction database and Blob namespace**: they are not isolated from one
another. Production keeps its existing store names and integrations.

## Release preview policy

Netlify skips Deploy Previews whose source branch is `develop`: this workflow
uses `develop` PRs only for releases to `main`. Feature PR previews, the `develop`
branch deployment, and `main` production deployments still build normally.

The `netlify.toml` ignore command is scoped to `[context.deploy-preview]` and
requires both `CONTEXT=deploy-preview` and `HEAD=develop`. Other contexts retain
their existing change-detection behavior. `HEAD` identifies the source branch;
`BRANCH` is not treated as the PR target. Missing or unknown metadata continues
the build. Netlify's ignore exit codes are `0` to skip and `1` to build. Revisit
this source-only rule if `develop` PRs start targeting other branches.

## Required configuration

Set these in Netlify's environment-variable UI with **build and function scopes**.
Values in `netlify.toml` and most Netlify build variables are not runtime variables.

| Variable                             | Production                     | Develop and Deploy Previews                        |
| ------------------------------------ | ------------------------------ | -------------------------------------------------- |
| `RT_DEPLOY_ENV`                      | `production`                   | `nonproduction`                                    |
| `DATABASE_URL`                       | Existing production connection | Approved isolated database                         |
| `RT_NONPRODUCTION_DATABASE_HOST`     | Not used                       | Exact hostname of that approved database           |
| `RT_NONPRODUCTION_AUTH_SECRET`       | Not used                       | Separate private random secret                     |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Existing OAuth client    | Ignored                                            |
| `RT_NONPRODUCTION_GOOGLE_CLIENT_ID` / `RT_NONPRODUCTION_GOOGLE_CLIENT_SECRET` | Not used | Separate nonproduction OAuth client pair |
| `STRIPE_SECRET_KEY`                  | Existing key                   | Optional `sk_test_` / `rk_test_` key only          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Existing key                   | Optional `pk_test_` key only                       |
| `STRIPE_WEBHOOK_SECRET`              | Existing signing secret        | Separate test endpoint secret, if testing webhooks |

Only the `develop` branch override and Deploy Previews currently have the approved
nonproduction `DATABASE_URL`. Other nonproduction contexts deliberately fail the
host guard if they inherit the production connection; do not enable those branch
deploys without explicitly configuring an isolated database.

Use `nonproduction` for every other deploy context. Missing/unknown identity blocks
real mail, Slack, and scheduled work, and uses `nonproduction-` Blob stores. The
database host guard rejects missing/mismatched connections before constructing a
client. All upload reads, writes, deletes, document stores, and legacy read fallbacks stay in
that namespace; there is no production-media fallback. Production defaults remain
unchanged only with the explicit `production` identity.

The build derives nonsecret `NEXT_PUBLIC_RT_DEPLOY_ENV` and
`NEXT_PUBLIC_RT_PUBLIC_ORIGIN` from the deploy identity and Netlify's
`DEPLOY_PRIME_URL` (or `DEPLOY_URL`) and `SITE_NAME`. Only that site's develop,
numeric PR-preview, or immutable deploy-ID aliases are accepted; its production
root and other sites are rejected. Never set them to the production URL for a
preview. Hosted nonproduction builds reject missing/unsafe origins. Local builds
use `http://localhost:3010`. These values are frozen at build time: rebuild after
changing configuration, and do not promote a preview artifact to production.

NextAuth is initialized with that validated origin at runtime, including its
internal URL. Nonproduction ignores inherited production auth secrets and
forwarded-host trust. Existing production auth settings are not rewritten.

## Google sign-in in each environment

Create or select a **development Google Cloud project separate from production**,
then create a Google OAuth **Web application** client inside it. Local, develop,
and PR previews share this nonproduction tier.

[Google's production policy](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)
requires separate testing and production projects. Keep test-only origins and
callbacks out of production OAuth clients.

Set both `RT_NONPRODUCTION_GOOGLE_CLIENT_ID` and
`RT_NONPRODUCTION_GOOGLE_CLIENT_SECRET` in local ignored environment files and
the intended Netlify contexts. Missing or partial pairs disable Google without
falling back to production keys; credentials login remains available. The login
and invite forms display Google only after `/api/auth/providers` advertises it.
The isolated auth secret, database, and validated-origin requirements still apply.

Register these **authorized redirect URIs** in the appropriate Google client:

| Environment | Exact callback URI |
| --- | --- |
| Local (nonproduction client) | `http://localhost:3010/api/auth/callback/google` |
| Develop (nonproduction client) | `https://develop--<site-name>.netlify.app/api/auth/callback/google` |
| Each active PR preview (nonproduction client) | `https://deploy-preview-<number>--<site-name>.netlify.app/api/auth/callback/google` |
| Production (existing client) | Existing production origin + `/api/auth/callback/google` |

Google requires an [exact redirect URI match and forbids wildcards](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation).
Register each active preview URL before testing it; new previews are not
automatically authorized. If testing an immutable deploy-ID URL, register that
exact callback as well. Do not redirect preview callbacks through develop or
production. Check Google's audience/testing restrictions allow the intended test
account.
Restart local development or rebuild the hosted context after changing keys.

Verify provider discovery, then complete Google sign-in in a supported browser
and confirm the callback/session stays on the starting environment. Ordinary
Google login does not itself grant site access or privileged roles; existing
invite grants remain unchanged. Nonproduction email delivery stays disabled.
Provider discovery alone is not an end-to-end OAuth success check.

## First deployment limits

- Public pages can render without payment keys. Checkout requires matching Stripe
  test keys; live keys and live webhook events are rejected outside production.
- Email delivery fails explicitly before Resend is constructed; it does not
  simulate provider acceptance. Email verification, password reset, invites, and
  manual messages therefore cannot complete. Slack and all six scheduled jobs
  are disabled, including direct calls to their internal API routes.
- Credentials login requires the private nonproduction auth secret and an
  **approved, verified test account**. The empty database's site gate defaults to enabled; keep it
  enabled through the first deployment and account bootstrap below. Never copy
  production users or weaken verification.
- No schema changes or automatic seed are included. `npm run db:seed` is currently
  a no-op; `npm run db:migrate` actually runs `prisma db push`. Do not run either as
  an environment-setup shortcut.

## Verification and first gated deployment

Run `npm run typecheck`, changed-file ESLint, and focused Vitest suites for
`deployment`, `auth`, `attribution`, `upload`, `storage`, `sales`, `internal`, and
`stripe`. Existing suites default to production policy with mocked integrations;
isolation suites explicitly cover missing, unknown, and nonproduction identity.

After independent review and deployment approval:

1. Deploy with the site gate enabled. Verify the database-host guard, hosted auth
   provider/CSRF endpoints, and redirects use the approved nonproduction database
   and develop/preview origin.
2. The intended administrator personally signs up via `/login`, choosing their
   own password. Registration stores its bcrypt hash; the account remains
   unverified because email delivery is disabled. Do not request the password.
3. With explicit approval, verify the exact registered user ID and email in the
   isolated database, then mark that account verified and grant `ADMIN`. Create
   the required Randomtrip system-owner row separately as a non-login account.
4. Run authenticated hosted smoke checks. Confirm uploads read/delete only
   nonproduction stores and internal cron routes return 404. Check production
   behavior separately without sending test mail, charging cards, running jobs,
   or modifying production data.

Do not call the environment ready until the approved database-host guard, private
auth secret, approved account bootstrap, and hosted smoke checks are complete.
