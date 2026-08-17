import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewsPageClient } from "@/components/app/dashboard/tripper/reviews/ReviewsPageClient";
import type { TripperReviewsDict } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
}));

const copy: TripperReviewsDict = {
  title: "RESEÑAS & NPS",
  eyebrow: "Lo que dicen tus viajeros",
  description: "Mira las reseñas de tus clientes y tu puntaje NPS.",
  errorLoad: "Error al cargar las reseñas",
  kpis: {
    averageRating: "Rating promedio",
    totalReviews: "Total reseñas",
    nps: "NPS",
    promoters: "Promotores",
    detractorsCaption: "{count} detractores",
  },
  list: { title: "Reseñas de clientes" },
  filters: {
    allStatuses: "Todos los estados",
    approved: "Aprobadas",
    unapproved: "Sin aprobar",
    searchPlaceholder: "Buscar por nombre del viajero...",
  },
  status: { approved: "Aprobada", pending: "Pendiente" },
  emptyState: {
    title: "Aún no tienes reseñas",
    description: "Las reseñas aparecerán aquí.",
  },
  sort: {
    groupLabel: "Ordenar reseñas",
    rating: "Calificación",
    created: "Creado",
    ariaSortBy: "Ordenar por {field}",
    ariaAscending: "ascendente",
    ariaDescending: "descendente",
  },
};

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

function lastFetchUrl(): string {
  const calls = fetchMock().mock.calls;
  return calls[calls.length - 1][0] as string;
}

/**
 * React tracks native input values to detect real changes; setting `.value`
 * directly and dispatching a plain event is a no-op from React's
 * perspective. Bypass the tracker via the native prototype setter so the
 * synthetic "input" event actually reaches the component's onChange.
 */
function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function buttonWithText(text: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  );
  if (!found) throw new Error(`Button with text "${text}" not found`);
  return found as HTMLButtonElement;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [],
        total: 0,
        averageRating: 0,
        totalReviews: 0,
        nps: 0,
        promoters: 0,
        detractors: 0,
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
  vi.useRealTimers();
});

describe("ReviewsPageClient — default sort state", () => {
  it("first fetch carries sortBy=created&sortOrder=desc with zero extra requests, and Created renders active-descending with no round trip", async () => {
    render(<ReviewsPageClient dict={copy} locale="es" />);
    await flush();

    expect(fetch).toHaveBeenCalledTimes(1);
    const url = lastFetchUrl();
    expect(url).toContain("sortBy=created");
    expect(url).toContain("sortOrder=desc");

    const createdButton = buttonWithText("Creado");
    expect(createdButton.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("ReviewsPageClient — toggling sort", () => {
  it("clicking Rating fetches sortBy=rating&sortOrder=desc&page=1 (first-click default is desc); clicking again flips to asc", async () => {
    render(<ReviewsPageClient dict={copy} locale="es" />);
    await flush();

    await act(async () => {
      buttonWithText("Calificación").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
    });
    await flush();

    let url = lastFetchUrl();
    expect(url).toContain("sortBy=rating");
    expect(url).toContain("sortOrder=desc");
    expect(url).toContain("page=1");

    // Re-query: the component swaps to <LoadingSpinner> during the fetch, so
    // the previous button reference is a detached, stale DOM node.
    await act(async () => {
      buttonWithText("Calificación").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
    });
    await flush();

    url = lastFetchUrl();
    expect(url).toContain("sortBy=rating");
    expect(url).toContain("sortOrder=asc");
  });
});

describe("ReviewsPageClient — sort composes with filter, search, and pagination", () => {
  it("with status=approved and search=Ana active on page 3, clicking a sort control resets to page=1 while status and search persist", async () => {
    vi.useFakeTimers();
    fetchMock().mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [],
        total: 100,
        averageRating: 0,
        totalReviews: 0,
        nps: 0,
        promoters: 0,
        detractors: 0,
      }),
    });

    render(<ReviewsPageClient dict={copy} locale="es" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "approved";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(0);
    });

    const searchInput = container.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    await act(async () => {
      setNativeInputValue(searchInput, "Ana");
      await vi.advanceTimersByTimeAsync(400);
    });

    await act(async () => {
      buttonWithText("Siguiente").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      buttonWithText("Siguiente").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await vi.advanceTimersByTimeAsync(0);
    });

    const preSortUrl = lastFetchUrl();
    expect(preSortUrl).toContain("page=3");
    expect(preSortUrl).toContain("status=approved");
    expect(preSortUrl).toContain("search=Ana");

    await act(async () => {
      buttonWithText("Calificación").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await vi.advanceTimersByTimeAsync(0);
    });

    const postSortUrl = lastFetchUrl();
    expect(postSortUrl).toContain("page=1");
    expect(postSortUrl).toContain("status=approved");
    expect(postSortUrl).toContain("search=Ana");
    expect(postSortUrl).toContain("sortBy=rating");
  });
});

describe("ReviewsPageClient — initial load error (never loaded)", () => {
  it("recovers into an interactive page showing the error, not a dead end", async () => {
    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<ReviewsPageClient dict={copy} locale="es" />);
    await flush();

    // The "has loaded once" flag transitions on any settle (success or
    // failure), so the steady state after a failed first load is the full
    // interactive page with the error surfaced inline — never a stuck spinner.
    expect(container.textContent).toContain(copy.errorLoad);
    expect(container.querySelector("select")).not.toBeNull();
  });
});

describe("ReviewsPageClient — refetch error keeps chrome mounted", () => {
  it("shows an inline banner inside the panel without unmounting header/filters", async () => {
    render(<ReviewsPageClient dict={copy} locale="es" />);
    await flush();

    expect(container.textContent).toContain("Reseñas de clientes");

    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "approved";
      select.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    expect(container.querySelector("select")).not.toBeNull();
    const banner = container.querySelector('[role="alert"]');
    expect(banner).not.toBeNull();
  });
});

describe("ReviewsPageClient — non-goal sort options (must NOT render)", () => {
  it("renders exactly the two allowed sort controls (rating, created) — no status, traveler, or tripper sort", async () => {
    render(<ReviewsPageClient dict={copy} locale="es" />);
    await flush();

    const group = container.querySelector('[role="group"]') as HTMLElement;
    expect(group).not.toBeNull();

    const sortButtons = Array.from(group.querySelectorAll("button"));
    expect(sortButtons).toHaveLength(2);
    expect(sortButtons.map((b) => b.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Calificación"),
        expect.stringContaining("Creado"),
      ]),
    );
  });
});
