/** Account-level totals for one reporting window. All values are plain counts. */
export interface InstagramTotals {
  views: number;
  reach: number;
  accountsEngaged: number;
  interactions: number;
  profileViews: number;
  /** Taps on the bio link (Graph API metric `website_clicks`). */
  linkTaps: number;
}

export type InstagramMediaKind = "REELS" | "FEED" | "STORY" | "AD";

/** One published media item with its lifetime insights (missing metrics are 0). */
export interface InstagramPostStats {
  caption: string;
  permalink: string;
  kind: InstagramMediaKind;
  /** ISO timestamp from the Graph API. */
  timestamp: string;
  views: number;
  reach: number;
  saves: number;
  shares: number;
  likes: number;
  comments: number;
}

export interface InstagramRecapWindow {
  /** First reported day, `YYYY-MM-DD` (Argentina, UTC-3). */
  start: string;
  /** Last reported day (inclusive), `YYYY-MM-DD`. */
  end: string;
  /** Unix seconds, inclusive start / exclusive end. */
  sinceSec: number;
  untilSec: number;
}

export interface InstagramRecap {
  username: string;
  current: InstagramRecapWindow;
  previous: InstagramRecapWindow;
  totals: InstagramTotals;
  previousTotals: InstagramTotals;
  followers: number;
  /** Follower change since the last stored snapshot; null on the first run. */
  followerDelta: { change: number; since: string } | null;
  /** Media published inside the current window. */
  published: InstagramPostStats[];
  /** Best media of the last 7 days by views; null when nothing was posted. */
  topPost: InstagramPostStats | null;
}

export interface InstagramRecapConfig {
  webhookUrl: string;
  /**
   * Facebook Page access token for the Page linked to the Instagram account.
   * Derived from a long-lived user token, so it does not expire.
   */
  pageToken: string;
}
