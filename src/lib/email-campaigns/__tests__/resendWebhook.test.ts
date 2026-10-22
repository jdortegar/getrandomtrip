// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => {
  const client = {
    campaignSend: { findUnique: vi.fn(), updateMany: vi.fn() },
    contact: { updateMany: vi.fn() },
    emailEvent: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  return { prisma: client };
});

import { prisma } from "@/lib/prisma";
import {
  handleResendEvent,
  parseResendEvent,
  verifyResendWebhook,
} from "../resendWebhook";

const SECRET_BYTES = Buffer.from("resend-webhook-test-secret-bytes");
const SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;

/** Svix signing scheme: base64 HMAC-SHA256 of `${id}.${timestamp}.${body}`. */
function sign(id: string, timestamp: string, body: string, key = SECRET_BYTES) {
  return createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
}

function signedHeaders(body: string, timestamp = nowSeconds()) {
  const id = "msg_1";
  return { id, timestamp, signature: `v1,${sign(id, timestamp, body)}` };
}

function nowSeconds() {
  return String(Math.floor(Date.now() / 1000));
}

const BODY = JSON.stringify({
  type: "email.delivered",
  created_at: "2026-10-17T10:00:00.000Z",
  data: { email_id: "re_1" },
});

describe("verifyResendWebhook", () => {
  it("accepts a valid signature and returns the parsed payload", () => {
    const result = verifyResendWebhook(BODY, signedHeaders(BODY), SECRET);
    expect(result).toEqual({ ok: true, payload: JSON.parse(BODY) });
  });

  it("rejects a tampered body", () => {
    const headers = signedHeaders(BODY);
    const result = verifyResendWebhook(`${BODY} `, headers, SECRET);
    expect(result).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("rejects a signature made with another secret", () => {
    const timestamp = nowSeconds();
    const signature = `v1,${sign("msg_1", timestamp, BODY, Buffer.from("other-secret"))}`;
    const result = verifyResendWebhook(
      BODY,
      { id: "msg_1", timestamp, signature },
      SECRET,
    );
    expect(result).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("rejects a timestamp older than five minutes", () => {
    const stale = String(Math.floor(Date.now() / 1000) - 6 * 60);
    const result = verifyResendWebhook(BODY, signedHeaders(BODY, stale), SECRET);
    expect(result).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("accepts when any of several signatures matches (secret rotation)", () => {
    const { id, timestamp, signature } = signedHeaders(BODY);
    const result = verifyResendWebhook(
      BODY,
      { id, timestamp, signature: `v1,${"A".repeat(44)} ${signature}` },
      SECRET,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects missing headers", () => {
    const result = verifyResendWebhook(
      BODY,
      { id: null, timestamp: null, signature: null },
      SECRET,
    );
    expect(result).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("reports a correctly signed but non-JSON body as invalid_json", () => {
    const body = "not json";
    const result = verifyResendWebhook(body, signedHeaders(body), SECRET);
    expect(result).toEqual({ ok: false, reason: "invalid_json" });
  });
});

describe("parseResendEvent", () => {
  const base = { created_at: "2026-10-17T10:00:00.000Z" };

  it("maps the five tracked types", () => {
    for (const [type, expected] of [
      ["email.delivered", "DELIVERED"],
      ["email.bounced", "BOUNCED"],
      ["email.complained", "COMPLAINED"],
      ["email.opened", "OPENED"],
      ["email.clicked", "CLICKED"],
    ] as const) {
      expect(
        parseResendEvent({ ...base, type, data: { email_id: "re_1" } })?.type,
      ).toBe(expected);
    }
  });

  it("uses the event created_at as occurredAt", () => {
    const event = parseResendEvent({
      ...base,
      type: "email.opened",
      data: { email_id: "re_1" },
    });
    expect(event?.occurredAt.toISOString()).toBe("2026-10-17T10:00:00.000Z");
    expect(event?.emailId).toBe("re_1");
    expect(event?.metadata).toBeNull();
  });

  it("keeps only the link for clicks (no IP or user agent)", () => {
    const event = parseResendEvent({
      ...base,
      type: "email.clicked",
      data: {
        email_id: "re_1",
        click: {
          link: "https://example.com/x",
          ipAddress: "1.2.3.4",
          userAgent: "UA",
          timestamp: base.created_at,
        },
      },
    });
    expect(event?.metadata).toEqual({ link: "https://example.com/x" });
  });

  it("keeps only bounce type and subtype", () => {
    const event = parseResendEvent({
      ...base,
      type: "email.bounced",
      data: {
        email_id: "re_1",
        bounce: { type: "Permanent", subType: "General", message: "x" },
      },
    });
    expect(event?.metadata).toEqual({
      bounceType: "Permanent",
      bounceSubType: "General",
    });
  });

  it("ignores untracked types and malformed payloads", () => {
    expect(
      parseResendEvent({ ...base, type: "email.sent", data: { email_id: "re_1" } }),
    ).toBeNull();
    expect(parseResendEvent({ ...base, type: "email.opened", data: {} })).toBeNull();
    expect(parseResendEvent(null)).toBeNull();
    expect(parseResendEvent("x")).toBeNull();
  });

  it("reads send_id from object-form tags", () => {
    const event = parseResendEvent({
      ...base,
      type: "email.bounced",
      data: { email_id: "re_1", tags: { campaign_id: "c1", send_id: "s1" } },
    });
    expect(event?.sendId).toBe("s1");
  });

  it("reads send_id from array-form tags", () => {
    const event = parseResendEvent({
      ...base,
      type: "email.delivered",
      data: {
        email_id: "re_1",
        tags: [
          { name: "campaign_id", value: "c1" },
          { name: "send_id", value: "s2" },
        ],
      },
    });
    expect(event?.sendId).toBe("s2");
  });

  it("leaves sendId undefined without a usable send_id tag", () => {
    for (const tags of [undefined, {}, { send_id: "" }, [{ name: "x", value: "y" }], "s1"]) {
      const event = parseResendEvent({
        ...base,
        type: "email.opened",
        data: { email_id: "re_1", tags },
      });
      expect(event?.sendId).toBeUndefined();
    }
  });

  it("falls back to now when created_at is invalid", () => {
    const before = Date.now();
    const event = parseResendEvent({
      type: "email.opened",
      created_at: "nope",
      data: { email_id: "re_1" },
    });
    expect(event!.occurredAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe("handleResendEvent", () => {
  const mocked = prisma as unknown as {
    campaignSend: Record<"findUnique" | "updateMany", ReturnType<typeof vi.fn>>;
    contact: { updateMany: ReturnType<typeof vi.fn> };
    emailEvent: { create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
  const occurredAt = new Date("2026-10-17T10:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    mocked.campaignSend.findUnique.mockResolvedValue({
      id: "s1",
      contactId: "c1",
    });
    mocked.campaignSend.updateMany.mockResolvedValue({ count: 1 });
    mocked.contact.updateMany.mockResolvedValue({ count: 1 });
    mocked.emailEvent.create.mockResolvedValue({ id: "e1" });
    mocked.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
  });

  it("ignores an email that is not a campaign send", async () => {
    mocked.campaignSend.findUnique.mockResolvedValue(null);
    const outcome = await handleResendEvent(
      { type: "DELIVERED", emailId: "re_tx", occurredAt, metadata: null },
      "msg_1",
    );
    expect(outcome).toBe("unknown_email");
    expect(mocked.campaignSend.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { resendMessageId: "re_tx" } }),
    );
    expect(mocked.emailEvent.create).not.toHaveBeenCalled();
  });

  it("records the event with the svix id and moves SENT to DELIVERED", async () => {
    const outcome = await handleResendEvent(
      { type: "DELIVERED", emailId: "re_1", occurredAt, metadata: null },
      "msg_1",
    );
    expect(outcome).toBe("recorded");
    expect(mocked.emailEvent.create).toHaveBeenCalledWith({
      data: {
        sendId: "s1",
        type: "DELIVERED",
        providerEventId: "msg_1",
        occurredAt,
        metadata: undefined,
      },
    });
    expect(mocked.campaignSend.updateMany).toHaveBeenCalledWith({
      where: { id: "s1", status: { in: ["QUEUED", "SENT"] } },
      data: { status: "DELIVERED" },
    });
    expect(mocked.contact.updateMany).not.toHaveBeenCalled();
  });

  describe("early events (before sending persists resendMessageId)", () => {
    it("falls back to the send_id tag and backfills resendMessageId", async () => {
      mocked.campaignSend.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "s9", contactId: "c9", resendMessageId: null });

      const outcome = await handleResendEvent(
        { type: "DELIVERED", emailId: "re_9", sendId: "s9", occurredAt, metadata: null },
        "msg_1",
      );

      expect(outcome).toBe("recorded");
      expect(mocked.campaignSend.findUnique).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ where: { id: "s9" } }),
      );
      expect(mocked.campaignSend.updateMany).toHaveBeenCalledWith({
        where: { id: "s9", resendMessageId: null },
        data: { resendMessageId: "re_9" },
      });
      expect(mocked.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sendId: "s9" }),
      });
      expect(mocked.campaignSend.updateMany).toHaveBeenCalledWith({
        where: { id: "s9", status: { in: ["QUEUED", "SENT"] } },
        data: { status: "DELIVERED" },
      });
    });

    it("accepts a tagged send that already carries the same message id", async () => {
      mocked.campaignSend.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "s9", contactId: "c9", resendMessageId: "re_9" });

      const outcome = await handleResendEvent(
        { type: "OPENED", emailId: "re_9", sendId: "s9", occurredAt, metadata: null },
        "msg_1",
      );

      expect(outcome).toBe("recorded");
      expect(mocked.campaignSend.updateMany).not.toHaveBeenCalled();
    });

    it("ignores a send_id tag pointing to a send with another message id", async () => {
      mocked.campaignSend.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "s9", contactId: "c9", resendMessageId: "re_other" });

      const outcome = await handleResendEvent(
        { type: "BOUNCED", emailId: "re_9", sendId: "s9", occurredAt, metadata: null },
        "msg_1",
      );

      expect(outcome).toBe("unknown_email");
      expect(mocked.emailEvent.create).not.toHaveBeenCalled();
      expect(mocked.campaignSend.updateMany).not.toHaveBeenCalled();
    });

    it("returns unknown_email when the tagged send does not exist", async () => {
      mocked.campaignSend.findUnique.mockResolvedValue(null);

      const outcome = await handleResendEvent(
        { type: "DELIVERED", emailId: "re_9", sendId: "s404", occurredAt, metadata: null },
        "msg_1",
      );

      expect(outcome).toBe("unknown_email");
      expect(mocked.emailEvent.create).not.toHaveBeenCalled();
    });

    it("does not look up by id when no send_id tag is present", async () => {
      mocked.campaignSend.findUnique.mockResolvedValue(null);

      await handleResendEvent(
        { type: "DELIVERED", emailId: "re_9", occurredAt, metadata: null },
        "msg_1",
      );

      expect(mocked.campaignSend.findUnique).toHaveBeenCalledTimes(1);
    });

    it("does not backfill when found by message id", async () => {
      await handleResendEvent(
        { type: "OPENED", emailId: "re_1", sendId: "s1", occurredAt, metadata: null },
        "msg_1",
      );

      expect(mocked.campaignSend.findUnique).toHaveBeenCalledTimes(1);
      expect(mocked.campaignSend.updateMany).not.toHaveBeenCalled();
    });
  });

  it("marks the send BOUNCED but keeps the contact on a soft bounce", async () => {
    await handleResendEvent(
      {
        type: "BOUNCED",
        emailId: "re_1",
        occurredAt,
        metadata: { bounceType: "Transient", bounceSubType: "MailboxFull" },
      },
      "msg_1",
    );
    expect(mocked.emailEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "BOUNCED",
        metadata: { bounceType: "Transient", bounceSubType: "MailboxFull" },
      }),
    });
    expect(mocked.campaignSend.updateMany).toHaveBeenCalledWith({
      where: { id: "s1", status: { in: ["QUEUED", "SENT", "DELIVERED"] } },
      data: { status: "BOUNCED" },
    });
    expect(mocked.contact.updateMany).not.toHaveBeenCalled();
  });

  it("marks a SUBSCRIBED contact BOUNCED on a permanent bounce", async () => {
    await handleResendEvent(
      {
        type: "BOUNCED",
        emailId: "re_1",
        occurredAt,
        metadata: { bounceType: "Permanent", bounceSubType: "General" },
      },
      "msg_1",
    );
    expect(mocked.campaignSend.updateMany).toHaveBeenCalled();
    expect(mocked.contact.updateMany).toHaveBeenCalledWith({
      where: { id: "c1", status: "SUBSCRIBED" },
      data: { status: "BOUNCED" },
    });
  });

  it("unsubscribes a SUBSCRIBED contact on a complaint", async () => {
    await handleResendEvent(
      { type: "COMPLAINED", emailId: "re_1", occurredAt, metadata: null },
      "msg_1",
    );
    expect(mocked.contact.updateMany).toHaveBeenCalledWith({
      where: { id: "c1", status: "SUBSCRIBED" },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: expect.any(Date) },
    });
    expect(mocked.campaignSend.updateMany).not.toHaveBeenCalled();
  });

  it("leaves an already unsubscribed contact unchanged on a complaint", async () => {
    // The conditional update matches nothing for a non-SUBSCRIBED contact.
    mocked.contact.updateMany.mockResolvedValue({ count: 0 });
    const outcome = await handleResendEvent(
      { type: "COMPLAINED", emailId: "re_1", occurredAt, metadata: null },
      "msg_1",
    );
    expect(outcome).toBe("recorded");
    expect(mocked.contact.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "c1", status: "SUBSCRIBED" } }),
    );
  });

  it.each(["OPENED", "CLICKED"] as const)(
    "records %s without side effects",
    async (type) => {
      await handleResendEvent(
        {
          type,
          emailId: "re_1",
          occurredAt,
          metadata: type === "CLICKED" ? { link: "https://example.com" } : null,
        },
        "msg_1",
      );
      expect(mocked.emailEvent.create).toHaveBeenCalledTimes(1);
      expect(mocked.campaignSend.updateMany).not.toHaveBeenCalled();
      expect(mocked.contact.updateMany).not.toHaveBeenCalled();
    },
  );

  it("treats a duplicate svix id as already processed", async () => {
    mocked.emailEvent.create.mockRejectedValue(
      Object.assign(new Error("unique"), { code: "P2002" }),
    );
    const outcome = await handleResendEvent(
      { type: "COMPLAINED", emailId: "re_1", occurredAt, metadata: null },
      "msg_1",
    );
    expect(outcome).toBe("duplicate");
    expect(mocked.contact.updateMany).not.toHaveBeenCalled();
  });

  it("propagates unexpected database errors so Resend retries", async () => {
    mocked.emailEvent.create.mockRejectedValue(new Error("db down"));
    await expect(
      handleResendEvent(
        { type: "OPENED", emailId: "re_1", occurredAt, metadata: null },
        "msg_1",
      ),
    ).rejects.toThrow("db down");
  });
});
