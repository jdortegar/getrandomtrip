import type {
  TripDocumentSnapshot,
  TripDocumentSnapshotSource,
} from "@/lib/types/TripDocumentSnapshot";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { isDestinationCountryCode } from "@/lib/trips/destinationCountries";
import {
  isBoundedDocumentText,
  isIsoCalendarDate,
} from "./validationPrimitives";

const text = (value: unknown) => (isBoundedDocumentText(value) ? value : "");
const date = (value?: Date | null) => {
  const day = value?.toJSON()?.slice(0, 10);
  return isIsoCalendarDate(day) ? day : "";
};

export function createTripDocumentSnapshot(
  template: TripDocumentSnapshot["template"],
  source: TripDocumentSnapshotSource,
): TripDocumentSnapshot {
  const locale = source.user?.locale === "en" ? "en" : "es";
  const common = {
    templateVersion: 1 as const,
    label: "",
    locale,
    country: isDestinationCountryCode(source.experience?.destinationCountry)
      ? source.experience.destinationCountry
      : "",
  } as const;
  const origin = text(source.originCity);
  const destination =
    text(source.actualDestination) || text(source.experience?.destinationCity);
  const holder = text(source.user?.name);
  const pax = source.pax;
  const copy = (locale === "en" ? en : es).journey.checkout;
  const count =
    typeof pax === "number" && Number.isSafeInteger(pax) && pax > 0
      ? (pax === 1 ? copy.travelersOne : copy.travelersMany).replace(
          "{count}",
          String(pax),
        )
      : "";
  const guests = text(
    [
      count,
      holder,
      ...(source.travelers ?? []).map((row) => text(row.fullName)),
    ]
      .filter((name) => name.trim())
      .join("\n"),
  );
  const provider = { name: "", address: "" };
  const startDate = date(source.startDate);
  switch (template) {
    case "xsed-roadmap":
      return {
        ...common,
        template,
        data: {
          origin,
          destination,
          departureDate: startDate,
          departureTime: "",
          drivingDuration: "",
          stops: [],
        },
      };
    case "experience-roadmap":
      return {
        ...common,
        template,
        data: {
          origin,
          destination,
          startDate,
          endDate: date(source.endDate),
          duration: "",
          heading: text(source.experience?.title),
          activities: [],
        },
      };
    case "hotel-voucher":
      return {
        ...common,
        template,
        data: {
          holder,
          guests,
          checkInDate: "",
          checkOutDate: "",
          property: provider,
          inclusions: [],
        },
      };
    case "activity-voucher":
      return {
        ...common,
        template,
        data: {
          holder,
          participants: guests,
          date: "",
          time: "",
          provider,
          program: [],
        },
      };
    case "dinner-voucher":
      return {
        ...common,
        template,
        data: {
          holder,
          guests,
          date: "",
          time: "",
          restaurant: provider,
          service: "",
          menuItems: [],
        },
      };
  }
}
