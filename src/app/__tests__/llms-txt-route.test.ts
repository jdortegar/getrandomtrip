import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "@/lib/seo/llmsTxt";
import { GET } from "../llms.txt/route";

describe("GET /llms.txt", () => {
  it("serves the llms.txt body as UTF-8 plain text", async () => {
    const res = GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toBe(buildLlmsTxt());
  });
});
