import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import type { ExperienceFormDraft } from "@/types/tripper";
import { AboutExperienceStep } from "../AboutExperienceStep";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "en" }) }));
vi.mock("@/components/ui/ImageUploadTile", () => ({
  ImageUploadTile: () => null,
}));
vi.mock("@/components/ui/MultiSelectInput", () => ({
  MultiSelectInput: ({
    id,
    options,
  }: {
    id: string;
    options: { value: string }[];
  }) => (
    <div data-options={options.map(({ value }) => value).join(",")} id={id} />
  ),
}));
let root: Root;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
});

function render(isAdmin: boolean) {
  const onChange = vi.fn();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <AboutExperienceStep
        copy={en.tripperExperiences.form}
        form={
          {
            type: ["couple", "family"],
            level: "essenza",
            excuseKey: ["escapada-romantica"],
            season: [],
            minNights: 2,
            title: "",
            teaser: "",
            description: "",
            heroImage: "",
            createBlogPost: false,
          } as unknown as ExperienceFormDraft
        }
        imageState={{
          onHeroSelect: vi.fn(),
          onHeroRemove: vi.fn(),
          onEntryImageSelect: vi.fn(),
          onEntryImageRemove: vi.fn(),
        }}
        isAdmin={isAdmin}
        onChange={onChange}
      />,
    ),
  );
  return onChange;
}

describe("AboutExperienceStep XSED level", () => {
  it("does not offer XSED as a travel type even to admins", () => {
    render(true);
    expect(
      container.querySelector("#exp-type")?.getAttribute("data-options"),
    ).toBe("couple,family,group,solo,honeymoon,paws");
  });
  it("preserves travel types and excuses when selecting XSED, while enforcing duration", () => {
    const onChange = render(true);
    const select = container.querySelector<HTMLSelectElement>("#exp-level")!;
    act(() => {
      select.value = "xsed";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onChange.mock.calls).toEqual([
      ["level", "xsed"],
      ["minNights", 1],
      ["maxNights", 1],
    ]);
  });
  it("keeps XSED unavailable to tripper authors", () => {
    render(false);
    expect(
      container.querySelector('#exp-level option[value="xsed"]'),
    ).toBeNull();
  });
});
