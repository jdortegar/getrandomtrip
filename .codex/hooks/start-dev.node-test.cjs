"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { PassThrough } = require("node:stream");
// Importing the module does not read stdin/env files, run git, or start a child.
const {
  DEV_HOST,
  ORIGIN,
  launch,
  noExistingListener,
  portAvailable,
  readInput,
  run,
} = require("./start-dev.cjs");
const ROOT = "/synthetic/worktree";
const input = (overrides = {}) =>
  JSON.stringify({
    cwd: ROOT,
    hook_event_name: "SessionStart",
    source: "startup",
    ...overrides,
  });
const safe = () => ({
  NODE_ENV: "development",
  RT_DEPLOY_ENV: "nonproduction",
  RT_NONPRODUCTION_AUTH_SECRET: "synthetic-secret",
  RT_NONPRODUCTION_DATABASE_HOST: DEV_HOST,
  DATABASE_URL: `postgresql://fixture:synthetic-password@${DEV_HOST}/fixture`,
});

function fixture() {
  const calls = [];
  const d = {
    env: { RT_CODEX_DEV_AUTOSTART: "1" },
    nodeVersion: "20.9.0",
    executable: "/synthetic/node",
    root: ROOT,
    realpath: (value) => value,
    git: (cwd, ...args) => {
      calls.push(["git", cwd, ...args]);
      if (args.includes("--show-toplevel")) return ROOT;
      if (args.includes("--absolute-git-dir"))
        return "/synthetic/main/.git/worktrees/topic";
      if (args.includes("--git-common-dir")) return "/synthetic/main/.git";
      return "codex/topic";
    },
    exists: (value) => {
      calls.push(["exists", value]);
      return true;
    },
    requireModule: (value) => {
      calls.push(["require", value]);
      return {
        loadEnvConfig: (...args) => {
          calls.push(["env", ...args]);
          return { combinedEnv: safe() };
        },
      };
    },
    portAvailable: async () => {
      calls.push(["port"]);
      return true;
    },
    launch: async (...args) => {
      calls.push(["launch", ...args]);
      return true;
    },
  };
  return { d, calls, run: (value = input()) => run(value, d) };
}

test("default-off ignores even malformed input without filesystem/process/network effects", async () => {
  const f = fixture();
  f.d.env = {};
  assert.match(await f.run("bad"), /opt-in required/);
  assert.deepEqual(f.calls, []);
});

test("invalid/missing event, source, cwd and JSON fail before effects", async () => {
  for (const raw of [
    "",
    "{",
    "null",
    "{}",
    input({ hook_event_name: "Stop" }),
    input({ source: "clear" }),
    input({ cwd: "relative" }),
  ]) {
    const f = fixture();
    assert.match(await f.run(raw), /skipped/);
    assert.deepEqual(f.calls, []);
  }
});

test("older Node and inherited production NODE_ENV fail before effects", async () => {
  for (const version of ["18.20.0", "20.8.9", "invalid"]) {
    const f = fixture();
    f.d.nodeVersion = version;
    assert.match(await f.run(), /Node 20.9/);
    assert.deepEqual(f.calls, []);
  }
  const f = fixture();
  f.d.env.NODE_ENV = "production";
  assert.match(await f.run(), /unsafe environment/);
  assert.deepEqual(f.calls, []);
});

test("wrong root, original checkout, protected/detached branches and missing deps fail closed", async () => {
  for (const replacement of [
    "/different",
    "/synthetic/main/.git",
    "main",
    "develop",
    "master",
    "",
    "release/topic",
  ]) {
    const f = fixture();
    const git = f.d.git;
    f.d.git = (cwd, ...args) => {
      if (replacement === "/different" && args.includes("--show-toplevel"))
        return replacement;
      if (
        replacement === "/synthetic/main/.git" &&
        args.includes("--absolute-git-dir")
      )
        return replacement;
      if (!replacement.startsWith("/") && args[0] === "symbolic-ref")
        return replacement;
      return git(cwd, ...args);
    };
    assert.match(await f.run(), /skipped/);
    assert.ok(!f.calls.some(([kind]) => kind === "require"));
  }
  for (const missing of ["/next/", "/@next/env"]) {
    const f = fixture();
    f.d.exists = (value) => !value.includes(missing);
    assert.match(await f.run(), /installed dependencies required/);
    assert.ok(!f.calls.some(([kind]) => kind === "require"));
  }
});

test("validates merged Next environment, including decoded query overrides, without leaking", async () => {
  const unsafe = [
    { RT_DEPLOY_ENV: "production" },
    { NODE_ENV: "production" },
    { NODE_ENV: undefined },
    { RT_NONPRODUCTION_AUTH_SECRET: " " },
    { RT_NONPRODUCTION_DATABASE_HOST: "wrong" },
    ...["NETLIFY", "CONTEXT", "DEPLOY_PRIME_URL", "DEPLOY_URL", "VERCEL"].map(
      (key) => ({ [key]: "hosted" }),
    ),
    ...["host", "HOSTADDR", "%70ort", "socket", "connectionString"].map(
      (key) => ({ DATABASE_URL: `${safe().DATABASE_URL}?${key}=sensitive` }),
    ),
    ...[
      "not-a-url",
      `https://${DEV_HOST}/fixture`,
      "postgres://user:secret@wrong.invalid/db",
    ].map((DATABASE_URL) => ({ DATABASE_URL })),
  ];
  for (const overrides of unsafe) {
    const f = fixture();
    f.d.env = { ...safe(), RT_CODEX_DEV_AUTOSTART: "1" };
    f.d.requireModule = () => ({
      loadEnvConfig: () => ({ combinedEnv: { ...safe(), ...overrides } }),
    });
    assert.equal(
      await f.run(),
      "Randomtrip dev: skipped (unsafe environment).",
    );
    assert.ok(!f.calls.some(([kind]) => ["port", "launch"].includes(kind)));
  }
  for (const throws of [true, false]) {
    const f = fixture();
    f.d.requireModule = () => ({
      loadEnvConfig: (_root, _dev, logger) => {
        if (throws) throw new Error("synthetic-secret");
        logger.error("synthetic-password");
        return { combinedEnv: safe() };
      },
    });
    assert.doesNotMatch(await f.run(), /synthetic/);
    assert.ok(!f.calls.some(([kind]) => kind === "launch"));
  }
});

test("startup/resume use local Next env API, fixed origin and private detached descriptors", async () => {
  for (const source of ["startup", "resume"]) {
    const f = fixture();
    assert.match(
      await f.run(input({ source })),
      /launch requested.*readiness not checked/,
    );
    const envCall = f.calls.find(([kind]) => kind === "env");
    assert.deepEqual([envCall[1], envCall[2], envCall[4]], [ROOT, true, true]);
    assert.equal(typeof envCall[3].error, "function");
    assert.deepEqual(
      f.calls.find(([kind]) => kind === "require"),
      ["require", `${ROOT}/node_modules/@next/env`],
    );
    const [, command, args, options] = f.calls.find(
      ([kind]) => kind === "launch",
    );
    assert.equal(command, "/synthetic/node");
    assert.deepEqual(args, [
      `${ROOT}/node_modules/next/dist/bin/next`,
      "dev",
      "-p",
      "3010",
      "-H",
      "127.0.0.1",
    ]);
    assert.deepEqual(options, {
      cwd: ROOT,
      detached: true,
      stdio: "ignore",
      shell: false,
      env: { ...safe(), NEXTAUTH_URL: ORIGIN, NEXTAUTH_URL_INTERNAL: ORIGIN },
    });
    assert.ok(
      f.calls.every(([kind]) =>
        ["git", "exists", "require", "env", "port", "launch"].includes(kind),
      ),
    );
  }
});

test("busy port and spawn failures never report success", async () => {
  const f = fixture();
  f.d.portAvailable = async () => false;
  assert.match(await f.run(), /port 3010 unavailable/);
  assert.ok(!f.calls.some(([kind]) => kind === "launch"));
  f.d.portAvailable = async () => true;
  f.d.launch = async () => false;
  assert.match(await f.run(), /launch failed/);
});

test("Darwin listener preflight accepts only normal no-match exit with empty streams", () => {
  const empty = { status: 1, signal: null, stdout: "", stderr: "" };
  const calls = [];
  assert.equal(
    noExistingListener("darwin", (...args) => {
      calls.push(args);
      return empty;
    }),
    true,
  );
  assert.deepEqual(calls, [
    [
      "/usr/sbin/lsof",
      ["-nP", "-iTCP:3010", "-sTCP:LISTEN", "-Fp", "+w"],
      {
        encoding: "utf8",
        timeout: 2000,
        maxBuffer: 65536,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      },
    ],
  ]);
  for (const override of [
    { status: 0, stdout: "p8845\n" },
    { stdout: "p8845\n" },
    { stderr: "lsof: warning\n" },
    { stdout: " " },
    { stderr: "\n" },
    { status: 0 },
    { status: 2 },
    { status: null, signal: "SIGTERM" },
    { signal: "SIGTERM" },
    { error: Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }) },
    { error: Object.assign(new Error("missing"), { code: "ENOENT" }) },
    { stdout: null },
    { stderr: null },
  ]) {
    assert.equal(
      noExistingListener("darwin", () => ({ ...empty, ...override })),
      false,
    );
  }
  assert.equal(
    noExistingListener("darwin", () => {
      throw new Error("inspection failed");
    }),
    false,
  );
});

test("Darwin busy listener rejects before binds or application launch", async () => {
  const f = fixture();
  let binds = 0;
  f.d.portAvailable = () =>
    portAvailable(
      () => {
        binds++;
        throw new Error("unexpected bind");
      },
      () =>
        noExistingListener("darwin", () => ({
          status: 0,
          signal: null,
          stdout: "p8845\n",
          stderr: "",
        })),
    );
  assert.equal(
    await f.run(),
    "Randomtrip dev: skipped (port 3010 unavailable).",
  );
  assert.equal(binds, 0);
  assert.ok(!f.calls.some(([kind]) => kind === "launch"));
});

test("non-Darwin platforms do not require lsof", () => {
  for (const platform of ["linux", "win32", "freebsd"]) {
    assert.equal(
      noExistingListener(platform, () => assert.fail("must not inspect")),
      true,
    );
  }
});

test("port probe reserves/closes both families; any error is unavailable (no real sockets)", async () => {
  for (const failing of [null, "127.0.0.1", "::1"]) {
    const opened = [];
    const closed = [];
    const createServer = () => {
      const server = new EventEmitter();
      server.listen = (options, callback) => {
        opened.push(options);
        server.host = options.host;
        queueMicrotask(() =>
          options.host === failing
            ? server.emit("error", new Error("busy"))
            : callback(),
        );
      };
      server.close = (callback) => {
        closed.push(server.host);
        callback();
      };
      return server;
    };
    assert.equal(
      await portAvailable(createServer, () =>
        noExistingListener("darwin", () => ({
          status: 1,
          signal: null,
          stdout: "",
          stderr: "",
        })),
      ),
      !failing,
    );
    assert.deepEqual(
      closed,
      opened.map(({ host }) => host),
    );
    assert.ok(
      opened.every(({ port, exclusive }) => port === 3010 && exclusive),
    );
  }
});

test("child errors/exits/throw are caught; late errors are handled without logs or kills", async () => {
  for (const event of ["error", "exit", "spawn", "throw"]) {
    const child = new EventEmitter();
    child.unref = () => {};
    const spawn = () => {
      if (event === "throw") throw new Error("secret");
      queueMicrotask(() => child.emit(event));
      return child;
    };
    assert.equal(await launch("node", [], {}, spawn, 1), event === "spawn");
    if (event === "spawn")
      assert.doesNotThrow(() => child.emit("error", new Error("late secret")));
  }
});

test("stdin is bounded, closed, and never retained as process state", async () => {
  for (const value of [input(), "x".repeat(65537), null]) {
    const stream = new PassThrough();
    const result = readInput(stream, 5);
    if (value !== null) stream.end(value);
    assert.equal(await result, value?.length <= 65536 ? value : "");
    assert.equal(stream.destroyed, true);
  }
});
