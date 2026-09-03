"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { TripRequestDetails } from "@/components/app/admin/TripRequestDetails";
import { TripFulfillmentHeader } from "@/components/app/admin/trip-fulfillment/TripFulfillmentHeader";
import { TripManagePanel } from "@/components/app/admin/trip-fulfillment/TripManagePanel";
import { TripItineraryReference } from "@/components/app/admin/trip-fulfillment/TripItineraryReference";
import type { ExperienceItinerary } from "@/components/app/admin/trip-fulfillment/TripItineraryReference";
import { TripDocumentsTable } from "@/components/app/admin/trip-fulfillment/TripDocumentsTable";
import { AddTripDocumentForm } from "@/components/app/admin/trip-fulfillment/AddTripDocumentForm";
import { TripDangerZone } from "@/components/app/admin/trip-fulfillment/TripDangerZone";
import { ContactTravelerModal } from "@/components/app/admin/trip-fulfillment/ContactTravelerModal";
import { buildAssignableExperiencesQuery } from "@/lib/admin/assignableExperiences";
import type { AdminTripRequest, TripRequestStatus } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { TripDocumentDTO } from "@/types/tripDocument";
import styles from "@/components/app/admin/trip-fulfillment/fulfillment.module.css";

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

export interface AdminTripFulfillmentPageClientProps {
  dict: MarketingDictionary["adminTripEditModal"];
  fulfillmentDict: MarketingDictionary["adminTripFulfillment"];
  countryLabels: Record<string, string>;
  locale: string;
  paymentStatusLabels: Record<string, string>;
  tripId: string;
}

export function AdminTripFulfillmentPageClient({
  dict,
  fulfillmentDict,
  countryLabels,
  locale,
  paymentStatusLabels,
  tripId,
}: AdminTripFulfillmentPageClientProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<AdminTripRequest | null>(null);
  const [experienceItinerary, setExperienceItinerary] =
    useState<ExperienceItinerary | null>(null);
  const [documents, setDocuments] = useState<TripDocumentDTO[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [assignableExperiences, setAssignableExperiences] = useState<
    AssignableExperience[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addDocError, setAddDocError] = useState<string | null>(null);
  const [addingDoc, setAddingDoc] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const loadTrip = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/trip-requests/${tripId}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as {
      tripRequest: AdminTripRequest;
      experienceItinerary: ExperienceItinerary | null;
      documents: TripDocumentDTO[];
    };
    setTrip(data.tripRequest);
    setExperienceItinerary(data.experienceItinerary);
    setDocuments(data.documents);
    setDraft({
      experienceId: data.tripRequest.experienceId ?? "",
      status: data.tripRequest.status,
    });
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    void loadTrip();
  }, [loadTrip]);

  useEffect(() => {
    if (!trip) return;
    const params = buildAssignableExperiencesQuery(trip);
    fetch(`/api/admin/experiences?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { experiences?: AssignableExperience[] }) => {
        setAssignableExperiences(data.experiences ?? []);
      })
      .catch(() => setAssignableExperiences([]));
  }, [trip]);

  function statusLabel(status: TripRequestStatus): string {
    return dict.tripStatus[status];
  }

  const hasChanges =
    !!trip &&
    !!draft &&
    (draft.experienceId !== (trip.experienceId ?? "") || draft.status !== trip.status);

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    const body: { status?: TripRequestStatus; experienceId?: string } = {
      status: draft.status,
    };
    if (draft.experienceId) body.experienceId = draft.experienceId;
    const res = await fetch(`/api/admin/trip-requests/${tripId}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    setSaving(false);
    if (res.ok) {
      await loadTrip();
    }
  }

  function handleDiscard() {
    if (!trip) return;
    setDraft({ experienceId: trip.experienceId ?? "", status: trip.status });
  }

  async function handleDelete() {
    const res = await fetch(`/api/admin/trip-requests/${tripId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete_failed");
    router.push(`/${locale}/dashboard/admin/trip-requests`);
  }

  async function handleAddDocument(input: { label: string; country: string; file: File }) {
    setAddingDoc(true);
    setAddDocError(null);
    const formData = new FormData();
    formData.set("tripRequestId", tripId);
    formData.set("label", input.label);
    formData.set("country", input.country);
    formData.set("file", input.file);
    const res = await fetch("/api/admin/trip-documents", {
      method: "POST",
      body: formData,
    });
    setAddingDoc(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errorKey = body?.error as keyof typeof fulfillmentDict.errors | undefined;
      setAddDocError(
        (errorKey && fulfillmentDict.errors[errorKey]) ?? fulfillmentDict.errors.generic,
      );
      return;
    }
    const data = (await res.json()) as { document: TripDocumentDTO };
    setDocuments((prev) => [data.document, ...prev]);
  }

  async function handleRemoveDocument(documentId: string) {
    setRemovingId(documentId);
    const res = await fetch(`/api/admin/trip-documents/${documentId}`, {
      method: "DELETE",
    });
    setRemovingId(null);
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    }
  }

  if (loading) return <LoadingSpinner />;
  if (notFound || !trip || !draft) {
    return (
      <div className="p-8 text-center text-sm text-ink">
        {fulfillmentDict.errors.trip_not_found}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.stack}>
        <TripFulfillmentHeader
          copy={fulfillmentDict}
          locale={locale}
          onContactTraveler={() => setContactOpen(true)}
          paymentStatusLabels={paymentStatusLabels}
          statusLabel={statusLabel}
          trip={trip}
        />

        {/* Section 1 — Trip & Booking: assignment/status controls (left)
            plus the core booking facts (right), danger zone below — one
            merged panel, matching the approved prototype exactly. */}
        <div className={styles.panel}>
          <div className={styles.panelBody}>
            <div className={styles.sectionHeadingRow}>
              <div>
                <span className={styles.sectionNumber}>{dict.sectionSummary}</span>
                <p className={styles.panelTitle} style={{ marginTop: 4 }}>
                  {dict.sectionManageTrip}
                </p>
              </div>
            </div>
            <div className={styles.grid2} style={{ marginTop: 18 }}>
              <TripManagePanel
                assignableExperiences={assignableExperiences}
                copy={dict}
                draft={draft}
                onChange={setDraft}
                statusLabel={statusLabel}
                trip={trip}
              />
              <TripRequestDetails labels={dict.details} trip={trip} />
            </div>
            <div style={{ marginTop: 22 }}>
              <TripDangerZone copy={dict} onDelete={handleDelete} />
            </div>
          </div>
        </div>

        {/* Section 2 — Itinerary reference: owns its own panel wrapper,
            visually distinct since it's read-only/shared by the drop. */}
        <TripItineraryReference copy={fulfillmentDict} experienceItinerary={experienceItinerary} />

        {/* Section 3 — Fulfillment documents: individual to this trip. */}
        <div className={styles.panel}>
          <div className={styles.panelBody}>
            <p className={styles.panelTitle}>{fulfillmentDict.documentsTitle}</p>
            <p className={styles.panelDesc}>{fulfillmentDict.documentsNote}</p>
            <div style={{ marginTop: 18 }}>
              <TripDocumentsTable
                copy={fulfillmentDict}
                countryLabels={countryLabels}
                documents={documents}
                onRemove={(id) => void handleRemoveDocument(id)}
                removingId={removingId}
              />
            </div>
            <AddTripDocumentForm
              copy={fulfillmentDict}
              countryLabels={countryLabels}
              errorMessage={addDocError}
              onSubmit={handleAddDocument}
              submitting={addingDoc}
            />
          </div>
        </div>

        <div className={styles.headerActions} style={{ justifyContent: "flex-end" }}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            disabled={saving || !hasChanges}
            onClick={handleDiscard}
            type="button"
          >
            {fulfillmentDict.discard}
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving || !hasChanges}
            onClick={() => void handleSave()}
            type="button"
          >
            {saving ? fulfillmentDict.saving : fulfillmentDict.save}
          </button>
        </div>
      </div>

      <ContactTravelerModal
        copy={fulfillmentDict}
        onClose={() => setContactOpen(false)}
        open={contactOpen}
        traveler={trip.user}
        tripId={tripId}
      />
    </div>
  );
}
