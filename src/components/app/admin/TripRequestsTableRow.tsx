import { Pencil } from "lucide-react";
import { TableIconButton } from "@/components/ui/TableIconButton";
import { cn } from "@/lib/utils";
import type { AdminTripRequest } from "@/lib/admin/types";
import { StatusBadge } from "./StatusBadge";

interface TripRequestsTableRowProps {
  editTitle: string;
  isSelected: boolean;
  onEdit: (id: string) => void;
  paymentStatusLabels: Record<string, string>;
  trip: AdminTripRequest;
  tripStatusLabels: Record<string, string>;
}

export function TripRequestsTableRow({
  editTitle,
  isSelected,
  onEdit,
  paymentStatusLabels,
  trip,
  tripStatusLabels,
}: TripRequestsTableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-gray-50",
        isSelected && "border-l-2 border-l-gray-900 bg-blue-50",
      )}
    >
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-neutral-900">
          {trip.user.name}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">{trip.user.email}</p>
      </td>
      <td className="px-5 py-4 text-sm text-neutral-700">
        {trip.originCity}, {trip.originCountry}
      </td>
      <td className="px-5 py-4">
        <p className="text-sm text-neutral-700">{trip.type}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{trip.level}</p>
      </td>
      <td className="px-5 py-4">
        <StatusBadge
          label={tripStatusLabels[trip.status] ?? trip.status}
          status={trip.status}
          variant="trip"
        />
      </td>
      <td className="px-5 py-4">
        {trip.payment ? (
          <StatusBadge
            label={paymentStatusLabels[trip.payment.status] ?? trip.payment.status}
            status={trip.payment.status}
            variant="payment"
          />
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        )}
      </td>
      <td className="px-5 py-4">
        <TableIconButton onClick={() => onEdit(trip.id)} title={editTitle}>
          <Pencil className="h-4 w-4" />
        </TableIconButton>
      </td>
    </tr>
  );
}
