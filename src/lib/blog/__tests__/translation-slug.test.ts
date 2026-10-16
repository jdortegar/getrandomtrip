import { describe, expect, it } from "vitest";
import {
  resolveUniqueSlug,
  shouldRegenerateSlug,
  slugForTitle,
} from "../translation-slug";

describe("slugForTitle", () => {
  it("slugifies the title and keeps accented letters readable", () => {
    expect(slugForTitle("Sunrise on the Lake!")).toBe("sunrise-on-the-lake");
    expect(slugForTitle("Aventura en Perú: día 1")).toBe("aventura-en-peru-dia-1");
    expect(slugForTitle("Año nuevo")).toBe("ano-nuevo");
  });

  it("falls back to a stable slug when the title has no usable characters", () => {
    expect(slugForTitle("¡¿?!")).toBe("post");
    expect(slugForTitle("   ")).toBe("post");
  });
});

describe("resolveUniqueSlug", () => {
  const takenBy = (taken: string[]) => async (slug: string) =>
    taken.includes(slug);

  it("returns the base slug when it is free", async () => {
    await expect(resolveUniqueSlug("trip", takenBy([]))).resolves.toBe("trip");
  });

  it("appends -2, -3… until a free slug is found", async () => {
    await expect(resolveUniqueSlug("trip", takenBy(["trip"]))).resolves.toBe(
      "trip-2",
    );
    await expect(
      resolveUniqueSlug("trip", takenBy(["trip", "trip-2", "trip-3"])),
    ).resolves.toBe("trip-4");
  });

  it("gives up after a bounded number of attempts", async () => {
    await expect(
      resolveUniqueSlug("trip", async () => true, { maxAttempts: 5 }),
    ).rejects.toThrow(/unique slug/);
  });
});

describe("shouldRegenerateSlug", () => {
  it("follows the title until first publish", () => {
    expect(shouldRegenerateSlug({ publishedAt: null })).toBe(true);
    expect(shouldRegenerateSlug({ publishedAt: undefined })).toBe(true);
  });

  it("freezes the slug after first publish unless explicitly regenerated", () => {
    const publishedAt = new Date("2026-01-01T00:00:00Z");
    expect(shouldRegenerateSlug({ publishedAt })).toBe(false);
    expect(
      shouldRegenerateSlug({ publishedAt, explicitRegenerate: false }),
    ).toBe(false);
    expect(shouldRegenerateSlug({ publishedAt, explicitRegenerate: true })).toBe(
      true,
    );
    expect(
      shouldRegenerateSlug({ publishedAt: "2026-01-01T00:00:00Z" }),
    ).toBe(false);
  });
});
