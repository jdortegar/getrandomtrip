export const DESIGN_SYSTEM_BRAND_SECTIONS = [
  "essence",
  "logo",
  "color",
  "typography",
  "voice",
  "photography",
] as const;

export const DESIGN_SYSTEM_COMPONENT_SECTIONS = [
  "headings",
  "icons",
  "avatar",
  "buttons",
  "controls",
  "badges",
  "tabs",
  "cards",
  "tables",
  "layout",
  "journey",
  "dashboard",
] as const;

export type DesignSystemGalleryView = "brand" | "components";

export const DESIGN_SYSTEM_SECTIONS = {
  brand: DESIGN_SYSTEM_BRAND_SECTIONS,
  components: DESIGN_SYSTEM_COMPONENT_SECTIONS,
} as const;
