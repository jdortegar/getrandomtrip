import { describe, expect, it } from "vitest";
import { resolveUniqueSlug, slugForTitle } from "../translation-slug";

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
