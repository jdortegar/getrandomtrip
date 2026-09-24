import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BrandingAnimation from "@/components/BrandingAnimation";

describe("BrandingAnimation image boundary", () => {
  it.each([undefined, 2])(
    "retains branding and decorative assets (delay %s)",
    (initialDelay) => {
      const template = document.createElement("template");
      template.innerHTML = renderToStaticMarkup(
        <BrandingAnimation initialDelay={initialDelay} />,
      );
      expect(template.content.textContent?.replaceAll("\u00a0", " ")).toBe(
        "WONDER • WANDERRepeat",
      );
      const images = [...template.content.querySelectorAll("img")];
      expect(images.map((image) => image.getAttribute("src"))).toEqual([
        "/assets/svg/yellow-circle.svg",
        "/assets/svg/yellow-arrow-back.svg",
      ]);
      expect(images.map((image) => image.alt)).toEqual(["", ""]);
    },
  );
});

it("keeps the decorative arrow eager at its intrinsic aspect ratio", () => {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(<BrandingAnimation />);
  const arrow = template.content.querySelector<HTMLImageElement>(
    'img[src="/assets/svg/yellow-arrow-back.svg"]',
  )!;
  expect(arrow.width).toBe(250);
  expect(arrow.height).toBe(68);
  expect(arrow.getAttribute("loading")).toBe("eager");
  expect(arrow.getAttribute("decoding")).toBe("auto");
  expect(arrow.getAttribute("srcset")).toBeNull();
});
