import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { NewExperienceShell } from "../NewExperienceShell";
import type { ExperienceFormDraft } from "@/types/tripper";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/journey/JourneyContentNavigation", () => ({
  default: () => null,
}));
vi.mock("@/components/journey/JourneyProgressSidebar", () => ({
  default: () => null,
}));
vi.mock("../ExperienceFormContent", () => ({
  ExperienceFormContent: ({
    onChange,
    onSubmit,
  }: {
    onChange: (key: string, value: string) => void;
    onSubmit: () => void;
  }) => (
    <>
      <button onClick={() => onChange("level", "xsed")}>Choose XSED</button>
      <button onClick={onSubmit}>Finalize</button>
    </>
  ),
}));
vi.mock("@/components/ui/Modal", () => ({
  Modal: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
let root: Root;
let container: HTMLDivElement;
const draft = {
  status: "DRAFT",
  title: "Trip",
  type: ["couple", "family"],
  level: "xsed",
  teaser: "Teaser",
  description: "Body",
  heroImage: "/trip.jpg",
  tags: [],
  destinationCountry: "Argentina",
  destinationCity: "Mendoza",
  excuseKey: ["escapada-romantica"],
  climate: "any",
  minPax: 1,
  maxPax: 2,
  minNights: 1,
  maxNights: 1,
  estimatedCost: "",
  season: [],
  transport: "any",
  travelTime: "",
  maxTravelTime: "no-limit",
  departPref: "any",
  arrivePref: "any",
  accommodationType: "any",
  accommodations: [],
  activities: [
    {
      name: "Hike",
      durationRhythm: null,
      description: "",
      risks: "",
      image: null,
    },
  ],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  createBlogPost: false,
} satisfies ExperienceFormDraft;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "draft-id" }) }),
  );
});
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function render(
  mode: "adminCreate" | "adminEdit" = "adminCreate",
  level = "xsed",
) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <NewExperienceShell
        adminCopyId={mode === "adminEdit" ? "copy-id" : undefined}
        dict={en.tripperExperiences.form}
        initialDraft={{ ...draft, level }}
        initialDraftId={mode === "adminEdit" ? "original-id" : undefined}
        locale="en"
        mode={mode}
        userBadgeLabels={en.journey.userBadge}
      />,
    ),
  );
}
async function click(text: string) {
  await act(async () => {
    Array.from(container.querySelectorAll("button"))
      .filter((button) => button.textContent === text)
      .at(-1)!
      .click();
  });
}

describe("explicit XSED setup handoff", () => {
  it("saves the chosen types then opens setup rather than publishing", async () => {
    render();
    await click("Finalize");
    await click("Continue to drop setup");
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/tripper/experiences");
    expect(JSON.parse(options!.body as string)).toMatchObject({
      type: ["couple", "family"],
      level: "xsed",
      excuseKey: draft.excuseKey,
    });
    expect(navigation.push).toHaveBeenCalledWith(
      "/en/dashboard/admin/xsed/draft-id/edit",
    );
  });
  it("uses review-copy save and copy setup without mutating the original", async () => {
    render("adminEdit");
    expect(
      Array.from(container.querySelectorAll("button")).filter(
        (button) => button.textContent === "Continue to drop setup",
      ),
    ).toHaveLength(1);
    await click("Continue to drop setup");
    await click("Continue to drop setup");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
      "/api/admin/experiences/copy-id/edit-copy",
    );
    expect(navigation.push).toHaveBeenCalledWith(
      "/en/dashboard/admin/xsed/copy-id/edit",
    );
  });
  it("does not navigate on level selection or autosave", async () => {
    vi.useFakeTimers();
    render("adminCreate", "essenza");
    await click("Choose XSED");
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(navigation.push).not.toHaveBeenCalled();
    expect(vi.mocked(fetch).mock.calls[0][0]).not.toContain("submit");
  });
});
