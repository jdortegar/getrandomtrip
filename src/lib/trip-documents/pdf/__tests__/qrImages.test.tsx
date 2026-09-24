// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { createQrImages } from "../qrImages";
import { PdfQrLink } from "../PdfQrLink";
afterEach(() => vi.restoreAllMocks());
it("locally encodes distinct HTTPS links, including Unicode, with valid PNG bytes", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("forbidden"));
  const url = "https://example.com/Córdoba?café=ñ";
  const images = await createQrImages([url, url, undefined, ""]);
  expect(Object.keys(images)).toEqual([url]);
  expect(images[url].subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(images[url].length).toBeLessThan(100_000);
  expect(fetch).not.toHaveBeenCalled();
});
it("omits absent, unsafe and oversized links without network or QR work", async () => {
  expect(
    await createQrImages([
      undefined,
      "",
      "http://example.com",
      "https://a:b@example.com",
      "https://example.com/" + "é".repeat(1000),
    ]),
  ).toEqual({});
});
it("accepts exactly 2000 UTF8 bytes but keeps a clickable fallback beyond the bound", async () => {
  const url =
    "https://example.com/" +
    "a".repeat(2000 - Buffer.byteLength("https://example.com/"));
  expect(Buffer.byteLength(url)).toBe(2000);
  expect(Object.keys(await createQrImages([url]))).toEqual([url]);
  expect(await createQrImages([url + "x"])).toEqual({});
  const fallback = PdfQrLink({ src: url + "x", children: "Map", images: {} });
  expect(fallback.props.src).toBe(url + "x");
  expect(fallback.props.children).toBe("Map");
});
it("uses local image bytes plus the original clickable URL and label", async () => {
  const src = "https://example.com/map";
  const images = await createQrImages([src]);
  const link = PdfQrLink({ src, images, children: "Mapa" });
  expect(link.props.children[0].props.children.props.src).toEqual({
    data: images[src],
    format: "png",
  });
  expect(link.props.children[0].props.src).toBe(src);
  expect(link.props.children[1].props.children).toBe("Mapa");
});
