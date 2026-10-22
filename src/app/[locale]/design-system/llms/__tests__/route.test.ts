import { expect, it } from "vitest";
import { GET } from "../route";
import { DESIGN_SYSTEM_LLMS } from "@/lib/constants/DESIGN_SYSTEM_LLMS";

it("serves the public AI rules as markdown without needing the repository", async () => {
  const response = GET();
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(response.headers.get("x-robots-tag")).toBe("noindex");
  await expect(response.text()).resolves.toBe(DESIGN_SYSTEM_LLMS);
  expect(DESIGN_SYSTEM_LLMS).toContain("/design-system/components");
  expect(DESIGN_SYSTEM_LLMS).toContain("FormField");
  expect(DESIGN_SYSTEM_LLMS).toContain("no repository");
});
