import { afterEach, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
const { getStore, store } = vi.hoisted(() => {
  const store = {
    getWithMetadata: vi.fn().mockResolvedValue(null),
    delete: vi.fn(),
  };
  return {
    getStore: vi.fn<(name: string, options: unknown) => typeof store>(
      () => store,
    ),
    store,
  };
});
vi.mock("@netlify/blobs", () => ({ getStore }));
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user123" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
import { getTripDocumentStore } from "../storage/tripDocumentStore";
import { GET as queryGet, DELETE as queryDelete } from "@/app/api/upload/route";
import {
  GET as pathGet,
  DELETE as pathDelete,
} from "@/app/api/upload/[...path]/route";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it.each(["production", "nonproduction", undefined])(
  "scopes both upload entry points and their legacy fallback for %s",
  async (mode) => {
    vi.stubEnv("RT_DEPLOY_ENV", mode);
    const prefix = mode === "production" ? "" : "nonproduction-";
    const query = {
      nextUrl: new URL(
        "https://preview.test/api/upload?key=user123/avatar/picture.webp",
      ),
    } as unknown as NextRequest;
    const params = {
      params: Promise.resolve({ path: ["user123", "avatar", "picture.webp"] }),
    };
    for (const read of [() => queryGet(query), () => pathGet(query, params)]) {
      getStore.mockClear();
      expect((await read()).status).toBe(404);
      expect(getStore.mock.calls.map(([name]) => name)).toEqual([
        `${prefix}user-avatars`,
        `${prefix}user-media`,
      ]);
    }
    getStore.mockClear();
    await queryDelete(query);
    await pathDelete(query, params);
    expect(getStore.mock.calls.map(([name]) => name)).toEqual([
      `${prefix}user-avatars`,
      `${prefix}user-avatars`,
    ]);
    expect(store.delete).toHaveBeenCalledWith("user123/avatar/picture.webp");
    getStore.mockClear();
    expect(getTripDocumentStore()).toBe(store);
    expect(getStore).toHaveBeenCalledWith(
      `${prefix}trip-documents`,
      expect.objectContaining({ consistency: "strong" }),
    );
  },
);
