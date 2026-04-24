import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TripperDashboardDict } from "@/lib/types/dictionary";

interface TripperPackagesSummaryProps {
  activePackages: number;
  copy: TripperDashboardDict["packages"];
}

export function TripperPackagesSummary({
  activePackages,
  copy,
}: TripperPackagesSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">{copy.title}</h2>
        <Button asChild size="sm">
          <Link href="/dashboard/tripper/experiences">
            <Plus className="h-4 w-4" />
            {copy.newPackage}
          </Link>
        </Button>
      </div>

      {activePackages === 0 ? (
        <div className="text-center py-8">
          <p className="text-neutral-500 mb-4">{copy.empty}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/tripper/experiences">
              <Plus className="h-4 w-4" />
              {copy.emptyCta}
            </Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-neutral-600">
          {activePackages} paquete{activePackages !== 1 ? "s" : ""} activo
          {activePackages !== 1 ? "s" : ""}.{" "}
          <Link
            href="/dashboard/tripper/experiences"
            className="text-sky-600 hover:underline"
          >
            {copy.viewAll}
          </Link>
        </p>
      )}
    </div>
  );
}
