/** Outcome of asking the server for a share or top-up payment intent. */
export type IntentResult =
  | { kind: "ready"; clientSecret: string }
  | { kind: "paid" }
  | { kind: "closed" }
  | { kind: "error" };

/**
 * Requests in flight, by endpoint + body. Overlapping calls for the same
 * payment (React's dev double effect, a quick re-render) share one request:
 * a second POST would lose the server's claim race and answer 409.
 */
const inFlight = new Map<string, Promise<IntentResult>>();

/**
 * Requests a payable intent from `endpoint`; sets no state, so callers can
 * apply the result from an effect callback. `closedCodes` are the API error
 * codes that mean the payment window is over.
 */
export function fetchShareIntent(
  endpoint: string,
  body: Record<string, string>,
  closedCodes: string[],
): Promise<IntentResult> {
  const key = `${endpoint} ${JSON.stringify(body)}`;
  const pending = inFlight.get(key);
  if (pending) return pending;
  const request = requestIntent(endpoint, body, closedCodes).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

async function requestIntent(
  endpoint: string,
  body: Record<string, string>,
  closedCodes: string[],
): Promise<IntentResult> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.paid) return { kind: "paid" };
    if (closedCodes.includes(data.errorCode)) return { kind: "closed" };
    if (!response.ok || typeof data.clientSecret !== "string") return { kind: "error" };
    return { kind: "ready", clientSecret: data.clientSecret };
  } catch {
    return { kind: "error" };
  }
}
