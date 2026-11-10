import type { ComponentType } from "react";
import { BusFront, CarFront, Plane, Plus, Ship, TrainFront } from "lucide-react";
import type { ExperienceCardTransportMode } from "@/types/planner";

const TRANSPORT_ICONS: Record<
  ExperienceCardTransportMode,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  "bus-front": BusFront,
  "car-front": CarFront,
  plane: Plane,
  ship: Ship,
  "train-front": TrainFront,
};

interface ExperienceCardTransportProps {
  label: string;
  modes: ExperienceCardTransportMode[];
  optionalModes?: ExperienceCardTransportMode[];
}

export function ExperienceCardTransport({
  label,
  modes,
  optionalModes,
}: ExperienceCardTransportProps) {
  const icon = (mode: ExperienceCardTransportMode) => {
    const Icon = TRANSPORT_ICONS[mode];
    return <Icon aria-hidden className="h-4 w-4 text-primary" key={mode} />;
  };

  return (
    <span
      aria-label={label}
      className="flex flex-wrap items-center gap-[7px]"
      data-transport-icons
      role="img"
    >
      {modes.map(icon)}
      {optionalModes?.length ? (
        <>
          <Plus aria-hidden className="h-2.5 w-2.5 text-neutral-500" />
          {optionalModes.map(icon)}
        </>
      ) : null}
    </span>
  );
}
