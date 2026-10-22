import { describe, expect, it } from "vitest";
import { buttonVariants } from "@/components/ui/Button";

describe("Button sizes", () => {
  it("makes sm shorter and tighter than md", () => {
    const sm = buttonVariants({ size: "sm" });
    const md = buttonVariants({ size: "md" });

    expect(sm).toContain("min-h-9");
    expect(sm).toContain("px-4");
    expect(sm).not.toContain("min-h-11");
    expect(md).toContain("min-h-11");
    expect(md).toContain("px-6");
  });
});
