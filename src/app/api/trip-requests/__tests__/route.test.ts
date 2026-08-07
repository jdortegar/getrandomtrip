import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    tripRequest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    experience: { findUnique: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { tripAccessWhere } from "@/lib/travelers/travelerAccess";

type RouteModule = typeof import("../route");

function makePostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/trip-requests", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function mockAuthed() {
  (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { email: mockUser.email },
  });
  (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
    mockUser,
  );
}

const fullJourneyBody = {
  type: "couple",
  level: "essenza",
  originCountry: "Argentina",
  originCity: "Buenos Aires",
  pax: 2,
  nights: 3,
};

function makeGetRequest() {
  return new Request("http://localhost/api/trip-requests", {
    method: "GET",
  }) as unknown as import("next/server").NextRequest;
}

const mockUser = { id: "user-1", email: "test@example.com" };

describe("GET /api/trip-requests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mod = await import("../route");
    const res = await mod.GET(makeGetRequest());

    expect(res.status).toBe(401);
  });

  it("queries via the shared tripAccessWhere predicate (buyer OR companion), not a buyer-only where", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockUser.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUser,
    );
    (
      prisma.tripRequest.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);

    const mod = await import("../route");
    await mod.GET(makeGetRequest());

    const args = (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(args.where).toEqual(tripAccessWhere(mockUser.id));
  });

  it("tags each returned trip with role 'buyer' or 'companion'", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockUser.email },
    });
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUser,
    );
    (prisma.tripRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [
        { id: "trip-owned", userId: "user-1" },
        { id: "trip-companion", userId: "other-buyer" },
      ],
    );

    const mod = await import("../route");
    const res = await mod.GET(makeGetRequest());
    const body = await res.json();

    expect(body.tripRequests).toEqual([
      { id: "trip-owned", userId: "user-1", role: "buyer" },
      { id: "trip-companion", userId: "other-buyer", role: "companion" },
    ]);
  });
});

describe("POST /api/trip-requests — family-scoped upsert", () => {
  let POST: RouteModule["POST"];

  beforeEach(async () => {
    vi.resetAllMocks();
    mockAuthed();
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    const mod = await import("../route");
    POST = mod.POST;
  });

  // (a) First request for a family creates
  it("creates a new row when no id and no existing non-terminal row for the family", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.tripRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-1",
      type: "couple",
    });

    const res = await POST(makePostRequest(fullJourneyBody));

    expect(prisma.tripRequest.create).toHaveBeenCalledTimes(1);
    expect(prisma.tripRequest.update).not.toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  // (b) Repeated journey entry without id updates the same row
  it("updates the existing active journey row instead of creating a second one", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      { id: "active-1", status: "SAVED", tripperId: null },
    );
    (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "active-1",
      type: "solo",
    });

    const res = await POST(
      makePostRequest({ ...fullJourneyBody, type: "solo" }),
    );

    expect(prisma.tripRequest.create).not.toHaveBeenCalled();
    expect(prisma.tripRequest.update).toHaveBeenCalledTimes(1);
    expect(prisma.tripRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "active-1" } }),
    );
    expect(res.status).toBe(200);
  });

  // (c) Journey and xsed requests coexist — journey body only sees the journey slot
  it("scopes the active-row lookup to the journey family (type: not xsed)", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.tripRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-2",
      type: "couple",
    });

    await POST(makePostRequest(fullJourneyBody));

    expect(prisma.tripRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: { not: "xsed" } }),
      }),
    );
  });

  // (d) inverted: xsed body scopes the lookup to type: "xsed"
  it("scopes the active-row lookup to the xsed family (type: 'xsed')", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.tripRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-3",
      type: "xsed",
    });

    await POST(
      makePostRequest({
        ...fullJourneyBody,
        type: "xsed",
      }),
    );

    expect(prisma.tripRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: "xsed" }),
      }),
    );
  });

  // (e) Client-supplied id still updates directly
  it("updates the owned row directly by id without invoking the family finder", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      { id: "trip_123" },
    );
    (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "trip_123",
      pax: 4,
    });

    const res = await POST(makePostRequest({ id: "trip_123", pax: 4 }));

    expect(prisma.tripRequest.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.tripRequest.findFirst).toHaveBeenCalledWith({
      where: { id: "trip_123", userId: "user-1" },
      select: { id: true },
    });
    expect(prisma.tripRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "trip_123" } }),
    );
    expect(res.status).toBe(200);
  });

  // (f) Stale id + full body falls through to family resolution
  it("falls through to family resolution when the id is stale but the body carries a full config", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null) // ownership check: stale/unowned
      .mockResolvedValueOnce(null); // family active-row lookup: none
    (prisma.tripRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-4",
      type: "couple",
    });

    const res = await POST(
      makePostRequest({ id: "stale-1", ...fullJourneyBody }),
    );

    expect(prisma.tripRequest.findFirst).toHaveBeenCalledTimes(2);
    expect(prisma.tripRequest.create).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
  });

  // (g) Stale id + partial body (no type) → 404, no guessing
  it("returns 404 when the id is stale and the body has no type to resolve a family from", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await POST(
      makePostRequest({
        id: "stale-2",
        pax: 3,
        paxDetails: { adults: 2, minors: 0, rooms: 1 },
      }),
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Trip request not found");
    expect(prisma.tripRequest.create).not.toHaveBeenCalled();
    expect(prisma.tripRequest.update).not.toHaveBeenCalled();
  });

  // (h) Tripper attribution on reuse: never clobber an existing non-null tripperId
  it("preserves a non-null tripperId on the reused row instead of overwriting it", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      { id: "active-5", status: "SAVED", tripperId: "tripper-99" },
    );
    (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "active-5",
    });

    await POST(makePostRequest(fullJourneyBody));

    expect(prisma.tripRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tripperId: "tripper-99" }),
      }),
    );
  });

  // Matching exclusion: ?tripper=<slug> resolution must exclude inactive owners
  it("includes isActive: true in the tripper-slug User lookup, and leaves tripperId unset when the slug matches nothing", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.tripRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-9",
    });
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await POST(makePostRequest({ ...fullJourneyBody, tripper: "inactive-tripper" }));

    const findFirstArgs = (prisma.user.findFirst as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(findFirstArgs.where).toMatchObject({
      tripperSlug: "inactive-tripper",
      isActive: true,
    });
    expect(prisma.tripRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tripperId: null }),
      }),
    );
  });

  it("resolves tripperId from the slug when the tripper is active", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.tripRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-10",
    });
    (prisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "active-tripper-id",
    });

    await POST(makePostRequest({ ...fullJourneyBody, tripper: "active-tripper" }));

    expect(prisma.tripRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tripperId: "active-tripper-id" }),
      }),
    );
  });

  // (i) "family" classifies as journey — regression test for the naming collision
  it("classifies type: 'family' as the journey family, not a separate slot", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.tripRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-6",
      type: "family",
    });

    await POST(makePostRequest({ ...fullJourneyBody, type: "family" }));

    expect(prisma.tripRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: { not: "xsed" } }),
      }),
    );
  });

  // xsed revalidatePath — both create and reuse paths
  it("revalidates the xsed pages when creating a new xsed row", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (prisma.tripRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-7",
      type: "xsed",
    });

    await POST(makePostRequest({ ...fullJourneyBody, type: "xsed" }));

    expect(revalidatePath).toHaveBeenCalledWith("/es/xsed");
    expect(revalidatePath).toHaveBeenCalledWith("/en/xsed");
    expect(revalidatePath).toHaveBeenCalledWith("/es/xsed/drops");
    expect(revalidatePath).toHaveBeenCalledWith("/en/xsed/drops");
  });

  it("revalidates the xsed pages when reusing an existing xsed row", async () => {
    (prisma.tripRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      { id: "active-8", status: "PENDING_PAYMENT", tripperId: null },
    );
    (prisma.tripRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "active-8",
      type: "xsed",
    });

    await POST(makePostRequest({ ...fullJourneyBody, type: "xsed" }));

    expect(revalidatePath).toHaveBeenCalledWith("/es/xsed");
    expect(revalidatePath).toHaveBeenCalledWith("/en/xsed");
    expect(revalidatePath).toHaveBeenCalledWith("/es/xsed/drops");
    expect(revalidatePath).toHaveBeenCalledWith("/en/xsed/drops");
  });
});
