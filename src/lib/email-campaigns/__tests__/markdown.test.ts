import { describe, expect, it } from "vitest";

import { parseCampaignMarkdown, safeHref } from "../markdown";

describe("parseCampaignMarkdown blocks", () => {
  it("splits paragraphs on blank lines and keeps single newlines as breaks", () => {
    expect(parseCampaignMarkdown("Hola\nmundo\n\n\nChau")).toEqual([
      {
        type: "paragraph",
        children: [
          { type: "text", value: "Hola" },
          { type: "break" },
          { type: "text", value: "mundo" },
        ],
      },
      { type: "paragraph", children: [{ type: "text", value: "Chau" }] },
    ]);
  });

  it("parses bullet and numbered lists", () => {
    expect(
      parseCampaignMarkdown("Intro\n- uno\n* dos\n\n1. first\n2) second"),
    ).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "Intro" }] },
      {
        type: "list",
        ordered: false,
        items: [
          [{ type: "text", value: "uno" }],
          [{ type: "text", value: "dos" }],
        ],
      },
      {
        type: "list",
        ordered: true,
        items: [
          [{ type: "text", value: "first" }],
          [{ type: "text", value: "second" }],
        ],
      },
    ]);
  });

  it("starts a new list when the list kind changes", () => {
    const blocks = parseCampaignMarkdown("- a\n1. b");
    expect(blocks.map((block) => block.type === "list" && block.ordered)).toEqual(
      [false, true],
    );
  });

  it("normalizes CRLF and ignores surrounding whitespace", () => {
    expect(parseCampaignMarkdown("\r\n  Hi  \r\n\r\n")).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "Hi" }] },
    ]);
  });

  it("returns no blocks for empty input", () => {
    expect(parseCampaignMarkdown("   \n\n ")).toEqual([]);
  });
});

describe("parseCampaignMarkdown inline", () => {
  const inline = (source: string) => {
    const [block] = parseCampaignMarkdown(source);
    return block?.type === "paragraph" ? block.children : null;
  };

  it("parses bold, italic and nested emphasis", () => {
    expect(inline("a **bold *both*** and *it*")).toEqual([
      { type: "text", value: "a " },
      {
        type: "strong",
        children: [
          { type: "text", value: "bold " },
          { type: "em", children: [{ type: "text", value: "both" }] },
        ],
      },
      { type: "text", value: " and " },
      { type: "em", children: [{ type: "text", value: "it" }] },
    ]);
  });

  it("leaves unmatched markers and snake_case as literal text", () => {
    expect(inline("2 * 3 = 6 and **open and snake_case_name")).toEqual([
      { type: "text", value: "2 * 3 = 6 and **open and snake_case_name" },
    ]);
  });

  it("honors backslash escapes", () => {
    expect(inline("\\*not italic\\*")).toEqual([
      { type: "text", value: "*not italic*" },
    ]);
  });

  it("parses http(s) and mailto links with formatted labels", () => {
    expect(
      inline("[**Go**](https://example.com/a?b=1) or [mail](mailto:hi@x.com)"),
    ).toEqual([
      {
        type: "link",
        href: "https://example.com/a?b=1",
        children: [{ type: "strong", children: [{ type: "text", value: "Go" }] }],
      },
      { type: "text", value: " or " },
      {
        type: "link",
        href: "mailto:hi@x.com",
        children: [{ type: "text", value: "mail" }],
      },
    ]);
  });

  it("drops the href of unsafe link schemes but keeps the label", () => {
    expect(inline("[click](javascript:alert(1)) [x](data:text/html,hi)")).toEqual(
      [{ type: "text", value: "click) x" }],
    );
    expect(inline("[rel](/es/xsed)")).toEqual([{ type: "text", value: "rel" }]);
  });

  it("keeps raw HTML as plain text", () => {
    expect(inline('<script>alert("x")</script> <b>hi</b>')).toEqual([
      { type: "text", value: '<script>alert("x")</script> <b>hi</b>' },
    ]);
  });
});

describe("safeHref", () => {
  it("accepts absolute http(s) and mailto only", () => {
    expect(safeHref(" https://a.com/x ")).toBe("https://a.com/x");
    expect(safeHref("http://a.com")).toBe("http://a.com/");
    expect(safeHref("mailto:hi@a.com")).toBe("mailto:hi@a.com");
    expect(safeHref("JavaScript:alert(1)")).toBeNull();
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("ftp://a.com")).toBeNull();
    expect(safeHref("not a url")).toBeNull();
  });
});
