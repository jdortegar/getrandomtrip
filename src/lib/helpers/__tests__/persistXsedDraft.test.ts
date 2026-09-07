import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_XSED_DRAFT } from "@/types/xsed";
import { persistXsedDraft } from "@/lib/helpers/persistXsedDraft";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("persistXsedDraft", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs a new draft and returns the created id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "new-id" }));
    vi.stubGlobal("fetch", fetchMock);

    const id = await persistXsedDraft(EMPTY_XSED_DRAFT, null, "Save failed");
    expect(id).toBe("new-id");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/xsed");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
  });

  it("POSTs then PUTs when publishing a new drop as ACTIVE", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "new-id" }))
      .mockResolvedValueOnce(jsonResponse({ drop: { id: "new-id" } }));
    vi.stubGlobal("fetch", fetchMock);

    const id = await persistXsedDraft(
      { ...EMPTY_XSED_DRAFT, status: "ACTIVE" },
      null,
      "Save failed",
    );
    expect(id).toBe("new-id");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/admin/xsed/new-id");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PUT" });
  });

  it("PUTs an existing drop without a create call", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ drop: { id: "drop-1" } }));
    vi.stubGlobal("fetch", fetchMock);

    const id = await persistXsedDraft(EMPTY_XSED_DRAFT, "drop-1", "Save failed");
    expect(id).toBe("drop-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/xsed/drop-1");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "PUT" });
  });

  it("surfaces the API message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ message: "titleInternal, tripDate, destinationCity and destinationCountry are required to activate a drop" }, 422),
      ),
    );

    await expect(persistXsedDraft(EMPTY_XSED_DRAFT, "drop-1", "Save failed")).rejects.toThrow(
      "titleInternal, tripDate, destinationCity and destinationCountry are required to activate a drop",
    );
  });
});
