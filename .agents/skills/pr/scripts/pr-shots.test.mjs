// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  assetPath,
  credentialsEnvFor,
  isAllowedBaseUrl,
  markdownFor,
  parseArgs,
  parseRemote,
  rawUrl,
  validateSpec,
  VIEWPORTS,
} from "./pr-shots.mjs";

const shot = (overrides = {}) => ({
  name: "notification-modal",
  description: "Admin notification modal showing the review rating and excerpt",
  path: "/es/dashboard/notifications",
  ...overrides,
});

describe("parseArgs", () => {
  it("splits the command, flag values, and positionals", () => {
    expect(
      parseArgs(["capture", "--spec", "s.json", "--out", "/x/out", "extra"]),
    ).toEqual({
      cmd: "capture",
      flags: { spec: "s.json", out: "/x/out" },
      positional: ["extra"],
    });
  });

  it("treats a trailing or value-less flag as boolean", () => {
    expect(parseArgs(["publish", "--dry-run", "--pr", "280"]).flags).toEqual({
      "dry-run": true,
      pr: "280",
    });
  });
});

describe("validateSpec", () => {
  it("normalizes viewport, login, and defaults", () => {
    const [normalized] = validateSpec({
      login: { role: "admin" },
      shots: [shot({ viewport: "mobile" })],
    });
    expect(normalized).toMatchObject({
      name: "notification-modal",
      viewport: VIEWPORTS.mobile,
      role: "ADMIN",
      steps: [],
      mask: [],
      fullPage: false,
      element: null,
    });
  });

  it("defaults to desktop and lets a shot override or drop the login", () => {
    const shots = validateSpec({
      login: { role: "ADMIN" },
      shots: [
        shot({ name: "a" }),
        shot({ name: "b", login: { role: "tripper" } }),
        shot({ name: "c", login: null }),
      ],
    });
    expect(shots.map((s) => s.role)).toEqual(["ADMIN", "TRIPPER", null]);
    expect(shots[0].viewport).toBe(VIEWPORTS.desktop);
  });

  it("rejects missing descriptions, unsafe names, duplicates, and absolute URLs", () => {
    expect(() => validateSpec({ shots: [] })).toThrow(/at least one shot/);
    expect(() => validateSpec({ shots: [shot({ description: "" })] })).toThrow(
      /description/,
    );
    expect(() => validateSpec({ shots: [shot({ name: "../x" })] })).toThrow(
      /name/,
    );
    expect(() => validateSpec({ shots: [shot(), shot()] })).toThrow(
      /duplicate/,
    );
    expect(() =>
      validateSpec({ shots: [shot({ path: "https://evil.example/" })] }),
    ).toThrow(/path/);
    expect(() =>
      validateSpec({ shots: [shot({ viewport: "tablet" })] }),
    ).toThrow(/viewport/);
  });

  it("rejects unknown step kinds", () => {
    expect(() =>
      validateSpec({ shots: [shot({ steps: [{ hover: "a" }] })] }),
    ).toThrow(/step/);
    expect(
      validateSpec({
        shots: [
          shot({
            steps: [
              { click: "text=Ver" },
              { fill: ["#q", "x"] },
              { waitFor: "[role=dialog]" },
              { press: "Escape" },
            ],
          }),
        ],
      })[0].steps,
    ).toHaveLength(4);
  });
});

describe("credentialsEnvFor", () => {
  it("maps a role to its env var names", () => {
    expect(credentialsEnvFor("admin")).toEqual({
      email: "PR_SHOTS_ADMIN_EMAIL",
      password: "PR_SHOTS_ADMIN_PASSWORD",
    });
  });
});

describe("isAllowedBaseUrl", () => {
  it("allows local servers and Netlify deploy previews", () => {
    expect(isAllowedBaseUrl("http://localhost:3010")).toBe(true);
    expect(isAllowedBaseUrl("http://127.0.0.1:3011")).toBe(true);
    expect(
      isAllowedBaseUrl("https://deploy-preview-280--getrandomtrip.netlify.app"),
    ).toBe(true);
  });

  it("refuses production and arbitrary hosts", () => {
    expect(isAllowedBaseUrl("https://getrandomtrip.netlify.app")).toBe(false);
    expect(isAllowedBaseUrl("https://example.com")).toBe(false);
    expect(isAllowedBaseUrl("not a url")).toBe(false);
  });
});

describe("parseRemote / assetPath / rawUrl", () => {
  it("parses ssh and https GitHub remotes", () => {
    expect(parseRemote("git@github.com:jdortegar/getrandomtrip.git")).toBe(
      "jdortegar/getrandomtrip",
    );
    expect(parseRemote("https://github.com/jdortegar/getrandomtrip")).toBe(
      "jdortegar/getrandomtrip",
    );
    expect(
      parseRemote("git@github.com-jdortegar:jdortegar/getrandomtrip.git"),
    ).toBe("jdortegar/getrandomtrip");
    expect(() => parseRemote("https://gitlab.com/a/b")).toThrow(/GitHub/);
  });

  it("builds a commit-pinned raw URL under the PR folder", () => {
    expect(assetPath(280, "notification-modal")).toBe(
      "pr-280/notification-modal.png",
    );
    expect(() => assetPath("abc", "x")).toThrow(/PR number/);
    expect(
      rawUrl("jdortegar/getrandomtrip", "abc123", "pr-280/x.png"),
    ).toBe(
      "https://raw.githubusercontent.com/jdortegar/getrandomtrip/abc123/pr-280/x.png",
    );
  });
});

describe("markdownFor", () => {
  it("puts each description directly above its image", () => {
    expect(
      markdownFor([
        { description: "Desktop modal", url: "https://u/a.png" },
        { description: "Mobile modal", url: "https://u/b.png" },
      ]),
    ).toBe(
      "Desktop modal\n\n![Desktop modal](https://u/a.png)\n\nMobile modal\n\n![Mobile modal](https://u/b.png)",
    );
  });
});
