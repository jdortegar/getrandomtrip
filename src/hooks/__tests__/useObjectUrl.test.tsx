import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useObjectUrl } from "@/hooks/useObjectUrl";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
const create = vi.fn<(file: Blob | MediaSource) => string>();
const revoke = vi.fn<(url: string) => void>();

function Preview({ file }: { file: File | null }) {
  return <output>{useObjectUrl(file) ?? "empty"}</output>;
}

beforeEach(() => {
  let sequence = 0;
  create.mockReset().mockImplementation(() => `blob:preview-${++sequence}`);
  revoke.mockReset();
  vi.spyOn(URL, "createObjectURL").mockImplementation(create);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(revoke);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

it("never allocates a blob URL during server render", () => {
  expect(
    renderToString(<Preview file={new File(["image"], "image.png")} />),
  ).toContain("empty");
  expect(create).not.toHaveBeenCalled();
});

it("releases old files and detached Strict Mode resources exactly once", () => {
  const first = new File(["one"], "one.png");
  const second = new File(["two"], "two.png");
  const render = (file: File | null) =>
    act(() => {
      root.render(
        <StrictMode>
          <Preview file={file} />
        </StrictMode>,
      );
    });
  render(first);
  const firstUrl = container.textContent;
  expect(firstUrl).toMatch(/^blob:preview-/);
  render(first);
  expect(container.textContent).toBe(firstUrl);
  render(second);
  expect(revoke).toHaveBeenCalledWith(firstUrl);
  expect(container.textContent).not.toBe(firstUrl);
  render(null);
  expect(container.textContent).toBe("empty");
  const allocated = create.mock.results.map((result) => result.value);
  expect(revoke.mock.calls.map(([url]) => url).sort()).toEqual(
    allocated.sort(),
  );
});
