import type { init } from "@sentry/nextjs";

// Shared by all runtimes: collect errors, not customer or payment data.
export const sentryOptions: Parameters<typeof init>[0] = {
  dataCollection: {
    cookies: false,
    databaseQueryData: false,
    frameContextLines: 0,
    genAI: { inputs: false, outputs: false },
    graphQL: { document: false, variables: false },
    httpBodies: [],
    httpHeaders: false,
    stackFrameVariables: false,
    urlQueryParams: false,
    userInfo: false,
  },
  enableLogs: false,
  enableMetrics: false,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  // Existing console logs can contain personal data. Do not attach breadcrumbs.
  maxBreadcrumbs: 0,
  sendDefaultPii: false,
  // Leave tracesSampleRate/tracesSampler unset to disable tracing entirely.
  tracePropagationTargets: [],
  beforeSend(event) {
    delete event.request;
    delete event.user;
    // Next's error hook adds this context separately from the request object.
    const nextjs = event.contexts?.nextjs;
    if (typeof nextjs?.request_path === "string") {
      nextjs.request_path = nextjs.request_path.split(/[?#]/)[0];
    }
    return event;
  },
};
