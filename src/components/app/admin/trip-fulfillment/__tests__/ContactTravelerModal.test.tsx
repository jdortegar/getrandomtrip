import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { ContactTravelerModal } from "../ContactTravelerModal";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
let props: ComponentProps<typeof ContactTravelerModal>;
function render(overrides: Partial<typeof props> = {}) {
  props = { ...props, ...overrides };
  act(() => root.render(<ContactTravelerModal {...props} />));
}
const subject = () =>
  document.querySelector<HTMLInputElement>("#contact-subject")!;
const body = () =>
  document.querySelector<HTMLTextAreaElement>("#contact-body")!;
function button(text: string) {
  return [...document.querySelectorAll("button")].find(
    (el) => el.textContent === text,
  )!;
}
function edit(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(
      element,
      value,
    );
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  props = {
    copy: en.adminTripFulfillment,
    onClose: vi.fn(),
    open: true,
    tripId: "trip-1",
    traveler: { email: "ana@example.com", name: "Ana", locale: "es" },
  };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Unexpected request")),
  );
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("ContactTravelerModal compose session", () => {
  it.each(["es", "en"] as const)(
    "prefills in recipient %s with independent admin copy",
    (locale) => {
      render({ traveler: { ...props.traveler, locale } });
      const prefill = (locale === "en" ? en : es).adminTripFulfillment
        .contactModal;
      expect(subject().value).toBe(prefill.prefillSubject);
      expect(body().value).toBe(
        prefill.prefillBody.replace("{{userName}}", "Ana"),
      );
      expect(document.body.textContent).toContain(
        en.adminTripFulfillment.contactModal.title,
      );
      expect(button(props.copy.contactModal.send).disabled).toBe(false);
    },
  );

  it("resets on name or raw locale changes, not email/trip/copy/object refresh", () => {
    render();
    edit(subject(), "My subject");
    edit(body(), "My message");
    render({
      copy: es.adminTripFulfillment,
      tripId: "trip-2",
      traveler: { ...props.traveler, email: "new@example.com" },
    });
    expect(subject().value).toBe("My subject");
    expect(body().value).toBe("My message");
    expect(document.body.textContent).toContain("new@example.com");
    render({ traveler: { ...props.traveler, name: "Bea" } });
    expect(body().value).toBe(
      es.adminTripFulfillment.contactModal.prefillBody.replace(
        "{{userName}}",
        "Bea",
      ),
    );
    edit(body(), "Another draft");
    render({ traveler: { ...props.traveler, locale: null } });
    expect(body().value).toBe(
      es.adminTripFulfillment.contactModal.prefillBody.replace(
        "{{userName}}",
        "Bea",
      ),
    );
    render({ traveler: { ...props.traveler, locale: "en" } });
    expect(subject().value).toBe(
      en.adminTripFulfillment.contactModal.prefillSubject,
    );
  });

  it.each([true, false])(
    "preserves edits and sending through refresh, resets status on reopen (ok: %s)",
    async (ok) => {
      let finish!: (value: unknown) => void;
      const fetchMock = vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      vi.stubGlobal("fetch", fetchMock);
      render();
      edit(subject(), "  Custom subject  ");
      edit(body(), "  Custom body  ");
      act(() => button(props.copy.contactModal.send).click());
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/trip-requests/trip-1/contact",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            subject: "Custom subject",
            body: "Custom body",
          }),
        }),
      );
      render({
        tripId: "trip-2",
        traveler: { ...props.traveler, email: "new@example.com" },
      });
      expect(button(props.copy.contactModal.sending).disabled).toBe(true);
      expect(subject().value).toBe("  Custom subject  ");
      await act(async () =>
        finish({ ok, json: async () => ({ error: "send_failed" }) }),
      );
      const status = ok
        ? props.copy.contactModal.successTitle
        : props.copy.errors.send_failed;
      expect(document.body.textContent).toContain(status);
      if (!ok) expect(body().value).toBe("  Custom body  ");
      render({ open: false });
      render({ open: true });
      expect(subject().value).toBe(
        es.adminTripFulfillment.contactModal.prefillSubject,
      );
      expect(document.body.textContent).not.toContain(status);
      expect(button(props.copy.contactModal.send).disabled).toBe(false);
    },
  );
});

it("seeds the latest recipient on opening and preserves pending completion after a name reset", async () => {
  let finish!: (value: unknown) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    ),
  );
  render({ open: false });
  render({ traveler: { ...props.traveler, name: "Bea", locale: "en" } });
  render({ open: true });
  expect(body().value).toBe(
    en.adminTripFulfillment.contactModal.prefillBody.replace(
      "{{userName}}",
      "Bea",
    ),
  );
  edit(subject(), " ");
  expect(button(props.copy.contactModal.send).disabled).toBe(true);
  edit(subject(), "Question");
  act(() => button(props.copy.contactModal.send).click());
  render({ traveler: { ...props.traveler, name: "Cara" } });
  expect(body().value).toBe(
    en.adminTripFulfillment.contactModal.prefillBody.replace(
      "{{userName}}",
      "Cara",
    ),
  );
  expect(button(props.copy.contactModal.send).disabled).toBe(false);
  await act(async () => finish({ ok: true }));
  expect(document.body.textContent).toContain(
    props.copy.contactModal.successTitle,
  );
});
