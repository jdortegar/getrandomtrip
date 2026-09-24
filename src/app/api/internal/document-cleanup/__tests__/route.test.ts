import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/db/runDocumentCleanupBatch", () => ({
  runDocumentCleanupBatch: vi.fn(),
}));
import { runDocumentCleanupBatch } from "@/lib/db/runDocumentCleanupBatch";
import { POST } from "../route";
const request = (token?: string) =>
  new Request("https://site.test/api/internal/document-cleanup", {
    method: "POST",
    headers: token ? { Authorization: token } : {},
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "private-token");
});
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, "Bearer wrong", "private-token"])(
  "rejects missing/wrong credentials before cleanup (%s)",
  async (token) => {
    const response = await POST(request(token));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(runDocumentCleanupBatch).not.toHaveBeenCalled();
  },
);
it("fails closed when deployment secret is absent", async () => {
  vi.stubEnv("CRON_SECRET", "");
  expect((await POST(request("Bearer private-token"))).status).toBe(401);
  expect(runDocumentCleanupBatch).not.toHaveBeenCalled();
});
it("runs one bounded batch and returns counts without storage identities", async () => {
  vi.mocked(runDocumentCleanupBatch).mockResolvedValue({
    claimed: 3,
    swept: 2,
    failed: 1,
  });
  const response = await POST(request("Bearer private-token"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ claimed: 3, swept: 2, failed: 1 });
  expect(runDocumentCleanupBatch).toHaveBeenCalledOnce();
});
it("sanitizes worker failure", async () => {
  vi.mocked(runDocumentCleanupBatch).mockRejectedValue(
    new Error("private database url key"),
  );
  const response = await POST(request("Bearer private-token"));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "cleanup_unavailable" });
});
