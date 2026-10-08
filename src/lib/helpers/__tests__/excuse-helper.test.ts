import { describe, expect, it } from "vitest";
import {
  getLocalizedRefineOptions,
  toggleRefineDetail,
  resolveExcuseSelectionLabels,
} from "@/lib/helpers/excuse-helper";

describe("resolveExcuseSelectionLabels", () => {
  it("returns null without an excuse", () => {
    expect(
      resolveExcuseSelectionLabels({
        travelerType: "solo",
        excuseKey: null,
        refineDetails: [],
      }),
    ).toBeNull();
  });

  it("prefers localized titles and option labels", () => {
    const result = resolveExcuseSelectionLabels({
      travelerType: "solo",
      excuseKey: "solo-get-lost",
      refineDetails: ["sl-gl-naturaleza-silenciosa"],
      localizedExcuses: [{ key: "solo-get-lost", title: "Lost (EN)" }],
      localizedRefineOptions: {
        solo: {
          "solo-get-lost": [
            { key: "sl-gl-naturaleza-silenciosa", label: "Quiet nature" },
          ],
        },
      },
    });
    expect(result).toEqual({
      title: "Lost (EN)",
      refineDetails: [{ key: "sl-gl-naturaleza-silenciosa", label: "Quiet nature" }],
    });
  });

  it("falls back to the catalog copy, then to the raw key", () => {
    const result = resolveExcuseSelectionLabels({
      travelerType: "solo",
      excuseKey: "solo-get-lost",
      refineDetails: ["sl-gl-naturaleza-silenciosa", "unknown"],
    });
    expect(result?.title).toBe("Get Lost");
    expect(result?.refineDetails[0].label).not.toBe("sl-gl-naturaleza-silenciosa");
    expect(result?.refineDetails[1]).toEqual({ key: "unknown", label: "unknown" });
  });
});

describe("getLocalizedRefineOptions", () => {
  it("returns an empty list without an excuse", () => {
    expect(getLocalizedRefineOptions("solo", null)).toEqual([]);
  });

  it("applies localized label and description over the catalog", () => {
    const options = getLocalizedRefineOptions("solo", "solo-get-lost", {
      solo: {
        "solo-get-lost": [
          { key: "sl-gl-naturaleza-silenciosa", label: "Quiet", desc: "Calm" },
        ],
      },
    });
    const first = options.find((o) => o.key === "sl-gl-naturaleza-silenciosa");
    expect(first).toMatchObject({ label: "Quiet", desc: "Calm" });
    expect(first?.img).toBeTruthy();
    expect(options.length).toBeGreaterThan(1);
  });
});

describe("toggleRefineDetail", () => {
  it("adds an unselected key below the cap", () => {
    expect(toggleRefineDetail(["a"], "b", 3)).toEqual(["a", "b"]);
  });

  it("removes a selected key", () => {
    expect(toggleRefineDetail(["a", "b"], "a", 3)).toEqual(["b"]);
  });

  it("ignores a new key once the cap is reached", () => {
    const current = ["a", "b", "c"];
    expect(toggleRefineDetail(current, "d", 3)).toBe(current);
  });

  it("still removes a selected key when at the cap", () => {
    expect(toggleRefineDetail(["a", "b", "c"], "b", 3)).toEqual(["a", "c"]);
  });
});
