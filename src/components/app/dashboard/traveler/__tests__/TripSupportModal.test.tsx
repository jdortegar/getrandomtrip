import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripSupportModal } from "../TripSupportModal";
import type { TripItineraryDict } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: Pick<TripItineraryDict, "support"> = {
  support: {
    heading: "Something not adding up?",
    body: "Our team can help.",
    cta: "Contact support",
    messageLabel: "Your message",
    messagePlaceholder: "Tell us what you need...",
    send: "Send",
    sending: "Sending...",
    cancel: "Cancel",
    close: "Close",
    successTitle: "Message sent!",
    successBody: "We got your message.",
    errorGeneric: "Could not send your message.",
  },
};

let container: HTMLDivElement;
let root: Root;

function render(open = true, onClose = vi.fn()) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TripSupportModal
        copy={copy}
        destination="Mendoza, Argentina"
        onClose={onClose}
        open={open}
        startDate="2026-08-22T00:00:00.000Z"
        tripId="trip-123"
        user={{ email: "traveler@example.com", name: "Ana Traveler" }}
      />,
    );
  });
}

function findButton(text: string): HTMLButtonElement | undefined {
  return Array.from(document.body.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  );
}

function findTextarea(): HTMLTextAreaElement | null {
  return document.body.querySelector("textarea");
}

/** React tracks the previous value via a hidden setter, so a plain
 * `textarea.value = x` + dispatch("input") is silently ignored. Using the
 * native prototype setter first is required to make React pick it up. */
function typeInto(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TripSupportModal", () => {
  it("disables send when the message is empty", () => {
    render();
    const sendButton = findButton("Send");
    expect(sendButton?.disabled).toBe(true);
  });

  it("enables send once the message has content, and disables it again while sending", async () => {
    const fetchMock = vi.fn(
      () => new Promise(() => {}), // never resolves, keeps "sending" state visible
    );
    vi.stubGlobal("fetch", fetchMock);

    render();
    const textarea = findTextarea();
    act(() => {
      typeInto(textarea!, "Can you help?");
    });

    const sendButton = findButton("Send");
    expect(sendButton?.disabled).toBe(false);

    act(() => {
      sendButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const sendingButton = findButton("Sending...");
    expect(sendingButton?.disabled).toBe(true);
  });

  it("shows the success state and sends the fixed interest + session identity in the POST body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render();
    const textarea = findTextarea();
    act(() => {
      typeInto(textarea!, "Can you confirm my transfer?");
    });

    await act(async () => {
      findButton("Send")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/contact",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.interest).toBe("Trip support");
    expect(body.name).toBe("Ana Traveler");
    expect(body.email).toBe("traveler@example.com");
    expect(body.message).toContain("Can you confirm my transfer?");
    expect(body.message).toContain("Trip ID: trip-123");

    expect(document.body.textContent).toContain("Message sent!");
  });

  it("shows a distinct error state when the response is not ok, and preserves the typed message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);

    render();
    const textarea = findTextarea();
    act(() => {
      typeInto(textarea!, "Question about my hotel");
    });

    await act(async () => {
      findButton("Send")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Could not send your message.");
    expect(findTextarea()?.value).toBe("Question about my hotel");
  });

  it("shows the error state on a network throw", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    render();
    const textarea = findTextarea();
    act(() => {
      typeInto(textarea!, "Hello?");
    });

    await act(async () => {
      findButton("Send")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Could not send your message.");
  });
});
