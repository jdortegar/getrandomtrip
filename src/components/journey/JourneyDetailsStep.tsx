"use client";

import { useMemo, useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { CountNumberInput } from "@/components/ui/CountNumberInput";
import CitySelector from "@/components/journey/CitySelector";
import CountrySelector from "@/components/journey/CountrySelector";
import { JourneyDatesPicker } from "@/components/journey/JourneyDatesPicker";
import type { JourneyDatesPickerLabels } from "@/components/journey/JourneyDatesPicker";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import TransportSelector, {
  TRANSPORT_OPTIONS,
} from "@/components/journey/TransportSelector";
import type { TransportSelectorLabels } from "@/components/journey/TransportSelector";
import { getPaxSubstepFields, hasPaxSubstep } from "@/lib/helpers/pax-details";
import { getLevelById } from "@/lib/utils/experiencesData";

const DEFAULT_MAX_NIGHTS = 2;

const DEFAULT_MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatDatesRange(
  startDate: string,
  nights: number,
  monthNames: string[] = DEFAULT_MONTH_NAMES,
): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + nights);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  if (startMonth === endMonth) {
    return `${monthNames[startMonth]}, del ${startDay} al ${endDay}`;
  }
  return `del ${startDay} de ${monthNames[startMonth]} al ${endDay} de ${monthNames[endMonth]}`;
}

export interface JourneyDetailsStepPaxLabels {
  adultsLabel: string;
  minorsLabel: string;
  petsLabel: string;
  ariaDecreaseAdults: string;
  ariaIncreaseAdults: string;
  ariaDecreaseMinors: string;
  ariaIncreaseMinors: string;
  ariaDecreasePets: string;
  ariaIncreasePets: string;
  adultsOne: string;
  adultsMany: string;
  minorsOne: string;
  minorsMany: string;
  petsOne: string;
  petsMany: string;
  breakdownSeparator: string;
}

export interface JourneyDetailsStepLabels {
  cityLabel: string;
  cityPlaceholder: string;
  countryLabel: string;
  countryPlaceholder: string;
  datesLabel: string;
  datesPlaceholder: string;
  datesPicker?: JourneyDatesPickerLabels;
  monthNames: string[];
  originLabel: string;
  originPlaceholder: string;
  pax?: JourneyDetailsStepPaxLabels;
  paxLabel?: string;
  transportLabel: string;
  transportPlaceholder: string;
  transportSelector?: TransportSelectorLabels;
}

interface JourneyDetailsStepProps {
  experience?: string;
  labels?: JourneyDetailsStepLabels;
  nights: number;
  onNightsChange: (nights: number) => void;
  onOpenSection: (id: string) => void;
  onOriginCityChange: (value: string) => void;
  onOriginCountryChange: (value: string) => void;
  onPaxAdultsChange: (value: number) => void;
  onPaxMinorsChange: (value: number) => void;
  onPaxPetsChange: (value: number) => void;
  onRangeChange?: (startDate: string | undefined, nights: number) => void;
  onStartDateChange: (startDate: string | undefined) => void;
  onTransportOrderChange: (orderedIds: string[]) => void;
  openSectionId: string;
  originCity: string;
  originCountry: string;
  paxAdults: number;
  paxMinors: number;
  paxPets: number;
  startDate: string | undefined;
  transportOrder: string[];
  travelType?: string;
}

export function JourneyDetailsStep({
  experience,
  labels: labelsProp,
  nights,
  onNightsChange,
  onOpenSection,
  onOriginCityChange,
  onOriginCountryChange,
  onPaxAdultsChange,
  onPaxMinorsChange,
  onPaxPetsChange,
  onRangeChange,
  onStartDateChange,
  onTransportOrderChange,
  openSectionId,
  originCity,
  originCountry,
  paxAdults,
  paxMinors,
  paxPets,
  startDate,
  transportOrder,
  travelType,
}: JourneyDetailsStepProps) {
  // Tracks the ISO alpha-2 code for the selected origin country.
  // This is separate from originCountry (display name) and scopes city search.
  const [originCountryCode, setOriginCountryCode] = useState("");

  const labels = useMemo(
    () => ({
      cityLabel: labelsProp?.cityLabel ?? "Ciudad de salida",
      cityPlaceholder:
        labelsProp?.cityPlaceholder ?? "Escribir ciudad de salida",
      countryLabel: labelsProp?.countryLabel ?? "País de salida",
      countryPlaceholder:
        labelsProp?.countryPlaceholder ?? "Escribir país de salida",
      datesLabel: labelsProp?.datesLabel ?? "Fechas",
      datesPlaceholder:
        labelsProp?.datesPlaceholder ??
        "Elegí cantidad de días y fecha de inicio",
      monthNames:
        labelsProp?.monthNames?.length === 12
          ? labelsProp.monthNames
          : DEFAULT_MONTH_NAMES,
      originLabel: labelsProp?.originLabel ?? "Origen",
      originPlaceholder:
        labelsProp?.originPlaceholder ?? "Elegí país y ciudad de salida",
      paxLabel: labelsProp?.paxLabel ?? "Viajeros",
      pax: {
        adultsLabel: labelsProp?.pax?.adultsLabel ?? "Adultos",
        minorsLabel: labelsProp?.pax?.minorsLabel ?? "Menores",
        petsLabel: labelsProp?.pax?.petsLabel ?? "Mascotas",
        ariaDecreaseAdults:
          labelsProp?.pax?.ariaDecreaseAdults ?? "Disminuir adultos",
        ariaIncreaseAdults:
          labelsProp?.pax?.ariaIncreaseAdults ?? "Aumentar adultos",
        ariaDecreaseMinors:
          labelsProp?.pax?.ariaDecreaseMinors ?? "Disminuir menores",
        ariaIncreaseMinors:
          labelsProp?.pax?.ariaIncreaseMinors ?? "Aumentar menores",
        ariaDecreasePets:
          labelsProp?.pax?.ariaDecreasePets ?? "Disminuir mascotas",
        ariaIncreasePets:
          labelsProp?.pax?.ariaIncreasePets ?? "Aumentar mascotas",
        adultsOne: labelsProp?.pax?.adultsOne ?? "{count} adulto",
        adultsMany: labelsProp?.pax?.adultsMany ?? "{count} adultos",
        minorsOne: labelsProp?.pax?.minorsOne ?? "{count} menor",
        minorsMany: labelsProp?.pax?.minorsMany ?? "{count} menores",
        petsOne: labelsProp?.pax?.petsOne ?? "{count} mascota",
        petsMany: labelsProp?.pax?.petsMany ?? "{count} mascotas",
        breakdownSeparator: labelsProp?.pax?.breakdownSeparator ?? " · ",
      },
      transportLabel:
        labelsProp?.transportLabel ?? "Transporte: Orden de preferencia",
      transportPlaceholder:
        labelsProp?.transportPlaceholder ??
        "Definí el orden de preferencia arrastrando",
    }),
    [labelsProp],
  );

  const maxNights = useMemo(() => {
    if (!travelType || !experience) return DEFAULT_MAX_NIGHTS;
    const level = getLevelById(travelType, experience);
    return level?.maxNights ?? DEFAULT_MAX_NIGHTS;
  }, [experience, travelType]);

  const originSummary =
    originCountry && originCity
      ? `${originCountry} · ${originCity}`
      : originCountry || originCity || labels.originPlaceholder;

  const datesSummary =
    startDate && nights
      ? formatDatesRange(startDate, nights, labels.monthNames)
      : labels.datesPlaceholder;

  const transportSummary =
    transportOrder.length > 0
      ? `${labelsProp?.transportSelector?.optionLabels?.[transportOrder[0]] ?? TRANSPORT_OPTIONS.find((o) => o.id === transportOrder[0])?.label ?? transportOrder[0]} *`
      : labels.transportPlaceholder;

  const showPaxSubstep = hasPaxSubstep(travelType);
  const paxFields = getPaxSubstepFields(travelType);

  return (
    <div className="space-y-4">
      {showPaxSubstep && (
        <div className="min-w-0 w-full rounded-lg bg-white p-4 shadow-md sm:p-6">
          <h3 className="mb-4 text-xl font-semibold text-neutral-900">
            {labels.paxLabel}
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <CountNumberInput
              id="pax-adults"
              label={labels.pax.adultsLabel}
              min={1}
              onChange={onPaxAdultsChange}
              value={paxAdults}
            />
            {paxFields === "adults-minors" && (
              <CountNumberInput
                id="pax-minors"
                label={labels.pax.minorsLabel}
                min={0}
                onChange={onPaxMinorsChange}
                value={paxMinors}
              />
            )}
            {paxFields === "adults-pets" && (
              <CountNumberInput
                id="pax-pets"
                label={labels.pax.petsLabel}
                min={0}
                onChange={onPaxPetsChange}
                value={paxPets}
              />
            )}
          </div>
        </div>
      )}
      <Accordion
        collapsible
        onValueChange={onOpenSection}
        type="single"
        value={openSectionId}
      >
        <div className="space-y-4">
          <JourneyDropdown
            content={originSummary}
            label={labels.originLabel}
            value="origin"
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-2">
                <label className="text-base font-bold text-gray-700">
                  {labels.countryLabel}
                </label>
                <CountrySelector
                  onChange={(name, code) => {
                    onOriginCountryChange(name);
                    setOriginCountryCode(code);
                    if (originCity) onOriginCityChange("");
                  }}
                  placeholder={labels.countryPlaceholder}
                  size="lg"
                  value={originCountry}
                />
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <label className="text-base font-bold text-gray-700">
                  {labels.cityLabel}
                </label>
                <CitySelector
                  countryCode={originCountryCode}
                  onChange={onOriginCityChange}
                  placeholder={labels.cityPlaceholder}
                  size="lg"
                  value={originCity}
                />
              </div>
            </div>
          </JourneyDropdown>

          <JourneyDropdown
            content={datesSummary}
            label={labels.datesLabel}
            value="dates"
          >
            <JourneyDatesPicker
              labels={labelsProp?.datesPicker}
              maxNights={maxNights}
              nights={nights}
              onNightsChange={onNightsChange}
              onRangeChange={onRangeChange}
              onStartDateChange={onStartDateChange}
              startDate={startDate}
            />
          </JourneyDropdown>
          <JourneyDropdown
            content={transportSummary}
            label={labels.transportLabel}
            value="transport"
          >
            <TransportSelector
              labels={labelsProp?.transportSelector}
              onChange={onTransportOrderChange}
              value={transportOrder}
            />
          </JourneyDropdown>
        </div>
      </Accordion>
    </div>
  );
}
