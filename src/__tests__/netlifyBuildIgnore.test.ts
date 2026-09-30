// @vitest-environment node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const sections = readFileSync("netlify.toml", "utf8").split(/(?=^\[)/m);
const previewSection = sections.find((section) =>
  section.startsWith("[context.deploy-preview]\n"),
);
// Read the literal command from the config rather than duplicating its policy.
const ignoreCommand = previewSection?.match(
  /^[ \t]*ignore\s*=\s*'([^'\n]+)'[ \t]*$/m,
)?.[1];

it("overrides ignore only for Deploy Previews", () => {
  expect(previewSection).toBeDefined();
  expect(
    sections.filter((section) => /^[ \t]*ignore\s*=/m.test(section)),
  ).toEqual([previewSection]);
});

it.each([
  ["deploy-preview", "codex/feature", "codex/feature", 1],
  ["deploy-preview", "develop", "develop", 0],
  ["deploy-preview", "develop", "pull/123/head", 0],
  ["branch-deploy", "develop", "develop", 1],
  ["production", "main", "main", 1],
  ["production", "develop", "main", 1],
  ["deploy-preview", "main", "main", 1],
  ["deploy-preview", "develop-feature", "develop-feature", 1],
  ["deploy-preview", undefined, "develop", 1],
  ["deploy-preview", "", "develop", 1],
  ["unknown", "develop", "develop", 1],
  [undefined, "develop", "develop", 1],
  [undefined, undefined, undefined, 1],
] as const)(
  "CONTEXT=%s HEAD=%s BRANCH=%s exits %s (0 skips; 1 builds)",
  (context, head, branch, expectedStatus) => {
    if (!ignoreCommand) {
      throw new Error(
        "Expected [context.deploy-preview].ignore as a TOML literal string",
      );
    }

    const env: NodeJS.ProcessEnv = { NODE_ENV: "test" };
    if (context !== undefined) env.CONTEXT = context;
    if (head !== undefined) env.HEAD = head;
    if (branch !== undefined) env.BRANCH = branch;

    const result = spawnSync(
      "/bin/bash",
      ["--noprofile", "--norc", "-c", ignoreCommand],
      { env },
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(expectedStatus);
  },
);
