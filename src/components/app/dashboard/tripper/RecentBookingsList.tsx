import { Calendar } from "lucide-react";
import Link from "next/link";
import type { RecentBooking } from "@/types/tripper";
import type { TripperDashboardDict } from "@/lib/types/dictionary";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";

interface RecentBookingsListProps {
  bookings: RecentBooking[];
  copy: TripperDashboardDict["recentBookings"] & TripperDashboardDict["status"];
  locale?: string;
}

function getStatusStyle(status: string) {
  if (status === "confirmed" || status === "completed") {
    return { dot: "bg-green-500", badge: "bg-green-50 text-green-800 border-green-200" };
  }
  if (status === "revealed") {
    return { dot: "bg-purple-500", badge: "bg-purple-50 text-purple-800 border-purple-200" };
  }
  return { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-800 border-amber-200" };
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
}: RecentBookingsListProps) {
  return (
    <section>
      {/* Brand section header — eyebrow + condensed heading */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
            Latest activity
          </p>
          <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-neutral-900">
            {copy.title}
          </h2>
        </div>
        <Link
          href={pathForLocale(locale as Locale, "/dashboard/tripper")}
          className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-light-blue hover:text-sky-700"
        >
          {copy.viewAll} →
        </Link>
      </div>

      {/* Table */}
      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {bookings.length === 0 ? (
          <p className="py-12 text-center text-neutral-500">{copy.empty}</p>
        ) : (
          bookings.map((booking) => {
            const s = getStatusStyle(booking.status);
            return (
              <div key={booking.id} className="px-6 py-[18px]">
                {/* Mobile layout */}
                <div className="flex items-center gap-4 md:hidden">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-light-blue text-base font-semibold text-white">
                    {booking.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{booking.clientName}</p>
                    <p className="truncate text-sm text-neutral-500">{booking.experienceName}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${s.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                    {copy[booking.status as keyof TripperDashboardDict["status"]] ?? booking.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 pl-14 md:hidden">
                  <p className="flex items-center gap-1 text-[12px] text-neutral-400">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {formatDate(booking.date)}
                  </p>
                  <p className="font-barlow-condensed text-lg font-bold leading-none text-gray-900">
                    ${booking.amount.toLocaleString("es-AR")}
                  </p>
                </div>

                {/* Desktop layout */}
                <div
                  className="hidden items-center gap-5 md:grid"
                  style={{ gridTemplateColumns: "1fr 160px 120px 130px" }}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-light-blue text-lg font-semibold text-white">
                      {booking.clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{booking.clientName}</p>
                      <p className="truncate text-sm text-neutral-600">{booking.experienceName}</p>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    {formatDate(booking.date)}
                  </p>
                  <p className="font-barlow-condensed text-[22px] font-bold leading-none text-gray-900">
                    ${booking.amount.toLocaleString("es-AR")}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-[6px] border px-3 py-[5px] text-[11px] font-semibold uppercase tracking-[0.08em] ${s.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                    {copy[booking.status as keyof TripperDashboardDict["status"]] ?? booking.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
