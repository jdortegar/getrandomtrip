import { socialWorkerAuthorized } from "../../src/lib/social-approvals/dispatchSocialWorker";
import { runSocialRevision } from "../../src/lib/social-approvals/runSocialRevision";

// Netlify queues/retries this long-running invocation independently of Next requests.
// This installed Netlify SDK uses the supported -background filename convention.
// On demand only (no cron, so the database can sleep): every dispatch drains the
// queue, so a job whose own dispatch failed runs with the next one.
/** Stop claiming new jobs after this long; background functions end at 15 min. */
const CLAIM_WINDOW_MS = 8 * 60_000;

export default async function handler(request: Request) {
  if (!socialWorkerAuthorized(request))
    return new Response(null, { status: 401 });
  const started = Date.now();
  while (Date.now() - started < CLAIM_WINDOW_MS && (await runSocialRevision()));
}
