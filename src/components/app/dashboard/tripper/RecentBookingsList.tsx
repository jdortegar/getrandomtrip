import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { Calendar } from "lucide-react";
import Link from "next/link";
import type { RecentBooking } from "@/types/tripper";
import type { TripperDashboardDict } from "@/lib/types/dictionary";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import { ExcuseSummary } from "@/components/common/ExcuseSummary";
import {
  resolveExcuseSelectionLabels,
  type LocalizedExcuseTitle,
  type LocalizedRefineOptions,
} from "@/lib/helpers/excuse-helper";

interface RecentBookingsListProps {
  bookings: RecentBooking[];
  copy: TripperDashboardDict["recentBookings"] & TripperDashboardDict["status"];
  locale?: string;
  localizedExcuses?: readonly LocalizedExcuseTitle[];
  localizedRefineOptions?: LocalizedRefineOptions;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RecentBookingsList({
  bookings,
  copy,
  locale = "es",
  localizedExcuses,
  localizedRefineOptions,
}: RecentBookingsListProps) {
  return (
    <section data-component="RecentBookingsList">
      {/* Brand section header — eyebrow + condensed heading */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Latest activity
          </p>
          <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
            {copy.title}
          </h2>
        </div>
        <Link
          href={pathForLocale(locale as Locale, "/dashboard/tripper")}
          className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary hover:text-sky-700"
        >
          {copy.viewAll} →
        </Link>
      </div>

      {/* Table */}
      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {bookings.length === 0 ? (
          <p className="py-12 text-center text-ink">{copy.empty}</p>
        ) : (
          bookings.map((booking) => {
            const label = copy[booking.status as keyof TripperDashboardDict["status"]] ?? booking.status;
            const excuseLine = (
              <ExcuseSummary
                excuse={resolveExcuseSelectionLabels({
                  travelerType: booking.travelerType,
                  excuseKey: booking.excuseKey,
                  refineDetails: booking.refineDetails,
                  localizedExcuses,
                  localizedRefineOptions,
                })}
                label={copy.excuseLabel}
                variant="inline"
              />
            );
            return (
              <div key={booking.id} className="px-6 py-[18px]">
                {/* Mobile layout */}
                <div className="flex items-center gap-4 md:hidden">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-base font-semibold text-white">
                    {booking.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{booking.clientName}</p>
                    <p className="truncate text-sm text-ink">{booking.experienceName}</p>
                    {excuseLine}
                  </div>
                  <StatusIndicatorBadge family="tripper-booking-summary" label={label} status={booking.status} />
                </div>
                <div className="mt-2 flex items-center gap-3 pl-14 md:hidden">
                  <p className="flex items-center gap-1 text-[12px] text-neutral-400">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {formatDate(booking.date)}
                  </p>
                  <p className="font-barlow-condensed text-lg font-bold leading-none text-ink">
                    ${booking.amount.toLocaleString("es-AR")}
                  </p>
                </div>

                {/* Desktop layout */}
                <div
                  className="hidden items-center gap-5 md:grid"
                  style={{ gridTemplateColumns: "1fr 160px 120px 130px" }}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-lg font-semibold text-white">
                      {booking.clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{booking.clientName}</p>
                      <p className="truncate text-sm text-neutral-600">{booking.experienceName}</p>
                      {excuseLine}
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-[13px] text-ink">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    {formatDate(booking.date)}
                  </p>
                  <p className="font-barlow-condensed text-[22px] font-bold leading-none text-ink">
                    ${booking.amount.toLocaleString("es-AR")}
                  </p>
                  <StatusIndicatorBadge family="tripper-booking" label={label} status={booking.status} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
