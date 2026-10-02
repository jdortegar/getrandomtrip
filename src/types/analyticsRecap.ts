/** Metrics summed over one GA4 date range. All values are plain counts. */
export interface RecapTotals {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
}

/** One row of a "top N" breakdown (country, channel group, page path). */
export interface RecapRankedItem {
  label: string;
  value: number;
}

/** Key conversion events for the reported day. Missing events are 0. */
export interface RecapActions {
  signUps: number;
  leads: number;
  waitlist: number;
  purchases: number;
}

export interface DailyRecap {
  /** Reported day, `YYYY-MM-DD` in the GA4 property timezone. */
  date: string;
  /** Same weekday one week earlier, `YYYY-MM-DD`. */
  compareDate: string;
  current: RecapTotals;
  previous: RecapTotals;
  countries: RecapRankedItem[];
  channels: RecapRankedItem[];
  pages: RecapRankedItem[];
  actions: RecapActions;
}

export interface SlackRecapPayload {
  text: string;
  blocks: { type: "section"; text: { type: "mrkdwn"; text: string } }[];
  unfurl_links: false;
  unfurl_media: false;
}

export interface Ga4Config {
  propertyId: string;
  clientEmail: string;
  /** PEM private key with real newlines (already unescaped). */
  privateKey: string;
}

export interface AnalyticsRecapConfig {
  ga4: Ga4Config;
  webhookUrl: string;
}
