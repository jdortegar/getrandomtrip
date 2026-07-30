"use client";

import { Button } from "@/components/ui/Button";
import { Modal, DialogTitle } from "@/components/ui/Modal";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { cn } from "@/lib/utils";

export interface CheckoutTravelersModalCopy {
  adultsLabel: string;
  ariaDecreaseAdults: string;
  ariaDecreaseMinors: string;
  ariaDecreaseRooms: string;
  ariaIncreaseAdults: string;
  ariaIncreaseMinors: string;
  ariaIncreaseRooms: string;
  dialogTitle: string;
  done: string;
  minorsLabel: string;
  roomsLabel: string;
}

interface CheckoutTravelersModalProps {
  adults: number;
  copy: CheckoutTravelersModalCopy;
  maxAdults?: number;
  maxMinors?: number;
  maxRooms?: number;
  minors: number;
  onAdultsChange: (value: number) => void;
  onDone: () => void | Promise<void>;
  onMinorsChange: (value: number) => void;
  onOpenChange: (open: boolean) => void;
  onRoomsChange: (value: number) => void;
  open: boolean;
  rooms: number;
}

export function CheckoutTravelersModal({
  adults,
  copy,
  maxAdults = 20,
  maxMinors = 20,
  maxRooms = 10,
  minors,
  onAdultsChange,
  onDone,
  onMinorsChange,
  onOpenChange,
  onRoomsChange,
  open,
  rooms,
}: CheckoutTravelersModalProps) {
  async function handleDone() {
    try {
      await Promise.resolve(onDone());
      onOpenChange(false);
    } catch {
      /* parent shows toast; keep dialog open */
    }
  }

  return (
    <Modal
      className={cn("p-6 sm:max-w-md")}
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton={false}
    >
      <DialogTitle className="sr-only">{copy.dialogTitle}</DialogTitle>

      <div className="space-y-0">
        <QuantityStepper
          ariaDecrease={copy.ariaDecreaseAdults}
          ariaIncrease={copy.ariaIncreaseAdults}
          label={copy.adultsLabel}
          max={maxAdults}
          min={1}
          onValueChange={onAdultsChange}
          value={adults}
        />
        <QuantityStepper
          ariaDecrease={copy.ariaDecreaseMinors}
          ariaIncrease={copy.ariaIncreaseMinors}
          label={copy.minorsLabel}
          max={maxMinors}
          min={0}
          onValueChange={onMinorsChange}
          value={minors}
        />
        <QuantityStepper
          ariaDecrease={copy.ariaDecreaseRooms}
          ariaIncrease={copy.ariaIncreaseRooms}
          label={copy.roomsLabel}
          max={maxRooms}
          min={1}
          onValueChange={onRoomsChange}
          value={rooms}
        />
      </div>

      <Button
        className="mt-6 w-full"
        onClick={() => void handleDone()}
        size="lg"
        type="button"
        variant="default"
      >
        {copy.done}
      </Button>
    </Modal>
  );
}
