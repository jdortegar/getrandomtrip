import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPaymentsPageClient } from "@/app/[locale]/(secure)/dashboard/admin/AdminPaymentsPageClient";
import type { AdminPayment } from "@/lib/admin/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
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

function payment(overrides: Partial<AdminPayment> = {}): AdminPayment {
  return {
    amount: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    currency: "USD",
    id: "p1",
    provider: "mercadopago",
    status: "APPROVED",
    user: { email: "a@b.com", name: "Ana" },
    ...overrides,
  } as AdminPayment;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ payments: [payment()], total: 25 }),
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

describe("AdminPaymentsPageClient — initial load", () => {
  it("shows the full-page spinner before first load, then the panel", async () => {
    render(<AdminPaymentsPageClient />);
    expect(container.querySelector('[role="status"], .animate-spin')).toBeTruthy();

    await flush();
    expect(container.querySelector("table")).not.toBeNull();
  });
});

describe("AdminPaymentsPageClient — refetch keeps chrome mounted and dims the panel", () => {
  it("sets aria-busy on the panel during a page-change refetch without unmounting the header", async () => {
    render(<AdminPaymentsPageClient />);
    await flush();

    const panel = container.querySelector(
      ".overflow-hidden.rounded-xl",
    ) as HTMLElement;
    expect(panel.getAttribute("aria-busy")).toBe("false");

    const nextButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Siguiente"),
    ) as HTMLButtonElement;

    let resolveFetch: (value: unknown) => void = () => {};
    fetchMock().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    act(() => {
      nextButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Mid-refetch: chrome (count label) still mounted, panel dimmed.
    expect(container.textContent).toContain("pago");
    expect(panel.getAttribute("aria-busy")).toBe("true");

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ payments: [payment()], total: 1 }),
      });
      await Promise.resolve();
    });
    await flush();

    const settledPanel = container.querySelector(
      ".overflow-hidden.rounded-xl",
    ) as HTMLElement;
    expect(settledPanel.getAttribute("aria-busy")).toBe("false");
  });
});

describe("AdminPaymentsPageClient — refetch error keeps chrome mounted", () => {
  it("shows an inline banner without unmounting the page shell", async () => {
    render(<AdminPaymentsPageClient />);
    await flush();

    fetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Refetch boom" }),
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Siguiente"),
    ) as HTMLButtonElement;
    await act(async () => {
      nextButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await flush();

    const banner = container.querySelector('[role="alert"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Refetch boom");
    // Pagination controls remain mounted.
    expect(
      Array.from(container.querySelectorAll("button")).some((b) =>
        b.textContent?.includes("Siguiente"),
      ),
    ).toBe(true);
  });
});
