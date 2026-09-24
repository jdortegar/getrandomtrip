import { afterEach, expect, it, vi } from "vitest";
import { observeDocumentPreview } from "../observeDocumentPreview";
afterEach(() => vi.restoreAllMocks());
it("logs only stage and allowlisted storage status, preserving the original rejection", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const cause = Object.assign(
    new Error(
      "Netlify Blobs has generated an internal error (401 status code, ID: secret)",
    ),
    { name: "BlobsInternalError", key: "private/key" },
  );
  await expect(
    observeDocumentPreview("store", async () => {
      throw cause;
    }),
  ).rejects.toBe(cause);
  expect(log).toHaveBeenCalledWith(
    "[document-preview]",
    JSON.stringify({
      stage: "store",
      category: "storage",
      status: 401,
    }),
  );
  expect(JSON.stringify(log.mock.calls)).not.toContain("secret");
  expect(JSON.stringify(log.mock.calls)).not.toContain("private");
});
it("distinguishes database timeouts without logging database URLs or query contents", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const cause = Object.assign(new Error("postgresql://private query"), {
    code: "P2028",
  });
  await expect(
    observeDocumentPreview("load", async () => {
      throw cause;
    }),
  ).rejects.toBe(cause);
  expect(log).toHaveBeenCalledWith(
    "[document-preview]",
    JSON.stringify({
      stage: "load",
      category: "database_transaction",
    }),
  );
});
it("never logs success or untrusted exception fields", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(await observeDocumentPreview("render", async () => "ok")).toBe("ok");
  expect(log).not.toHaveBeenCalled();
  await expect(
    observeDocumentPreview("render", async () => {
      throw new Error("credentials");
    }),
  ).rejects.toThrow("credentials");
  expect(log).toHaveBeenCalledWith(
    "[document-preview]",
    JSON.stringify({
      stage: "render",
      category: "unexpected",
    }),
  );
});
