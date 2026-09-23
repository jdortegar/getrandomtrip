import { act, useLayoutEffect, useState, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Img from "@/components/common/Img";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function Harness({
  onCommit,
  ...props
}: ComponentProps<typeof Img> & { onCommit?: () => void }) {
  useLayoutEffect(() => {
    onCommit?.();
  }, [onCommit, props.src]);
  return <Img {...props} />;
}

function render(
  props: Partial<ComponentProps<typeof Img>> = {},
  onCommit?: () => void,
) {
  act(() =>
    root.render(
      <Harness
        alt="Mountain"
        onCommit={onCommit}
        src="/a.jpg"
        unoptimized
        {...props}
      />,
    ),
  );
}

function failImage() {
  const image = container.querySelector("img")!;
  act(() => image.dispatchEvent(new Event("error")));
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("Img", () => {
  it("renders an image with forwarded accessible and loading props", () => {
    render({
      width: 320,
      height: 180,
      title: "Destination",
      loading: "eager",
      draggable: false,
    });
    const image = container.querySelector("img")!;
    expect(new URL(image.src).pathname).toBe("/a.jpg");
    expect(image.getAttribute("alt")).toBe("Mountain");
    expect(image.getAttribute("width")).toBe("320");
    expect(image.getAttribute("height")).toBe("180");
    expect(image.title).toBe("Destination");
    expect(image.getAttribute("loading")).toBe("eager");
    expect(image.getAttribute("draggable")).toBe("false");
  });

  it("shows the labeled fallback and notifies the caller when an image fails", () => {
    const onError = vi.fn();
    render({ onError });
    failImage();
    const fallback = container.querySelector('[role="img"]')!;
    expect(fallback.getAttribute("aria-label")).toBe("Mountain");
    expect(fallback.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith();
  });

  it("retains the fallback when only other props change on a failed source", () => {
    render();
    failImage();
    render({ alt: "Updated mountain", title: "Updated" });
    expect(
      container.querySelector('[role="img"]')?.getAttribute("aria-label"),
    ).toBe("Updated mountain");
  });
});

it("commits the replacement image immediately rather than the old fallback", () => {
  render();
  failImage();
  const committedSources: string[] = [];
  render({ src: "/b.jpg" }, () => {
    committedSources.push(
      new URL(container.querySelector("img")!.src).pathname,
    );
  });
  expect(committedSources[0]).toBe("/b.jpg");
  expect(new URL(container.querySelector("img")!.src).pathname).toBe("/b.jpg");
});

it.each([false, true])(
  "retries failed A after visiting B (B also fails: %s)",
  (failB) => {
    render();
    failImage();
    render({ src: "/b.jpg" });
    expect(new URL(container.querySelector("img")!.src).pathname).toBe(
      "/b.jpg",
    );
    if (failB) failImage();
    const committedSources: string[] = [];
    render({ src: "/a.jpg" }, () => {
      committedSources.push(
        new URL(container.querySelector("img")!.src).pathname,
      );
    });
    expect(committedSources[0]).toBe("/a.jpg");
    expect(container.querySelector('[role="img"]')).toBeNull();
    failImage();
    expect(
      container.querySelector('[role="img"]')?.getAttribute("aria-label"),
    ).toBe("Mountain");
  },
);

function AsyncRecoveryImage() {
  const [src, setSrc] = useState("/a.jpg");
  return (
    <Img
      alt="Recovered mountain"
      onError={() => {
        void Promise.resolve().then(() => setSrc("/recovered.jpg"));
      }}
      src={src}
      unoptimized
    />
  );
}

it("retries a URL asynchronously supplied by the caller's error handler", async () => {
  act(() => root.render(<AsyncRecoveryImage />));
  failImage();
  expect(
    container.querySelector('[role="img"]')?.getAttribute("aria-label"),
  ).toBe("Recovered mountain");
  await act(async () => {
    await Promise.resolve();
  });
  expect(new URL(container.querySelector("img")!.src).pathname).toBe(
    "/recovered.jpg",
  );
  expect(container.querySelector("img")?.getAttribute("alt")).toBe(
    "Recovered mountain",
  );
  expect(container.querySelector('[role="img"]')).toBeNull();
});

it.each([
  { props: {}, alt: "", width: "1200", height: "675" },
  {
    props: { alt: "Lake", width: 240, height: 160 },
    alt: "Lake",
    width: "240",
    height: "160",
  },
])(
  "renders SSR-safe image defaults and supplied props: $alt",
  ({ props, alt, width, height }) => {
    const markup = renderToStaticMarkup(
      <Img src="/server.jpg" title="Travel" unoptimized {...props} />,
    );
    const document = new DOMParser().parseFromString(markup, "text/html");
    const image = document.querySelector("img")!;
    expect(image.getAttribute("src")).toBe("/server.jpg");
    expect(image.getAttribute("alt")).toBe(alt);
    expect(image.getAttribute("width")).toBe(width);
    expect(image.getAttribute("height")).toBe(height);
    expect(image.title).toBe("Travel");
  },
);
