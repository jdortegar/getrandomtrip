import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("../passes", () => ({ runPass2: vi.fn() }));
vi.mock("../assignmentReminders", () => ({ runAssignmentReminders: vi.fn() }));
import { runPass2 } from "../passes";
import { runAssignmentReminders } from "../assignmentReminders";
import { POST } from "../route";
import { NextRequest } from "next/server";
const request = (secret?: string) =>
  new NextRequest("http://localhost/api/internal/destination-reveal", {
    method: "POST",
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
const empty = { queued: 0, accepted: 0, failed: 0, skipped: 0 };
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "test");
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.mocked(runPass2).mockResolvedValue({ revealed: 1 });
  vi.mocked(runAssignmentReminders).mockResolvedValue(empty);
});
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, "wrong"])(
  "rejects unauthorized requests before side effects: %s",
  async (secret) => {
    expect((await POST(request(secret))).status).toBe(401);
    expect(runPass2).not.toHaveBeenCalled();
    expect(runAssignmentReminders).not.toHaveBeenCalled();
  },
);
it("finishes automatic reveal before awaiting admin mail and returns acceptance counts", async () => {
  vi.mocked(runAssignmentReminders).mockImplementation(async () => {
    expect(runPass2).toHaveBeenCalledOnce();
    return { ...empty, queued: 3, accepted: 2, failed: 1 };
  });
  const response = await POST(request("test"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    pass1: { ...empty, queued: 3, accepted: 2, failed: 1 },
    pass2: { revealed: 1 },
    errors: [],
  });
});
it("keeps independent passes when the reveal query fails", async () => {
  vi.mocked(runPass2).mockRejectedValue(new Error("reveal query failed"));
  const response = await POST(request("test"));
  expect(runAssignmentReminders).toHaveBeenCalledOnce();
  expect(await response.json()).toMatchObject({
    errors: ["Pass 2 failed: reveal query failed"],
  });
});
it("reports reminder failure after automatic reveal has already completed", async () => {
  vi.mocked(runAssignmentReminders).mockRejectedValue(
    new Error("reminder table unavailable"),
  );
  const response = await POST(request("test"));
  expect(runPass2).toHaveBeenCalledOnce();
  expect(await response.json()).toMatchObject({
    pass2: { revealed: 1 },
    errors: ["Pass 1 failed: reminder table unavailable"],
  });
});

it.each([undefined, "nonproduction", "unknown"])(
  "preserves production isolation before either pass: %s",
  async (environment) => {
    vi.stubEnv("RT_DEPLOY_ENV", environment);
    const response = await POST(request("test"));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
    expect(runPass2).not.toHaveBeenCalled();
    expect(runAssignmentReminders).not.toHaveBeenCalled();
  },
);
