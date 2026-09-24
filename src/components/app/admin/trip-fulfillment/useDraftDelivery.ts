"use client";
import { useEffect, useRef, useState } from "react";
import type { DocumentFieldError } from "@/lib/types/DocumentValidation";
import type { TripDocumentDraftDto } from "@/lib/types/TripDocumentDraft";
const fieldCodes = new Set([
  "required",
  "too_long",
  "invalid_country",
  "invalid_locale",
  "invalid_shape",
  "invalid_type",
  "invalid_value",
  "invalid_array",
  "duplicate_id",
  "invalid_date",
  "invalid_range",
  "invalid_time",
  "invalid_url",
]);
const codes = [
  "storage_authorization",
  "attach_in_progress",
  "attach_request_expired",
  "attach_request_mismatch",
  "replacement_required",
  "replacement_mismatch",
  "preview_conflict",
  "attachment_missing",
] as const;
type DeliveryError = (typeof codes)[number] | "unavailable";
export function useDraftDelivery(
  tripId: string,
  draft: TripDocumentDraftDto | null,
  dirty: boolean,
) {
  const identity = `${tripId}/${draft?.id}/${draft?.revision}/${dirty}`;
  const [owner, setOwner] = useState(identity);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<DocumentFieldError[]>([]);
  const [error, setError] = useState<DeliveryError | null>(null);
  const [attachedId, setAttachedId] = useState<string | null>(null);
  const [publicationEvent, setPublicationEvent] = useState<string | null>(null);
  const sequence = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const blobUrl = useRef<string | null>(null);
  const preview = useRef<{ previewId: string; revision: number } | null>(null);
  const reviewedBlob = useRef<Blob | null>(null);
  const requestId = useRef<string | null>(null);
  if (owner !== identity) {
    setOwner(identity);
    setUrl(null);
    setBusy(false);
    setError(null);
    setFieldErrors([]);
    setAttachedId(null);
    setPublicationEvent(null);
  }
  useEffect(
    () => () => {
      sequence.current++;
      abort.current?.abort();
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
      blobUrl.current = null;
      preview.current = null;
      reviewedBlob.current = null;
      requestId.current = null;
    },
    [identity],
  );
  function begin() {
    sequence.current++;
    abort.current?.abort();
    abort.current = new AbortController();
    setBusy(true);
    setError(null);
    setFieldErrors([]);
    return { token: sequence.current, signal: abort.current.signal };
  }
  async function check(response: Response) {
    if (response.ok) return;
    let code: unknown;
    try {
      code = (await response.json()).error;
    } catch {}
    throw codes.includes(code as (typeof codes)[number]) ? code : "unavailable";
  }
  const base = `/api/admin/trip-requests/${encodeURIComponent(tripId)}/document-drafts/${encodeURIComponent(draft?.id ?? "")}`;
  async function render() {
    if (!draft || dirty || busy) return;
    const { token, signal } = begin();
    preview.current = null;
    reviewedBlob.current = null;
    requestId.current = null;
    setUrl(null);
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = null;
    try {
      const response = await fetch(`${base}/render`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: draft.revision }),
        signal,
      });
      if (response.status === 422) {
        const body = await response.json();
        if (token !== sequence.current) return;
        const fields: DocumentFieldError[] = Array.isArray(body?.errors)
          ? body.errors.slice(0, 200).flatMap((issue: unknown) => {
              if (!issue || typeof issue !== "object") return [];
              const { path, code } = issue as {
                path?: unknown;
                code?: unknown;
              };
              if (
                typeof path !== "string" ||
                path.length > 200 ||
                !/^[\w.$]+$/.test(path)
              )
                return [];
              return [
                {
                  path,
                  code:
                    typeof code === "string" && fieldCodes.has(code)
                      ? (code as DocumentFieldError["code"])
                      : ("invalid_value" as const),
                },
              ];
            })
          : [];
        if (!fields.length) throw "unavailable";
        setValidationAttempt(token);
        setFieldErrors(fields);
        return;
      }
      await check(response);
      const direct =
        response.headers.get("content-type")?.split(";")[0].trim() ===
        "application/pdf";
      const result = direct
        ? {
            previewId: response.headers.get("x-document-preview-id"),
            revision: Number(response.headers.get("x-document-revision")),
          }
        : await response.json();
      if (token !== sequence.current) return;
      if (
        result.revision !== draft.revision ||
        typeof result.previewId !== "string" ||
        (direct &&
          !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(
            result.previewId,
          ))
      )
        throw "unavailable";
      // Legacy stored-preview responses remain readable during rollout.
      const pdf = direct
        ? response
        : await fetch(
            `${base}/preview?revision=${result.revision}&previewId=${encodeURIComponent(result.previewId)}`,
            { cache: "no-store", signal },
          );
      await check(pdf);
      if (
        pdf.headers.get("content-type")?.split(";")[0].trim() !==
        "application/pdf"
      )
        throw "unavailable";
      const blob = await pdf.blob();
      if (token !== sequence.current) return;
      if (blob.size > 4 * 1024 * 1024) throw "unavailable";
      reviewedBlob.current = direct ? blob : null;
      preview.current = {
        previewId: result.previewId,
        revision: result.revision,
      };
      blobUrl.current = URL.createObjectURL(blob);
      setUrl(blobUrl.current);
    } catch (cause) {
      if (token === sequence.current)
        setError(
          codes.includes(cause as (typeof codes)[number])
            ? (cause as DeliveryError)
            : "unavailable",
        );
    } finally {
      if (token === sequence.current) setBusy(false);
    }
  }
  async function attach(replaceDocumentId?: string) {
    if (!draft || dirty || busy || !preview.current) return;
    const { token, signal } = begin();
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch(`${base}/attach`, {
        method: "POST",
        cache: "no-store",
        headers: reviewedBlob.current
          ? {
              "Content-Type": "application/pdf",
              "X-Document-Revision": String(preview.current.revision),
              "X-Document-Preview-Id": preview.current.previewId,
              "X-Document-Request-Id": requestId.current,
              ...(replaceDocumentId === undefined
                ? {}
                : { "X-Document-Replace-Id": replaceDocumentId }),
            }
          : { "Content-Type": "application/json" },
        signal,
        body:
          reviewedBlob.current ??
          JSON.stringify({
            ...preview.current,
            requestId: requestId.current,
            ...(replaceDocumentId === undefined ? {} : { replaceDocumentId }),
          }),
      });
      await check(response);
      const result = await response.json();
      if (token === sequence.current && typeof result.documentId === "string") {
        setAttachedId(result.documentId);
        setPublicationEvent(requestId.current);
      }
    } catch (cause) {
      if (token === sequence.current)
        setError(
          codes.includes(cause as (typeof codes)[number])
            ? (cause as DeliveryError)
            : "unavailable",
        );
    } finally {
      if (token === sequence.current) setBusy(false);
    }
  }
  function resetExpiredRequest() {
    if (error !== "attach_request_expired") return;
    requestId.current = null;
    setError(null);
    setFieldErrors([]);
  }
  return {
    url,
    busy,
    error,
    fieldErrors,
    validationAttempt,
    attachedId,
    publicationEvent,
    render,
    attach,
    resetExpiredRequest,
  };
}
