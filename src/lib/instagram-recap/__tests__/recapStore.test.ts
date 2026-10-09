// @vitest-environment node
import { expect, it, vi } from "vitest";

vi.mock("@netlify/blobs", () => ({ getStore: vi.fn() }));
import { recordFollowers, type RecapBlobStore } from "../recapStore";

function memoryStore(initial: Record<string, unknown> = {}) {
  const data = new Map(Object.entries(initial));
  const store: RecapBlobStore = {
    get: async (key) => data.get(key) ?? null,
    setJSON: async (key, value) => void data.set(key, value),
  };
  return { store, data };
}

it("returns the latest earlier follower snapshot and stores today", async () => {
  const { store, data } = memoryStore({
    followers: { "2026-10-06": 150, "2026-10-07": 154 },
  });
  expect(await recordFollowers(store, "2026-10-08", 156)).toEqual({
    date: "2026-10-07",
    followers: 154,
  });
  expect(data.get("followers")).toEqual({
    "2026-10-06": 150,
    "2026-10-07": 154,
    "2026-10-08": 156,
  });
});

it("ignores a same-day snapshot from an earlier run", async () => {
  const { store } = memoryStore({
    followers: { "2026-10-07": 154, "2026-10-08": 155 },
  });
  expect(await recordFollowers(store, "2026-10-08", 156)).toEqual({
    date: "2026-10-07",
    followers: 154,
  });
});

it("returns null on the first snapshot", async () => {
  const { store } = memoryStore();
  expect(await recordFollowers(store, "2026-10-08", 154)).toBeNull();
});

it("keeps the last 30 snapshots", async () => {
  const initial: Record<string, number> = {};
  for (let d = 1; d <= 31; d++)
    initial[`2026-08-${String(d).padStart(2, "0")}`] = d;
  const { store, data } = memoryStore({ followers: initial });
  await recordFollowers(store, "2026-09-01", 100);
  const kept = data.get("followers") as Record<string, number>;
  expect(Object.keys(kept)).toHaveLength(30);
  expect(kept["2026-09-01"]).toBe(100);
  expect(kept["2026-08-01"]).toBeUndefined();
});
