import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// React 19 requires this flag set before any `act(...)` call in a non-RTL harness.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

import { signIn } from "next-auth/react";
import AuthModal from "../AuthModal";

const signInMock = signIn as ReturnType<typeof vi.fn>;

// Node 25's native (unflagged) `localStorage` global shadows happy-dom's
// implementation and is non-functional without `--localstorage-file`
// (`getItem`/`setItem` throw). AuthModal reads `localStorage` on open to
// restore a remembered email — stub a real in-memory implementation per
// test file rather than touching the shared vitest config.
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

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: makeLocalStorageStub(),
});

let container: HTMLDivElement;
let root: Root;

function render(ui: React.ReactElement) {
  act(() => {
    root.render(ui);
  });
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function setSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    "value",
  )!.set!;
  act(() => {
    setter.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function fillRequiredFields() {
  const name = container.querySelector("#auth-name") as HTMLInputElement;
  const email = container.querySelector("#auth-email") as HTMLInputElement;
  const password = container.querySelector(
    "#auth-password",
  ) as HTMLInputElement;
  setInputValue(name, "Ana");
  setInputValue(email, "ana@example.com");
  setInputValue(password, "abc12345");
}

async function submitForm() {
  const form = container.querySelector("form") as HTMLFormElement;
  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    // Flush the register fetch + subsequent signIn microtasks.
    await Promise.resolve();
    await Promise.resolve();
  });
}

function mockFetchSequence(
  activeTrippersResponse: Promise<Response> | null,
) {
  const fetchMock = vi.fn((url: string) => {
    if (url === "/api/trippers/active") {
      return (
        activeTrippersResponse ??
        Promise.resolve(
          new Response(JSON.stringify({ trippers: [], current: null }), {
            status: 200,
          }),
        )
      );
    }
    if (url === "/api/auth/register") {
      return Promise.resolve(
        new Response(
          JSON.stringify({ user: { id: "u1", email: "ana@example.com" } }),
          { status: 201 },
        ),
      );
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function getRegisterRequestBody(fetchMock: ReturnType<typeof vi.fn>) {
  const call = fetchMock.mock.calls.find(
    (args: unknown[]) => args[0] === "/api/auth/register",
  );
  const body = call?.[1]?.body;
  return body ? JSON.parse(body) : null;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  signInMock.mockResolvedValue({ error: undefined });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("AuthModal register submit — referredByTripperSlug three-state picker (finding #3)", () => {
  it("omits referredByTripperSlug entirely (undefined) when the user submits before the pre-fill fetch resolves", async () => {
    let resolveFetch!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = mockFetchSequence(pending);

    render(
      <AuthModal defaultMode="register" isOpen onClose={() => {}} />,
    );
    fillRequiredFields();
    await submitForm();

    const body = getRegisterRequestBody(fetchMock);
    expect(body).not.toBeNull();
    expect("referredByTripperSlug" in body).toBe(false);

    // Resolve the pending fetch after the fact so it doesn't leak between
    // tests, and so its state update is act()-wrapped like everything else.
    await act(async () => {
      resolveFetch(
        new Response(JSON.stringify({ trippers: [], current: null }), {
          status: 200,
        }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it("sends explicit null when the user picks the None option", async () => {
    const fetchMock = mockFetchSequence(
      Promise.resolve(
        new Response(
          JSON.stringify({
            trippers: [{ slug: "carla-diaz", name: "Carla Diaz" }],
            current: null,
          }),
          { status: 200 },
        ),
      ),
    );

    render(
      <AuthModal defaultMode="register" isOpen onClose={() => {}} />,
    );
    fillRequiredFields();

    // Let the pre-fill fetch resolve first.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const select = container.querySelector(
      "#auth-referred-by-tripper",
    ) as HTMLSelectElement;
    setSelectValue(select, "none");

    await submitForm();

    const body = getRegisterRequestBody(fetchMock);
    expect(body.referredByTripperSlug).toBeNull();
  });

  it("sends the picked slug when the user selects a real tripper", async () => {
    const fetchMock = mockFetchSequence(
      Promise.resolve(
        new Response(
          JSON.stringify({
            trippers: [{ slug: "carla-diaz", name: "Carla Diaz" }],
            current: null,
          }),
          { status: 200 },
        ),
      ),
    );

    render(
      <AuthModal defaultMode="register" isOpen onClose={() => {}} />,
    );
    fillRequiredFields();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const select = container.querySelector(
      "#auth-referred-by-tripper",
    ) as HTMLSelectElement;
    setSelectValue(select, "carla-diaz");

    await submitForm();

    const body = getRegisterRequestBody(fetchMock);
    expect(body.referredByTripperSlug).toBe("carla-diaz");
  });
});
