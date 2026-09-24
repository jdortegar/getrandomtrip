// @vitest-environment node
import type { PrismaClient } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/db/tripDocumentCandidates", () => ({
  registerDocumentCandidate: vi.fn(),
}));
vi.mock("../tripDocumentStore", () => ({ getTripDocumentStore: vi.fn() }));
import { registerDocumentCandidate } from "@/lib/db/tripDocumentCandidates";
import { getTripDocumentStore } from "../tripDocumentStore";
import { writeGeneratedDocument } from "../writeGeneratedDocument";
const db = {} as Pick<PrismaClient, "$transaction">;
const input = {
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  revision: 1,
  purpose: "preview" as const,
  expiresAt: new Date("2030-01-01"),
};
const receipt = {
  id: "uuid",
  ownerId: "buyer",
  tripRequestId: "trip",
  draftId: "draft",
  documentId: null,
  revision: 1,
  purpose: "preview" as const,
  previewId: "uuid",
  key: "generated/trip/drafts/draft/uuid",
  expiresAt: "2030-01-01T00:00:00.000Z",
};
const set = vi.fn();
const remove = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(registerDocumentCandidate).mockResolvedValue(receipt);
  vi.mocked(getTripDocumentStore).mockReturnValue({
    set,
    delete: remove,
  } as never);
  set.mockResolvedValue({ modified: true });
});
it("commits registration before obtaining storage and PUTs exact raw key immutably", async () => {
  const events: string[] = [];
  vi.mocked(registerDocumentCandidate).mockImplementation(async () => {
    events.push("commit");
    return receipt;
  });
  vi.mocked(getTripDocumentStore).mockImplementation(() => {
    events.push("store");
    return { set } as never;
  });
  set.mockImplementation(async () => {
    events.push("put");
    return { modified: true };
  });
  const result = await writeGeneratedDocument(
    db,
    input,
    Buffer.from("%PDF-test"),
  );
  expect(events).toEqual(["commit", "store", "put"]);
  expect(result).toMatchObject({ receipt, size: 9 });
  expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
  expect(set).toHaveBeenCalledWith(receipt.key, expect.any(ArrayBuffer), {
    onlyIfNew: true,
    metadata: {
      contentType: "application/pdf",
      sha256: result.hash,
      size: 9,
      candidateId: "uuid",
      previewId: "uuid",
      revision: 1,
      purpose: "preview",
    },
  });
});
it("does not write if registration fails", async () => {
  vi.mocked(registerDocumentCandidate).mockRejectedValue(
    new Error("commit unknown"),
  );
  await expect(
    writeGeneratedDocument(db, input, Buffer.from("%PDF")),
  ).rejects.toThrow("commit unknown");
  expect(getTripDocumentStore).not.toHaveBeenCalled();
});
it.each(["throw", "collision"])(
  "never deletes or overwrites after %s",
  async (kind) => {
    if (kind === "throw") set.mockRejectedValue(new Error("ambiguous PUT"));
    else set.mockResolvedValue({ modified: false });
    await expect(
      writeGeneratedDocument(db, input, Buffer.from("%PDF")),
    ).rejects.toThrow();
    expect(remove).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledOnce();
  },
);
it.each([Buffer.from("not-pdf"), Buffer.alloc(4 * 1024 * 1024 + 1)])(
  "rejects invalid/oversized bytes before registration",
  async (bytes) => {
    await expect(writeGeneratedDocument(db, input, bytes)).rejects.toThrow();
    expect(registerDocumentCandidate).not.toHaveBeenCalled();
  },
);
it("copies bytes before async registration and permits exact4MiB", async () => {
  const bytes = Buffer.alloc(4 * 1024 * 1024);
  bytes.write("%PDF");
  let finish!: (value: typeof receipt) => void;
  vi.mocked(registerDocumentCandidate).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const pending = writeGeneratedDocument(db, input, bytes);
  bytes.fill(0);
  finish(receipt);
  await pending;
  expect(Buffer.from(set.mock.calls[0][1]).subarray(0, 4).toString()).toBe(
    "%PDF",
  );
});
it("retries as fresh candidates without reusing an ambiguous key", async () => {
  set.mockRejectedValueOnce(new Error("timeout"));
  await expect(
    writeGeneratedDocument(db, input, Buffer.from("%PDF")),
  ).rejects.toThrow();
  vi.mocked(registerDocumentCandidate).mockResolvedValue({
    ...receipt,
    id: "new",
    key: receipt.key + "-new",
  });
  set.mockResolvedValue({ modified: true });
  await writeGeneratedDocument(db, input, Buffer.from("%PDF"));
  expect(set.mock.calls.map((call) => call[0])).toEqual([
    receipt.key,
    receipt.key + "-new",
  ]);
});
