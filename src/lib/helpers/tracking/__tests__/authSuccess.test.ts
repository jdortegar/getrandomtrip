import { beforeEach, expect, it, vi } from "vitest";
vi.mock("../gtm", () => ({ trackCustomEvent: vi.fn(() => true) }));
vi.mock("../consent", () => ({
  readAnalyticsConsent: vi.fn(() => "granted"),
  analyticsGrantedAt: vi.fn(() => 0),
}));
import { trackCustomEvent } from "../gtm";
import { readAnalyticsConsent } from "../consent";
import { trackOAuthSuccess } from "../authSuccess";

beforeEach(() => {
  vi.clearAllMocks();
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  vi.mocked(readAnalyticsConsent).mockReturnValue("granted");
});
it("does not report a click or missing/expired server receipt", () => {
  expect(trackOAuthSuccess()).toBe(false);
  expect(
    trackOAuthSuccess({ id: "expired", event: "login", issuedAt: 0 }),
  ).toBe(false);
  expect(trackCustomEvent).not.toHaveBeenCalled();
});
it("reports server-confirmed Google signup once, without receipt identity", () => {
  const receipt = {
    id: "success",
    event: "sign_up" as const,
    issuedAt: Date.now(),
  };
  expect(trackOAuthSuccess(receipt)).toBe(true);
  expect(trackOAuthSuccess(receipt)).toBe(false);
  expect(trackCustomEvent).toHaveBeenCalledExactlyOnceWith({
    event: "sign_up",
    method: "google",
  });
});
it("does not replay a pre-consent OAuth success after later opt-in", () => {
  const receipt = {
    id: "without-consent",
    event: "login" as const,
    issuedAt: Date.now(),
  };
  vi.mocked(readAnalyticsConsent).mockReturnValue("denied");
  expect(trackOAuthSuccess(receipt)).toBe(false);
  vi.mocked(readAnalyticsConsent).mockReturnValue("granted");
  expect(trackOAuthSuccess(receipt)).toBe(false);
  expect(trackCustomEvent).not.toHaveBeenCalled();
});

it("does not replay a denied receipt after module reload and later opt-in", async () => {
  const receipt = {
    id: "reload-denied",
    event: "sign_up" as const,
    issuedAt: Date.now(),
  };
  vi.mocked(readAnalyticsConsent).mockReturnValue("denied");
  expect(trackOAuthSuccess(receipt)).toBe(false);
  expect(window.localStorage.getItem("rt-auth-consumed-through")).toBe(
    String(receipt.issuedAt),
  );
  expect(window.localStorage.getItem("rt-last-oauth-success")).toBeNull();
  vi.resetModules();
  vi.mocked(readAnalyticsConsent).mockReturnValue("granted");
  const { trackOAuthSuccess: afterReload } = await import("../authSuccess");
  expect(afterReload(receipt)).toBe(false);
  expect(trackCustomEvent).not.toHaveBeenCalled();
});
