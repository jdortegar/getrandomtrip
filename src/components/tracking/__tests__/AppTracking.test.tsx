import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AppTracking from "../AppTracking";
import { saveAnalyticsConsent } from "@/lib/helpers/tracking/consent";
import { trackCustomEvent } from "@/lib/helpers/tracking/gtm";

const state = vi.hoisted(() => ({
  path: "/blog/story",
  session: null as unknown,
}));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: state.session }),
}));
vi.mock("@/lib/constants/tracking/service-keys", () => ({
  GTM_ID: "GTM-TEST123",
  GA_MEASUREMENT_ID: "G-TEST123",
  ANALYTICS_HOSTNAME: "getrandomtrip.com",
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
const pageviews = () =>
  (window.dataLayer as Record<string, unknown>[]).filter(
    (event) => event.event === "page_view",
  );

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  state.path = "/blog/story";
  state.session = null;
  window.location.href = `https://getrandomtrip.com${state.path}`;
  window.dataLayer = [];
  // Stub external script insertion: integration tests never make Google requests.
  vi.spyOn(document.head, "appendChild").mockImplementation((node) => node);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("owns one pageview per pathname, not query or session changes; revocation disables immediately", () => {
  act(() => root.render(<AppTracking />));
  expect(pageviews()).toHaveLength(0);
  act(() => saveAnalyticsConsent("granted"));
  expect(pageviews()).toHaveLength(1);
  state.session = { user: { id: "private-id" } };
  window.location.href = `https://getrandomtrip.com${state.path}?email=private`;
  act(() => root.render(<AppTracking />));
  expect(pageviews()).toHaveLength(1);
  state.path = "/en/contact";
  window.location.href = `https://getrandomtrip.com${state.path}`;
  act(() => root.render(<AppTracking />));
  expect(pageviews()).toHaveLength(2);
  act(() => {
    saveAnalyticsConsent("denied");
    expect(
      (window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"],
    ).toBe(true);
    expect(trackCustomEvent({ event: "login", method: "email" })).toBe(false);
  });
  expect(JSON.stringify(window.dataLayer)).not.toMatch(
    /private-id|email=private/,
  );
});

it("does not pageview or scroll private/token routes after public navigation", () => {
  saveAnalyticsConsent("granted");
  act(() => root.render(<AppTracking />));
  state.path = "/en/invite/secret";
  window.location.href = `https://getrandomtrip.com${state.path}`;
  act(() => root.render(<AppTracking />));
  act(() => window.dispatchEvent(new Event("scroll")));
  expect(pageviews()).toHaveLength(1);
  expect(
    (window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"],
  ).toBe(true);
  expect(JSON.stringify(window.dataLayer)).not.toContain("secret");
});
