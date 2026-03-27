"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

const stepperBtnClass = cn(
  "flex h-full w-10 items-center justify-center font-semibold text-gray-700",
  "hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40",
);

const stepperLabelClass = "font-barlow font-medium text-gray-900 text-sm";

const stepperShellClass = cn(
  "flex h-10 items-center rounded-lg border border-gray-200 bg-white",
);

const stepperValueClass =
  "min-w-10 text-center font-barlow font-bold text-gray-900 text-sm";

interface TravelersQuantityStepperProps {
  ariaDecrease: string;
  ariaIncrease: string;
  label: string;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  value: number;
}

function TravelersQuantityStepper({
  ariaDecrease,
  ariaIncrease,
  label,
  max,
  min,
  onValueChange,
  value,
}: TravelersQuantityStepperProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className={stepperLabelClass}>{label}</span>
      <div className={stepperShellClass}>
        <button
          aria-label={ariaDecrease}
          className={stepperBtnClass}
          disabled={value <= min}
          onClick={() => onValueChange(Math.max(min, value - 1))}
          type="button"
        >
          <Minus aria-hidden className="h-4 w-4" />
        </button>
        <span className={stepperValueClass}>{value}</span>
        <button
          aria-label={ariaIncrease}
          className={stepperBtnClass}
          disabled={value >= max}
          onClick={() => onValueChange(Math.min(max, value + 1))}
          type="button"
        >
          <Plus aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
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
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={cn(
          "z-[1100] gap-0 rounded-2xl border-gray-100 bg-white p-6 shadow-xl sm:max-w-md",
        )}
        overlayClassName="z-[1100]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{copy.dialogTitle}</DialogTitle>

        <div className="space-y-0">
          <TravelersQuantityStepper
            ariaDecrease={copy.ariaDecreaseAdults}
            ariaIncrease={copy.ariaIncreaseAdults}
            label={copy.adultsLabel}
            max={maxAdults}
            min={1}
            onValueChange={onAdultsChange}
            value={adults}
          />
          <TravelersQuantityStepper
            ariaDecrease={copy.ariaDecreaseMinors}
            ariaIncrease={copy.ariaIncreaseMinors}
            label={copy.minorsLabel}
            max={maxMinors}
            min={0}
            onValueChange={onMinorsChange}
            value={minors}
          />
          <TravelersQuantityStepper
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
          type="button"
          variant="default"
          size="lg"
        >
          {copy.done}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
