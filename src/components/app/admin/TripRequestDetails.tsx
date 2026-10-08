import { formatAdminAmount } from "@/lib/admin/format";
import type { AdminTripRequest } from "@/lib/admin/types";
import { formatTripCalendarDate } from "@/lib/helpers/formatTripCalendarDate";
import { travelerTypeOf } from "@/lib/db/tripRequestFamily";
import {
  resolveExcuseSelectionLabels,
  type LocalizedExcuseTitle,
  type LocalizedRefineOptions,
} from "@/lib/helpers/excuse-helper";
import { resolveTripTransportLabel } from "@/lib/helpers/transport";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import styles from "./trip-fulfillment/fulfillment.module.css";

type DetailLabels = MarketingDictionary["adminTripEditModal"]["details"];

interface DetailRowProps {
  label: string;
  value: string;
  variant?: "mono" | "price";
}

function DetailRow({ label, value, variant }: DetailRowProps) {
  const valueClass = variant
    ? `${styles.factValue} ${styles[variant]}`
    : styles.factValue;
  return (
    <div className={styles.factRow}>
      <span className={styles.factLabel}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

interface TripRequestDetailsProps {
  labels: DetailLabels;
  /** Localized excuse titles (journey.excuses). */
  localizedExcuses?: readonly LocalizedExcuseTitle[];
  /** Localized refine options (journey.refineDetailOptions). */
  localizedRefineOptions?: LocalizedRefineOptions;
  locale: string;
  ownCarLabel: string;
  trip: AdminTripRequest;
}

export function TripRequestDetails({
  labels,
  localizedExcuses,
  localizedRefineOptions,
  locale,
  ownCarLabel,
  trip,
}: TripRequestDetailsProps) {
  const excuse = resolveExcuseSelectionLabels({
    travelerType: travelerTypeOf(trip),
    excuseKey: trip.excuseKey,
    refineDetails: trip.refineDetails,
    localizedExcuses,
    localizedRefineOptions,
  });
  return (
    <div className={styles.factList} data-component="TripRequestDetails">
      <DetailRow
        label={labels.origin}
        value={`${trip.originCity}, ${trip.originCountry}`}
      />
      <DetailRow
        label={labels.dates}
        value={`${formatTripCalendarDate(trip.startDate, locale)} — ${formatTripCalendarDate(trip.endDate, locale)}`}
        variant="mono"
      />
      <DetailRow
        label={labels.nightsPax}
        value={`${trip.nights}n · ${trip.pax} pax`}
      />
      <DetailRow
        label={labels.transport}
        value={resolveTripTransportLabel(
          trip.type, trip.transport, ownCarLabel, trip.transport,
        ) ?? trip.transport}
      />
      {excuse ? (
        <DetailRow label={labels.excuse} value={excuse.title} />
      ) : null}
      {excuse && excuse.refineDetails.length > 0 ? (
        <DetailRow
          label={labels.refineDetails}
          value={excuse.refineDetails.map((detail) => detail.label).join(", ")}
        />
      ) : null}
      {trip.payment ? (
        <DetailRow
          label={labels.payment}
          value={formatAdminAmount(trip.payment.amount, trip.payment.currency)}
          variant="price"
        />
      ) : null}
    </div>
  );
}
