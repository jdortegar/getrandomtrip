import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const { peek, session } = vi.hoisted(() => ({
  peek: vi.fn(),
  session: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/i18n/dictionaries", () => ({ getDictionary: vi.fn() }));
vi.mock("@/lib/travelers/travelerInviteTokens", () => ({ peekTravelerInvite: peek }));
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/travelers/TravelerInviteClient", () => ({ default: () => null }));

import { getDictionary } from "@/lib/i18n/dictionaries";
import TravelerInvitePage from "../page";

const okPeek = {
  ok: true,
  travelerId: "trav-1",
  tripRequestId: "trip-1",
  kind: "ADULT",
  buyerFirstName: "Ana",
  idDocumentRequired: true,
  invitedEmail: null,
  maskedEmail: "j***@gmail.com",
  viewerEmailMatches: null,
};

async function renderPage() {
  const tree = (await TravelerInvitePage({
    params: Promise.resolve({ locale: "en", token: "tok" }),
  })) as ReactElement<{ children: ReactElement[] }>;
  const client = tree.props.children.find(
    (child) => (child.props as { resolution?: unknown }).resolution,
  )!;
  return { tree, resolution: (client.props as { resolution: Record<string, unknown> }).resolution };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getDictionary).mockResolvedValue({ auth: {}, inviteTravelers: {} } as never);
  peek.mockResolvedValue(okPeek);
  session.mockResolvedValue(null);
});

describe("invite page payload (T11)", () => {
  it("sends only the masked email to a signed-out viewer", async () => {
    const { tree, resolution } = await renderPage();

    expect(peek).toHaveBeenCalledWith("tok", undefined);
    expect(resolution).toMatchObject({ ok: true, maskedEmail: "j***@gmail.com" });
    expect(resolution.invitedEmail ?? null).toBeNull();
    expect(JSON.stringify(tree)).not.toContain("jane.doe@gmail.com");
  });

  it("flags a signed-in viewer with another address without exposing the invited email", async () => {
    session.mockResolvedValue({ user: { email: "other@example.com" } });
    peek.mockResolvedValue({ ...okPeek, viewerEmailMatches: false });

    const { tree, resolution } = await renderPage();

    expect(peek).toHaveBeenCalledWith("tok", "other@example.com");
    expect(resolution).toMatchObject({ emailMismatch: true, maskedEmail: "j***@gmail.com" });
    expect(resolution.invitedEmail ?? null).toBeNull();
    expect(JSON.stringify(tree)).not.toContain("jane.doe@gmail.com");
  });

  it("passes the invited email through only when the signed-in address matches", async () => {
    session.mockResolvedValue({ user: { email: "Jane.Doe@gmail.com" } });
    peek.mockResolvedValue({ ...okPeek, invitedEmail: "jane.doe@gmail.com", viewerEmailMatches: true });

    const { resolution } = await renderPage();

    expect(resolution).toMatchObject({ invitedEmail: "jane.doe@gmail.com" });
    expect(resolution.emailMismatch).toBeFalsy();
  });

  it("still renders the error card for a dead token", async () => {
    peek.mockResolvedValue({ ok: false, reason: "expired" });

    const { resolution } = await renderPage();

    expect(resolution).toEqual({ ok: false, reason: "expired" });
  });
});
