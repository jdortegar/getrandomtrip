import { afterEach, expect, it, vi } from "vitest";
import { POST } from "../route";

const { isEnabled } = vi.hoisted(() => ({ isEnabled: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ isEnabled }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it.each(["production", "test"])(
  "does not throw or inspect Sentry in %s",
  (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    expect(POST().status).toBe(404);
    expect(isEnabled).not.toHaveBeenCalled();
  },
);

it("reports a missing server client rather than throwing a sample", () => {
  vi.stubEnv("NODE_ENV", "development");
  isEnabled.mockReturnValue(false);
  expect(POST().status).toBe(503);
});

it("throws the deliberate error only in development with an active client", () => {
  vi.stubEnv("NODE_ENV", "development");
  isEnabled.mockReturnValue(true);
  expect(() => POST()).toThrow("Sentry backend smoke test");
});
