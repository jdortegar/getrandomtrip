// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
const { construct, load } = vi.hoisted(() => ({
  construct: vi.fn(),
  load: vi.fn(),
}));
vi.mock("stripe", () => ({
  default: class {
    constructor(key: string) {
      construct(key);
    }
  },
}));
vi.mock("@stripe/stripe-js", () => ({ loadStripe: load }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});
it("imports the server without payment keys and refuses lazy construction", async () => {
  vi.stubEnv("STRIPE_SECRET_KEY", undefined);
  const { getStripe } = await import("../stripe");
  expect(construct).not.toHaveBeenCalled();
  expect(getStripe).toThrow("not set");
});
it.each([undefined, "nonproduction", "unknown"])(
  "rejects live server keys for %s before SDK construction",
  async (mode) => {
    vi.stubEnv("RT_DEPLOY_ENV", mode);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_not-a-real-key");
    const { getStripe } = await import("../stripe");
    expect(getStripe).toThrow("Only Stripe test keys");
    expect(construct).not.toHaveBeenCalled();
  },
);
it.each([
  ["production", "sk_live_fake"],
  ["nonproduction", "sk_test_fake"],
  ["nonproduction", "rk_test_fake"],
])("allows %s server key mode", async (mode, key) => {
  vi.stubEnv("RT_DEPLOY_ENV", mode);
  vi.stubEnv("STRIPE_SECRET_KEY", key);
  const { getStripe } = await import("../stripe");
  getStripe();
  expect(construct).toHaveBeenCalledWith(key);
});
it.each([undefined, "", "pk_live_fake"])(
  "does not load Stripe.js with missing/live nonproduction key %s",
  async (key) => {
    vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "nonproduction");
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", key);
    const { getStripePromise } = await import("../stripe-client");
    expect(await getStripePromise()).toBeNull();
    expect(load).not.toHaveBeenCalled();
  },
);
it.each([
  ["production", "pk_live_fake"],
  ["nonproduction", "pk_test_fake"],
])("preserves %s supported client load", async (mode, key) => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", mode);
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", key);
  load.mockResolvedValue({});
  const { getStripePromise } = await import("../stripe-client");
  await getStripePromise();
  expect(load).toHaveBeenCalledWith(key);
});
