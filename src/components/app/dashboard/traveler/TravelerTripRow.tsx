import { Clock, Eye, MapPin, Sparkles, Star } from "lucide-react";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { TableIconLink } from "@/components/ui/TableIconButton";
import { getTripExperienceDisplay } from "@/lib/helpers/dashboard-trip-display";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { isFulfillmentVisible } from "@/lib/trips/fulfillmentVisibility";
import type { Locale } from "@/lib/i18n/config";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "@/components/app/dashboard/types";

const STATUS_STYLES: Record<string, string> = {
  CANCELLED:
    "border-red-200 bg-red-50 text-red-800 [--dot:theme(colors.red.500)]",
  COMPLETED:
    "border-green-200 bg-green-50 text-green-800 [--dot:theme(colors.green.500)]",
  CONFIRMED:
    "border-blue-200 bg-blue-50 text-blue-800 [--dot:theme(colors.blue.500)]",
  REVEALED:
    "border-purple-200 bg-purple-50 text-purple-800 [--dot:theme(colors.purple.500)]",
};

interface TravelerTripRowProps {
  copy: DashboardCopy;
  locale: string;
  trip: Trip;
}

export function TravelerTripRow({ copy, locale, trip }: TravelerTripRowProps) {
  const { levelName, travelerTypeTitle } = getTripExperienceDisplay(
    trip,
    locale,
  );
  const startDate = new Date(trip.startDate).toLocaleDateString(
    locale.startsWith("en") ? "en-US" : "es-ES",
    { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
  );
  const statusLabel = copy.tripStatus[trip.status] ?? trip.status;
  const statusClass =
    STATUS_STYLES[trip.status] ??
    "border-gray-200 bg-gray-50 text-gray-700 [--dot:theme(colors.gray.400)]";

  return (
    <tr className="transition-colors hover:bg-gray-50">
      {/* Trip */}
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-ink">{travelerTypeTitle}</p>
        <p className="mt-0.5 text-xs text-ink">{levelName}</p>
      </td>

      {/* Destination */}
      <td className="hidden px-5 py-4 sm:table-cell">
        <p className="text-sm font-semibold text-ink">
          {(isFulfillmentVisible(trip.status, false)
            ? trip.actualDestination
            : null) ?? copy.allTrips.emptyDestination}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink">
          <MapPin className="h-3 w-3 shrink-0" />
          {trip.city}, {trip.country}
        </p>
      </td>

      {/* Date */}
      <td className="hidden px-5 py-4 text-sm text-ink md:table-cell">
        {startDate}
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <StatusIndicatorBadge
          label={statusLabel}
          styles={{ badge: statusClass, dot: "bg-(--dot)" }}
        />
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          {trip.status === "CONFIRMED" && (
            <TableIconLink
              href={pathForLocale(
                locale as Locale,
                `/dashboard/trips/${trip.id}/reveal`,
              )}
              title={copy.upcomingTrips.revealCountdown}
            >
              <Clock className="h-4 w-4" />
            </TableIconLink>
          )}
          {trip.status === "REVEALED" && (
            <TableIconLink
              href={pathForLocale(
                locale as Locale,
                `/dashboard/trips/${trip.id}/reveal`,
              )}
              title={copy.upcomingTrips.revealDestination}
            >
              <Sparkles className="h-4 w-4" />
            </TableIconLink>
          )}
          {trip.status === "COMPLETED" &&
            trip.reviewToken &&
            !trip.reviewSubmittedAt && (
              <TableIconLink
                href={pathForLocale(
                  locale as Locale,
                  `/review/${trip.reviewToken}`,
                )}
                title={copy.upcomingTrips.writeReview}
              >
                <Star className="h-4 w-4" />
              </TableIconLink>
            )}
          <TableIconLink
            href={pathForLocale(
              locale as Locale,
              `/dashboard/trips/${trip.id}`,
            )}
            title={copy.upcomingTrips.viewDetails}
          >
            <Eye className="h-4 w-4" />
          </TableIconLink>
        </div>
      </td>
    </tr>
  );
}
