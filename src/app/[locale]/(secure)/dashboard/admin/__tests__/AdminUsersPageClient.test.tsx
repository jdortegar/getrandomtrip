import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUsersPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminUsersPageClient";
import esCopy from "@/dictionaries/es.json";
import type { AdminUser } from "@/components/app/admin/UsersTableRow";
import type { MarketingDictionary } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "current-user" } } }),
}));

const copy = esCopy.adminUsers as unknown as MarketingDictionary["adminUsers"];

let container: HTMLDivElement;
let root: Root;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<AdminUsersPageClient copy={copy} />);
  });
  return container;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function fetchMock() {
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

function user(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    avatarUrl: null,
    commission: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    email: "ana@example.com",
    id: "u1",
    inviteStatus: null,
    name: "Ana",
    roles: ["TRAVELER"],
    tripperSlug: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total: 1, users: [user()] }),
    }),
  );
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AdminUsersPageClient — refetch error keeps chrome mounted", () => {
  it("threads error/isLoading into UsersTable without unmounting the search input", async () => {
    vi.useFakeTimers();
    render();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const searchInput = container.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Refetch boom" }),
    });

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;

    await act(async () => {
      setter?.call(searchInput, "zzz");
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(container.querySelector('input[type="text"]')).not.toBeNull();
    const banner = container.querySelector('[role="alert"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Refetch boom");
    vi.useRealTimers();
  });
});
