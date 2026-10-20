/**
 * Pure segment constants shared by the server, the admin UI and scripts
 * (odd/tasks/email-campaign-segments.md, decision 3). No database or
 * environment imports here.
 */
import type { ContactSource } from "../../types/emailCampaign";

/**
 * Ids of the system segments seeded by the
 * `20261019120000_email_campaign_segments` migration. Keep them in sync.
 */
export const SYSTEM_SEGMENT_IDS: Record<ContactSource, string> = {
  WAITLIST: "seg_waitlist",
  FRIENDS_FAMILY: "seg_friends_family",
};

export const MAX_SEGMENT_NAME_LENGTH = 60;
export const MAX_SEGMENT_DESCRIPTION_LENGTH = 300;

/** Trimmed, non-empty, de-duplicated ids in first-seen order. */
export function normalizeSegmentIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}
