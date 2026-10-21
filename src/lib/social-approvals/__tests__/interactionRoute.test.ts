// @vitest-environment node
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: {
    socialApproval: { findUnique: vi.fn() },
    socialSource: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/db/socialRevisionJobs", () => ({
  queueSocialRevision: vi.fn(),
  queueSocialTranslation: vi.fn(),
  queueSocialPublish: vi.fn(),
}));
vi.mock("@/lib/social-approvals/dispatchSocialWorker", () => ({
  dispatchSocialWorker: vi.fn(),
}));
const mocks = vi.hoisted(() => ({
  decide: vi.fn(),
  tasks: [] as (() => Promise<void>)[],
}));
vi.mock("@/lib/db/socialApprovals", () => ({
  decideSocialApproval: mocks.decide,
}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: (task: () => Promise<void>) => mocks.tasks.push(task),
}));
vi.mock("../refreshSocialMessage", () => ({
  refreshSocialMessage: vi.fn(),
  refreshSourceMessage: vi.fn(),
}));
import {
  refreshSocialMessage,
  refreshSourceMessage,
} from "../refreshSocialMessage";
import { feedbackModal } from "../feedbackModal";
import { prisma } from "@/lib/prisma";
import {
  queueSocialPublish,
  queueSocialRevision,
  queueSocialTranslation,
} from "@/lib/db/socialRevisionJobs";
import { dispatchSocialWorker } from "../dispatchSocialWorker";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/slack/social-approvals/route";
const payload = {
  type: "block_actions",
  api_app_id: "A0CAR605CF8",
  team: { id: "T0ATKF9157F" },
  channel: { id: "C0CAQS7HNH4" },
  user: { id: "U1" },
  container: {
    type: "message",
    channel_id: "C0CAQS7HNH4",
    message_ts: "123.456",
  },
  message: { ts: "123.456" },
  actions: [{ action_id: "social_approve", value: "review" }],
  response_url: "https://hooks.slack.com/actions/T123/B123/secret",
};
function request(body: unknown = payload, signed = true) {
  const raw = new URLSearchParams({ payload: JSON.stringify(body) }).toString();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return new NextRequest("https://test/api/slack/social-approvals", {
    method: "POST",
    body: raw,
    headers: {
      "x-slack-request-timestamp": timestamp,
      "x-slack-signature": signed
        ? `v0=${createHmac("sha256", "secret").update(`v0:${timestamp}:${raw}`).digest("hex")}`
        : "bad",
    },
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.tasks.length = 0;
  vi.stubEnv("SLACK_SOCIAL_APPROVALS_ENABLED", "true");
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "false");
  vi.stubEnv("SLACK_SOCIAL_BOT_TOKEN", "token");
  vi.stubEnv("SLACK_SOCIAL_SIGNING_SECRET", "secret");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => Response.json({ ok: true })),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("fails closed when disabled and rejects unsigned requests before DB", async () => {
  expect((await POST(request(payload, false))).status).toBe(401);
  vi.stubEnv("SLACK_SOCIAL_APPROVALS_ENABLED", "false");
  expect((await POST(request())).status).toBe(503);
  expect(mocks.decide).not.toHaveBeenCalled();
});
it("acknowledges only after persistence and refreshes via validated response URL", async () => {
  mocks.decide.mockResolvedValue({
    id: "review",
    revision: 1,
    caption: "caption",
    imageUrl: "https://assets.test/v1.png",
    status: "APPROVED",
    decidedBy: "U1",
  });
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("");
  expect(fetch).not.toHaveBeenCalled();
  await mocks.tasks[0]();
  expect(fetch).toHaveBeenCalledWith(
    payload.response_url,
    expect.objectContaining({
      redirect: "error",
      body: expect.stringContaining('"replace_original":true'),
    }),
  );
});
it("returns stale notice without replacing original and surfaces DB failure", async () => {
  mocks.decide.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(200);
  await mocks.tasks[0]();
  expect(fetch).toHaveBeenCalledWith(
    payload.response_url,
    expect.objectContaining({
      body: expect.stringContaining('"response_type":"ephemeral"'),
    }),
  );
  mocks.decide.mockRejectedValue(new Error("DB unavailable"));
  expect((await POST(request())).status).toBe(503);
});

it("Request changes opens a feedback modal without committing a decision", async () => {
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "true");
  vi.mocked(prisma.socialApproval.findUnique).mockResolvedValue({
    id: "review",
    messageTs: "123.456",
    status: "PENDING",
  } as never);
  expect(
    (
      await POST(
        request({
          ...payload,
          trigger_id: "trigger",
          actions: [{ action_id: "social_changes", value: "review" }],
        }),
      )
    ).status,
  ).toBe(200);
  expect(fetch).toHaveBeenCalledWith(
    "https://slack.com/api/views.open",
    expect.objectContaining({
      body: expect.stringContaining('"callback_id":"social_feedback"'),
    }),
  );
  expect(mocks.decide).not.toHaveBeenCalled();
});
it("accepted modal feedback removes old buttons after ACK and dispatches durable work", async () => {
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "true");
  vi.mocked(queueSocialRevision).mockResolvedValue("queued");
  const row = {
    id: "review",
    messageTs: "123.456",
    status: "CHANGES_REQUESTED",
  };
  vi.mocked(prisma.socialApproval.findUnique).mockResolvedValue(row as never);
  const view = feedbackModal(
    {
      id: "review",
      user: "U1",
      messageTs: "123.456",
      status: "CHANGES_REQUESTED",
      responseUrl: payload.response_url,
    },
    "secret",
  );
  const submission = {
    type: "view_submission",
    api_app_id: payload.api_app_id,
    team: payload.team,
    user: payload.user,
    view: {
      ...view,
      state: {
        values: {
          feedback: { feedback: { value: "Use Fabrizio wording" } },
          target: { target: { selected_option: { value: "caption" } } },
        },
      },
    },
  };
  const response = await POST(request(submission));
  expect(await response.json()).toEqual({ response_action: "clear" });
  expect(refreshSocialMessage).not.toHaveBeenCalled();
  await mocks.tasks[0]();
  expect(refreshSocialMessage).toHaveBeenCalledWith(row, "REVISION_QUEUED");
  expect(dispatchSocialWorker).toHaveBeenCalledOnce();
});

const translateClick = {
  ...payload,
  actions: [{ action_id: "social_translate", value: "src" }],
};
it("Translate this post queues one translation, marks the card and dispatches the worker", async () => {
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "true");
  vi.mocked(queueSocialTranslation).mockResolvedValue("queued");
  vi.mocked(prisma.socialSource.findUnique).mockResolvedValue({
    id: "src",
    status: "TRANSLATION_QUEUED",
  } as never);
  expect((await POST(request(translateClick))).status).toBe(200);
  expect(queueSocialTranslation).toHaveBeenCalledWith({
    sourceId: "src",
    user: "U1",
    messageTs: "123.456",
  });
  await Promise.all(mocks.tasks.map((task) => task()));
  expect(refreshSourceMessage).toHaveBeenCalledWith(
    expect.objectContaining({ id: "src" }),
    "TRANSLATION_QUEUED",
    "U1",
  );
  expect(dispatchSocialWorker).toHaveBeenCalledOnce();
  expect(mocks.decide).not.toHaveBeenCalled();
});
it("tells only the clicker when translation is over budget or disabled", async () => {
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "true");
  vi.mocked(queueSocialTranslation).mockResolvedValue("budget");
  expect((await POST(request(translateClick))).status).toBe(200);
  await Promise.all(mocks.tasks.map((task) => task()));
  const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
  expect(body).toMatchObject({ response_type: "ephemeral" });
  expect(body.text).toContain("Daily AI limit");
  expect(dispatchSocialWorker).not.toHaveBeenCalled();
  vi.stubEnv("SLACK_SOCIAL_AI_ENABLED", "false");
  vi.mocked(queueSocialTranslation).mockClear();
  await POST(request(translateClick));
  expect(queueSocialTranslation).not.toHaveBeenCalled();
});

const publishClick = {
  ...payload,
  actions: [{ action_id: "social_publish", value: "review" }],
};
it("Publish queues one publication of the approved review and dispatches the worker", async () => {
  vi.stubEnv("SLACK_SOCIAL_PUBLISH_ENABLED", "true");
  vi.mocked(queueSocialPublish).mockResolvedValue("queued");
  vi.mocked(prisma.socialApproval.findUnique).mockResolvedValue({
    id: "review",
    status: "PUBLISHING",
  } as never);
  expect((await POST(request(publishClick))).status).toBe(200);
  expect(queueSocialPublish).toHaveBeenCalledWith({
    reviewId: "review",
    user: "U1",
    messageTs: "123.456",
  });
  await Promise.all(mocks.tasks.map((task) => task()));
  expect(refreshSocialMessage).toHaveBeenCalledWith(
    expect.objectContaining({ id: "review" }),
    "PUBLISHING",
  );
  expect(dispatchSocialWorker).toHaveBeenCalledOnce();
  expect(mocks.decide).not.toHaveBeenCalled();
});
it("never queues a publication while publishing is disabled", async () => {
  vi.stubEnv("SLACK_SOCIAL_PUBLISH_ENABLED", "false");
  expect((await POST(request(publishClick))).status).toBe(200);
  expect(queueSocialPublish).not.toHaveBeenCalled();
  await Promise.all(mocks.tasks.map((task) => task()));
  expect(dispatchSocialWorker).not.toHaveBeenCalled();
});
