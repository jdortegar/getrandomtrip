import { FormSelectField } from "@/components/ui/FormField";
import type { AdminTripRequest, TripRequestStatus } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

const STATUS_OPTIONS: TripRequestStatus[] = [
  "DRAFT",
  "SAVED",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
  "CANCELLED",
];

interface AssignableExperience {
  id: string;
  title: string;
  destinationCity: string;
  destinationCountry: string;
}

interface Draft {
  experienceId: string;
  status: TripRequestStatus;
}

interface TripManagePanelProps {
  assignableExperiences: AssignableExperience[];
  copy: MarketingDictionary["adminTripEditModal"];
  draft: Draft;
  onChange: (draft: Draft) => void;
  statusLabel: (status: TripRequestStatus) => string;
  trip: AdminTripRequest;
}

/** Status/experience-assignment controls — the case-mismatch fix (Phase 1)
 * already lives on the receiving `GET /api/admin/experiences` end, so this
 * panel's dropdown is populated correctly for XSED trips out of the box. */
export function TripManagePanel({
  assignableExperiences,
  copy,
  draft,
  onChange,
  statusLabel,
  trip,
}: TripManagePanelProps) {
  return (
    <div className={styles.fieldGroup}>
      <FormSelectField
        id="fulfillment-trip-status"
        label={copy.statusLabel}
        onChange={(e) =>
          onChange({ ...draft, status: e.target.value as TripRequestStatus })
        }
        value={draft.status}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </FormSelectField>

      <FormSelectField
        id="fulfillment-trip-experience"
        label={copy.experienceLabel}
        onChange={(e) => onChange({ ...draft, experienceId: e.target.value })}
        value={draft.experienceId}
      >
        <option value="">{copy.experiencePlaceholder}</option>
        {assignableExperiences.map((exp) => (
          <option key={exp.id} value={exp.id}>
            {exp.title} — {exp.destinationCity}, {exp.destinationCountry}
          </option>
        ))}
      </FormSelectField>

      {trip.actualDestination ? (
        <div className={styles.derivedRow}>
          <span className={styles.derivedLabel}>{copy.destinationLabel}</span>
          <span className={styles.derivedValue}>{trip.actualDestination}</span>
        </div>
      ) : null}
    </div>
  );
}
