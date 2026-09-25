import type { Prisma, PrismaClient } from "@prisma/client";
import type { DocumentPrefillSource } from "@/lib/types/DocumentProviderCandidate";
import type {
  TripDocumentSnapshot,
  TripDocumentSnapshotSource,
} from "@/lib/types/TripDocumentSnapshot";
import { createPrefilledDocumentSnapshot } from "@/lib/trip-documents/providerSnapshots";
import {
  parseDraftDocument,
  toDraftDto,
} from "@/lib/trip-documents/draftContracts";
import { withTripDocumentLocks } from "./tripDocumentLocks";
interface Scope {
  ownerId: string;
  tripRequestId: string;
}
type SourceLoader = (
  tx: Prisma.TransactionClient,
  tripRequestId: string,
  experienceId?: string | null,
) => Promise<{
  trip: TripDocumentSnapshotSource;
  provider: DocumentPrefillSource;
}>;
const templates = [
  "hotel-voucher",
  "activity-voucher",
  "dinner-voucher",
  "experience-roadmap",
  "xsed-roadmap",
] as const;

/** Caller authorizes live admin; trusted loader scopes trip and selected source via tx.
 * The loader runs once, inside owner/trip locks; no client snapshots accepted.
 */
export async function createTripDocumentDraft(
  db: Pick<PrismaClient, "$transaction">,
  scope: Scope,
  input: unknown,
  loadSource: SourceLoader,
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype ||
    Reflect.ownKeys(input).some(
      (key) =>
        key !== "template" &&
        key !== "candidateIndex" &&
        key !== "experienceId",
    )
  )
    return { ok: false as const, error: "invalid_input" as const };
  const raw = input as Record<string, unknown>;
  if (
    !templates.some((template) => template === raw.template) ||
    (raw.experienceId !== undefined &&
      raw.experienceId !== null &&
      (typeof raw.experienceId !== "string" ||
        !raw.experienceId.trim() ||
        raw.experienceId.length > 200)) ||
    (raw.candidateIndex !== undefined &&
      (!Number.isSafeInteger(raw.candidateIndex) ||
        Number(raw.candidateIndex) < 0))
  )
    return { ok: false as const, error: "invalid_input" as const };
  return withTripDocumentLocks(
    db,
    { ownerId: scope.ownerId, tripIds: [scope.tripRequestId] },
    async (tx) => {
      const source = await loadSource(
        tx,
        scope.tripRequestId,
        raw.experienceId as string | null | undefined,
      );
      const parsed = parseDraftDocument(
        createPrefilledDocumentSnapshot(
          raw.template as TripDocumentSnapshot["template"],
          source.trip,
          source.provider,
          raw.candidateIndex,
        ),
      );
      if (!parsed.ok) return parsed;
      const document = parsed.value;
      const row = await tx.tripDocumentDraft.create({
        data: {
          tripRequestId: scope.tripRequestId,
          template: document.template,
          templateVersion: document.templateVersion,
          locale: document.locale,
          label: document.label,
          country: document.country,
          data: document.data as unknown as Prisma.InputJsonValue,
        },
      });
      return { ok: true as const, value: toDraftDto(row) };
    },
  );
}

/** Admin-only consistent reopen; never reloads source facts or exposes keys. */
export async function readTripDocumentDraft(
  db: Pick<PrismaClient, "$transaction">,
  scope: Scope & { draftId: string },
) {
  return withTripDocumentLocks(
    db,
    {
      ownerId: scope.ownerId,
      tripIds: [scope.tripRequestId],
      drafts: [{ id: scope.draftId, tripRequestId: scope.tripRequestId }],
    },
    async (tx) => {
      const row = await tx.tripDocumentDraft.findUnique({
        where: { id: scope.draftId },
      });
      if (!row || row.tripRequestId !== scope.tripRequestId) return null;
      return toDraftDto(row);
    },
  );
}
