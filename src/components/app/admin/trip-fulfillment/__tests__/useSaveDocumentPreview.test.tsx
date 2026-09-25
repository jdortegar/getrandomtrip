import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { useDocumentDrafts } from "../useDocumentDrafts";
import { useDraftDelivery } from "../useDraftDelivery";
import { useSaveDocumentPreview } from "../useSaveDocumentPreview";
import { createTripDocumentSnapshot } from "@/lib/trip-documents/snapshots";
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
const fetchMock = vi.fn();
let root: Root;
let current: {
  drafts: ReturnType<typeof useDocumentDrafts>;
  delivery: ReturnType<typeof useDraftDelivery>;
  preview: ReturnType<typeof useSaveDocumentPreview>;
};
function Harness({ source = "A" }) {
  const drafts = useDocumentDrafts("trip", false, source);
  const delivery = useDraftDelivery("trip", drafts.selected, drafts.dirty);
  const preview = useSaveDocumentPreview(drafts, delivery, source);
  useEffect(() => {
    current = { drafts, delivery, preview };
  });
  return null;
}
const response = (value: unknown) => new Response(JSON.stringify(value));
beforeEach(async () => {
  root = createRoot(document.createElement("div"));
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  act(() => root.render(<Harness />));
  fetchMock.mockResolvedValueOnce(response(draft));
  await act(async () => current.drafts.open("draft"));
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});
it.each(["save", "render"])(
  "recovers from A to B to A during deferred %s without adopting late preview",
  async (phase) => {
    let finish!: (value: Response) => void;
    if (phase === "render")
      fetchMock.mockResolvedValueOnce(response({ ...draft, revision: 2 }));
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    );
    await act(async () => {
      void current.preview.savePreview(draft.document);
    });
    expect(current.preview.pending).toBe(true);
    act(() => root.render(<Harness source="B" />));
    act(() => root.render(<Harness source="A" />));
    expect(current.preview.pending).toBe(false);
    await act(async () => finish(response({ ...draft, revision: 2 })));
    expect(current.preview.pending).toBe(false);
    expect(current.delivery.url).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(phase === "render" ? 3 : 2);
  },
);
it("ignores saved completion after switching draft", async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  act(() => {
    void current.preview.savePreview(draft.document);
  });
  fetchMock.mockResolvedValueOnce(response({ ...draft, id: "other" }));
  await act(async () => current.drafts.open("other"));
  await act(async () => finish(response({ ...draft, revision: 2 })));
  expect(current.preview.pending).toBe(false);
  expect(current.drafts.selected?.id).toBe("other");
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
it.each(["save", "render"])(
  "ignores late %s completion after unmount",
  async (phase) => {
    let finish!: (value: Response) => void;
    if (phase === "render")
      fetchMock.mockResolvedValueOnce(response({ ...draft, revision: 2 }));
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    );
    await act(async () => {
      void current.preview.savePreview(draft.document);
    });
    const createUrl = vi.spyOn(URL, "createObjectURL");
    act(() => root.render(null));
    await act(async () =>
      finish(
        phase === "save"
          ? response({ ...draft, revision: 2 })
          : new Response("%PDF", {
              headers: {
                "content-type": "application/pdf",
                "x-document-preview-id": "019b76da-a800-7123-8123-123456789012",
                "x-document-revision": "2",
              },
            }),
      ),
    );
    expect(createUrl).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(phase === "render" ? 3 : 2);
    createUrl.mockRestore();
  },
);
