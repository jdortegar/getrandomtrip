// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  convertApprovedVisas,
  formatConversionReport,
  runConversion,
  selectVisaConversions,
  type VisaConversionClient,
  type VisaUserRow,
} from "../convert-approved-visas-to-iso";

describe("convertApprovedVisas", () => {
  it("maps English and Spanish names to ISO codes", () => {
    expect(convertApprovedVisas(["United States", "Canada", "Reino Unido"])).toEqual({
      codes: ["US", "CA", "GB"],
      unresolved: [],
    });
  });

  it("keeps values that already are ISO codes, uppercasing them", () => {
    expect(convertApprovedVisas(["US", "de"])).toEqual({
      codes: ["US", "DE"],
      unresolved: [],
    });
  });

  it("dedupes values that resolve to the same code", () => {
    expect(convertApprovedVisas(["United States", "USA", "US"]).codes).toEqual(["US"]);
  });

  it("keeps unresolved names unchanged and reports them", () => {
    expect(convertApprovedVisas(["Atlantis", "Japan"])).toEqual({
      codes: ["Atlantis", "JP"],
      unresolved: ["Atlantis"],
    });
  });

  it.each([
    "Schengena",
    "Schengen",
    "schengen",
    "Schengen Area",
    "Espacio Schengen",
    "Zona Schengen",
    "  zona   SCHENGEN ",
    "SCHENGEN",
    "Schengén",
  ])("maps the Schengen spelling %j to SCHENGEN", (value) => {
    expect(convertApprovedVisas([value, "Japan"])).toEqual({
      codes: ["SCHENGEN", "JP"],
      unresolved: [],
    });
  });

  it("dedupes Schengen spellings into one SCHENGEN code", () => {
    expect(convertApprovedVisas(["Schengena", "Schengen Area"]).codes).toEqual(["SCHENGEN"]);
  });

  it("drops blank values", () => {
    expect(convertApprovedVisas(["  ", "Japan"]).codes).toEqual(["JP"]);
  });
});

const rows: VisaUserRow[] = [
  { id: "u-iso", approvedVisas: ["US", "CA"] },
  { id: "u-names", approvedVisas: ["United States", "Canada"] },
  { id: "u-mixed", approvedVisas: ["Atlantis", "Japan"] },
  { id: "u-unresolved", approvedVisas: ["Atlantis"] },
  { id: "u-empty", approvedVisas: [] },
];

describe("selectVisaConversions", () => {
  it("lists only rows that change or hold unresolved names", () => {
    const conversions = selectVisaConversions(rows);
    expect(conversions.map((c) => c.userId)).toEqual(["u-names", "u-mixed", "u-unresolved"]);
    expect(conversions[0]).toEqual({
      userId: "u-names",
      before: ["United States", "Canada"],
      after: ["US", "CA"],
      unresolved: [],
      changed: true,
    });
    expect(conversions[2]).toMatchObject({ changed: false, unresolved: ["Atlantis"] });
  });
});

describe("formatConversionReport", () => {
  it("prints proposed conversions and flags UNRESOLVED names", () => {
    const report = formatConversionReport(selectVisaConversions(rows));
    expect(report).toContain("u-names: United States, Canada -> US, CA");
    expect(report).toContain("UNRESOLVED: Atlantis");
  });

  it("says so when nothing needs converting", () => {
    expect(formatConversionReport([])).toBe("No users need conversion.");
  });
});

function client(data: VisaUserRow[]) {
  return {
    user: {
      findMany: vi.fn(async () => data),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
  } satisfies VisaConversionClient;
}

describe("runConversion", () => {
  it("writes nothing in a dry run", async () => {
    const db = client(rows);
    const log = vi.fn();
    const result = await runConversion(db, { apply: false }, log);
    expect(result.mode).toBe("dry-run");
    expect(db.user.updateMany).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Dry run"));
  });

  it("with --apply updates only changed rows, guarded by their previous value", async () => {
    const db = client(rows);
    const result = await runConversion(db, { apply: true }, vi.fn());
    expect(result.mode).toBe("apply");
    expect(db.user.updateMany).toHaveBeenCalledTimes(2);
    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u-names", approvedVisas: { equals: ["United States", "Canada"] } },
      data: { approvedVisas: ["US", "CA"] },
    });
    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u-mixed", approvedVisas: { equals: ["Atlantis", "Japan"] } },
      data: { approvedVisas: ["Atlantis", "JP"] },
    });
    expect(result.updated).toBe(2);
  });

  it("reports a row that changed since it was read instead of overwriting it", async () => {
    const db = client(rows);
    db.user.updateMany.mockResolvedValue({ count: 0 });
    const log = vi.fn();
    const result = await runConversion(db, { apply: true }, log);
    expect(result.updated).toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("SKIPPED"));
  });
});

it("imports without environment or database side effects", async () => {
  vi.resetModules();
  vi.doMock("dotenv/config", () => {
    throw new Error("Importing the script must not load environment files");
  });
  await expect(import("../convert-approved-visas-to-iso")).resolves.toBeDefined();
  vi.doUnmock("dotenv/config");
});
