import { getProfile } from "@/lib/instagram-recap/instagramClient";
import { listSourceMedia } from "./sourceMedia";
import { socialImportConfig } from "./socialAccounts";

/** Canonicalize locally; never fetch an operator-supplied URL. */
export function instagramImportUrl(input: unknown) {
  if (typeof input !== "string" || input.length > 500)
    throw new Error("INVALID_INSTAGRAM_URL");
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("INVALID_INSTAGRAM_URL");
  }
  const match = /^\/p\/([A-Za-z0-9_-]{5,40})\/?$/.exec(url.pathname);
  if (
    url.protocol !== "https:" ||
    !["instagram.com", "www.instagram.com"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port ||
    !match
  )
    throw new Error("INVALID_INSTAGRAM_URL");
  return {
    shortcode: match[1],
    permalink: `https://www.instagram.com/p/${match[1]}/`,
  };
}
export async function resolveOwnedInstagramPost(input: unknown) {
  const wanted = instagramImportUrl(input);
  const account = socialImportConfig();
  if (!account) throw new Error("IMPORT_ACCOUNT_UNCONFIGURED");
  const profile = await getProfile(account.token);
  if (profile.username !== account.username)
    throw new Error("IMPORT_ACCOUNT_MISMATCH");
  const posts = await listSourceMedia(account.token, profile.userId);
  const found = posts.find((post) => {
    try {
      return instagramImportUrl(post.permalink).permalink === wanted.permalink;
    } catch {
      return false;
    }
  });
  if (!found) throw new Error("POST_NOT_IN_OWNED_FEED");
  if (found.mediaType !== "IMAGE") throw new Error("IMPORT_SINGLE_IMAGE_ONLY");
  return {
    ...found,
    permalink: wanted.permalink,
    accountUsername: account.username,
    shortcode: wanted.shortcode,
  };
}
