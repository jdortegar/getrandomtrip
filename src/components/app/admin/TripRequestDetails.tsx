import { formatAdminDate, formatAdminAmount } from "@/lib/admin/format";
import type { AdminTripRequest } from "@/lib/admin/types";
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
  trip: AdminTripRequest;
}

export function TripRequestDetails({ labels, trip }: TripRequestDetailsProps) {
  return (
    <div className={styles.factList}>
      <DetailRow
        label={labels.origin}
        value={`${trip.originCity}, ${trip.originCountry}`}
      />
      <DetailRow
        label={labels.dates}
        value={`${formatAdminDate(trip.startDate)} — ${formatAdminDate(trip.endDate)}`}
        variant="mono"
      />
      <DetailRow
        label={labels.nightsPax}
        value={`${trip.nights}n · ${trip.pax} pax`}
      />
      <DetailRow label={labels.transport} value={trip.transport} />
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
