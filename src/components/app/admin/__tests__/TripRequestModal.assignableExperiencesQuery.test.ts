import { describe, it, expect } from "vitest";
import { buildAssignableExperiencesQuery } from "../TripRequestModal";

describe("buildAssignableExperiencesQuery", () => {
  it("always includes status=ACTIVE and ownerActive=true (exclude inactive owners from assignment)", () => {
    const params = buildAssignableExperiencesQuery({ tripperId: null, type: "" });

    expect(params.get("status")).toBe("ACTIVE");
    expect(params.get("ownerActive")).toBe("true");
    expect(params.get("tripperId")).toBeNull();
    expect(params.get("type")).toBeNull();
  });

  it("includes tripperId and type when the trip carries them", () => {
    const params = buildAssignableExperiencesQuery({
      tripperId: "tripper-42",
      type: "solo",
    });

    expect(params.get("tripperId")).toBe("tripper-42");
    expect(params.get("type")).toBe("solo");
    expect(params.get("ownerActive")).toBe("true");
  });
});
