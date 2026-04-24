"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { AdminTripRequest, TripRequestStatus } from "@/lib/admin/types";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { TripRequestDetails } from "./TripRequestDetails";
import { TripStatusTimeline } from "./TripStatusTimeline";

const STATUS_OPTIONS: TripRequestStatus[] = [
  "DRAFT",
  "SAVED",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
  "CANCELLED",
];

interface Draft {
  actualDestination: string;
  status: TripRequestStatus;
}

type TripEditCopy = MarketingDictionary["adminTripEditModal"];

interface TripRequestModalProps {
  dict: TripEditCopy;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
  trip: AdminTripRequest;
}

export function TripRequestModal({
  dict,
  onClose,
  onSaved,
  open,
  trip,
}: TripRequestModalProps) {
  const [draft, setDraft] = useState<Draft>({
    actualDestination: trip.actualDestination ?? "",
    status: trip.status,
  });
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      actualDestination: trip.actualDestination ?? "",
      status: trip.status,
    });
  }, [trip.actualDestination, trip.id, trip.status]);

  useEffect(() => {
    setDeleteConfirming(false);
    setDeleteError("");
  }, [trip.id]);

  function statusLabel(status: TripRequestStatus): string {
    return dict.tripStatus[status];
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(`/api/admin/trip-requests/${trip.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (res.ok) {
      onSaved();
      onClose();
      return;
    }
    setDeleteError(dict.deleteError);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/trip-requests/${trip.id}`, {
      body: JSON.stringify({
        actualDestination: draft.actualDestination,
        status: draft.status,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
      onClose();
    }
  }

  const modalDescription = interpolateTemplate(dict.description, {
    tripId: trip.id,
  });

  const modalTitle = interpolateTemplate(dict.title, {
    userName: trip.user.name,
  });

  return (
    <Modal
      className="flex max-h-[min(90vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden border-gray-200 p-0 sm:max-w-2xl"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open={open}
      showCloseButton
    >
      <DialogHeader className="shrink-0 border-b border-gray-200 px-6 py-4 text-left">
        <DialogTitle className="text-xl font-semibold text-gray-900">
          {modalTitle}
        </DialogTitle>
        <DialogDescription className="text-base text-gray-700">
          {modalDescription}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5 border-b border-gray-200 px-6 py-2.5">
          <span className="inline-block rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-base font-bold text-gray-900">
            {trip.type}
          </span>
          <StatusBadge
            className="text-base"
            status={trip.status}
            variant="trip"
          />
          <span className="inline-block rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-base font-bold text-gray-900">
            {trip.level}
          </span>
          {trip.payment ? (
            <StatusBadge
              className="text-base"
              status={trip.payment.status}
              variant="payment"
            />
          ) : null}
        </div>

        <div className="border-b border-gray-200 px-6 py-4">
          <p className="mb-3 text-base font-bold uppercase tracking-wide text-gray-800">
            {dict.sectionSummary}
          </p>
          <TripRequestDetails labels={dict.details} trip={trip} />
        </div>

        <div className="border-b border-gray-200 px-6 py-4">
          <p className="mb-2 text-base font-bold uppercase tracking-wide text-gray-800">
            {dict.sectionManageTrip}
          </p>
          <p className="mb-3 text-base text-gray-700">{dict.destinationHelp}</p>
          <div className="flex flex-col gap-3">
            <FormField
              id="modal-trip-destination"
              label={dict.destinationLabel}
              onChange={(e) =>
                setDraft((d) => ({ ...d, actualDestination: e.target.value }))
              }
              placeholder={dict.destinationPlaceholder}
              type="text"
              value={draft.actualDestination}
            />
            <FormSelectField
              id="modal-trip-status"
              label={dict.statusLabel}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  status: e.target.value as TripRequestStatus,
                }))
              }
              value={draft.status}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </FormSelectField>
          </div>
        </div>

        <div className="border-b border-gray-200 px-6 py-4">
          <TripStatusTimeline
            currentStatus={draft.status}
            statusLabel={statusLabel}
            timelineTitle={dict.sectionTimeline}
            trip={trip}
          />
        </div>

        <div className="px-6 py-4">
          <p className="mb-2 text-base font-bold uppercase tracking-wide text-gray-800">
            {dict.sectionDanger}
          </p>
          <p className="mb-3 text-base text-gray-700">{dict.deleteHint}</p>
          {deleteError ? (
            <p className="mb-2 text-base font-medium text-red-600">
              {deleteError}
            </p>
          ) : null}
          {!deleteConfirming ? (
            <Button
              className={cn(
                " border-red-800 text-base text-red-800",
                "hover:bg-red-50",
              )}
              disabled={deleting}
              onClick={() => setDeleteConfirming(true)}
              size="sm"
              type="button"
              variant="secondary"
            >
              {dict.deleteTrip}
            </Button>
          ) : (
            <div
              className={cn(
                "flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50",
                "p-3",
              )}
            >
              <p className="text-base font-semibold text-red-900">
                {dict.deleteConfirm}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  className="text-base"
                  disabled={deleting}
                  onClick={() => {
                    setDeleteConfirming(false);
                    setDeleteError("");
                  }}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {dict.deleteCancel}
                </Button>
                <Button
                  className="text-base"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  {deleting ? dict.deleteDeleting : dict.deleteTrip}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="shrink-0 border-t border-gray-200 px-6 py-4 sm:justify-end">
        <Button
          className="text-base"
          disabled={saving}
          onClick={onClose}
          size="sm"
          type="button"
          variant="secondary"
        >
          {dict.cancel}
        </Button>
        <Button
          className="text-base"
          disabled={saving}
          onClick={() => void handleSave()}
          size="sm"
          type="button"
          variant="default"
        >
          {saving ? dict.saving : dict.saveChanges}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
