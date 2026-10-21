#!/usr/bin/env node
// Portable screenshot capture with the project's own Playwright. Pure helpers
// are exported for tests; the CLI at the bottom wires them to Chromium.
// Usage: node .agents/skills/screenshot/scripts/capture.mjs --base-url <url> [flags]
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const VIEWPORT_PRESETS = {
  desktop: { name: "desktop", width: 1280, height: 800 },
  mobile: { name: "mobile", width: 390, height: 844 },
};
export const DEFAULT_VIEWPORTS = ["desktop", "mobile"];
export const DEFAULT_OUT_DIR = ".screenshots";
export const DEFAULT_TIMEOUTS = {
  navigation: 30000,
  networkIdle: 5000,
  ready: 10000,
  fonts: 5000,
  images: 5000,
  step: 5000,
  screenshot: 15000,
};
export const MAX_TIMEOUT_MS = 120000;
export const MAX_WAIT_STEP_MS = 10000;
export const MAX_IMAGES_CHECKED = 100;
const MAX_NAME_LENGTH = 80;
const MIN_VIEWPORT = 100;
const MAX_VIEWPORT = 10000;
const SELECTOR_STEPS = ["click", "hover", "waitFor"];
const STEP_TYPES = [...SELECTOR_STEPS, "fill", "press", "wait"];
const TOP_LEVEL_KEYS = ["baseURL", "routes", "viewports", "outDir", "fullPage", "timeouts"];
const ROUTE_KEYS = ["name", "path", "setup", "selector", "component", "readySelector", "optional", "fullPage"];

export const EXIT = { OK: 0, CAPTURE_FAILED: 1, CONFIG: 2, MISSING_DEPENDENCY: 3, INTERRUPTED: 130 };

export class ConfigError extends Error {
  constructor(errors) {
    const list = Array.isArray(errors) ? errors : [errors];
    super(list.join("; "));
    this.name = "ConfigError";
    this.errors = list;
  }
}

export class DependencyError extends Error {
  constructor(message) {
    super(message);
    this.name = "DependencyError";
  }
}

// ---------------------------------------------------------------- pure helpers

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

export function sanitizeName(value) {
  const cleaned = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, MAX_NAME_LENGTH)
    .replace(/[-._]+$/g, "");
  return cleaned || "page";
}

export function routeNameFromPath(routePath) {
  const trimmed = String(routePath).replace(/^\/+/, "");
  return trimmed ? sanitizeName(trimmed) : "home";
}

export function captureFileName(routeName, viewportName, component) {
  const parts = [sanitizeName(routeName), sanitizeName(viewportName)];
  if (component) parts.push(sanitizeName(component));
  return `${parts.join("__")}.png`;
}

function randomSuffix(length = 6) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(randomBytes(length), (b) => alphabet[b % alphabet.length]).join("");
}

export function runDirName(date = new Date(), suffix = randomSuffix()) {
  const pad = (n) => String(n).padStart(2, "0");
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${day}-${time}-${suffix}`;
}

function checkDimension(value, label) {
  if (!Number.isInteger(value) || value < MIN_VIEWPORT || value > MAX_VIEWPORT) {
    throw new ConfigError(`${label} must be an integer between ${MIN_VIEWPORT} and ${MAX_VIEWPORT}`);
  }
}

export function resolveViewports(list) {
  const input = list ?? DEFAULT_VIEWPORTS;
  if (!Array.isArray(input) || input.length === 0) {
    throw new ConfigError("viewports must be a non-empty array");
  }
  const seen = new Set();
  return input.map((entry, i) => {
    let viewport;
    if (typeof entry === "string") {
      const preset = VIEWPORT_PRESETS[entry];
      if (!preset) {
        const names = Object.keys(VIEWPORT_PRESETS).join(", ");
        throw new ConfigError(`unknown viewport preset "${entry}" (presets: ${names})`);
      }
      viewport = { ...preset };
    } else if (isPlainObject(entry)) {
      if (!isNonEmptyString(entry.name)) throw new ConfigError(`viewports[${i}].name is required`);
      checkDimension(entry.width, `viewports[${i}].width`);
      checkDimension(entry.height, `viewports[${i}].height`);
      viewport = { name: sanitizeName(entry.name), width: entry.width, height: entry.height };
    } else {
      throw new ConfigError(`viewports[${i}] must be a preset name or { name, width, height }`);
    }
    if (seen.has(viewport.name)) throw new ConfigError(`duplicate viewport "${viewport.name}"`);
    seen.add(viewport.name);
    return viewport;
  });
}

export function parseViewportArg(value) {
  if (VIEWPORT_PRESETS[value]) return value;
  const match = /^(?:([^:]+):)?(\d+)x(\d+)$/.exec(value);
  if (!match) throw new ConfigError(`invalid --viewport "${value}" (use a preset, WxH, or name:WxH)`);
  const [, name, width, height] = match;
  return { name: name ?? `${width}x${height}`, width: Number(width), height: Number(height) };
}

function validateStep(step, label) {
  if (!isPlainObject(step)) throw new ConfigError(`${label} must be an object like { "click": "css" }`);
  const keys = Object.keys(step);
  if (keys.length !== 1) throw new ConfigError(`${label} must have exactly one key (got ${keys.length})`);
  const [type] = keys;
  const arg = step[type];
  if (!STEP_TYPES.includes(type)) {
    throw new ConfigError(`${label}: unknown step type "${type}" (allowed: ${STEP_TYPES.join(", ")})`);
  }
  if (SELECTOR_STEPS.includes(type)) {
    if (!isNonEmptyString(arg)) throw new ConfigError(`${label}: "${type}" needs a non-empty selector`);
    return { type, selector: arg };
  }
  if (type === "fill") {
    if (!Array.isArray(arg) || arg.length !== 2 || !isNonEmptyString(arg[0]) || typeof arg[1] !== "string") {
      throw new ConfigError(`${label}: "fill" needs [selector, text]`);
    }
    return { type, selector: arg[0], value: arg[1] };
  }
  if (type === "press") {
    if (!isNonEmptyString(arg)) throw new ConfigError(`${label}: "press" needs a key name like "Escape"`);
    return { type, key: arg };
  }
  if (!Number.isInteger(arg) || arg < 0 || arg > MAX_WAIT_STEP_MS) {
    throw new ConfigError(`${label}: "wait" must be an integer between 0 and ${MAX_WAIT_STEP_MS} ms`);
  }
  return { type, ms: arg };
}

export function validateSteps(steps, label) {
  if (steps === undefined) return [];
  if (!Array.isArray(steps)) throw new ConfigError(`${label}.setup must be an array`);
  return steps.map((step, i) => validateStep(step, `${label}.setup[${i}]`));
}

function validatePath(value, label, errors) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    errors.push(`${label}.path must start with "/" (got ${JSON.stringify(value)})`);
    return false;
  }
  return true;
}

function optionalString(route, key, label, errors) {
  if (route[key] === undefined || route[key] === null) return null;
  if (!isNonEmptyString(route[key])) {
    errors.push(`${label}.${key} must be a non-empty string`);
    return null;
  }
  return route[key];
}

function normalizeRoute(raw, i, fullPage, errors) {
  const label = `routes[${i}]`;
  const route = typeof raw === "string" ? { path: raw } : raw;
  if (!isPlainObject(route)) {
    errors.push(`${label} must be a path string or an object with "path"`);
    return null;
  }
  for (const key of Object.keys(route)) {
    if (!ROUTE_KEYS.includes(key)) errors.push(`${label}: unknown key "${key}"`);
  }
  const pathOk = validatePath(route.path, label, errors);
  const name = optionalString(route, "name", label, errors);
  const selector = optionalString(route, "selector", label, errors);
  const component = optionalString(route, "component", label, errors);
  const readySelector = optionalString(route, "readySelector", label, errors);
  for (const key of ["optional", "fullPage"]) {
    if (route[key] !== undefined && typeof route[key] !== "boolean") errors.push(`${label}.${key} must be a boolean`);
  }
  let setup = [];
  try {
    setup = validateSteps(route.setup, label);
  } catch (err) {
    errors.push(...(err.errors ?? [err.message]));
  }
  if (!pathOk) return null;
  return {
    name: name ? sanitizeName(name) : routeNameFromPath(route.path),
    path: route.path,
    setup,
    selector,
    component: selector ? (component ?? selector) : null,
    readySelector,
    optional: route.optional === true,
    fullPage: typeof route.fullPage === "boolean" ? route.fullPage : fullPage,
  };
}

function validateTimeouts(raw, errors) {
  const timeouts = { ...DEFAULT_TIMEOUTS };
  if (raw === undefined) return timeouts;
  if (!isPlainObject(raw)) {
    errors.push("timeouts must be an object");
    return timeouts;
  }
  for (const [key, value] of Object.entries(raw)) {
    if (!(key in DEFAULT_TIMEOUTS)) {
      errors.push(`unknown timeout "${key}" (allowed: ${Object.keys(DEFAULT_TIMEOUTS).join(", ")})`);
    } else if (!Number.isInteger(value) || value < 1 || value > MAX_TIMEOUT_MS) {
      errors.push(`timeouts.${key} must be an integer between 1 and ${MAX_TIMEOUT_MS}`);
    } else {
      timeouts[key] = value;
    }
  }
  return timeouts;
}

function validateBaseURL(value, errors) {
  if (value === undefined || value === null || value === "") {
    errors.push("baseURL is required (config \"baseURL\" or --base-url)");
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return value;
  } catch {
    // reported below
  }
  errors.push(`baseURL must be an http(s) URL (got ${JSON.stringify(value)})`);
  return null;
}

export function validateConfig(raw) {
  const errors = [];
  if (!isPlainObject(raw)) throw new ConfigError("config must be a JSON object");
  for (const key of Object.keys(raw)) {
    if (!TOP_LEVEL_KEYS.includes(key)) errors.push(`unknown config key "${key}"`);
  }
  const baseURL = validateBaseURL(raw.baseURL, errors);
  if (raw.fullPage !== undefined && typeof raw.fullPage !== "boolean") errors.push("fullPage must be a boolean");
  const fullPage = raw.fullPage !== false;
  if (raw.outDir !== undefined && !isNonEmptyString(raw.outDir)) errors.push("outDir must be a non-empty string");
  const timeouts = validateTimeouts(raw.timeouts, errors);
  let viewports = [];
  try {
    viewports = resolveViewports(raw.viewports);
  } catch (err) {
    errors.push(...(err.errors ?? [err.message]));
  }
  const routes = [];
  if (!Array.isArray(raw.routes) || raw.routes.length === 0) {
    errors.push("routes must be a non-empty array (config \"routes\" or --route)");
  } else {
    const seen = new Set();
    raw.routes.forEach((entry, i) => {
      const route = normalizeRoute(entry, i, fullPage, errors);
      if (!route) return;
      const key = captureFileName(route.name, "x", route.component);
      if (seen.has(key)) {
        const suffix = route.component ? ` with component "${route.component}"` : "";
        errors.push(`routes[${i}]: duplicate capture name "${route.name}"${suffix}; set a unique "name"`);
      }
      seen.add(key);
      routes.push(route);
    });
  }
  if (errors.length) throw new ConfigError(errors);
  return { baseURL, routes, viewports, outDir: raw.outDir ?? DEFAULT_OUT_DIR, fullPage, timeouts };
}

const VALUE_FLAGS = {
  "--config": "config",
  "--base-url": "baseURL",
  "--route": "routes",
  "--viewport": "viewports",
  "--out-dir": "outDir",
  "--selector": "selector",
  "--ready-selector": "readySelector",
  "--timeout": "timeout",
  "--playwright-from": "playwrightFrom",
};

export function parseArgs(argv) {
  const result = { config: null, help: false, playwrightFrom: null, overrides: {} };
  const { overrides } = result;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--help" || flag === "-h") {
      result.help = true;
      continue;
    }
    if (flag === "--full-page" || flag === "--no-full-page") {
      overrides.fullPage = flag === "--full-page";
      continue;
    }
    const key = VALUE_FLAGS[flag];
    if (!key) throw new ConfigError(`unknown flag ${flag}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) throw new ConfigError(`${flag} requires a value`);
    i++;
    if (key === "config" || key === "playwrightFrom") result[key] = value;
    else if (key === "routes") (overrides.routes ??= []).push(value);
    else if (key === "viewports") (overrides.viewports ??= []).push(parseViewportArg(value));
    else if (key === "timeout") {
      if (!/^\d+$/.test(value) || Number(value) < 1) throw new ConfigError("--timeout must be a positive integer (ms)");
      overrides.timeouts = { navigation: Number(value) };
    } else overrides[key] = value;
  }
  return result;
}

export function mergeConfig(fileConfig, overrides) {
  const { routes, selector, readySelector, timeouts, ...rest } = overrides;
  const merged = { ...fileConfig, ...rest };
  if (fileConfig.timeouts || timeouts) merged.timeouts = { ...fileConfig.timeouts, ...timeouts };
  const baseRoutes = routes ?? fileConfig.routes;
  const routeOverrides = {};
  if (selector) routeOverrides.selector = selector;
  if (readySelector) routeOverrides.readySelector = readySelector;
  if (Array.isArray(baseRoutes)) {
    const hasOverrides = Object.keys(routeOverrides).length > 0;
    merged.routes = hasOverrides
      ? baseRoutes.map((r) => ({ ...(typeof r === "string" ? { path: r } : r), ...routeOverrides }))
      : baseRoutes;
  }
  return merged;
}

export function shortError(err) {
  const text = String(err?.message ?? err)
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split("\n")[0]
    .trim();
  return text.length > 200 ? `${text.slice(0, 197)}...` : text;
}

export function formatSummary(runDirLabel, results) {
  const lines = [`Run dir: ${runDirLabel}`];
  let ok = 0;
  let failed = 0;
  let skipped = 0;
  let warnings = 0;
  for (const r of results) {
    const notes = [...r.warnings];
    if (r.consoleErrors) notes.push(`console errors: ${r.consoleErrors}`);
    warnings += r.warnings.length;
    const suffix = notes.length ? `  [${notes.join("; ")}]` : "";
    if (r.ok) {
      ok++;
      lines.push(`  OK    ${r.file}${suffix}`);
    } else if (r.optional) {
      skipped++;
      lines.push(`  SKIP  ${r.fileName}  (optional) ${r.reason}${suffix}`);
    } else {
      failed++;
      lines.push(`  FAIL  ${r.fileName}  ${r.reason}${suffix}`);
    }
  }
  lines.push(`Totals: ${ok} ok, ${failed} failed, ${skipped} skipped (optional), ${warnings} warnings`);
  return lines.join("\n");
}

// ---------------------------------------------------------------- browser side

export async function loadChromium(fromDir) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const bases = fromDir ? [path.resolve(fromDir)] : [process.cwd(), scriptDir];
  for (const base of bases) {
    const req = createRequire(path.join(base, "noop.js"));
    for (const pkg of ["playwright", "@playwright/test"]) {
      let resolved;
      try {
        resolved = req.resolve(pkg);
      } catch {
        continue;
      }
      const mod = await import(pathToFileURL(resolved).href);
      const chromium = mod.chromium ?? mod.default?.chromium;
      if (chromium) return chromium;
    }
  }
  throw new DependencyError(
    `Playwright is not installed (looked for "playwright" or "@playwright/test" from ${bases.join(", ")}).\n` +
      "  Fix: install it in the project (npm i -D @playwright/test), or pass --playwright-from <dir> " +
      "pointing at a checkout whose node_modules has it.",
  );
}

async function launchChromium(chromium) {
  try {
    return await chromium.launch({ headless: true, handleSIGINT: false, handleSIGTERM: false });
  } catch (err) {
    if (/Executable doesn't exist|browserType\.launch.*install/i.test(err.message)) {
      throw new DependencyError(
        "Chromium browser binary for Playwright is missing.\n  Fix: npx playwright install chromium",
      );
    }
    throw err;
  }
}

export function createRunDir(outDir) {
  mkdirSync(outDir, { recursive: true });
  for (let attempt = 0; attempt < 5; attempt++) {
    const dir = path.join(outDir, runDirName());
    try {
      mkdirSync(dir);
      return dir;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }
  }
  throw new Error(`could not create a unique run directory in ${outDir}`);
}

async function bestEffort(task, message, warnings) {
  try {
    const ok = await task;
    if (ok === false) warnings.push(message);
  } catch {
    warnings.push(message);
  }
}

function waitForFonts(page, ms) {
  return page.evaluate(
    (timeout) =>
      Promise.race([
        document.fonts.ready.then(() => true),
        new Promise((resolve) => setTimeout(() => resolve(false), timeout)),
      ]),
    ms,
  );
}

function waitForImages(page, ms, fullPage) {
  return page.evaluate(
    async ({ timeout, includeBelowFold, cap }) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const images = Array.from(document.images)
        .filter((img) => {
          const r = img.getBoundingClientRect();
          if (!r.width || !r.height || getComputedStyle(img).visibility === "hidden") return false;
          const inView = r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
          return inView || (includeBelowFold && img.loading !== "lazy");
        })
        .slice(0, cap);
      let settled = 0;
      let broken = 0;
      const settle = (img) =>
        new Promise((resolve) => {
          const finish = () => {
            if (!img.naturalWidth) broken++;
            img.decode().catch(() => {}).then(resolve);
          };
          if (img.complete) finish();
          else {
            img.addEventListener("load", finish, { once: true });
            img.addEventListener("error", finish, { once: true });
          }
        }).then(() => settled++);
      await Promise.race([
        Promise.all(images.map(settle)),
        new Promise((resolve) => setTimeout(resolve, timeout)),
      ]);
      return { pending: images.length - settled, broken };
    },
    { timeout: ms, includeBelowFold: fullPage, cap: MAX_IMAGES_CHECKED },
  );
}

function describeStep(step) {
  if (step.type === "fill") return `fill "${step.selector}"`;
  if (step.type === "press") return `press "${step.key}"`;
  if (step.type === "wait") return `wait ${step.ms}ms`;
  return `${step.type} "${step.selector}"`;
}

async function runStep(page, step, timeout) {
  if (step.type === "press") return page.keyboard.press(step.key);
  if (step.type === "wait") return page.waitForTimeout(step.ms);
  const target = page.locator(step.selector).first();
  if (step.type === "click") return target.click({ timeout });
  if (step.type === "hover") return target.hover({ timeout });
  if (step.type === "fill") return target.fill(step.value, { timeout });
  return target.waitFor({ state: "visible", timeout });
}

async function required(task, message) {
  try {
    return await task;
  } catch (err) {
    throw new Error(message ?? shortError(err));
  }
}

async function captureOne(context, cfg, route, viewport, runDir) {
  const t = cfg.timeouts;
  const fileName = captureFileName(route.name, viewport.name, route.component);
  const file = path.join(runDir, fileName);
  const result = { fileName, optional: route.optional, warnings: [], consoleErrors: 0 };
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") result.consoleErrors++;
  });
  page.on("pageerror", () => result.consoleErrors++);
  try {
    const url = new URL(route.path, cfg.baseURL).href;
    await required(page.goto(url, { waitUntil: "domcontentloaded", timeout: t.navigation }));
    await bestEffort(
      page.waitForLoadState("networkidle", { timeout: t.networkIdle }),
      `network idle not reached within ${t.networkIdle}ms`,
      result.warnings,
    );
    if (route.readySelector) {
      await required(
        page.locator(route.readySelector).first().waitFor({ state: "visible", timeout: t.ready }),
        `readySelector "${route.readySelector}" not visible within ${t.ready}ms`,
      );
    }
    for (const [i, step] of route.setup.entries()) {
      try {
        await runStep(page, step, t.step);
      } catch (err) {
        throw new Error(`setup[${i}] ${describeStep(step)} failed: ${shortError(err)}`);
      }
    }
    await bestEffort(waitForFonts(page, t.fonts), `fonts not ready within ${t.fonts}ms`, result.warnings);
    const fullPage = route.fullPage && !route.selector;
    try {
      const images = await waitForImages(page, t.images, fullPage);
      if (images.pending) result.warnings.push(`${images.pending} image(s) not loaded within ${t.images}ms`);
      if (images.broken) result.warnings.push(`${images.broken} broken image(s)`);
    } catch {
      result.warnings.push("image readiness check failed");
    }
    const shotOptions = { path: file, timeout: t.screenshot, animations: "disabled" };
    if (route.selector) {
      const target = page.locator(route.selector).first();
      await required(
        target.waitFor({ state: "visible", timeout: t.ready }),
        `selector "${route.selector}" not visible within ${t.ready}ms`,
      );
      await required(target.screenshot(shotOptions));
    } else {
      await required(page.screenshot({ ...shotOptions, fullPage }));
    }
    return { ...result, ok: true, file: path.relative(process.cwd(), file) || file };
  } catch (err) {
    return { ...result, ok: false, reason: shortError(err) };
  } finally {
    await page.close().catch(() => {});
  }
}

let activeBrowser = null;
let interrupted = false;

export async function captureAll(chromium, cfg) {
  const browser = await launchChromium(chromium);
  activeBrowser = browser;
  const results = [];
  let runDir;
  try {
    runDir = createRunDir(path.resolve(cfg.outDir));
    for (const viewport of cfg.viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      try {
        for (const route of cfg.routes) results.push(await captureOne(context, cfg, route, viewport, runDir));
      } finally {
        await context.close().catch(() => {});
      }
    }
  } finally {
    activeBrowser = null;
    await browser.close().catch(() => {});
  }
  return { runDir, results };
}

// ---------------------------------------------------------------- CLI

const USAGE = `usage: capture.mjs [--config file.json] [flags]
  --base-url <url>         required unless set in config (e.g. http://localhost:3010)
  --route <path>           repeatable; replaces config routes
  --viewport <v>           repeatable; desktop | mobile | WxH | name:WxH (default: desktop + mobile)
  --out-dir <dir>          run directories are created here (default: .screenshots)
  --selector <css>         element screenshot for every route
  --ready-selector <css>   required visible element before capture, for every route
  --full-page | --no-full-page
  --timeout <ms>           navigation timeout (other timeouts via config "timeouts")
  --playwright-from <dir>  resolve Playwright from another checkout's node_modules
exit codes: 0 ok, 1 a required capture failed, 2 bad config/flags, 3 missing dependency, 130 interrupted`;

function loadConfigFile(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (err) {
    throw new ConfigError(`cannot read config ${file}: ${err.code ?? err.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new ConfigError(`invalid JSON in ${file}: ${err.message}`);
  }
}

export async function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(USAGE);
    return EXIT.OK;
  }
  const fileConfig = args.config ? loadConfigFile(args.config) : {};
  if (!isPlainObject(fileConfig)) throw new ConfigError("config must be a JSON object");
  const cfg = validateConfig(mergeConfig(fileConfig, args.overrides));
  const chromium = await loadChromium(args.playwrightFrom);
  const { runDir, results } = await captureAll(chromium, cfg);
  if (interrupted) return EXIT.INTERRUPTED;
  console.log(formatSummary(path.relative(process.cwd(), runDir) || runDir, results));
  return results.some((r) => !r.ok && !r.optional) ? EXIT.CAPTURE_FAILED : EXIT.OK;
}

function onSignal(signal) {
  interrupted = true;
  console.error(`\nInterrupted (${signal}); closing browser...`);
  const browser = activeBrowser;
  activeBrowser = null;
  Promise.resolve(browser?.close())
    .catch(() => {})
    .finally(() => process.exit(EXIT.INTERRUPTED));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err) => {
      if (err instanceof ConfigError) {
        console.error(`Config error:\n${err.errors.map((e) => `  - ${e}`).join("\n")}\n\n${USAGE}`);
        process.exitCode = EXIT.CONFIG;
      } else if (err instanceof DependencyError) {
        console.error(`Missing dependency: ${err.message}`);
        process.exitCode = EXIT.MISSING_DEPENDENCY;
      } else {
        console.error(`capture failed: ${shortError(err)}`);
        process.exitCode = EXIT.CAPTURE_FAILED;
      }
    });
}
