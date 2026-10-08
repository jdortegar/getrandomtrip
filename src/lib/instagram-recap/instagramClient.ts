import type {
  InstagramMediaKind,
  InstagramPostStats,
  InstagramTotals,
} from "@/types/instagramRecap";

const GRAPH = "https://graph.facebook.com/v23.0";
const TIMEOUT_MS = 8_000;
const ACCOUNT_METRICS = [
  "views",
  "reach",
  "accounts_engaged",
  "total_interactions",
  "profile_views",
  "website_clicks",
] as const;
const MEDIA_METRICS = ["views", "reach", "saved", "shares"] as const;
const KINDS: readonly InstagramMediaKind[] = ["REELS", "FEED", "STORY", "AD"];

/**
 * Errors are deliberately generic: the token travels in the query string, so
 * URLs and upstream bodies are never logged or rethrown.
 */
async function graphGet<T>(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<T> {
  try {
    const url = new URL(`${GRAPH}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("access_token", token);
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error("rejected");
    }
    return (await response.json()) as T;
  } catch {
    throw new Error("instagram_request_failed");
  }
}

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export interface InstagramProfile {
  userId: string;
  username: string;
  followers: number;
}

/**
 * Reads the Instagram professional account linked to the Facebook Page that
 * owns the token (Instagram API with Facebook Login; Page tokens never expire).
 */
export async function getProfile(token: string): Promise<InstagramProfile> {
  const data = await graphGet<{
    instagram_business_account?: {
      id?: string;
      username?: string;
      followers_count?: number;
    };
  }>(
    "/me",
    { fields: "instagram_business_account{id,username,followers_count}" },
    token,
  );
  const ig = data.instagram_business_account;
  if (!ig?.id || !ig.username) throw new Error("instagram_request_failed");
  return {
    userId: ig.id,
    username: ig.username,
    followers: num(ig.followers_count),
  };
}

interface InsightRow {
  name?: string;
  total_value?: { value?: number };
  values?: { value?: number }[];
}

const insightValue = (row: InsightRow) =>
  num(row.total_value?.value ?? row.values?.[0]?.value);

export async function getAccountTotals(
  token: string,
  userId: string,
  sinceSec: number,
  untilSec: number,
): Promise<InstagramTotals> {
  const data = await graphGet<{ data?: InsightRow[] }>(
    `/${encodeURIComponent(userId)}/insights`,
    {
      metric: ACCOUNT_METRICS.join(","),
      period: "day",
      metric_type: "total_value",
      since: String(sinceSec),
      until: String(untilSec),
    },
    token,
  );
  const byName = new Map(
    (data.data ?? []).map((row) => [row.name ?? "", insightValue(row)]),
  );
  return {
    views: byName.get("views") ?? 0,
    reach: byName.get("reach") ?? 0,
    accountsEngaged: byName.get("accounts_engaged") ?? 0,
    interactions: byName.get("total_interactions") ?? 0,
    profileViews: byName.get("profile_views") ?? 0,
    linkTaps: byName.get("website_clicks") ?? 0,
  };
}

interface MediaRow {
  id?: string;
  caption?: string;
  media_product_type?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

/** Recent media, newest first. Insights failures for one item fall back to 0s. */
export async function getRecentMedia(
  token: string,
  userId: string,
  sinceMs: number,
): Promise<InstagramPostStats[]> {
  const list = await graphGet<{ data?: MediaRow[] }>(
    `/${encodeURIComponent(userId)}/media`,
    {
      fields:
        "id,caption,media_product_type,permalink,timestamp,like_count,comments_count",
      limit: "20",
    },
    token,
  );
  const recent = (list.data ?? []).filter(
    (m) => m.id && m.timestamp && Date.parse(m.timestamp) >= sinceMs,
  );
  return Promise.all(
    recent.map(async (m): Promise<InstagramPostStats> => {
      let byName = new Map<string, number>();
      try {
        const insights = await graphGet<{ data?: InsightRow[] }>(
          `/${encodeURIComponent(m.id ?? "")}/insights`,
          { metric: MEDIA_METRICS.join(",") },
          token,
        );
        byName = new Map(
          (insights.data ?? []).map((r) => [r.name ?? "", insightValue(r)]),
        );
      } catch {
        // Keep the post with zeroed insights rather than dropping the recap.
      }
      const kind = KINDS.find((k) => k === m.media_product_type) ?? "FEED";
      return {
        caption: m.caption ?? "",
        permalink: m.permalink ?? "",
        kind,
        timestamp: m.timestamp ?? "",
        views: byName.get("views") ?? 0,
        reach: byName.get("reach") ?? 0,
        saves: byName.get("saved") ?? 0,
        shares: byName.get("shares") ?? 0,
        likes: num(m.like_count),
        comments: num(m.comments_count),
      };
    }),
  );
}
