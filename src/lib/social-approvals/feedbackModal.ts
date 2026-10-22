import { createHmac, timingSafeEqual } from "node:crypto";
import type { ApprovalAction } from "./slackApproval";
import { approvalConfig } from "./slackApproval";

interface FeedbackContext {
  id: string;
  user: string;
  messageTs: string;
  expires: number;
}
export interface SocialFeedback {
  id: string;
  user: string;
  messageTs: string;
  feedback: string;
  target: "caption" | "image" | "both";
}
function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function feedbackModal(action: ApprovalAction, secret: string) {
  const data = Buffer.from(
    JSON.stringify({
      id: action.id,
      user: action.user,
      messageTs: action.messageTs,
      expires: Date.now() + 15 * 60_000,
    }),
  ).toString("base64url");
  return {
    type: "modal",
    callback_id: "social_feedback",
    private_metadata: `${data}.${sign(data, secret)}`,
    title: { type: "plain_text", text: "Request changes" },
    submit: { type: "plain_text", text: "Generate new draft" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text: "Describe the changes. AI will create a new draft for approval, never publish it. Artwork edits preserve the photo and layout as closely as possible; always review the result.",
        },
      },
      {
        type: "input",
        block_id: "target",
        label: { type: "plain_text", text: "What needs changing?" },
        element: {
          type: "static_select",
          action_id: "target",
          options: [
            ["caption", "Caption only"],
            ["image", "Artwork only"],
            ["both", "Caption and artwork"],
          ].map(([value, text]) => ({
            text: { type: "plain_text", text },
            value,
          })),
        },
      },
      {
        type: "input",
        block_id: "feedback",
        label: { type: "plain_text", text: "Requested changes" },
        element: {
          type: "plain_text_input",
          action_id: "feedback",
          multiline: true,
          min_length: 3,
          max_length: 2000,
        },
      },
    ],
  };
}
export function parseSocialFeedback(
  payload: unknown,
  config: NonNullable<ReturnType<typeof approvalConfig>>,
): SocialFeedback | null {
  const p = payload as {
    type?: string;
    api_app_id?: string;
    team?: { id?: string };
    user?: { id?: string; team_id?: string };
    view?: {
      callback_id?: string;
      private_metadata?: string;
      state?: {
        values?: Record<
          string,
          Record<
            string,
            { value?: string; selected_option?: { value?: string } }
          >
        >;
      };
    };
  };
  if (
    p?.type !== "view_submission" ||
    p.api_app_id !== config.app ||
    p.team?.id !== config.team ||
    !p.user?.id ||
    (p.user.team_id && p.user.team_id !== config.team) ||
    p.view?.callback_id !== "social_feedback"
  )
    return null;
  try {
    const [data, signature] = (p.view.private_metadata ?? "").split(".");
    const expected = sign(data, config.secret);
    if (
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return null;
    const ctx = JSON.parse(
      Buffer.from(data, "base64url").toString(),
    ) as FeedbackContext;
    const feedback = p.view.state?.values?.feedback?.feedback?.value?.trim();
    const target = p.view.state?.values?.target?.target?.selected_option?.value;
    if (
      ctx.user !== p.user.id ||
      ctx.expires < Date.now() ||
      !ctx.id ||
      !ctx.messageTs ||
      !feedback ||
      feedback.length < 3 ||
      feedback.length > 2000 ||
      !["caption", "image", "both"].includes(target ?? "")
    )
      return null;
    return {
      id: ctx.id,
      user: ctx.user,
      messageTs: ctx.messageTs,
      feedback,
      target: target as SocialFeedback["target"],
    };
  } catch {
    return null;
  }
}
