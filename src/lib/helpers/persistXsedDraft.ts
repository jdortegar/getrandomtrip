import type { XsedDropDraft } from "@/types/xsed";

interface PersistErrorBody {
  message?: string;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as PersistErrorBody;
  return body.message ?? fallback;
}

/** Creates or updates an XSED drop. POST always stores DRAFT; ACTIVE needs a follow-up PUT. */
export async function persistXsedDraft(
  snapshot: XsedDropDraft,
  draftId: string | null,
  fallbackError: string,
): Promise<string> {
  if (!draftId) {
    const res = await fetch("/api/admin/xsed", {
      body: JSON.stringify(snapshot),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!res.ok) throw new Error(await readErrorMessage(res, fallbackError));
    const data = (await res.json()) as { id: string };
    if (snapshot.status === "ACTIVE") {
      const activateRes = await fetch(`/api/admin/xsed/${data.id}`, {
        body: JSON.stringify(snapshot),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      if (!activateRes.ok) {
        throw new Error(await readErrorMessage(activateRes, fallbackError));
      }
    }
    return data.id;
  }

  const res = await fetch(`/api/admin/xsed/${draftId}`, {
    body: JSON.stringify(snapshot),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, fallbackError));
  return draftId;
}
