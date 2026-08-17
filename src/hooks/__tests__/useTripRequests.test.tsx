import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTripRequests } from "@/hooks/useTripRequests";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const ERROR_LOAD = "Failed to load trip requests.";

let container: HTMLDivElement;
let root: Root;
let latest:
  | ReturnType<typeof useTripRequests>
  | undefined;

function Harness() {
  latest = useTripRequests({
    page: 1,
    limit: 20,
    status: "ALL",
    errorLoad: ERROR_LOAD,
  });
  return null;
}

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Harness />);
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  latest = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useTripRequests — network failure does not strand the page", () => {
  it("resolves loading to false and sets a localized error when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network request failed")),
    );

    render();
    expect(latest?.loading).toBe(true);

    await flush();

    expect(latest?.loading).toBe(false);
    expect(latest?.error).toBe(ERROR_LOAD);
  });

  it("resolves loading to false and sets a localized error when res.json() throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Malformed response");
        },
      }),
    );

    render();
    await flush();

    expect(latest?.loading).toBe(false);
    expect(latest?.error).toBe(ERROR_LOAD);
  });
});
