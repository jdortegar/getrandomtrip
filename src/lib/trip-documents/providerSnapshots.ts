import type {
  DocumentPrefillSource,
  DocumentProviderCandidate,
  DocumentProviderRole,
  DocumentProviderSource,
} from "@/lib/types/DocumentProviderCandidate";
import type {
  TripDocumentSnapshot,
  TripDocumentSnapshotSource,
} from "@/lib/types/TripDocumentSnapshot";
import { createTripDocumentSnapshot } from "./snapshots";
import { normalizeSourceText as text } from "./sourceText";
import { isBoundedDocumentArray, isHttpsUrl } from "./validationPrimitives";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const rows = (value: unknown) => (isBoundedDocumentArray(value) ? value : []);

export function getProviderCandidates(
  source: DocumentProviderSource,
  role: DocumentProviderRole,
): DocumentProviderCandidate[] {
  if (source.kind === "experience" && role === "dinner") return [];
  const entries = rows(role === "hotel" ? source.hotels : source.activities);
  return entries.flatMap((entry, index) => {
    const slot = role === "activity" ? 1 : 0;
    if (source.kind === "xsed" && index !== slot) return [];
    const row = record(entry);
    const currentHotel = Object.hasOwn(row, "hotelName");
    const title = text(
      role === "hotel" && currentHotel ? row.hotelName : row.name,
    );
    if (!title.trim()) return [];
    const sectionIndex = role === "hotel" ? 0 : role === "dinner" ? 1 : 2;
    const section =
      source.kind === "xsed" ? record(rows(source.sections)[sectionIndex]) : {};
    const contact = record(section.contact);
    const address =
      text(contact.address) ||
      (role === "hotel"
        ? text(currentHotel ? row.hotelLocation : row.location)
        : "");
    const contactText = text(
      [text(contact.name), text(contact.phone)]
        .filter((part) => part.trim())
        .join("\n"),
    );
    const link = role === "hotel" && currentHotel ? text(row.hotelLink) : "";
    return [
      {
        role,
        index,
        title,
        provider: {
          name: role === "hotel" ? title : "",
          address,
          ...(contactText ? { contact: contactText } : {}),
          ...(isHttpsUrl(link) ? { providerUrl: link } : {}),
        },
      },
    ];
  });
}

/** No automatic selection, including when only one candidate exists. */
export function selectProviderCandidate(
  source: DocumentProviderSource,
  role: DocumentProviderRole,
  index?: unknown,
): DocumentProviderCandidate | null {
  if (typeof index !== "number" || !Number.isSafeInteger(index) || index < 0)
    return null;
  return (
    getProviderCandidates(source, role).find(
      (candidate) => candidate.index === index,
    ) ?? null
  );
}

/** Creation only: no saved draft is accepted, refreshed or mutated. */
export function createPrefilledDocumentSnapshot(
  template: TripDocumentSnapshot["template"],
  trip: TripDocumentSnapshotSource,
  source: DocumentPrefillSource,
  candidateIndex?: unknown,
): TripDocumentSnapshot {
  const draft = createTripDocumentSnapshot(template, trip);
  if (
    draft.template === "experience-roadmap" ||
    draft.template === "xsed-roadmap"
  ) {
    const itinerary = rows(source.itinerary).flatMap((entry, index) => {
      const row = record(entry);
      const title = text(row.title);
      const description = text(row.description, "html");
      return title || description
        ? [{ id: `itinerary-${index}`, title, description }]
        : [];
    });
    if (draft.template === "experience-roadmap")
      draft.data.activities = itinerary;
    else
      draft.data.stops = itinerary.map(({ description, ...item }) => ({
        ...item,
        directions: description,
      }));
    return draft;
  }
  const role =
    draft.template === "hotel-voucher"
      ? "hotel"
      : draft.template === "activity-voucher"
        ? "activity"
        : "dinner";
  const candidate = selectProviderCandidate(source, role, candidateIndex);
  if (!candidate) return draft;
  const entry = record(
    rows(role === "hotel" ? source.hotels : source.activities)[candidate.index],
  );
  const sectionIndex = role === "hotel" ? 0 : role === "dinner" ? 1 : 2;
  const section =
    source.kind === "xsed" ? record(rows(source.sections)[sectionIndex]) : {};
  const format = source.kind === "experience" ? "html" : "plain";
  const description = text(
    [text(entry.description, format), text(section.body, "html")]
      .filter(Boolean)
      .join("\n\n"),
  );
  switch (draft.template) {
    case "hotel-voucher":
      draft.data.property = candidate.provider;
      draft.data.instructions = description;
      break;
    case "activity-voucher":
      draft.data.provider = candidate.provider;
      draft.data.program = [
        {
          id: `activity-${candidate.index}`,
          title: candidate.title,
          description,
        },
      ];
      draft.data.recommendations = text(entry.risks, format);
      break;
    case "dinner-voucher":
      draft.data.restaurant = candidate.provider;
      draft.data.service = candidate.title;
      draft.data.conditions = description;
  }
  return draft;
}
