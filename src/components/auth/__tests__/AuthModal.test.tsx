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
    if (url === "/api/attribution/mode") {
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function getRequestBody(fetchMock: ReturnType<typeof vi.fn>, url: string) {
  const call = fetchMock.mock.calls.find((args: unknown[]) => args[0] === url);
  const body = call?.[1]?.body;
  return body ? JSON.parse(body) : null;
}

function getRegisterRequestBody(fetchMock: ReturnType<typeof vi.fn>) {
  return getRequestBody(fetchMock, "/api/auth/register");
}

function queryGoogleButton(): HTMLButtonElement | null {
  // Distinguish from the close button's lucide `X` icon, which also happens
  // to use a 24x24 viewBox — target the Google "G" logo's distinctive path
  // fill instead of the svg's viewBox.
  return (container
    .querySelector('svg path[fill="#4285F4"]')
    ?.closest("button") ?? null) as HTMLButtonElement | null;
}

function getGoogleButton(): HTMLButtonElement {
  return queryGoogleButton()!;
}

async function clickGoogleButton() {
  await act(async () => {
    getGoogleButton().dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
    await Promise.resolve();
    await Promise.resolve();
  });
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

describe("AuthModal register submit — referredByTripperSlug mandatory picker", () => {
  it("blocks submit and never calls /api/auth/register when the picker is still undecided", async () => {
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

    expect(
      fetchMock.mock.calls.some((args) => args[0] === "/api/auth/register"),
    ).toBe(false);

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

  it("still submits with the cookie-derived slug when the pre-fill fetch resolves before submit", async () => {
    const fetchMock = mockFetchSequence(
      Promise.resolve(
        new Response(
          JSON.stringify({
            trippers: [{ slug: "carla-diaz", name: "Carla Diaz" }],
            current: "carla-diaz",
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

    await submitForm();

    const body = getRegisterRequestBody(fetchMock);
    expect(body).not.toBeNull();
    expect(body.referredByTripperSlug).toBe("carla-diaz");
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

describe("AuthModal Google sign-in — mandatory picker gates the OAuth redirect too", () => {
  it("blocks signIn(\"google\") and never calls the mode-sync endpoint when the picker is still undecided", async () => {
    const fetchMock = mockFetchSequence(
      Promise.resolve(
        new Response(JSON.stringify({ trippers: [], current: null }), {
          status: 200,
        }),
      ),
    );

    render(<AuthModal defaultMode="register" isOpen onClose={() => {}} />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await clickGoogleButton();

    expect(
      fetchMock.mock.calls.some((args) => args[0] === "/api/attribution/mode"),
    ).toBe(false);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("clears the live cookie via mode=randomtrip then calls signIn when the user picks None", async () => {
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

    render(<AuthModal defaultMode="register" isOpen onClose={() => {}} />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const select = container.querySelector(
      "#auth-referred-by-tripper",
    ) as HTMLSelectElement;
    setSelectValue(select, "none");

    await clickGoogleButton();

    const body = getRequestBody(fetchMock, "/api/attribution/mode");
    expect(body).toEqual({ mode: "randomtrip" });
    expect(signInMock).toHaveBeenCalledWith(
      "google",
      expect.objectContaining({ callbackUrl: expect.any(String) }),
    );
  });

  it("sets the cookie to the picked slug via mode=tripper then calls signIn when the user selects a real tripper", async () => {
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

    render(<AuthModal defaultMode="register" isOpen onClose={() => {}} />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const select = container.querySelector(
      "#auth-referred-by-tripper",
    ) as HTMLSelectElement;
    setSelectValue(select, "carla-diaz");

    await clickGoogleButton();

    const body = getRequestBody(fetchMock, "/api/attribution/mode");
    expect(body).toEqual({ mode: "tripper", slug: "carla-diaz" });
    expect(signInMock).toHaveBeenCalledWith(
      "google",
      expect.objectContaining({ callbackUrl: expect.any(String) }),
    );
  });

  it("does not gate login mode — signIn(\"google\") fires immediately with no picker/sync involved", async () => {
    const fetchMock = mockFetchSequence(null);

    render(<AuthModal defaultMode="login" isOpen onClose={() => {}} />);

    await clickGoogleButton();

    expect(
      fetchMock.mock.calls.some((args) => args[0] === "/api/attribution/mode"),
    ).toBe(false);
    expect(signInMock).toHaveBeenCalledWith(
      "google",
      expect.objectContaining({ callbackUrl: expect.any(String) }),
    );
  });
});

describe("AuthModal not-verified panel — hides Google sign-in", () => {
  it("removes the Google button once register lands on the not-verified panel", async () => {
    mockFetchSequence(
      Promise.resolve(
        new Response(
          JSON.stringify({
            trippers: [{ slug: "carla-diaz", name: "Carla Diaz" }],
            current: "carla-diaz",
          }),
          { status: 200 },
        ),
      ),
    );
    signInMock.mockResolvedValueOnce({ error: "EMAIL_NOT_VERIFIED" });

    render(<AuthModal defaultMode="register" isOpen onClose={() => {}} />);
    fillRequiredFields();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(queryGoogleButton()).not.toBeNull();

    await submitForm();

    expect(queryGoogleButton()).toBeNull();
  });
});
