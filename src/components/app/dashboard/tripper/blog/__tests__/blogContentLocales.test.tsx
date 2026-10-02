import { act, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewBlogPostShell } from "../NewBlogPostShell";
import { BlogContentLanguage } from "../BlogContentLanguage";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";
import dictionary from "@/dictionaries/en.json";
import { mapBlogPostToDraft } from "@/lib/helpers/blog-form";
import type { BlogFormDraft, BlogFormDraftOnChange } from "@/types/blog";

const { callbacks, mounts, unmounts, push } = vi.hoisted(() => ({
  callbacks: [] as BlogFormDraftOnChange[],
  mounts: vi.fn(),
  unmounts: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../BlogFormContent", async (importOriginal) => {
  const { useEffect } = await import("react");
  const { BlogFormContent } =
    await importOriginal<typeof import("../BlogFormContent")>();
  return {
    BlogFormContent: (props: ComponentProps<typeof BlogFormContent>) => {
      callbacks.push(props.onChange);
      useEffect(() => {
        mounts();
        return () => {
          unmounts();
        };
      }, []);
      return (
        <>
          <BlogFormContent {...props} />
          <output data-testid="draft">{JSON.stringify(props.draft)}</output>
          <button onClick={props.onFinish} type="button">
            {props.copy.actionBar.submitForReview}
          </button>
        </>
      );
    },
  };
});
let harness: DomHarness;
const initial = mapBlogPostToDraft({
  title: "Español",
  content: "<p>Original</p>",
  blocks: [],
  coverUrl: "/shared.jpg",
});
const copy = dictionary.tripperBlogs.form;
function button(text: string) {
  return [...harness.container.querySelectorAll("button")].find(
    (node) => node.textContent === text,
  )!;
}
function languageSelect() {
  return harness.container.querySelector<HTMLSelectElement>(
    '[data-component="BlogContentLanguage"] select',
  )!;
}
function selectLanguage(locale: "es" | "en") {
  act(() => {
    const select = languageSelect();
    select.value = locale;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
function draft(): BlogFormDraft {
  return JSON.parse(harness.container.querySelector("output")!.textContent!);
}
function change<K extends keyof BlogFormDraft>(
  key: K,
  value: BlogFormDraft[K],
) {
  act(() => callbacks.at(-1)!(key, value));
}
beforeEach(() => {
  callbacks.length = 0;
  vi.clearAllMocks();
  vi.useFakeTimers();
  harness = createDomHarness();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ blog: { id: "post-1" } })),
  );
});
afterEach(() => {
  harness.unmount();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function render(
  existing = true,
  overrides: Partial<ComponentProps<typeof NewBlogPostShell>> = {},
) {
  harness.render(
    <NewBlogPostShell
      dict={copy}
      initialDraft={initial}
      initialDraftId={existing ? "post-1" : undefined}
      locale="en"
      userBadgeLabels={dictionary.journey.userBadge}
      {...overrides}
    />,
  );
}

describe("content language editor", () => {
  it("places one language dropdown above the editor on every step", () => {
    render();
    const form = harness.container.querySelector(
      '[data-component="BlogFormContent"]',
    )!;
    const bar = form.querySelector('[data-component="TranslateBlogCopy"]')!;
    const language = bar.querySelector(
      '[data-component="BlogContentLanguage"]',
    )!;
    const step = form.querySelector('[data-component="TitleImageStep"]')!;
    expect(form.firstElementChild).toBe(bar);
    expect(bar.querySelector('[data-component="BlogContentLanguage"]')).toBe(language);
    expect(step.querySelector('[data-component="BlogContentLanguage"]')).toBeNull();
    expect(step.querySelector("input")?.id).toBe("blog-title");
    expect(
      harness.container.querySelectorAll(
        '[data-component="BlogContentLanguage"]',
      ),
    ).toHaveLength(1);
    const row = bar.querySelector('[data-component="BlogLocaleRow"]')!;
    expect(row.contains(language)).toBe(true);
    expect(language.querySelector("label")?.textContent).toBe(
      copy.contentLanguage.label,
    );
    expect(row.querySelector("button")?.textContent).toBe(copy.translate.toEnglish);
    expect(button(copy.editSubmit)).toBeTruthy();
    expect(language.querySelector("button")).toBeNull();
    expect((button(copy.translate.toSpanish) as HTMLButtonElement).disabled).toBe(true);
    expect((button(copy.translate.toEnglish) as HTMLButtonElement).disabled).toBe(false);
    expect(languageSelect().options.length).toBe(2);
    expect(
      [...languageSelect().options].map((option) => option.textContent),
    ).toEqual([copy.contentLanguage.es, copy.contentLanguage.en]);
  });

  it("keeps keyboard focus on the dropdown after the locale-keyed editor remount", () => {
    render();
    const previous = languageSelect();
    act(() => previous.focus());
    selectLanguage("en");
    expect(languageSelect()).not.toBe(previous);
    expect(document.activeElement).toBe(languageSelect());
    selectLanguage("es");
    expect(document.activeElement).toBe(languageSelect());
    expect(fetch).not.toHaveBeenCalled();
  });

  it("restores selector focus when the native menu blurs before its change event", () => {
    render();
    expect(document.activeElement).not.toBe(languageSelect());
    act(() => {
      languageSelect().focus();
      languageSelect().blur();
    });
    expect(document.activeElement).not.toBe(languageSelect());
    selectLanguage("en");
    expect(document.activeElement).toBe(languageSelect());
  });

  it.each([
    { mode: "adminReadOnly", status: "draft" },
    { mode: "tripper", status: "pending_review" },
    { mode: "tripper", status: "pending_tripper_review" },
  ] as const)(
    "allows language viewing without enabling edits in $mode/$status",
    ({ mode, status }) => {
      render(true, { mode, initialDraft: { ...initial, status } });
      expect(languageSelect().disabled).toBe(false);
      expect(languageSelect().closest("fieldset[disabled]")).toBeNull();
      expect(
        harness.container
          .querySelector("#blog-title")
          ?.closest("fieldset[disabled]"),
      ).not.toBeNull();
      selectLanguage("en");
      expect(languageSelect().value).toBe("en");
      expect(draft().title).toBe("");
      expect(
        harness.container
          .querySelector("#blog-title")
          ?.closest("fieldset[disabled]"),
      ).not.toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("keeps the language choice for later steps without adding another selector", () => {
    render(true, { mode: "adminCreate" });
    selectLanguage("en");
    change("title", "English title");
    const gallery = [
      ...harness.container.querySelectorAll('aside [role="button"]'),
    ].find(
      (node) =>
        node.querySelector("h2")?.textContent === copy.contentTabs[3].label,
    )!;
    harness.click(gallery);
    expect(
      harness.container.querySelector('[data-component="GalleryStep"]'),
    ).not.toBeNull();
    expect(languageSelect().value).toBe("en");
    expect(draft().title).toBe("English title");
    const general = [
      ...harness.container.querySelectorAll('aside [role="button"]'),
    ].find(
      (node) =>
        node.querySelector("h2")?.textContent === copy.contentTabs[0].label,
    )!;
    harness.click(general);
    expect(languageSelect().value).toBe("en");
    expect(draft().title).toBe("English title");
  });

  it("defaults to Spanish despite English UI and keeps independent unsaved text, rich text and FAQ", () => {
    render();
    expect(draft().title).toBe("Español");
    expect(languageSelect().value).toBe("es");
    change("title", "Español editado");
    selectLanguage("en");
    expect(draft().title).toBe("");
    expect(languageSelect().value).toBe("en");
    expect(draft().sections).toEqual([{ title: "", description: "" }]);
    change("title", "English draft");
    change("sections", [
      { title: "Heading", description: "<p>Unsaved rich text</p>" },
    ]);
    change("faq", [{ question: "When?", answer: "Soon" }]);
    selectLanguage("es");
    expect(draft().title).toBe("Español editado");
    expect(draft().sections).toEqual([
      { title: "", description: "<p>Original</p>" },
    ]);
    selectLanguage("en");
    expect((button(copy.translate.toEnglish) as HTMLButtonElement).disabled).toBe(true);
    expect((button(copy.translate.toSpanish) as HTMLButtonElement).disabled).toBe(false);
    expect(draft()).toMatchObject({
      title: "English draft",
      sections: [{ title: "Heading", description: "<p>Unsaved rich text</p>" }],
      faq: [{ question: "When?", answer: "Soon" }],
      coverUrl: "/shared.jpg",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("remounts editors and ignores late callbacks even after switching back", () => {
    render();
    const stale = callbacks.at(-1)!;
    selectLanguage("en");
    act(() => stale("sections", [{ title: "", description: "<p>Stale</p>" }]));
    expect(draft().sections[0].description).toBe("");
    selectLanguage("es");
    change("title", "Current Spanish");
    act(() => stale("title", "STALE"));
    expect(draft().title).toBe("Current Spanish");
    expect(mounts).toHaveBeenCalledTimes(3);
    expect(unmounts).toHaveBeenCalledTimes(2);
  });
  it("autosaves a new incomplete English draft with canonical Spanish and shared media", async () => {
    render(false);
    selectLanguage("en");
    change("title", "Incomplete English");
    change("coverUrl", "/new-shared.jpg");
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    const args = vi.mocked(fetch).mock.calls[0];
    expect(args[0]).toBe("/api/tripper/blogs");
    expect(args[1]?.method).toBe("POST");
    expect(JSON.parse(String(args[1]?.body))).toMatchObject({
      title: "Español",
      content: "<p>Original</p>",
      coverUrl: "/new-shared.jpg",
      translations: { en: { title: "Incomplete English", content: null } },
    });
    selectLanguage("es");
    expect(draft().coverUrl).toBe("/new-shared.jpg");
  });

  it("keeps existing edits unsaved until the form's final action persists both languages", async () => {
    render();
    selectLanguage("en");
    change("title", "English edit");
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(fetch).not.toHaveBeenCalled();

    harness.click(button(copy.actionBar.submitForReview));
    const confirm = [
      ...document.querySelectorAll('[role="dialog"] button'),
    ].find((node) => node.textContent === copy.actionBar.submitForReview)!;
    await act(async () => harness.click(confirm));

    const args = vi.mocked(fetch).mock.calls[0];
    expect(args[0]).toBe("/api/tripper/blogs/post-1");
    expect(args[1]?.method).toBe("PATCH");
    expect(JSON.parse(String(args[1]?.body))).toMatchObject({
      title: "Español",
      content: "<p>Original</p>",
      translations: { en: { title: "English edit", content: null } },
    });
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/tripper/blogs/post-1/submit",
      {
        method: "POST",
      },
    );
    expect(push).toHaveBeenCalledWith("/en/dashboard/tripper/blog");
  });

  it("disables language changes while the final save is pending", async () => {
    let resolveSave!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    render();
    harness.click(button(copy.actionBar.submitForReview));
    const confirm = [
      ...document.querySelectorAll('[role="dialog"] button'),
    ].find((node) => node.textContent === copy.actionBar.submitForReview)!;
    await act(async () => harness.click(confirm));
    expect(languageSelect().disabled).toBe(true);
    selectLanguage("en");
    expect(languageSelect().value).toBe("es");
    await act(async () =>
      resolveSave(Response.json({ blog: { id: "post-1" } })),
    );
    expect(push).toHaveBeenCalledWith("/en/dashboard/tripper/blog");
  });
});

describe("content language selection", () => {
  it("uses a labeled native dropdown, associated hint and shared visible keyboard focus", () => {
    const onChange = vi.fn();
    harness.render(
      <BlogContentLanguage
        copy={copy.contentLanguage}
        locale="es"
        onChange={onChange}
      />,
    );
    const select = languageSelect();
    expect(
      harness.container.querySelector<HTMLLabelElement>("label")?.htmlFor,
    ).toBe(select.id);
    expect(harness.container.querySelector("label")?.textContent).toBe(
      copy.contentLanguage.label,
    );
    expect(
      document.getElementById(select.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toBe(copy.contentLanguage.hint);
    expect(select.className).toContain("focus:ring-2");
    expect(select.className).toContain("bg-gray-100");
    expect(select.tabIndex).toBe(0);
    act(() => select.focus());
    expect(document.activeElement).toBe(select);
    selectLanguage("en");
    expect(onChange).toHaveBeenCalledWith("en");
  });

  it("disables the dropdown without changing the selected locale", () => {
    const onChange = vi.fn();
    harness.render(
      <BlogContentLanguage
        copy={copy.contentLanguage}
        disabled
        locale="es"
        onChange={onChange}
      />,
    );
    expect(languageSelect().disabled).toBe(true);
    selectLanguage("en");
    expect(onChange).not.toHaveBeenCalled();
    expect(languageSelect().value).toBe("es");
  });

  it("gives separate instances independent control and hint IDs", () => {
    harness.render(
      <>
        <BlogContentLanguage
          copy={copy.contentLanguage}
          locale="es"
          onChange={vi.fn()}
        />
        <BlogContentLanguage
          copy={copy.contentLanguage}
          locale="en"
          onChange={vi.fn()}
        />
      </>,
    );
    const selects = [...harness.container.querySelectorAll("select")];
    expect(new Set(selects.map((select) => select.id)).size).toBe(2);
    expect(
      new Set(selects.map((select) => select.getAttribute("aria-describedby")))
        .size,
    ).toBe(2);
    expect(selects.map((select) => select.value)).toEqual(["es", "en"]);
  });
});
