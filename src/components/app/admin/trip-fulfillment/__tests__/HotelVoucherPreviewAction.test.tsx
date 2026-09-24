import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { HotelVoucherPreviewAction } from "../HotelVoucherPreviewAction";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
const fetchMock = vi.fn();
const revoke = vi.fn();
const trip = {
  id: "trip-1",
  user: { name: "Ana", locale: "es" },
  startDate: "2026-10-01T00:00:00.000Z",
  endDate: "2026-10-03T00:00:00.000Z",
};
function button(text: string) {
  return [...document.querySelectorAll("button")].find(
    (node) => node.textContent === text,
  )!;
}
function edit(id: string, value: string) {
  const field = document.getElementById(id) as HTMLInputElement;
  act(() => {
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(field),
      "value",
    )!.set!.call(field, value);
    field.dispatchEvent(
      new Event(field.tagName === "SELECT" ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
}
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  fetchMock.mockReset();
  revoke.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:hotel");
      static revokeObjectURL = revoke;
    },
  );
  act(() =>
    root.render(
      <HotelVoucherPreviewAction
        countryLabels={{ AR: "Argentina" }}
        locale="en"
        trip={trip}
      />,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("opens a transient form with editable known trip snapshots, never provider claims", () => {
  act(() => button(en.hotelVoucherPreview.open).click());
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    en.hotelVoucherPreview.note,
  );
  expect(
    (document.getElementById("hotel-holder") as HTMLInputElement).value,
  ).toBe("Ana");
  expect(
    (document.getElementById("hotel-locale") as HTMLSelectElement).value,
  ).toBe("es");
  expect(
    (document.getElementById("hotel-checkInDate") as HTMLInputElement).value,
  ).toBe("2026-10-01");
  expect(
    (document.getElementById("hotel-property-name") as HTMLInputElement).value,
  ).toBe("");
  expect(
    (document.getElementById("hotel-paymentWording") as HTMLInputElement).value,
  ).toBe("");
});
it("previews the edited form, invalidates on edit, confirms discard and resets on reopening", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  act(() => button(en.hotelVoucherPreview.open).click());
  edit("hotel-country", "AR");
  edit("hotel-guests", "Ana y José");
  edit("hotel-property-name", "Hotel Río");
  edit("hotel-property-address", "Calle 1");
  fetchMock.mockResolvedValue(
    new Response(new Blob(["%PDF"], { type: "application/pdf" }), {
      headers: { "Content-Type": "application/pdf" },
    }),
  );
  await act(async () => button(en.hotelVoucherForm.submit).click());
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
    locale: "es",
    data: { guests: "Ana y José", property: { name: "Hotel Río" } },
  });
  expect(document.querySelector("iframe")?.getAttribute("src")).toBe(
    "blob:hotel",
  );
  edit("hotel-property-name", "Edited");
  expect(document.querySelector("iframe")).toBe(null);
  expect(revoke).toHaveBeenCalledWith("blob:hotel");
  act(() => button(en.hotelVoucherPreview.close).click());
  expect(confirm).toHaveBeenCalledWith(en.hotelVoucherPreview.discard);
  expect(document.querySelector('[role="dialog"]')).not.toBe(null);
  confirm.mockReturnValue(true);
  act(() => button(en.hotelVoucherPreview.close).click());
  expect(document.querySelector('[role="dialog"]')).toBe(null);
  act(() => button(en.hotelVoucherPreview.open).click());
  expect(
    (document.getElementById("hotel-property-name") as HTMLInputElement).value,
  ).toBe("");
});
it("shows localized request errors without leaking server details", async () => {
  act(() => button(en.hotelVoucherPreview.open).click());
  edit("hotel-country", "AR");
  edit("hotel-guests", "Ana");
  edit("hotel-property-name", "Hotel");
  edit("hotel-property-address", "Street");
  fetchMock.mockResolvedValue(new Response("secret", { status: 403 }));
  await act(async () => button(en.hotelVoucherForm.submit).click());
  expect(document.querySelector('[role="alert"]')?.textContent).toBe(
    en.hotelVoucherPreview.forbidden,
  );
  expect(document.body.textContent).not.toContain("secret");
});

it("allows closing a pending request and discards its late result", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  act(() => button(en.hotelVoucherPreview.open).click());
  edit("hotel-country", "AR");
  edit("hotel-guests", "Ana");
  edit("hotel-property-name", "Hotel");
  edit("hotel-property-address", "Street");
  let resolve!: (response: Response) => void;
  fetchMock.mockReturnValue(
    new Promise<Response>((done) => {
      resolve = done;
    }),
  );
  act(() => button(en.hotelVoucherForm.submit).click());
  expect(document.querySelector('[role="status"]')?.textContent).toBe(
    en.hotelVoucherPreview.pending,
  );
  act(() => button(en.hotelVoucherPreview.close).click());
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => {
    resolve(
      new Response("%PDF", { headers: { "Content-Type": "application/pdf" } }),
    );
  });
  expect(document.querySelector("iframe")).toBe(null);
  expect(document.querySelector('[role="dialog"]')).toBe(null);
});
it("guards tab unload only while dirty and removes the guard on close", () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  act(() => button(en.hotelVoucherPreview.open).click());
  const unload = () => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };
  expect(unload()).toBe(false);
  edit("hotel-guests", "Ana");
  expect(unload()).toBe(true);
  edit("hotel-guests", "");
  expect(unload()).toBe(false);
  edit("hotel-guests", "Ana");
  act(() => button(en.hotelVoucherPreview.close).click());
  expect(unload()).toBe(false);
});
