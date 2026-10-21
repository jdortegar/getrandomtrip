import { socialWorkerAuthorized } from "../../src/lib/social-approvals/dispatchSocialWorker";
import { runSocialRevision } from "../../src/lib/social-approvals/runSocialRevision";

// Netlify queues/retries this long-running invocation independently of Next requests.
// This installed Netlify SDK uses the supported -background filename convention.
export default async function handler(request: Request) {
  if (!socialWorkerAuthorized(request))
    return new Response(null, { status: 401 });
  await runSocialRevision();
}
