// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  session: vi.fn(),
  user: vi.fn(),
  resolve: vi.fn(),
  create: vi.fn(),
  dispatch: vi.fn(),
  tasks: [] as (() => Promise<void>)[],
}));
vi.mock("next-auth", () => ({ getServerSession: m.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: m.user } } }));
vi.mock("@/lib/social-approvals/importInstagram", async (original) => ({
  ...(await original<
    typeof import("@/lib/social-approvals/importInstagram")
  >()),
  resolveOwnedInstagramPost: m.resolve,
}));
vi.mock("@/lib/db/importSocialReview", () => ({
  importSocialReview: m.create,
}));
vi.mock("@/lib/social-approvals/dispatchSocialWorker", () => ({
  dispatchSocialWorker: m.dispatch,
}));
vi.mock("@/lib/social-approvals/slackApproval", () => ({
  approvalConfig: () => ({}),
}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: (task: () => Promise<void>) => m.tasks.push(task),
}));
import { NextRequest } from "next/server";
import { POST } from "../route";
import { POST as manualReview } from "../../route";
function request(
  body: unknown = { instagramUrl: "https://www.instagram.com/p/De0IMw8jOGl/" },
  origin = "https://app.test",
) {
  return new NextRequest("https://app.test/api/admin/social-approvals/import", {
    method: "POST",
    headers: { Origin: origin },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  m.tasks.length = 0;
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "true");
  m.session.mockResolvedValue({ user: { id: "admin" } });
  m.user.mockResolvedValue({ roles: ["ADMIN"] });
  m.resolve.mockResolvedValue({ id: "ig123" });
  m.create.mockResolvedValue({
    sourceId: "source",
    jobId: "job",
    created: true,
  });
});
it("rejects missing session, non-admin and cross-origin requests before Meta lookup", async () => {
  m.session.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(401);
  m.session.mockResolvedValue({ user: { id: "admin" } });
  m.user.mockResolvedValue({ roles: ["TRAVELER"] });
  expect((await POST(request())).status).toBe(403);
  m.user.mockResolvedValue({ roles: ["ADMIN"] });
  expect((await POST(request(undefined, "https://attacker.test"))).status).toBe(
    403,
  );
  expect(m.resolve).not.toHaveBeenCalled();
});
it("queues selected exact copy and stops at approval without Meta publication", async () => {
  const response = await POST(
    request({
      instagramUrl: "https://www.instagram.com/p/De0IMw8jOGl/",
      useReviewedExample: true,
    }),
  );
  expect(response.status).toBe(202);
  expect(await response.json()).toMatchObject({
    approvalRequired: true,
    publishingAllowed: false,
  });
  expect(m.create).toHaveBeenCalledWith(
    { id: "ig123" },
    "admin",
    expect.objectContaining({ artworkHeadline: "GET LOST TO FIND YOURSELF" }),
  );
  expect(m.dispatch).not.toHaveBeenCalled();
  await m.tasks[0]();
  expect(m.dispatch).toHaveBeenCalledOnce();
});
it("fails closed on configuration and mismatched reviewed assignment", async () => {
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "false");
  expect((await POST(request())).status).toBe(503);
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "true");
  expect(
    (
      await POST(
        request({
          instagramUrl: "https://www.instagram.com/p/OTHER123/",
          useReviewedExample: true,
        }),
      )
    ).status,
  ).toBe(400);
  expect(m.resolve).not.toHaveBeenCalled();
});

it("rejects a manual review whose caption contradicts the exact locked caption", async () => {
  const response = await manualReview(
    request({
      reviewKey: "manual-review",
      requestId: "unique-manual-request",
      caption: "Caption A",
      copyLocks: { caption: "Caption B" },
      imageUrl: "https://app.test/image.png",
    }),
  );
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "Locked caption must match the submitted caption exactly",
  });
});
