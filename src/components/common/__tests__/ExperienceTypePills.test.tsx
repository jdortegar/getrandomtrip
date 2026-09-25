import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExperienceTypePills } from "../ExperienceTypePills";

describe("ExperienceTypePills", () => {
  it.each(["xsed", "Xsed"])("brands %s only when it renders as an existing type chip", (type) => {
    const html = renderToStaticMarkup(
      <ExperienceTypePills locale="en" types={[type]} />,
    );
    expect(html).toContain("bg-xsed");
    expect(html).toContain(">XSED</span>");
    expect(html).not.toContain("<p");
  });

  it.each([null, "essenza", "xsed"])(
    "renders legacy marker as XSED level instead of a traveler type (stored level: %s)",
    (level) => {
      const html = renderToStaticMarkup(
        <ExperienceTypePills
          level={level}
          locale="en"
          types={["couple", "XSED"]}
        />,
      );
      expect(html).toContain("Couple (BOND©)");
      expect(html).not.toContain("XSED Drop");
      expect(html).not.toContain("Essenza");
      expect(html.match(/XSED/g)).toHaveLength(1);
      expect(html).toMatch(/<p[^>]*>XSED<\/p>/);
      expect(html).not.toContain("bg-xsed");
    },
  );
});
