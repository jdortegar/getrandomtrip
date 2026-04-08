import { Skeleton } from '@/components/ui/Skeleton';

function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming trips panel */}
        <div className="lg:col-span-2">
          <PanelSkeleton rows={3} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={3} />
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
