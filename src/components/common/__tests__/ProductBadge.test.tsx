import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductBadge } from "../ProductBadge";

describe("ProductBadge", () => {
  it.each(["xsed", "XSED", "Xsed", "xSeD"])(
    "brands the exact product value %s without changing stored values",
    (value) => {
      const html = renderToStaticMarkup(<ProductBadge value={value} />);
      expect(html).toContain(">XSED</span>");
      expect(html).toContain("bg-xsed");
      expect(html).toContain("text-neutral-900");
    },
  );

  it("uses the canonical type-chip shape and brand orange for XSED", () => {
    const html = renderToStaticMarkup(
      <ProductBadge value="xsed" />,
    );
    expect(html).toContain("rounded-[6px]");
    expect(html).toContain("border-xsed");
    expect(html).not.toContain("sky-");
  });

  it.each(["couple", "Essenza", "TGIS", "My xsed trip", "/xsed"])(
    "preserves non-XSED badge copy and color: %s",
    (value) => {
      const html = renderToStaticMarkup(<ProductBadge value={value} />);
      expect(html).toContain(`>${value}</span>`);
      expect(html).toContain("bg-sky-50");
      expect(html).not.toContain("bg-xsed");
    },
  );

  it("preserves the non-XSED chip treatment", () => {
    const html = renderToStaticMarkup(
      <ProductBadge value="couple" />,
    );
    expect(html).toContain("bg-sky-50");
    expect(html).toContain(">couple</span>");
    expect(html).not.toContain("bg-xsed");
  });
});
