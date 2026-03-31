"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import SecureRoute from "@/components/auth/SecureRoute";
import HeaderHero from "@/components/journey/HeaderHero";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import Section from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";

type TripRequestStatus =
  | "DRAFT"
  | "SAVED"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "REVEALED"
  | "COMPLETED"
  | "CANCELLED";

interface AdminTripRequest {
  accommodationType: string;
  addons: unknown;
  arrivePref: string;
  avoidDestinations: string[];
  actualDestination: string | null;
  climate: string;
  completedAt: string | null;
  createdAt: string;
  customerFeedback: string | null;
  customerRating: number | null;
  departPref: string;
  destinationRevealedAt: string | null;
  endDate: string | null;
  from: string;
  id: string;
  level: string;
  maxTravelTime: string;
  nights: number;
  originCity: string;
  originCountry: string;
  pax: number;
  paxDetails: unknown;
  package: null | {
    excuseKey: string | null;
    id: string;
    level: string;
    title: string;
    type: string;
  };
  payment: null | { amount: number; currency: string; status: string };
  startDate: string | null;
  status: TripRequestStatus;
  transport: string;
  tripPhotos: unknown;
  type: string;
  updatedAt: string;
  user: { email: string; id: string; name: string };
}

interface RowDraft {
  actualDestination: string;
  status: TripRequestStatus;
}

const STATUS_OPTIONS: TripRequestStatus[] = [
  "DRAFT",
  "SAVED",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
  "CANCELLED",
];

function AdminDashboardContent() {
  const [tripRequests, setTripRequests] = useState<AdminTripRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [editingTripRequestId, setEditingTripRequestId] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/admin/trip-requests");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error loading trip requests.");
        }

        const incoming = (data.tripRequests || []) as AdminTripRequest[];
        setTripRequests(incoming);
        const nextDrafts: Record<string, RowDraft> = {};
        for (const request of incoming) {
          nextDrafts[request.id] = {
            actualDestination: request.actualDestination || "",
            status: request.status,
          };
        }
        setDrafts(nextDrafts);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Error loading trip requests.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function updateDraft<K extends keyof RowDraft>(
    key: K,
    tripRequestId: string,
    value: RowDraft[K],
  ) {
    setDrafts((current) => ({
      ...current,
      [tripRequestId]: {
        ...current[tripRequestId],
        [key]: value,
      },
    }));
  }

  async function saveChanges(tripRequestId: string) {
    const draft = drafts[tripRequestId];
    if (!draft) return;

    try {
      setSavingId(tripRequestId);
      setError("");
      const response = await fetch(
        `/api/admin/trip-requests/${tripRequestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actualDestination: draft.actualDestination,
            status: draft.status,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error updating trip request.");
      }

      setTripRequests((current) =>
        current.map((request) =>
          request.id === tripRequestId
            ? (data.tripRequest as AdminTripRequest)
            : request,
        ),
      );
      setEditingTripRequestId(null);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Error updating trip request.";
      setError(message);
    } finally {
      setSavingId(null);
    }
  }

  const editingTripRequest = tripRequests.find(
    (request) => request.id === editingTripRequestId,
  );
  const editingDraft = editingTripRequestId
    ? drafts[editingTripRequestId]
    : undefined;

  function formatDate(dateValue: string | null) {
    if (!dateValue) return "-";
    return new Date(dateValue).toLocaleDateString();
  }

  function formatJson(value: unknown) {
    if (value == null) return "-";
    if (Array.isArray(value) && value.length === 0) return "-";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }

  return (
    <>
      <HeaderHero
        className="!h-[40vh]"
        description="Manage all trip requests, assign revealed destination and update request status."
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle="ADMIN DASHBOARD"
        title="Trip Requests"
        videoSrc="/videos/hero-video-1.mp4"
      />
      <Section>
        <div className="rt-container">
          {loading ? <LoadingSpinner /> : null}
          {!loading && error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          ) : null}
          {!loading && tripRequests.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">
              No trip requests found.
            </div>
          ) : null}
          {!loading && tripRequests.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
              <table className="min-w-max divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      User ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      User Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      User Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      From
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Origin Country
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Origin City
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      End Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Nights
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Pax
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Pax Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Accommodation Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Transport
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Climate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Max Travel Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Depart Pref
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Arrive Pref
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Avoid Destinations
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Addons
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Package ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Package Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Package Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Package Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Package Excuse Key
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Payment Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Payment Currency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Payment Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Actual Destination
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Destination Revealed At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Completed At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Customer Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Customer Feedback
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Trip Photos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Created At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Updated At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {tripRequests.map((request) => (
                    <tr className="hover:bg-neutral-50" key={request.id}>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.user.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.from}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.level}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.originCountry}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.originCity}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {formatDate(request.startDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {formatDate(request.endDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.nights}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.pax}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {formatJson(request.paxDetails)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.accommodationType}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.transport}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.climate}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.maxTravelTime}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.departPref}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.arrivePref}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.avoidDestinations.length > 0
                          ? request.avoidDestinations.join(", ")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {formatJson(request.addons)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.package?.id ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.package?.title ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.package?.type ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.package?.level ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.package?.excuseKey ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.payment?.amount ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.payment?.currency ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.payment?.status ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.actualDestination || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.status}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {formatDate(request.destinationRevealedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {formatDate(request.completedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.customerRating ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {request.customerFeedback || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {formatJson(request.tripPhotos)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                        {formatDate(request.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-left whitespace-nowrap">
                        <Button
                          aria-label={`Edit trip request ${request.id}`}
                          onClick={() => setEditingTripRequestId(request.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </Section>
      {editingTripRequest && editingDraft ? (
        <div
          aria-labelledby="admin-edit-trip-request-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditingTripRequestId(null)}
          />
          <div className="relative w-full max-w-xl rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h2
                className="text-lg font-semibold text-neutral-900"
                id="admin-edit-trip-request-title"
              >
                Edit trip request
              </h2>
              <p className="text-sm text-neutral-600">
                Update destination and status, then save changes.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                <p>
                  <span className="font-semibold text-neutral-900">
                    Traveler:
                  </span>{" "}
                  {editingTripRequest.user.name} (
                  {editingTripRequest.user.email})
                </p>
                <p>
                  <span className="font-semibold text-neutral-900">
                    Origin:
                  </span>{" "}
                  {editingTripRequest.originCity},{" "}
                  {editingTripRequest.originCountry}
                </p>
              </div>
              <FormField
                id="edit-destination"
                label="Destination"
                onChange={(event) =>
                  updateDraft(
                    "actualDestination",
                    editingTripRequest.id,
                    event.target.value,
                  )
                }
                placeholder="e.g. Lisbon, Portugal"
                type="text"
                value={editingDraft.actualDestination}
              />
              <FormSelectField
                id="edit-status"
                label="Status"
                onChange={(event) =>
                  updateDraft(
                    "status",
                    editingTripRequest.id,
                    event.target.value as TripRequestStatus,
                  )
                }
                value={editingDraft.status}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </FormSelectField>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                onClick={() => setEditingTripRequestId(null)}
                size="sm"
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !editingTripRequestId || savingId === editingTripRequestId
                }
                onClick={() => {
                  if (editingTripRequestId)
                    void saveChanges(editingTripRequestId);
                }}
                size="sm"
                type="button"
              >
                {savingId && editingTripRequestId === savingId
                  ? "Saving..."
                  : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <SecureRoute requiredRole="admin">
      <AdminDashboardContent />
    </SecureRoute>
  );
}
