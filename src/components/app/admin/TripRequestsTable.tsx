import { SortButton } from "@/components/ui/SortButton";
import type { TripRequestSortBy, TripRequestSortOrder } from "@/lib/admin/tripRequestsSort";
import type { AdminTripRequest } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { TripRequestsTableRow } from "./TripRequestsTableRow";

type TripRequestsCopy = MarketingDictionary["adminPages"]["tripRequests"];

interface TripRequestsTableProps {
  copy: TripRequestsCopy;
  locale: string;
  onSort: (field: TripRequestSortBy) => void;
  paymentStatusLabels: Record<string, string>;
  sortBy: TripRequestSortBy;
  sortOrder: TripRequestSortOrder;
  trips: AdminTripRequest[];
  tripStatusLabels: Record<string, string>;
}

export function TripRequestsTable({
  copy,
  locale,
  onSort,
  paymentStatusLabels,
  sortBy,
  sortOrder,
  trips,
  tripStatusLabels,
}: TripRequestsTableProps) {
  const cols = copy.columns;

  function ariaSortFor(field: TripRequestSortBy): "ascending" | "descending" | "none" {
    if (sortBy !== field) return "none";
    return sortOrder === "asc" ? "ascending" : "descending";
  }

  function sortAriaLabel(label: string): string {
    return copy.sort.ariaSortBy.replace("{field}", label);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {trips.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">
          {copy.empty}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th aria-sort={ariaSortFor("traveler")} className="px-5 py-3 text-left">
                  <SortButton
                    active={sortBy === "traveler"}
                    ariaLabel={sortAriaLabel(cols.traveler)}
                    label={cols.traveler}
                    onSort={() => onSort("traveler")}
                    order={sortOrder}
                  />
                </th>
                <th aria-sort={ariaSortFor("tripDate")} className="px-5 py-3 text-left">
                  <SortButton
                    active={sortBy === "tripDate"}
                    ariaLabel={sortAriaLabel(cols.tripDate)}
                    label={cols.tripDate}
                    onSort={() => onSort("tripDate")}
                    order={sortOrder}
                  />
                </th>
                <th aria-sort={ariaSortFor("origin")} className="px-5 py-3 text-left">
                  <SortButton
                    active={sortBy === "origin"}
                    ariaLabel={sortAriaLabel(cols.origin)}
                    label={cols.origin}
                    onSort={() => onSort("origin")}
                    order={sortOrder}
                  />
                </th>
                <th aria-sort={ariaSortFor("type")} className="px-5 py-3 text-left">
                  <SortButton
                    active={sortBy === "type"}
                    ariaLabel={sortAriaLabel(cols.typeLevel)}
                    label={cols.typeLevel}
                    onSort={() => onSort("type")}
                    order={sortOrder}
                  />
                </th>
                <th aria-sort={ariaSortFor("status")} className="px-5 py-3 text-left">
                  <SortButton
                    active={sortBy === "status"}
                    ariaLabel={sortAriaLabel(cols.status)}
                    label={cols.status}
                    onSort={() => onSort("status")}
                    order={sortOrder}
                  />
                </th>
                <th aria-sort={ariaSortFor("payment")} className="px-5 py-3 text-left">
                  <SortButton
                    active={sortBy === "payment"}
                    ariaLabel={sortAriaLabel(cols.payment)}
                    label={cols.payment}
                    onSort={() => onSort("payment")}
                    order={sortOrder}
                  />
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {cols.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {trips.map((trip) => (
                <TripRequestsTableRow
                  editHref={`/${locale}/dashboard/admin/trip-requests/${trip.id}`}
                  editTitle={copy.edit}
                  key={trip.id}
                  paymentStatusLabels={paymentStatusLabels}
                  trip={trip}
                  tripStatusLabels={tripStatusLabels}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
