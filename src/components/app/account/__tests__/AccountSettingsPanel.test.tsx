import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AccountSettingsPanel } from "../AccountSettingsPanel";
import en from "@/dictionaries/en.json";
import type { UserProfileMe } from "@/lib/types/UserProfileMe";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "en" }) }));
vi.mock("next-auth/react", () => {
  const session = {
    data: { user: { id: "user", email: "user@example.test" } },
    update: vi.fn(),
  };
  return { useSession: () => session };
});
vi.mock("@/store/slices/userStore", () => ({
  useUserStore: () => ({ user: null }),
}));
vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: async () => en }));
vi.mock("@/components/ui/AvatarEditor", () => ({ AvatarEditor: () => null }));
vi.mock("@/components/ui/TabSelector", () => ({
  TabSelector: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
    <button onClick={() => onTabChange("personal")}>Personal</button>
  ),
}));
const profile: UserProfileMe = {
  id: "user",
  name: "Initial name",
  email: "user@example.test",
  phone: null,
  address: null,
  createdAt: "2026-01-01",
  tripperSince: null,
  travelerType: null,
  interests: [],
  dislikes: [],
  roles: ["traveler"],
  role: "traveler",
};
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      Response.json(url === "/api/user/me" ? { user: profile } : { trips: [] }),
    ),
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("derives read-only fields from the profile while preserving an editable draft", async () => {
  await act(async () =>
    root.render(
      <AccountSettingsPanel initialProfile={profile} role="traveler" />,
    ),
  );
  act(() => container.querySelector<HTMLButtonElement>("button")!.click());
  expect(container.querySelector<HTMLInputElement>("#acc-name")?.value).toBe(
    "Initial name",
  );
  const edit = [...container.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === en.profile.buttons.editDetails,
  )!;
  act(() => edit.click());
  const input = container.querySelector<HTMLInputElement>("#acc-name")!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, "Unsaved draft");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () =>
    root.render(
      <AccountSettingsPanel initialProfile={{ ...profile }} role="traveler" />,
    ),
  );
  expect(input.value).toBe("Unsaved draft");
  const cancel = [...container.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === en.profile.buttons.cancel,
  )!;
  act(() => cancel.click());
  expect(input.value).toBe("Initial name");
});
