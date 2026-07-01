"use client";

import { useEffect, useState } from "react";
import { ClientTripsTable } from "@/components/app/dashboard/client/ClientTripsTable";
import { DashboardSkeleton } from "@/components/app/dashboard/DashboardSkeleton";
import type { DashboardCopy } from "@/components/app/dashboard/types";
import type { ClientDashboardDict } from "@/lib/types/dictionary";
import { getTrips, type Trip } from "@/lib/utils/trips";

interface ClientTripsPageClientProps {
  copy: DashboardCopy;
  locale: string;
  pageCopy: ClientDashboardDict["trips"];
}

export function ClientTripsPageClient({
  copy,
  locale,
  pageCopy,
}: ClientTripsPageClientProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrips() {
      try {
        setLoading(true);
        const mappedTrips = await getTrips();
        if (!cancelled) setTrips(mappedTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchTrips();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <DashboardSkeleton variant="trips" />;
  }

  return (
    <div className="space-y-10 py-10 text-left">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {pageCopy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {pageCopy.title}
        </h2>
      </div>

      <ClientTripsTable
        copy={copy}
        locale={locale}
        pageCopy={pageCopy}
        trips={trips}
      />
    </div>
  );
}
