import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getSiteSettings,
  isGateEnabled,
  isXsedWindowEnforcementEnabled,
  updateSiteSettings,
} from "../siteSettings";

const GLOBAL_ID = "global";

describe("siteSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSiteSettings returns the existing row without upserting when one exists", async () => {
    const existing = {
      id: GLOBAL_ID,
      gateEnabled: false,
      xsedWindowEnforcementEnabled: true,
      updatedAt: new Date(),
    };
    (prisma.siteSetting.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      existing,
    );

    const result = await getSiteSettings();

    expect(result).toEqual(existing);
    expect(prisma.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("getSiteSettings lazily creates the row with defaults when none exists", async () => {
    (prisma.siteSetting.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    const created = {
      id: GLOBAL_ID,
      gateEnabled: true,
      xsedWindowEnforcementEnabled: true,
      updatedAt: new Date(),
    };
    (prisma.siteSetting.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(
      created,
    );

    const result = await getSiteSettings();

    expect(result).toEqual(created);
    expect(prisma.siteSetting.upsert).toHaveBeenCalledWith({
      where: { id: GLOBAL_ID },
      update: {},
      create: { id: GLOBAL_ID },
    });
  });

  it("isGateEnabled reflects the persisted gateEnabled column", async () => {
    (prisma.siteSetting.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: GLOBAL_ID,
      gateEnabled: false,
      xsedWindowEnforcementEnabled: true,
      updatedAt: new Date(),
    });

    expect(await isGateEnabled()).toBe(false);
  });

  it("isXsedWindowEnforcementEnabled reflects the persisted column", async () => {
    (prisma.siteSetting.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: GLOBAL_ID,
      gateEnabled: true,
      xsedWindowEnforcementEnabled: false,
      updatedAt: new Date(),
    });

    expect(await isXsedWindowEnforcementEnabled()).toBe(false);
  });

  it("updateSiteSettings upserts only the provided keys", async () => {
    (prisma.siteSetting.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: GLOBAL_ID,
      gateEnabled: true,
      xsedWindowEnforcementEnabled: false,
      updatedAt: new Date(),
    });

    await updateSiteSettings({ xsedWindowEnforcementEnabled: false });

    expect(prisma.siteSetting.upsert).toHaveBeenCalledWith({
      where: { id: GLOBAL_ID },
      update: { xsedWindowEnforcementEnabled: false },
      create: { id: GLOBAL_ID, xsedWindowEnforcementEnabled: false },
    });
  });
});
