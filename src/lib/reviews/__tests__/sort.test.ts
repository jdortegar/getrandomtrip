import { describe, expect, it } from "vitest";
import {
  ADMIN_REVIEW_SORT_FIELDS,
  REVIEW_SORT_DEFAULT,
  TRIPPER_REVIEW_SORT_FIELDS,
  parseReviewSortBy,
  parseReviewSortOrder,
  reviewListOrderBy,
} from "../sort";

describe("reviewListOrderBy — per-token orderBy shape", () => {
  it("rating asc -> [{ rating: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }]", () => {
    expect(reviewListOrderBy("rating", "asc")).toEqual([
      { rating: "asc" },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("rating desc -> [{ rating: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }]", () => {
    expect(reviewListOrderBy("rating", "desc")).toEqual([
      { rating: "desc" },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("traveler asc -> nested { user: { name: 'asc' } } plus tiebreakers", () => {
    expect(reviewListOrderBy("traveler", "asc")).toEqual([
      { user: { name: "asc" } },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("tripper desc -> nested { tripper: { name: 'desc' } } plus tiebreakers", () => {
    expect(reviewListOrderBy("tripper", "desc")).toEqual([
      { tripper: { name: "desc" } },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("created asc -> [{ createdAt: 'asc' }, { id: 'asc' }] (no extra createdAt tiebreaker — it IS the sort field)", () => {
    expect(reviewListOrderBy("created", "asc")).toEqual([
      { createdAt: "asc" },
      { id: "asc" },
    ]);
  });

  it("created desc -> [{ createdAt: 'desc' }, { id: 'asc' }]", () => {
    expect(reviewListOrderBy("created", "desc")).toEqual([
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });
});

describe("reviewListOrderBy — regression guard: tripper case carries no null-placement workaround", () => {
  it("the tripper case's orderBy array contains no 'nulls' key anywhere", () => {
    const orderBy = reviewListOrderBy("tripper", "asc");
    for (const clause of orderBy) {
      expect(JSON.stringify(clause)).not.toContain("nulls");
    }
  });

  it("the tripper case does not add a tripperId filter/clause of any kind", () => {
    const orderBy = reviewListOrderBy("tripper", "asc");
    for (const clause of orderBy) {
      expect("tripperId" in clause).toBe(false);
    }
  });

  it("both directions (asc/desc) stay free of nulls/tripperId — not just one direction", () => {
    for (const order of ["asc", "desc"] as const) {
      const orderBy = reviewListOrderBy("tripper", order);
      const serialized = JSON.stringify(orderBy);
      expect(serialized).not.toContain("nulls");
      expect(serialized).not.toContain("tripperId");
    }
  });
});

describe("reviewListOrderBy — whitelist containment (structural, not per-token)", () => {
  it("no emitted key across any of the 4 tokens falls outside {rating, createdAt, user, tripper, id}", () => {
    const allowedKeys = new Set(["rating", "createdAt", "user", "tripper", "id"]);
    const tokens = ["rating", "created", "traveler", "tripper"] as const;
    for (const token of tokens) {
      for (const order of ["asc", "desc"] as const) {
        const orderBy = reviewListOrderBy(token, order);
        for (const clause of orderBy) {
          for (const key of Object.keys(clause)) {
            expect(allowedKeys.has(key)).toBe(true);
          }
        }
      }
    }
  });

  it("every result array ends with the { id: 'asc' } tiebreaker", () => {
    const tokens = ["rating", "created", "traveler", "tripper"] as const;
    for (const token of tokens) {
      const orderBy = reviewListOrderBy(token, "asc");
      expect(orderBy[orderBy.length - 1]).toEqual({ id: "asc" });
    }
  });

  it("non-created tokens carry { createdAt: 'desc' } immediately before the id tiebreaker", () => {
    const tokens = ["rating", "traveler", "tripper"] as const;
    for (const token of tokens) {
      const orderBy = reviewListOrderBy(token, "asc");
      expect(orderBy[orderBy.length - 2]).toEqual({ createdAt: "desc" });
    }
  });
});

describe("parseReviewSortBy — never-throw whitelist validation", () => {
  it("returns the value when it is in the allowed set", () => {
    expect(parseReviewSortBy("rating", ADMIN_REVIEW_SORT_FIELDS)).toBe("rating");
  });

  it("falls back to the default field ('created') for an unrecognized value", () => {
    expect(parseReviewSortBy("isApproved", ADMIN_REVIEW_SORT_FIELDS)).toBe(
      REVIEW_SORT_DEFAULT.sortBy,
    );
  });

  it("falls back to 'created' for null/undefined input", () => {
    expect(parseReviewSortBy(null, ADMIN_REVIEW_SORT_FIELDS)).toBe("created");
    expect(parseReviewSortBy(undefined, ADMIN_REVIEW_SORT_FIELDS)).toBe("created");
  });

  it("TRIPPER_REVIEW_SORT_FIELDS rejects 'traveler' and 'tripper' — tripper-page whitelist is {rating, created} only", () => {
    expect(parseReviewSortBy("traveler", TRIPPER_REVIEW_SORT_FIELDS)).toBe("created");
    expect(parseReviewSortBy("tripper", TRIPPER_REVIEW_SORT_FIELDS)).toBe("created");
  });

  it("an invalid sortBy falling back to 'created' still honors a VALID sortOrder in the full orderBy result", () => {
    const sortBy = parseReviewSortBy("isApproved", ADMIN_REVIEW_SORT_FIELDS);
    const sortOrder = parseReviewSortOrder("asc");
    expect(reviewListOrderBy(sortBy, sortOrder)).toEqual([
      { createdAt: "asc" },
      { id: "asc" },
    ]);
  });
});

describe("parseReviewSortOrder — never-throw direction validation", () => {
  it("returns 'asc' when given 'asc'", () => {
    expect(parseReviewSortOrder("asc")).toBe("asc");
  });

  it("returns 'desc' when given 'desc'", () => {
    expect(parseReviewSortOrder("desc")).toBe("desc");
  });

  it("falls back to 'desc' for malformed/garbage input", () => {
    expect(parseReviewSortOrder("banana")).toBe("desc");
    expect(parseReviewSortOrder(null)).toBe("desc");
    expect(parseReviewSortOrder(undefined)).toBe("desc");
  });
});
