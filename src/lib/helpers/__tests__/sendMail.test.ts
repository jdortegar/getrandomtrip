// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { sendMail } from "../sendMail";

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { id: "provider-id" }, error: null });
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.stubEnv("RESEND_API_KEY", "test-provider-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sendMail headers", () => {
  it("forwards custom headers to the provider", async () => {
    const headers = {
      "List-Unsubscribe":
        "<https://example.invalid/api/email/unsubscribe?token=t>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };

    await sendMail({
      to: "ana@example.invalid",
      subject: "Hello",
      content: { text: "Hello" },
      headers,
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ headers }),
      undefined,
    );
  });

  it("sends no headers field when none are given", async () => {
    await sendMail({
      to: "ana@example.invalid",
      subject: "Hello",
      content: { text: "Hello" },
    });

    expect(send.mock.calls[0][0].headers).toBeUndefined();
  });
});
