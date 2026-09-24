// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  getProviderCandidates,
  selectProviderCandidate,
} from "../providerSnapshots";
import type { DocumentProviderSource } from "@/lib/types/DocumentProviderCandidate";

describe("provider candidates", () => {
  it("extracts legacy hotel facts without claiming a reservation", () => {
    expect(
      getProviderCandidates(
        {
          kind: "experience",
          hotels: [
            { name: "Posada Ñandú", location: "Córdoba", checkIn: "15:00" },
          ],
        },
        "hotel",
      ),
    ).toEqual([
      {
        role: "hotel",
        index: 0,
        title: "Posada Ñandú",
        provider: {
          name: "Posada Ñandú",
          address: "Córdoba",
        },
      },
    ]);
  });
  it("preserves current hotel facts and only the explicit safe hotel URL", () => {
    const source: DocumentProviderSource = {
      kind: "experience",
      hotels: [
        {
          hotelName: "  Hôtel &amp; spa  ",
          hotelLocation: "2 < 3 Avenue",
          hotelLink: "https://hotel.example/ñ",
          referredLink: "ABC123",
          name: "Stale legacy name",
          location: "Stale legacy address",
        },
      ],
    };
    expect(getProviderCandidates(source, "hotel")[0]).toEqual({
      role: "hotel",
      index: 0,
      title: "  Hôtel &amp; spa  ",
      provider: {
        name: "  Hôtel &amp; spa  ",
        address: "2 < 3 Avenue",
        providerUrl: "https://hotel.example/ñ",
      },
    });
  });
  it("does not treat experience activities or hotels as dinner suppliers", () => {
    const source: DocumentProviderSource = {
      kind: "experience",
      hotels: [{ name: "Hotel" }],
      activities: [{ name: "Dinner tour" }],
    };
    expect(getProviderCandidates(source, "activity")).toEqual([
      {
        role: "activity",
        index: 0,
        title: "Dinner tour",
        provider: { name: "", address: "" },
      },
    ]);
    expect(getProviderCandidates(source, "dinner")).toEqual([]);
  });
  const xsed: DocumentProviderSource = {
    kind: "xsed",
    hotels: [
      { hotelName: "Hotel", hotelLocation: "City" },
      { hotelName: "Ignored" },
    ],
    activities: [
      { name: "Dinner at Mirador" },
      { name: "City tour" },
      { name: "Ignored" },
    ],
    sections: [
      {
        contact: {
          name: "Ana",
          phone: "+54",
          address: "Hotel street",
          hour: "Check-in 15:00",
        },
      },
      { contact: { name: "Luis", phone: "123", address: "Dinner street" } },
      { contact: { name: "Inés", phone: "456", address: "Activity street" } },
    ],
  };
  it.each([
    ["hotel", 0, "Hotel", "Hotel street", "Ana\n+54", "Hotel"],
    ["dinner", 0, "Dinner at Mirador", "Dinner street", "Luis\n123", ""],
    ["activity", 1, "City tour", "Activity street", "Inés\n456", ""],
  ] as const)(
    "respects the XSED %s slot and contact semantics",
    (role, index, title, address, contact, name) => {
      expect(getProviderCandidates(xsed, role)).toEqual([
        { role, index, title, provider: { name, address, contact } },
      ]);
    },
  );
  it("never shifts a missing XSED dinner into the activity slot", () => {
    expect(
      getProviderCandidates(
        { kind: "xsed", activities: [{ name: "Dinner" }] },
        "activity",
      ),
    ).toEqual([]);
  });
  it("requires explicit selection of an original source index", () => {
    const source: DocumentProviderSource = {
      kind: "experience",
      hotels: [null, { name: "One" }, { name: "Two" }],
    };
    expect(
      getProviderCandidates(source, "hotel").map((item) => item.index),
    ).toEqual([1, 2]);
    expect(selectProviderCandidate(source, "hotel", 2)?.title).toBe("Two");
    expect(selectProviderCandidate(source, "hotel", 0)).toBeNull();
    expect(selectProviderCandidate(source, "activity", 2)).toBeNull();
    expect(
      selectProviderCandidate(
        { kind: "experience", hotels: [{ name: "Only" }] },
        "hotel",
      ),
    ).toBeNull();
  });
  it.each([-1, 0.5, NaN, Infinity, "0", null, 10])(
    "rejects invalid or absent candidate index %s",
    (index) => {
      expect(selectProviderCandidate(xsed, "hotel", index)).toBeNull();
    },
  );
  it.each([undefined, null, {}, "hotel", 5, Array(51).fill({ name: "Hotel" })])(
    "rejects unsupported or oversized source arrays %s",
    (hotels) => {
      expect(
        getProviderCandidates({ kind: "experience", hotels }, "hotel"),
      ).toEqual([]);
    },
  );
  it("ignores malformed rows without renumbering or borrowing facts", () => {
    const hotels = [
      null,
      [],
      false,
      "Hotel",
      { name: 1 },
      {},
      { hotelName: "", name: "Stale" },
      { name: "Valid" },
    ];
    expect(
      getProviderCandidates({ kind: "experience", hotels }, "hotel").map(
        (row) => row.index,
      ),
    ).toEqual([7]);
  });
  it.each([
    "http://hotel.test",
    "https://user:pass@hotel.test",
    "javascript:alert(1)",
    "https://hotel.test/ space",
    "https://hotel.test/" + "a".repeat(4000),
  ])("drops unsafe or oversized provider URL %s", (hotelLink) => {
    const result = getProviderCandidates(
      { kind: "experience", hotels: [{ hotelName: "Hotel", hotelLink }] },
      "hotel",
    );
    expect(result[0].provider).toEqual({ name: "Hotel", address: "" });
  });
  it("bounds facts without truncation and allows fifty ordered candidates", () => {
    const hotels = Array.from({ length: 50 }, (_, index) => ({
      name: `Hotel ${index}`,
      location: "a".repeat(4001),
    }));
    const result = getProviderCandidates(
      { kind: "experience", hotels },
      "hotel",
    );
    expect(result).toHaveLength(50);
    expect(result[49]).toEqual({
      role: "hotel",
      index: 49,
      title: "Hotel 49",
      provider: { name: "Hotel 49", address: "" },
    });
  });
  it("returns independent objects without mutating shared source facts", () => {
    const source = structuredClone(xsed);
    const before = structuredClone(source);
    const first = selectProviderCandidate(source, "hotel", 0)!;
    first.provider.name = "Edited";
    expect(selectProviderCandidate(source, "hotel", 0)?.provider.name).toBe(
      "Hotel",
    );
    expect(source).toEqual(before);
    Reflect.set((source.hotels as object[])[0], "hotelName", "Changed source");
    expect(first.provider.name).toBe("Edited");
  });
  it("bounds merged contact text and rejects oversized candidate names", () => {
    const source: DocumentProviderSource = {
      kind: "xsed",
      hotels: [{ hotelName: "H".repeat(4000) }],
      sections: [
        {
          contact: {
            name: "a".repeat(3000),
            phone: "b".repeat(3000),
            address: 12,
          },
        },
      ],
    };
    expect(getProviderCandidates(source, "hotel")[0].provider).toEqual({
      name: "H".repeat(4000),
      address: "",
    });
    source.hotels = [{ hotelName: "H".repeat(4001) }];
    expect(getProviderCandidates(source, "hotel")).toEqual([]);
  });
  it("does not fetch safe provider URLs", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("Unexpected fetch");
      }),
    );
    try {
      const source: DocumentProviderSource = {
        kind: "experience",
        hotels: [{ hotelName: "Hotel", hotelLink: "https://hotel.test" }],
      };
      expect(
        selectProviderCandidate(source, "hotel", 0)?.provider.providerUrl,
      ).toBe("https://hotel.test");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
