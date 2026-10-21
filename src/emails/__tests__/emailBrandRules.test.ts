import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const EMAILS_DIR = path.resolve(__dirname, "..");

const templates = readdirSync(EMAILS_DIR)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => ({
    file,
    source: readFileSync(path.join(EMAILS_DIR, file), "utf8"),
  }));

describe("email brand rules", () => {
  it("finds the email templates", () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  it.each(templates)(
    "$file does not use the retired yellow #facc15",
    ({ source }) => {
      expect(source.toLowerCase()).not.toContain("#facc15");
    },
  );

  it.each(templates)("$file does not link to X", ({ source }) => {
    expect(source).not.toContain("x.com/getrandomtrip");
    expect(source).not.toContain("social-x.png");
  });
});
