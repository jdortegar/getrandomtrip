// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  classifyOrigin,
  formatPlan,
  planBackfill,
  runBackfill,
  runCli,
  type BackfillClient,
  type TripRow,
} from "../backfill-departure-time-zone";

const row = (id: string, originCountry: string, extra: Partial<TripRow> = {}): TripRow => ({
  id,
  originCountry,
  originCity: "X",
  startDate: new Date("2026-10-03T00:00:00Z"),
  status: "CONFIRMED",
  ...extra,
});

describe("classifyOrigin", () => {
  it.each([
    ["Argentina", "America/Argentina/Buenos_Aires"],
    ["argentina", "America/Argentina/Buenos_Aires"],
    ["Uruguay", "America/Montevideo"],
    ["Perú", "America/Lima"],
    ["Peru", "America/Lima"],
    ["Colombia", "America/Bogota"],
  ])("maps %s to %s", (name, zone) => {
    expect(classifyOrigin(name)).toEqual({ kind: "mapped", timeZone: zone });
  });

  it("flags multi-zone countries as ambiguous but still proposes the primary zone", () => {
    expect(classifyOrigin("Brasil")).toEqual({ kind: "ambiguous", timeZone: "America/Sao_Paulo" });
    expect(classifyOrigin("Mexico")).toEqual({ kind: "ambiguous", timeZone: "America/Mexico_City" });
  });

  it("falls back to Argentina for unknown names and for known countries without a mapped zone", () => {
    expect(classifyOrigin("Narnia")).toEqual({ kind: "unmapped", timeZone: "America/Argentina/Buenos_Aires" });
    expect(classifyOrigin("España")).toEqual({ kind: "unmapped", timeZone: "America/Argentina/Buenos_Aires" });
    expect(classifyOrigin("")).toEqual({ kind: "unmapped", timeZone: "America/Argentina/Buenos_Aires" });
  });
});

describe("planBackfill / formatPlan", () => {
  const rows = [row("a", "Argentina"), row("b", "Chile"), row("c", "Brasil"), row("d", "Narnia")];

  it("groups rows by proposed zone and lists unmapped and ambiguous rows for review", () => {
    const plan = planBackfill(rows);
    expect(plan.byTimeZone.get("America/Argentina/Buenos_Aires")?.sort()).toEqual(["a", "d"]);
    expect(plan.byTimeZone.get("America/Santiago")).toEqual(["b"]);
    // Chile and Brazil span several zones; Narnia is unknown.
    expect(plan.review.map((r) => [r.id, r.kind])).toEqual([["b", "ambiguous"], ["c", "ambiguous"], ["d", "unmapped"]]);
  });

  it("prints the review rows in the report", () => {
    const text = formatPlan(planBackfill(rows));
    expect(text).toContain("unmapped");
    expect(text).toContain("Narnia");
    expect(text).toContain("ambiguous");
    expect(text).toContain("Brasil");
  });
});

function fakeClient(rows: TripRow[]) {
  const findMany = vi.fn().mockResolvedValue(rows);
  const updateMany = vi.fn().mockResolvedValue({ count: 1 });
  const client = { tripRequest: { findMany, updateMany } } as unknown as BackfillClient;
  return { client, findMany, updateMany };
}

describe("runBackfill", () => {
  it("only reads rows with a null zone and writes nothing on a dry run", async () => {
    const { client, findMany, updateMany } = fakeClient([row("a", "Argentina")]);
    const log = vi.fn();
    const result = await runBackfill(client, { apply: false }, log);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { departureTimeZone: null } }));
    expect(updateMany).not.toHaveBeenCalled();
    expect(result).toMatchObject({ mode: "dry-run", updated: 0 });
    expect(log.mock.calls.flat().join("\n")).toMatch(/dry run/i);
  });

  it("writes one guarded updateMany per zone on --apply, never overwriting an existing zone", async () => {
    const { client, updateMany } = fakeClient([row("a", "Argentina"), row("b", "Chile"), row("c", "Argentina")]);
    const result = await runBackfill(client, { apply: true }, vi.fn());
    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["a", "c"] }, departureTimeZone: null },
      data: { departureTimeZone: "America/Argentina/Buenos_Aires" },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["b"] }, departureTimeZone: null },
      data: { departureTimeZone: "America/Santiago" },
    });
    expect(result).toMatchObject({ mode: "apply", updated: 2 });
  });
});

describe("runCli", () => {
  it("defaults to a dry run and applies only with --apply", async () => {
    const { client, updateMany } = fakeClient([row("a", "Argentina")]);
    const deps = { withPrisma: async (run: (c: BackfillClient) => Promise<unknown>) => run(client), log: vi.fn() };
    expect(await runCli({ argv: [] }, deps)).toEqual({ exitCode: 0 });
    expect(updateMany).not.toHaveBeenCalled();
    await runCli({ argv: ["--apply"] }, deps);
    expect(updateMany).toHaveBeenCalledTimes(1);
  });
});
