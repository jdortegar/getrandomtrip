import { graphGet } from "@/lib/instagram-recap/instagramClient";

export interface SourceMedia {
  id: string;
  caption: string;
  /** IMAGE, CAROUSEL_ALBUM or VIDEO. */
  mediaType: string;
  permalink: string;
  postedAt: Date;
  /** First image (or video thumbnail) for the Slack preview; CDN URLs expire. */
  previewUrl: string | null;
}

interface MediaRow {
  id?: string;
  caption?: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
  media_url?: string;
  thumbnail_url?: string;
}

/** Recent posts of the source account, newest first. */
export async function listSourceMedia(
  token: string,
  userId: string,
): Promise<SourceMedia[]> {
  const list = await graphGet<{ data?: MediaRow[] }>(
    `/${encodeURIComponent(userId)}/media`,
    {
      fields:
        "id,caption,media_type,permalink,timestamp,media_url,thumbnail_url",
      limit: "50",
    },
    token,
  );
  return (list.data ?? []).flatMap((m) =>
    m.id && m.permalink && m.timestamp && !Number.isNaN(Date.parse(m.timestamp))
      ? [
          {
            id: m.id,
            caption: m.caption ?? "",
            mediaType: m.media_type ?? "IMAGE",
            permalink: m.permalink,
            postedAt: new Date(m.timestamp),
            previewUrl:
              (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ??
              null,
          },
        ]
      : [],
  );
}

/** Instagram shortcode from a permalink such as https://www.instagram.com/p/ABC/. */
export function shortcodeOf(permalink: string) {
  return permalink.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[1] ?? null;
}
