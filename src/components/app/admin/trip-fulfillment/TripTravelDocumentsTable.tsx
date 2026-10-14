import { CountryFlag } from "@/components/common/CountryFlag";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { countryLabel } from "@/lib/geo/countryOptions";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { AdminTripFulfillmentDict } from "@/lib/types/dictionary";
import type { TravelDocumentsRow, TravelDocumentsSummary } from "@/types/traveler";
import styles from "./fulfillment.module.css";

interface TripTravelDocumentsTableProps {
  copy: AdminTripFulfillmentDict["travelers"]["documents"];
  kindLabels: Record<TravelDocumentsRow["kind"], string>;
  locale: string;
  notProvided: string;
  summary: TravelDocumentsSummary;
}

/** Read-only nationalities/visas per traveler; the admin judges eligibility. */
export function TripTravelDocumentsTable({
  copy,
  kindLabels,
  locale,
  notProvided,
  summary,
}: TripTravelDocumentsTableProps) {
  const label = (code: string) =>
    code === "SCHENGEN" ? copy.schengenVisa : countryLabel(code, locale);
  const countries = (codes: string[], empty: string) =>
    codes.length === 0 ? (
      <span className="text-neutral-500">{empty}</span>
    ) : (
      <div className="flex flex-col gap-1">
        {codes.map((code) => (
          <span className="flex gap-1.5 items-center" key={code}>
            <CountryFlag countryCode={code} title={label(code)} />
            <span>{label(code)}</span>
          </span>
        ))}
      </div>
    );
  const missing = summary.missingCount > 0;

  return (
    <div className="mt-6" data-component="TripTravelDocumentsTable">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h3 className="font-semibold text-ink text-sm">{copy.title}</h3>
        <StatusIndicatorBadge
          family="traveler"
          label={
            missing
              ? interpolateTemplate(copy.missingBadge, {
                  missing: String(summary.missingCount),
                  total: String(summary.totalCount),
                })
              : interpolateTemplate(copy.completeBadge, {
                  total: String(summary.totalCount),
                })
          }
          status={missing ? "PENDING" : "COMPLETE"}
        />
      </div>
      <p className="mb-3 mt-1 text-neutral-500 text-xs">{copy.description}</p>
      <div className={styles.tableWrap}>
        <table className={styles.docsTable}>
          <thead>
            <tr>
              <th>{copy.traveler}</th>
              <th>{copy.nationalities}</th>
              <th>{copy.visas}</th>
              <th>{copy.status}</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => (
              <tr key={`${row.kind}-${row.id}`}>
                <td>
                  <div className="font-semibold text-ink">
                    {row.name?.trim() || notProvided}
                  </div>
                  <div className="mt-0.5 text-neutral-500 text-xs">
                    {kindLabels[row.kind]}
                  </div>
                </td>
                <td>{countries(row.nationalities, notProvided)}</td>
                <td>{countries(row.visas, copy.noVisas)}</td>
                <td>
                  <StatusIndicatorBadge
                    family="traveler"
                    label={row.missing ? copy.missing : copy.onFile}
                    status={row.missing ? "PENDING" : "COMPLETE"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
