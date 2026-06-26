import { Skeleton } from "@/components/ui/Skeleton";

function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex items-stretch gap-3.5">
        <Skeleton className="w-1 rounded-full" />
        <Skeleton className="h-12 w-20" />
      </div>
    </div>
  );
}

function BookingRowSkeleton() {
  return (
    <div className="px-6 py-[18px]">
      <div className="hidden items-center gap-5 md:grid" style={{ gridTemplateColumns: "1fr 160px 120px 130px" }}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-7 w-24 rounded-[6px]" />
      </div>
      <div className="flex items-center gap-4 md:hidden">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-20 rounded-[6px]" />
      </div>
    </div>
  );
}

export function TripperDashboardSkeleton() {
  return (
    <div className="space-y-10">
      {/* Stats section */}
      <div className="space-y-4">
        {/* Eyebrow + heading */}
        <div className="mb-5 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-52" />
        </div>
        {/* 4 stat cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        {/* Supporting strip */}
        <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 sm:flex-row">
          {[false, true, true].map((divider, i) => (
            <div
              key={i}
              className={`flex flex-1 items-center justify-between gap-3 px-7 py-5 ${
                divider ? "border-t border-gray-200 sm:border-l sm:border-t-0" : ""
              }`}
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent bookings section */}
      <div className="space-y-4">
        <div className="mb-5 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <BookingRowSkeleton />
          <BookingRowSkeleton />
          <BookingRowSkeleton />
          <BookingRowSkeleton />
        </div>
      </div>
    </div>
  );
}
