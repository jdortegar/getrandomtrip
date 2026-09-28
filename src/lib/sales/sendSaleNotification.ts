export const SALE_SEND_TIMEOUT_MS = 3_000;

export interface SaleNotification {
  amount: number;
  currency: string;
  paymentId: string;
  tripRequestId: string;
}

export interface SaleDeliveryResult {
  sent: boolean;
  error?: "not_configured" | "invalid_payload" | "rejected" | "unavailable";
  retryAfterMs?: number;
}

/** Never accept request-controlled destinations or log webhook URLs/responses. */
export async function sendSaleNotification(
  sale: SaleNotification,
): Promise<SaleDeliveryResult> {
  let webhook: URL;
  try {
    webhook = new URL(process.env.SLACK_SALES_WEBHOOK_URL ?? "");
    if (
      webhook.protocol !== "https:" ||
      webhook.hostname !== "hooks.slack.com" ||
      webhook.port ||
      webhook.username ||
      webhook.password ||
      webhook.search ||
      webhook.hash ||
      !/^\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(
        webhook.pathname,
      )
    )
      throw new Error("invalid");
  } catch {
    return { sent: false, error: "not_configured" };
  }
  if (
    !Number.isFinite(sale.amount) ||
    sale.amount < 0 ||
    !/^[A-Z]{3}$/.test(sale.currency) ||
    !/^[A-Za-z0-9_-]{1,200}$/.test(sale.paymentId) ||
    !/^[A-Za-z0-9_-]{1,200}$/.test(sale.tripRequestId)
  )
    return { sent: false, error: "invalid_payload" };

  // Operational copy, not customer UI. Plain text and validated identifiers
  // prevent mentions/markup; destination is never derived from a request host.
  const text = `Sale received: ${sale.currency} ${sale.amount.toFixed(2)}\nBooking: ${sale.tripRequestId}\nPayment: ${sale.paymentId}`;
  const url = `https://getrandomtrip.com/es/dashboard/admin/trip-requests/${encodeURIComponent(sale.tripRequestId)}`;
  try {
    const response = await fetch(webhook.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(SALE_SEND_TIMEOUT_MS),
      body: JSON.stringify({
        text,
        blocks: [
          { type: "section", text: { type: "plain_text", text, emoji: false } },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Open booking" },
                url,
              },
            ],
          },
        ],
        unfurl_links: false,
        unfurl_media: false,
      }),
    });
    if (response.status === 200)
      return (await response.text()).trim() === "ok"
        ? { sent: true }
        : { sent: false, error: "rejected" };
    const seconds = Number(response.headers.get("retry-after"));
    await response.body?.cancel();
    return {
      sent: false,
      error: "rejected",
      retryAfterMs:
        response.status === 429 && Number.isFinite(seconds) && seconds > 0
          ? Math.min(seconds * 1_000, 86_400_000)
          : undefined,
    };
  } catch {
    // Includes timeout/ambiguous acceptance. Retrying can duplicate a Slack post.
    return { sent: false, error: "unavailable" };
  }
}
