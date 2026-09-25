import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { createTripDocumentSnapshot } from "@/lib/trip-documents/snapshots";
import type { TripDocumentDraftDto } from "@/lib/types/TripDocumentDraft";
import type { TripDocumentSourceSelection } from "@/lib/types/TripDocumentSource";
import { DocumentDraftPanel } from "../DocumentDraftPanel";
import { loadPdfPreview } from "@/lib/trip-documents/client/loadPdfPreview";
vi.mock("@/lib/trip-documents/client/loadPdfPreview", () => ({
  loadPdfPreview: vi.fn(() => new Promise(() => {})),
}));
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
const previewDrafts: TripDocumentDraftDto[] = [
  renderableDraft,
  {
    ...draft,
    document: {
      template: "activity-voucher",
      templateVersion: 1,
      locale: "en",
      label: "Activity",
      country: "AR",
      data: {
        holder: "Ana",
        participants: "Ana",
        date: "2026-10-01",
        time: "12:00",
        provider: { name: "Guide", address: "Street" },
        program: [{ id: "one", title: "Walk", description: "River" }],
      },
    },
  },
  {
    ...draft,
    document: {
      template: "dinner-voucher",
      templateVersion: 1,
      locale: "en",
      label: "Dinner",
      country: "AR",
      data: {
        guests: "Ana",
        date: "2026-10-01",
        time: "20:00",
        restaurant: { name: "Restaurant", address: "Street" },
        service: "Dinner",
        menuItems: [],
      },
    },
  },
  {
    ...draft,
    document: {
      template: "experience-roadmap",
      templateVersion: 1,
      locale: "en",
      label: "Roadmap",
      country: "AR",
      data: {
        origin: "Rosario",
        destination: "Mendoza",
        startDate: "2026-10-01",
        endDate: "2026-10-02",
        duration: "Two days",
        heading: "Trip",
        activities: [{ id: "one", title: "Walk", description: "River" }],
      },
    },
  },
  {
    ...draft,
    document: {
      template: "xsed-roadmap",
      templateVersion: 1,
      locale: "en",
      label: "Sunday",
      country: "AR",
      data: {
        origin: "Rosario",
        destination: "Areco",
        departureDate: "2026-10-01",
        departureTime: "12:00",
        drivingDuration: "One hour",
        stops: [{ id: "one", title: "Walk", directions: "River" }],
      },
    },
  },
];
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
  act(() => {
    const select =
      document.querySelector<HTMLSelectElement>("#document-template")!;
    select.value = value.document.template;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  fetchMock.mockResolvedValueOnce(response(value));
  await act(async () => button(en.documentDraftPanel.create).click());
}
it("starts with private drafts and explicit template selection rather than a creation form", () => {
  expect(host.textContent).toContain(en.documentWorkflow.privateDrafts);
  expect(host.querySelector("select")).toBeNull();
  act(() => button(en.documentWorkflow.newDocument).click());
  expect(document.querySelectorAll("select option")).toHaveLength(5);
});
it("shows only Create pending, rejects duplicates, and enables retry after failure", async () => {
  act(() => button(en.documentWorkflow.newDocument).click());
  let fail!: (error: Error) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((_resolve, reject) => {
      fail = reject;
    }),
  );
  const create = button(en.documentDraftPanel.create);
  act(() => {
    create.click();
    create.click();
  });
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(create.textContent).toBe(en.documentActions.creating);
  expect(create.getAttribute("aria-busy")).toBe("true");
  expect(create.querySelector(".animate-spin")).not.toBeNull();
  expect(
    button(en.documentDraftEditor.close).querySelector(".animate-spin"),
  ).toBeNull();
  await act(async () => fail(new Error("offline")));
  expect(button(en.documentDraftPanel.create).disabled).toBe(false);
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => button(en.documentDraftPanel.create).click());
  expect(document.querySelector("form")).not.toBeNull();
});
it.each(
  previewDrafts.map((value) => [value.document.template, value] as const),
)(
  "shows only Save pending for %s and preserves fields on rejection",
  async (_template, value) => {
    await create(value);
    edit("Retain edits");
    let fail!: (error: Error) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((_resolve, reject) => {
        fail = reject;
      }),
    );
    const save = button(en.documentDraftEditor.save);
    act(() => {
      save.click();
      save.click();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(save.textContent).toBe(en.documentActions.saving);
    expect(save.getAttribute("aria-busy")).toBe("true");
    expect(save.querySelector(".animate-spin")).not.toBeNull();
    expect(
      button(en.documentWorkflow.savePreview).getAttribute("aria-busy"),
    ).toBe("false");
    expect(button(en.documentWorkflow.savePreview).disabled).toBe(true);
    await act(async () => fail(new Error("offline")));
    expect(
      document.querySelector<HTMLInputElement>('[name="label"]')?.value,
    ).toBe("Retain edits");
    expect(button(en.documentDraftEditor.save).disabled).toBe(false);
  },
);
it("tracks list, target-only opening, reload and delete with failure recovery", async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() => button(en.documentDraftPanel.load).click());
  expect(button(en.documentActions.loading).getAttribute("aria-busy")).toBe(
    "true",
  );
  await act(async () =>
    finish(
      response({
        drafts: [
          draft,
          {
            ...draft,
            id: "other",
            document: { ...draft.document, label: "Other draft" },
          },
        ],
        candidates: { hotel: [], activity: [], dinner: [] },
      }),
    ),
  );
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() =>
    (host.querySelector("[data-open-draft]") as HTMLButtonElement).click(),
  );
  expect(
    button(en.documentActions.opening).querySelector(".animate-spin"),
  ).not.toBeNull();
  expect(button("Other draft").disabled).toBe(true);
  expect(button("Other draft").getAttribute("aria-busy")).toBe("false");
  await act(async () => finish(response(draft)));
  fetchMock.mockResolvedValueOnce(response({}, 409));
  await act(async () => button(en.documentDraftEditor.save).click());
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() => button(en.documentDraftPanel.reload).click());
  expect(button(en.documentActions.reloading).getAttribute("aria-busy")).toBe(
    "true",
  );
  await act(async () => finish(response(draft)));
  vi.spyOn(window, "confirm").mockReturnValue(true);
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() => button(en.documentDraftPanel.delete).click());
  expect(
    button(en.documentActions.deleting).querySelector(".animate-spin"),
  ).not.toBeNull();
  await act(async () => finish(response({}, 503)));
  expect(button(en.documentDraftPanel.delete).disabled).toBe(false);
  fetchMock.mockResolvedValueOnce(response({ deleted: true }));
  await act(async () => button(en.documentDraftPanel.delete).click());
  expect(document.querySelector("form")).toBeNull();
});
function renderSource(
  experienceId: string | null,
  status: TripDocumentSourceSelection["status"] = "ready",
) {
  act(() =>
    root.render(
      <DocumentDraftPanel
        countryLabels={{ AR: "Argentina" }}
        locale="en"
        tripId="trip"
        source={{
          key: JSON.stringify(experienceId),
          experienceId,
          status,
          retry: vi.fn(),
          context:
            status === "ready"
              ? {
                  experienceItinerary: null,
                  candidates: {
                    hotel: experienceId
                      ? [
                          {
                            index: 0,
                            role: "hotel",
                            title: `${experienceId} hotel`,
                            provider: {
                              name: experienceId,
                              address: "Address",
                            },
                          },
                        ]
                      : [],
                    activity: [],
                    dinner: [],
                  },
                }
              : null,
        }}
      />,
    ),
  );
}
it("resets provider choice on selection change and creates only from the new source", async () => {
  renderSource("A");
  act(() => button(en.documentWorkflow.newDocument).click());
  act(() => {
    const select = document.querySelector<HTMLSelectElement>(
      "#document-source-provider",
    )!;
    select.value = "0";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  renderSource("B", "loading");
  expect(button(en.documentDraftPanel.create).disabled).toBe(true);
  expect(document.body.textContent).not.toContain("A hotel");
  renderSource("B");
  expect(
    document.querySelector<HTMLSelectElement>("#document-source-provider")
      ?.value,
  ).toBe("");
  expect(document.body.textContent).toContain("B hotel");
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => button(en.documentDraftPanel.create).click());
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    template: "hotel-voucher",
    experienceId: "B",
  });
});
it("preserves dirty PDF fields through source selection, clear and failure", async () => {
  renderSource("A");
  await create();
  edit("Manual draft");
  for (const [id, status] of [
    ["B", "loading"],
    ["B", "error"],
    [null, "ready"],
  ] as const) {
    renderSource(id, status);
    expect(
      document.querySelector<HTMLInputElement>('[name="label"]')?.value,
    ).toBe("Manual draft");
  }
  expect(fetchMock).toHaveBeenCalledTimes(1);
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
  expect(loadPdfPreview).toHaveBeenCalledWith(
    "blob:review",
    expect.any(AbortSignal),
  );
  expect(dialog.classList.contains("h-[92dvh]")).toBe(true);
  expect(dialog.classList.contains("overflow-hidden")).toBe(true);
  expect(dialog.classList.contains("overflow-y-auto")).toBe(false);
  const review = document.querySelector(
    '[data-component="DocumentDraftReview"]',
  )!;
  expect(review.classList.contains("min-h-0")).toBe(true);
  expect(review.classList.contains("flex-1")).toBe(true);
  const frame = review.querySelector('[data-component="DocumentPdfPreview"]')!;
  expect(frame.classList.contains("h-full")).toBe(true);
  expect(frame.parentElement?.classList.contains("overflow-hidden")).toBe(true);
  expect(frame.parentElement?.classList.contains("min-h-48")).toBe(true);
  expect(
    button(en.documentWorkflow.backToEditing).parentElement?.classList.contains(
      "shrink-0",
    ),
  ).toBe(true);
  expect(
    button(en.documentWorkflow.backToEditing).parentElement?.classList.contains(
      "sticky",
    ),
  ).toBe(false);
  expect(button(en.documentWorkflow.backToEditing)).toBeTruthy();
  expect(button(en.documentDraftDelivery.attach)).toBeTruthy();
  dialog.scrollTop = 160;
  act(() => button(en.documentWorkflow.backToEditing).click());
  expect(dialog.scrollTop).toBe(0);
  expect(dialog.classList.contains("overflow-y-auto")).toBe(true);
  expect(dialog.classList.contains("h-[92dvh]")).toBe(false);
  expect(
    document.querySelector<HTMLInputElement>('[name="label"]')?.value,
  ).toBe("New title");
});
it.each(
  previewDrafts.map((value) => [value.document.template, value] as const),
)(
  "keeps %s Save & Preview pending across deferred save/render without an enabled gap",
  async (_template, value) => {
    await create(value);
    let save!: (value: Response) => void;
    let render!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        save = resolve;
      }),
    );
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        render = resolve;
      }),
    );
    const trigger = button(en.documentWorkflow.savePreview);
    act(() => {
      trigger.click();
      trigger.click();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(trigger.getAttribute("aria-busy")).toBe("true");
    expect(trigger.querySelector(".animate-spin")).not.toBeNull();
    expect(trigger.textContent).toBe(en.documentActions.savePreview);
    expect(button(en.documentDraftEditor.save).getAttribute("aria-busy")).toBe(
      "false",
    );
    await act(async () => save(response({ ...value, revision: 2 })));
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(trigger.getAttribute("aria-busy")).toBe("true");
    expect(trigger.disabled).toBe(true);
    act(() => trigger.click());
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await act(async () => render(response({}, 503)));
    expect(trigger.getAttribute("aria-busy")).toBe("false");
    expect(trigger.disabled).toBe(false);
    expect(trigger.textContent).toBe(en.documentWorkflow.savePreview);
  },
);
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
async function preview(value = renderableDraft) {
  fetchMock.mockResolvedValueOnce(response({ ...value, revision: 2 }));
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
it.each([false, true])(
  "shows only the active attach/replace action pending and recovers on failure (replace=%s)",
  async (replace) => {
    const value = {
      ...renderableDraft,
      documentId: replace ? "existing" : null,
      publishedRevision: replace ? 1 : null,
    };
    await create(value);
    await preview(value);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let finish!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    );
    const trigger = button(
      replace
        ? en.documentDraftDelivery.replace
        : en.documentDraftDelivery.attach,
    );
    act(() => {
      trigger.click();
      trigger.click();
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(trigger.textContent).toBe(
      replace ? en.documentActions.replacing : en.documentActions.attaching,
    );
    expect(trigger.getAttribute("aria-busy")).toBe("true");
    expect(trigger.querySelector(".animate-spin")).not.toBeNull();
    expect(button(en.documentWorkflow.backToEditing).disabled).toBe(true);
    expect(
      button(en.documentWorkflow.backToEditing).querySelector(".animate-spin"),
    ).toBeNull();
    await act(async () => finish(response({}, 503)));
    expect(trigger.getAttribute("aria-busy")).toBe("false");
    expect(trigger.disabled).toBe(false);
    expect(document.querySelector("canvas")).not.toBeNull();
  },
);
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
  let finish!: (value: boolean) => void;
  attached.mockReturnValueOnce(
    new Promise<boolean>((resolve) => {
      finish = resolve;
    }),
  );
  const retry = button(en.documentWorkflow.retry);
  act(() => {
    retry.click();
    retry.click();
  });
  expect(attached).toHaveBeenCalledTimes(2);
  expect(retry.getAttribute("aria-busy")).toBe("true");
  expect(retry.textContent).toBe(en.documentActions.refreshing);
  expect(retry.querySelector(".animate-spin")).not.toBeNull();
  await act(async () => finish(true));
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
