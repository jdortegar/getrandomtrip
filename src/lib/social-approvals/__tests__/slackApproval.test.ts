// @vitest-environment node
import { createHmac } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import {
  approvalConfig,
  approvalMessage,
  parseApprovalAction,
  validSlackSignature,
} from "../slackApproval";
const config = {
  token: "token",
  secret: "secret",
  team: "T0ATKF9157F",
  channel: "C0CAQS7HNH4",
  app: "A0CAR605CF8",
};
const payload = () => ({
  type: "block_actions",
  api_app_id: config.app,
  team: { id: config.team },
  channel: { id: config.channel },
  user: { id: "U123", team_id: config.team },
  container: {
    type: "message",
    message_ts: "123.456",
    channel_id: config.channel,
  },
  message: { ts: "123.456" },
  response_url: "https://hooks.slack.com/actions/T123/B123/secret",
  actions: [{ action_id: "social_approve", value: "review" }],
});
afterEach(() => vi.unstubAllEnvs());
it("fails closed unless explicitly enabled with both credentials", () => {
  vi.stubEnv("SLACK_SOCIAL_APPROVALS_ENABLED", "false");
  expect(approvalConfig()).toBeNull();
  vi.stubEnv("SLACK_SOCIAL_APPROVALS_ENABLED", "true");
  vi.stubEnv("SLACK_SOCIAL_BOT_TOKEN", "");
  expect(approvalConfig()).toBeNull();
});
it("verifies original bytes, timestamp and constant-length signature", () => {
  const body = "payload=%7B%7D",
    timestamp = "1700000000";
  const signature = `v0=${createHmac("sha256", "secret").update(`v0:${timestamp}:${body}`).digest("hex")}`;
  expect(
    validSlackSignature(body, timestamp, signature, "secret", 1700000000000),
  ).toBe(true);
  expect(
    validSlackSignature(
      body + " ",
      timestamp,
      signature,
      "secret",
      1700000000000,
    ),
  ).toBe(false);
  expect(
    validSlackSignature(body, timestamp, signature, "secret", 1700000301000),
  ).toBe(false);
  expect(validSlackSignature(body, timestamp, "v0=bad", "secret")).toBe(false);
});
it("binds signed action to app, workspace, channel and source message", () => {
  expect(parseApprovalAction(payload(), config)?.status).toBe("APPROVED");
  for (const patch of [
    { api_app_id: "other" },
    { team: { id: "other" } },
    { channel: { id: "other" } },
    { user: { id: "U1", team_id: "external" } },
    { message: { ts: "other" } },
    { actions: [{ action_id: "publish", value: "review" }] },
    { response_url: "https://attacker.test/actions/x" },
  ]) {
    expect(parseApprovalAction({ ...payload(), ...patch }, config)).toBeNull();
  }
  expect(parseApprovalAction(null, config)).toBeNull();
});
it("renders exactly two review buttons only while pending, never publishing", () => {
  const row = {
    id: "review",
    revision: 2,
    caption: "Exact caption — preserved",
    imageUrl: "https://assets.test/v2.png",
    status: "PENDING",
    decidedBy: null,
  };
  const message = approvalMessage(row);
  expect(message.blocks.at(-1)).toMatchObject({
    type: "actions",
    elements: [
      { action_id: "social_approve" },
      { action_id: "social_changes" },
    ],
  });
  expect(JSON.stringify(message)).toContain(row.caption);
  expect(
    approvalMessage({ ...row, status: "CHANGES_REQUESTED" }).blocks.some(
      (b) => b.type === "actions",
    ),
  ).toBe(false);
  expect(
    approvalMessage({ ...row, status: "CHANGES_REQUESTED" }).text,
  ).toContain("thread");
});
it("shows every slide of a carousel review in order", () => {
  const message = approvalMessage({
    id: "review",
    revision: 1,
    caption: "Caption",
    imageUrl: "https://a.test/1.png",
    imageUrls: ["https://a.test/1.png", "https://a.test/2.png"],
    status: "PENDING",
    decidedBy: null,
  });
  const images = message.blocks.filter((b) => b.type === "image");
  expect(images.map((b) => (b as { image_url: string }).image_url)).toEqual([
    "https://a.test/1.png",
    "https://a.test/2.png",
  ]);
});
it("falls back to the single image for reviews without slides", () => {
  const message = approvalMessage({
    id: "review",
    revision: 1,
    caption: "Caption",
    imageUrl: "https://a.test/only.png",
    imageUrls: [],
    status: "PENDING",
    decidedBy: null,
  });
  expect(message.blocks.filter((b) => b.type === "image")).toHaveLength(1);
});
