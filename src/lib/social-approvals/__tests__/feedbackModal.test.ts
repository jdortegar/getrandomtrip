// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { feedbackModal, parseSocialFeedback } from "../feedbackModal";
const config = {
  token: "token",
  secret: "secret",
  app: "A",
  team: "T",
  channel: "C",
};
const action = {
  id: "review",
  user: "U",
  messageTs: "123",
  responseUrl: "https://hooks.slack.com/actions/x",
  status: "CHANGES_REQUESTED" as const,
};
function payload() {
  return {
    type: "view_submission",
    api_app_id: "A",
    team: { id: "T" },
    user: { id: "U" },
    view: {
      callback_id: "social_feedback",
      private_metadata: feedbackModal(action, "secret").private_metadata,
      state: {
        values: {
          target: { target: { selected_option: { value: "caption" } } },
          feedback: { feedback: { value: "Use Fabrizio's exact wording." } },
        },
      },
    },
  };
}
afterEach(() => vi.useRealTimers());
it("binds feedback to source revision, actor and chosen caption-only target", () => {
  expect(parseSocialFeedback(payload(), config)).toMatchObject({
    id: "review",
    user: "U",
    messageTs: "123",
    target: "caption",
  });
});
it("rejects tampered, expired, wrong-workspace and wrong-actor submissions", () => {
  const p = payload();
  expect(
    parseSocialFeedback({ ...p, team: { id: "other" } }, config),
  ).toBeNull();
  expect(
    parseSocialFeedback({ ...p, user: { id: "other" } }, config),
  ).toBeNull();
  expect(
    parseSocialFeedback(
      {
        ...p,
        view: {
          ...p.view,
          private_metadata: p.view.private_metadata + "tamper",
        },
      },
      config,
    ),
  ).toBeNull();
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 16 * 60_000);
  expect(parseSocialFeedback(p, config)).toBeNull();
});
it("does not accept absent or oversize feedback or unrecognized targets", () => {
  const p = payload();
  p.view.state.values.feedback.feedback.value = "x".repeat(2001);
  expect(parseSocialFeedback(p, config)).toBeNull();
  p.view.state.values.feedback.feedback.value = "Valid feedback";
  p.view.state.values.target.target.selected_option.value = "publish";
  expect(parseSocialFeedback(p, config)).toBeNull();
});
