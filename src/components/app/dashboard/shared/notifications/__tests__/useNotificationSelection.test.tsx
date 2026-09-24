import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationSelection } from "@/components/app/dashboard/shared/notifications/useNotificationSelection";
import type { ClientNotification } from "@/types/notifications";
import type { NotificationStatusFilter } from "@/lib/notifications/list-query";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function makeNotification(overrides: Partial<ClientNotification> = {}): ClientNotification {
  return {
    id: "notif-1",
    userId: "user-1",
    type: "BOOKING_CONFIRMED",
    audience: "TRAVELER",
    isRead: false,
    title: "Title",
    body: "Body",
    metadata: null,
    createdAt: "2026-01-15T10:00:00.000Z",
    ...overrides,
  };
}

type SelectionResult = ReturnType<typeof useNotificationSelection>;

let latest: SelectionResult | null = null;

function Harness({
  list,
  page,
  status,
  initialSelectedId,
}: {
  list: ClientNotification[];
  page: number;
  status: NotificationStatusFilter;
  initialSelectedId?: string;
}) {
  const selection = useNotificationSelection({
    list,
    page,
    status,
    audience: "TRAVELER",
    initialSelectedId,
  });
  useEffect(() => {
    latest = selection;
  });
  return null;
}

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

beforeEach(() => {
  window.history.replaceState(null, "", "/es/dashboard/traveler/notifications");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ notification: makeNotification({ id: "fetched" }) }),
    }),
  );
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  latest = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useNotificationSelection — anchor math (D1)", () => {
  it("resolves idx±1 neighbors when the selected item is still in the list", async () => {
    const list = [
      makeNotification({ id: "a" }),
      makeNotification({ id: "b" }),
      makeNotification({ id: "c" }),
    ];
    render(<Harness list={list} page={1} status="all" />);

    await act(async () => {
      latest!.open("b", "push");
    });
    await flush();

    expect(latest!.canPrev).toBe(true);
    expect(latest!.canNext).toBe(true);
  });

  it("falls back to the anchor once the selected item leaves the list (unread filter case)", async () => {
    const list = [
      makeNotification({ id: "a" }),
      makeNotification({ id: "b" }),
      makeNotification({ id: "c" }),
    ];
    render(<Harness list={list} page={1} status="unread" />);

    await act(async () => {
      latest!.open("b", "push");
    });
    await flush();
    // anchor is now 1 (index of "b")

    const listAfterRefetch = [
      makeNotification({ id: "a" }),
      makeNotification({ id: "c" }),
    ];
    act(() => {
      root.render(
        <Harness list={listAfterRefetch} page={1} status="unread" />,
      );
    });
    await flush();

    // prev = list[anchor - 1] = list[0] = "a"; next = list[anchor] = list[1] = "c"
    expect(latest!.canPrev).toBe(true);
    expect(latest!.canNext).toBe(true);

    await act(async () => {
      latest!.step("next");
    });
    await flush();
    expect(latest!.selectedId).toBe("c");
  });

  it("disables next at the end of the list", async () => {
    const list = [makeNotification({ id: "a" }), makeNotification({ id: "b" })];
    render(<Harness list={list} page={1} status="all" />);

    await act(async () => {
      latest!.open("b", "push");
    });
    await flush();

    expect(latest!.canNext).toBe(false);
    expect(latest!.canPrev).toBe(true);
  });

  it("resets the anchor to null on page or status change, disabling Prev/Next", async () => {
    const list = [
      makeNotification({ id: "a" }),
      makeNotification({ id: "b" }),
      makeNotification({ id: "c" }),
    ];
    render(<Harness list={list} page={1} status="all" />);

    await act(async () => {
      latest!.open("b", "push");
    });
    await flush();
    expect(latest!.canPrev).toBe(true);
    expect(latest!.canNext).toBe(true);

    act(() => {
      root.render(<Harness list={list} page={2} status="all" />);
    });
    await flush();

    expect(latest!.canPrev).toBe(false);
    expect(latest!.canNext).toBe(false);
  });
});

describe("useNotificationSelection — URL sync (D4)", () => {
  it("open(id, 'push') calls window.history.pushState", async () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    const list = [makeNotification({ id: "a" })];
    render(<Harness list={list} page={1} status="all" />);

    await act(async () => {
      latest!.open("a", "push");
    });
    await flush();

    expect(pushSpy).toHaveBeenCalled();
    expect(window.location.search).toContain("id=a");
  });

  it("step() (Prev/Next) calls window.history.replaceState", async () => {
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    const list = [makeNotification({ id: "a" }), makeNotification({ id: "b" })];
    render(<Harness list={list} page={1} status="all" />);

    await act(async () => {
      latest!.open("a", "push");
    });
    await flush();
    replaceSpy.mockClear();

    await act(async () => {
      latest!.step("next");
    });
    await flush();

    expect(replaceSpy).toHaveBeenCalled();
    expect(window.location.search).toContain("id=b");
  });

  it("a popstate event re-resolves id from the list first", async () => {
    const list = [makeNotification({ id: "a" }), makeNotification({ id: "b" })];
    render(<Harness list={list} page={1} status="all" />);

    act(() => {
      window.history.pushState(null, "", "/es/dashboard/traveler/notifications?id=b");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await flush();

    expect(latest!.selectedId).toBe("b");
    expect(latest!.selected?.id).toBe("b");
    expect(latest!.paneState).toBe("ready");
  });

  it("a popstate event falls back to the current snapshot when the id left the list", async () => {
    const list = [makeNotification({ id: "a" }), makeNotification({ id: "b" })];
    render(<Harness list={list} page={1} status="all" />);

    await act(async () => {
      latest!.open("b", "push");
    });
    await flush();

    const listWithoutB = [makeNotification({ id: "a" })];
    act(() => {
      root.render(<Harness list={listWithoutB} page={1} status="all" />);
    });
    await flush();

    (fetch as ReturnType<typeof vi.fn>).mockClear();

    act(() => {
      window.history.pushState(null, "", "/es/dashboard/traveler/notifications?id=b");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await flush();

    expect(latest!.selectedId).toBe("b");
    expect(latest!.paneState).toBe("ready");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("a popstate event calls GET [id] when the id is neither in the list nor the snapshot", async () => {
    const list = [makeNotification({ id: "a" })];
    render(<Harness list={list} page={1} status="all" />);

    act(() => {
      window.history.pushState(
        null,
        "",
        "/es/dashboard/traveler/notifications?id=fetched",
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await flush();

    expect(fetch).toHaveBeenCalledWith(
      "/api/notifications/fetched?audience=TRAVELER",
    );
    expect(latest!.selectedId).toBe("fetched");
    expect(latest!.selected?.id).toBe("fetched");
    expect(latest!.paneState).toBe("ready");
  });

  it("close() calls history.back() only when this session pushed the entry", async () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    const list = [makeNotification({ id: "a" })];
    render(<Harness list={list} page={1} status="all" />);

    await act(async () => {
      latest!.open("a", "push");
    });
    await flush();

    await act(async () => {
      latest!.close();
    });
    await flush();

    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it("close() replaces without id when the entry was opened via replace, not push", async () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const list = [makeNotification({ id: "a" })];
    render(<Harness list={list} page={1} status="all" />);

    await act(async () => {
      latest!.open("a", "replace");
    });
    await flush();

    await act(async () => {
      latest!.close();
    });
    await flush();

    expect(backSpy).not.toHaveBeenCalled();
    expect(window.location.search).not.toContain("id=");
    expect(latest!.selectedId).toBeNull();
    expect(latest!.paneState).toBe("empty");
  });
});

describe("useNotificationSelection — detail resolution (D5)", () => {
  it("resolves from the list item when present, without calling GET", async () => {
    const list = [makeNotification({ id: "a", title: "From list" })];
    render(<Harness list={list} page={1} status="all" />);

    await act(async () => {
      latest!.open("a", "push");
    });
    await flush();

    expect(latest!.selected?.title).toBe("From list");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("resolves an off-page initialSelectedId via GET [id] on mount", async () => {
    const list = [makeNotification({ id: "a" })];
    render(<Harness list={list} page={1} status="all" initialSelectedId="fetched" />);

    await flush();

    expect(fetch).toHaveBeenCalledWith(
      "/api/notifications/fetched?audience=TRAVELER",
    );
    expect(latest!.selected?.id).toBe("fetched");
    expect(latest!.paneState).toBe("ready");
  });

  it("shows the notFound pane state on a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: "Not found" }) }),
    );
    const list = [makeNotification({ id: "a" })];
    render(<Harness list={list} page={1} status="all" initialSelectedId="missing" />);

    await flush();

    expect(latest!.paneState).toBe("notFound");
    expect(latest!.selected).toBeNull();
  });
});
