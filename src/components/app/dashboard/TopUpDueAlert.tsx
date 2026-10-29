"use client";

import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getTripExperienceDisplay } from "@/lib/helpers/dashboard-trip-display";
import { formatPaymentDeadline } from "@/lib/payments/payment-deadline";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "./types";

interface TopUpDueAlertProps {
  copy: DashboardCopy["topUpDue"];
  locale: string;
  /** Trips where the viewer owes a top-up (`trip.myTopUp` set). */
  trips: Trip[];
  onPay: (trip: Trip) => void;
}

const money = (amount: number, currency: string) =>
  `${currency} ${amount.toFixed(Number.isInteger(amount) ? 0 : 2)}`;

/** Action-needed banner for the viewer's own top-ups after a group shrank. */
export function TopUpDueAlert({ copy, locale, trips, onPay }: TopUpDueAlertProps) {
  const due = trips.filter((trip) => trip.myTopUp);
  if (due.length === 0) return null;
  const lang = locale.startsWith("en") ? "en" : "es";

  return (
    <section data-component="TopUpDueAlert">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{copy.eyebrow}</p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-bold uppercase leading-none text-ink">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm text-neutral-700">{copy.message}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-1 bg-amber-400" />
        <ul className="divide-y divide-gray-100">
          {due.map((trip) => {
            const topUp = trip.myTopUp!;
            const { levelName, travelerTypeTitle } = getTripExperienceDisplay(trip, locale);
            const due = topUp.deadline
              ? copy.deadline.replace("{date}", formatPaymentDeadline(new Date(topUp.deadline), lang, null))
              : copy.remainderNote;
            return (
              <li className="flex flex-wrap items-center justify-between gap-4 px-5 py-4" key={trip.id}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{travelerTypeTitle}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{levelName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="font-barlow-condensed text-lg font-bold leading-none text-ink">
                      {money(topUp.amount, topUp.currency)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">{due}</p>
                  </div>
                  <Button onClick={() => onPay(trip)} size="sm" type="button">
                    <CreditCard aria-hidden className="h-4 w-4" />
                    {copy.action}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
