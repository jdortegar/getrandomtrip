"use client";

import { Button } from "@/components/ui/Button";
import { Modal, DialogTitle } from "@/components/ui/Modal";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";

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
  saving: string;
  saveError: string;
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
  const saving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  async function handleDone() {
    if (saving.current) return;
    saving.current = true;
    setIsSaving(true);
    setSaveFailed(false);
    try {
      await Promise.resolve(onDone());
      onOpenChange(false);
    } catch {
      setSaveFailed(true);
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return (
    <Modal
      className={cn("p-6 sm:max-w-md")}
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton={false} data-component="CheckoutTravelersModal"
    >
      <DialogTitle className="sr-only">{copy.dialogTitle}</DialogTitle>

      <fieldset className="space-y-0" disabled={isSaving}>
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
      </fieldset>

      {saveFailed ? <p className="mt-4 text-red-600 text-sm" role="alert">{copy.saveError}</p> : null}

      <Button
        aria-busy={isSaving}
        className="mt-6 w-full"
        disabled={isSaving}
        onClick={() => void handleDone()}
        size="lg"
        type="button"
        variant="default"
      >
        {isSaving ? <Loader2 aria-hidden className="animate-spin h-4 w-4" /> : null}
        {isSaving ? copy.saving : copy.done}
      </Button>
    </Modal>
  );
}
