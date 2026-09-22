import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SentryExamplePageClient } from "../SentryExamplePageClient";
import { sentryExample as copy } from "@/dictionaries/en.json";

const { captureException, flush, isEnabled } = vi.hoisted(() => ({
  captureException: vi.fn(),
  flush: vi.fn(),
  isEnabled: vi.fn(),
}));
vi.mock("@sentry/nextjs", () => ({ captureException, flush, isEnabled }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  isEnabled.mockReturnValue(true);
  flush.mockResolvedValue(true);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
  );
  container = document.createElement("div");
  root = createRoot(container);
  act(() => root.render(<SentryExamplePageClient copy={copy} />));
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});
async function click(label: string) {
  const button = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === label,
  );
  expect(button).toBeDefined();
  await act(async () => button?.click());
}

it("does not capture or flush without an active browser client", async () => {
  isEnabled.mockReturnValue(false);
  await click(copy.browserButton);
  expect(captureException).not.toHaveBeenCalled();
  expect(flush).not.toHaveBeenCalled();
  expect(container.textContent).toContain(copy.status.browserDisabled);
});

it.each([true, false])(
  "reports flush=%s without claiming delivery",
  async (flushed) => {
    flush.mockResolvedValue(flushed);
    await click(copy.browserButton);
    expect(captureException).toHaveBeenCalledWith(
      new Error("Sentry browser smoke test"),
    );
    expect(flush).toHaveBeenCalledWith(2000);
    expect(container.textContent).toContain(
      flushed ? copy.status.browserAttempted : copy.status.browserFailed,
    );
  },
);

it("handles rejected flushes", async () => {
  flush.mockRejectedValue(new Error("Network unavailable"));
  await click(copy.browserButton);
  expect(container.textContent).toContain(copy.status.browserFailed);
});

it.each([
  [500, "serverAttempted"],
  [503, "serverDisabled"],
  [404, "serverFailed"],
  [200, "serverFailed"],
] as const)(
  "reports API status %s without asserting ingestion",
  async (status, key) => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status }));
    await click(copy.serverButton);
    expect(fetch).toHaveBeenCalledWith("/api/sentry-example-api", {
      cache: "no-store",
      method: "POST",
    });
    expect(container.textContent).toContain(copy.status[key]);
  },
);

it("handles failed API requests", async () => {
  vi.mocked(fetch).mockRejectedValue(new Error("Network unavailable"));
  await click(copy.serverButton);
  expect(container.textContent).toContain(copy.status.serverFailed);
});
