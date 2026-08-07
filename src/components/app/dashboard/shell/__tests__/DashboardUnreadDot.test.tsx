import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardUnreadDot } from "@/components/app/dashboard/shell/DashboardUnreadDot";
import { publishUnreadRefresh } from "@/lib/notifications/unreadDotBus";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function render(element: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return container;
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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DashboardUnreadDot — freshness via unreadDotBus", () => {
  it("refetches its own audience's unread count when publishUnreadRefresh fires, without a remount", async () => {
    let call = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      call += 1;
      return Promise.resolve({
        ok: true,
        json: async () => ({ count: call === 1 ? 2 : 5 }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardUnreadDot audience="TRIPPER" />);
    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/notifications/unread-count?audience=TRIPPER",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      publishUnreadRefresh();
      await Promise.resolve();
    });
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops refetching after unmount (unsubscribes on cleanup)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardUnreadDot audience="ADMIN" />);
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });

    await act(async () => {
      publishUnreadRefresh();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
