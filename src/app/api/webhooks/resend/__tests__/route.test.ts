// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email-campaigns/resendWebhook", () => ({
  verifyResendWebhook: vi.fn(),
  parseResendEvent: vi.fn(),
  handleResendEvent: vi.fn(),
}));

import {
  handleResendEvent,
  parseResendEvent,
  verifyResendWebhook,
} from "@/lib/email-campaigns/resendWebhook";
import { POST } from "../route";

const ENDPOINT = "http://localhost/api/webhooks/resend";
const mockedVerify = vi.mocked(verifyResendWebhook);
const mockedParse = vi.mocked(parseResendEvent);
const mockedHandle = vi.mocked(handleResendEvent);

const EVENT = {
  type: "OPENED" as const,
  emailId: "re_1",
  occurredAt: new Date("2026-10-17T10:00:00.000Z"),
  metadata: null,
};

function request(body = '{"type":"email.opened"}') {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: {
      "svix-id": "msg_1",
      "svix-timestamp": "1760695200",
      "svix-signature": "v1,abc",
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_WEBHOOK_SECRET", "whsec_dGVzdA==");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mockedVerify.mockReturnValue({ ok: true, payload: { type: "email.opened" } });
  mockedParse.mockReturnValue(EVENT);
  mockedHandle.mockResolvedValue("recorded");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/webhooks/resend", () => {
  it("verifies the raw body with the svix headers and records the event", async () => {
    const res = await POST(request('{"type":"email.opened"}'));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(mockedVerify).toHaveBeenCalledWith(
      '{"type":"email.opened"}',
      { id: "msg_1", timestamp: "1760695200", signature: "v1,abc" },
      "whsec_dGVzdA==",
    );
    expect(mockedHandle).toHaveBeenCalledWith(EVENT, "msg_1");
  });

  it("returns 500 when the secret is not configured", async () => {
    vi.stubEnv("RESEND_WEBHOOK_SECRET", "");
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(console.error).toHaveBeenCalled();
    expect(mockedVerify).not.toHaveBeenCalled();
  });

  it("returns 400 on an invalid signature", async () => {
    mockedVerify.mockReturnValue({ ok: false, reason: "invalid_signature" });
    const res = await POST(request());
    expect(res.status).toBe(400);
    expect(mockedHandle).not.toHaveBeenCalled();
  });

  it("returns 400 on a non-JSON body", async () => {
    mockedVerify.mockReturnValue({ ok: false, reason: "invalid_json" });
    const res = await POST(request("nope"));
    expect(res.status).toBe(400);
    expect(mockedHandle).not.toHaveBeenCalled();
  });

  it("acknowledges untracked event types without touching the database", async () => {
    mockedParse.mockReturnValue(null);
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(mockedHandle).not.toHaveBeenCalled();
  });

  it.each(["duplicate", "unknown_email"] as const)(
    "acknowledges a %s outcome with 200",
    async (outcome) => {
      mockedHandle.mockResolvedValue(outcome);
      const res = await POST(request());
      expect(res.status).toBe(200);
    },
  );

  it("returns 500 on unexpected database errors so Resend retries", async () => {
    mockedHandle.mockRejectedValue(new Error("db down"));
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(console.error).toHaveBeenCalled();
  });
});
