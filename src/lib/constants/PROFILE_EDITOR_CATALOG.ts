/** Section order of the Tripper profile editor component catalog (`/design-system/tripper-profile-editor`). */
export const PROFILE_EDITOR_CATALOG_SECTIONS = [
  "chrome",
  "progress",
  "structure",
  "fields",
  "imageInputs",
  "identity",
  "perspective",
  "travelerTypes",
  "atlas",
  "media",
  "stories",
  "review",
  "publicHero",
  "publicJourneys",
  "publicMedia",
  "publicAtlas",
  "publicStories",
] as const;

export type ProfileEditorCatalogSection = (typeof PROFILE_EDITOR_CATALOG_SECTIONS)[number];
