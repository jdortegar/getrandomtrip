import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";

const { captureRequestError, captureRouterTransitionStart, init } = vi.hoisted(
  () => ({
    captureRequestError: vi.fn(),
    captureRouterTransitionStart: vi.fn(),
    init: vi.fn(),
  }),
);

vi.mock("@sentry/nextjs", () => ({
  captureRequestError,
  captureRouterTransitionStart,
  init,
}));

const runtimes = [
  ["browser", () => import("../instrumentation-client")],
  ["nodejs", () => import("../sentry.server.config")],
  ["edge", () => import("../sentry.edge.config")],
] as const;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
  vi.stubEnv("SENTRY_DSN", "");
  vi.stubEnv("NEXT_PUBLIC_SENTRY_ENVIRONMENT", "preview");
});

afterEach(() => vi.unstubAllEnvs());

describe.each(runtimes)("Sentry %s initialization", (runtime, load) => {
  it("does not initialize without a DSN", async () => {
    await load();
    expect(init).not.toHaveBeenCalled();
  });

  it("initializes error-only monitoring with a public DSN", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://public@example.com/1");
    await load();
    const options = init.mock.calls[0][0];
    expect(options).toMatchObject({
      dsn: "https://public@example.com/1",
      enableLogs: false,
      enableMetrics: false,
      environment: "preview",
      maxBreadcrumbs: 0,
      sendDefaultPii: false,
      tracePropagationTargets: [],
    });
    expect(options.tracesSampleRate).toBeUndefined();
    expect(options.tracesSampler).toBeUndefined();
    if (runtime === "browser") {
      expect(
        options.integrations([
          { name: "BrowserTracing" },
          { name: "BrowserSession" },
          { name: "GlobalHandlers" },
        ]),
      ).toEqual([{ name: "GlobalHandlers" }]);
    }
  });

  it("only uses the private DSN override on server runtimes", async () => {
    vi.stubEnv("SENTRY_DSN", "https://server@example.com/2");
    await load();
    if (runtime === "browser") expect(init).not.toHaveBeenCalled();
    else
      expect(init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: "https://server@example.com/2",
        }),
      );
  });
});

it.each(["nodejs", "edge"])(
  "registers the %s runtime and request hook",
  async (runtime) => {
    vi.stubEnv("NEXT_RUNTIME", runtime);
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://public@example.com/1");
    const instrumentation = await import("../instrumentation");
    await instrumentation.register();
    expect(init).toHaveBeenCalledTimes(1);
    expect(instrumentation.onRequestError).toBe(captureRequestError);
  },
);

it("excludes sensitive data collection and request context", async () => {
  const { sentryOptions } = await import("../lib/sentry/options");
  expect(sentryOptions.dataCollection).toEqual({
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
  });
  const event: ErrorEvent = {
    type: undefined,
    contexts: {
      nextjs: {
        request_path: "/reset-password?token=secret#private",
        route_type: "route",
      },
    },
    exception: { values: [{ type: "Error", value: "Failure" }] },
    request: {
      cookies: { session: "secret" },
      data: "payment details",
      url: "https://example.com?token=secret",
    },
    user: { email: "private@example.com" },
  };
  expect(sentryOptions.beforeSend?.(event, {})).toEqual({
    contexts: {
      nextjs: { request_path: "/reset-password", route_type: "route" },
    },
    exception: event.exception,
  });
});

it.each([0, 1, 2, 3, 4, 5, 6, 7])(
  "gates source maps on all build credentials (mask %s)",
  (mask) => {
    const withSentryConfig = vi.fn((config) => config);
    runInNewContext(readFileSync("next.config.js", "utf8"), {
      module: { exports: {} },
      process: {
        env: {
          SENTRY_AUTH_TOKEN: mask & 1 ? "token" : "",
          SENTRY_ORG: mask & 2 ? "org" : "",
          SENTRY_PROJECT: mask & 4 ? "project" : "",
        },
      },
      require: () => ({ withSentryConfig }),
    });
    expect(withSentryConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        images: expect.any(Object),
        redirects: expect.any(Function),
      }),
      expect.objectContaining({
        sourcemaps: { deleteSourcemapsAfterUpload: true, disable: mask !== 7 },
        telemetry: false,
      }),
    );
  },
);
