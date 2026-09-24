import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { ActivityVoucherPreviewAction } from "../ActivityVoucherPreviewAction";
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
      static createObjectURL = vi.fn(() => "blob:activity");
      static revokeObjectURL = revoke;
    },
  );
  act(() =>
    root.render(
      <ActivityVoucherPreviewAction
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
  act(() => button(en.activityVoucherPreview.open).click());
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    en.activityVoucherPreview.note,
  );
  expect(
    (document.getElementById("activity-holder") as HTMLInputElement).value,
  ).toBe("Ana");
  expect(
    (document.getElementById("activity-locale") as HTMLSelectElement).value,
  ).toBe("es");
  expect(
    (document.getElementById("activity-date") as HTMLInputElement).value,
  ).toBe("2026-10-01");
  expect(
    (document.getElementById("activity-provider-name") as HTMLInputElement)
      .value,
  ).toBe("");
  expect(
    (document.getElementById("activity-paymentWording") as HTMLInputElement)
      .value,
  ).toBe("");
});
it("previews the edited form, invalidates on edit, confirms discard and resets on reopening", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  act(() => button(en.activityVoucherPreview.open).click());
  edit("activity-country", "AR");
  edit("activity-participants", "Ana y José");
  edit("activity-provider-name", "Río Spa");
  edit("activity-provider-address", "Calle 1");
  fillProgram();
  fetchMock.mockResolvedValue(
    new Response(new Blob(["%PDF"], { type: "application/pdf" }), {
      headers: { "Content-Type": "application/pdf" },
    }),
  );
  await act(async () => button(en.hotelVoucherForm.submit).click());
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
    locale: "es",
    data: { participants: "Ana y José", provider: { name: "Río Spa" } },
  });
  expect(document.querySelector("iframe")?.getAttribute("src")).toBe(
    "blob:activity",
  );
  edit("activity-provider-name", "Edited");
  expect(document.querySelector("iframe")).toBe(null);
  expect(revoke).toHaveBeenCalledWith("blob:activity");
  act(() => button(en.hotelVoucherPreview.close).click());
  expect(confirm).toHaveBeenCalledWith(en.activityVoucherPreview.discard);
  expect(document.querySelector('[role="dialog"]')).not.toBe(null);
  confirm.mockReturnValue(true);
  act(() => button(en.hotelVoucherPreview.close).click());
  expect(document.querySelector('[role="dialog"]')).toBe(null);
  act(() => button(en.activityVoucherPreview.open).click());
  expect(
    (document.getElementById("activity-provider-name") as HTMLInputElement)
      .value,
  ).toBe("");
});
it("shows localized request errors without leaking server details", async () => {
  act(() => button(en.activityVoucherPreview.open).click());
  edit("activity-country", "AR");
  edit("activity-participants", "Ana");
  edit("activity-provider-name", "Hotel");
  edit("activity-provider-address", "Street");
  fillProgram();
  fetchMock.mockResolvedValue(new Response("secret", { status: 403 }));
  await act(async () => button(en.hotelVoucherForm.submit).click());
  expect(document.querySelector('[role="alert"]')?.textContent).toBe(
    en.hotelVoucherPreview.forbidden,
  );
  expect(document.body.textContent).not.toContain("secret");
});

it("allows closing a pending request and discards its late result", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  act(() => button(en.activityVoucherPreview.open).click());
  edit("activity-country", "AR");
  edit("activity-participants", "Ana");
  edit("activity-provider-name", "Hotel");
  edit("activity-provider-address", "Street");
  fillProgram();
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
  act(() => button(en.activityVoucherPreview.open).click());
  const unload = () => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };
  expect(unload()).toBe(false);
  edit("activity-participants", "Ana");
  expect(unload()).toBe(true);
  edit("activity-participants", "");
  expect(unload()).toBe(false);
  edit("activity-participants", "Ana");
  act(() => button(en.hotelVoucherPreview.close).click());
  expect(unload()).toBe(false);
});

function fillProgram() {
  edit("activity-time", "10:00");
  act(() =>
    document
      .querySelector<HTMLButtonElement>(
        '[data-item-section="program"] button[data-add]',
      )!
      .click(),
  );
  edit(
    document.querySelector<HTMLInputElement>(
      '[data-item-section="program"] input[data-item-title]',
    )!.id,
    "Circuito de agua",
  );
}
