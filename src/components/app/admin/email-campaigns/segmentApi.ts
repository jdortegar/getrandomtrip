export const SEGMENTS_API = "/api/admin/email-campaigns/segments";

export const CONTACTS_API = "/api/admin/email-campaigns/contacts";

/** The `error` code of a failed admin API response, if its body has one. */
export async function readApiErrorCode(res: Pick<Response, "json">): Promise<string | null> {
  const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : null;
}

/** Adds `id` to `ids` or removes it, keeping selection order. */
export function toggleSegmentId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}
