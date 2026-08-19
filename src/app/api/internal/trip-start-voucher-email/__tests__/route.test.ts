import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendTripStartVouchers: vi.fn(),
}));

// ── Imports ────────────────────────────────────────────────────────────────────
import { prisma } from "@/lib/prisma";
import { sendTripStartVouchers } from "@/lib/email";

type RouteModule = typeof import("../route");

const VALID_SECRET = "test-cron-secret-123";

function makeRequest(secret?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["Authorization"] = `Bearer ${secret}`;
  return new Request("http://localhost/api/internal/trip-start-voucher-email", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.CRON_SECRET = VALID_SECRET;
  (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (sendTripStartVouchers as ReturnType<typeof vi.fn>).mockResolvedValue({
    sent: true,
  });
});

// ── Auth guard ───────────────────────────────────────────────────────────────
describe("POST /api/internal/trip-start-voucher-email — auth guard", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "Unauthorized" });
  });

  it("returns 401 when the secret is wrong", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 200 when the secret is correct", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest(VALID_SECRET));
    expect(res.status).toBe(200);
  });
});

// ── Pass 1 ─────────────────────────────────────────────────────────────────────
describe("runPass1", () => {
  it("queries only REVEALED/COMPLETED trips with startDate passed and voucherEmailSentAt: null", async () => {
    const mod = (await import("../route")) as RouteModule;
    await mod.runPass1(new Date());

    expect(prisma.tripRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          voucherEmailSentAt: null,
          status: { in: ["REVEALED", "COMPLETED"] },
        }),
      }),
    );
  });

  it("sends the voucher email and stamps voucherEmailSentAt on success", async () => {
    const trip = { id: "trip-1", userId: "user-1" };
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      trip,
    ]);

    const mod = (await import("../route")) as RouteModule;
    const now = new Date();
    const result = await mod.runPass1(now);

    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(0);
    expect(sendTripStartVouchers).toHaveBeenCalledWith("trip-1", "user-1");
    expect(prisma.tripRequest.update).toHaveBeenCalledWith({
      where: { id: "trip-1" },
      data: { voucherEmailSentAt: now },
    });
  });

  it("does NOT stamp when sendTripStartVouchers reports sent: false (e.g. zero documents)", async () => {
    const trip = { id: "trip-2", userId: "user-2" };
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      trip,
    ]);
    (sendTripStartVouchers as ReturnType<typeof vi.fn>).mockResolvedValue({
      sent: false,
    });

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass1(new Date());

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
    expect(prisma.tripRequest.update).not.toHaveBeenCalled();
  });

  it("does not re-notify already-stamped trips (idempotency via the query guard)", async () => {
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass1(new Date());

    expect(result.sent).toBe(0);
    expect(sendTripStartVouchers).not.toHaveBeenCalled();
  });

  it("accumulates errors per row without aborting the loop", async () => {
    const trips = [
      { id: "trip-err", userId: "user-err" },
      { id: "trip-ok", userId: "user-ok" },
    ];
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      trips,
    );
    (sendTripStartVouchers as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("Resend down"))
      .mockResolvedValueOnce({ sent: true });

    const mod = (await import("../route")) as RouteModule;
    const result = await mod.runPass1(new Date());

    expect(result.sent).toBe(1);
    expect(sendTripStartVouchers).toHaveBeenCalledTimes(2);
    expect(prisma.tripRequest.update).toHaveBeenCalledTimes(1);
    expect(prisma.tripRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "trip-ok" } }),
    );
  });
});

// ── Full handler integration ───────────────────────────────────────────────────
describe("POST /api/internal/trip-start-voucher-email — response contract", () => {
  it("returns { pass1, errors } on success", async () => {
    const mod = (await import("../route")) as RouteModule;
    const res = await mod.POST(makeRequest(VALID_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      pass1: { sent: expect.any(Number), skipped: expect.any(Number) },
      errors: expect.any(Array),
    });
  });
});
