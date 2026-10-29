import {
  Suspense,
  act,
  startTransition,
  use,
  useEffect,
  useMemo,
  useState,
  type Context,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOptimisticQuerySync } from "../useQuerySync";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

interface NavValue {
  router: { replace: (url: string, options?: { scroll?: boolean }) => void };
  searchParams: URLSearchParams;
}

const nav = vi.hoisted(() => ({
  ctx: null as unknown as Context<NavValue | null>,
}));

vi.mock("next/navigation", async () => {
  const React = await import("react");
  nav.ctx = React.createContext<NavValue | null>(null);
  return {
    useRouter: () => React.useContext(nav.ctx)!.router,
    useSearchParams: () => React.useContext(nav.ctx)!.searchParams,
  };
});

const INITIAL_QUERY = "travelType=couple";

let releaseNavigation: () => void;
let navigationGate: Promise<void>;
const replaceSpy = vi.fn();

/**
 * Mirrors the App Router: `replace` commits the new query inside a
 * transition that stays suspended until the server payload arrives.
 */
function FakeRouter({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const searchParams = useMemo(() => new URLSearchParams(query), [query]);
  const router = useMemo(
    () => ({
      replace: (url: string, options?: { scroll?: boolean }) => {
        replaceSpy(url, options);
        startTransition(() => setQuery(url.replace(/^\?/, "")));
      },
    }),
    [],
  );
  return (
    <nav.ctx.Provider value={{ router, searchParams }}>
      <Suspense fallback={<p>loading</p>}>
        <ServerRoundTrip query={query} />
        {children}
      </Suspense>
    </nav.ctx.Provider>
  );
}

function ServerRoundTrip({ query }: { query: string }) {
  if (query !== INITIAL_QUERY) use(navigationGate);
  return null;
}

const handle: {
  current: ReturnType<typeof useOptimisticQuerySync>["updateQuery"] | null;
} = { current: null };
const update: ReturnType<typeof useOptimisticQuerySync>["updateQuery"] = (
  patch,
) => handle.current!(patch);

function Probe() {
  const { searchParams, updateQuery } = useOptimisticQuerySync();
  useEffect(() => {
    handle.current = updateQuery;
  });
  return <output>{searchParams.toString()}</output>;
}

describe("useOptimisticQuerySync", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    replaceSpy.mockClear();
    navigationGate = new Promise((resolve) => {
      releaseNavigation = resolve;
    });
    container = document.createElement("div");
    root = createRoot(container);
    act(() =>
      root.render(
        <FakeRouter>
          <Probe />
        </FakeRouter>,
      ),
    );
  });

  afterEach(() => act(() => root.unmount()));

  const shown = () => container.querySelector("output")?.textContent;

  it("shows the patched query before the navigation finishes", async () => {
    await act(async () => update({ experience: "essenza" }));

    expect(shown()).toBe("travelType=couple&experience=essenza");
    expect(replaceSpy).toHaveBeenCalledWith(
      "?travelType=couple&experience=essenza",
      { scroll: false },
    );

    await act(async () => releaseNavigation());
    expect(shown()).toBe("travelType=couple&experience=essenza");
  });

  it("stacks consecutive patches while the first navigation is pending", async () => {
    await act(async () => update({ excuse: "foodie" }));
    await act(async () => update({ refineDetails: ["a", "b"] }));

    expect(shown()).toBe(
      "travelType=couple&excuse=foodie&refineDetails=a%2Cb",
    );
    expect(replaceSpy).toHaveBeenLastCalledWith(
      "?travelType=couple&excuse=foodie&refineDetails=a%2Cb",
      { scroll: false },
    );
  });

  it("removes params patched to undefined or an empty array", async () => {
    await act(async () => update({ travelType: undefined, tags: [] }));

    expect(shown()).toBe("");
  });
});
