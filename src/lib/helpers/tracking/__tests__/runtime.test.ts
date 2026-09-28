import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/constants/tracking/service-keys", () => ({
  GTM_ID: "GTM-TEST123",
  GA_MEASUREMENT_ID: "G-TEST123",
  ANALYTICS_HOSTNAME: "getrandomtrip.com",
}));
let runtime: typeof import("../runtime");
let events: typeof import("../gtm");
let consent: typeof import("../consent");

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  window.location.href =
    "https://getrandomtrip.com/blog/private-slug?token=secret";
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  window.dataLayer = [];
  document.getElementById("rt-gtm")?.remove();
  vi.spyOn(document.head, "appendChild").mockImplementation((node) => node);
  runtime = await import("../runtime");
  events = await import("../gtm");
  consent = await import("../consent");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const gaDisabled = () =>
  (window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"];
const payloads = () => window.dataLayer as Record<string, unknown>[];

it("does not mark rejected purchase emits as sent", () => {
  const payment = {
    transaction_id: "pi_retry",
    value: 250,
    currency: "USD",
    items: [
      {
        item_id: "trip-solo",
        item_name: "Solo trip",
        item_category: "solo",
        quantity: 1,
        price: 250,
      },
    ],
  };
  window.location.href = "https://getrandomtrip.com/checkout/success";
  expect(events.trackPurchase(payment)).toBe(false);
  consent.saveAnalyticsConsent("granted");
  // Consent alone cannot bypass route initialization.
  expect(events.trackPurchase(payment)).toBe(false);
  runtime.configureAnalytics(window.location.pathname);
  expect(events.trackPurchase(payment)).toBe(true);
  expect(events.trackPurchase(payment)).toBe(false);
});

it("permits only checkout commerce and publishes a safe flag before container initialization", () => {
  window.location.href = "https://getrandomtrip.com/en/checkout?tripId=private";
  consent.saveAnalyticsConsent("granted");
  runtime.configureAnalytics(window.location.pathname);
  runtime.loadAnalyticsContainer();
  const commerce = {
    value: 250,
    currency: "USD",
    items: [{ item_id: "trip-solo", quantity: 1, price: 250 }],
  };
  expect(events.trackPageview()).toBe(false);
  expect(events.trackScrollDepth(90)).toBe(false);
  expect(events.trackCustomEvent({ event: "login", method: "email" })).toBe(
    false,
  );
  expect(
    events.trackCustomEvent({ event: "begin_checkout", ...commerce }),
  ).toBe(true);
  expect(
    events.trackCustomEvent({
      event: "add_payment_info",
      ...commerce,
      payment_type: "stripe",
    }),
  ).toBe(true);
  expect(payloads()[1]).toMatchObject({
    rt_analytics_allowed: true,
    page_path: "/en/checkout",
  });
  expect(payloads()[3]).toMatchObject({ event: "gtm.js" });
  expect(JSON.stringify(payloads())).not.toContain("private");
  window.location.href = "https://getrandomtrip.com/blog";
  runtime.configureAnalytics(window.location.pathname);
  expect(
    events.trackCustomEvent({ event: "begin_checkout", ...commerce }),
  ).toBe(false);
  events.trackPageview();
  expect(payloads().at(-1)).toMatchObject({
    items: null,
    payment_type: null,
    value: null,
  });
});

describe("consent and collection runtime", () => {
  it("never loads GTM or queues analytics before opt-in", () => {
    expect(runtime.configureAnalytics(window.location.pathname)).toBeNull();
    runtime.loadAnalyticsContainer();
    expect(document.getElementById("rt-gtm")).toBeNull();
    expect(events.trackPageview()).toBe(false);
    expect(gaDisabled()).toBe(true);
    expect(JSON.stringify(payloads())).not.toMatch(/secret|private-slug/);
    expect(payloads()[0]).toMatchObject({
      0: "consent",
      1: "default",
      2: { analytics_storage: "denied", ad_storage: "denied" },
    });
  });
  it("orders defaults, safe fields, consent grant, initialization, then one sanitized event", () => {
    consent.saveAnalyticsConsent("granted");
    runtime.configureAnalytics(window.location.pathname);
    runtime.loadAnalyticsContainer();
    events.trackPageview();
    expect(payloads()[0]).toMatchObject({ 1: "default" });
    expect(payloads()[1]).toMatchObject({
      rt_analytics_allowed: true,
      page_location: "https://getrandomtrip.com/blog/article",
      page_referrer: "",
      page_title: "Blog article",
    });
    expect(payloads()[2]).toMatchObject({
      1: "update",
      2: {
        analytics_storage: "granted",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    });
    expect(payloads()[3]).toMatchObject({ event: "gtm.js" });
    expect(payloads()[4]).toMatchObject({
      event: "page_view",
      page_path: "/blog/article",
    });
    expect(gaDisabled()).toBe(false);
    expect(JSON.stringify(payloads())).not.toMatch(/secret|private-slug/);
  });
  it("disables already-loaded Google on private navigation and revocation", () => {
    consent.saveAnalyticsConsent("granted");
    runtime.configureAnalytics(window.location.pathname);
    runtime.loadAnalyticsContainer();
    window.location.href =
      "https://getrandomtrip.com/invite/secret?token=secret";
    runtime.configureAnalytics(window.location.pathname);
    expect(events.trackCustomEvent({ event: "login", method: "google" })).toBe(
      false,
    );
    expect(gaDisabled()).toBe(true);
    expect(payloads().at(-2)).toMatchObject({ rt_analytics_allowed: false });
    window.location.href = "https://getrandomtrip.com/blog";
    consent.saveAnalyticsConsent("denied");
    runtime.configureAnalytics(window.location.pathname);
    expect(events.trackPageview()).toBe(false);
    expect(gaDisabled()).toBe(true);
  });
  it.each(["localhost", "preview.netlify.app", "investors.getrandomtrip.com"])(
    "isolates %s even with consent",
    (host) => {
      consent.saveAnalyticsConsent("granted");
      window.location.href = `https://${host}/blog`;
      expect(runtime.configureAnalytics(window.location.pathname)).toBeNull();
      runtime.loadAnalyticsContainer();
      expect(document.getElementById("rt-gtm")).toBeNull();
    },
  );
  it("allows only deduplicated, sanitized purchase on checkout success", () => {
    window.location.href =
      "https://getrandomtrip.com/checkout/success?payment_intent_client_secret=secret";
    consent.saveAnalyticsConsent("granted");
    runtime.configureAnalytics(window.location.pathname);
    expect(events.trackPageview()).toBe(false);
    expect(events.trackScrollDepth(90)).toBe(false);
    const payment = {
      transaction_id: "pi_123",
      value: 250.5,
      currency: "USD",
      items: [
        {
          item_id: "trip-solo",
          item_name: "Solo trip",
          item_category: "solo",
          quantity: 1,
          price: 250.5,
        },
      ],
    };
    expect(events.trackPurchase(payment)).toBe(true);
    expect(events.trackPurchase(payment)).toBe(false);
    expect(payloads().filter((row) => row.event === "purchase")).toHaveLength(
      1,
    );
    expect(payloads().at(-1)).toMatchObject({
      ...payment,
      page_path: "/checkout/success",
      page_title: "Purchase confirmation",
    });
    expect(JSON.stringify(payloads())).not.toContain("secret");
  });
  it("clears owned GA cookies without clearing essential cookies", () => {
    document.cookie = "_ga=identifier; path=/";
    document.cookie = "NEXT_LOCALE=en; path=/";
    consent.saveAnalyticsConsent("denied");
    expect(document.cookie).not.toContain("_ga=");
    expect(document.cookie).toContain("NEXT_LOCALE=en");
  });
  it("fails closed when storage rejects a withdrawal write", () => {
    consent.saveAnalyticsConsent("granted");
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    consent.saveAnalyticsConsent("denied");
    expect(consent.readAnalyticsConsent()).toBe("denied");
  });
});

it("clears persisted GA event parameters before a later pageview", () => {
  consent.saveAnalyticsConsent("granted");
  window.location.href = "https://getrandomtrip.com/checkout/success";
  runtime.configureAnalytics(window.location.pathname);
  events.trackPurchase({
    transaction_id: "pi_clear",
    items: [
      {
        item_id: "trip-solo",
        item_name: "Solo trip",
        item_category: "solo",
        quantity: 1,
        price: 250,
      },
    ],
    value: 250,
    currency: "USD",
  });
  window.location.href = "https://getrandomtrip.com/blog";
  runtime.configureAnalytics(window.location.pathname);
  events.trackPageview();
  expect(payloads().at(-1)).toMatchObject({
    event: "page_view",
    items: null,
    payment_type: null,
    method: null,
    percent: null,
    trip_type: null,
    transaction_id: null,
    value: null,
    currency: null,
    user_id: null,
    user_type: null,
    user_properties: null,
  });
});

it("preserves locale for visible marketing waitlists and never maps checkout to a pageview", () => {
  consent.saveAnalyticsConsent("granted");
  window.location.href = "https://getrandomtrip.com/en/blog/story";
  expect(
    runtime.configureAnalytics(window.location.pathname, true),
  ).toMatchObject({ language: "en", page_path: "/en", page_title: "Waitlist" });
  window.location.href = "https://getrandomtrip.com/en/checkout/success";
  expect(runtime.configureAnalytics(window.location.pathname, true)).toBeNull();
  expect(events.trackPageview()).toBe(false);
  // An unlocked visitor gets normalChrome's waitlistVisible=false, even if the global gate is enabled.
  expect(
    runtime.configureAnalytics(window.location.pathname, false),
  ).toMatchObject({
    language: "en",
    purchaseOnly: true,
    page_path: "/en/checkout/success",
  });
  expect(events.trackPageview()).toBe(false);
  expect(
    events.trackPurchase({
      transaction_id: "pi_gate",
      items: [
        {
          item_id: "trip-solo",
          item_name: "Solo trip",
          item_category: "solo",
          quantity: 1,
          price: 100,
        },
      ],
      value: 100,
      currency: "USD",
    }),
  ).toBe(true);
});
