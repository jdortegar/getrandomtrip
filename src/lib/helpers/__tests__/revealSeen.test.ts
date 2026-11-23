import { beforeEach, expect, it } from "vitest";
import { hasSeenReveal, markRevealSeen } from "@/lib/helpers/revealSeen";

// The test environment has no localStorage; give each test a fresh in-memory one.
function installMemoryStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
  return storage;
}

beforeEach(() => {
  installMemoryStorage();
});

it("remembers a seen reveal per trip", () => {
  expect(hasSeenReveal("trip-1")).toBe(false);
  markRevealSeen("trip-1", new Date("2026-08-20T00:00:00.000Z"));
  expect(hasSeenReveal("trip-1")).toBe(true);
  expect(hasSeenReveal("trip-2")).toBe(false);
  expect(window.localStorage.getItem("rt:reveal-seen:trip-1")).toBe("2026-08-20T00:00:00.000Z");
});

it("treats unavailable storage as not seen and never throws", () => {
  const storage = installMemoryStorage();
  storage.getItem = () => {
    throw new Error("blocked");
  };
  storage.setItem = () => {
    throw new Error("blocked");
  };
  expect(() => markRevealSeen("trip-1")).not.toThrow();
  expect(hasSeenReveal("trip-1")).toBe(false);
});
