// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    campaign: { findUnique: vi.fn(), updateMany: vi.fn() },
    campaignSend: {
      count: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      updateMany: vi.fn(),
    },
    contact: { count: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock("@/lib/helpers/sendMail", () => ({
  MAX_BATCH_SIZE: 100,
  sendMail: vi.fn(),
  sendMailBatch: vi.fn(),
}));
vi.mock("../promo", async (importOriginal) => {
  const original = await importOriginal<typeof import("../promo")>();
  return { ...original, lookupPromotionCode: vi.fn() };
});
vi.mock("../render", () => ({
  renderCampaignEmail: vi.fn(
    async (
      campaign: { subject: string },
      options: { unsubscribeUrl: string },
    ) => ({
      subject: campaign.subject,
      html: `<a href="${options.unsubscribeUrl}">unsubscribe</a>`,
      text: options.unsubscribeUrl,
    }),
  ),
}));

import { prisma } from "@/lib/prisma";
import { sendMailBatch } from "@/lib/helpers/sendMail";
import type { BatchMailMessage } from "@/lib/helpers/sendMail";
import { lookupPromotionCode } from "../promo";
import { renderCampaignEmail } from "../render";
import { verifyUnsubscribeToken } from "../unsubscribeToken";
import { getCampaignAudienceCount, sendCampaign } from "../sending";
import type { PromotionCodeSummary } from "@/types/emailCampaign";

type SendRow = {
  id: string;
  contactId: string;
  email: string;
  status: string;
  resendMessageId?: string | null;
  sentAt?: Date | null;
  error?: string | null;
};
type SendWhere = {
  id?: string;
  status?: { in?: string[] };
  resendMessageId?: null;
  sentAt?: null;
};
type ContactRow = { id: string; email: string; status: string };
type Where = Record<string, unknown> & {
  status?: string;
  updatedAt?: { lt: Date };
  OR?: Where[];
};

const MINUTE = 60_000;

const state: {
  campaign: Record<string, unknown> & { status: string; updatedAt: Date };
  contacts: ContactRow[];
  sends: SendRow[];
} = { campaign: { status: "DRAFT", updatedAt: new Date() }, contacts: [], sends: [] };

function campaignRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: "c1",
    name: "Founders",
    subject: "Tu escapada",
    preheader: null,
    title: "Llegó el momento",
    bodyMarkdown: "Hola",
    ctaLabel: null,
    ctaUrl: null,
    locale: "es",
    segmentSources: ["WAITLIST"],
    stripePromotionCodeId: null,
    promoCode: null,
    status: "DRAFT",
    sentAt: null,
    createdById: "a1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function contacts(count: number, status = "SUBSCRIBED"): ContactRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `k${String(i).padStart(3, "0")}`,
    email: `user${i}@example.invalid`,
    status,
  }));
}

function sendRow(contactId: string, status: string): SendRow {
  return { id: `s-${contactId}`, contactId, email: `${contactId}@example.invalid`, status };
}

function matchesCampaign(where: Where): boolean {
  const one = (w: Where) =>
    (w.status === undefined || w.status === state.campaign.status) &&
    (!w.updatedAt || state.campaign.updatedAt < w.updatedAt.lt);
  return where.OR ? where.OR.some(one) : one(where);
}

function statusIn(where: { status?: { in?: string[] } }) {
  return (row: SendRow) => !where.status?.in || where.status.in.includes(row.status);
}

/** Batch mock that accepts every message, ids `m-<send id>`. */
function acceptAll() {
  vi.mocked(sendMailBatch).mockImplementation(async (messages: BatchMailMessage[]) =>
    messages.map((message) => ({
      ok: true as const,
      id: `m-${message.tags?.find((tag) => tag.name === "send_id")?.value}`,
    })),
  );
}

function batchMessages(call = 0): BatchMailMessage[] {
  return vi.mocked(sendMailBatch).mock.calls[call][0];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "test-unsubscribe-secret");
  state.campaign = campaignRow();
  state.contacts = [];
  state.sends = [];

  vi.mocked(prisma.campaign.findUnique).mockImplementation((async () => ({
    ...state.campaign,
  })) as never);
  vi.mocked(prisma.campaign.updateMany).mockImplementation((async ({
    where,
    data,
  }: {
    where: Where;
    data: Record<string, unknown>;
  }) => {
    if (!matchesCampaign(where)) return { count: 0 };
    Object.assign(state.campaign, data, {
      updatedAt: (data.updatedAt as Date | undefined) ?? new Date(),
    });
    return { count: 1 };
  }) as never);

  vi.mocked(prisma.contact.findMany).mockImplementation((async () =>
    state.contacts
      .filter((contact) => contact.status === "SUBSCRIBED")
      .map(({ id, email }) => ({ id, email }))) as never);
  vi.mocked(prisma.contact.count).mockImplementation((async () =>
    state.contacts.filter((contact) => contact.status === "SUBSCRIBED")
      .length) as never);

  vi.mocked(prisma.campaignSend.count).mockImplementation((async () =>
    state.sends.length) as never);
  vi.mocked(prisma.campaignSend.createMany).mockImplementation((async ({
    data,
  }: {
    data: { contactId: string; email: string; status: string }[];
  }) => {
    const fresh = data.filter(
      (row) => !state.sends.some((send) => send.contactId === row.contactId),
    );
    state.sends.push(...fresh.map((row) => ({ id: `s-${row.contactId}`, ...row })));
    return { count: fresh.length };
  }) as never);
  vi.mocked(prisma.campaignSend.deleteMany).mockImplementation((async ({
    where,
  }: {
    where: { status?: { in?: string[] } };
  }) => {
    const before = state.sends.length;
    state.sends = state.sends.filter((send) => {
      const contact = state.contacts.find((c) => c.id === send.contactId);
      return !(statusIn(where)(send) && contact?.status !== "SUBSCRIBED");
    });
    return { count: before - state.sends.length };
  }) as never);
  vi.mocked(prisma.campaignSend.findMany).mockImplementation((async ({
    where,
  }: {
    where: { status?: { in?: string[] } };
  }) =>
    state.sends
      .filter(statusIn(where))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, contactId, email }) => ({ id, contactId, email }))) as never);
  vi.mocked(prisma.campaignSend.updateMany).mockImplementation((async ({
    where,
    data,
  }: {
    where: SendWhere;
    data: Record<string, unknown>;
  }) => {
    const matches = state.sends.filter(
      (row) =>
        (where.id === undefined || row.id === where.id) &&
        statusIn(where)(row) &&
        (!("resendMessageId" in where) || row.resendMessageId == null) &&
        (!("sentAt" in where) || row.sentAt == null),
    );
    for (const row of matches) Object.assign(row, data);
    return { count: matches.length };
  }) as never);
  vi.mocked(prisma.campaignSend.groupBy).mockImplementation((async () => {
    const counts = new Map<string, number>();
    for (const send of state.sends) {
      counts.set(send.status, (counts.get(send.status) ?? 0) + 1);
    }
    return [...counts].map(([status, count]) => ({ status, _count: { _all: count } }));
  }) as never);
  vi.mocked(prisma.$transaction).mockImplementation((async (
    operations: Promise<unknown>[],
  ) => Promise.all(operations)) as never);

  acceptAll();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getCampaignAudienceCount", () => {
  it("counts subscribed contacts in the campaign's sources and locale", async () => {
    state.campaign = campaignRow({ segmentSources: ["WAITLIST", "FRIENDS_FAMILY"], locale: "en" });
    state.contacts = [...contacts(3), ...contacts(2, "UNSUBSCRIBED")];

    await expect(getCampaignAudienceCount("c1")).resolves.toBe(3);
    expect(prisma.contact.count).toHaveBeenCalledWith({
      where: {
        source: { in: ["WAITLIST", "FRIENDS_FAMILY"] },
        locale: "en",
        status: "SUBSCRIBED",
      },
    });
  });

  it("throws not_found for an unknown campaign", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(null);

    await expect(getCampaignAudienceCount("nope")).rejects.toMatchObject({
      code: "not_found",
    });
  });
});

describe("sendCampaign claim", () => {
  it("throws not_found for an unknown campaign", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(null);

    await expect(sendCampaign("nope")).rejects.toMatchObject({ code: "not_found" });
  });

  it("lets only one of two concurrent sends claim the campaign", async () => {
    state.contacts = contacts(2);

    const results = await Promise.allSettled([sendCampaign("c1"), sendCampaign("c1")]);

    expect(results.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    const rejected = results.find((r) => r.status === "rejected");
    expect((rejected as PromiseRejectedResult).reason).toMatchObject({
      code: "campaign_not_sendable",
    });
    expect(sendMailBatch).toHaveBeenCalledTimes(1);
  });

  it("refuses a campaign that is already SENT", async () => {
    state.campaign = campaignRow({ status: "SENT" });

    await expect(sendCampaign("c1")).rejects.toMatchObject({
      code: "campaign_not_sendable",
    });
    expect(sendMailBatch).not.toHaveBeenCalled();
  });

  it("refuses a campaign SENDING for less than 10 minutes", async () => {
    state.campaign = campaignRow({
      status: "SENDING",
      updatedAt: new Date(Date.now() - 5 * MINUTE),
    });
    state.contacts = contacts(1);
    state.sends = [sendRow("k000", "QUEUED")];

    await expect(sendCampaign("c1")).rejects.toMatchObject({
      code: "campaign_not_sendable",
    });
    expect(sendMailBatch).not.toHaveBeenCalled();
  });

  it("reclaims a stale SENDING campaign and resumes its queued rows", async () => {
    state.campaign = campaignRow({
      status: "SENDING",
      updatedAt: new Date(Date.now() - 11 * MINUTE),
    });
    state.contacts = contacts(3);
    state.sends = [sendRow("k000", "SENT"), sendRow("k001", "QUEUED")];

    const summary = await sendCampaign("c1");

    expect(prisma.campaignSend.createMany).not.toHaveBeenCalled();
    expect(batchMessages().map((m) => m.to)).toEqual(["k001@example.invalid"]);
    expect(summary).toEqual({ status: "SENT", sent: 2, failed: 0, total: 2 });
  });

  it("returns an empty-audience draft to DRAFT with campaign_empty_audience", async () => {
    state.contacts = contacts(2, "UNSUBSCRIBED");

    await expect(sendCampaign("c1")).rejects.toMatchObject({
      code: "campaign_empty_audience",
    });
    expect(state.campaign.status).toBe("DRAFT");
    expect(sendMailBatch).not.toHaveBeenCalled();
  });
});

describe("sendCampaign first send", () => {
  it("creates one QUEUED row per audience contact, once, and sends them all", async () => {
    state.contacts = [...contacts(3), { id: "kx", email: "x@example.invalid", status: "BOUNCED" }];

    const summary = await sendCampaign("c1");

    expect(prisma.campaignSend.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.campaignSend.createMany).toHaveBeenCalledWith({
      data: contacts(3).map((contact) => ({
        campaignId: "c1",
        contactId: contact.id,
        email: contact.email,
        status: "QUEUED",
      })),
      skipDuplicates: true,
    });
    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { source: { in: ["WAITLIST"] }, locale: "es", status: "SUBSCRIBED" },
      }),
    );
    expect(summary).toEqual({ status: "SENT", sent: 3, failed: 0, total: 3 });
  });

  it("marks rows SENT with their provider id and the campaign SENT with sentAt", async () => {
    state.contacts = contacts(2);

    await sendCampaign("c1");

    expect(state.sends.map((s) => s.status)).toEqual(["SENT", "SENT"]);
    expect(prisma.campaignSend.updateMany).toHaveBeenCalledWith({
      where: { id: "s-k000", status: { in: ["QUEUED", "FAILED"] } },
      data: {
        status: "SENT",
        resendMessageId: "m-s-k000",
        sentAt: expect.any(Date),
        error: null,
      },
    });
    expect(state.campaign.status).toBe("SENT");
    expect(state.campaign.sentAt).toBeInstanceOf(Date);
  });

  it("sends in chunks of at most 100 with distinct idempotency keys", async () => {
    state.contacts = contacts(250);

    const summary = await sendCampaign("c1");

    const calls = vi.mocked(sendMailBatch).mock.calls;
    expect(calls.map(([messages]) => messages.length)).toEqual([100, 100, 50]);
    const keys = calls.map(([, options]) => options?.idempotencyKey);
    expect(new Set(keys).size).toBe(3);
    for (const key of keys) {
      expect(key).toMatch(/^campaign-c1-/);
      expect(key!.length).toBeLessThanOrEqual(256);
    }
    expect(summary).toEqual({ status: "SENT", sent: 250, failed: 0, total: 250 });
  });

  it("gives each recipient their own unsubscribe link, headers and tags", async () => {
    state.contacts = contacts(2);

    await sendCampaign("c1");

    const messages = batchMessages();
    messages.forEach((message, i) => {
      const contactId = `k00${i}`;
      const headerToken = decodeURIComponent(
        /token=([^>]+)>/.exec(message.headers!["List-Unsubscribe"])![1],
      );
      expect(verifyUnsubscribeToken(headerToken)).toBe(contactId);
      expect(message.headers!["List-Unsubscribe-Post"]).toBe(
        "List-Unsubscribe=One-Click",
      );
      const pageToken = decodeURIComponent(/token=(\S+)/.exec(message.text!)![1]);
      // `es` is the default locale and has no path prefix.
      expect(message.text).toContain("/unsubscribe?token=");
      expect(verifyUnsubscribeToken(pageToken)).toBe(contactId);
      expect(message.tags).toEqual([
        { name: "campaign_id", value: "c1" },
        { name: "send_id", value: `s-${contactId}` },
      ]);
    });
  });

  it("sanitizes tag values to Resend's allowed charset", async () => {
    state.campaign = campaignRow({ id: "c.1/x" });
    state.contacts = contacts(1);

    await sendCampaign("c.1/x");

    expect(batchMessages()[0].tags![0]).toEqual({ name: "campaign_id", value: "c_1_x" });
  });
});

describe("sendCampaign promo", () => {
  const summary: PromotionCodeSummary = {
    id: "promo_1",
    code: "FUNDADOR30",
    active: true,
    percentOff: 30,
    amountOffCents: null,
    currency: null,
    expiresAt: null,
    maxRedemptions: null,
    redemptionsUsed: 0,
    firstTimeOnly: false,
    minimumAmountCents: null,
  };

  it("loads the promo once for every recipient", async () => {
    state.campaign = campaignRow({ promoCode: "FUNDADOR30", stripePromotionCodeId: "promo_1" });
    state.contacts = contacts(3);
    vi.mocked(lookupPromotionCode).mockResolvedValue(summary);

    await sendCampaign("c1");

    expect(lookupPromotionCode).toHaveBeenCalledTimes(1);
    expect(renderCampaignEmail).toHaveBeenCalledTimes(3);
    for (const [, options] of vi.mocked(renderCampaignEmail).mock.calls) {
      expect(options.promo).toEqual({
        code: "FUNDADOR30",
        discountLabel: "30% de descuento",
        expiresAt: null,
      });
    }
  });

  it.each([
    ["missing", null],
    ["inactive", { ...summary, active: false }],
    ["a different code id", { ...summary, id: "promo_other" }],
  ])("refuses to send when the promo is %s", async (_label, lookup) => {
    state.campaign = campaignRow({ promoCode: "FUNDADOR30", stripePromotionCodeId: "promo_1" });
    state.contacts = contacts(1);
    vi.mocked(lookupPromotionCode).mockResolvedValue(lookup);

    await expect(sendCampaign("c1")).rejects.toMatchObject({ code: "invalid_promo_code" });
    expect(state.campaign.status).toBe("DRAFT");
    expect(sendMailBatch).not.toHaveBeenCalled();
  });
});

describe("sendCampaign failures and retry", () => {
  it("marks failed recipients FAILED and the campaign PARTIAL", async () => {
    state.contacts = contacts(2);
    vi.mocked(sendMailBatch).mockResolvedValue([
      { ok: true, id: "m1" },
      { ok: false, error: "invalid recipient" },
    ]);

    const summary = await sendCampaign("c1");

    expect(summary).toEqual({ status: "PARTIAL", sent: 1, failed: 1, total: 2 });
    expect(prisma.campaignSend.updateMany).toHaveBeenCalledWith({
      where: { id: "s-k001", status: { in: ["QUEUED", "FAILED"] } },
      data: { status: "FAILED", error: "invalid recipient" },
    });
    expect(state.campaign.status).toBe("PARTIAL");
    expect(state.campaign.sentAt).toBeNull();
  });

  it("marks the whole chunk FAILED when delivery throws", async () => {
    state.contacts = contacts(2);
    vi.mocked(sendMailBatch).mockRejectedValue(
      new Error("Email delivery is disabled for this deployment"),
    );

    const summary = await sendCampaign("c1");

    expect(summary).toEqual({ status: "PARTIAL", sent: 0, failed: 2, total: 2 });
    expect(state.sends.map((s) => s.status)).toEqual(["FAILED", "FAILED"]);
    expect(prisma.campaignSend.updateMany).toHaveBeenCalledWith({
      where: { id: "s-k000", status: { in: ["QUEUED", "FAILED"] } },
      data: { status: "FAILED", error: "Email delivery is disabled for this deployment" },
    });
  });

  it("truncates long provider errors", async () => {
    state.contacts = contacts(1);
    vi.mocked(sendMailBatch).mockResolvedValue([{ ok: false, error: "x".repeat(2000) }]);

    await sendCampaign("c1");

    expect(state.sends[0].error!.length).toBeLessThanOrEqual(500);
  });

  it("retries only QUEUED and FAILED rows and adds no new contacts", async () => {
    state.campaign = campaignRow({ status: "PARTIAL" });
    state.contacts = contacts(4);
    state.sends = [
      sendRow("k000", "SENT"),
      sendRow("k001", "FAILED"),
      sendRow("k002", "QUEUED"),
    ];

    const summary = await sendCampaign("c1");

    expect(prisma.campaignSend.createMany).not.toHaveBeenCalled();
    expect(batchMessages().map((m) => m.to)).toEqual([
      "k001@example.invalid",
      "k002@example.invalid",
    ]);
    expect(summary).toEqual({ status: "SENT", sent: 3, failed: 0, total: 3 });
  });

  it("deletes pending rows whose contact is no longer subscribed", async () => {
    state.campaign = campaignRow({ status: "PARTIAL" });
    state.contacts = [
      { id: "k000", email: "a@example.invalid", status: "SUBSCRIBED" },
      { id: "k001", email: "b@example.invalid", status: "UNSUBSCRIBED" },
      { id: "k002", email: "c@example.invalid", status: "SUBSCRIBED" },
    ];
    state.sends = [
      sendRow("k000", "SENT"),
      sendRow("k001", "FAILED"),
      sendRow("k002", "FAILED"),
    ];

    const summary = await sendCampaign("c1");

    expect(prisma.campaignSend.deleteMany).toHaveBeenCalledWith({
      where: {
        campaignId: "c1",
        status: { in: ["QUEUED", "FAILED"] },
        contact: { status: { not: "SUBSCRIBED" } },
      },
    });
    expect(batchMessages().map((m) => m.to)).toEqual(["k002@example.invalid"]);
    expect(summary).toEqual({ status: "SENT", sent: 2, failed: 0, total: 2 });
  });

  it("counts webhook-updated DELIVERED and BOUNCED rows as sent", async () => {
    state.campaign = campaignRow({ status: "PARTIAL" });
    state.contacts = contacts(3);
    state.sends = [
      sendRow("k000", "DELIVERED"),
      sendRow("k001", "BOUNCED"),
      sendRow("k002", "FAILED"),
    ];

    const summary = await sendCampaign("c1");

    expect(summary).toEqual({ status: "SENT", sent: 3, failed: 0, total: 3 });
  });

  describe("webhook events arriving before the batch result is written", () => {
    /** Accepts every message after a webhook has already moved each row. */
    function webhookWinsWith(status: string, backfilled: boolean) {
      vi.mocked(sendMailBatch).mockImplementation(async (messages: BatchMailMessage[]) => {
        for (const send of state.sends) {
          send.status = status;
          if (backfilled) send.resendMessageId = `m-${send.id}`;
        }
        return messages.map((message) => ({
          ok: true as const,
          id: `m-${message.tags?.find((tag) => tag.name === "send_id")?.value}`,
        }));
      });
    }

    it.each(["DELIVERED", "BOUNCED"])(
      "keeps a webhook-set %s status but records the provider id and sentAt",
      async (status) => {
        state.contacts = contacts(1);
        webhookWinsWith(status, false);

        const summary = await sendCampaign("c1");

        expect(state.sends[0]).toMatchObject({
          status,
          resendMessageId: "m-s-k000",
          sentAt: expect.any(Date),
        });
        expect(summary).toEqual({ status: "SENT", sent: 1, failed: 0, total: 1 });
      },
    );

    it("keeps an id the webhook already backfilled", async () => {
      state.contacts = contacts(1);
      webhookWinsWith("DELIVERED", true);

      await sendCampaign("c1");

      expect(state.sends[0]).toMatchObject({
        status: "DELIVERED",
        resendMessageId: "m-s-k000",
        sentAt: expect.any(Date),
      });
    });

    it("does not mark a webhook-moved row FAILED", async () => {
      state.contacts = contacts(2);
      vi.mocked(sendMailBatch).mockImplementation(async () => {
        state.sends[0].status = "BOUNCED";
        return [
          { ok: false, error: "late failure" },
          { ok: false, error: "invalid recipient" },
        ];
      });

      const summary = await sendCampaign("c1");

      expect(state.sends.map((s) => s.status)).toEqual(["BOUNCED", "FAILED"]);
      expect(state.sends[0].error).toBeUndefined();
      expect(summary).toEqual({ status: "PARTIAL", sent: 1, failed: 1, total: 2 });
    });
  });

  it("finalizes as PARTIAL and rethrows when processing crashes", async () => {
    state.contacts = contacts(1);
    vi.mocked(prisma.campaignSend.findMany).mockRejectedValueOnce(new Error("db down"));

    await expect(sendCampaign("c1")).rejects.toThrow("db down");
    expect(state.campaign.status).toBe("PARTIAL");
  });
});

describe("nonproduction recipient guard", () => {
  beforeEach(() => {
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  });

  it("limits the audience to EMAIL_TEST_RECIPIENTS outside production", async () => {
    vi.stubEnv("EMAIL_TEST_RECIPIENTS", " QA@Example.invalid , dev@example.invalid ");
    await getCampaignAudienceCount("c1");
    expect(prisma.contact.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        email: { in: ["qa@example.invalid", "dev@example.invalid"] },
      }),
    });
  });

  it("reaches nobody outside production when no test recipients are configured", async () => {
    vi.stubEnv("EMAIL_TEST_RECIPIENTS", "");
    await getCampaignAudienceCount("c1");
    expect(prisma.contact.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ email: { in: [] } }),
    });
  });

  it("drops pending rows for addresses outside the allowlist before sending", async () => {
    vi.stubEnv("EMAIL_TEST_RECIPIENTS", "qa@example.invalid");
    state.campaign = campaignRow({ status: "PARTIAL" });
    state.sends = [sendRow("k1", "FAILED")];
    acceptAll();
    await sendCampaign("c1");
    expect(prisma.campaignSend.deleteMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [
          { contact: { status: { not: "SUBSCRIBED" } } },
          { email: { notIn: ["qa@example.invalid"] } },
        ],
      }),
    });
  });

  it("applies no address filter in production", async () => {
    vi.stubEnv("RT_DEPLOY_ENV", "production");
    vi.stubEnv("EMAIL_TEST_RECIPIENTS", "qa@example.invalid");
    await getCampaignAudienceCount("c1");
    const where = vi.mocked(prisma.contact.count).mock.calls[0][0]?.where;
    expect(where).not.toHaveProperty("email");
  });
});
