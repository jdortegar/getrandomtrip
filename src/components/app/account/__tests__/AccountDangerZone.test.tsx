import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { signOut } from "next-auth/react";
import { AccountDangerZone } from "../AccountDangerZone";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import { createDomHarness, type DomHarness } from "@/components/ui/__tests__/test-dom-utils";

const navigation = vi.hoisted(() => ({ locale: "es" }));
vi.mock("next/navigation", () => ({ useParams: () => navigation }));
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
let harness: DomHarness;

beforeEach(() => {
  vi.clearAllMocks();
  harness = createDomHarness();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
});
afterEach(() => {
  harness.unmount();
  vi.unstubAllGlobals();
});

it.each(["en", "es"])("returns to the %s home page after confirmed deactivation", async (locale) => {
  navigation.locale = locale;
  const copy = (locale === "en" ? enCopy : esCopy).profile.dangerZone;
  harness.render(<AccountDangerZone copy={copy} />);
  harness.click(harness.container.querySelector("button")!);
  expect(fetch).not.toHaveBeenCalled();
  expect(signOut).not.toHaveBeenCalled();

  const confirm = Array.from(harness.container.querySelectorAll("button"))
    .find((button) => button.textContent === copy.deleteButton)!;
  await act(async () => confirm.click());

  expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/user/deactivate", { method: "POST" });
  expect(signOut).toHaveBeenCalledExactlyOnceWith({ callbackUrl: locale === "en" ? "/en" : "/" });
});
