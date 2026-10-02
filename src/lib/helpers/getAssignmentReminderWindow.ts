import { getRevealAt } from "@/lib/helpers/getRevealCountdown";

export interface AssignmentReminderWindow {
  milestoneHours: 24 | 48 | 72;
  revealAt: Date;
  expiresAt: Date;
}

/** Only the newest due milestone is actionable; never catch up obsolete notices. */
export function getAssignmentReminderWindow(
  trip: { startDate: Date | null; departureTimeZone?: string | null } | null,
  now: Date,
): AssignmentReminderWindow | null {
  if (!trip?.startDate || !Number.isFinite(trip.startDate.getTime())) return null;
  const revealAt = getRevealAt({ ...trip, startDate: trip.startDate });
  const remaining = revealAt.getTime() - now.getTime();
  if (!Number.isFinite(remaining) || remaining <= 0) return null;
  const milestoneHours = ([24, 48, 72] as const).find(
    (hours) => remaining <= hours * 3_600_000,
  );
  if (!milestoneHours) return null;
  return {
    milestoneHours,
    revealAt,
    expiresAt: new Date(revealAt.getTime() - (milestoneHours - 24) * 3_600_000),
  };
}
