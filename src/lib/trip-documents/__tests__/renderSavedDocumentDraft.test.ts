// @vitest-environment node
import type { PrismaClient } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/db/tripDocumentLocks", () => ({
  withTripDocumentLocks: vi.fn(),
}));
vi.mock("@/lib/db/memoryDocumentPreview", () => ({
  bindMemoryDocumentPreview: vi.fn(),
}));
vi.mock("@/lib/storage/writeGeneratedDocument", () => ({
  writeGeneratedDocument: vi.fn(),
}));
vi.mock("../pdf/renderHotelVoucher", () => ({ renderHotelVoucher: vi.fn() }));
vi.mock("../pdf/renderActivityVoucher", () => ({
  renderActivityVoucher: vi.fn(),
}));
vi.mock("../pdf/renderDinnerVoucher", () => ({ renderDinnerVoucher: vi.fn() }));
vi.mock("../pdf/renderExperienceRoadmap", () => ({
  renderExperienceRoadmap: vi.fn(),
}));
vi.mock("../pdf/renderXsedRoadmap", () => ({ renderXsedRoadmap: vi.fn() }));
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { bindMemoryDocumentPreview } from "@/lib/db/memoryDocumentPreview";
import { writeGeneratedDocument } from "@/lib/storage/writeGeneratedDocument";
import { renderHotelVoucher } from "../pdf/renderHotelVoucher";
import { renderActivityVoucher } from "../pdf/renderActivityVoucher";
import { renderDinnerVoucher } from "../pdf/renderDinnerVoucher";
import { renderExperienceRoadmap } from "../pdf/renderExperienceRoadmap";
import { renderXsedRoadmap } from "../pdf/renderXsedRoadmap";
import { createTripDocumentSnapshot } from "../snapshots";
import { renderSavedDocumentDraft } from "../renderSavedDocumentDraft";
const db = {} as Pick<PrismaClient, "$transaction">;
const scope = { ownerId: "buyer", tripRequestId: "trip", draftId: "draft" };
const findUnique = vi.fn();
const query = vi.fn();
const updateMany = vi.fn();
const renderers = [
  renderHotelVoucher,
  renderActivityVoucher,
  renderDinnerVoucher,
  renderExperienceRoadmap,
  renderXsedRoadmap,
];
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(withTripDocumentLocks).mockImplementation(
    async (_db, _scope, work) =>
      work({
        tripDocumentDraft: { findUnique },
        $queryRaw: query,
        tripDocumentCleanupJob: { updateMany },
      } as never),
  );
  findUnique.mockResolvedValue({
    ...createTripDocumentSnapshot("hotel-voucher", {}),
    id: "draft",
    tripRequestId: "trip",
    revision: 1,
    previewId: "preview",
  });
  query.mockResolvedValue([{ id: "old" }]);
  updateMany.mockResolvedValue({ count: 1 });
  for (const render of renderers)
    vi.mocked(render).mockResolvedValue({
      ok: true,
      buffer: Buffer.from("%PDF"),
    });
  vi.mocked(bindMemoryDocumentPreview).mockImplementation(
    async (_db, _scope, revision, buffer) => ({
      previewId: "preview",
      revision,
      buffer: Buffer.from(buffer),
    }),
  );
});
it.each([
  "hotel-voucher",
  "activity-voucher",
  "dinner-voucher",
  "experience-roadmap",
  "xsed-roadmap",
] as const)(
  "dispatches saved %s then binds exact bytes and retires legacy previews without storage",
  async (template) => {
    findUnique.mockResolvedValue({
      ...createTripDocumentSnapshot(template, {}),
      id: "draft",
      tripRequestId: "trip",
      revision: 1,
      previewId: "preview",
    });
    expect(await renderSavedDocumentDraft(db, scope, 1)).toMatchObject({
      ok: true,
      previewId: "preview",
      revision: 1,
      buffer: Buffer.from("%PDF"),
    });
    const selected = {
      "hotel-voucher": renderHotelVoucher,
      "activity-voucher": renderActivityVoucher,
      "dinner-voucher": renderDinnerVoucher,
      "experience-roadmap": renderExperienceRoadmap,
      "xsed-roadmap": renderXsedRoadmap,
    }[template];
    expect(selected).toHaveBeenCalledWith(
      createTripDocumentSnapshot(template, {}),
    );
    for (const other of renderers.filter((render) => render !== selected))
      expect(other).not.toHaveBeenCalled();
    const rendered = await vi.mocked(selected).mock.results[0].value;
    expect(vi.mocked(bindMemoryDocumentPreview).mock.calls[0][3]).toBe(
      rendered.buffer,
    );
    expect(vi.mocked(selected).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(bindMemoryDocumentPreview).mock.invocationCallOrder[0],
    );
    expect(
      vi.mocked(bindMemoryDocumentPreview).mock.invocationCallOrder[0],
    ).toBeLessThan(query.mock.invocationCallOrder[0]);
    const sql = query.mock.calls[0][0];
    expect(sql.text).toContain(`"purpose"='preview'`);
    expect(sql.text).toContain(`"disposition"='retained'`);
    expect(sql.text).toContain('"previewId" IS DISTINCT FROM');
    expect(sql.text).toContain('ORDER BY "id" FOR UPDATE');
    expect(sql.values).toEqual(["buyer", "trip", "draft", "preview"]);
    expect(writeGeneratedDocument).not.toHaveBeenCalled();
    expect(bindMemoryDocumentPreview).toHaveBeenCalledWith(
      db,
      scope,
      1,
      Buffer.from("%PDF"),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          purpose: "preview",
          disposition: "retained",
        }),
      }),
    );
  },
);
it("does not PUT invalid generation or stale revision", async () => {
  vi.mocked(renderHotelVoucher).mockResolvedValue({
    ok: false,
    errors: [{ path: "data.holder", code: "required" }],
  });
  expect((await renderSavedDocumentDraft(db, scope, 1)).ok).toBe(false);
  expect(writeGeneratedDocument).not.toHaveBeenCalled();
  await expect(renderSavedDocumentDraft(db, scope, 2)).rejects.toThrow(
    "DOCUMENT_PREVIEW_REVISION_CONFLICT",
  );
});
it("does not retire legacy previews when new binding fails", async () => {
  vi.mocked(bindMemoryDocumentPreview).mockRejectedValue(new Error("stale"));
  await expect(renderSavedDocumentDraft(db, scope, 1)).rejects.toThrow("stale");
  expect(updateMany).not.toHaveBeenCalled();
});
it("retirement failure remains retryable without losing current receipt", async () => {
  updateMany.mockRejectedValue(new Error("db unavailable"));
  await expect(renderSavedDocumentDraft(db, scope, 1)).rejects.toThrow(
    "db unavailable",
  );
  expect(bindMemoryDocumentPreview).toHaveBeenCalledOnce();
});

it("does not mutate when no obsolete previews exist", async () => {
  query.mockResolvedValue([]);
  await renderSavedDocumentDraft(db, scope, 1);
  expect(updateMany).not.toHaveBeenCalled();
});
