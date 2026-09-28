"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminTripFulfillmentDict } from "@/lib/types/dictionary";
import { DocumentActionButton } from "./DocumentActionButton";
import styles from "./fulfillment.module.css";

interface TripTravelerReminderProps {
  copy: AdminTripFulfillmentDict["travelers"]["reminder"];
  onComplete: () => Promise<void>;
  tripId: string;
}

/** Key this component by tripId so daily feedback never carries across trips. */
export function TripTravelerReminder({
  copy,
  onComplete,
  tripId,
}: TripTravelerReminderProps) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<
    | "sent"
    | "alreadyComplete"
    | "notEligible"
    | "rosterNeedsReview"
    | "failed"
    | "refreshFailed"
    | null
  >(null);
  const [nextEligibleAt, setNextEligibleAt] = useState<number | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!nextEligibleAt) return;
    const timer = setTimeout(
      () => {
        setNextEligibleAt(null);
        setFeedback(null);
      },
      Math.max(0, nextEligibleAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [nextEligibleAt]);

  async function handleSend() {
    if (inFlight.current || nextEligibleAt) return;
    inFlight.current = true;
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/admin/trip-requests/${encodeURIComponent(tripId)}/traveler-reminder`,
        { method: "POST" },
      );
      const data = (await response.json()) as {
        status?: string;
        nextEligibleAt?: string;
      };
      if (!mounted.current) return;
      if (data.status === "already_complete" && response.ok) {
        setFeedback("alreadyComplete");
        try {
          await onComplete();
        } catch {
          if (mounted.current) setFeedback("refreshFailed");
        }
      } else if (data.status === "roster_needs_review") {
        setFeedback("rosterNeedsReview");
      } else if (data.status === "not_eligible") {
        setFeedback("notEligible");
      } else if (
        data.status === "accepted" &&
        response.ok &&
        data.nextEligibleAt &&
        Number.isFinite(Date.parse(data.nextEligibleAt))
      ) {
        setFeedback("sent");
        setNextEligibleAt(Date.parse(data.nextEligibleAt));
      } else {
        throw new Error("reminder_failed");
      }
    } catch {
      if (mounted.current) setFeedback("failed");
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <div className="border-gray-200 border-t mt-4 pt-4">
      <DocumentActionButton
        className={`${styles.btn} ${styles.btnSecondary} ${styles.travelerReminderButton}`}
        disabled={!!nextEligibleAt}
        onClick={() => void handleSend()}
        pending={pending}
        pendingLabel={copy.sending}
        type="button"
      >
        {copy.send}
      </DocumentActionButton>
      <p className="mt-2 text-neutral-600 text-xs">{copy.dailyNote}</p>
      {feedback && (
        <p
          className="mt-2 text-neutral-700 text-sm"
          role={feedback === "failed" ? "alert" : "status"}
        >
          {copy[feedback]}
        </p>
      )}
    </div>
  );
}
