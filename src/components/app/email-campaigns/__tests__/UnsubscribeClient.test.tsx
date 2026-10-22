import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import enCopy from "@/dictionaries/en.json";
import { UnsubscribeClient } from "../UnsubscribeClient";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy = enCopy.emailUnsubscribe;

let container: HTMLDivElement;
let root: Root;

function render(token: string | null) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<UnsubscribeClient copy={copy} locale="en" token={token} />);
  });
}

function confirmButton(): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (b) =>
      b.textContent?.includes(copy.confirmCta) ||
      b.textContent?.includes(copy.pending),
  );
  if (!button) throw new Error("confirm button not found");
  return button as HTMLButtonElement;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});

describe("UnsubscribeClient", () => {
  it("shows a pending state, ignores duplicate clicks, then confirms success", async () => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValue(pending.promise);
    render("tok");

    act(() => confirmButton().click());
    act(() => confirmButton().click());

    const button = confirmButton();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.textContent).toContain(copy.pending);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/email/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "tok" }),
    });

    await act(async () => pending.resolve(jsonResponse(200, { ok: true })));

    expect(container.textContent).toContain(copy.successTitle);
    expect(container.querySelector("button")).toBeNull();
  });

  it("shows the invalid-link state when the API rejects the token", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { ok: false, error: "invalid_token" }),
    );
    render("forged");

    await act(async () => confirmButton().click());

    expect(container.textContent).toContain(copy.invalidTitle);
  });

  it("shows the invalid-link state without a request when the token is missing", () => {
    render(null);

    expect(container.textContent).toContain(copy.invalidTitle);
    expect(container.querySelector("button")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a retryable error on a network failure", async () => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    render("tok");

    act(() => confirmButton().click());
    await act(async () => pending.reject(new Error("offline")));

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      copy.error,
    );
    const button = confirmButton();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain(copy.confirmCta);

    fetchMock.mockResolvedValueOnce(jsonResponse(500, { ok: false }));
    await act(async () => button.click());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      copy.error,
    );
  });
});
