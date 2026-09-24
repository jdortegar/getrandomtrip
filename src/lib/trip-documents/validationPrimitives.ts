export const MAX_DOCUMENT_TEXT_LENGTH = 4000;
export const MAX_DOCUMENT_ARRAY_ITEMS = 50;
export const MAX_DOCUMENT_REQUEST_BYTES = 128 * 1024;

// Calendar arithmetic avoids Date's rollover and timezone conversion.
export function isIsoCalendarDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length !== 10 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  )
    return false;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

export function isWallTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === 5 &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

export function isOrderedDateRange(start: unknown, end: unknown): boolean {
  return isIsoCalendarDate(start) && isIsoCalendarDate(end) && start <= end;
}

/** Validates syntax only; no host lookup or URL fetching. Callers handle optional blanks. */
export function isHttpsUrl(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^https:\/\/[^/?#]/i.test(value) ||
    /[\s\\]/.test(value)
  )
    return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isBoundedDocumentText(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_DOCUMENT_TEXT_LENGTH;
}

export function isBoundedDocumentArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length <= MAX_DOCUMENT_ARRAY_ITEMS;
}

/** Checks raw serialized body size, not JSON validity; readers must also cap streaming input. */
export function isBoundedDocumentRequest(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_DOCUMENT_REQUEST_BYTES &&
    new TextEncoder().encode(value).byteLength <= MAX_DOCUMENT_REQUEST_BYTES
  );
}
