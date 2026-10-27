/** Outcome of asking the server for a share or top-up payment intent. */
export type IntentResult =
  | { kind: "ready"; clientSecret: string }
  | { kind: "paid" }
  | { kind: "closed" }
  | { kind: "error" };

/**
 * Requests a payable intent from `endpoint`; sets no state, so callers can
 * apply the result from an effect callback. `closedCodes` are the API error
 * codes that mean the payment window is over.
 */
export async function fetchShareIntent(
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
