"use strict";

const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const cp = require("node:child_process");
const DEV_HOST = "ep-weathered-glitter-a4ydytjg-pooler.us-east-1.aws.neon.tech";
const ORIGIN = "http://localhost:3010";
const HOSTED = [
  "NETLIFY",
  "CONTEXT",
  "DEPLOY_PRIME_URL",
  "DEPLOY_URL",
  "VERCEL",
];

function safeEnvironment(env) {
  if (
    env.NODE_ENV !== "development" ||
    env.RT_DEPLOY_ENV !== "nonproduction" ||
    !env.RT_NONPRODUCTION_AUTH_SECRET?.trim() ||
    HOSTED.some((key) => env[key])
  )
    return false;
  try {
    const url = new URL(env.DATABASE_URL);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      url.hostname === DEV_HOST &&
      env.RT_NONPRODUCTION_DATABASE_HOST === DEV_HOST &&
      ![...url.searchParams.keys()].some((key) =>
        /^(host|hostaddr|port|socket|connectionstring)$/.test(
          key.toLowerCase(),
        ),
      )
    );
  } catch {
    return false;
  }
}

// Darwin can permit loopback binds beside an existing wildcard listener.
function noExistingListener(
  platform = process.platform,
  spawnSync = cp.spawnSync,
) {
  if (platform !== "darwin") return true;
  try {
    const result = spawnSync(
      "/usr/sbin/lsof",
      ["-nP", "-iTCP:3010", "-sTCP:LISTEN", "-Fp", "+w"],
      {
        encoding: "utf8",
        timeout: 2000,
        maxBuffer: 65536,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    return (
      !result.error &&
      result.signal == null &&
      result.status === 1 &&
      result.stdout === "" &&
      result.stderr === ""
    );
  } catch {
    return false;
  }
}

// Inspect listeners and reserve both families; never connect to the app or DB.
async function portAvailable(
  createServer = net.createServer,
  listenerCheck = noExistingListener,
) {
  if (!listenerCheck()) return false;
  const servers = [];
  try {
    for (const host of ["127.0.0.1", "::1"]) {
      await new Promise((resolve, reject) => {
        const server = createServer();
        servers.push(server);
        server.once("error", reject);
        server.listen({ host, port: 3010, exclusive: true }, resolve);
      });
    }
    return true;
  } catch {
    return false;
  } finally {
    await Promise.all(
      servers.map((server) => new Promise((resolve) => server.close(resolve))),
    );
  }
}

function launch(command, args, options, spawn = cp.spawn, delay = 500) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, options);
    } catch {
      resolve(false);
      return;
    }
    let spawned = false;
    const timer = setTimeout(() => resolve(spawned), delay);
    const failed = () => {
      clearTimeout(timer);
      resolve(false);
    };
    child.once("error", failed); // Keep a handler even after the bounded observation.
    child.once("exit", failed);
    child.once("spawn", () => {
      spawned = true;
      child.unref();
    });
  });
}

function runtime() {
  const env = { ...process.env };
  const gitEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => !key.startsWith("GIT_")),
  );
  return {
    env,
    nodeVersion: process.versions.node,
    executable: process.execPath,
    root: path.resolve(__dirname, "../.."),
    realpath: fs.realpathSync,
    exists: fs.existsSync,
    requireModule: require,
    portAvailable,
    launch,
    git: (cwd, ...args) =>
      cp
        .execFileSync("git", ["-C", cwd, ...args], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          timeout: 2000,
          env: { ...gitEnv, GIT_OPTIONAL_LOCKS: "0" },
        })
        .trim(),
  };
}

async function run(raw, d = runtime()) {
  const skip = (reason) => `Randomtrip dev: skipped (${reason}).`;
  if (d.env.RT_CODEX_DEV_AUTOSTART !== "1") return skip("opt-in required");
  try {
    const input = JSON.parse(raw);
    if (
      input?.hook_event_name !== "SessionStart" ||
      !["startup", "resume"].includes(input.source) ||
      typeof input.cwd !== "string" ||
      !path.isAbsolute(input.cwd)
    )
      return skip("invalid event");
    const [major, minor] = d.nodeVersion.split(".").map(Number);
    if (!(major > 20 || (major === 20 && minor >= 9)))
      return skip("Node 20.9+ required");
    if (d.env.NODE_ENV && d.env.NODE_ENV !== "development")
      return skip("unsafe environment");
    const root = d.realpath(d.root);
    if (d.realpath(d.git(input.cwd, "rev-parse", "--show-toplevel")) !== root)
      return skip("root mismatch");
    const gitDir = d.realpath(d.git(root, "rev-parse", "--absolute-git-dir"));
    const commonDir = d.realpath(
      d.git(root, "rev-parse", "--path-format=absolute", "--git-common-dir"),
    );
    const branch = d.git(root, "symbolic-ref", "--quiet", "--short", "HEAD");
    if (gitDir === commonDir || !/^(codex|feat|feature|fix)\/.+/.test(branch))
      return skip("feature worktree required");
    const next = path.join(root, "node_modules/next/dist/bin/next");
    const envModule = path.join(root, "node_modules/@next/env");
    if (!d.exists(next) || !d.exists(envModule))
      return skip("installed dependencies required");
    let envError = false;
    const logger = {
      info() {},
      error() {
        envError = true;
      },
    };
    const { combinedEnv } = d
      .requireModule(envModule)
      .loadEnvConfig(root, true, logger, true);
    if (envError || !safeEnvironment(combinedEnv))
      return skip("unsafe environment");
    if (!(await d.portAvailable())) return skip("port 3010 unavailable");
    const env = {
      ...combinedEnv,
      NEXTAUTH_URL: ORIGIN,
      NEXTAUTH_URL_INTERNAL: ORIGIN,
    };
    delete env.AUTH_TRUST_HOST;
    const started = await d.launch(
      d.executable,
      [next, "dev", "-p", "3010", "-H", "127.0.0.1"],
      {
        cwd: root,
        env,
        detached: true,
        stdio: "ignore",
        shell: false,
      },
    );
    return started
      ? `Randomtrip dev: launch requested at ${ORIGIN}; readiness not checked.`
      : skip("launch failed");
  } catch {
    return skip("prerequisite check failed");
  } // Never print errors or environment values.
}

function readInput(stream, timeout = 1000) {
  return new Promise((resolve) => {
    let input = "";
    const finish = (value) => {
      clearTimeout(timer);
      stream.removeAllListeners("data");
      stream.pause();
      stream.destroy();
      resolve(value);
    };
    const timer = setTimeout(() => finish(""), timeout);
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      input += chunk;
      if (input.length > 65536) finish("");
    });
    stream.once("end", () => finish(input));
    stream.once("error", () => finish(""));
  });
}

if (require.main === module) {
  (async () => {
    const input =
      process.env.RT_CODEX_DEV_AUTOSTART === "1"
        ? await readInput(process.stdin)
        : "";
    const additionalContext = await run(input);
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext,
        },
      }),
    );
  })().catch(() => {
    process.exitCode = 0;
  });
}

module.exports = {
  DEV_HOST,
  ORIGIN,
  launch,
  noExistingListener,
  portAvailable,
  readInput,
  run,
  safeEnvironment,
};
