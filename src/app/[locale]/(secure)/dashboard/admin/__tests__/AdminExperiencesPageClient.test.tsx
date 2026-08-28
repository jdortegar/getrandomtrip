import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminExperiencesPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminExperiencesPageClient";
import type { AdminExperience } from "@/lib/admin/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

let container: HTMLDivElement;
let root: Root;

function render(element: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(element);
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

function experience(overrides: Partial<AdminExperience> = {}): AdminExperience {
  return {
    createdAt: "2026-01-01T00:00:00.000Z",
    description: "",
    destinationCity: "Mendoza",
    destinationCountry: "Argentina",
    heroImage: "",
    id: "e1",
    isActive: true,
    isFeatured: false,
    level: "essenza",
    maxNights: 4,
    maxPax: 2,
    minNights: 2,
    minPax: 1,
    owner: { email: "a@b.com", id: "u1", name: "Ana" },
    pricingByType: null,
    reviewNote: null,
    source: "RANDOMTRIP",
    status: "PENDING_REVIEW",
    teaser: "",
    title: "A trip",
    type: ["ESSENZA"],
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as AdminExperience;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        experiences: [experience()],
        pendingCount: 1,
        total: 25,
      }),
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

describe("AdminExperiencesPageClient — refetch keeps chrome mounted and dims the panel", () => {
  it("keeps filters mounted and sets aria-busy during a status-filter refetch", async () => {
    render(<AdminExperiencesPageClient />);
    await flush();

    const panel = container.querySelector(".overflow-hidden.rounded-xl") as HTMLElement;
    expect(panel.getAttribute("aria-busy")).toBe("false");

    let resolveFetch: (value: unknown) => void = () => {};
    fetchMock().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    act(() => {
      select.value = "ALL";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.querySelector("select")).not.toBeNull();
    expect(panel.getAttribute("aria-busy")).toBe("true");

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({
          experiences: [experience()],
          pendingCount: 1,
          total: 25,
        }),
      });
      await Promise.resolve();
    });
    await flush();

    const settledPanel = container.querySelector(".overflow-hidden.rounded-xl") as HTMLElement;
    expect(settledPanel.getAttribute("aria-busy")).toBe("false");
  });
});

describe("AdminExperiencesPageClient — refetch error keeps chrome mounted", () => {
  it("shows an inline banner without unmounting the filter row", async () => {
    render(<AdminExperiencesPageClient />);
    await flush();

    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Refetch boom" }),
    });

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "ALL";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    expect(container.querySelector("select")).not.toBeNull();
    const banner = container.querySelector('[role="alert"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Refetch boom");
  });
});
