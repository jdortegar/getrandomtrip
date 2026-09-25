"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { TripRequestDetails } from "@/components/app/admin/TripRequestDetails";
import { TripFulfillmentHeader } from "@/components/app/admin/trip-fulfillment/TripFulfillmentHeader";
import { TripManagePanel } from "@/components/app/admin/trip-fulfillment/TripManagePanel";
import { TripItineraryReference } from "@/components/app/admin/trip-fulfillment/TripItineraryReference";
import { useTripDocumentSource } from "@/components/app/admin/trip-fulfillment/useTripDocumentSource";
import { DocumentSourceFeedback } from "@/components/app/admin/trip-fulfillment/DocumentSourceFeedback";
import { TripDocumentsTable } from "@/components/app/admin/trip-fulfillment/TripDocumentsTable";
import { useAttachedDocumentActions } from "@/components/app/admin/trip-fulfillment/useAttachedDocumentActions";
import { DocumentActionButton } from "@/components/app/admin/trip-fulfillment/DocumentActionButton";
import { useAttachedDocuments } from "@/components/app/admin/trip-fulfillment/useAttachedDocuments";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { DocumentDraftPanel } from "@/components/app/admin/trip-fulfillment/DocumentDraftPanel";
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
  const attached = useAttachedDocuments(tripId);
  const { documents, replace: setDocuments } = attached;
  const dictionary = locale === "en" ? en : es;
  const workflow = dictionary.documentWorkflow;
  const [attachmentVersion, setAttachmentVersion] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [assignableExperiences, setAssignableExperiences] = useState<
    AssignableExperience[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const savePending = useRef(false);
  const attachmentActions = useAttachedDocumentActions({
    tripId,
    errors: fulfillmentDict.errors,
    replace: setDocuments,
    onRemoved: () => setAttachmentVersion((value) => value + 1),
  });
  const [contactOpen, setContactOpen] = useState(false);
  const source = useTripDocumentSource(
    tripId,
    draft?.experienceId === (trip?.experienceId ?? "")
      ? undefined
      : draft?.experienceId || null,
    !!trip && !!draft,
  );

  const loadTrip = useCallback(
    async (initial = true) => {
      if (initial) setLoading(true);
      const res = await fetch(`/api/admin/trip-requests/${tripId}`);
      if (!res.ok) {
        if (!initial) throw new Error("trip_refresh_failed");
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as {
        tripRequest: AdminTripRequest;
        documents: TripDocumentDTO[];
      };
      setTrip(data.tripRequest);
      setDocuments(data.documents);
      setDraft({
        experienceId: data.tripRequest.experienceId ?? "",
        status: data.tripRequest.status,
      });
      setLoading(false);
    },
    [tripId, setDocuments],
  );

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
    (draft.experienceId !== (trip.experienceId ?? "") ||
      draft.status !== trip.status);

  async function handleSave() {
    if (!draft || savePending.current) return;
    savePending.current = true;
    setSaving(true);
    setSaveError(false);
    const body: { status?: TripRequestStatus; experienceId?: string } = {
      status: draft.status,
    };
    if (draft.experienceId !== (trip?.experienceId ?? ""))
      body.experienceId = draft.experienceId;
    try {
      const res = await fetch(`/api/admin/trip-requests/${tripId}`, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) throw new Error("trip_save_failed");
      await loadTrip(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
      savePending.current = false;
    }
  }

  function handleDiscard() {
    if (!trip) return;
    setDraft({ experienceId: trip.experienceId ?? "", status: trip.status });
  }

  async function handleDelete() {
    const res = await fetch(`/api/admin/trip-requests/${tripId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("delete_failed");
    router.push(`/${locale}/dashboard/admin/trip-requests`);
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
                <span className={styles.sectionNumber}>
                  {dict.sectionSummary}
                </span>
                <p className={styles.panelTitle} style={{ marginTop: 4 }}>
                  {dict.sectionManageTrip}
                </p>
              </div>
            </div>
            <div className={styles.grid2} style={{ marginTop: 18 }}>
              <TripManagePanel
                assignableExperiences={assignableExperiences}
                copy={dict}
                disabled={saving}
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
        <div>
          <p className="mb-3 text-sm text-neutral-500">{workflow.sourceNote}</p>
          <DocumentSourceFeedback copy={workflow} source={source} />
          {source.status === "ready" && (
            <TripItineraryReference
              copy={fulfillmentDict}
              experienceItinerary={source.context?.experienceItinerary ?? null}
            />
          )}
        </div>

        {/* Section 3 — Fulfillment documents: individual to this trip. */}
        <div className={styles.panel}>
          <div className={styles.panelBody}>
            <p className={styles.panelTitle}>
              {fulfillmentDict.documentsTitle}
            </p>
            <p className={styles.panelDesc}>{fulfillmentDict.documentsNote}</p>
            <h3 className="mt-6 text-xl font-semibold text-ink">
              {workflow.attachedDocuments}
            </h3>
            {(attached.status === "error" || attached.status === "loading") && (
              <div role="alert">
                {attached.status === "error" && <p>{workflow.refreshError}</p>}
                <DocumentActionButton
                  className={styles.btn}
                  onClick={() => void attached.refresh()}
                  pending={attached.status === "loading"}
                  pendingLabel={dictionary.documentActions.refreshing}
                  type="button"
                >
                  {workflow.retry}
                </DocumentActionButton>
              </div>
            )}
            {attachmentActions.error?.kind === "remove" && (
              <p role="alert">{attachmentActions.error.message}</p>
            )}
            <div style={{ marginTop: 18 }}>
              {(documents.length > 0 || attached.status === "ready") && (
                <TripDocumentsTable
                  busy={attachmentActions.busy}
                  copy={fulfillmentDict}
                  countryLabels={countryLabels}
                  documents={documents}
                  onRemove={(id) => void attachmentActions.remove(id)}
                  removingId={
                    attachmentActions.operation?.kind === "remove"
                      ? (attachmentActions.operation.id ?? null)
                      : null
                  }
                />
              )}
            </div>
            <DocumentDraftPanel
              attachmentVersion={attachmentVersion}
              autoLoad
              countryLabels={countryLabels}
              key={trip.id}
              locale={locale}
              onAttached={attached.refresh}
              onEnsureAttached={attached.ensure}
              source={source}
              tripId={trip.id}
            />
            <details className="border-t border-gray-200 pt-4">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                {workflow.uploadExisting}
              </summary>
              <AddTripDocumentForm
                copy={fulfillmentDict}
                countryLabels={countryLabels}
                disabled={attachmentActions.busy}
                errorMessage={
                  attachmentActions.error?.kind === "upload"
                    ? attachmentActions.error.message
                    : null
                }
                onSubmit={attachmentActions.upload}
                submitting={attachmentActions.operation?.kind === "upload"}
              />
            </details>
          </div>
        </div>

        <div
          className={styles.headerActions}
          style={{ justifyContent: "flex-end" }}
        >
          {saveError && <p role="alert">{fulfillmentDict.errors.generic}</p>}
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            disabled={saving || !hasChanges}
            onClick={handleDiscard}
            type="button"
          >
            {fulfillmentDict.discard}
          </button>
          <button
            aria-busy={saving}
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving || !hasChanges}
            onClick={() => void handleSave()}
            type="button"
          >
            {saving && (
              <Loader2 aria-hidden="true" className="animate-spin h-4 w-4" />
            )}
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
