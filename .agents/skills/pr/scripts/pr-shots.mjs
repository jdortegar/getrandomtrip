#!/usr/bin/env node
// PR screenshot helper. Pure helpers are exported for tests; the CLI at the
// bottom only wires them to Playwright, git, and the filesystem.
// Usage: node .agents/skills/pr/scripts/pr-shots.mjs <command> [args]
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Prefix of the per-PR orphan branches holding screenshots; never merged. */
export const ASSETS_PREFIX = "pr-assets/";
export const MANIFEST = "manifest.json";
/** Same sizes as the `desktop` / `mobile` projects in playwright.config.ts. */
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 360, height: 740 },
};
/** Mirrors CONSENT_KEY in src/lib/helpers/tracking/consent.ts. */
const CONSENT_KEY = "rt-analytics-consent-v1";
/** Hides the Next.js dev-mode indicator so it never lands in a screenshot. */
const HIDE_DEV_OVERLAY_CSS = "nextjs-portal { display: none !important; }";
const STEP_KINDS =["click", "fill", "waitFor", "press"];
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

// ---------------------------------------------------------------- pure helpers

export function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const flags = {};
  const positional = [];
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) {
      flags[arg.slice(2)] = true;
    } else {
      flags[arg.slice(2)] = next;
      i += 1;
    }
  }
  return { cmd, flags, positional };
}

function normalizeRole(login) {
  if (login === null) return null;
  if (!login?.role) return null;
  return String(login.role).toUpperCase();
}

function validateStep(step, name) {
  const kinds = Object.keys(step ?? {});
  if (kinds.length !== 1 || !STEP_KINDS.includes(kinds[0])) {
    throw new Error(
      `shot "${name}": each step needs exactly one of ${STEP_KINDS.join(", ")}`,
    );
  }
  if (kinds[0] === "fill" && !(Array.isArray(step.fill) && step.fill.length === 2)) {
    throw new Error(`shot "${name}": fill step must be [selector, value]`);
  }
  return step;
}

/** Validate a capture spec and return one normalized entry per shot. */
export function validateSpec(spec) {
  const shots = spec?.shots;
  if (!Array.isArray(shots) || shots.length === 0) {
    throw new Error("spec needs at least one shot");
  }
  const seen = new Set();
  return shots.map((shot) => {
    const { name, description, path: route } = shot ?? {};
    if (!name || !NAME_PATTERN.test(name)) {
      throw new Error(`invalid shot name "${name}" (use lowercase a-z, 0-9, -)`);
    }
    if (seen.has(name)) throw new Error(`duplicate shot name "${name}"`);
    seen.add(name);
    if (!description || !String(description).trim()) {
      throw new Error(`shot "${name}" needs a description`);
    }
    if (typeof route !== "string" || !route.startsWith("/")) {
      throw new Error(`shot "${name}": path must be relative and start with /`);
    }
    const viewportKey = shot.viewport ?? "desktop";
    if (!VIEWPORTS[viewportKey]) {
      throw new Error(`shot "${name}": viewport must be desktop or mobile`);
    }
    return {
      name,
      description: String(description).trim(),
      path: route,
      viewport: VIEWPORTS[viewportKey],
      role: normalizeRole("login" in shot ? shot.login : spec.login),
      steps: (shot.steps ?? []).map((step) => validateStep(step, name)),
      element: shot.element ?? null,
      mask: shot.mask ?? [],
      fullPage: Boolean(shot.fullPage),
    };
  });
}

export function credentialsEnvFor(role) {
  const key = String(role).toUpperCase();
  return {
    email: `PR_SHOTS_${key}_EMAIL`,
    password: `PR_SHOTS_${key}_PASSWORD`,
  };
}

/**
 * Screenshots land in a public repo, so only capture from local servers or
 * Netlify deploy previews — never production, which holds real customer data.
 */
export function isAllowedBaseUrl(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  if (host === "localhost" || host === "127.0.0.1") return true;
  return /^deploy-preview-\d+--getrandomtrip\.netlify\.app$/.test(host);
}

export function parseRemote(url) {
  // Accepts SSH host aliases such as `git@github.com-<account>:owner/repo.git`.
  const match = /github\.com[^:/]*[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url.trim());
  if (!match) throw new Error(`origin is not a GitHub remote: ${url}`);
  return `${match[1]}/${match[2]}`;
}

/** One orphan branch per PR, named after its head branch. */
export function assetsBranchFor(branch) {
  if (!branch || branch === "HEAD" || branch.startsWith(ASSETS_PREFIX)) {
    throw new Error(`invalid PR head branch "${branch}" (pass --branch)`);
  }
  return `${ASSETS_PREFIX}${branch}`;
}

export function assetPath(name) {
  return `${name}.png`;
}

export function rawUrl(nameWithOwner, commit, file) {
  return `https://raw.githubusercontent.com/${nameWithOwner}/${commit}/${file}`;
}

/** Description line directly above each image, per the description contract. */
export function markdownFor(images) {
  return images
    .map(({ description, url }) => `${description}\n\n![${description}](${url})`)
    .join("\n\n");
}

// ------------------------------------------------------------------ side effects

function git(args, opts = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  }).trim();
}

function tryGit(args, opts) {
  try {
    return git(args, opts);
  } catch {
    return null;
  }
}

async function login(context, baseUrl, role) {
  const vars = credentialsEnvFor(role);
  const email = process.env[vars.email];
  const password = process.env[vars.password];
  if (!email || !password) {
    throw new Error(`set ${vars.email} and ${vars.password} for a ${role} test account`);
  }
  const csrf = await context.request.get(`${baseUrl}/api/auth/csrf`);
  const { csrfToken } = await csrf.json();
  await context.request.post(`${baseUrl}/api/auth/callback/credentials`, {
    form: { csrfToken, email, password, callbackUrl: baseUrl, json: "true" },
  });
  const session = await (await context.request.get(`${baseUrl}/api/auth/session`)).json();
  if (!session?.user) throw new Error(`login failed for the ${role} test account`);
}

async function runStep(page, step) {
  if (step.click) await page.locator(step.click).first().click();
  else if (step.fill) await page.locator(step.fill[0]).first().fill(step.fill[1]);
  else if (step.waitFor) await page.locator(step.waitFor).first().waitFor();
  else if (step.press) await page.keyboard.press(step.press);
}

async function cmdCapture({ spec: specFile, out, "base-url": baseUrlFlag }) {
  if (!specFile || !out) throw new Error(USAGE);
  const spec = JSON.parse(readFileSync(specFile, "utf8"));
  const baseUrl = String(baseUrlFlag ?? spec.baseUrl ?? "http://localhost:3010").replace(/\/$/, "");
  if (!isAllowedBaseUrl(baseUrl)) {
    throw new Error(`refusing ${baseUrl}: use localhost or a Netlify deploy preview`);
  }
  const shots = validateSpec(spec);
  const outDir = path.resolve(out);
  const repoRoot = git(["rev-parse", "--show-toplevel"]);
  if (!path.relative(repoRoot, outDir).startsWith("..")) {
    throw new Error("--out must be outside the repository");
  }
  mkdirSync(outDir, { recursive: true });

  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const manifest = [];
  try {
    for (const shot of shots) {
      const context = await browser.newContext({ viewport: shot.viewport });
      try {
        // Decline analytics up front: hides the consent banner and keeps
        // capture runs out of tracking.
        await context.addInitScript((key) => {
          window.localStorage.setItem(key, "denied");
        }, CONSENT_KEY);
        if (shot.role) await login(context, baseUrl, shot.role);
        const page = await context.newPage();
        await page.goto(`${baseUrl}${shot.path}`, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: HIDE_DEV_OVERLAY_CSS });
        for (const step of shot.steps) await runStep(page, step);
        const file = path.join(outDir, `${shot.name}.png`);
        const options = {
          path: file,
          animations: "disabled",
          mask: shot.mask.map((selector) => page.locator(selector)),
        };
        if (shot.element) await page.locator(shot.element).first().screenshot(options);
        else await page.screenshot({ ...options, fullPage: shot.fullPage });
        manifest.push({ name: shot.name, description: shot.description, file });
        console.log(`captured ${file}`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  writeFileSync(path.join(outDir, MANIFEST), JSON.stringify(manifest, null, 2));
  console.log(`\nreview every image before publishing: ${outDir}`);
}

/**
 * Commit the PNGs onto the PR's orphan assets branch with git plumbing
 * (temporary index, no checkout), so a busy working tree is never touched.
 * Republishing adds a commit on top, replacing images with the same name.
 */
function cmdPublish({ branch: branchFlag, dir, "dry-run": dryRun }) {
  if (!dir) throw new Error(USAGE);
  const branch =
    typeof branchFlag === "string" ? branchFlag : git(["rev-parse", "--abbrev-ref", "HEAD"]);
  const assetsBranch = assetsBranchFor(branch);
  const manifest = JSON.parse(readFileSync(path.join(dir, MANIFEST), "utf8"));
  const nameWithOwner = parseRemote(git(["remote", "get-url", "origin"]));
  const remoteRef = `refs/remotes/origin/${assetsBranch}`;
  tryGit(["fetch", "--quiet", "origin", `+refs/heads/${assetsBranch}:${remoteRef}`]);
  const parent = tryGit(["rev-parse", "--verify", "--quiet", remoteRef]);

  const tmp = mkdtempSync(path.join(os.tmpdir(), "pr-shots-"));
  const env = { ...process.env, GIT_INDEX_FILE: path.join(tmp, "index") };
  let commit;
  try {
    if (parent) git(["read-tree", parent], { env });
    else git(["read-tree", "--empty"], { env });
    for (const entry of manifest) {
      const blob = git(["hash-object", "-w", entry.file]);
      git(["update-index", "--add", "--cacheinfo", `100644,${blob},${assetPath(entry.name)}`], { env });
    }
    const tree = git(["write-tree"], { env });
    commit = git(
      ["commit-tree", tree, ...(parent ? ["-p", parent] : []), "-m", `docs: PR screenshots for ${branch}`],
      { env },
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  if (dryRun) console.log(`dry run: built ${commit} for ${assetsBranch}, not pushed`);
  else git(["push", "--quiet", "origin", `${commit}:refs/heads/${assetsBranch}`]);

  console.log(
    `\n${markdownFor(
      manifest.map((entry) => ({
        description: entry.description,
        url: rawUrl(nameWithOwner, commit, assetPath(entry.name)),
      })),
    )}`,
  );
}

// ------------------------------------------------------------------------- CLI

const USAGE = `usage: pr-shots.mjs <command>
  capture --spec <spec.json> --out <dir outside repo> [--base-url <url>]
  publish --dir <capture out dir> [--branch <PR head branch>] [--dry-run]`;

export async function main(argv) {
  const { cmd, flags } = parseArgs(argv);
  switch (cmd) {
    case "capture":
      return cmdCapture(flags);
    case "publish":
      return cmdPublish(flags);
    default:
      throw new Error(USAGE);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
