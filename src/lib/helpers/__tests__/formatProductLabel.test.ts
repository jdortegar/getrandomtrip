import { describe, expect, it } from "vitest";
import { formatProductLabel } from "../formatProductLabel";

describe("formatProductLabel", () => {
  it.each(["xsed", "XSED", "Xsed", "xSeD"])(
    "uppercases the exact product marker %s",
    (value) => {
      expect(formatProductLabel(value)).toBe("XSED");
    },
  );

  it.each(["couple", "Essenza", "TGIS Drop", "My xsed trip", "/xsed", ""])(
    "preserves other labels and free-form content: %s",
    (value) => {
      expect(formatProductLabel(value)).toBe(value);
    },
  );
});
