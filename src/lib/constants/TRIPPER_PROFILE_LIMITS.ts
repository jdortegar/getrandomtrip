/**
 * Character, count and file limits for the Tripper profile editor.
 *
 * Shared by the editor UI (counters + maxLength) and — once the profile API
 * lands — by server-side validation, so both sides enforce the same caps.
 */

export const TRIPPER_PROFILE_TEXT_LIMITS = {
  bioBody: 900,
  bioLead: 180,
  bioMore: 600,
  bioTitle: 60,
  city: 60,
  coverAlt: 180,
  coverCaption: 60,
  galleryCaption: 120,
  headline: 170,
  mediaTitle: 60,
  name: 40,
  slug: 60,
  travelerTypeText: 90,
} as const;

/** Minimum biography length before step 02 counts as complete. */
export const TRIPPER_PROFILE_BIO_MIN_LENGTH = 80;

/** Maximum affinities a Tripper can pick in step 02. */
export const TRIPPER_PROFILE_MAX_AFFINITIES = 3;

/** Maximum photos + videos in the public gallery carousel. */
export const TRIPPER_PROFILE_MAX_GALLERY_ITEMS = 8;

/** Maximum blog posts featured on the public profile. */
export const TRIPPER_PROFILE_MAX_FEATURED_STORIES = 3;

/** Blog posts per page in the step 06 story picker. */
export const TRIPPER_PROFILE_STORIES_PAGE_SIZE = 3;

/** Upload caps, in bytes. */
export const TRIPPER_PROFILE_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const TRIPPER_PROFILE_MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export const TRIPPER_PROFILE_IMAGE_MIME_TYPES = "image/jpeg,image/png,image/webp";
export const TRIPPER_PROFILE_VIDEO_MIME_TYPES = "video/mp4,video/webm";

/** Recommended pixel sizes shown as hints next to each upload. */
export const TRIPPER_PROFILE_IMAGE_SIZES = {
  cover: { height: 1000, width: 1800 },
  gallery: { height: 1200, width: 1600 },
  mediaPoster: { height: 720, width: 1280 },
  portrait: { height: 1000, width: 800 },
  travelerType: { height: 1350, width: 1080 },
} as const;

/** Lowercase letters, digits and single hyphens between words. */
export const TRIPPER_PROFILE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
