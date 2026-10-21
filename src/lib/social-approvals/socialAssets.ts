import { getMediaWriteStore } from "@/lib/upload/mediaStores";
import { withEnvironmentUploadPrefix } from "@/lib/deployment";

const MAX_BYTES = 18_000_000;
export async function loadSocialArtwork(imageUrl: string) {
  const url = new URL(imageUrl);
  const origin = process.env.SLACK_SOCIAL_IMAGE_ORIGIN;
  if (
    !origin ||
    url.origin !== origin ||
    url.protocol !== "https:" ||
    url.username ||
    url.password
  )
    throw new Error("UNTRUSTED_ASSET");
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  const type = (response.headers.get("content-type") ?? "").split(";")[0];
  if (
    !response.ok ||
    !["image/png", "image/jpeg", "image/webp"].includes(type) ||
    Number(response.headers.get("content-length")) > MAX_BYTES ||
    !response.body
  )
    throw new Error("ASSET_INVALID");
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > MAX_BYTES) throw new Error("ASSET_TOO_LARGE");
      parts.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return { bytes: Buffer.concat(parts), type };
}
/** Stores one generated slide under a job-specific key that is never reused. */
export async function saveSocialArtwork(
  jobId: string,
  image: Uint8Array,
  slide?: number,
) {
  const origin = process.env.SLACK_SOCIAL_IMAGE_ORIGIN;
  if (
    !origin ||
    origin !== process.env.SLACK_SOCIAL_APP_ORIGIN ||
    new URL(origin).protocol !== "https:"
  )
    throw new Error("ASSET_ORIGIN_UNCONFIGURED");
  const name = slide === undefined ? jobId : `${jobId}-${slide}`;
  const key = `social/social-artwork/${withEnvironmentUploadPrefix(name)}.png`;
  // One paid image call per job; content-addressed job key is never reused by another revision.
  await getMediaWriteStore().set(key, new Uint8Array(image).buffer, {
    metadata: { contentType: "image/png" },
    onlyIfNew: true,
  });
  return new URL(`/api/upload?key=${encodeURIComponent(key)}`, origin).href;
}
