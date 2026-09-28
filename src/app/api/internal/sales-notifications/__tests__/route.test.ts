import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/db/runSaleNotificationBatch", () => ({
  runSaleNotificationBatch: vi.fn(),
}));
import { runSaleNotificationBatch } from "@/lib/db/runSaleNotificationBatch";
import { POST } from "../route";
const request = (token?: string) =>
  new Request("https://site.test/api/internal/sales-notifications", {
    method: "POST",
    headers: token ? { Authorization: token } : {},
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "private-token");
});
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, "Bearer wrong", "private-token"])(
  "rejects unauthorized access before processing (%s)",
  async (token) => {
    const response = await POST(request(token));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(runSaleNotificationBatch).not.toHaveBeenCalled();
  },
);
it("fails closed when cron secret is absent", async () => {
  vi.stubEnv("CRON_SECRET", "");
  expect((await POST(request("Bearer private-token"))).status).toBe(401);
  expect(runSaleNotificationBatch).not.toHaveBeenCalled();
});
it("returns counts without identifiers or credentials", async () => {
  vi.mocked(runSaleNotificationBatch).mockResolvedValue({
    claimed: 3,
    sent: 2,
    failed: 1,
  });
  const response = await POST(request("Bearer private-token"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ claimed: 3, sent: 2, failed: 1 });
});
it("sanitizes worker errors", async () => {
  vi.mocked(runSaleNotificationBatch).mockRejectedValue(
    new Error("private webhook credential"),
  );
  const response = await POST(request("Bearer private-token"));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "sales_unavailable" });
});
