import { hasMissingTravelerDetails } from "@/lib/travelers/travelerPolicy";
import { summarizeCompanionDetails } from "@/lib/travelers/bookingTravelerPolicy";
import { TripTravelerReminder } from "./TripTravelerReminder";
import { cn } from "@/lib/utils";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { AdminBookingTraveler } from "@/lib/types/AdminBookingTravelers";
import type { AdminTripFulfillmentDict } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

interface TripTravelersPanelProps {
  copy: AdminTripFulfillmentDict["travelers"];
  onRefresh: () => Promise<void>;
  pax: number;
  paxDetails: unknown;
  tripId: string;
  travelers: AdminBookingTraveler[];
}

export function TripTravelersPanel({
  copy,
  onRefresh,
  pax,
  paxDetails,
  travelers,
  tripId,
}: TripTravelersPanelProps) {
  const identities = travelers.map((traveler) => ({
    ...traveler,
    fullName: traveler.name,
  }));
  const companions = summarizeCompanionDetails(
    identities.filter((traveler) => traveler.kind !== "BOOKING_HOLDER"),
    pax,
    paxDetails,
  );
  const buyerComplete = identities.some(
    (traveler) =>
      traveler.kind === "BOOKING_HOLDER" &&
      !hasMissingTravelerDetails(traveler),
  );
  const complete =
    Number(buyerComplete) + Math.min(companions.expected, companions.complete);
  const incomplete = identities.filter(hasMissingTravelerDetails).length;
  const kinds = {
    BOOKING_HOLDER: copy.bookingHolder,
    ADULT: copy.adult,
    MINOR: copy.minor,
  };

  return (
    <section
      aria-labelledby="booking-travelers-title"
      className={styles.panel}
      data-component="TripTravelersPanel"
    >
      <div className={styles.panelBody}>
        <p className="font-semibold text-primary text-xs tracking-[0.18em] uppercase">
          {copy.eyebrow}
        </p>
        <h2 className={styles.panelTitle} id="booking-travelers-title">
          {copy.title}
        </h2>
        <p className={styles.panelDesc}>{copy.description}</p>
        <p className="mt-3 text-neutral-700 text-sm">
          {interpolateTemplate(copy.count, {
            count: String(companions.expected + 1),
            complete: String(complete),
          })}
        </p>
        {incomplete > 0 && (
          <p className="mt-2 text-amber-800 text-sm">
            {interpolateTemplate(copy.incomplete, {
              count: String(incomplete),
            })}
          </p>
        )}
        {companions.missing > 0 && (
          <p className="mt-2 text-amber-800 text-sm" role="status">
            {interpolateTemplate(copy.missingRecords, {
              count: String(companions.missing),
            })}
          </p>
        )}
        {companions.extra > 0 && (
          <p className="mt-2 text-amber-800 text-sm" role="status">
            {interpolateTemplate(copy.extraRecords, {
              count: String(companions.extra),
            })}
          </p>
        )}
        <ul className="divide-gray-200 divide-y mt-4">
          {travelers.map((traveler) => (
            <li className="py-4" key={`${traveler.kind}-${traveler.id}`}>
              <h3 className="font-semibold mb-3 text-ink text-sm">
                {kinds[traveler.kind]}
              </h3>
              <dl
                className={cn(
                  "gap-4 grid min-w-0",
                  "sm:grid-cols-2 xl:grid-cols-4",
                )}
              >
                {(
                  [
                    "name",
                    "idDocument",
                    "phone",
                    "email",
                    ...(traveler.kind === "MINOR"
                      ? ["dateOfBirth" as const]
                      : []),
                  ] as const
                ).map((field) => (
                  <div className="min-w-0" key={field}>
                    <dt className="font-medium text-neutral-500 text-sm">
                      {copy[field]}
                    </dt>
                    <dd className="mt-1 text-ink text-sm [overflow-wrap:anywhere]">
                      {traveler[field]?.trim() ||
                        (field === "phone" && traveler.kind !== "BOOKING_HOLDER"
                          ? copy.phoneNotCollected
                          : copy.notProvided)}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        {companions.needsReminder && (
          <TripTravelerReminder
            copy={copy.reminder}
            key={tripId}
            onComplete={onRefresh}
            tripId={tripId}
          />
        )}
      </div>
    </section>
  );
}
