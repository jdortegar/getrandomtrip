// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ConfigError,
  DEFAULT_TIMEOUTS,
  captureFileName,
  formatSummary,
  mergeConfig,
  parseArgs,
  parseViewportArg,
  resolveViewports,
  routeNameFromPath,
  runDirName,
  sanitizeName,
  shortError,
  validateConfig,
  validateSteps,
} from "./capture.mjs";

const base = { baseURL: "http://localhost:4000", routes: ["/"] };

function errorsOf(fn) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(ConfigError);
    return err.errors;
  }
  throw new Error("expected ConfigError");
}

describe("sanitizeName / routeNameFromPath", () => {
  it("lowercases and replaces unsafe characters with single dashes", () => {
    expect(sanitizeName("Blog Post / Hero!!")).toBe("blog-post-hero");
    expect(sanitizeName("--a__b..c--")).toBe("a__b..c");
    expect(sanitizeName("../../etc/passwd")).toBe("etc-passwd");
  });

  it("truncates long names and falls back for empty input", () => {
    expect(sanitizeName("x".repeat(200))).toHaveLength(80);
    expect(sanitizeName("///")).toBe("page");
  });

  it("derives route names from paths", () => {
    expect(routeNameFromPath("/")).toBe("home");
    expect(routeNameFromPath("/en/blog/my-post")).toBe("en-blog-my-post");
    expect(routeNameFromPath("/search?q=Rome&page=2#top")).toBe("search-q-rome-page-2-top");
  });
});

describe("captureFileName", () => {
  it("joins route, viewport, and optional component with double underscores", () => {
    expect(captureFileName("home", "desktop")).toBe("home__desktop.png");
    expect(captureFileName("Home Page", "mobile", "#main nav")).toBe(
      "home-page__mobile__main-nav.png",
    );
  });
});

describe("runDirName", () => {
  it("formats local time as YYYYMMDD-HHMMSS plus a short suffix", () => {
    const date = new Date(2026, 0, 2, 3, 4, 5);
    expect(runDirName(date, "ab12")).toBe("20260102-030405-ab12");
  });

  it("generates distinct suffixes when none is given", () => {
    const date = new Date(2026, 0, 2, 3, 4, 5);
    const names = new Set(Array.from({ length: 20 }, () => runDirName(date)));
    expect(names.size).toBe(20);
    for (const name of names) expect(name).toMatch(/^20260102-030405-[a-z0-9]{6}$/);
  });
});

describe("viewports", () => {
  it("resolves presets and custom viewports", () => {
    expect(resolveViewports(["desktop", "mobile", { name: "Tablet", width: 820, height: 1180 }])).toEqual([
      { name: "desktop", width: 1280, height: 800 },
      { name: "mobile", width: 390, height: 844 },
      { name: "tablet", width: 820, height: 1180 },
    ]);
  });

  it("defaults to desktop and mobile", () => {
    expect(resolveViewports(undefined).map((v) => v.name)).toEqual(["desktop", "mobile"]);
  });

  it("rejects unknown presets, bad sizes, and duplicate names", () => {
    expect(() => resolveViewports(["watch"])).toThrow(/unknown viewport preset/);
    expect(() => resolveViewports([{ name: "x", width: 0, height: 10 }])).toThrow(/width/);
    expect(() => resolveViewports(["desktop", "desktop"])).toThrow(/duplicate viewport/);
  });

  it("parses CLI viewport strings", () => {
    expect(parseViewportArg("mobile")).toBe("mobile");
    expect(parseViewportArg("tablet:820x1180")).toEqual({ name: "tablet", width: 820, height: 1180 });
    expect(parseViewportArg("1440x900")).toEqual({ name: "1440x900", width: 1440, height: 900 });
  });
});

describe("validateSteps", () => {
  it("accepts every supported step type", () => {
    const steps = [
      { click: "#menu" },
      { hover: ".card" },
      { fill: ["input[name=q]", "Rome"] },
      { press: "Escape" },
      { waitFor: "#panel" },
      { wait: 250 },
    ];
    expect(validateSteps(steps, "r")).toEqual([
      { type: "click", selector: "#menu" },
      { type: "hover", selector: ".card" },
      { type: "fill", selector: "input[name=q]", value: "Rome" },
      { type: "press", key: "Escape" },
      { type: "waitFor", selector: "#panel" },
      { type: "wait", ms: 250 },
    ]);
  });

  it("rejects unknown types, eval-like steps, and multi-key steps", () => {
    expect(() => validateSteps([{ evaluate: "alert(1)" }], "r")).toThrow(/unknown step type "evaluate"/);
    expect(() => validateSteps([{ click: "#a", hover: "#b" }], "r")).toThrow(/exactly one key/);
    expect(() => validateSteps("click", "r")).toThrow(/must be an array/);
  });

  it("rejects bad arguments and unbounded waits", () => {
    expect(() => validateSteps([{ click: "" }], "r")).toThrow(/non-empty selector/);
    expect(() => validateSteps([{ fill: ["#a"] }], "r")).toThrow(/\[selector, text\]/);
    expect(() => validateSteps([{ wait: 60000 }], "r")).toThrow(/between 0 and 10000/);
    expect(() => validateSteps([{ wait: -1 }], "r")).toThrow(/between 0 and 10000/);
  });
});

describe("validateConfig", () => {
  it("normalizes a minimal config with defaults", () => {
    const cfg = validateConfig(base);
    expect(cfg.baseURL).toBe("http://localhost:4000");
    expect(cfg.outDir).toBe(".screenshots");
    expect(cfg.fullPage).toBe(true);
    expect(cfg.timeouts).toEqual(DEFAULT_TIMEOUTS);
    expect(cfg.routes).toEqual([
      {
        name: "home",
        path: "/",
        setup: [],
        selector: null,
        component: null,
        readySelector: null,
        optional: false,
        fullPage: true,
      },
    ]);
    expect(cfg.viewports.map((v) => v.name)).toEqual(["desktop", "mobile"]);
  });

  it("requires baseURL and at least one route", () => {
    const errors = errorsOf(() => validateConfig({}));
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/baseURL is required/),
        expect.stringMatching(/routes must be a non-empty array/),
      ]),
    );
  });

  it("rejects non-http base URLs and paths without a leading slash", () => {
    const errors = errorsOf(() =>
      validateConfig({ baseURL: "file:///etc", routes: ["about", { path: "https://evil.test/" }] }),
    );
    expect(errors.join("\n")).toMatch(/baseURL must be an http\(s\) URL/);
    expect(errors.join("\n")).toMatch(/routes\[0\].*must start with "\/"/);
    expect(errors.join("\n")).toMatch(/routes\[1\].*must start with "\/"/);
  });

  it("collects route field errors, unknown keys, and invalid steps", () => {
    const errors = errorsOf(() =>
      validateConfig({
        ...base,
        routes: [{ path: "/", selector: 5, optional: "yes", script: "x", setup: [{ eval: "1" }] }],
      }),
    );
    const text = errors.join("\n");
    expect(text).toMatch(/selector must be a non-empty string/);
    expect(text).toMatch(/optional must be a boolean/);
    expect(text).toMatch(/unknown key "script"/);
    expect(text).toMatch(/unknown step type "eval"/);
  });

  it("rejects duplicate capture names", () => {
    const errors = errorsOf(() => validateConfig({ ...base, routes: ["/", { name: "home", path: "/x" }] }));
    expect(errors.join("\n")).toMatch(/duplicate capture name "home"/);
  });

  it("allows the same route name with different components", () => {
    const cfg = validateConfig({
      ...base,
      routes: [
        { name: "home", path: "/", selector: "header" },
        { name: "home", path: "/", selector: "footer", component: "site-footer" },
      ],
    });
    expect(cfg.routes.map((r) => r.component)).toEqual(["header", "site-footer"]);
  });

  it("validates timeouts and fullPage", () => {
    const errors = errorsOf(() =>
      validateConfig({ ...base, fullPage: "no", timeouts: { navigation: -5, bogus: 1 } }),
    );
    const text = errors.join("\n");
    expect(text).toMatch(/fullPage must be a boolean/);
    expect(text).toMatch(/timeouts.navigation must be an integer between 1 and 120000/);
    expect(text).toMatch(/unknown timeout "bogus"/);
  });

  it("lets a route override fullPage", () => {
    const cfg = validateConfig({ ...base, fullPage: false, routes: [{ path: "/", fullPage: true }] });
    expect(cfg.routes[0].fullPage).toBe(true);
  });
});

describe("formatSummary / shortError", () => {
  it("prints one line per capture and totals", () => {
    const text = formatSummary(".screenshots/run", [
      { ok: true, file: ".screenshots/run/home__desktop.png", warnings: [], consoleErrors: 2 },
      { ok: false, fileName: "home__mobile__nav.png", reason: "selector missing", warnings: ["fonts slow"], consoleErrors: 0 },
      { ok: false, optional: true, fileName: "extra__desktop.png", reason: "timeout", warnings: [], consoleErrors: 0 },
    ]);
    expect(text.split("\n")).toEqual([
      "Run dir: .screenshots/run",
      "  OK    .screenshots/run/home__desktop.png  [console errors: 2]",
      "  FAIL  home__mobile__nav.png  selector missing  [fonts slow]",
      "  SKIP  extra__desktop.png  (optional) timeout",
      "Totals: 1 ok, 1 failed, 1 skipped (optional), 1 warnings",
    ]);
  });

  it("keeps only the first line of an error without ANSI codes", () => {
    expect(shortError(new Error("\u001b[31mTimeout 5000ms exceeded.\u001b[39m\nCall log:\n  - waiting"))).toBe(
      "Timeout 5000ms exceeded.",
    );
  });
});

describe("parseArgs / mergeConfig", () => {
  it("parses flags, repeated routes and viewports", () => {
    const args = parseArgs([
      "--config",
      "shots.json",
      "--base-url",
      "http://127.0.0.1:5000",
      "--route",
      "/",
      "--route",
      "/about",
      "--viewport",
      "mobile",
      "--viewport",
      "tablet:820x1180",
      "--out-dir",
      "tmp/shots",
      "--selector",
      "main",
      "--ready-selector",
      "#app",
      "--no-full-page",
      "--timeout",
      "15000",
      "--playwright-from",
      "../app",
    ]);
    expect(args).toEqual({
      config: "shots.json",
      help: false,
      playwrightFrom: "../app",
      overrides: {
        baseURL: "http://127.0.0.1:5000",
        routes: ["/", "/about"],
        viewports: ["mobile", { name: "tablet", width: 820, height: 1180 }],
        outDir: "tmp/shots",
        selector: "main",
        readySelector: "#app",
        fullPage: false,
        timeouts: { navigation: 15000 },
      },
    });
  });

  it("rejects unknown flags and missing values", () => {
    expect(() => parseArgs(["--nope"])).toThrow(/unknown flag --nope/);
    expect(() => parseArgs(["--base-url"])).toThrow(/--base-url requires a value/);
    expect(() => parseArgs(["--timeout", "abc"])).toThrow(/--timeout must be a positive integer/);
  });

  it("lets CLI overrides win and applies CLI selectors to string routes", () => {
    const merged = mergeConfig(
      { baseURL: "http://a.test", routes: ["/x"], timeouts: { images: 1000 }, fullPage: true },
      { baseURL: "http://b.test", routes: ["/y"], selector: "main", fullPage: false, timeouts: { navigation: 9000 } },
    );
    expect(merged).toEqual({
      baseURL: "http://b.test",
      routes: [{ path: "/y", selector: "main" }],
      timeouts: { images: 1000, navigation: 9000 },
      fullPage: false,
    });
  });

  it("applies CLI selectors to config routes when no CLI routes are given", () => {
    const merged = mergeConfig(
      { baseURL: "http://a.test", routes: ["/x", { path: "/z", selector: "aside" }] },
      { readySelector: "#app" },
    );
    expect(merged.routes).toEqual([
      { path: "/x", readySelector: "#app" },
      { path: "/z", selector: "aside", readySelector: "#app" },
    ]);
  });
});
