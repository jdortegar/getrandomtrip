import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { createTripDocumentSnapshot } from "@/lib/trip-documents/snapshots";
import { DocumentDraftPanel } from "../DocumentDraftPanel";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const draft = {
  id: "draft",
  tripRequestId: "trip",
  revision: 1,
  document: createTripDocumentSnapshot("hotel-voucher", {}),
  documentId: null,
  publishedRevision: null,
  previewId: null,
  createdAt: "now",
  updatedAt: "now",
};
let root: Root;
let host: HTMLDivElement;
const fetchMock = vi.fn();
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
function button(label: string) {
  return [...host.querySelectorAll("button")].find(
    (node) => node.textContent === label,
  )!;
}
function edit(value: string) {
  const input = host.querySelector<HTMLInputElement>("input")!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  act(() =>
    root.render(
      <DocumentDraftPanel
        countryLabels={{ AR: "Argentina" }}
        locale="en"
        tripId="trip"
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
it("loads, creates and saves incomplete draft independently", async () => {
  fetchMock.mockResolvedValueOnce(
    response({
      drafts: [],
      candidates: { hotel: [], activity: [], dinner: [] },
    }),
  );
  await act(async () => button(en.documentDraftPanel.load).click());
  expect(host.querySelectorAll("select option")).toHaveLength(5);
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => button(en.documentDraftPanel.create).click());
  edit("Saved incomplete");
  fetchMock.mockResolvedValueOnce(
    response({
      ...draft,
      revision: 2,
      document: { ...draft.document, label: "Saved incomplete" },
    }),
  );
  await act(async () => button(en.documentDraftEditor.save).click());
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({
    revision: 1,
    document: { label: "Saved incomplete" },
  });
  expect(host.textContent).toContain(en.documentDraftPanel.saved);
});
it("preserves conflicts until explicit confirmed reload and guards switching", async () => {
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => button(en.documentDraftPanel.create).click());
  edit("My edits");
  fetchMock.mockResolvedValueOnce(response({}, 409));
  await act(async () => button(en.documentDraftEditor.save).click());
  expect(host.textContent).toContain(en.documentDraftPanel.conflict);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  act(() => button(en.documentDraftPanel.reload).click());
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(host.querySelector<HTMLInputElement>("input")!.value).toBe("My edits");
  act(() => button(en.documentDraftPanel.create).click());
  expect(fetchMock).toHaveBeenCalledTimes(2);
  confirm.mockReturnValue(true);
  fetchMock.mockResolvedValueOnce(response({ ...draft, revision: 2 }));
  await act(async () => button(en.documentDraftPanel.reload).click());
  expect(host.querySelector<HTMLInputElement>("input")!.value).toBe("");
});
it("reopens listed drafts and never offers attachment", async () => {
  fetchMock.mockResolvedValueOnce(
    response({
      drafts: [draft],
      candidates: { hotel: [], activity: [], dinner: [] },
    }),
  );
  await act(async () => button(en.documentDraftPanel.load).click());
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () =>
    host.querySelector<HTMLButtonElement>("button[data-open-draft]")!.click(),
  );
  expect(fetchMock.mock.calls[1][0]).toContain("/document-drafts/draft");
  expect(host.textContent).not.toContain("Attach");
});
it("previews saved bytes, confirms replacement and refreshes attachment list", async () => {
  const attached = vi.fn();
  act(() =>
    root.render(
      <DocumentDraftPanel
        countryLabels={{ AR: "Argentina" }}
        locale="en"
        onAttached={attached}
        tripId="trip"
      />,
    ),
  );
  fetchMock.mockResolvedValueOnce(
    response({ ...draft, documentId: "document", publishedRevision: 1 }),
  );
  await act(async () => button(en.documentDraftPanel.create).click());
  fetchMock
    .mockResolvedValueOnce(response({ previewId: "preview", revision: 1 }))
    .mockResolvedValueOnce(
      new Response("%PDF", { headers: { "content-type": "application/pdf" } }),
    );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:stored");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  await act(async () => button(en.documentDraftDelivery.preview).click());
  expect(host.querySelector("iframe")?.getAttribute("src")).toBe("blob:stored");
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  act(() => button(en.documentDraftDelivery.replace).click());
  expect(fetchMock).toHaveBeenCalledTimes(3);
  confirm.mockReturnValue(true);
  fetchMock.mockResolvedValueOnce(response({ documentId: "document" }));
  await act(async () => button(en.documentDraftDelivery.replace).click());
  expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toMatchObject({
    replaceDocumentId: "document",
  });
  expect(attached).toHaveBeenCalledOnce();
});
it("requires saving dirty fields before rendering", async () => {
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => button(en.documentDraftPanel.create).click());
  edit("Unsaved");
  expect(button(en.documentDraftDelivery.preview).disabled).toBe(true);
  expect(host.textContent).toContain(en.documentDraftDelivery.saveFirst);
});
it("keeps a newly attached link across rerender and requires confirmed replacement", async () => {
  const attached = vi.fn();
  act(() =>
    root.render(
      <DocumentDraftPanel
        countryLabels={{ AR: "Argentina" }}
        locale="en"
        onAttached={attached}
        tripId="trip"
      />,
    ),
  );
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => button(en.documentDraftPanel.create).click());
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:stored");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const render = async () => {
    fetchMock
      .mockResolvedValueOnce(response({ previewId: "preview", revision: 1 }))
      .mockResolvedValueOnce(
        new Response("%PDF", {
          headers: { "content-type": "application/pdf" },
        }),
      );
    await act(async () => button(en.documentDraftDelivery.preview).click());
  };
  await render();
  fetchMock.mockResolvedValueOnce(response({ documentId: "published" }));
  await act(async () => button(en.documentDraftDelivery.attach).click());
  await render();
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  act(() => button(en.documentDraftDelivery.replace).click());
  expect(confirm).toHaveBeenCalled();
  confirm.mockReturnValue(true);
  fetchMock.mockResolvedValueOnce(response({ documentId: "published" }));
  await act(async () => button(en.documentDraftDelivery.replace).click());
  expect(JSON.parse(fetchMock.mock.calls.at(-1)![1].body)).toMatchObject({
    replaceDocumentId: "published",
  });
  expect(attached).toHaveBeenCalledTimes(2);
});
