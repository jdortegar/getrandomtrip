import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  gate: false,
  session: null as { user?: { id?: string } } | null,
  roles: [] as string[] | null,
}));

vi.mock("next-auth", () => ({ getServerSession: async () => state.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/siteSettings", () => ({
  isGateEnabled: async () => state.gate,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: async () =>
        state.roles === null ? null : { id: "u1", roles: state.roles },
    },
  },
}));

import { GET } from "../route";

async function status() {
  const res = await GET();
  return { body: await res.json(), cache: res.headers.get("cache-control") };
}

beforeEach(() => {
  state.gate = false;
  state.session = null;
  state.roles = [];
});

describe("GET /api/site-status", () => {
  it("reports maintenance off and never caches", async () => {
    expect(await status()).toEqual({
      body: { maintenance: false, staff: false },
      cache: "no-store",
    });
  });

  it("reports maintenance on for an anonymous visitor as not staff", async () => {
    state.gate = true;
    expect((await status()).body).toEqual({ maintenance: true, staff: false });
  });

  it("treats an ADMIN session as staff while maintenance is on", async () => {
    state.gate = true;
    state.session = { user: { id: "u1" } };
    state.roles = ["ADMIN"];
    expect((await status()).body).toEqual({ maintenance: true, staff: true });
  });

  it.each([["TRIPPER"], ["TRAVELER"]])(
    "does not treat a %s session as staff",
    async (role) => {
      state.gate = true;
      state.session = { user: { id: "u1" } };
      state.roles = [role];
      expect((await status()).body).toEqual({
        maintenance: true,
        staff: false,
      });
    },
  );
});
