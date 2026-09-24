import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { normalizeXsedDraft } from "@/lib/helpers/xsed-form";
import { persistXsedDraft } from "@/lib/helpers/persistXsedDraft";
import { XsedDinnerStep } from "../XsedDinnerStep";
import { XsedActivityStep } from "../XsedActivityStep";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
vi.mock("../XsedActivityEntryFields", () => ({
  XsedActivityEntryFields: ({
    onChange,
  }: {
    onChange: (key: string, value: string) => void;
  }) => (
    <button onClick={() => onChange("name", "Edited")}>Edit activity</button>
  ),
}));
vi.mock("../XsedSectionFields", () => ({
  XsedSectionFields: ({ onChange }: { onChange: (patch: object) => void }) => (
    <button onClick={() => onChange({ body: "Edited body" })}>
      Edit section
    </button>
  ),
}));
vi.mock("../XsedContactFields", () => ({ XsedContactFields: () => null }));
let root: Root;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
const activities = ["Dinner", "Hike", "Kayak", "Museum"].map((name) => ({
  name,
  durationRhythm: null,
  description: name,
  risks: "",
  image: `/${name}.jpg`,
}));
const sections = ["Stay", "Dinner", "Hike", "Extra"].map((title) => ({
  title,
  body: title,
  photos: [],
  contact: { name: title, phone: "", address: "", hour: "" },
}));

describe("lossless shared experience → drop editor", () => {
  it("pads minimum slots but preserves every existing activity, section and image on serialization", async () => {
    const form = normalizeXsedDraft({
      activities,
      sections,
      itinerary: [{ title: "Day", description: "Text", image: "/day.jpg" }],
    });
    expect(form.activities).toEqual(activities);
    expect(form.sections).toEqual(sections);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    await persistXsedDraft(form, "canonical", "Save failed");
    const saved = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(saved.activities).toEqual(activities);
    expect(saved.sections).toEqual(sections);
    expect(saved.itinerary[0].image).toBe("/day.jpg");
  });
  it.each([XsedDinnerStep, XsedActivityStep])(
    "preserves trailing entries while editing primary fields",
    (Step) => {
      const form = normalizeXsedDraft({ activities, sections });
      const onChange = vi.fn();
      const fields = en.adminXsed.form.fields;
      container = document.createElement("div");
      root = createRoot(container);
      act(() =>
        root.render(
          <Step
            contactCopy={fields.contact}
            copy={fields.activities}
            form={form}
            imageCopy={fields}
            onChange={onChange}
            sectionsCopy={fields.sections}
          />,
        ),
      );
      act(() =>
        (container.querySelector("button") as HTMLButtonElement).click(),
      );
      expect(onChange.mock.calls[0][0].activities).toHaveLength(4);
      expect(onChange.mock.calls[0][0].activities.slice(2)).toEqual(
        activities.slice(2),
      );
      act(() =>
        Array.from(container.querySelectorAll("button"))
          .find((button) => button.textContent === "Edit section")!
          .click(),
      );
      expect(onChange.mock.calls[1][0].sections).toHaveLength(4);
      expect(onChange.mock.calls[1][0].sections[3]).toEqual(sections[3]);
    },
  );
});
