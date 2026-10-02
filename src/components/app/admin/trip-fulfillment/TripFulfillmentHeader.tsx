"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { StatusBadge } from "@/components/app/admin/StatusBadge";
import { ProductBadge } from "@/components/common/ProductBadge";
import { formatAdminDate } from "@/lib/admin/format";
import type { AdminTripRequest, TripRequestStatus } from "@/lib/admin/types";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import {
  getRevealAt,
  getRevealCountdown,
} from "@/lib/helpers/getRevealCountdown";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

interface TripFulfillmentHeaderProps {
  copy: MarketingDictionary["adminTripFulfillment"];
  locale: string;
  onContactTraveler: () => void;
  paymentStatusLabels: Record<string, string>;
  statusLabel: (status: TripRequestStatus) => string;
  trip: AdminTripRequest;
}

interface RevealCallout {
  label: string;
  value: string;
}

function revealCallout(
  copy: MarketingDictionary["adminTripFulfillment"],
  trip: AdminTripRequest,
): RevealCallout | null {
  if (!trip.startDate) return null;
  const timing = {
    startDate: new Date(trip.startDate),
    departureTimeZone: trip.departureTimeZone,
  };
  const countdown = getRevealCountdown(timing, new Date());
  if (countdown.revealed) {
    const revealedAt =
      trip.destinationRevealedAt ??
      getRevealAt(timing).toISOString();
    return { label: copy.revealedOnLabel, value: formatAdminDate(revealedAt) };
  }
  if (countdown.days > 0) {
    return {
      label: copy.revealsInLabel,
      value: interpolateTemplate(copy.revealsInDays, {
        days: String(countdown.days),
      }),
    };
  }
  if (countdown.hours > 0 || countdown.minutes > 0) {
    return {
      label: copy.revealsInLabel,
      value: interpolateTemplate(copy.revealsInHours, {
        hours: String(countdown.hours),
        minutes: String(countdown.minutes),
      }),
    };
  }
  return { label: copy.revealsInLabel, value: copy.revealsInNow };
}

export function TripFulfillmentHeader({
  copy,
  locale,
  onContactTraveler,
  paymentStatusLabels,
  statusLabel,
  trip,
}: TripFulfillmentHeaderProps) {
  const title = interpolateTemplate(copy.title, { userName: trip.user.name });
  const callout = revealCallout(copy, trip);
  const showLevelChip = trip.level.toLowerCase() !== trip.type.toLowerCase();

  return (
    <>
      <div
        className={styles.headerNavigation}
        data-component="TripFulfillmentHeader"
      >
        <Link
          className={styles.backLink}
          href={`/${locale}/dashboard/admin/trip-requests`}
        >
          <ArrowLeft />
          {copy.back}
        </Link>
        <button
          className={styles.backLink}
          onClick={onContactTraveler}
          type="button"
        >
          <Mail />
          {copy.contactTraveler}
        </button>
      </div>

      <div className={styles.header} data-component="TripFulfillmentHeader">
        <div className={styles.headerTitleBlock}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={`${styles.pageTitle} ${styles.cond}`}>{title}</h1>
          <p className={styles.pageSubtitle}>{trip.user.email}</p>
          <dl className={styles.summaryFields}>
            <div className={styles.summaryField}>
              <dt>{copy.tripStatusLabel}</dt>
              <dd>
                <StatusBadge
                  label={statusLabel(trip.status)}
                  status={trip.status}
                  variant="trip"
                />
              </dd>
            </div>
            <div className={styles.summaryField}>
              <dt>{copy.tripTypeLabel}</dt>
              <dd>
                <ProductBadge value={trip.type} />
              </dd>
            </div>
            {showLevelChip ? (
              <div className={styles.summaryField}>
                <dt>{copy.levelLabel}</dt>
                <dd>
                  <ProductBadge value={trip.level} />
                </dd>
              </div>
            ) : null}
            {trip.payment ? (
              <div className={styles.summaryField}>
                <dt>{copy.paymentLabel}</dt>
                <dd>
                  <StatusBadge
                    label={
                      paymentStatusLabels[trip.payment.status] ??
                      trip.payment.status
                    }
                    status={trip.payment.status}
                    variant="payment"
                  />
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        {callout ? (
          <div className={styles.callout}>
            <div className={styles.calloutBar} />
            <div className={styles.calloutText}>
              <span className={styles.calloutLabel}>{callout.label}</span>
              <span className={`${styles.calloutValue} ${styles.cond}`}>
                {callout.value}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
