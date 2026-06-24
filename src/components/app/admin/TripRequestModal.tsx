"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormSelectField } from "@/components/ui/FormField";
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
    experienceId: trip.experienceId ?? "",
    status: trip.status,
  });
  const [assignableExperiences, setAssignableExperiences] = useState<
    AssignableExperience[]
  >([]);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      experienceId: trip.experienceId ?? "",
      status: trip.status,
    });
  }, [trip.experienceId, trip.id, trip.status]);

  useEffect(() => {
    setDeleteConfirming(false);
    setDeleteError("");
  }, [trip.id]);

  useEffect(() => {
    const params = new URLSearchParams({ status: "ACTIVE" });
    if (trip.tripperId) params.set("tripperId", trip.tripperId);
    if (trip.type) params.set("type", trip.type);

    fetch(`/api/admin/experiences?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { experiences?: AssignableExperience[] }) => {
        setAssignableExperiences(data.experiences ?? []);
      })
      .catch(() => {
        setAssignableExperiences([]);
      });
  }, [trip.tripperId, trip.type]);

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

    // Build PATCH body — do NOT include actualDestination (derived server-side from experienceId)
    const body: { status?: TripRequestStatus; experienceId?: string } = {
      status: draft.status,
    };
    if (draft.experienceId) {
      body.experienceId = draft.experienceId;
    }

    const res = await fetch(`/api/admin/trip-requests/${trip.id}`, {
      body: JSON.stringify(body),
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
        <DialogTitle className="font-barlow-condensed font-bold text-2xl uppercase text-neutral-900">
          {modalTitle}
        </DialogTitle>
        <DialogDescription className="text-sm text-neutral-500 mt-0.5">
          {modalDescription}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5 border-b border-gray-200 px-6 py-3">
          <span className="inline-block rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
            {trip.type}
          </span>
          <StatusBadge status={trip.status} variant="trip" />
          <span className="inline-block rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
            {trip.level}
          </span>
          {trip.payment ? (
            <StatusBadge status={trip.payment.status} variant="payment" />
          ) : null}
        </div>

        <div className="border-b border-gray-200 px-6 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            {dict.sectionSummary}
          </p>
          <TripRequestDetails labels={dict.details} trip={trip} />
        </div>

        {/* Experience + derived destination + status */}
        <div className="border-b border-gray-200 px-6 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            {dict.sectionManageTrip}
          </p>
          <div className="flex flex-col gap-3">
            <FormSelectField
              id="modal-trip-experience"
              label={dict.experienceLabel}
              onChange={(e) =>
                setDraft((d) => ({ ...d, experienceId: e.target.value }))
              }
              value={draft.experienceId}
            >
              <option value="">{dict.experiencePlaceholder}</option>
              {assignableExperiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title} — {exp.destinationCity}, {exp.destinationCountry}
                </option>
              ))}
            </FormSelectField>

            {/* Destination — read-only preview derived from selected experience */}
            {trip.actualDestination && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
                <span className="text-sm text-neutral-500">{dict.destinationLabel}</span>
                <span className="text-sm font-semibold text-neutral-900">{trip.actualDestination}</span>
              </div>
            )}

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
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            {dict.sectionDanger}
          </p>
          <p className="mb-3 text-sm text-neutral-600">{dict.deleteHint}</p>
          {deleteError ? (
            <p className="mb-2 text-sm font-medium text-red-600">
              {deleteError}
            </p>
          ) : null}
          {!deleteConfirming ? (
            <Button
              className="border-red-800 text-red-800 hover:bg-red-50"
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
              <p className="text-sm font-semibold text-red-900">
                {dict.deleteConfirm}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  
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
          
          disabled={saving}
          onClick={onClose}
          size="sm"
          type="button"
          variant="secondary"
        >
          {dict.cancel}
        </Button>
        <Button
          
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
