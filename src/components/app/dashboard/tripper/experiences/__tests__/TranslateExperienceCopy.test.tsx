import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import type { ExperienceFormDraft } from "@/types/tripper";
import { TranslateExperienceCopy } from "../TranslateExperienceCopy";

const { requestCopyTranslation } = vi.hoisted(() => ({
  requestCopyTranslation: vi.fn(),
}));

vi.mock("@/lib/ai/requestCopyTranslation", () => ({
  requestCopyTranslation,
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const copy = en.tripperExperiences.form.translate;

function draft(title: string): ExperienceFormDraft {
  return {
    accommodationType: "any",
    accommodations: [],
    activities: [{ description: "", durationRhythm: null, image: null, name: "", risks: "" }],
    arrivePref: "any",
    climate: "any",
    createBlogPost: false,
    departPref: "any",
    description: "",
    destinationCity: "",
    destinationCountry: "",
    estimatedCost: "",
    exclusions: [],
    excuseKey: [],
    heroImage: "keep-me",
    inclusions: [],
    itinerary: [{ description: "", image: null, title: "" }],
    level: "essenza",
    maxNights: 2,
    maxPax: 2,
    maxTravelTime: "no-limit",
    minNights: 2,
    minPax: 1,
    season: [],
    status: "DRAFT",
    tags: [],
    teaser: "",
    title,
    transport: "any",
    travelTime: "",
    type: ["couple"],
  };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  requestCopyTranslation.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(form: ExperienceFormDraft, onApply = vi.fn(), onBusyChange = vi.fn()) {
  act(() => {
    root.render(
      <TranslateExperienceCopy
        copy={copy}
        form={form}
        onApply={onApply}
        onBusyChange={onBusyChange}
      />,
    );
  });
  return { onApply, onBusyChange };
}

describe("TranslateExperienceCopy", () => {
  it("disables both actions until there is prose to translate", () => {
    render(draft(""));
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons.map((button) => button.textContent)).toEqual([
      copy.toEnglish,
      copy.toSpanish,
    ]);
    expect(buttons.every((button) => button.disabled)).toBe(true);
  });

  it("writes the English translation back into the draft", async () => {
    requestCopyTranslation.mockImplementation(
      async (pieces: Array<{ text: string }>, target: string) =>
        pieces.map((piece) => `${target}:${piece.text}`),
    );
    const form = draft("Amanecer");
    const { onApply, onBusyChange } = render(form);

    await act(async () => {
      container.querySelector("button")!.click();
    });

    expect(requestCopyTranslation).toHaveBeenCalledWith(
      [{ html: false, text: "Amanecer" }],
      "en",
    );
    expect(onBusyChange).toHaveBeenNthCalledWith(1, true);
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
    const update = onApply.mock.calls[0]?.[0] as (current: ExperienceFormDraft) => ExperienceFormDraft;
    expect(update(form)).toMatchObject({
      heroImage: "keep-me",
      title: "en:Amanecer",
    });
    expect(container.querySelector("[role='alert']")).toBeNull();
  });

  it("shows an error and leaves the draft unchanged when translation fails", async () => {
    requestCopyTranslation.mockRejectedValue(new Error("model failed"));
    const { onApply } = render(draft("Amanecer"));

    await act(async () => {
      container.querySelectorAll("button")[1]!.click();
    });

    expect(requestCopyTranslation).toHaveBeenCalledWith(
      [{ html: false, text: "Amanecer" }],
      "es",
    );
    expect(onApply).not.toHaveBeenCalled();
    expect(container.querySelector("[role='alert']")?.textContent).toBe(copy.error);
    expect(container.querySelector("button")?.hasAttribute("disabled")).toBe(false);
  });
});
