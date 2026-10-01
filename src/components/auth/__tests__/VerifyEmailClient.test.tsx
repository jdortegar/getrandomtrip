import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import VerifyEmailClient from "../VerifyEmailClient";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

let container: HTMLDivElement;
let root: Root;

async function mount(nextPath?: string | null) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: true, email: "jane@example.com" })));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<VerifyEmailClient copy={en.verifyEmailPage} locale="en" nextPath={nextPath} token="tok" />);
  });
}

beforeEach(() => replace.mockReset());
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("VerifyEmailClient return path (T12)", () => {
  it("goes back to the invite after a successful verification", async () => {
    await mount("/en/invite/abc123");
    expect(replace).toHaveBeenCalledWith("/en/invite/abc123");
  });

  it("keeps the login redirect when there is no return path", async () => {
    await mount(null);
    expect(replace).toHaveBeenCalledWith("/en/login?email=jane%40example.com");
  });
});
