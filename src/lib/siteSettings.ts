import { prisma } from "@/lib/prisma";

const SITE_SETTINGS_ID = "global";

/**
 * Singleton row (fixed id "global"). Lazily created with defaults on first
 * read — no seed/migration step needed.
 */
export async function getSiteSettings() {
  const existing = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });
  if (existing) return existing;

  return prisma.siteSetting.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: {},
    create: { id: SITE_SETTINGS_ID },
  });
}

export async function isGateEnabled(): Promise<boolean> {
  const settings = await getSiteSettings();
  return settings.gateEnabled;
}

export async function isXsedWindowEnforcementEnabled(): Promise<boolean> {
  const settings = await getSiteSettings();
  return settings.xsedWindowEnforcementEnabled;
}

/** Partial update of the singleton settings row — only the provided keys change. */
export async function updateSiteSettings(patch: {
  gateEnabled?: boolean;
  xsedWindowEnforcementEnabled?: boolean;
}) {
  return prisma.siteSetting.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: patch,
    create: { id: SITE_SETTINGS_ID, ...patch },
  });
}
