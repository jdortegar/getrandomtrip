import { graphGet } from "@/lib/instagram-recap/instagramClient";

const GRAPH = "https://graph.facebook.com/v23.0";

/** POST with the token in the form body. Errors stay generic: no URLs or bodies. */
async function graphPost<T>(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${GRAPH}${path}`, {
      method: "POST",
      redirect: "error",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...params, access_token: token }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error("INSTAGRAM_REQUEST_FAILED");
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("INSTAGRAM_REQUEST_REJECTED");
  }
  return (await response.json()) as T;
}

/**
 * Creates the (unpublished) media container for a single image or a carousel
 * of up to 10 images. Containers are never public until media_publish.
 */
export async function createMediaContainer(
  token: string,
  userId: string,
  imageUrls: string[],
  caption: string,
) {
  const media = `/${encodeURIComponent(userId)}/media`;
  if (imageUrls.length === 1) {
    const { id } = await graphPost<{ id?: string }>(
      media,
      { image_url: imageUrls[0], caption },
      token,
    );
    if (!id) throw new Error("INSTAGRAM_REQUEST_REJECTED");
    return id;
  }
  const children: string[] = [];
  for (const url of imageUrls) {
    const { id } = await graphPost<{ id?: string }>(
      media,
      { image_url: url, is_carousel_item: "true" },
      token,
    );
    if (!id) throw new Error("INSTAGRAM_REQUEST_REJECTED");
    children.push(id);
  }
  const { id } = await graphPost<{ id?: string }>(
    media,
    { media_type: "CAROUSEL", children: children.join(","), caption },
    token,
  );
  if (!id) throw new Error("INSTAGRAM_REQUEST_REJECTED");
  return id;
}

/** Waits until Instagram finished processing the container. */
export async function waitForContainer(
  token: string,
  containerId: string,
  { attempts = 20, delayMs = 3000 } = {},
) {
  for (let i = 0; i < attempts; i += 1) {
    const { status_code } = await graphGet<{ status_code?: string }>(
      `/${encodeURIComponent(containerId)}`,
      { fields: "status_code" },
      token,
    );
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED")
      throw new Error("INSTAGRAM_CONTAINER_FAILED");
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error("INSTAGRAM_CONTAINER_TIMEOUT");
}

/** Makes the post public. Never call twice for the same review. */
export async function publishContainer(
  token: string,
  userId: string,
  containerId: string,
) {
  const { id } = await graphPost<{ id?: string }>(
    `/${encodeURIComponent(userId)}/media_publish`,
    { creation_id: containerId },
    token,
  );
  if (!id) throw new Error("INSTAGRAM_REQUEST_REJECTED");
  return id;
}

export async function getPermalink(token: string, mediaId: string) {
  const { permalink } = await graphGet<{ permalink?: string }>(
    `/${encodeURIComponent(mediaId)}`,
    { fields: "permalink" },
    token,
  );
  return permalink ?? null;
}
