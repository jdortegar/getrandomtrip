import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";
import { useExperienceRoadmapPreview } from "../useExperienceRoadmapPreview";
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const document: ExperienceRoadmapDocument = {
  template: "experience-roadmap",
  templateVersion: 1,
  label: "Activity",
  locale: "es",
  country: "AR",
  data: {
    origin: "Buenos Aires",
    destination: "Areco",
    heading: "Río y café",
    duration: "2 horas",
    startDate: "2026-10-01",
    endDate: "2026-10-03",
    activities: [
      { id: "walk", title: "Paseo", description: "Caminar por el río" },
    ],
  },
};
let root: Root;
let container: HTMLDivElement;
let current: ReturnType<typeof useExperienceRoadmapPreview>;
const fetchMock = vi.fn();
const createUrl = vi.fn();
const revokeUrl = vi.fn();
function Harness({ value = document, tripId = "trip/1" }) {
  const result = useExperienceRoadmapPreview(tripId, value);
  useEffect(() => {
    current = result;
  });
  return null;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}
const pdf = () =>
  new Response(new Blob(["%PDF-test"], { type: "application/pdf" }), {
    headers: { "Content-Type": "application/pdf" },
  });
beforeEach(() => {
  container = window.document.createElement("div");
  root = createRoot(container);
  fetchMock.mockReset();
  createUrl.mockReset().mockReturnValue("blob:preview");
  revokeUrl.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = createUrl;
      static revokeObjectURL = revokeUrl;
    },
  );
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});
it("POSTs the full localized form and replaces/revokes its private preview", async () => {
  fetchMock.mockResolvedValue(pdf());
  await act(() => current.preview());
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/admin/trip-requests/trip%2F1/experience-roadmap-preview",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify(document),
      cache: "no-store",
    }),
  );
  expect(current.url).toBe("blob:preview");
  expect(current.error).toBe(null);
  createUrl.mockReturnValue("blob:second");
  fetchMock.mockResolvedValue(pdf());
  await act(() => current.preview());
  expect(revokeUrl).toHaveBeenCalledWith("blob:preview");
  expect(current.url).toBe("blob:second");
});
it.each([
  [401, "forbidden"],
  [403, "forbidden"],
  [404, "trip_not_found"],
  [413, "too_large"],
  [422, "invalid"],
  [503, "unavailable"],
] as const)("maps HTTP%d safely", async (status, error) => {
  fetchMock.mockResolvedValue(new Response("secret", { status }));
  await act(() => current.preview());
  expect(current.error).toBe(error);
  expect(current.busy).toBe(false);
  expect(createUrl).not.toHaveBeenCalled();
});
it("exposes pending state and ignores an old request that resolves last", async () => {
  const old = deferred<Response>();
  const latest = deferred<Response>();
  fetchMock
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(latest.promise);
  let first!: Promise<void>;
  let second!: Promise<void>;
  act(() => {
    first = current.preview();
  });
  expect(current.busy).toBe(true);
  act(() => {
    second = current.preview();
  });
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => {
    latest.resolve(pdf());
    await second;
  });
  await act(async () => {
    old.resolve(pdf());
    await first;
  });
  expect(createUrl).toHaveBeenCalledTimes(1);
  expect(current.url).toBe("blob:preview");
});
it("invalidates preview when form data changes", async () => {
  fetchMock.mockResolvedValue(pdf());
  await act(() => current.preview());
  act(() => root.render(<Harness value={{ ...document, locale: "en" }} />));
  expect(current.url).toBe(null);
  expect(revokeUrl).toHaveBeenCalledWith("blob:preview");
});
it("ignores a delayed blob after changing the trip", async () => {
  const blob = deferred<Blob>();
  fetchMock.mockResolvedValue({
    ok: true,
    headers: new Headers({ "Content-Type": "application/pdf" }),
    blob: () => blob.promise,
  });
  let pending!: Promise<void>;
  await act(async () => {
    pending = current.preview();
    await Promise.resolve();
  });
  act(() => root.render(<Harness tripId="other" />));
  await act(async () => {
    blob.resolve(new Blob(["%PDF"]));
    await pending;
  });
  expect(createUrl).not.toHaveBeenCalled();
  expect(current.busy).toBe(false);
});
it("aborts on unmount and never creates a URL from a late response", async () => {
  const response = deferred<Response>();
  fetchMock.mockReturnValue(response.promise);
  let pending!: Promise<void>;
  act(() => {
    pending = current.preview();
  });
  act(() => root.unmount());
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => {
    response.resolve(pdf());
    await pending;
  });
  expect(createUrl).not.toHaveBeenCalled();
  root = createRoot(container);
});
it("clears and revokes on explicit reset", async () => {
  fetchMock.mockResolvedValue(pdf());
  await act(() => current.preview());
  act(() => current.reset());
  expect(current.url).toBe(null);
  expect(revokeUrl).toHaveBeenCalledWith("blob:preview");
});
it("rejects non-PDF responses, oversized blobs and network errors", async () => {
  fetchMock.mockResolvedValue(new Response("html"));
  await act(() => current.preview());
  expect(current.error).toBe("unavailable");
  fetchMock.mockResolvedValue(
    new Response(new Blob([new Uint8Array(4 * 1024 * 1024 + 1)]), {
      headers: { "Content-Type": "application/pdf" },
    }),
  );
  await act(() => current.preview());
  expect(current.error).toBe("too_large");
  fetchMock.mockRejectedValue(new Error("private host"));
  await act(() => current.preview());
  expect(current.error).toBe("unavailable");
  expect(createUrl).not.toHaveBeenCalled();
});
it("revokes an existing preview when unmounted", async () => {
  fetchMock.mockResolvedValue(pdf());
  await act(() => current.preview());
  act(() => root.unmount());
  expect(revokeUrl).toHaveBeenCalledWith("blob:preview");
  root = createRoot(container);
});
it("clears pending state on form edit and ignores the stale response", async () => {
  const response = deferred<Response>();
  fetchMock.mockReturnValue(response.promise);
  let pending!: Promise<void>;
  act(() => {
    pending = current.preview();
  });
  act(() => root.render(<Harness value={{ ...document, label: "Edited" }} />));
  expect(current.busy).toBe(false);
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => {
    response.resolve(pdf());
    await pending;
  });
  expect(current.url).toBe(null);
  expect(createUrl).not.toHaveBeenCalled();
});
