import { timingSafeEqual } from "node:crypto";
export function socialWorkerAuthorized(request: Request) {
  const secret = process.env.SLACK_SOCIAL_WORKER_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  return (
    !!secret &&
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}
export async function dispatchSocialWorker() {
  if (
    (process.env.SLACK_SOCIAL_AI_ENABLED !== "true" &&
      process.env.SLACK_SOCIAL_PUBLISH_ENABLED !== "true") ||
    !process.env.SLACK_SOCIAL_WORKER_SECRET ||
    !process.env.SLACK_SOCIAL_APP_ORIGIN
  )
    return;
  const origin = new URL(process.env.SLACK_SOCIAL_APP_ORIGIN);
  if (
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error("INVALID_WORKER_ORIGIN");
  const response = await fetch(
    new URL("/.netlify/functions/social-revisions-background", origin),
    {
      method: "POST",
      redirect: "error",
      headers: {
        Authorization: `Bearer ${process.env.SLACK_SOCIAL_WORKER_SECRET}`,
      },
      signal: AbortSignal.timeout(3000),
    },
  );
  if (!response.ok) throw new Error("WORKER_DISPATCH_FAILED");
}
