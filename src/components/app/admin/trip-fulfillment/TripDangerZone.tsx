"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

interface TripDangerZoneProps {
  copy: MarketingDictionary["adminTripEditModal"];
  onDelete: () => Promise<void>;
}

/** Carried from `TripRequestModal.tsx` (design.md ADR-8) — unchanged behavior,
 * restyled to match the approved prototype's danger card. */
export function TripDangerZone({ copy, onDelete }: TripDangerZoneProps) {
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await onDelete();
    } catch {
      setDeleteError(copy.deleteError);
    } finally {
      setDeleting(false);
    }
  }

  if (deleteConfirming) {
    return (
      <div className={styles.dangerCard}>
        <div className={styles.dangerText}>
          <AlertTriangle className={styles.dangerIcon} />
          <div>
            <p className={styles.dangerTitle}>{copy.deleteConfirm}</p>
            {deleteError ? <p className={styles.dangerCopy}>{deleteError}</p> : null}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            disabled={deleting}
            onClick={() => {
              setDeleteConfirming(false);
              setDeleteError("");
            }}
            type="button"
          >
            {copy.deleteCancel}
          </button>
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            disabled={deleting}
            onClick={() => void handleDelete()}
            type="button"
          >
            {deleting ? copy.deleteDeleting : copy.deleteTrip}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dangerCard}>
      <div className={styles.dangerText}>
        <AlertTriangle className={styles.dangerIcon} />
        <div>
          <p className={styles.dangerTitle}>{copy.deleteTrip}</p>
          <p className={styles.dangerCopy}>{copy.deleteHint}</p>
        </div>
      </div>
      <button
        className={`${styles.btn} ${styles.btnDanger}`}
        onClick={() => setDeleteConfirming(true)}
        type="button"
      >
        {copy.deleteTrip}
      </button>
    </div>
  );
}
