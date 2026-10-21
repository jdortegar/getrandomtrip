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
  UNSUPPORTED: "Video posts can't be translated automatically.",
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
) {
  const canTranslate =
    source.status === "ANNOUNCED" || source.status === "ANNOUNCING";
  const status = `${STATUS[source.status] ?? "Unavailable."}${actor ? ` (<@${actor}>)` : ""}`;
  return {
    text: `New @getrandomtrip.es post: ${source.permalink}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*@getrandomtrip.es* · <${source.permalink}|View on Instagram>\n${status}`,
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
      ...(canTranslate
        ? [
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  action_id: "social_translate",
                  text: { type: "plain_text", text: "Translate this post" },
                  style: "primary",
                  value: source.id,
                },
              ],
            },
          ]
        : []),
    ],
  };
}
