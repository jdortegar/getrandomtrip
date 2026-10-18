import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/email-campaigns/contacts", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/email-campaigns/contacts")>();
  return { ...original, updateContact: vi.fn() };
});

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ContactError, updateContact } from "@/lib/email-campaigns/contacts";
import { PATCH } from "../route";

function patch(body: unknown, id = "c1") {
  return PATCH(
    new Request(`http://localhost/api/admin/email-campaigns/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ id }) },
  );
}

const CONTACT = {
  id: "c1",
  email: "ana@example.com",
  source: "WAITLIST" as const,
  status: "SUBSCRIBED" as const,
  locale: "es" as const,
  tags: [],
  createdAt: "2026-10-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "a1",
    roles: ["ADMIN"],
  } as never);
});

describe("PATCH /api/admin/email-campaigns/contacts/[id]", () => {
  it("returns 401 without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await patch({ status: "SUBSCRIBED" });

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "a1",
      roles: ["TRIPPER"],
    } as never);

    const res = await patch({ status: "SUBSCRIBED" });

    expect(res.status).toBe(403);
    expect(updateContact).not.toHaveBeenCalled();
  });

  it("resubscribes a contact", async () => {
    vi.mocked(updateContact).mockResolvedValue(CONTACT);

    const res = await patch({ status: "SUBSCRIBED" });

    expect(res.status).toBe(200);
    expect(updateContact).toHaveBeenCalledWith("c1", { status: "SUBSCRIBED" });
    expect((await res.json()).contact.status).toBe("SUBSCRIBED");
  });

  it("returns 400 for a rejected status change", async () => {
    vi.mocked(updateContact).mockRejectedValue(
      new ContactError("invalid_status_change"),
    );

    const res = await patch({ status: "UNSUBSCRIBED" });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_status_change" });
  });

  it("returns 400 for an unknown status value", async () => {
    const res = await patch({ status: "DELETED" });

    expect(res.status).toBe(400);
    expect(updateContact).not.toHaveBeenCalled();
  });

  it("returns 400 for an empty body", async () => {
    const res = await patch({});

    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    vi.mocked(updateContact).mockRejectedValue(new ContactError("not_found"));

    const res = await patch({ name: "Ana" }, "missing");

    expect(res.status).toBe(404);
  });
});
