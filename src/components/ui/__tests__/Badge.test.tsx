import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/Badge";
import Chip from "@/components/Chip";
import { ChipListInput } from "@/components/ui/ChipListInput";
import { ProductBadge } from "@/components/common/ProductBadge";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

describe("Badge style ownership", () => {
  it("keeps presentation out of the public APIs", () => {
    type StyleProps =
      | "className"
      | "style"
      | "styles"
      | "colorClassName"
      | "chipColor";
    const contracts: [
      Extract<keyof ComponentProps<typeof Badge>, StyleProps>,
      Extract<keyof ComponentProps<typeof ProductBadge>, StyleProps>,
      Extract<keyof ComponentProps<typeof StatusIndicatorBadge>, StyleProps>,
      Extract<keyof ComponentProps<typeof Chip>, StyleProps>,
      Extract<keyof ComponentProps<typeof ChipListInput>, StyleProps>,
    ] extends [never, never, never, never, never]
      ? true
      : false = true;
    expect(contracts).toBe(true);
  });

  it.each([
    ["category", "family", "bg-sky-50"],
    ["approval", "approved", "bg-green-50"],
    ["approval", "pending", "bg-amber-50"],
    ["invitation", "invited", "bg-sky-50"],
    ["invitation", "expired", "bg-amber-50"],
    ["invitation", "alreadyMember", "bg-neutral-50"],
    ["country", "AR", "country"],
    ["level", "essenza", "level"],
    ["article-tag", "family", "bg-blue-100"],
    ["credential", "ambassador", "bg-white/10"],
    ["inspiration-type", "couple", "bg-black/60"],
    ["inspiration-level", "essenza", "bg-amber-500"],
    ["inspiration-level", "unknown", "bg-gray-500"],
    ["inspiration-tag", "family", "bg-white/15"],
  ] as const)(
    "owns the %s/%s treatment without mutating labels",
    (kind, value, color) => {
      const html = renderToStaticMarkup(
        <Badge kind={kind} label="Viaje familiar" value={value} />,
      );
      expect(html).toContain('data-component="Badge"');
      expect(html).toContain("uppercase");
      expect(html).toContain(color);
      expect(html).toContain(">Viaje familiar</span>");
      expect(html).not.toContain("button");
    },
  );

  it("shares the category primitive with the product adapter", () => {
    const html = renderToStaticMarkup(<ProductBadge value="Xsed" />);
    expect(html).toContain('data-component="Badge"');
    expect(html).toContain(">XSED</span>");
    expect(html).toContain("bg-xsed");
    expect(renderToStaticMarkup(<ProductBadge value="TGIS" />)).not.toContain(
      "bg-xsed",
    );
  });

  it("preserves local legacy treatments and inherited level line height", () => {
    const country = renderToStaticMarkup(
      <Badge kind="country" label="Argentina" />,
    );
    const level = renderToStaticMarkup(<Badge kind="level" label="Essenza" />);
    expect(country).toContain("country");
    expect(level).toContain("text-[12px]");
    expect(level).not.toContain("text-xs");
    expect(country).not.toContain("var(--");
    expect(level).not.toContain("var(--");
  });

  it("keeps preference tags round and read-only", () => {
    const html = renderToStaticMarkup(
      <Badge kind="preference" label="Río Negro" />,
    );
    expect(html).toContain("rounded-full");
    expect(html).toContain("uppercase");
    expect(html).toContain(">Río Negro</span>");
    expect(html).not.toContain("button");
  });

  it.each(["admin-set", "verified"] as const)(
    "owns the %s icon without caller markup",
    (kind) => {
      const html = renderToStaticMarkup(
        <Badge kind={kind} label="Localized label" />,
      );
      expect(html).toContain("<svg");
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("Localized label");
    },
  );
});
