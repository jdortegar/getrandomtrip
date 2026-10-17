import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";
import dictionary from "@/dictionaries/en.json";
import { emptyBlogEditorDraft } from "@/lib/helpers/blog-form";
import { BlogEditorLocaleTools } from "../BlogEditorLocaleTools";
import { BlogMediaMismatchWarning } from "../BlogMediaMismatchWarning";

let harness: DomHarness;
const form = dictionary.tripperBlogs.form;

beforeEach(() => {
  harness = createDomHarness();
});
afterEach(() => {
  harness.unmount();
});

describe("BlogEditorLocaleTools", () => {
  it("hides tools while editing the original language", () => {
    harness.render(
      <BlogEditorLocaleTools
        contentLocale="es"
        copy={form.mediaMismatch}
        draft={emptyBlogEditorDraft("es")}
        mismatch={{ extra: ["/b.jpg"], missing: ["/a.jpg"] }}
      />,
    );
    expect(
      harness.container.querySelector('[data-component="BlogEditorLocaleTools"]'),
    ).toBeNull();
  });
});

describe("BlogMediaMismatchWarning", () => {
  it("renders missing and extra media URLs", () => {
    harness.render(
      <BlogMediaMismatchWarning
        copy={form.mediaMismatch}
        mismatch={{ extra: ["/b.jpg"], missing: ["/a.jpg"] }}
      />,
    );
    const text = harness.container.textContent ?? "";
    expect(text).toContain(form.mediaMismatch.title);
    expect(text).toContain("/a.jpg");
    expect(text).toContain("/b.jpg");
  });
});
