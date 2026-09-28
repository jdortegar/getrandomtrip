// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  sendSaleNotification,
  SALE_SEND_TIMEOUT_MS,
} from "../sendSaleNotification";

const webhook = "https://hooks.slack.com/services/TTEST/BTEST/test-secret";
const sale = {
  amount: 199.5,
  currency: "USD",
  paymentId: "payment_1",
  tripRequestId: "trip_1",
};
const post = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SLACK_SALES_WEBHOOK_URL", webhook);
  vi.stubGlobal("fetch", post);
  post.mockResolvedValue(new Response("ok"));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("sends only safe operational fields, plain text and a canonical admin link", async () => {
  expect(
    await sendSaleNotification({
      ...sale,
      email: "private@example.com",
    } as typeof sale),
  ).toEqual({ sent: true });
  const [url, init] = post.mock.calls[0];
  expect(url).toBe(webhook);
  expect(init).toMatchObject({
    method: "POST",
    redirect: "error",
    headers: { "Content-Type": "application/json" },
  });
  expect(init.signal).toBeInstanceOf(AbortSignal);
  const payload = JSON.parse(init.body);
  expect(payload.text).toContain("USD 199.50");
  expect(payload.blocks[0].text.type).toBe("plain_text");
  expect(payload.blocks[1].elements[0].url).toBe(
    "https://getrandomtrip.com/es/dashboard/admin/trip-requests/trip_1",
  );
  expect(init.body).not.toContain("private@example.com");
  expect(payload).not.toHaveProperty("channel");
});

it.each([
  "",
  "http://hooks.slack.com/services/T/B/secret",
  "https://hooks.slack.com.evil.test/services/T/B/secret",
  "https://evil.test/services/T/B/secret",
  "https://user:password@hooks.slack.com/services/T/B/secret",
  "https://hooks.slack.com:444/services/T/B/secret",
  "https://hooks.slack.com/services/T/B/secret?leak=1",
  "https://hooks.slack.com/services/T/B/secret#fragment",
  "https://hooks.slack.com/other",
])(
  "rejects unsafe/missing configuration without a request (%s)",
  async (value) => {
    vi.stubEnv("SLACK_SALES_WEBHOOK_URL", value);
    expect(await sendSaleNotification(sale)).toEqual({
      sent: false,
      error: "not_configured",
    });
    expect(post).not.toHaveBeenCalled();
  },
);

it.each([
  { amount: NaN },
  { amount: -1 },
  { currency: "<!here>" },
  { paymentId: "<@U123>" },
  { tripRequestId: "../evil" },
])("rejects invalid/mention-controlled payloads", async (changes) => {
  expect(await sendSaleNotification({ ...sale, ...changes })).toEqual({
    sent: false,
    error: "invalid_payload",
  });
  expect(post).not.toHaveBeenCalled();
});

it.each([400, 403, 404, 500, 302])(
  "never acknowledges HTTP %s",
  async (status) => {
    post.mockResolvedValue(new Response("private provider detail", { status }));
    expect(await sendSaleNotification(sale)).toMatchObject({
      sent: false,
      error: "rejected",
    });
  },
);

it("rejects a 200 with a non-ok body", async () => {
  post.mockResolvedValue(new Response("no_service"));
  expect(await sendSaleNotification(sale)).toMatchObject({
    sent: false,
    error: "rejected",
  });
});

it("returns bounded rate-limit delay without response details", async () => {
  post.mockResolvedValue(
    new Response("private detail", {
      status: 429,
      headers: { "Retry-After": "120" },
    }),
  );
  expect(await sendSaleNotification(sale)).toEqual({
    sent: false,
    error: "rejected",
    retryAfterMs: 120_000,
  });
});

it("sanitizes network errors and uses a fixed abort deadline", async () => {
  const timeout = vi.spyOn(AbortSignal, "timeout");
  post.mockRejectedValue(new Error(webhook));
  expect(await sendSaleNotification(sale)).toEqual({
    sent: false,
    error: "unavailable",
  });
  expect(timeout).toHaveBeenCalledWith(SALE_SEND_TIMEOUT_MS);
});

it("treats timeout as retryable, not acknowledged", async () => {
  const controller = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
  post.mockImplementation(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () =>
          reject(new DOMException("private url", "TimeoutError")),
        );
      }),
  );
  const delivery = sendSaleNotification(sale);
  controller.abort();
  expect(await delivery).toEqual({ sent: false, error: "unavailable" });
});
