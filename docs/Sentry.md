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

In a local or preview deployment with a test-project DSN, temporarily throw
`new Error("Sentry smoke test")` from an application button handler and then from
a server route. Confirm both events in Sentry Issues with the expected environment
and readable stack traces when uploads are configured. Remove the temporary test
code afterward; no public diagnostic endpoint is included. Browser console throws
are not a reliable capture test. Live delivery requires a real DSN and network access.

Reference: [Sentry's Next.js manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/).
