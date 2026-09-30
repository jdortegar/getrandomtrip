// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { sendMail } from "../helpers/sendMail";
import { sendSaleNotification } from "../sales/sendSaleNotification";
const { send, construct } = vi.hoisted(() => ({
  send: vi.fn(),
  construct: vi.fn(),
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
    constructor() {
      construct();
    }
  },
}));
const sale = {
  amount: 10,
  currency: "USD",
  paymentId: "pay_1",
  tripRequestId: "trip_1",
};
const mail = {
  to: "test@example.invalid",
  subject: "Test",
  content: { text: "Test" },
};
beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it.each([undefined, "nonproduction", "unknown"])(
  "blocks real email and Slack for %s",
  async (context) => {
    vi.stubEnv("RT_DEPLOY_ENV", context);
    vi.stubEnv("RESEND_API_KEY", "test-provider-key");
    vi.stubEnv(
      "SLACK_SALES_WEBHOOK_URL",
      "https://hooks.slack.com/services/T/B/fake",
    );
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(sendMail(mail)).rejects.toThrow("disabled");
    expect(construct).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(await sendSaleNotification(sale)).toEqual({
      sent: false,
      error: "not_configured",
    });
    expect(fetch).not.toHaveBeenCalled();
  },
);
it("preserves production mail payload and provider confirmation", async () => {
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.stubEnv("RESEND_API_KEY", "test-provider-key");
  send.mockResolvedValue({ data: { id: "provider-id" }, error: null });
  expect(await sendMail(mail)).toEqual({ id: "provider-id" });
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({
      to: mail.to,
      subject: mail.subject,
      text: "Test",
    }),
    undefined,
  );
});
