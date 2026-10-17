import { describe, expect, it } from "vitest";
import {
  flattenSourceCopy,
  pickSourceRow,
  titleSearchWhere,
} from "../source-copy";

const ROWS = [
  { locale: "en", title: "Trip", subtitle: "Sub EN", slug: "trip" },
  { locale: "es", title: "Viaje", subtitle: "Sub ES", slug: "viaje" },
];

describe("source-copy (T7 contract)", () => {
  it("picks the source-locale row, then the first row", () => {
    expect(pickSourceRow("es", ROWS)?.title).toBe("Viaje");
    expect(pickSourceRow("en", ROWS)?.title).toBe("Trip");
    expect(pickSourceRow("es", [])).toBeUndefined();
  });

  it("flattens source-locale copy for admin/tripper lists", () => {
    expect(flattenSourceCopy("es", ROWS)).toMatchObject({
      title: "Viaje",
      subtitle: "Sub ES",
      slug: "viaje",
    });
  });

  it("searches titles on translation rows, not BlogPost.title", () => {
    expect(titleSearchWhere("patagonia")).toEqual({
      translationRows: {
        some: { title: { contains: "patagonia", mode: "insensitive" } },
      },
    });
  });
});
