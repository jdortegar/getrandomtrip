#!/usr/bin/env node
// Worktree helper for this repo. Pure helpers are exported for tests; the CLI
// at the bottom only wires them to git, lsof, npm, and next.
// Usage: node .agents/skills/worktree/scripts/worktree.mjs <command> [args]
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { closeSync, existsSync, lstatSync, openSync, readFileSync, writeSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_PORT = 3010;
export const DEFAULT_FROM = "origin/develop";
export const MERGE_TARGET = "origin/main";
/** Reflog activity newer than this (seconds) on a foreign branch means busy. */
export const RECENT_REFLOG_SECONDS = 4 * 3600;
export const ENV_FILES = [".env", ".env.local"];
const PLACEHOLDER_DATABASE_URL =
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

// ---------------------------------------------------------------- pure helpers

export function slugForBranch(branch) {
  if (!branch || !branch.trim()) throw new Error("branch name is required");
  return branch.trim().replace(/\//g, "-");
}

export function worktreePathFor(repoRoot, branch) {
  const parent = path.dirname(repoRoot);
  const name = `${path.basename(repoRoot)}-worktrees`;
  return path.join(parent, name, slugForBranch(branch));
}

export function parseWorktreePorcelain(text) {
  const list = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split("\n").filter(Boolean);
    if (!lines.length || !lines[0].startsWith("worktree ")) continue;
    const entry = {
      path: lines[0].slice("worktree ".length),
      head: null,
      branch: null,
      detached: false,
      bare: false,
      locked: false,
      prunable: false,
      isMain: list.length === 0,
    };
    for (const line of lines.slice(1)) {
      const [key, ...rest] = line.split(" ");
      const value = rest.join(" ");
      if (key === "HEAD") entry.head = value;
      else if (key === "branch") entry.branch = value.replace(/^refs\/heads\//, "");
      else if (key === "detached") entry.detached = true;
      else if (key === "bare") entry.bare = true;
      else if (key === "locked") entry.locked = true;
      else if (key === "prunable") entry.prunable = true;
    }
    list.push(entry);
  }
  return list;
}

/** Parses `git status --porcelain=v1 -z`; renames keep the new path. */
export function parseStatusZ(text) {
  const parts = text.split("\0");
  const entries = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.length < 4) continue;
    const xy = part.slice(0, 2);
    entries.push({ xy, path: part.slice(3) });
    if (xy[0] === "R" || xy[0] === "C") i++; // skip the original path
  }
  return entries;
}

/**
 * A tracked entry is not a real change when its worktree content equals the
 * HEAD blob, hashed either with filters (LFS file -> pointer) or raw (binary
 * committed before .gitattributes moved it to LFS).
 */
export function isLfsPhantom({ xy, headBlob, worktreeHash, rawHash = null }) {
  if (xy === "??" || !headBlob) return false;
  return headBlob === worktreeHash || headBlob === rawHash;
}

export function realChanges(entries, headBlobs, worktreeHashes, rawHashes = new Map()) {
  return entries.filter(
    (e) =>
      !isLfsPhantom({
        xy: e.xy,
        headBlob: headBlobs.get(e.path) ?? null,
        worktreeHash: worktreeHashes.get(e.path) ?? null,
        rawHash: rawHashes.get(e.path) ?? null,
      }),
  );
}

/** Parses `git reflog --date=unix --format=%gd` into unix seconds. */
export function parseReflogTimes(text) {
  const times = [];
  for (const line of text.split("\n")) {
    const m = line.match(/@\{(\d+)\}/);
    if (m) times.push(Number(m[1]));
  }
  return times;
}

/**
 * Mechanical busy rules: (1) changes the task did not make, (2) HEAD on a
 * branch the task does not own with recent reflog activity, (3) user report.
 */
export function isCheckoutBusy({
  changedPaths,
  taskPaths = [],
  head,
  ownBranch,
  reflogTimes,
  now,
  userSaysBusy = false,
  recentSeconds = RECENT_REFLOG_SECONDS,
}) {
  const reasons = [];
  const own = new Set(taskPaths);
  const foreign = changedPaths.filter((p) => !own.has(p));
  if (foreign.length) {
    const sample = foreign.slice(0, 5).join(", ");
    const more = foreign.length > 5 ? ` (+${foreign.length - 5} more)` : "";
    reasons.push(`uncommitted changes the task did not make: ${sample}${more}`);
  }
  if (head !== ownBranch && reflogTimes.some((t) => now - t <= recentSeconds)) {
    reasons.push(
      `HEAD is on ${head ?? "a detached HEAD"} (not ${ownBranch}) with recent reflog activity`,
    );
  }
  if (userSaysBusy) reasons.push("user reports another agent/session there");
  return { busy: reasons.length > 0, reasons };
}

export async function pickFreePort(start, isFree, attempts = 20) {
  for (let port = start; port < start + attempts; port++) {
    if (await isFree(port)) return port;
  }
  throw new Error(`no free port in ${start}-${start + attempts - 1}`);
}

/** Parses `lsof -nP -iTCP -sTCP:LISTEN -Fpn`. */
export function parseLsofListen(text) {
  const servers = [];
  let current = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("p")) {
      current = { pid: Number(line.slice(1)), ports: [] };
      servers.push(current);
    } else if (line.startsWith("n") && current) {
      const port = Number(line.slice(line.lastIndexOf(":") + 1));
      if (Number.isInteger(port) && !current.ports.includes(port)) {
        current.ports.push(port);
      }
    }
  }
  return servers;
}

/** Parses `lsof -a -p <pid> -d cwd -Fn`. */
export function parseLsofCwd(text) {
  const line = text.split("\n").find((l) => l.startsWith("n"));
  return line ? line.slice(1) : null;
}

export function devServersFor(worktreePath, servers) {
  const root = path.resolve(worktreePath);
  return servers.filter(
    (s) => s.cwd && (s.cwd === root || s.cwd.startsWith(root + path.sep)),
  );
}

export function classifyWorktree({
  isMain,
  merged,
  realChanges: changes,
  prunable,
  devServer,
  locked = false,
  recentlyActive = false,
}) {
  if (isMain) return { action: "keep", reason: "main checkout" };
  if (prunable) return { action: "clean", reason: "stale record (prune)" };
  if (locked) return { action: "keep", reason: "locked" };
  if (devServer) return { action: "keep", reason: "dev server running" };
  if (changes > 0) {
    return {
      action: "needs-decision",
      reason: `${changes} real change(s): back up to a branch or discard`,
    };
  }
  if (recentlyActive) return { action: "keep", reason: "recent reflog activity" };
  if (merged) return { action: "clean", reason: `merged into ${MERGE_TARGET}` };
  return { action: "keep", reason: `not merged into ${MERGE_TARGET}` };
}

/**
 * Whether to seed one env file from the main checkout into a worktree.
 * `source` is "missing" | "file" | "symlink" | "other". Never overwrites, and
 * only moves files Git ignores on both sides so a secret can't get committed.
 */
export function envCopyDecision({ isMain, source, targetExists, sourceIgnored, targetIgnored }) {
  if (isMain) return { action: "refuse", reason: "target is the main checkout" };
  if (source === "missing" || targetExists) return { action: "skip" };
  if (source !== "file") {
    return { action: "refuse", reason: "source must be a regular file, not a symlink" };
  }
  if (!sourceIgnored || !targetIgnored) {
    return { action: "refuse", reason: "file must be Git-ignored in both checkouts" };
  }
  return { action: "copy" };
}

export function removeRefusal({ found, isMain, realChanges: changes, merged }) {
  if (!found) return "no worktree for that branch";
  if (isMain) return "refusing to remove the main checkout";
  if (changes > 0) {
    return `worktree has ${changes} real change(s); back them up to a branch or discard them first`;
  }
  if (!merged) return `branch is not merged into ${MERGE_TARGET}`;
  return null;
}

// ---------------------------------------------------------------- git / os io

function git(args, opts = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
}

function tryGit(args, opts) {
  try {
    return git(args, opts);
  } catch {
    return null;
  }
}

export function mainRepoRoot(cwd = process.cwd()) {
  const common = git(
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { cwd },
  ).trim();
  return path.dirname(common);
}

function listWorktrees(root) {
  return parseWorktreePorcelain(git(["worktree", "list", "--porcelain"], { cwd: root }));
}

/** Real (non-phantom) status entries of a worktree. */
function realStatus(dir) {
  const entries = parseStatusZ(
    git(["status", "--porcelain=v1", "-z", "--untracked-files=normal"], { cwd: dir }),
  );
  const tracked = entries.filter((e) => e.xy !== "??").map((e) => e.path);
  const headBlobs = new Map();
  const hashes = new Map();
  const rawHashes = new Map();
  if (tracked.length) {
    const tree = tryGit(["ls-tree", "-z", "HEAD", "--", ...tracked], { cwd: dir }) ?? "";
    for (const rec of tree.split("\0").filter(Boolean)) {
      const [meta, file] = rec.split("\t");
      headBlobs.set(file, meta.split(" ")[2]);
    }
    const present = tracked.filter((p) => existsSync(path.join(dir, p)));
    if (present.length) {
      const hashAll = (extra, into) => {
        const out = tryGit(["hash-object", ...extra, "--stdin-paths"], {
          cwd: dir,
          input: present.join("\n") + "\n",
          stdio: ["pipe", "pipe", "pipe"],
        });
        const lines = out ? out.trim().split("\n") : [];
        present.forEach((p, i) => lines[i] && into.set(p, lines[i]));
      };
      hashAll([], hashes);
      hashAll(["--no-filters"], rawHashes);
    }
  }
  return realChanges(entries, headBlobs, hashes, rawHashes);
}

function recentlyActive(dir, now = Math.floor(Date.now() / 1000)) {
  const out = tryGit(["reflog", "--date=unix", "--format=%gd", "-n", "1", "HEAD"], { cwd: dir });
  return parseReflogTimes(out ?? "").some((t) => now - t <= RECENT_REFLOG_SECONDS);
}

function isMerged(root, ref) {
  if (!ref) return false;
  const res = spawnSync("git", ["merge-base", "--is-ancestor", ref, MERGE_TARGET], {
    cwd: root,
  });
  return res.status === 0;
}

/** Listening TCP servers with their cwd; [] when lsof is unavailable. */
function listeningServers() {
  const res = spawnSync("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN", "-Fpn"], {
    encoding: "utf8",
  });
  if (res.error || !res.stdout) return [];
  return parseLsofListen(res.stdout).map((s) => {
    const cwd = spawnSync("lsof", ["-a", "-p", String(s.pid), "-d", "cwd", "-Fn"], {
      encoding: "utf8",
    });
    return { ...s, cwd: cwd.stdout ? parseLsofCwd(cwd.stdout) : null };
  });
}

function lsofAvailable() {
  return !spawnSync("lsof", ["-v"], { stdio: "ignore" }).error;
}

function portIsFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port);
  });
}

function inspect(root, wt, servers) {
  const exists = existsSync(wt.path);
  const changes = exists && !wt.prunable ? realStatus(wt.path) : [];
  const dev = devServersFor(wt.path, servers);
  const merged = !wt.isMain && isMerged(root, wt.branch ?? wt.head);
  const verdict = classifyWorktree({
    isMain: wt.isMain,
    merged,
    realChanges: changes.length,
    prunable: wt.prunable || !exists,
    devServer: dev.length > 0,
    locked: wt.locked,
    recentlyActive: exists && !wt.isMain && recentlyActive(wt.path),
  });
  return { ...wt, merged, changes, dev, verdict };
}

function describe(info) {
  const dev = info.dev.length
    ? info.dev.map((s) => `pid ${s.pid} :${s.ports.join(",")}`).join("; ")
    : "no";
  return [
    `${info.path}${info.isMain ? "  (main checkout)" : ""}`,
    `  branch: ${info.branch ?? `(detached ${info.head?.slice(0, 8) ?? "?"})`}`,
    `  merged into ${MERGE_TARGET}: ${info.isMain ? "n/a" : info.merged ? "yes" : "no"}`,
    `  real changes: ${info.changes.length}${info.changes.length ? ` (${info.changes.slice(0, 5).map((c) => c.path).join(", ")})` : ""}`,
    `  server listening from it: ${dev}`,
    `  prunable: ${info.prunable ? "yes" : "no"}`,
    `  -> ${info.verdict.action}: ${info.verdict.reason}`,
  ].join("\n");
}

function findByBranch(list, branch) {
  return list.find((w) => w.branch === branch);
}

// ---------------------------------------------------------------- commands

function cmdList(root) {
  if (!lsofAvailable()) console.log("note: lsof not found; dev servers not detected");
  const servers = listeningServers();
  const infos = listWorktrees(root).map((w) => inspect(root, w, servers));
  console.log(`merged status uses the local ${MERGE_TARGET} ref (git fetch to refresh)\n`);
  console.log(infos.map(describe).join("\n\n"));
  return infos;
}

function cmdClean(root, apply) {
  const infos = cmdList(root);
  const toClean = infos.filter((i) => i.verdict.action === "clean");
  const decide = infos.filter((i) => i.verdict.action === "needs-decision");
  console.log("");
  if (!toClean.length) console.log("nothing to clean");
  for (const i of toClean) {
    console.log(`${apply ? "removing" : "would remove"}: ${i.path} (${i.verdict.reason})`);
  }
  for (const i of decide) {
    console.log(`needs your decision (never auto-removed): ${i.path} — ${i.verdict.reason}`);
  }
  if (!apply) {
    console.log("\ndry run; rerun with --apply to clean");
    return;
  }
  for (const i of toClean) {
    if (!i.prunable && existsSync(i.path)) {
      git(["worktree", "remove", "--force", i.path], { cwd: root });
    }
  }
  git(["worktree", "prune"], { cwd: root });
  console.log("done (local branches kept; remote branches never deleted)");
}

function cmdRemove(root, branch) {
  const wt = findByBranch(listWorktrees(root), branch);
  const info = wt ? inspect(root, wt, listeningServers()) : null;
  const refusal = removeRefusal({
    found: Boolean(info),
    isMain: info?.isMain ?? false,
    realChanges: info?.changes.length ?? 0,
    merged: info?.merged ?? false,
  });
  if (refusal) throw new Error(`remove refused: ${refusal}`);
  for (const s of info.dev) {
    console.log(`stopping dev server pid ${s.pid}`);
    try {
      process.kill(s.pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  git(["worktree", "remove", "--force", info.path], { cwd: root });
  git(["branch", "-D", branch], { cwd: root });
  console.log(`removed ${info.path} and local branch ${branch}`);
  console.log("remote branch untouched; delete it only after user confirmation");
}

function busyCheck(root, branch, userSaysBusy) {
  const head = tryGit(["symbolic-ref", "--quiet", "--short", "HEAD"], { cwd: root })?.trim() || null;
  const reflog = tryGit(["reflog", "--date=unix", "--format=%gd", "-n", "20", "HEAD"], { cwd: root }) ?? "";
  return isCheckoutBusy({
    changedPaths: realStatus(root).map((e) => e.path),
    head,
    ownBranch: branch,
    reflogTimes: parseReflogTimes(reflog),
    now: Math.floor(Date.now() / 1000),
    userSaysBusy,
  });
}

function sourceKind(file) {
  try {
    const stat = lstatSync(file);
    if (stat.isSymbolicLink()) return "symlink";
    return stat.isFile() ? "file" : "other";
  } catch {
    return "missing";
  }
}

function gitIgnores(dir, file) {
  return spawnSync("git", ["check-ignore", "--quiet", "--", file], { cwd: dir }).status === 0;
}

/** Seed env files from the main checkout; contents are never printed. */
function copyEnvFiles(root, target) {
  for (const f of ENV_FILES) {
    const source = path.join(root, f);
    const dest = path.join(target, f);
    const decision = envCopyDecision({
      isMain: path.resolve(root) === path.resolve(target),
      source: sourceKind(source),
      targetExists: sourceKind(dest) !== "missing",
      sourceIgnored: gitIgnores(root, f),
      targetIgnored: gitIgnores(target, f),
    });
    if (decision.action === "refuse") {
      console.log(`env: not copying ${f}: ${decision.reason}`);
      continue;
    }
    if (decision.action === "skip") continue;
    let fd;
    try {
      // `wx` fails if the file appeared meanwhile, so an existing one is never replaced.
      fd = openSync(dest, "wx", 0o600);
      writeSync(fd, readFileSync(source));
      console.log(`env: copied ${f} from the main checkout`);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
  }
}

function cmdCreate(root, branch, from, userSaysBusy) {
  const list = listWorktrees(root);
  const existing = findByBranch(list, branch);
  if (existing?.isMain) {
    throw new Error(`${branch} is checked out in the main checkout; work there`);
  }
  const busy = busyCheck(root, branch, userSaysBusy);
  if (!busy.busy && !existing) {
    throw new Error(
      "main checkout is not busy; work there instead. If the user says another " +
        "agent/session works there, rerun with --user-says-busy",
    );
  }
  for (const r of busy.reasons) console.log(`busy: ${r}`);

  let target = existing?.path;
  if (existing) {
    console.log(`reusing worktree ${target}`);
  } else {
    target = worktreePathFor(root, branch);
    if (existsSync(target)) throw new Error(`${target} exists but is not a worktree of ${branch}`);
    const hasLocal = tryGit(["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`], { cwd: root });
    if (hasLocal) {
      git(["worktree", "add", target, branch], { cwd: root, stdio: "inherit" });
    } else {
      const m = from.match(/^([^/]+)\/(.+)$/);
      if (m && tryGit(["remote", "get-url", m[1]], { cwd: root })) {
        git(["fetch", m[1], m[2]], { cwd: root, stdio: "inherit" });
      }
      git(["worktree", "add", "--no-track", "-b", branch, target, from], { cwd: root, stdio: "inherit" });
    }
  }
  tryGit(["branch", "--unset-upstream", branch], { cwd: target });
  console.log(`upstream unset; push with: git push -u origin ${branch}:${branch}`);

  if (!existsSync(path.join(target, "node_modules"))) {
    const env = { ...process.env };
    if (!env.DATABASE_URL) env.DATABASE_URL = PLACEHOLDER_DATABASE_URL;
    const res = spawnSync("npm", ["ci"], { cwd: target, env, stdio: "inherit" });
    if (res.status !== 0) throw new Error("npm ci failed");
  }
  copyEnvFiles(root, target);
  console.log(`\nworktree ready: ${target}`);
}

async function cmdDev(root, branch) {
  const wt = findByBranch(listWorktrees(root), branch);
  if (!wt) throw new Error(`no worktree for ${branch}; run create first`);
  const next = path.join(wt.path, "node_modules", ".bin", "next");
  if (!existsSync(next)) throw new Error(`${next} missing; run npm ci in ${wt.path}`);
  if (!existsSync(path.join(wt.path, ".env"))) {
    console.log(`warning: ${wt.path}/.env missing; ask the user to copy it`);
  }
  const port = await pickFreePort(DEFAULT_PORT, portIsFree);
  const url = `http://localhost:${port}`;
  console.log(`dev server: ${url} (NEXTAUTH_URL=${url}, .env untouched)`);
  if (port !== DEFAULT_PORT) {
    console.log(
      `warning: port ${DEFAULT_PORT} busy; Google login works only if ${url}/api/auth/callback/google is a registered redirect URI`,
    );
  }
  const child = spawn(next, ["dev", "-p", String(port)], {
    cwd: wt.path,
    env: { ...process.env, NEXTAUTH_URL: url },
    stdio: "inherit",
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

const USAGE = `usage: worktree.mjs <command>
  create <branch> [--from <ref>] [--user-says-busy]
  dev <branch>
  list
  clean [--apply]
  remove <branch>`;

export async function main(argv) {
  const [cmd, ...rest] = argv;
  const flags = new Set(rest.filter((a) => a.startsWith("--")));
  const positional = rest.filter((a, i) => !a.startsWith("--") && rest[i - 1] !== "--from");
  const fromIdx = rest.indexOf("--from");
  const from = fromIdx >= 0 ? rest[fromIdx + 1] : DEFAULT_FROM;
  const root = mainRepoRoot();
  switch (cmd) {
    case "create":
      if (!positional[0] || !from) throw new Error(USAGE);
      return cmdCreate(root, positional[0], from, flags.has("--user-says-busy"));
    case "dev":
      if (!positional[0]) throw new Error(USAGE);
      return cmdDev(root, positional[0]);
    case "list":
      cmdList(root);
      return;
    case "clean":
      return cmdClean(root, flags.has("--apply"));
    case "remove":
      if (!positional[0]) throw new Error(USAGE);
      return cmdRemove(root, positional[0]);
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
