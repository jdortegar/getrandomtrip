import type { InviteTravelersDict } from "@/lib/types/dictionary";
import type { TravelerDTO } from "@/types/traveler";

interface TravelerReadOnlyRowProps {
  copy: InviteTravelersDict;
  traveler: TravelerDTO;
  travelerNumber: number;
}

/**
 * A fellow traveler as a companion sees them: name only. The server already
 * stripped email, ID document and date of birth, so there is nothing to edit
 * and nothing to hide here.
 */
export function TravelerReadOnlyRow({
  copy,
  traveler,
  travelerNumber,
}: TravelerReadOnlyRowProps) {
  const isAdult = traveler.kind === "ADULT";
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5"
      data-component="TravelerReadOnlyRow"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span
          className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${
            isAdult ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-800"
          }`}
        >
          {isAdult ? copy.adultTag : copy.minorTag}
        </span>
        {traveler.fullName?.trim() ||
          copy.travelerLabel.replace("{number}", String(travelerNumber))}
      </div>
      <p className="mt-2 text-xs text-neutral-500">{copy.companionOtherNote}</p>
    </div>
  );
}
