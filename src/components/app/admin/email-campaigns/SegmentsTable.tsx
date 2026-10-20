import { Pencil, Trash2 } from "lucide-react";
import { TableIconButton } from "@/components/ui/TableIconButton";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { SegmentSummary } from "@/types/emailCampaign";
import { SegmentLabel } from "./SegmentLabel";

const TH =
  "px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap";
const TD = "px-5 py-4 text-sm text-neutral-700";

interface SegmentsTableProps {
  copy: EmailCampaignsAdminDict["segments"];
  onDelete: (segment: SegmentSummary) => void;
  onEdit: (segment: SegmentSummary) => void;
  segments: SegmentSummary[];
}

/** Segments list with member counts; system segments can be edited but never deleted. */
export function SegmentsTable({ copy, onDelete, onEdit, segments }: SegmentsTableProps) {
  const cols = copy.columns;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className={TH}>{cols.name}</th>
              <th className={TH}>{cols.members}</th>
              <th className={TH}>{cols.subscribed}</th>
              <th className={TH}>{cols.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {segments.map((segment) => (
              <tr className="transition-colors hover:bg-gray-50" key={segment.id}>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{segment.name}</span>
                    {segment.systemKey && <SegmentLabel>{copy.systemLabel}</SegmentLabel>}
                  </div>
                  {segment.description && (
                    <p className="mt-0.5 text-xs text-neutral-500">{segment.description}</p>
                  )}
                </td>
                <td className={TD}>{segment.memberCount}</td>
                <td className={TD}>{segment.subscribedCount}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <TableIconButton onClick={() => onEdit(segment)} title={copy.actions.edit}>
                      <Pencil aria-hidden className="h-4 w-4" />
                    </TableIconButton>
                    {!segment.systemKey && (
                      <TableIconButton
                        danger
                        onClick={() => onDelete(segment)}
                        title={copy.actions.delete}
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </TableIconButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
