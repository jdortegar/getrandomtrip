// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send, batchSend } = vi.hoisted(() => ({
  send: vi.fn(),
  batchSend: vi.fn(),
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
    batch = { send: batchSend };
  },
}));

import { sendMail, sendMailBatch } from "../sendMail";

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { id: "provider-id" }, error: null });
  batchSend.mockReset();
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

function message(n: number) {
  return {
    to: `user${n}@example.invalid`,
    subject: `Hello ${n}`,
    html: `<p>${n}</p>`,
    text: `${n}`,
    headers: { "List-Unsubscribe": `<https://example.invalid/u${n}>` },
    tags: [{ name: "send_id", value: `s${n}` }],
  };
}

describe("sendMailBatch", () => {
  it("sends every message in one batch call and maps ids in order", async () => {
    vi.stubEnv("EMAIL_FROM", "Randomtrip <hola@example.invalid>");
    batchSend.mockResolvedValue({
      data: { data: [{ id: "m1" }, { id: "m2" }] },
      error: null,
    });

    const results = await sendMailBatch([message(1), message(2)], {
      idempotencyKey: "campaign-c1-abc",
    });

    expect(results).toEqual([
      { ok: true, id: "m1" },
      { ok: true, id: "m2" },
    ]);
    expect(batchSend).toHaveBeenCalledTimes(1);
    const [payload, options] = batchSend.mock.calls[0];
    expect(options).toEqual({ idempotencyKey: "campaign-c1-abc" });
    expect(payload[0]).toEqual({
      from: "Randomtrip <hola@example.invalid>",
      to: "user1@example.invalid",
      subject: "Hello 1",
      html: "<p>1</p>",
      text: "1",
      headers: { "List-Unsubscribe": "<https://example.invalid/u1>" },
      tags: [{ name: "send_id", value: "s1" }],
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("reports the provider error for every message", async () => {
    batchSend.mockResolvedValue({
      data: null,
      error: { message: "rate limited", statusCode: 429, name: "rate_limit_exceeded" },
    });

    const results = await sendMailBatch([message(1), message(2)]);

    expect(results).toEqual([
      { ok: false, error: "rate limited" },
      { ok: false, error: "rate limited" },
    ]);
  });

  it("marks a message without a returned id as failed", async () => {
    batchSend.mockResolvedValue({ data: { data: [{ id: "m1" }] }, error: null });

    const results = await sendMailBatch([message(1), message(2)]);

    expect(results[1]).toEqual({ ok: false, error: expect.any(String) });
  });

  it("refuses more than 100 messages per call", async () => {
    const messages = Array.from({ length: 101 }, (_, i) => message(i));

    await expect(sendMailBatch(messages)).rejects.toThrow();
    expect(batchSend).not.toHaveBeenCalled();
  });
});

describe("delivery gating shared by sendMail and sendMailBatch", () => {
  it("prefixes subjects with [TEST] outside production", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    batchSend.mockResolvedValue({ data: { data: [{ id: "m1" }] }, error: null });

    await sendMail({ to: "a@example.invalid", subject: "Hi", content: { text: "Hi" } });
    await sendMailBatch([message(1)]);

    expect(send.mock.calls[0][0].subject).toBe("[TEST] Hi");
    expect(batchSend.mock.calls[0][0][0].subject).toBe("[TEST] Hello 1");
  });

  it("keeps subjects unchanged in production", async () => {
    batchSend.mockResolvedValue({ data: { data: [{ id: "m1" }] }, error: null });

    await sendMailBatch([message(1)]);

    expect(batchSend.mock.calls[0][0][0].subject).toBe("Hello 1");
  });

  it("throws the same disabled-delivery error when the deployment is unknown", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "");

    await expect(
      sendMail({ to: "a@example.invalid", subject: "Hi", content: { text: "Hi" } }),
    ).rejects.toThrow("Email delivery is disabled for this deployment");
    await expect(sendMailBatch([message(1)])).rejects.toThrow(
      "Email delivery is disabled for this deployment",
    );
    expect(send).not.toHaveBeenCalled();
    expect(batchSend).not.toHaveBeenCalled();
  });
});
