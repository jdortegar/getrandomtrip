import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { AddTripDocumentForm } from "../AddTripDocumentForm";
import { TripDocumentsTable } from "../TripDocumentsTable";
import { useAttachedDocumentActions } from "../useAttachedDocumentActions";
import type { TripDocumentDTO } from "@/types/tripDocument";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
const fetchMock = vi.fn();
const removed = vi.fn();
const rows = ["one", "two"].map(
  (id) =>
    ({
      id,
      label: id,
      country: "AR",
      mimeType: "application/pdf",
      originalFilename: `${id}.pdf`,
      createdAt: "2026-10-01",
      href: `/view/${id}`,
      downloadHref: `/download/${id}`,
    }) as TripDocumentDTO,
);
function Harness({ tripId = "trip" }) {
  const [documents, setDocuments] = useState(rows);
  const actions = useAttachedDocumentActions({
    tripId,
    errors: en.adminTripFulfillment.errors,
    replace: setDocuments,
    onRemoved: removed,
  });
  return (
    <>
      <AddTripDocumentForm
        copy={en.adminTripFulfillment}
        countryLabels={{ AR: "Argentina" }}
        disabled={actions.busy}
        errorMessage={actions.error?.message ?? null}
        onSubmit={actions.upload}
        submitting={actions.operation?.kind === "upload"}
      />
      <TripDocumentsTable
        busy={actions.busy}
        copy={en.adminTripFulfillment}
        countryLabels={{ AR: "Argentina" }}
        documents={documents}
        onRemove={(id) => void actions.remove(id)}
        removingId={
          actions.operation?.kind === "remove"
            ? (actions.operation.id ?? null)
            : null
        }
      />
    </>
  );
}
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  fetchMock.mockReset();
  removed.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
function fill() {
  act(() => {
    const label = host.querySelector<HTMLInputElement>("#add-document-label")!;
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(label),
      "value",
    )!.set!.call(label, "My voucher");
    label.dispatchEvent(new Event("input", { bubbles: true }));
    const country = host.querySelector<HTMLSelectElement>(
      "#add-document-country",
    )!;
    country.value = "AR";
    country.dispatchEvent(new Event("change", { bubbles: true }));
    const file = host.querySelector<HTMLInputElement>("#add-document-file")!;
    Object.defineProperty(file, "files", {
      value: [new File(["%PDF"], "voucher.pdf", { type: "application/pdf" })],
      configurable: true,
    });
    file.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
it.each(["rejection", "response"])(
  "keeps failed upload input after %s and supports duplicate-safe retry",
  async (failure) => {
    fill();
    let finish!: (value: Response) => void;
    let fail!: (error: Error) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve, reject) => {
        finish = resolve;
        fail = reject;
      }),
    );
    const upload = host.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    )!;
    act(() => {
      upload.click();
      upload.click();
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(upload.getAttribute("aria-busy")).toBe("true");
    expect(upload.textContent).toBe(
      en.adminTripFulfillment.addDocument.submitting,
    );
    expect(upload.querySelector(".animate-spin")).not.toBeNull();
    expect(
      host.querySelector<HTMLButtonElement>('button[title="Remove"]')?.disabled,
    ).toBe(true);
    await act(async () =>
      failure === "rejection"
        ? fail(new Error("network"))
        : finish(
            new Response(JSON.stringify({ error: "invalid_request" }), {
              status: 400,
            }),
          ),
    );
    expect(upload.disabled).toBe(false);
    expect(
      host.querySelector<HTMLInputElement>("#add-document-label")?.value,
    ).toBe("My voucher");
    expect(
      host.querySelector<HTMLInputElement>("#add-document-file")?.files?.[0]
        ?.name,
    ).toBe("voucher.pdf");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ document: { ...rows[0], id: "new" } })),
    );
    await act(async () => upload.click());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      host.querySelector<HTMLInputElement>("#add-document-label")?.value,
    ).toBe("");
    expect(upload.getAttribute("aria-busy")).toBe("false");
  },
);
it("spins only the clicked remove row, disables competing actions, and retries failure", async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  const buttons = [
    ...host.querySelectorAll<HTMLButtonElement>(
      `button[title="${en.adminTripFulfillment.remove}"]`,
    ),
  ];
  act(() => {
    buttons[0].click();
    buttons[1].click();
    buttons[0].click();
  });
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(buttons[0].textContent).toBe(en.adminTripFulfillment.removing);
  expect(buttons[0].querySelector(".animate-spin")).not.toBeNull();
  expect(buttons[1].getAttribute("aria-busy")).toBe("false");
  expect(buttons[1].disabled).toBe(true);
  await act(async () => finish(new Response("unavailable", { status: 503 })));
  expect(host.querySelectorAll("tbody tr")).toHaveLength(2);
  expect(buttons[0].disabled).toBe(false);
  fetchMock.mockResolvedValueOnce(new Response("{}"));
  await act(async () => buttons[0].click());
  expect(host.querySelectorAll("tbody tr")).toHaveLength(1);
  expect(removed).toHaveBeenCalledOnce();
});
it("ignores an upload completion after switching trips", async () => {
  fill();
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() =>
    host.querySelector<HTMLButtonElement>('button[type="submit"]')!.click(),
  );
  const signal = fetchMock.mock.calls[0][1].signal;
  act(() => root.render(<Harness tripId="other" />));
  expect(signal.aborted).toBe(true);
  await act(async () =>
    finish(
      new Response(JSON.stringify({ document: { ...rows[0], id: "late" } })),
    ),
  );
  expect(host.querySelectorAll("tbody tr")).toHaveLength(2);
});
