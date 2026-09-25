import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { DocumentPdfPreview } from "../DocumentPdfPreview";
import { loadPdfPreview } from "@/lib/trip-documents/client/loadPdfPreview";
vi.mock("@/lib/trip-documents/client/loadPdfPreview", () => ({
  loadPdfPreview: vi.fn(),
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const load = vi.mocked(loadPdfPreview);
let root: Root, host: HTMLDivElement;
let resize: ResizeObserverCallback;
const render = vi.fn();
const cancel = vi.fn();
const cleanup = vi.fn();
const getPage = vi.fn();
const pdf = { numPages: 3, getPage };
const page = {
  getViewport: ({ scale }: { scale: number }) => ({
    width: 600 * scale,
    height: 900 * scale,
  }),
  render,
  cleanup,
};
function button(label: string) {
  return [...host.querySelectorAll("button")].find(
    (node) => node.textContent === label,
  )!;
}
async function mount(url = "blob:synthetic") {
  await act(async () =>
    root.render(<DocumentPdfPreview copy={en.documentPreview} url={url} />),
  );
}
function measure(width = 600) {
  act(() =>
    resize(
      [{ contentRect: { width } } as ResizeObserverEntry],
      {} as ResizeObserver,
    ),
  );
}
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.clearAllMocks();
  load.mockResolvedValue({
    document: pdf,
    failed: new Promise(() => {}),
  } as never);
  getPage.mockResolvedValue(page);
  render.mockReturnValue({ promise: Promise.resolve(), cancel });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    {} as never,
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("shows localized loading until actual paint, renders one bounded canvas and navigates one page at a time", async () => {
  let finish!: () => void;
  render.mockReturnValueOnce({
    promise: new Promise<void>((resolve) => {
      finish = resolve;
    }),
    cancel,
  });
  await mount();
  measure();
  await act(async () => {});
  expect(host.textContent).toContain(en.documentPreview.loading);
  expect(host.querySelector('[aria-busy="true"]')).not.toBeNull();
  expect(button(en.documentPreview.next).disabled).toBe(true);
  await act(async () => finish());
  expect(host.querySelectorAll("canvas")).toHaveLength(1);
  expect(
    host
      .querySelector("canvas")
      ?.parentElement?.classList.contains("overflow-y-scroll"),
  ).toBe(true);
  expect(host.querySelector("canvas")?.getAttribute("aria-label")).toContain(
    "1",
  );
  expect(button(en.documentPreview.previous).disabled).toBe(true);
  let next!: () => void;
  render.mockReturnValueOnce({
    promise: new Promise<void>((resolve) => {
      next = resolve;
    }),
    cancel,
  });
  act(() => {
    button(en.documentPreview.next).click();
    button(en.documentPreview.next).click();
  });
  await act(async () => {});
  expect(getPage.mock.calls.map(([number]) => number)).toEqual([1, 2]);
  expect(button(en.documentPreview.loadingPage).getAttribute("aria-busy")).toBe(
    "true",
  );
  await act(async () => next());
  expect(button(en.documentPreview.previous).disabled).toBe(false);
});
it("reports failed loads, keeps retry pending and ignores late work after URL change/unmount", async () => {
  load.mockRejectedValueOnce(new Error("private message"));
  await mount();
  expect(host.textContent).toContain(en.documentPreview.error);
  expect(host.textContent).not.toContain("private message");
  let finish!: (value: never) => void;
  load.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  act(() => {
    button(en.documentPreview.retry).click();
    button(en.documentPreview.retry).click();
  });
  expect(load).toHaveBeenCalledTimes(2);
  const oldSignal = load.mock.calls[1][1];
  await mount("blob:new");
  measure();
  await act(async () => {});
  expect(oldSignal.aborted).toBe(true);
  await act(async () =>
    finish({ document: pdf, failed: new Promise(() => {}) } as never),
  );
  expect(load).toHaveBeenCalledTimes(3);
  act(() => root.render(null));
  expect(load.mock.calls[2][1].aborted).toBe(true);
});
it("cancels the previous render on resize and caps bitmap pixels", async () => {
  render.mockReturnValueOnce({ promise: new Promise(() => {}), cancel });
  await mount();
  measure(900);
  await act(async () => {});
  const oldCanvas = host.querySelector("canvas")!;
  measure(10000);
  await act(async () => {});
  expect(cancel).toHaveBeenCalled();
  expect(oldCanvas.width).toBe(0);
  const canvas = host.querySelector("canvas")!;
  expect(canvas.width * canvas.height).toBeLessThanOrEqual(4 * 1024 * 1024);
  expect(Math.max(canvas.width, canvas.height)).toBeLessThanOrEqual(4096);
});
it("recovers from page rendering failure without attaching or modifying the PDF", async () => {
  render.mockImplementationOnce(() => ({
    promise: Promise.reject(new Error("render failure")),
    cancel,
  }));
  await mount();
  measure();
  await act(async () => {});
  expect(host.textContent).toContain(en.documentPreview.error);
  await act(async () => button(en.documentPreview.retry).click());
  expect(load).toHaveBeenCalledTimes(2);
  expect(host.querySelector("canvas")?.hidden).toBe(false);
});
it.each(["ready", "render"])(
  "shows retry after a post-load worker failure during %s",
  async (phase) => {
    let fail!: (error: Error) => void;
    load.mockResolvedValueOnce({
      document: pdf,
      failed: new Promise<never>((_resolve, reject) => {
        fail = reject;
      }),
    } as never);
    if (phase === "render")
      render.mockReturnValueOnce({ promise: new Promise(() => {}), cancel });
    await mount();
    measure();
    await act(async () => {});
    await act(async () => fail(new Error("worker crashed")));
    expect(host.textContent).toContain(en.documentPreview.error);
    expect(button(en.documentPreview.retry).disabled).toBe(false);
  },
);
it("does not resurrect a previous rendered canvas on an A to B to A source round trip", async () => {
  await mount("blob:A");
  measure();
  await act(async () => {});
  expect(host.querySelector("canvas")?.hidden).toBe(false);
  load.mockReturnValueOnce(new Promise(() => {}));
  await mount("blob:B");
  let finish!: (value: never) => void;
  load.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await mount("blob:A");
  expect(host.querySelector("canvas")?.hidden).toBe(true);
  expect(host.textContent).toContain(en.documentPreview.loading);
  await act(async () =>
    finish({ document: pdf, failed: new Promise(() => {}) } as never),
  );
  expect(host.querySelector("canvas")?.hidden).toBe(false);
});
