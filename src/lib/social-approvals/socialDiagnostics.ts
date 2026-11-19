export type SocialDiagnosticStage =
  | "import.parse"
  | "import.lookup"
  | "import.profile"
  | "import.feed"
  | "import.persist"
  | "import.dispatch"
  | "worker.run"
  | "slack.post"
  | "slack.parse"
  | "slack.accept"
  | "slack.record";
interface DiagnosticContext {
  requestId?: string;
  jobId?: string;
  reviewId?: string;
  httpStatus?: number;
  slackCode?: unknown;
}
const SLACK_CODES = new Set(
  "invalid_auth not_authed token_revoked token_expired account_inactive missing_scope not_in_channel channel_not_found is_archived invalid_blocks invalid_arguments ratelimited restricted_action internal_error request_timeout fatal_error".split(
    " ",
  ),
);
const CATEGORIES = new Set(["timeout", "http", "invalid_response", "network"]);
const ID = /^(?:c[a-z0-9]{24,31}|[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})$/;

/** Never serialize thrown objects, messages, stacks, causes or upstream payloads. */
export function logSocialFailure(
  stage: SocialDiagnosticStage,
  error: unknown,
  context: DiagnosticContext = {},
) {
  try {
    const detail =
      error instanceof Error
        ? (error as Error & {
            code?: unknown;
            httpStatus?: unknown;
            diagnosticCategory?: unknown;
          })
        : undefined;
    const code =
      typeof detail?.code === "string" && /^P[0-9]{4}$/.test(detail.code)
        ? detail.code
        : typeof context.slackCode === "string" &&
            SLACK_CODES.has(context.slackCode)
          ? context.slackCode
          : undefined;
    const category = code?.startsWith("P")
      ? "database"
      : typeof detail?.diagnosticCategory === "string" &&
          CATEGORIES.has(detail.diagnosticCategory)
        ? detail.diagnosticCategory
        : error instanceof SyntaxError
          ? "invalid_response"
          : error instanceof TypeError
            ? "type_error"
            : detail?.name === "TimeoutError" || detail?.name === "AbortError"
              ? "timeout"
              : "unknown";
    const httpStatus = context.httpStatus ?? detail?.httpStatus;
    const data: Record<string, string | number> = { stage, category };
    if (code) data.code = code;
    if (
      typeof httpStatus === "number" &&
      Number.isInteger(httpStatus) &&
      httpStatus >= 100 &&
      httpStatus <= 599
    )
      data.httpStatus = httpStatus;
    for (const key of ["requestId", "jobId", "reviewId"] as const) {
      const id = context[key];
      if (typeof id === "string" && ID.test(id)) data[key] = id;
    }
    console.error("[social-diagnostics]", data);
  } catch {
    // Diagnostics must not change delivery or recovery semantics, even if logging fails.
  }
}
