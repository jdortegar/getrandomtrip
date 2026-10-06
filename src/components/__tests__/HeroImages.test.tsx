import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import HeaderHero from "@/components/journey/HeaderHero";
import { TravelHero } from "@/components/layout/TravelHero";
import { XsedIntro } from "@/components/landing/exploration/XsedIntro";
import VideoBackground from "@/components/media/VideoBackground";
import { XsedHero } from "@/components/app/xsed/XsedHero";
import type { XsedPageDict } from "@/lib/types/dictionary";

vi.mock("@/components/app/xsed/XsedNotifyForm", () => ({
  XsedNotifyForm: () => null,
}));

// Expose the props the optimizer would act on; SSR markup hides priority/fill.
vi.mock("next/image", () => ({
  default: ({
    alt,
    className,
    fill,
    priority,
    sizes,
    src,
  }: {
    alt?: string;
    className?: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    src?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      data-fill={String(Boolean(fill))}
      data-priority={String(Boolean(priority))}
      sizes={sizes}
      src={src}
    />
  ),
}));

vi.mock("@/components/common/LocalizedLink", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/hooks/useDictionary", () => ({
  useDictionary: () => ({
    backgroundImage: "/images/hero-xsed.jpg",
    ctaHref: "/x",
    ctaLabel: "cta",
    description: "d",
    eyebrow: "e",
    title: "t",
  }),
}));

function parse(markup: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content;
}

function heroImg(markup: string): Element {
  const img = parse(markup).querySelector("img");
  if (!img) throw new Error("no <img> rendered");
  return img;
}

function expectFilledCover(img: Element, src: string) {
  expect(img.getAttribute("src")).toBe(src);
  expect(img.getAttribute("data-fill")).toBe("true");
  expect(img.getAttribute("sizes")).toBe("100vw");
  expect(img.getAttribute("class")).toContain("object-cover");
  expect(img.getAttribute("class")).toContain("object-center");
}

describe("TravelHero", () => {
  it("renders its background through next/image, priority, no CSS url()", () => {
    const markup = renderToStaticMarkup(
      <TravelHero title="T" backgroundImage="/images/a.jpg" />,
    );
    const img = heroImg(markup);
    expectFilledCover(img, "/images/a.jpg");
    expect(img.getAttribute("data-priority")).toBe("true");
    expect(markup).not.toContain("background-image");
  });

  it("renders no image without a backgroundImage", () => {
    const markup = renderToStaticMarkup(<TravelHero title="T" />);
    expect(parse(markup).querySelector("img")).toBeNull();
  });
});

describe("HeaderHero", () => {
  it("renders the fallback still through next/image while a video is supplied", () => {
    const markup = renderToStaticMarkup(
      <HeaderHero title="J" fallbackImage="/images/f.jpg" videoSrc="/v.mp4" />,
    );
    const img = heroImg(markup);
    expectFilledCover(img, "/images/f.jpg");
    expect(img.getAttribute("data-priority")).toBe("true");
    expect(markup).not.toContain("background-image");
    // video stays layered after the image
    const html = markup;
    expect(html.indexOf("<img")).toBeLessThan(html.indexOf("<video"));
    // the poster would make the browser fetch the full-size original
    expect(parse(markup).querySelector("video")?.hasAttribute("poster")).toBe(
      false,
    );
  });

  it("renders backgroundImage through next/image when there is no video", () => {
    const markup = renderToStaticMarkup(
      <HeaderHero title="J" backgroundImage="/images/b.jpg" videoSrc="" />,
    );
    const img = heroImg(markup);
    expectFilledCover(img, "/images/b.jpg");
    expect(img.getAttribute("data-priority")).toBe("true");
    expect(markup).not.toContain("background-image");
  });
});

describe("XsedIntro", () => {
  it("renders through next/image but is lazy (below the fold, inside a tab)", () => {
    const markup = renderToStaticMarkup(<XsedIntro />);
    const img = heroImg(markup);
    expectFilledCover(img, "/images/hero-xsed.jpg");
    expect(img.getAttribute("data-priority")).toBe("false");
    expect(img.getAttribute("class")).toContain("rounded-lg");
    expect(markup).not.toContain("background-image");
  });
});

describe("VideoBackground", () => {
  it("renders the fallback through next/image with priority", () => {
    const markup = renderToStaticMarkup(
      <VideoBackground fallbackImage="/images/v.jpg" videoSrc="/v.mp4" />,
    );
    const img = heroImg(markup);
    expectFilledCover(img, "/images/v.jpg");
    expect(img.getAttribute("data-priority")).toBe("true");
    expect(markup).not.toContain("background-image");
  });

  it("renders only the video when there is no fallback image", () => {
    const markup = renderToStaticMarkup(<VideoBackground videoSrc="/v.mp4" />);
    expect(parse(markup).querySelector("img")).toBeNull();
  });

  it("lets a below-the-fold caller opt out of priority", () => {
    const markup = renderToStaticMarkup(
      <VideoBackground
        fallbackImage="/images/v.jpg"
        priority={false}
        videoSrc="/v.mp4"
      />,
    );
    expect(heroImg(markup).getAttribute("data-priority")).toBe("false");
  });

  it("does not set a poster, which would fetch the unoptimized original", () => {
    const markup = renderToStaticMarkup(
      <VideoBackground fallbackImage="/images/v.jpg" videoSrc="/v.mp4" />,
    );
    expect(parse(markup).querySelector("video")?.hasAttribute("poster")).toBe(
      false,
    );
  });
});

describe("XsedHero", () => {
  const content = {
    backgroundImage: "/images/x.png",
    videoSrc: "/videos/x.mp4",
  } as unknown as XsedPageDict["xsedHero"];

  it("is lazy by default (it sits below the fold on the landing and /xsed)", () => {
    const markup = renderToStaticMarkup(<XsedHero content={content} />);
    expect(heroImg(markup).getAttribute("data-priority")).toBe("false");
  });

  it("preloads when the caller renders it as the top hero", () => {
    const markup = renderToStaticMarkup(
      <XsedHero content={content} priority />,
    );
    expect(heroImg(markup).getAttribute("data-priority")).toBe("true");
  });
});
