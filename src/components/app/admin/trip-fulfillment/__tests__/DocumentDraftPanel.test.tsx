import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { createTripDocumentSnapshot } from "@/lib/trip-documents/snapshots";
import type { TripDocumentDraftDto } from "@/lib/types/TripDocumentDraft";
import { DocumentDraftPanel } from "../DocumentDraftPanel";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const draft: TripDocumentDraftDto = {
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
const renderableDraft: TripDocumentDraftDto = {
  ...draft,
  document: {
    template: "hotel-voucher",
    templateVersion: 1,
    label: "Hotel",
    locale: "en",
    country: "AR",
    data: {
      holder: "Ana",
      guests: "Ana",
      checkInDate: "2026-10-01",
      checkOutDate: "2026-10-03",
      property: { name: "Hotel", address: "Street" },
      inclusions: [{ id: "breakfast", title: "Breakfast" }],
    },
  },
};
let root: Root;
let host: HTMLDivElement;
const fetchMock = vi.fn();
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
function button(label: string) {
  return [...document.querySelectorAll("button")].find(
    (node) => node.textContent === label,
  )!;
}
function edit(value: string) {
  const input = document.querySelector<HTMLInputElement>("input")!;
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
async function create(value = draft) {
  act(() => button(en.documentWorkflow.newDocument).click());
  fetchMock.mockResolvedValueOnce(response(value));
  await act(async () => button(en.documentDraftPanel.create).click());
}
it("starts with private drafts and explicit template selection rather than a creation form", () => {
  expect(host.textContent).toContain(en.documentWorkflow.privateDrafts);
  expect(host.querySelector("select")).toBeNull();
  act(() => button(en.documentWorkflow.newDocument).click());
  expect(document.querySelectorAll("select option")).toHaveLength(5);
});
it("saves incomplete content independently and exposes only one preview action", async () => {
  await create();
  edit("Saved incomplete");
  fetchMock.mockResolvedValueOnce(
    response({
      ...draft,
      revision: 2,
      document: { ...draft.document, label: "Saved incomplete" },
    }),
  );
  await act(async () => button(en.documentDraftEditor.save).click());
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).document.label).toBe(
    "Saved incomplete",
  );
  expect(document.querySelectorAll("button[type=submit]")).toHaveLength(0);
  await act(async () => button(en.documentWorkflow.savePreview).click());
  expect(
    document.querySelector('[name="label"]')?.getAttribute("aria-invalid"),
  ).toBeNull();
  expect(
    document
      .querySelector('[name="data.holder"]')
      ?.getAttribute("aria-invalid"),
  ).toBe("true");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it("saves current edits then renders only the adopted revision and enters review", async () => {
  await create(renderableDraft);
  edit("New title");
  fetchMock.mockResolvedValueOnce(
    response({
      ...renderableDraft,
      revision: 2,
      document: { ...renderableDraft.document, label: "New title" },
    }),
  );
  fetchMock.mockResolvedValueOnce(
    new Response("%PDF", {
      headers: {
        "content-type": "application/pdf",
        "x-document-preview-id": "019b76da-a800-7123-8123-123456789012",
        "x-document-revision": "2",
      },
    }),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:review");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
  dialog.scrollTop = 140;
  await act(async () => button(en.documentWorkflow.savePreview).click());
  expect(dialog.scrollTop).toBe(0);
  expect(fetchMock.mock.calls[1][1].method).toBe("PATCH");
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ revision: 2 });
  expect(document.querySelector("iframe")?.getAttribute("src")).toBe(
    "blob:review",
  );
  expect(button(en.documentWorkflow.backToEditing)).toBeTruthy();
  expect(button(en.documentDraftDelivery.attach)).toBeTruthy();
  dialog.scrollTop = 160;
  act(() => button(en.documentWorkflow.backToEditing).click());
  expect(dialog.scrollTop).toBe(0);
  expect(
    document.querySelector<HTMLInputElement>('[name="label"]')?.value,
  ).toBe("New title");
});
it("keeps conflicts editable and never renders after failed save", async () => {
  await create(renderableDraft);
  edit("Unsaved");
  fetchMock.mockResolvedValueOnce(response({}, 409));
  await act(async () => button(en.documentWorkflow.savePreview).click());
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(document.body.textContent).toContain(en.documentDraftPanel.conflict);
  expect(
    document.querySelector<HTMLInputElement>('[name="label"]')?.value,
  ).toBe("Unsaved");
});
it("guards dirty close and puts confirmed deletion in an overflow menu", async () => {
  await create();
  edit("Unsaved");
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  act(() => button(en.documentDraftEditor.close).click());
  expect(document.querySelector("form")).not.toBeNull();
  expect(document.querySelector("details")?.textContent).toContain(
    en.documentDraftPanel.delete,
  );
  act(() => button(en.documentDraftPanel.delete).click());
  expect(confirm).toHaveBeenLastCalledWith(en.documentDraftPanel.deleteConfirm);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
async function preview() {
  fetchMock.mockResolvedValueOnce(
    response({ ...renderableDraft, revision: 2 }),
  );
  fetchMock.mockResolvedValueOnce(
    new Response("%PDF", {
      headers: {
        "content-type": "application/pdf",
        "x-document-preview-id": "019b76da-a800-7123-8123-123456789012",
        "x-document-revision": "2",
      },
    }),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:review");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  await act(async () => button(en.documentWorkflow.savePreview).click());
}
it("attaches reviewed bytes, reports refresh failure, and prevents republishing with a changed identity", async () => {
  const attached = vi.fn().mockResolvedValue(false);
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
  await create(renderableDraft);
  await preview();
  fetchMock.mockResolvedValueOnce(response({ documentId: "published" }));
  fetchMock.mockResolvedValueOnce(
    response({
      drafts: [
        {
          ...renderableDraft,
          revision: 2,
          documentId: "published",
          publishedRevision: 2,
        },
      ],
      candidates: { hotel: [], activity: [], dinner: [] },
    }),
  );
  await act(async () => button(en.documentDraftDelivery.attach).click());
  expect(fetchMock.mock.calls[3][1].body).toBeInstanceOf(Blob);
  expect(attached).toHaveBeenCalledOnce();
  expect(document.body.textContent).toContain(en.documentWorkflow.refreshError);
  expect(button(en.documentDraftDelivery.attached).disabled).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(5);
  attached.mockResolvedValue(true);
  await act(async () => button(en.documentWorkflow.retry).click());
  expect(document.body.textContent).not.toContain(
    en.documentWorkflow.refreshError,
  );
});
it("keeps preview errors and nested server validation in the editor", async () => {
  await create(renderableDraft);
  fetchMock.mockResolvedValueOnce(
    response({ ...renderableDraft, revision: 2 }),
  );
  fetchMock.mockResolvedValueOnce(
    response(
      { errors: [{ path: "data.inclusions.0.title", code: "required" }] },
      422,
    ),
  );
  await act(async () => button(en.documentWorkflow.savePreview).click());
  const field = document.querySelector('[name="data.inclusions.0.title"]');
  expect(field?.getAttribute("aria-invalid")).toBe("true");
  expect(document.activeElement).toBe(field);
  edit("changed");
  expect(field?.getAttribute("aria-invalid")).toBeNull();
});
it("reconciles linked rows when drafts load, without creating a new draft", async () => {
  const ensure = vi.fn().mockResolvedValue(true);
  fetchMock.mockResolvedValueOnce(
    response({
      drafts: [{ ...draft, documentId: "published" }],
      candidates: { hotel: [], activity: [], dinner: [] },
    }),
  );
  await act(async () =>
    root.render(
      <DocumentDraftPanel
        autoLoad
        countryLabels={{ AR: "Argentina" }}
        locale="en"
        onEnsureAttached={ensure}
        tripId="trip"
      />,
    ),
  );
  expect(ensure).toHaveBeenCalledWith("published");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(host.querySelector("[data-open-draft]")).not.toBeNull();
});
it.each([en, es])(
  "uses translated workflow labels and keeps creation disabled after failed source loading",
  async (dictionary) => {
    fetchMock.mockResolvedValueOnce(response({}, 503));
    await act(async () =>
      root.render(
        <DocumentDraftPanel
          autoLoad
          countryLabels={{ AR: "Argentina" }}
          locale={dictionary === en ? "en" : "es"}
          tripId="trip"
        />,
      ),
    );
    act(() => button(dictionary.documentWorkflow.newDocument).click());
    expect(button(dictionary.documentDraftPanel.create).disabled).toBe(true);
    expect(document.body.textContent).toContain(
      dictionary.documentDraftPanel.error,
    );
    fetchMock.mockResolvedValueOnce(
      response({
        drafts: [],
        candidates: { hotel: [], activity: [], dinner: [] },
      }),
    );
    await act(async () => button(dictionary.documentDraftPanel.load).click());
    expect(button(dictionary.documentDraftPanel.create).disabled).toBe(false);
  },
);
it("closes dirty editor with only one confirmed prompt", async () => {
  await create();
  edit("dirty");
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  act(() => button(en.documentDraftEditor.close).click());
  expect(confirm).toHaveBeenCalledOnce();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
it("requires confirmation before replacing an existing attached document", async () => {
  await create({
    ...renderableDraft,
    documentId: "existing",
    publishedRevision: 1,
  });
  fetchMock.mockResolvedValueOnce(
    response({
      ...renderableDraft,
      revision: 2,
      documentId: "existing",
      publishedRevision: 1,
    }),
  );
  fetchMock.mockResolvedValueOnce(
    new Response("%PDF", {
      headers: {
        "content-type": "application/pdf",
        "x-document-preview-id": "019b76da-a800-7123-8123-123456789012",
        "x-document-revision": "2",
      },
    }),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:review");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  await act(async () => button(en.documentWorkflow.savePreview).click());
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  act(() => button(en.documentDraftDelivery.replace).click());
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(confirm).toHaveBeenCalledWith(en.documentDraftDelivery.confirmReplace);
  confirm.mockReturnValue(true);
  fetchMock.mockResolvedValueOnce(response({ documentId: "existing" }));
  fetchMock.mockResolvedValueOnce(
    response({
      drafts: [],
      candidates: { hotel: [], activity: [], dinner: [] },
    }),
  );
  await act(async () => button(en.documentDraftDelivery.replace).click());
  expect(fetchMock.mock.calls[3][1].headers["X-Document-Replace-Id"]).toBe(
    "existing",
  );
  expect(document.body.textContent).toContain(
    en.documentDraftDelivery.memoryNotice,
  );
});
it("deletes only a confirmed draft and leaves the attached document untouched", async () => {
  await create({ ...draft, documentId: "existing" });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  fetchMock.mockResolvedValueOnce(response({ deleted: true }));
  await act(async () => button(en.documentDraftPanel.delete).click());
  expect(fetchMock.mock.calls[1][0]).toBe(
    "/api/admin/trip-requests/trip/document-drafts/draft",
  );
  expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
