import { describe, expect, it } from "vitest";
import { findCountryByName } from "../countries";

describe("findCountryByName", () => {
  it("matches the Spanish name", () => {
    expect(findCountryByName("Brasil")?.code).toBe("BR");
  });

  it("matches the English alias", () => {
    expect(findCountryByName("Brazil")?.code).toBe("BR");
  });

  it("is case-insensitive", () => {
    expect(findCountryByName("brazil")?.code).toBe("BR");
    expect(findCountryByName("BRASIL")?.code).toBe("BR");
  });

  it("trims surrounding whitespace", () => {
    expect(findCountryByName("brasil ")?.code).toBe("BR");
  });

  it("matches accented and non-accented spellings to the same country", () => {
    expect(findCountryByName("México")?.code).toBe("MX");
    expect(findCountryByName("Mexico")?.code).toBe("MX");
  });

  it("matches other English aliases (US, Canada, Peru, Haiti, Dominican Republic, Trinidad and Tobago, Panama)", () => {
    expect(findCountryByName("United States")?.code).toBe("US");
    expect(findCountryByName("USA")?.code).toBe("US");
    expect(findCountryByName("Canada")?.code).toBe("CA");
    expect(findCountryByName("Peru")?.code).toBe("PE");
    expect(findCountryByName("Haiti")?.code).toBe("HT");
    expect(findCountryByName("Dominican Republic")?.code).toBe("DO");
    expect(findCountryByName("Trinidad and Tobago")?.code).toBe("TT");
    expect(findCountryByName("Panama")?.code).toBe("PA");
  });

  it("returns undefined for unmatchable input", () => {
    expect(findCountryByName("Narnia")).toBeUndefined();
  });
});
