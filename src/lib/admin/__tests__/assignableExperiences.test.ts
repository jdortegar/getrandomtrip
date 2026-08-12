import { describe, expect, it } from "vitest";
import { buildAssignableExperiencesQuery } from "../assignableExperiences";

describe("buildAssignableExperiencesQuery", () => {
  it("always requests ACTIVE status with owner-active filtering", () => {
    const params = buildAssignableExperiencesQuery({ tripperId: null, type: "" });
    expect(params.get("status")).toBe("ACTIVE");
    expect(params.get("ownerActive")).toBe("true");
  });

  it("includes tripperId when present", () => {
    const params = buildAssignableExperiencesQuery({
      tripperId: "tripper-1",
      type: "couple",
    });
    expect(params.get("tripperId")).toBe("tripper-1");
  });

  it("omits tripperId when null", () => {
    const params = buildAssignableExperiencesQuery({ tripperId: null, type: "couple" });
    expect(params.has("tripperId")).toBe(false);
  });

  it("forwards trip.type verbatim, unchanged (case normalization happens on the receiving end)", () => {
    const params = buildAssignableExperiencesQuery({ tripperId: null, type: "xsed" });
    expect(params.get("type")).toBe("xsed");
  });

  it("omits type when empty", () => {
    const params = buildAssignableExperiencesQuery({ tripperId: null, type: "" });
    expect(params.has("type")).toBe(false);
  });
});
