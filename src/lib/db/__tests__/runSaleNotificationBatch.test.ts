// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  saleNotificationDelivery: { update: vi.fn(), updateMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/sales/sendSaleNotification", () => ({
  SALE_SEND_TIMEOUT_MS: 3_000,
  sendSaleNotification: vi.fn(),
}));
import { sendSaleNotification } from "@/lib/sales/sendSaleNotification";
import { runSaleNotificationBatch } from "../runSaleNotificationBatch";

const started = 1_000_000;
let row: {
  paymentId: string;
  tripRequestId: string;
  amount: number;
  currency: string;
  attempts: number;
  sentAt: Date | null;
  nextAttemptAt: Date;
  leaseToken: string | null;
  lastError: string | null;
};
let inTransaction: boolean;
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(Date, "now").mockReturnValue(started);
  row = {
    paymentId: "payment",
    tripRequestId: "trip",
    amount: 100,
    currency: "USD",
    attempts: 0,
    sentAt: null,
    nextAttemptAt: new Date(0),
    leaseToken: null,
    lastError: null,
  };
  inTransaction = false;
  let tail = Promise.resolve();
  db.$transaction.mockImplementation((work) => {
    const next = tail.then(async () => {
      inTransaction = true;
      const before = { ...row };
      try {
        return await work(db);
      } catch (error) {
        row = before;
        throw error;
      } finally {
        inTransaction = false;
      }
    });
    tail = next.catch(() => {});
    return next;
  });
  db.$queryRaw.mockImplementation(async () =>
    row.sentAt === null && row.nextAttemptAt.getTime() <= Date.now()
      ? [{ ...row }]
      : [],
  );
  db.saleNotificationDelivery.update.mockImplementation(async ({ data }) =>
    Object.assign(row, data),
  );
  db.saleNotificationDelivery.updateMany.mockImplementation(
    async ({ where, data }) => {
      if (row.leaseToken !== where.leaseToken || row.sentAt !== null)
        return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    },
  );
  vi.mocked(sendSaleNotification).mockResolvedValue({ sent: true });
});
afterEach(() => vi.restoreAllMocks());

it("claims bounded skip-locked work and sends outside DB transactions", async () => {
  vi.mocked(sendSaleNotification).mockImplementation(async () => {
    expect(inTransaction).toBe(false);
    expect(row.leaseToken).toBeTruthy();
    expect(row.nextAttemptAt).toEqual(new Date(started + 60_000));
    return { sent: true };
  });
  expect(await runSaleNotificationBatch("payment")).toEqual({
    claimed: 1,
    sent: 1,
    failed: 0,
  });
  const query = db.$queryRaw.mock.calls[0][0];
  expect(query.text).toContain("LIMIT 3 FOR UPDATE SKIP LOCKED");
  expect(query.text).toContain('"sentAt" IS NULL');
  expect(query.values).toEqual([new Date(started), "payment"]);
  expect(row.sentAt).toBeInstanceOf(Date);
  expect(row.leaseToken).toBeNull();
  expect(await runSaleNotificationBatch()).toEqual({
    claimed: 0,
    sent: 0,
    failed: 0,
  });
  expect(sendSaleNotification).toHaveBeenCalledOnce();
});

it("serializes concurrent claims so only one worker sends", async () => {
  const results = await Promise.all([
    runSaleNotificationBatch(),
    runSaleNotificationBatch(),
  ]);
  expect(results.map((result) => result.claimed).sort()).toEqual([0, 1]);
  expect(sendSaleNotification).toHaveBeenCalledOnce();
});

it.each(["not_configured", "unavailable", "rejected"] as const)(
  "keeps %s retryable with exponential backoff",
  async (error) => {
    vi.mocked(sendSaleNotification).mockResolvedValue({ sent: false, error });
    expect((await runSaleNotificationBatch()).failed).toBe(1);
    expect(row).toMatchObject({
      attempts: 1,
      sentAt: null,
      leaseToken: null,
      lastError: error,
      nextAttemptAt: new Date(started + 60_000),
    });
    expect((await runSaleNotificationBatch()).claimed).toBe(0);
    vi.mocked(Date.now).mockReturnValue(started + 60_000);
    await runSaleNotificationBatch();
    expect(row.attempts).toBe(2);
    expect(row.nextAttemptAt).toEqual(new Date(started + 180_000));
  },
);

it("honors retry-after and caps long-running failure backoff", async () => {
  vi.mocked(sendSaleNotification).mockResolvedValue({
    sent: false,
    error: "rejected",
    retryAfterMs: 120_000,
  });
  await runSaleNotificationBatch();
  expect(row.nextAttemptAt).toEqual(new Date(started + 120_000));
  row.attempts = 30;
  row.nextAttemptAt = new Date(0);
  await runSaleNotificationBatch();
  expect(row.attempts).toBe(30);
  expect(row.nextAttemptAt).toEqual(new Date(started + 86_400_000));
});

it("recovers a crashed claim after expiry without marking it delivered", async () => {
  vi.mocked(sendSaleNotification).mockRejectedValueOnce(new Error("crashed"));
  await expect(runSaleNotificationBatch()).rejects.toThrow("crashed");
  expect(row.sentAt).toBeNull();
  expect((await runSaleNotificationBatch()).claimed).toBe(0);
  vi.mocked(Date.now).mockReturnValue(started + 60_001);
  expect((await runSaleNotificationBatch()).sent).toBe(1);
});

it("does not let an expired worker overwrite a newer lease", async () => {
  vi.mocked(sendSaleNotification).mockImplementation(async () => {
    row.leaseToken = "newer-worker";
    return { sent: true };
  });
  expect((await runSaleNotificationBatch()).sent).toBe(0);
  expect(row.sentAt).toBeNull();
  expect(row.leaseToken).toBe("newer-worker");
});

it("leaves claimed work recoverable when its execution budget is exhausted", async () => {
  db.saleNotificationDelivery.update.mockImplementation(async ({ data }) => {
    Object.assign(row, data);
    vi.mocked(Date.now).mockReturnValue(started + 14_000);
    return row;
  });
  expect(await runSaleNotificationBatch()).toEqual({
    claimed: 1,
    sent: 0,
    failed: 0,
  });
  expect(sendSaleNotification).not.toHaveBeenCalled();
  expect(row.nextAttemptAt).toEqual(new Date(started + 60_000));
});

it("keeps accepted but unstamped delivery retryable after DB failure", async () => {
  db.saleNotificationDelivery.updateMany.mockRejectedValueOnce(
    new Error("database unavailable"),
  );
  await expect(runSaleNotificationBatch()).rejects.toThrow(
    "database unavailable",
  );
  expect(sendSaleNotification).toHaveBeenCalledOnce();
  expect(row.sentAt).toBeNull();
  expect(row.leaseToken).toBeTruthy();
});
