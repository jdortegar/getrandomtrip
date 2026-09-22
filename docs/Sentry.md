# Sentry error monitoring

Set `NEXT_PUBLIC_SENTRY_DSN` to your Sentry project's DSN to capture uncaught
browser, server, and edge errors. Without a DSN, the SDK is not initialized.

## Setup

1. Create a Next.js project in Sentry and copy its DSN into `.env.local`.
2. Set `NEXT_PUBLIC_SENTRY_ENVIRONMENT` to `development`, `preview`, or `production`.
3. On Netlify, set both values for **builds and functions**, then redeploy.
   Public variables are compiled into browser bundles; changing them needs a rebuild.
4. Optionally set the build-only `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and
   `SENTRY_PROJECT` together for readable production stack traces. Uploads are
   disabled unless all three exist. Uploaded client source maps are deleted.

`SENTRY_DSN` can override the DSN for server/edge capture, but cannot enable
browser capture by itself. The DSN is public; the auth token is a secret and must
never use a `NEXT_PUBLIC_` prefix or be committed.

The wizard's `.env.sentry-build-plugin` contains an upload token and stays
gitignored. It does not activate runtime capture or replace the three-variable
source-map upload gate above. Do not commit this file or rerun the wizard over
the existing configuration.

## Coverage and privacy

- Next's `onRequestError` captures uncaught server rendering and request errors.
  Both app error boundaries explicitly report React render errors, including
  root-layout failures, without replacing the existing error screen.
- Tracing, replay, profiling, logs, metrics, and browser session tracking are not
  enabled. Automatic personal data, request payloads/headers/cookies/query values,
  stack locals, and console breadcrumbs are excluded.
- Existing `catch` blocks that log and return a response are **not** automatically
  reported. Console interception is intentionally off because existing logs can
  contain personal or payment data. Report unexpected handled failures explicitly:

  ```ts
  import * as Sentry from "@sentry/nextjs";

  try {
    await performOperation();
  } catch (error) {
    Sentry.captureException(error);
    // Keep the existing safe error response or recovery behavior.
  }
  ```

Error messages, stack traces, and explicitly supplied context can still contain
sensitive data: do not attach payment details, tokens, or personal information.
Review Sentry project-side data scrubbing and access controls before production.

## Verify

1. Set `NEXT_PUBLIC_SENTRY_DSN` in `.env.local` and
   `NEXT_PUBLIC_SENTRY_ENVIRONMENT=development`. Netlify environment variables
   are **not** automatically loaded by `npm run dev`.
2. Restart `npm run dev` and open `/sentry-example-page` (uses your current
   language, Spanish by default) or `/en/sentry-example-page` on port 3010.
3. Run each button once: browser capture creates `Sentry browser smoke test`;
   the API deliberately throws `Sentry backend smoke test` to exercise Next's
   request-error hook. Confirm both in the linked Sentry Issues project with
   environment `development`.

Flush completion and HTTP 500 are **not proof of delivery**. Live verification
requires an active DSN, network access, and checking Sentry itself. If disabled,
configure the local DSN and restart; if blocked, check network/content blockers.
The page and API are development-only (404 outside development); the API accepts
only POST to avoid accidental navigation/prefetch errors. No tracing or logs are
enabled by these tests.

Reference: [Sentry's Next.js manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/).
