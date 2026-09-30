import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTripRequests } from "@/hooks/useTripRequests";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const ERROR_LOAD = "Failed to load trip requests.";

let container: HTMLDivElement;
let root: Root;
let latest: ReturnType<typeof useTripRequests> | undefined;

function Harness({
  params = {},
}: {
  params?: Partial<Parameters<typeof useTripRequests>[0]>;
}) {
  const result = useTripRequests({
    page: 1,
    limit: 20,
    status: "ALL",
    errorLoad: ERROR_LOAD,
    ...params,
  });
  useEffect(() => {
    latest = result;
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

interface PendingRequest {
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
}

function deferredRequests() {
  const requests: PendingRequest[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((resolve, reject) => {
          requests.push({ resolve, reject });
        }),
    ),
  );
  return requests;
}

function response(id: string, total: number) {
  return Response.json({
    tripRequests: [{ id }],
    total,
    statusCounts: { CONFIRMED: total },
  });
}

it.each(["success", "http", "network", "malformed"])(
  "ignores stale %s after a newer request resolves",
  async (outcome) => {
    const requests = deferredRequests();
    render();
    act(() => root.render(<Harness params={{ status: "CONFIRMED" }} />));
    await act(async () => requests[1].resolve(response("latest-trip", 7)));
    await act(async () => {
      if (outcome === "network") requests[0].reject(new Error("Stale error"));
      else if (outcome === "http")
        requests[0].resolve(
          Response.json({ error: "Stale HTTP error" }, { status: 503 }),
        );
      else if (outcome === "malformed")
        requests[0].resolve(new Response("not JSON"));
      else requests[0].resolve(response("stale-trip", 99));
    });
    expect(latest?.trips.map((trip) => trip.id)).toEqual(["latest-trip"]);
    expect(latest?.total).toBe(7);
    expect(latest?.statusCounts.CONFIRMED).toBe(7);
    expect(latest?.error).toBeNull();
    expect(latest?.loading).toBe(false);
  },
);

it("does not clear current loading or report errors when an older request fails first", async () => {
  const requests = deferredRequests();
  render();
  act(() =>
    root.render(
      <Harness params={{ page: 2, sortBy: "tripDate", sortOrder: "desc" }} />,
    ),
  );
  await act(async () => requests[0].reject(new Error("Old request")));
  expect(latest?.loading).toBe(true);
  expect(latest?.error).toBeNull();
  await act(async () => requests[1].resolve(response("current-page", 2)));
  expect(latest?.loading).toBe(false);
  expect(latest?.trips[0].id).toBe("current-page");
});

it("protects explicit same-query refreshes from an older refresh completion", async () => {
  const requests = deferredRequests();
  render();
  await act(async () => requests[0].resolve(response("initial", 1)));
  act(() => {
    void latest!.refresh();
  });
  act(() => {
    void latest!.refresh();
  });
  await act(async () => requests[2].resolve(response("new-refresh", 3)));
  await act(async () => requests[1].resolve(response("old-refresh", 2)));
  expect(latest?.trips[0].id).toBe("new-refresh");
  expect(latest?.total).toBe(3);
  expect(latest?.loading).toBe(false);
});
