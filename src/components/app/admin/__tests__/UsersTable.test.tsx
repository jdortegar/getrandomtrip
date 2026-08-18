import { act } from "react";
import { createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UsersTable } from "../UsersTable";
import type { AdminUser } from "../UsersTableRow";
import esCopy from "@/dictionaries/es.json";
import type { MarketingDictionary } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy = esCopy.adminUsers as unknown as MarketingDictionary["adminUsers"];

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

let container: HTMLDivElement;
let root: Root;

function render(overrides: { error?: string | null; isLoading?: boolean } = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <UsersTable
        allSelectableChecked={false}
        bulkSelectedIds={new Set()}
        copy={copy}
        currentUserId={null}
        error={overrides.error ?? null}
        invitingId={null}
        isLoading={overrides.isLoading ?? false}
        locale="es"
        onDelete={vi.fn()}
        onInvite={vi.fn()}
        onToggleBulkSelect={vi.fn()}
        onToggleSelectAll={vi.fn()}
        selectAllRef={createRef<HTMLInputElement>()}
        users={[user()]}
      />,
    );
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("UsersTable — loading overlay and inline error", () => {
  it("sets aria-busy=true and dims when isLoading", () => {
    render({ isLoading: true });
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.getAttribute("aria-busy")).toBe("true");
    expect(panel.className).toContain("pointer-events-none");
  });

  it("sets aria-busy=false when not loading", () => {
    render({ isLoading: false });
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.getAttribute("aria-busy")).toBe("false");
    expect(panel.className).not.toContain("pointer-events-none");
  });

  it("renders an inline role=alert banner when error is set, keeping the table mounted", () => {
    render({ error: "Something broke" });
    const banner = container.querySelector('[role="alert"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Something broke");
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("renders no banner when error is null", () => {
    render();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
