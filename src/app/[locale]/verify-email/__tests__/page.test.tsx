import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: vi.fn() }));
vi.mock("@/components/auth/VerifyEmailClient", () => ({ default: () => null }));

import { getDictionary } from "@/lib/i18n/dictionaries";
import VerifyEmailPage from "../page";

async function nextPathFor(next: string | undefined) {
  const el = (await VerifyEmailPage({
    params: Promise.resolve({ locale: "en" }),
    searchParams: Promise.resolve({ token: "tok", next }),
  })) as ReactElement<{ nextPath?: string | null }>;
  return el.props.nextPath;
}

beforeEach(() => {
  vi.mocked(getDictionary).mockResolvedValue({ verifyEmailPage: {} } as never);
});

describe("verify-email page return path (T12)", () => {
  it("forwards a same-origin invite path", async () => {
    expect(await nextPathFor("/en/invite/abc123")).toBe("/en/invite/abc123");
  });

  it.each(["https://evil.example.com", "//evil.example.com", "/en/dashboard", undefined])(
    "drops %s (no open redirect)",
    async (next) => {
      expect(await nextPathFor(next as string | undefined)).toBeNull();
    },
  );
});
