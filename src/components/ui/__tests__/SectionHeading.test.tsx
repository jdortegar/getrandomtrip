import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SectionHeading from "@/components/ui/SectionHeading";

describe("SectionHeading", () => {
  it("uses the brand section heading treatment", () => {
    const html = renderToStaticMarkup(
      <SectionHeading
        eyebrow="A quiet start"
        subtitle="Lead copy"
        title="This is a section heading"
      />,
    );

    expect(html).toContain('data-component="SectionHeading"');
    expect(html).toContain("font-barlow-condensed");
    expect(html).toContain("font-bold");
    expect(html).toContain("leading-none");
    expect(html).toContain("text-ink");
    expect(html).toContain("text-primary");
    expect(html).toContain("tracking-[0.18em]");
    expect(html).not.toContain("font-display");
    expect(html).not.toContain("tracking-tightish");
  });
});
