// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { normalizeSourceText } from "../sourceText";
import { MAX_DOCUMENT_REQUEST_BYTES } from "../validationPrimitives";

describe("normalizeSourceText", () => {
  it("preserves authored plain text exactly", () => {
    const text = "  Café &amp; té\n\n2 < 3, <Anna>  ";
    expect(normalizeSourceText(text)).toBe(text);
  });
  it.each([undefined, null, false, 2, {}, []])(
    "blanks unknown input %s",
    (value) => {
      expect(normalizeSourceText(value)).toBe("");
    },
  );
  it.each(["plain", "html"] as const)(
    "bounds %s output without truncating",
    (format) => {
      expect(normalizeSourceText("á".repeat(4000), format)).toBe(
        "á".repeat(4000),
      );
      expect(normalizeSourceText("á".repeat(4001), format)).toBe("");
    },
  );
  it("requires explicit HTML mode and keeps paragraphs, accents and entities", () => {
    const html = "<p>Café &amp; té&nbsp;&#241;</p><p>Río<br>Sur</p>";
    expect(normalizeSourceText(html, "plain")).toBe(html);
    expect(normalizeSourceText(html, "html")).toBe("Café & té ñ\n\nRío\nSur");
    expect(
      normalizeSourceText(
        "<h2>Paseo por Córdoba</h2><p>Después, cena</p>",
        "html",
      ),
    ).toBe("Paseo por Córdoba\n\nDespués, cena");
  });
  it("preserves list order and tolerates unfinished editor markup", () => {
    const list = normalizeSourceText(
      "<ol><li>Primero</li><li>Segundo</li></ol>",
      "html",
    );
    expect(list.split("\n").map((line) => line.trimStart())).toEqual([
      "1. Primero",
      "2. Segundo",
    ]);
    expect(normalizeSourceText("<p>Texto sin cierre", "html")).toBe(
      "Texto sin cierre",
    );
    expect(normalizeSourceText("<p><br></p>", "html")).toBe("");
  });
  it("decodes escaped tags as literal text without a second HTML pass", () => {
    expect(
      normalizeSourceText("<p>&lt;b&gt;Café&lt;/b&gt; &#x1F30D;</p>", "html"),
    ).toBe("<b>Café</b> 🌍");
  });
  it("retains visible link text without appending supplier URLs", () => {
    expect(
      normalizeSourceText(
        '<a href="https://example.com">Sitio oficial</a>',
        "html",
      ),
    ).toBe("Sitio oficial");
  });
  it("never executes source markup, fetches URLs or appends link targets", () => {
    const fetch = vi.fn(() => {
      throw new Error("Unexpected network access");
    });
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("__sourceTextExecuted", false);
    try {
      const html =
        '<script>globalThis.__sourceTextExecuted = true</script><style>hidden</style><img src="https://example.com/image"><a href="javascript:alert(1)">Contact</a>';
      expect(normalizeSourceText(html, "html")).toBe("Contact");
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(Reflect.get(globalThis, "__sourceTextExecuted")).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("caps UTF-8 input before parsing but accepts the inclusive byte boundary", () => {
    const html =
      "<p>á</p><!--" + "x".repeat(MAX_DOCUMENT_REQUEST_BYTES - 16) + "-->";
    expect(normalizeSourceText(html, "html")).toBe("á");
    expect(normalizeSourceText(html + "x", "html")).toBe("");
  });
  it("blanks excessive tree depth or width instead of partial output", () => {
    const nested =
      "before" + "<div>".repeat(70) + "Deep" + "</div>".repeat(70) + "after";
    expect(normalizeSourceText(nested, "html")).toBe("");
    expect(normalizeSourceText("<i></i>".repeat(5000) + "tail", "html")).toBe(
      "",
    );
  });
  it("excludes document head metadata from visible body text", () => {
    expect(
      normalizeSourceText(
        "<html><head><title>Private title</title></head><body><p>Visible</p></body></html>",
        "html",
      ),
    ).toBe("Visible");
  });
  it.each([
    ["width", "<div></div>".repeat(4096) + "<body><p>Last</p></body>"],
    [
      "depth",
      "<div>".repeat(70) + "<body><p>Last</p></body>" + "</div>".repeat(70),
    ],
  ])("blanks %s overflow even after an earlier body", (_, tail) => {
    expect(
      normalizeSourceText("<body><p>First</p></body>" + tail, "html"),
    ).toBe("");
  });
  it.each([
    ["width", "<i></i>".repeat(4094) + "<body><p>Last</p></body>"],
    [
      "depth",
      "<div>".repeat(60) + "<body><p>Last</p></body>" + "</div>".repeat(60),
    ],
  ])("keeps all body content within the %s limit", (_, tail) => {
    expect(
      normalizeSourceText("<body><p>First</p></body>" + tail, "html"),
    ).toBe("First\n\nLast");
  });
});
