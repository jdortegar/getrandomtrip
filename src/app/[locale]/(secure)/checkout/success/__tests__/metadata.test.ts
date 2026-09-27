import { expect, it } from "vitest";
import { generateMetadata } from "../page";
it.each([
  ["en", "Payment status"],
  ["es", "Estado del pago"],
])(
  "uses neutral result metadata before verification in %s",
  async (locale, title) => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale }),
    });
    expect(metadata.title).toBe(title);
    expect(metadata.description).not.toMatch(
      /confirmed|confirmada|confirmado/i,
    );
  },
);
