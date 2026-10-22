// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    campaign: { findMany: vi.fn(), findUnique: vi.fn() },
    campaignSend: { findMany: vi.fn(), groupBy: vi.fn() },
    payment: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getCampaignMetrics,
  getCampaignRecipients,
  getCampaignReport,
  getCampaignSummaries,
  readDiscountAmountUsd,
} from "../metrics";

// In-memory fixtures queried through a tiny `where` evaluator, so the tests
// exercise the filters the module sends to Prisma rather than canned results.

type EventRow = { type: string };
type SendRow = {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  status: string;
  sentAt: Date | null;
  contact: { name: string | null; userId: string | null; email: string };
  events: EventRow[];
};
type PaymentRow = {
  id: string;
  userId: string;
  stripePromotionCodeId: string | null;
  status: string;
  paidAt: Date | null;
  amount: number;
  currency: string;
  promoDiscountUsd: number | null;
  providerResponse: unknown;
  webhookData: unknown;
  user: { email: string };
};
type CampaignRow = {
  id: string;
  stripePromotionCodeId: string | null;
  sentAt: Date | null;
};

const db: { campaigns: CampaignRow[]; sends: SendRow[]; payments: PaymentRow[] } = {
  campaigns: [],
  sends: [],
  payments: [],
};

type Where = Record<string, unknown>;

function matchesValue(value: unknown, condition: unknown): boolean {
  if (condition !== null && typeof condition === "object" && !(condition instanceof Date)) {
    const c = condition as Record<string, unknown>;
    if ("in" in c) return (c.in as unknown[]).includes(value);
    if ("gte" in c) return value instanceof Date && value >= (c.gte as Date);
    if ("not" in c) return value !== c.not;
    if ("some" in c) {
      return (value as EventRow[]).some((row) => matches(row, c.some as Where));
    }
    throw new Error(`unsupported condition ${JSON.stringify(c)}`);
  }
  return value === condition;
}

function matches(row: object, where: Where | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, condition]) => {
    if (key === "OR") return (condition as Where[]).some((w) => matches(row, w));
    return matchesValue((row as Record<string, unknown>)[key], condition);
  });
}

function eventsFor(send: SendRow, select: unknown) {
  const spec = select as { where?: Where; distinct?: string[] };
  const rows = send.events.filter((event) => matches(event, spec.where));
  const types = [...new Set(rows.map((event) => event.type))];
  return types.map((type) => ({ type }));
}

function groupBy(args: { by: string[]; where?: Where }) {
  const groups = new Map<string, Record<string, unknown>>();
  for (const send of db.sends.filter((row) => matches(row, args.where))) {
    const keyValues = args.by.map((key) => (send as Record<string, unknown>)[key]);
    const key = JSON.stringify(keyValues);
    const group = groups.get(key) ?? {
      ...Object.fromEntries(args.by.map((k, i) => [k, keyValues[i]])),
      _count: { _all: 0 },
    };
    (group._count as { _all: number })._all += 1;
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** Top-level `select` projection, so tests see only the columns the module asks for. */
function project<T extends object>(row: T, select: Record<string, unknown> | undefined) {
  if (!select) return row;
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => Boolean(select[key])),
  ) as Partial<T>;
}

function day(n: number) {
  return new Date(Date.UTC(2026, 9, n));
}

function send(partial: Partial<SendRow> & { id: string; email: string }): SendRow {
  return {
    campaignId: "c1",
    contactId: `contact-${partial.id}`,
    status: "SENT",
    sentAt: day(10),
    contact: { name: null, userId: null, email: partial.email },
    events: [],
    ...partial,
  };
}

function payment(partial: Partial<PaymentRow> & { id: string }): PaymentRow {
  return {
    userId: `user-${partial.id}`,
    stripePromotionCodeId: "promo_1",
    status: "APPROVED",
    paidAt: day(12),
    amount: 100,
    currency: "USD",
    promoDiscountUsd: null,
    providerResponse: null,
    webhookData: null,
    user: { email: `${partial.id}@buyer.test` },
    ...partial,
  };
}

const promoCampaign: CampaignRow = { id: "c1", stripePromotionCodeId: "promo_1", sentAt: day(10) };

beforeEach(() => {
  vi.resetAllMocks();
  db.campaigns = [promoCampaign];
  db.sends = [];
  db.payments = [];

  vi.mocked(prisma.campaign.findUnique).mockImplementation((async (args: {
    where: { id: string };
  }) => db.campaigns.find((row) => row.id === args.where.id) ?? null) as never);
  vi.mocked(prisma.campaign.findMany).mockImplementation((async () => db.campaigns) as never);
  vi.mocked(prisma.campaignSend.findMany).mockImplementation((async (args: {
    where?: Where;
    select?: { events?: unknown };
  }) =>
    db.sends
      .filter((row) => matches(row, args.where))
      .sort((a, b) => a.email.localeCompare(b.email))
      .map((row) => ({ ...row, events: eventsFor(row, args.select?.events) }))) as never);
  vi.mocked(prisma.campaignSend.groupBy).mockImplementation(groupBy as never);
  vi.mocked(prisma.payment.findMany).mockImplementation((async (args: {
    where?: Where;
    select?: Record<string, unknown>;
  }) =>
    db.payments
      .filter((row) => matches(row, args.where))
      .map((row) => project(row, args.select))) as never);
});

describe("getCampaignMetrics", () => {
  it("returns null for an unknown campaign", async () => {
    expect(await getCampaignMetrics("missing")).toBeNull();
  });

  it("counts recipients per delivery status", async () => {
    db.sends = [
      send({ id: "s1", email: "a@x.test", status: "SENT" }),
      send({ id: "s2", email: "b@x.test", status: "DELIVERED" }),
      send({ id: "s3", email: "c@x.test", status: "BOUNCED", events: [{ type: "DELIVERED" }, { type: "BOUNCED" }] }),
      send({ id: "s4", email: "d@x.test", status: "BOUNCED" }),
      send({ id: "s5", email: "e@x.test", status: "FAILED", sentAt: null }),
      send({ id: "s6", email: "f@x.test", status: "QUEUED", sentAt: null }),
      send({ id: "o1", email: "z@x.test", status: "DELIVERED", campaignId: "other" }),
    ];

    const metrics = await getCampaignMetrics("c1");

    expect(metrics).toMatchObject({ sent: 4, delivered: 2, bounced: 2, failed: 2 });
  });

  it("counts unique opens and clicks once per recipient", async () => {
    db.sends = [
      send({ id: "s1", email: "a@x.test", events: [{ type: "OPENED" }, { type: "OPENED" }, { type: "CLICKED" }, { type: "CLICKED" }] }),
      send({ id: "s2", email: "b@x.test", events: [{ type: "OPENED" }] }),
      send({ id: "s3", email: "c@x.test" }),
    ];

    const metrics = await getCampaignMetrics("c1");

    expect(metrics).toMatchObject({ uniqueOpens: 2, uniqueClicks: 1 });
  });

  it("splits conversions into attributed and shared", async () => {
    db.sends = [
      send({ id: "s1", email: "ana@x.test" }),
      send({ id: "s2", email: "bob@x.test", contact: { name: "Bob", userId: "user-bob", email: "bob@x.test" } }),
    ];
    db.payments = [
      // Payer email matches the recipient case-insensitively.
      payment({ id: "p1", amount: 70, user: { email: "Ana@X.test" } }),
      // Payer account is the contact's linked user, under another email.
      payment({ id: "p2", amount: 80, userId: "user-bob", user: { email: "bob@work.test" } }),
      // Someone who never received the campaign.
      payment({ id: "p3", amount: 90 }),
    ];

    const metrics = await getCampaignMetrics("c1");

    expect(metrics?.conversions).toEqual({ attributed: 2, shared: 1 });
    expect(metrics?.revenue).toBe(240);
    expect(metrics?.currency).toBe("USD");
  });

  it("ignores unsettled payments, payments before the send and other codes", async () => {
    db.sends = [send({ id: "s1", email: "ana@x.test" })];
    db.payments = [
      payment({ id: "early", paidAt: day(9) }),
      payment({ id: "pending", status: "PENDING" }),
      payment({ id: "refunded", status: "REFUNDED" }),
      payment({ id: "unpaid", paidAt: null }),
      payment({ id: "other", stripePromotionCodeId: "promo_2" }),
      payment({ id: "ok", status: "COMPLETED", paidAt: day(10), amount: 50 }),
    ];

    const metrics = await getCampaignMetrics("c1");

    expect(metrics?.conversions).toEqual({ attributed: 0, shared: 1 });
    expect(metrics?.revenue).toBe(50);
  });

  it("reports zero conversions without a promotion code or before sending", async () => {
    db.campaigns = [
      { id: "c1", stripePromotionCodeId: null, sentAt: day(10) },
      { id: "c2", stripePromotionCodeId: "promo_1", sentAt: null },
    ];
    db.payments = [payment({ id: "p1" })];

    const [noPromo, notSent] = await Promise.all([
      getCampaignMetrics("c1"),
      getCampaignMetrics("c2"),
    ]);

    for (const metrics of [noPromo, notSent]) {
      expect(metrics).toMatchObject({
        conversions: { attributed: 0, shared: 0 },
        revenue: 0,
        discountTotal: null,
      });
    }
    expect(prisma.payment.findMany).not.toHaveBeenCalled();
  });

  it("sums stored checkout discounts and keeps other currencies out of revenue", async () => {
    db.payments = [
      payment({
        id: "p1",
        amount: 70,
        webhookData: { data: { object: { metadata: { discountAmountUsd: "30" } } } },
      }),
      payment({ id: "p2", amount: 80, providerResponse: { metadata: { discountAmountUsd: 12.5 } } }),
      payment({ id: "p3", amount: 1000, currency: "ars", webhookData: "garbage" }),
    ];

    const metrics = await getCampaignMetrics("c1");

    expect(metrics).toMatchObject({
      conversions: { attributed: 0, shared: 3 },
      revenue: 150,
      discountTotal: 42.5,
      otherCurrencyConversions: 1,
    });
  });

  it("prefers the stored discount column and falls back to JSON for older rows", async () => {
    db.payments = [
      payment({
        id: "p1",
        promoDiscountUsd: 25,
        webhookData: { data: { object: { metadata: { discountAmountUsd: "99" } } } },
      }),
      payment({ id: "p2", promoDiscountUsd: 10.25 }),
      payment({ id: "p3", providerResponse: { metadata: { discountAmountUsd: "5" } } }),
      payment({ id: "p4" }),
    ];

    expect((await getCampaignMetrics("c1"))?.discountTotal).toBe(40.25);
  });

  it("keeps the discount total null when no conversion has discount data", async () => {
    db.payments = [payment({ id: "p1" }), payment({ id: "p2", webhookData: "garbage" })];

    expect((await getCampaignMetrics("c1"))?.discountTotal).toBeNull();
  });
});

describe("readDiscountAmountUsd", () => {
  it.each([
    [{ data: { object: { metadata: { discountAmountUsd: "30.5" } } } }, 30.5],
    [{ metadata: { discountAmountUsd: "0" } }, 0],
    [{ metadata: { discountAmountUsd: 7 } }, 7],
  ])("reads %j", (json, expected) => {
    expect(readDiscountAmountUsd(json)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "text",
    42,
    [],
    { metadata: null },
    { metadata: { discountAmountUsd: "" } },
    { metadata: { discountAmountUsd: "abc" } },
    { metadata: { discountAmountUsd: "-5" } },
    { data: { object: "nope" } },
  ])("returns null for %j", (json) => {
    expect(readDiscountAmountUsd(json)).toBeNull();
  });
});

describe("getCampaignRecipients", () => {
  it("returns null for an unknown campaign", async () => {
    expect(await getCampaignRecipients("missing")).toBeNull();
  });

  it("lists recipients by email with engagement and purchase flags", async () => {
    db.sends = [
      send({
        id: "s2",
        email: "bob@x.test",
        status: "DELIVERED",
        contact: { name: "Bob", userId: "user-bob", email: "bob@x.test" },
        events: [{ type: "DELIVERED" }, { type: "OPENED" }, { type: "CLICKED" }],
      }),
      send({ id: "s1", email: "ana@x.test", events: [{ type: "OPENED" }, { type: "OPENED" }] }),
      send({ id: "s3", email: "cid@x.test", status: "FAILED", sentAt: null }),
    ];
    db.payments = [
      payment({ id: "p1", userId: "user-bob", user: { email: "bob@work.test" } }),
      payment({ id: "p2" }),
    ];

    const recipients = await getCampaignRecipients("c1");

    expect(recipients).toEqual([
      { sendId: "s1", email: "ana@x.test", name: null, status: "SENT", opened: true, clicked: false, purchased: false, sentAt: day(10).toISOString() },
      { sendId: "s2", email: "bob@x.test", name: "Bob", status: "DELIVERED", opened: true, clicked: true, purchased: true, sentAt: day(10).toISOString() },
      { sendId: "s3", email: "cid@x.test", name: null, status: "FAILED", opened: false, clicked: false, purchased: false, sentAt: null },
    ]);
  });
});

describe("getCampaignReport", () => {
  it("returns metrics and recipients from one load", async () => {
    db.sends = [send({ id: "s1", email: "ana@x.test" })];

    const report = await getCampaignReport("c1");

    expect(report?.metrics.sent).toBe(1);
    expect(report?.recipients.map((r) => r.sendId)).toEqual(["s1"]);
    expect(prisma.campaignSend.findMany).toHaveBeenCalledTimes(1);
    expect(await getCampaignReport("missing")).toBeNull();
  });
});

describe("getCampaignSummaries", () => {
  it("aggregates every campaign with grouped queries", async () => {
    db.campaigns = [
      promoCampaign,
      { id: "c2", stripePromotionCodeId: "promo_2", sentAt: day(11) },
      { id: "c3", stripePromotionCodeId: null, sentAt: null },
    ];
    db.sends = [
      send({ id: "s1", email: "a@x.test", events: [{ type: "OPENED" }, { type: "OPENED" }, { type: "CLICKED" }] }),
      send({ id: "s2", email: "b@x.test", status: "DELIVERED", events: [{ type: "OPENED" }] }),
      send({ id: "s3", email: "c@x.test", status: "FAILED" }),
      send({ id: "s4", email: "a@x.test", campaignId: "c2", status: "BOUNCED" }),
    ];
    db.payments = [
      payment({ id: "p1", amount: 70 }),
      payment({ id: "p2", amount: 30, user: { email: "a@x.test" } }),
      payment({ id: "p3", stripePromotionCodeId: "promo_2", paidAt: day(10), amount: 99 }),
      payment({ id: "p4", stripePromotionCodeId: "promo_2", amount: 60, currency: "ARS" }),
      payment({ id: "p5", stripePromotionCodeId: "promo_2", status: "FAILED" }),
    ];

    const summaries = await getCampaignSummaries();

    expect(summaries).toEqual([
      { id: "c1", sent: 2, uniqueOpens: 2, uniqueClicks: 1, conversions: 2, revenue: 100 },
      { id: "c2", sent: 1, uniqueOpens: 0, uniqueClicks: 0, conversions: 1, revenue: 0 },
      { id: "c3", sent: 0, uniqueOpens: 0, uniqueClicks: 0, conversions: 0, revenue: 0 },
    ]);
    expect(prisma.campaignSend.findMany).not.toHaveBeenCalled();
    expect(prisma.payment.findMany).toHaveBeenCalledTimes(1);
    // Summaries never report discounts, so the stored Stripe JSON stays unread.
    const [{ select }] = vi.mocked(prisma.payment.findMany).mock.calls[0] as [
      { select: Record<string, unknown> },
    ];
    expect(select).not.toHaveProperty("providerResponse");
    expect(select).not.toHaveProperty("webhookData");
    expect(select).not.toHaveProperty("promoDiscountUsd");
  });

  it("skips the payment query when no campaign has a sent promo", async () => {
    db.campaigns = [{ id: "c3", stripePromotionCodeId: null, sentAt: null }];

    expect(await getCampaignSummaries()).toEqual([
      { id: "c3", sent: 0, uniqueOpens: 0, uniqueClicks: 0, conversions: 0, revenue: 0 },
    ]);
    expect(prisma.payment.findMany).not.toHaveBeenCalled();
  });
});
