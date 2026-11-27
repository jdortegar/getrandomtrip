import { render } from "@react-email/components";
import * as React from "react";
import { describe, expect, it } from "vitest";
import EmailButton from "../components/EmailButton";

describe("EmailButton", () => {
  it.each(["left", "center"] as const)(
    "never floats (%s), so following text stays below the button",
    async (align) => {
      const html = await render(
        <EmailButton align={align} href="https://getrandomtrip.com">
          Ir
        </EmailButton>,
      );
      // A table with align="left"/"right" floats in browsers and mail clients.
      expect(html).not.toMatch(/<table[^>]*align="(left|right)"/);
      expect(html).toContain(`text-align:${align}`);
    },
  );

  it("defaults to the ButtonV2 sm size", async () => {
    const html = await render(<EmailButton href="https://getrandomtrip.com">Ir</EmailButton>);
    expect(html).toContain("padding:11px 18px");
    expect(html).toContain("font-size:14px");
  });
});
