// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
vi.mock("@/lib/admin/requireAdmin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripRequest: { findUnique: vi.fn(), update: vi.fn() },
    tripDocumentDraft: { create: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/db/tripDocumentLocks", () => ({
  withTripDocumentLocks: vi.fn(),
}));
vi.mock("@/lib/db/loadTripDocumentSource", () => ({
  loadTripDocumentSource: vi.fn(),
}));
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { prisma } from "@/lib/prisma";
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { loadTripDocumentSource } from "@/lib/db/loadTripDocumentSource";
import { GET } from "../route";
const context = { params: Promise.resolve({ id: "trip" }) };
const tx = {} as never;
const request = (query = "") =>
  new NextRequest(
    `http://localhost/api/admin/trip-requests/trip/document-source${query}`,
  );
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireAdmin).mockResolvedValue({ ok: true, adminId: "admin" });
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    userId: "buyer",
  } as never);
  vi.mocked(withTripDocumentLocks).mockImplementation(
    async (_db, _scope, work) => work(tx),
  );
  vi.mocked(loadTripDocumentSource).mockResolvedValue({
    trip: {},
    experienceItinerary: {
      title: "Selected",
      itinerary: [],
      inclusions: [],
      exclusions: [],
    },
    provider: { kind: "experience", hotels: [{ name: "Selected hotel" }] },
  });
});
it.each([401, 403])(
  "authorizes before trip/source reads (%s)",
  async (status) => {
    vi.mocked(requireAdmin).mockResolvedValue({
      ok: false,
      errorResponse: NextResponse.json({}, { status }),
    });
    const result = await GET(request("?experienceId=selected"), context);
    expect(result.status).toBe(status);
    expect(result.headers.get("cache-control")).toBe("private, no-store");
    expect(prisma.tripRequest.findUnique).not.toHaveBeenCalled();
    expect(loadTripDocumentSource).not.toHaveBeenCalled();
  },
);
it.each([
  ["", undefined],
  ["?experienceId=", null],
  ["?experienceId=selected", "selected"],
])(
  "resolves source %s under owner/trip locks without writes",
  async (query, experienceId) => {
    const result = await GET(request(query as string), context);
    expect(result.status).toBe(200);
    expect(loadTripDocumentSource).toHaveBeenCalledWith(
      tx,
      "trip",
      experienceId,
    );
    expect(withTripDocumentLocks).toHaveBeenCalledWith(
      prisma,
      { ownerId: "buyer", tripIds: ["trip"] },
      expect.any(Function),
    );
    expect(await result.json()).toMatchObject({
      experienceItinerary: { title: "Selected" },
      candidates: { hotel: [{ title: "Selected hotel" }] },
    });
    expect(prisma.tripRequest.update).not.toHaveBeenCalled();
    expect(prisma.tripDocumentDraft.create).not.toHaveBeenCalled();
    expect(prisma.tripDocumentDraft.update).not.toHaveBeenCalled();
  },
);
it.each([
  "?experienceId=A&experienceId=B",
  "?experienceId=%20",
  `?experienceId=${"x".repeat(201)}`,
])("rejects invalid source query %s", async (query) => {
  expect((await GET(request(query), context)).status).toBe(400);
  expect(loadTripDocumentSource).not.toHaveBeenCalled();
});
it("returns missing trip, ineligible override and service errors without leaking internals", async () => {
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValueOnce(null);
  expect((await GET(request(), context)).status).toBe(404);
  vi.mocked(loadTripDocumentSource).mockRejectedValueOnce(
    new Error("DOCUMENT_SOURCE_EXPERIENCE_UNAVAILABLE"),
  );
  expect((await GET(request("?experienceId=blocked"), context)).status).toBe(
    422,
  );
  vi.mocked(loadTripDocumentSource).mockRejectedValueOnce(
    new Error("private.database"),
  );
  const result = await GET(request(), context);
  expect(result.status).toBe(503);
  expect(await result.text()).not.toContain("private.database");
});
