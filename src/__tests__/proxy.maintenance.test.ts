import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

const gate = vi.hoisted(() => ({ response: null as NextResponse | null }));
vi.mock("@/lib/maintenance/proxyGate", () => ({
  maintenanceResponse: async () => gate.response,
}));
vi.mock("next-auth/jwt", () => ({ getToken: vi.fn(async () => null) }));

import { proxy } from "../proxy";

describe("proxy maintenance mode", () => {
  it("returns the maintenance response before locale or attribution handling", async () => {
    gate.response = new NextResponse("maintenance", { status: 503 });
    const res = await proxy(
      new NextRequest("https://getrandomtrip.com/experiences/by-type/familia"),
    );
    expect(res.status).toBe(503);
    expect(await res.text()).toBe("maintenance");
  });

  it("continues with normal handling when maintenance does not apply", async () => {
    gate.response = null;
    const res = await proxy(
      new NextRequest("https://getrandomtrip.com/experiences/by-type/familia"),
    );
    expect(res.status).toBe(308);
  });
});
