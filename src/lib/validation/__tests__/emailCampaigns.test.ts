import { describe, expect, it } from "vitest";

import { contactListQuerySchema } from "../emailCampaigns";

describe("contactListQuerySchema paging", () => {
  it("falls back to page 1 for non-finite or invalid pages", () => {
    for (const page of ["1e400", "-3", "abc", "0", null]) {
      expect(contactListQuerySchema.parse({ page, limit: null }).page).toBe(1);
    }
  });

  it("keeps valid pages and clamps the limit", () => {
    const parsed = contactListQuerySchema.parse({ page: "3", limit: "500" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(100);
  });
});
