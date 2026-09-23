import type {
  DocumentProviderCandidate,
  DocumentProviderRole,
  DocumentProviderSource,
} from "@/lib/types/DocumentProviderCandidate";
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
