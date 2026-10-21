export interface SourceContent {
  id: string;
  caption: string;
  permalink: string;
  mediaType: string;
  status: string;
}

const STATUS: Record<string, string> = {
  ANNOUNCED: "New post. Translate it to start the English review.",
  ANNOUNCING: "New post. Translate it to start the English review.",
  TRANSLATION_QUEUED:
    "Translation queued. The English draft will appear below.",
  TRANSLATED: "English draft posted for review.",
  TRANSLATION_FAILED:
    "Translation needs admin attention. Nothing was published.",
  UNSUPPORTED:
    "Video posts can't be translated automatically. Post it on @getrandomtrip.en by hand, then mark it as posted to continue.",
  SYNCED: "Marked as posted manually on @getrandomtrip.en.",
  PUBLISHED: "Published in English on @getrandomtrip.en.",
};

function excerpt(caption: string) {
  const text = caption.trim() || "(no caption)";
  return text.length > 600 ? `${text.slice(0, 600)}…` : text;
}

/** Slack card announcing a Spanish @getrandomtrip.es post. */
export function sourceMessage(
  source: SourceContent,
  previewUrl?: string | null,
  actor?: string | null,
  /** Spanish posts still waiting after this one (shown when announcing). */
  behind?: number,
) {
  const canTranslate =
    source.status === "ANNOUNCED" || source.status === "ANNOUNCING";
  const canMarkPosted = [
    "ANNOUNCED",
    "ANNOUNCING",
    "UNSUPPORTED",
    "TRANSLATION_FAILED",
    "TRANSLATED",
  ].includes(source.status);
  const queue =
    behind === undefined
      ? ""
      : behind > 0
        ? `\n${behind} more Spanish ${behind === 1 ? "post" : "posts"} waiting after this one, in order.`
        : "\nThis is the latest Spanish post.";
  const status = `${STATUS[source.status] ?? "Unavailable."}${actor ? ` (<@${actor}>)` : ""}`;
  return {
    text: `New @getrandomtrip.es post: ${source.permalink}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*@getrandomtrip.es* · <${source.permalink}|View on Instagram>\n${status}${queue}`,
        },
      },
      ...(previewUrl
        ? [
            {
              type: "image",
              image_url: previewUrl,
              alt_text: "Spanish post preview",
            },
          ]
        : []),
      {
        type: "section",
        text: { type: "plain_text", text: excerpt(source.caption) },
      },
      ...(canMarkPosted
        ? [
            {
              type: "actions",
              elements: [
                ...(canTranslate
                  ? [
                      {
                        type: "button",
                        action_id: "social_translate",
                        text: {
                          type: "plain_text",
                          text: "Translate this post",
                        },
                        style: "primary",
                        value: source.id,
                      },
                    ]
                  : []),
                {
                  type: "button",
                  action_id: "social_mark_posted",
                  text: { type: "plain_text", text: "Mark as posted manually" },
                  value: source.id,
                  confirm: {
                    title: { type: "plain_text", text: "Already on English?" },
                    text: {
                      type: "plain_text",
                      text: "Only confirm if this post is already on @getrandomtrip.en. The next Spanish post will be offered right after.",
                    },
                    confirm: { type: "plain_text", text: "Mark as posted" },
                    deny: { type: "plain_text", text: "Cancel" },
                  },
                },
              ],
            },
          ]
        : []),
    ],
  };
}
