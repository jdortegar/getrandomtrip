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
  "shares upload stores across environments with a legacy fallback for %s",
  async (mode) => {
    vi.stubEnv("RT_DEPLOY_ENV", mode);
    const prefix = mode === "production" ? "" : "nonproduction-";
    // User media is shared; non-production also reads/deletes its legacy
    // `nonproduction-` store. Trip documents stay environment-scoped.
    const withLegacy = (name: string) =>
      mode === "production" ? [name] : [name, `nonproduction-${name}`];
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
        ...withLegacy("user-avatars"),
        ...withLegacy("user-media"),
      ]);
    }
    getStore.mockClear();
    await queryDelete(query);
    await pathDelete(query, params);
    // Outside production, a non-dev- key is never deleted from the shared
    // (production) store — only from the legacy one.
    const deleteStores =
      mode === "production" ? ["user-avatars"] : ["nonproduction-user-avatars"];
    expect(getStore.mock.calls.map(([name]) => name)).toEqual([
      ...deleteStores,
      ...deleteStores,
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
