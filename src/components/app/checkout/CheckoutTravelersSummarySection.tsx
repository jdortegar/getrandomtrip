"use client";

import { ChevronDown, User } from "lucide-react";
import { useState } from "react";

import { CheckoutTravelersModal } from "@/components/app/checkout/CheckoutTravelersModal";
import { formatTravelersPartyBreakdown } from "@/lib/helpers/format-travelers-party-breakdown";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import { cn } from "@/lib/utils";

interface CheckoutTravelersSummarySectionProps {
  checkoutCopy: Dictionary["journey"]["checkout"];
  onSaveTravelers: (next: PaxDetails) => Promise<void>;
  /** When false, party is fixed by traveler type (solo/couple); tile is not a button and modal is omitted. */
  partyEditable: boolean;
  paxDetails: PaxDetails;
  tileClassName: string;
  tileLabelClassName: string;
}

function buildTravelersModalCopy(checkout: Dictionary["journey"]["checkout"]) {
  return {
    adultsLabel: checkout.travelersModalAdults,
    ariaDecreaseAdults: checkout.travelersModalAriaDecreaseAdults,
    ariaDecreaseMinors: checkout.travelersModalAriaDecreaseMinors,
    ariaDecreaseRooms: checkout.travelersModalAriaDecreaseRooms,
    ariaIncreaseAdults: checkout.travelersModalAriaIncreaseAdults,
    ariaIncreaseMinors: checkout.travelersModalAriaIncreaseMinors,
    ariaIncreaseRooms: checkout.travelersModalAriaIncreaseRooms,
    dialogTitle: checkout.travelersTileTitle,
    done: checkout.travelersModalDone,
    minorsLabel: checkout.travelersModalMinors,
    roomsLabel: checkout.travelersModalRooms,
  };
}

export function CheckoutTravelersSummarySection({
  checkoutCopy,
  onSaveTravelers,
  partyEditable,
  paxDetails,
  tileClassName,
  tileLabelClassName,
}: CheckoutTravelersSummarySectionProps) {
  const [draft, setDraft] = useState<PaxDetails>(paxDetails);
  const [modalOpen, setModalOpen] = useState(false);

  function patchDraft(patch: Partial<PaxDetails>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleModalOpenChange(next: boolean) {
    if (next) {
      setDraft(paxDetails);
    }
    setModalOpen(next);
  }

  const summaryLine = formatTravelersPartyBreakdown(checkoutCopy, paxDetails);
  const modalCopy = buildTravelersModalCopy(checkoutCopy);

  const tileInner = (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className={tileLabelClassName}>{checkoutCopy.travelersTileTitle}</p>
        <div className="mt-1 flex items-center gap-2">
          <User aria-hidden className="h-4 w-4 shrink-0 text-gray-600" />
          <p className="text-base font-medium text-gray-900">{summaryLine}</p>
        </div>
      </div>
      {partyEditable ? (
        <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-gray-400" />
      ) : null}
    </div>
  );

  return (
    <>
      {partyEditable ? (
        <button
          className={cn(
            tileClassName,
            "cursor-pointer text-left sm:col-span-2",
          )}
          onClick={() => handleModalOpenChange(true)}
          type="button"
        >
          {tileInner}
        </button>
      ) : (
        <div
          aria-label={checkoutCopy.travelersTileTitle}
          className={cn(tileClassName, "sm:col-span-2")}
          role="group"
        >
          {tileInner}
        </div>
      )}
      {partyEditable ? (
        <CheckoutTravelersModal
          adults={draft.adults}
          copy={modalCopy}
          minors={draft.minors}
          onAdultsChange={(value) => patchDraft({ adults: value })}
          onDone={() => onSaveTravelers(draft)}
          onMinorsChange={(value) => patchDraft({ minors: value })}
          onOpenChange={handleModalOpenChange}
          onRoomsChange={(value) => patchDraft({ rooms: value })}
          open={modalOpen}
          rooms={draft.rooms}
        />
      ) : null}
    </>
  );
}
