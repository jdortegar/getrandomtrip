import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

interface TripStatusBarProps {
  /** One-line explanation of what this status means for the traveler. */
  description: string;
  /** Translated status label. */
  label: string;
  /** `TripRequestStatus` enum value. */
  status: string;
}

/**
 * The trip's status said once, in one place: badge plus a short line on what
 * it means (after the profile editor's `ProfileEditorStatusBar`). Sits at the
 * bottom of `TripDetailsHeader`.
 */
export function TripStatusBar({
  description,
  label,
  status,
}: TripStatusBarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-component="TripStatusBar"
    >
      <StatusIndicatorBadge family="trip" label={label} status={status} />
      <p className="text-sm text-neutral-600">{description}</p>
    </div>
  );
}
