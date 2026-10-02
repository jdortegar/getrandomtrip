import type { SlackRecapPayload } from "@/types/analyticsRecap";

const SLACK_TIMEOUT_MS = 8_000;

/** Never log or embed the webhook URL: it is a credential. */
export async function postToSlack(
  webhookUrl: string,
  payload: SlackRecapPayload,
): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "error",
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });
    await response.body?.cancel();
    if (!response.ok) throw new Error("rejected");
  } catch {
    throw new Error("slack_post_failed");
  }
}
