import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const passes = vi.hoisted(() => ({ deadline: vi.fn(), reinvite: vi.fn(), reminder: vi.fn(), remainder: vi.fn() }));
vi.mock("../passes", () => ({
  runDeadlinePass: passes.deadline,
  runReinvitePass: passes.reinvite,
  runTopUpReminderPass: passes.reminder,
  runRemainderPass: passes.remainder,
}));
const deployment = vi.hoisted(() => ({ production: true }));
vi.mock("@/lib/deployment", () => ({ isProductionDeployment: () => deployment.production }));
import { POST } from "../route";

const request = (secret?: string) =>
  new Request("http://localhost/api/internal/split-payment-deadline", {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });

describe("POST /api/internal/split-payment-deadline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    deployment.production = true;
    vi.stubEnv("CRON_SECRET", "cron-secret");
    passes.deadline.mockResolvedValue({ confirmed: 1, skipped: 0, failed: 0 });
    passes.reinvite.mockResolvedValue({ trips: 2 });
    passes.reminder.mockResolvedValue({ reminded: 1, failed: 0 });
    passes.remainder.mockResolvedValue({ closed: 1, remainders: 1, failed: 0 });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("is hidden outside production", async () => {
    deployment.production = false;
    expect((await POST(request("cron-secret"))).status).toBe(404);
    expect(passes.deadline).not.toHaveBeenCalled();
  });

  it("requires the cron secret", async () => {
    expect((await POST(request())).status).toBe(401);
    expect((await POST(request("wrong"))).status).toBe(401);
    expect(passes.deadline).not.toHaveBeenCalled();
  });

  it("runs both passes and reports a failing one without skipping the other", async () => {
    passes.deadline.mockRejectedValue(new Error("db down"));
    const res = await POST(request("cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      deadline: { confirmed: 0, skipped: 0, failed: 0 },
      reinvite: { trips: 2 },
      topUpReminder: { reminded: 1, failed: 0 },
      remainder: { closed: 1, remainders: 1, failed: 0 },
      errors: ["Deadline pass failed: db down"],
    });
  });
});
