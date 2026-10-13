import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendTripCompleted: vi.fn(),
}));

// ── Imports ────────────────────────────────────────────────────────────────────
import { prisma } from "@/lib/prisma";
import { sendTripCompleted } from "@/lib/email";
import { POST } from "../route";
import { runAutoCompletePass } from "../passes";

const VALID_SECRET = "test-cron-secret-123";
const findMany = prisma.tripRequest.findMany as ReturnType<typeof vi.fn>;
const updateMany = prisma.tripRequest.updateMany as ReturnType<typeof vi.fn>;

function makeRequest(secret?: string): Request {
  const headers: Record<string, string> = {};
  if (secret) headers["Authorization"] = `Bearer ${secret}`;
  return new Request("http://localhost/api/internal/trip-auto-complete", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.CRON_SECRET = VALID_SECRET;
  findMany.mockResolvedValue([]);
  updateMany.mockResolvedValue({ count: 1 });
});

// ── Auth guard ───────────────────────────────────────────────────────────────
describe("POST /api/internal/trip-auto-complete — auth guard", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when the secret is wrong", async () => {
    const res = await POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with the pass result when the secret is correct", async () => {
    const res = await POST(makeRequest(VALID_SECRET));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ completed: 0, errors: [] });
  });
});

// ── Pass ──────────────────────────────────────────────────────────────────────
describe("runAutoCompletePass", () => {
  const now = new Date("2026-10-09T15:30:00.000Z");

  it("queries only REVEALED trips that ended at least 2 days ago (UTC days)", async () => {
    await runAutoCompletePass(now);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "REVEALED",
          endDate: { lte: new Date("2026-10-07T00:00:00.000Z") },
        },
      }),
    );
  });

  it("completes each trip with a guarded update and sends the review email", async () => {
    findMany.mockResolvedValue([
      { id: "t1", userId: "u1", reviewToken: null },
      { id: "t2", userId: "u2", reviewToken: "existing-token" },
    ]);

    const result = await runAutoCompletePass(now);

    expect(result).toEqual({ completed: 2, skipped: 0 });
    const firstCall = updateMany.mock.calls[0][0];
    expect(firstCall.where).toEqual({ id: "t1", status: "REVEALED" });
    expect(firstCall.data).toMatchObject({ status: "COMPLETED", completedAt: now });
    expect(typeof firstCall.data.reviewToken).toBe("string");
    expect(updateMany.mock.calls[1][0].data.reviewToken).toBe("existing-token");
    expect(sendTripCompleted).toHaveBeenCalledWith("t1", "u1", firstCall.data.reviewToken);
    expect(sendTripCompleted).toHaveBeenCalledWith("t2", "u2", "existing-token");
  });

  it("skips the email when another writer already changed the status", async () => {
    findMany.mockResolvedValue([{ id: "t1", userId: "u1", reviewToken: null }]);
    updateMany.mockResolvedValue({ count: 0 });

    const result = await runAutoCompletePass(now);

    expect(result).toEqual({ completed: 0, skipped: 1 });
    expect(sendTripCompleted).not.toHaveBeenCalled();
  });

  it("keeps going when one trip fails", async () => {
    findMany.mockResolvedValue([
      { id: "t1", userId: "u1", reviewToken: null },
      { id: "t2", userId: "u2", reviewToken: null },
    ]);
    updateMany.mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce({ count: 1 });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await runAutoCompletePass(now);

    expect(result).toEqual({ completed: 1, skipped: 1 });
    expect(sendTripCompleted).toHaveBeenCalledTimes(1);
  });
});
