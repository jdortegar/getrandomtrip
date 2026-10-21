// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  updateMany: vi.fn(),
  findJob: vi.fn(),
  approvalUpdateMany: vi.fn(),
}));
vi.mock("next-auth", () => ({
  getServerSession: async () => ({ user: { id: "admin" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/auth/roleAccess", () => ({ hasRoleAccess: () => true }));
vi.mock("@/lib/social-approvals/dispatchSocialWorker", () => ({
  dispatchSocialWorker: vi.fn(),
}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: async () => ({ roles: ["admin"] }) },
    socialRevisionJob: { updateMany: m.updateMany, findUnique: m.findJob },
    socialApproval: { updateMany: m.approvalUpdateMany },
  },
}));
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/social-approvals/jobs/route";

const retry = () =>
  new NextRequest("https://app.test/api/admin/social-approvals/jobs", {
    method: "POST",
    headers: { origin: "https://app.test" },
    body: JSON.stringify({
      jobId: "job",
      confirmPossibleAdditionalCharge: true,
    }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SLACK_SOCIAL_PUBLISH_ENABLED", "true");
  m.updateMany.mockResolvedValue({ count: 1 });
});
afterEach(() => vi.unstubAllEnvs());

it("retries a publish only when it failed before media_publish", async () => {
  m.findJob.mockResolvedValue({ kind: "PUBLISH", reviewId: "review" });
  expect((await POST(retry())).status).toBe(200);
  expect(m.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        status: "MANUAL_RECOVERY",
        publishedMediaId: null,
        OR: [{ kind: { not: "PUBLISH" } }, { errorCode: "PUBLISH_FAILED" }],
      }),
    }),
  );
  expect(m.approvalUpdateMany).toHaveBeenCalledWith({
    where: { id: "review", status: "PUBLISH_FAILED" },
    data: { status: "PUBLISHING" },
  });
});
it("refuses to retry an unconfirmed or completed publish", async () => {
  m.updateMany.mockResolvedValue({ count: 0 });
  expect((await POST(retry())).status).toBe(409);
  expect(m.approvalUpdateMany).not.toHaveBeenCalled();
});
