import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DropCard } from "@/components/app/xsed/DropCard";
import TripperCard from "@/components/TripperCard";
import TravelerTypeCard from "@/components/TravelerTypeCard";
import BgCarousel from "@/components/media/BgCarousel";

// Expose the props the optimizer would act on; SSR markup hides priority/lazy.
vi.mock("next/image", () => ({
  default: ({
    alt,
    priority,
    sizes,
  }: {
    alt?: string;
    priority?: boolean;
    sizes?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} data-priority={String(Boolean(priority))} sizes={sizes} />
  ),
}));

vi.mock("@/components/common/LocalizedLink", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function firstImg(markup: string): Element {
  const template = document.createElement("template");
  template.innerHTML = markup;
  const img = template.content.querySelector("img");
  if (!img) throw new Error("no <img> rendered");
  return img;
}

function allImgs(markup: string): Element[] {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return Array.from(template.content.querySelectorAll("img"));
}

describe("card image sizes", () => {
  it("DropCard does not fall back to the 100vw default", () => {
    const img = firstImg(
      renderToStaticMarkup(
        <DropCard
          drop={{
            date: "",
            image: "/images/drops/a.jpg",
            number: 1,
            slug: "a",
            title: "A",
          }}
        />,
      ),
    );
    expect(img.getAttribute("sizes")).toContain("vw");
    expect(img.getAttribute("sizes")).not.toBe("100vw");
  });

  it("TripperCard sets responsive sizes", () => {
    const img = firstImg(
      renderToStaticMarkup(
        <TripperCard name="N" imageUrl="/images/a.jpg" href="n" />,
      ),
    );
    expect(img.getAttribute("sizes")).not.toBe("100vw");
    expect(img.getAttribute("sizes")).toContain("vw");
  });
});

describe("priority opt-in", () => {
  it("TripperCard is lazy by default", () => {
    const img = firstImg(
      renderToStaticMarkup(
        <TripperCard name="N" imageUrl="/images/a.jpg" href="n" />,
      ),
    );
    expect(img.getAttribute("data-priority")).toBe("false");
  });

  it("TripperCard preloads when priority is passed", () => {
    const img = firstImg(
      renderToStaticMarkup(
        <TripperCard priority name="N" imageUrl="/images/a.jpg" href="n" />,
      ),
    );
    expect(img.getAttribute("data-priority")).toBe("true");
  });

  it("TravelerTypeCard is lazy by default and preloads on priority", () => {
    const lazy = firstImg(
      renderToStaticMarkup(
        <TravelerTypeCard fill imageUrl="/images/a.jpg" title="T" href="/x" />,
      ),
    );
    expect(lazy.getAttribute("data-priority")).toBe("false");
    expect(lazy.getAttribute("sizes")).not.toBe("100vw");

    const eager = firstImg(
      renderToStaticMarkup(
        <TravelerTypeCard
          fill
          priority
          imageUrl="/images/a.jpg"
          title="T"
          href="/x"
        />,
      ),
    );
    expect(eager.getAttribute("data-priority")).toBe("true");
  });
});

describe("BgCarousel", () => {
  it("prioritises only the first slide, at 100vw", () => {
    const imgs = allImgs(renderToStaticMarkup(<BgCarousel />));
    expect(imgs).toHaveLength(3);
    expect(imgs[0].getAttribute("data-priority")).toBe("true");
    expect(imgs[0].getAttribute("sizes")).toBe("100vw");
    expect(imgs[1].getAttribute("data-priority")).toBe("false");
    expect(imgs[2].getAttribute("data-priority")).toBe("false");
  });
});
