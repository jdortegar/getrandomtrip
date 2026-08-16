import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GateAwareChrome } from "../GateAwareChrome";
import { GATE_STORAGE_KEY } from "@/lib/constants/marketing-gate";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
}));

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

let mockSessionState: {
  data: { user?: { role?: string; hasSiteAccess?: boolean } } | null | undefined;
  status: SessionStatus;
} = { data: undefined, status: "loading" };

vi.mock("next-auth/react", () => ({
  useSession: () => mockSessionState,
  signOut: () => {},
}));

vi.mock("@/components/Navbar", () => ({
  default: () => <div data-testid="navbar">navbar</div>,
}));
vi.mock("@/components/layout/Footer", () => ({
  default: () => <div data-testid="footer">footer</div>,
}));
vi.mock("@/components/auth/AuthModal", () => ({
  default: () => <div data-testid="auth-modal">auth-modal</div>,
}));
vi.mock("@/components/waitlist/WaitlistPage", () => ({
  WaitlistPage: ({ accessDenied }: { accessDenied?: boolean }) => (
    <div data-access-denied={String(!!accessDenied)} data-testid="waitlist-page">
      waitlist
    </div>
  ),
}));

// Node 25's native (unflagged) `localStorage` global shadows happy-dom's
// implementation and is non-functional without `--localstorage-file`
// (`setItem`/`clear` throw). Stub a real in-memory implementation per test
// file rather than touching the shared vitest config.
function makeLocalStorageStub() {
  let store = new Map<string, string>();
  return {
    clear: () => {
      store = new Map();
    },
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

let container: HTMLDivElement;
let root: Root;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <GateAwareChrome
        dict={{} as unknown as Dictionary}
        gateEnabled
        locale={"en" as Locale}
      >
        <div>children</div>
      </GateAwareChrome>,
    );
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
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: makeLocalStorageStub(),
  });
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.restoreAllMocks();
});

describe("GateAwareChrome — session-status guard (ADR 7)", () => {
  it("given a browser with GATE_STORAGE_KEY set and a session still resolving (status === 'loading'), when the page mounts, then the key is NOT cleared and the gate is NOT shown", async () => {
    window.localStorage.setItem(GATE_STORAGE_KEY, "1");
    mockSessionState = { data: undefined, status: "loading" };

    render();
    await flush();

    expect(window.localStorage.getItem(GATE_STORAGE_KEY)).toBe("1");
    expect(container.querySelector('[data-testid="waitlist-page"]')).toBeNull();
    expect(container.querySelector('[data-testid="navbar"]')).not.toBeNull();
  });

  it("authenticated TRAVELER with hasSiteAccess unlocks", async () => {
    mockSessionState = {
      data: { user: { hasSiteAccess: true, role: "traveler" } },
      status: "authenticated",
    };

    render();
    await flush();

    expect(window.localStorage.getItem(GATE_STORAGE_KEY)).toBe("1");
    expect(container.querySelector('[data-testid="navbar"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="waitlist-page"]')).toBeNull();
  });

  it("authenticated TRAVELER without hasSiteAccess is cleared and denied", async () => {
    window.localStorage.setItem(GATE_STORAGE_KEY, "1");
    mockSessionState = {
      data: { user: { hasSiteAccess: false, role: "traveler" } },
      status: "authenticated",
    };

    render();
    await flush();

    expect(window.localStorage.getItem(GATE_STORAGE_KEY)).toBeNull();
    const waitlistPage = container.querySelector('[data-testid="waitlist-page"]');
    expect(waitlistPage).not.toBeNull();
    expect(waitlistPage?.getAttribute("data-access-denied")).toBe("true");
  });

  it("authenticated admin without any grant still unlocks (GATE_ALLOWED_ROLES stays an OR)", async () => {
    mockSessionState = {
      data: { user: { hasSiteAccess: false, role: "admin" } },
      status: "authenticated",
    };

    render();
    await flush();

    expect(window.localStorage.getItem(GATE_STORAGE_KEY)).toBe("1");
    expect(container.querySelector('[data-testid="navbar"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="waitlist-page"]')).toBeNull();
  });

  it("unauthenticated status leaves localStorage entirely untouched", async () => {
    window.localStorage.setItem(GATE_STORAGE_KEY, "1");
    mockSessionState = { data: null, status: "unauthenticated" };

    render();
    await flush();

    expect(window.localStorage.getItem(GATE_STORAGE_KEY)).toBe("1");
  });
});
