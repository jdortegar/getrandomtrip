import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewBlogPostShell } from "../NewBlogPostShell";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";
import dictionary from "@/dictionaries/en.json";
import type { BlogFormDraft } from "@/types/blog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Keep the real shell, navigation and action bar; field editors are not needed
// to exercise seeded drafts. No TinyMCE/image uploads or network calls occur.
const copy = {
  ...dictionary.tripperBlogs.form,
  contentTabs: dictionary.tripperBlogs.form.contentTabs.map((tab) => ({
    ...tab,
    substeps: [],
  })),
};
const validDraft: BlogFormDraft = {
  status: "draft",
  title: "A trip",
  subtitle: "",
  coverUrl: "/cover.jpg",
  featureText: "A journey worth sharing",
  featureAttribution: "",
  sections: [],
  faq: [],
  gallery: [],
  travelType: [],
  excuseKey: [],
  tripperNote: null,
};
let harness: DomHarness;
beforeEach(() => {
  harness = createDomHarness();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Unexpected network request");
    }),
  );
});
afterEach(() => {
  harness.unmount();
  vi.unstubAllGlobals();
});
function render(draft: BlogFormDraft) {
  harness.render(
    <NewBlogPostShell
      dict={copy}
      initialDraft={draft}
      initialDraftId="blog-1"
      locale="en"
      userBadgeLabels={dictionary.journey.userBadge}
    />,
  );
}
function button(label: string) {
  const match = Array.from(harness.container.querySelectorAll("button")).find(
    (node) => node.textContent === label,
  );
  if (!match) throw new Error(`Missing button: ${label}`);
  return match;
}
function hasSubmit() {
  return Array.from(harness.container.querySelectorAll("button")).some(
    (node) => node.textContent === copy.actionBar.submitForReview,
  );
}

describe("blog optional FAQ navigation", () => {
  it.each([
    { faq: [], complete: false },
    { faq: [{ question: "", answer: "" }], complete: false },
    { faq: [{ question: "When?", answer: "" }], complete: false },
    { faq: [{ question: "", answer: "Tomorrow" }], complete: false },
    { faq: [{ question: "When?", answer: "Tomorrow" }], complete: true },
  ])("reaches submission with optional FAQ $faq", ({ faq, complete }) => {
    render({ ...validDraft, faq });
    const indicator = button("FAQ").parentElement!.querySelector("button")!;
    expect(indicator.textContent).toBe(complete ? "" : "3");
    expect(indicator.querySelector("svg") !== null).toBe(complete);
    harness.click(button(copy.actionBar.next)); // General -> Content
    harness.click(button(copy.actionBar.next)); // Content -> FAQ
    expect(button(copy.actionBar.next).disabled).toBe(false);
    expect(hasSubmit()).toBe(false);
    harness.click(button(copy.actionBar.next)); // FAQ -> Gallery
    expect(hasSubmit()).toBe(true);
    expect(button(copy.actionBar.submitForReview).disabled).toBe(false);
    harness.click(button(copy.actionBar.submitForReview));
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      copy.submitConfirmTitle,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["title", "coverUrl", "featureText"] as const)(
    "blocks forward navigation and final submission without %s",
    (field) => {
      render({ ...validDraft, [field]: "" });
      if (field === "featureText") harness.click(button(copy.actionBar.next));
      expect(button(copy.actionBar.next).disabled).toBe(true);
      const gallery = Array.from(
        harness.container.querySelectorAll('aside [role="button"]'),
      ).find((node) => node.querySelector("h2")?.textContent === "Gallery");
      expect(gallery).not.toBeUndefined();
      harness.click(gallery!);
      expect(hasSubmit()).toBe(false);
      expect(button(copy.actionBar.next).disabled).toBe(true);
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
