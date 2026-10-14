// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  classifyWorktree,
  devServersFor,
  isCheckoutBusy,
  isLfsPhantom,
  parseLsofCwd,
  parseLsofListen,
  parseReflogTimes,
  parseStatusZ,
  parseWorktreePorcelain,
  pickFreePort,
  realChanges,
  removeRefusal,
  slugForBranch,
  worktreePathFor,
} from "./worktree.mjs";

describe("slugForBranch / worktreePathFor", () => {
  it("replaces slashes with dashes", () => {
    expect(slugForBranch("chore/worktree-skill")).toBe("chore-worktree-skill");
    expect(slugForBranch("feat/a/b")).toBe("feat-a-b");
    expect(slugForBranch("main")).toBe("main");
  });

  it("places worktrees in a sibling <repo>-worktrees directory", () => {
    expect(worktreePathFor("/home/u/repos/getrandomtrip", "fix/x")).toBe(
      "/home/u/repos/getrandomtrip-worktrees/fix-x",
    );
  });

  it("rejects empty branch names", () => {
    expect(() => slugForBranch("")).toThrow();
  });
});

describe("parseWorktreePorcelain", () => {
  const text = [
    "worktree /r/main",
    "HEAD aaa",
    "branch refs/heads/develop",
    "",
    "worktree /r-worktrees/feat-x",
    "HEAD bbb",
    "branch refs/heads/feat/x",
    "locked",
    "",
    "worktree /tmp/old",
    "HEAD ccc",
    "detached",
    "prunable gitdir file points to non-existent location",
    "",
  ].join("\n");

  it("parses entries, branches, detached, locked and prunable", () => {
    const list = parseWorktreePorcelain(text);
    expect(list).toHaveLength(3);
    expect(list[0]).toMatchObject({
      path: "/r/main",
      head: "aaa",
      branch: "develop",
      isMain: true,
      prunable: false,
    });
    expect(list[1]).toMatchObject({
      path: "/r-worktrees/feat-x",
      branch: "feat/x",
      locked: true,
      isMain: false,
    });
    expect(list[2]).toMatchObject({
      path: "/tmp/old",
      branch: null,
      detached: true,
      prunable: true,
    });
  });

  it("returns an empty list for empty input", () => {
    expect(parseWorktreePorcelain("")).toEqual([]);
  });
});

describe("parseStatusZ", () => {
  it("parses modified, untracked and renamed entries", () => {
    const text = " M a.txt\0?? new.txt\0R  new-name.ts\0old-name.ts\0";
    expect(parseStatusZ(text)).toEqual([
      { xy: " M", path: "a.txt" },
      { xy: "??", path: "new.txt" },
      { xy: "R ", path: "new-name.ts" },
    ]);
  });
});

describe("isLfsPhantom / realChanges", () => {
  it("treats a modified file identical to the HEAD blob as phantom", () => {
    expect(
      isLfsPhantom({ xy: " M", headBlob: "abc", worktreeHash: "abc" }),
    ).toBe(true);
  });

  it("treats raw bytes identical to a pre-LFS HEAD blob as phantom", () => {
    // HEAD holds the raw binary; .gitattributes now routes it through LFS, so
    // the filtered hash is the pointer but the unfiltered hash matches HEAD.
    expect(
      isLfsPhantom({
        xy: " M",
        headBlob: "raw",
        worktreeHash: "pointer",
        rawHash: "raw",
      }),
    ).toBe(true);
  });

  it("treats differing hashes, untracked, and deleted files as real", () => {
    expect(
      isLfsPhantom({ xy: " M", headBlob: "abc", worktreeHash: "def" }),
    ).toBe(false);
    expect(
      isLfsPhantom({ xy: "??", headBlob: null, worktreeHash: "abc" }),
    ).toBe(false);
    expect(isLfsPhantom({ xy: " D", headBlob: "abc", worktreeHash: null })).toBe(
      false,
    );
  });

  it("filters phantom entries out of a status list", () => {
    const entries = [
      { xy: " M", path: "public/v.mp4" },
      { xy: " M", path: "src/a.ts" },
      { xy: "??", path: "notes.md" },
    ];
    const headBlobs = new Map([
      ["public/v.mp4", "p1"],
      ["src/a.ts", "s1"],
    ]);
    const hashes = new Map([
      ["public/v.mp4", "ptr"],
      ["src/a.ts", "s2"],
      ["notes.md", "n1"],
    ]);
    const raw = new Map([
      ["public/v.mp4", "p1"],
      ["src/a.ts", "s2"],
    ]);
    expect(
      realChanges(entries, headBlobs, hashes, raw).map((e) => e.path),
    ).toEqual(["src/a.ts", "notes.md"]);
  });
});

describe("parseReflogTimes", () => {
  it("extracts unix timestamps from %gd output", () => {
    expect(
      parseReflogTimes("HEAD@{1760000000}\nHEAD@{1759990000}\ngarbage\n"),
    ).toEqual([1760000000, 1759990000]);
  });
});

describe("isCheckoutBusy", () => {
  const now = 1_760_000_000;

  it("is not busy when clean, on own branch, and no user report", () => {
    expect(
      isCheckoutBusy({
        changedPaths: [],
        head: "feat/x",
        ownBranch: "feat/x",
        reflogTimes: [now - 10],
        now,
      }),
    ).toEqual({ busy: false, reasons: [] });
  });

  it("is busy when there are changes the task did not make", () => {
    const res = isCheckoutBusy({
      changedPaths: ["src/a.ts", "mine.ts"],
      taskPaths: ["mine.ts"],
      head: "feat/x",
      ownBranch: "feat/x",
      reflogTimes: [],
      now,
    });
    expect(res.busy).toBe(true);
    expect(res.reasons[0]).toMatch(/src\/a\.ts/);
  });

  it("ignores changes the task made itself", () => {
    expect(
      isCheckoutBusy({
        changedPaths: ["mine.ts"],
        taskPaths: ["mine.ts"],
        head: "feat/x",
        ownBranch: "feat/x",
        reflogTimes: [],
        now,
      }).busy,
    ).toBe(false);
  });

  it("is busy when HEAD is another branch with recent reflog activity", () => {
    const res = isCheckoutBusy({
      changedPaths: [],
      head: "chore/other",
      ownBranch: "feat/x",
      reflogTimes: [now - 600],
      now,
    });
    expect(res.busy).toBe(true);
    expect(res.reasons[0]).toMatch(/chore\/other/);
  });

  it("is not busy when another branch has only old reflog activity", () => {
    expect(
      isCheckoutBusy({
        changedPaths: [],
        head: "develop",
        ownBranch: "feat/x",
        reflogTimes: [now - 3 * 24 * 3600],
        now,
      }).busy,
    ).toBe(false);
  });

  it("is busy when the user says another session works there", () => {
    expect(
      isCheckoutBusy({
        changedPaths: [],
        head: "feat/x",
        ownBranch: "feat/x",
        reflogTimes: [],
        now,
        userSaysBusy: true,
      }).busy,
    ).toBe(true);
  });
});

describe("pickFreePort", () => {
  it("returns the start port when free", async () => {
    await expect(pickFreePort(3010, async () => true)).resolves.toBe(3010);
  });

  it("skips busy ports", async () => {
    const busy = new Set([3010, 3011]);
    await expect(
      pickFreePort(3010, async (p) => !busy.has(p)),
    ).resolves.toBe(3012);
  });

  it("throws when no port is free within the range", async () => {
    await expect(pickFreePort(3010, async () => false, 3)).rejects.toThrow(
      /3010-3012/,
    );
  });
});

describe("lsof parsing / devServersFor", () => {
  it("parses listening pids and ports", () => {
    const text = "p100\nf20\nn*:3010\nf21\nn[::1]:3010\np200\nf5\nn127.0.0.1:5432\n";
    expect(parseLsofListen(text)).toEqual([
      { pid: 100, ports: [3010] },
      { pid: 200, ports: [5432] },
    ]);
  });

  it("parses a cwd", () => {
    expect(parseLsofCwd("p100\nfcwd\nn/r-worktrees/feat-x\n")).toBe(
      "/r-worktrees/feat-x",
    );
    expect(parseLsofCwd("")).toBeNull();
  });

  it("matches servers whose cwd is inside the worktree only", () => {
    const servers = [
      { pid: 1, ports: [3010], cwd: "/r/main" },
      { pid: 2, ports: [3011], cwd: "/r/main-worktrees/feat-x" },
      { pid: 3, ports: [3012], cwd: "/r/main-worktrees/feat-x/sub" },
      { pid: 4, ports: [3013], cwd: "/r/main-worktrees/feat-xy" },
    ];
    expect(
      devServersFor("/r/main-worktrees/feat-x", servers).map((s) => s.pid),
    ).toEqual([2, 3]);
  });
});

describe("classifyWorktree", () => {
  const base = {
    isMain: false,
    merged: false,
    realChanges: 0,
    prunable: false,
    devServer: false,
    locked: false,
  };

  it("always keeps the main checkout", () => {
    expect(classifyWorktree({ ...base, isMain: true, merged: true }).action).toBe(
      "keep",
    );
  });

  it("cleans prunable records", () => {
    expect(classifyWorktree({ ...base, prunable: true }).action).toBe("clean");
  });

  it("keeps worktrees with a running dev server or lock", () => {
    expect(
      classifyWorktree({ ...base, merged: true, devServer: true }).action,
    ).toBe("keep");
    expect(classifyWorktree({ ...base, merged: true, locked: true }).action).toBe(
      "keep",
    );
  });

  it("never cleans worktrees with real changes", () => {
    expect(
      classifyWorktree({ ...base, merged: true, realChanges: 2 }).action,
    ).toBe("needs-decision");
    expect(classifyWorktree({ ...base, realChanges: 1 }).action).toBe(
      "needs-decision",
    );
  });

  it("keeps recently active worktrees even when their tip is merged", () => {
    // A fresh branch cut from develop right after a release is "merged".
    expect(
      classifyWorktree({ ...base, merged: true, recentlyActive: true }).action,
    ).toBe("keep");
  });

  it("cleans merged worktrees without real changes and keeps unmerged ones", () => {
    expect(classifyWorktree({ ...base, merged: true }).action).toBe("clean");
    expect(classifyWorktree(base).action).toBe("keep");
  });
});

describe("removeRefusal", () => {
  const ok = { found: true, isMain: false, realChanges: 0, merged: true };

  it("allows a clean merged worktree", () => {
    expect(removeRefusal(ok)).toBeNull();
  });

  it("refuses missing, main, dirty, or unmerged worktrees", () => {
    expect(removeRefusal({ ...ok, found: false })).toMatch(/no worktree/);
    expect(removeRefusal({ ...ok, isMain: true })).toMatch(/main checkout/);
    expect(removeRefusal({ ...ok, realChanges: 3 })).toMatch(/3 real change/);
    expect(removeRefusal({ ...ok, merged: false })).toMatch(/not merged/);
  });
});
