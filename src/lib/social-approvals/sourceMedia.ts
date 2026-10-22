import { graphGet } from "@/lib/instagram-recap/instagramClient";
import { readBoundedImage } from "./socialAssets";

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

const PAGE_LIMIT = 10;

/** Every post of the source account, oldest first (the order to mirror). */
export async function listSourceMedia(
  token: string,
  userId: string,
): Promise<SourceMedia[]> {
  const rows: MediaRow[] = [];
  let after: string | undefined;
  for (let page = 0; page < PAGE_LIMIT; page += 1) {
    const list = await graphGet<{
      data?: MediaRow[];
      paging?: { cursors?: { after?: string }; next?: string };
    }>(
      `/${encodeURIComponent(userId)}/media`,
      {
        fields:
          "id,caption,media_type,permalink,timestamp,media_url,thumbnail_url",
        limit: "50",
        ...(after ? { after } : {}),
      },
      token,
    );
    rows.push(...(list.data ?? []));
    after = list.paging?.next ? list.paging.cursors?.after : undefined;
    if (!after) break;
  }
  return rows
    .flatMap((m) =>
      m.id &&
      m.permalink &&
      m.timestamp &&
      !Number.isNaN(Date.parse(m.timestamp))
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
    )
    .sort((x, y) => x.postedAt.getTime() - y.postedAt.getTime());
}

/** Instagram shortcode from a permalink such as https://www.instagram.com/p/ABC/. */
export function shortcodeOf(permalink: string) {
  return permalink.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[1] ?? null;
}

interface SlideRow {
  media_type?: string;
  media_url?: string;
  children?: { data?: { media_type?: string; media_url?: string }[] };
}

/** Image URLs of a source post in slide order. Video slides are unsupported. */
export async function getSourceSlides(token: string, mediaId: string) {
  const media = await graphGet<SlideRow>(
    `/${encodeURIComponent(mediaId)}`,
    { fields: "media_type,media_url,children{media_type,media_url}" },
    token,
  );
  const items =
    media.media_type === "CAROUSEL_ALBUM"
      ? (media.children?.data ?? [])
      : [{ media_type: media.media_type, media_url: media.media_url }];
  if (!items.length || items.length > 10)
    throw new Error("SOURCE_MEDIA_INVALID");
  return items.map((item) => {
    if (item.media_type !== "IMAGE")
      throw new Error("SOURCE_VIDEO_UNSUPPORTED");
    if (!item.media_url) throw new Error("SOURCE_MEDIA_INVALID");
    return item.media_url;
  });
}

const CDN_HOSTS = [".cdninstagram.com", ".fbcdn.net"];

/** Downloads one source slide from Instagram's CDN only. */
export async function downloadSourceImage(mediaUrl: string) {
  const url = new URL(mediaUrl);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !CDN_HOSTS.some((host) => url.hostname.endsWith(host))
  )
    throw new Error("UNTRUSTED_ASSET");
  return readBoundedImage(
    await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    }),
  );
}
