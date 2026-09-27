import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBlogPostingSchema, buildPersonSchema } from "../schemas";

describe("JSON-LD", () => {
  it("cannot terminate the script with authored text and preserves JSON", () => {
    const schema = { title: '</script><script>alert("x")</script>' };
    const html = renderToStaticMarkup(<JsonLd schema={schema} />);
    expect(html.match(/<script/g)).toHaveLength(1);
    const json = html.slice(
      html.indexOf(">") + 1,
      html.lastIndexOf("</script>"),
    );
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual(schema);
  });
  it("aligns article and person identities with locale canonicals", () => {
    const post = buildBlogPostingSchema({
      authorName: "Author",
      createdAt: "2026-01-01",
      updatedAt: new Date("2026-09-27"),
      locale: "es",
      slug: "story",
      title: "Story",
    });
    expect(post.url).toBe("https://getrandomtrip.com/blog/story");
    expect(post.dateModified).toBe("2026-09-27T00:00:00.000Z");
    expect(buildPersonSchema({ name: "Alex", slug: "alex" }, "en").url).toBe(
      "https://getrandomtrip.com/en/trippers/alex",
    );
  });
});
