import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signOut } from "next-auth/react";
import { NavbarProfile } from "@/components/NavbarProfile";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";

const navigation = vi.hoisted(() => ({ locale: "es" }));
vi.mock("next/navigation", () => ({ useParams: () => navigation }));
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("@/components/ui/UserAvatar", () => ({ UserAvatar: () => null }));
vi.mock("@/components/app/dashboard/tripper/TripperUnreadDot", () => ({
  TripperUnreadDot: () => null,
}));

let harness: DomHarness;
const fallbackSignOut = vi.fn();

beforeEach(() => {
  navigation.locale = "es";
  vi.clearAllMocks();
  harness = createDomHarness();
});
afterEach(() => harness.unmount());

function openProfile(hasSession = true) {
  const copy = navigation.locale === "en" ? enCopy : esCopy;
  harness.render(
    <NavbarProfile
      labels={copy.navbarProfile}
      onSignOut={fallbackSignOut}
      session={hasSession ? { user: { roles: ["admin", "tripper"] } } : null}
      user={{ name: "Alex", role: "admin", roles: ["admin", "tripper"] }}
    />,
  );
  harness.click(harness.container.querySelector('button[aria-haspopup="menu"]')!);
  return copy.navbarProfile;
}

describe("NavbarProfile — locale-aware navigation", () => {
  it.each(["en", "es"])("preserves %s across every dashboard menu link", (locale) => {
    navigation.locale = locale;
    openProfile();

    const prefix = locale === "en" ? "/en" : "";
    const hrefs = Array.from(harness.container.querySelectorAll('a[role="menuitem"]'))
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      `${prefix}/dashboard/traveler`,
      `${prefix}/dashboard/tripper`,
      `${prefix}/dashboard/admin`,
      `${prefix}/dashboard/admin/xsed/new`,
    ]);
  });

  it.each(["en", "es"])("returns to the %s home page after session sign-out", (locale) => {
    navigation.locale = locale;
    const copy = openProfile();
    const button = Array.from(harness.container.querySelectorAll('button[role="menuitem"]'))
      .find((item) => item.textContent?.trim() === copy.signOut)!;
    harness.click(button);

    expect(signOut).toHaveBeenCalledExactlyOnceWith({
      callbackUrl: locale === "en" ? "/en" : "/",
    });
    expect(fallbackSignOut).not.toHaveBeenCalled();
    expect(harness.container.querySelector('[role="menu"]')).toBeNull();
  });

  it("keeps the local sign-out fallback when there is no session", () => {
    const copy = openProfile(false);
    const button = Array.from(harness.container.querySelectorAll('button[role="menuitem"]'))
      .find((item) => item.textContent?.trim() === copy.signOut)!;
    harness.click(button);

    expect(fallbackSignOut).toHaveBeenCalledExactlyOnceWith();
    expect(signOut).not.toHaveBeenCalled();
    expect(harness.container.querySelector('[role="menu"]')).toBeNull();
  });
});
