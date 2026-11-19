// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { logSocialFailure } from "../socialDiagnostics";
afterEach(() => vi.restoreAllMocks());
it("logs only bounded categories, validated status/code and internal identifiers", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const error = Object.assign(new Error("token=xoxb-secret private caption"), {
    name: "private account name",
    code: "P2028",
    httpStatus: 503,
    cause: { token: "secret" },
  });
  logSocialFailure("import.persist", error, {
    requestId: "11111111-1111-4111-8111-111111111111",
  });
  expect(log.mock.calls).toEqual([
    [
      "[social-diagnostics]",
      {
        stage: "import.persist",
        category: "database",
        code: "P2028",
        httpStatus: 503,
        requestId: "11111111-1111-4111-8111-111111111111",
      },
    ],
  ]);
});
it("does not serialize arbitrary names, codes, bodies, URLs or thrown values", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  for (const error of [
    "secret",
    { message: "secret", body: "secret" },
    Object.assign(new Error("https://private.test?token=secret"), {
      name: "secret",
      code: "secret",
      httpStatus: "secret",
    }),
  ])
    logSocialFailure("worker.run", error, { jobId: "secret" });
  expect(log.mock.calls).toEqual(
    Array(3).fill([
      "[social-diagnostics]",
      {
        stage: "worker.run",
        category: "unknown",
      },
    ]),
  );
});
