import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry/options";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    ...sentryOptions,
    dsn,
    integrations: (defaults) =>
      defaults.filter(
        ({ name }) => name !== "BrowserTracing" && name !== "BrowserSession",
      ),
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
