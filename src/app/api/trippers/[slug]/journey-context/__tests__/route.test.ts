import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/tripper-queries", () => ({
  getTripperJourneyContext: vi.fn(),
}));

import { GET } from "../route";
import { getTripperJourneyContext } from "@/lib/db/tripper-queries";

const getTripperJourneyContextMock = getTripperJourneyContext as ReturnType<
  typeof vi.fn
>;

function makeRequest() {
  return new Request("http://localhost/api/trippers/whoever/journey-context");
}

describe("GET /api/trippers/[slug]/journey-context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 with an error body when the tripper is not_found", async () => {
    getTripperJourneyContextMock.mockResolvedValue({ status: "not_found" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await GET(makeRequest() as any, {
      params: Promise.resolve({ slug: "nobody" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: "Tripper not found" });
  });

  it("returns 410 Gone with { error: 'tripper_inactive', name } when the tripper is inactive", async () => {
    getTripperJourneyContextMock.mockResolvedValue({
      status: "inactive",
      name: "Florencia Denis",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await GET(makeRequest() as any, {
      params: Promise.resolve({ slug: "florencia-denis" }),
    });

    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body).toEqual({
      error: "tripper_inactive",
      name: "Florencia Denis",
    });
  });

  it("returns 200 with the context payload when the tripper is active", async () => {
    const context = {
      name: "Ana Lopez",
      avatarUrl: null,
      location: "Bariloche",
      allowedTypes: ["solo"],
      allowedLevelsByType: { solo: ["essenza"] },
    };
    getTripperJourneyContextMock.mockResolvedValue({
      status: "ok",
      context,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await GET(makeRequest() as any, {
      params: Promise.resolve({ slug: "ana-lopez" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(context);
  });
});
