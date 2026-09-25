import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/journey/JourneyUserBadge", () => ({
  JourneyUserBadge: () => <div data-component="JourneyUserBadge" />,
}));

function renderNavigation(hideProfile = false) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    <JourneyContentNavigation
      activeTab="details"
      hideProfile={hideProfile}
      onTabChange={vi.fn()}
      tabs={[
        { id: "details", label: "Details" },
        { id: "preferences", label: "Preferences" },
      ]}
      userBadgeLabels={en.journey.userBadge}
    />,
  );
  return container;
}

describe("JourneyContentNavigation profile alignment", () => {
  it("left-aligns the profile with the mobile gutter without doubling desktop padding", () => {
    const container = renderNavigation();
    const profile = container.querySelector(
      '[data-component="JourneyUserBadge"]',
    )?.parentElement;

    expect(profile).not.toBeNull();
    expect(profile?.classList.contains("justify-start")).toBe(true);
    expect(profile?.classList.contains("justify-center")).toBe(false);
    expect(profile?.classList.contains("px-4")).toBe(true);
    expect(profile?.classList.contains("md:px-0")).toBe(true);
    expect(
      profile?.parentElement?.parentElement?.classList.contains("md:px-4"),
    ).toBe(true);
  });

  it("keeps profile-free navigation unchanged", () => {
    const container = renderNavigation(true);

    expect(
      container.querySelector('[data-component="JourneyUserBadge"]'),
    ).toBeNull();
    expect(container.textContent).toContain("Details");
    expect(container.textContent).toContain("Preferences");
  });
});
