import { existsSync, readdirSync, readFileSync } from "node:fs";
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

  it.each(templates)(
    "$file never uses the 800 weight (Brand Book: editorial is Bold 700)",
    ({ source }) => {
      expect(source).not.toMatch(/fontWeight(?::\s*"?|=\{)800/);
    },
  );

  it.each(templates.filter(({ source }) => source.includes("<Html")))(
    "$file stops clients from turning footer text into blue links",
    ({ source }) => {
      expect(source).toContain("<EmailClientResets />");
      expect(source).toContain('<Body id="body"');
    },
  );

  it.each(templates)(
    "$file renders the shared app footer",
    ({ source }) => {
      expect(source).toMatch(/<(EmailLayout|EmailFooter)\b/);
    },
  );

  it.each(templates)("$file does not link to X", ({ source }) => {
    expect(source).not.toContain("x.com/getrandomtrip");
    expect(source).not.toContain("social-x.png");
  });
});

describe("email images", () => {
  const sources = [
    ...templates.map(({ file, source }) => ({ file, source })),
    ...readdirSync(path.join(EMAILS_DIR, "components"))
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => ({
        file: `components/${file}`,
        source: readFileSync(path.join(EMAILS_DIR, "components", file), "utf8"),
      })),
  ];
  const publicDir = path.resolve(EMAILS_DIR, "../../public");
  // `${EMAIL_ASSET_ORIGIN}/…`, `${BASE_URL}/…`, img("/…") and "/images/…" literals.
  const pattern = /(?:\}|img\(|")(\/(?:assets|images)\/[^`"')\s]+\.(?:png|jpe?g|gif))/g;
  const refs = sources.flatMap(({ file, source }) =>
    [...source.matchAll(pattern)].flatMap(([, ref]) =>
      // Expand the footer's `social-${icon}-teal.png` template.
      ref.includes("${icon}")
        ? ["instagram", "facebook", "linkedin"].map((icon) => ({ file, ref: ref.replace("${icon}", icon) }))
        : [{ file, ref }],
    ),
  );

  it("finds the referenced images", () => {
    expect(refs.length).toBeGreaterThan(10);
  });

  it.each(refs)("$file → $ref exists in public/ (served from getrandomtrip.com)", ({ ref }) => {
    expect(existsSync(path.join(publicDir, ref))).toBe(true);
  });
});
