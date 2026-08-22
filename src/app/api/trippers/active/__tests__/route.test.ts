import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/tripper-queries", () => ({
  getActiveTripperSlugsAndNames: vi.fn(),
}));

vi.mock("@/lib/tripper/attribution-server", () => ({
  readAttributionSlug: vi.fn(),
}));

import { GET } from "../route";
import { getActiveTripperSlugsAndNames } from "@/lib/db/tripper-queries";
import { readAttributionSlug } from "@/lib/tripper/attribution-server";

const getActiveTripperSlugsAndNamesMock =
  getActiveTripperSlugsAndNames as ReturnType<typeof vi.fn>;
const readAttributionSlugMock = readAttributionSlug as ReturnType<
  typeof vi.fn
>;

describe("GET /api/trippers/active", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { trippers, current } with current null when no cookie is set (empty-list case included)", async () => {
    getActiveTripperSlugsAndNamesMock.mockResolvedValue([]);
    readAttributionSlugMock.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ trippers: [], current: null });
  });

  it("returns the mapped {slug, name} list and current when the cookie slug matches an active tripper (happy path) — uses the scoped {tripperSlug, name} projection, not getAllTrippers (finding #8)", async () => {
    getActiveTripperSlugsAndNamesMock.mockResolvedValue([
      { tripperSlug: "maria", name: "Maria Lopez" },
      { tripperSlug: "carla", name: "Carla Diaz" },
    ]);
    readAttributionSlugMock.mockResolvedValue("maria");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      trippers: [
        { slug: "maria", name: "Maria Lopez" },
        { slug: "carla", name: "Carla Diaz" },
      ],
      current: "maria",
    });
  });

  it("returns current: null when the cookie slug does not match any active tripper (e.g. deactivated since cookie was set)", async () => {
    getActiveTripperSlugsAndNamesMock.mockResolvedValue([
      { tripperSlug: "carla", name: "Carla Diaz" },
    ]);
    readAttributionSlugMock.mockResolvedValue("maria");

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({
      trippers: [{ slug: "carla", name: "Carla Diaz" }],
      current: null,
    });
  });
});
