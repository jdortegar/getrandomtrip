import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/email-campaigns/contacts", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/email-campaigns/contacts")>();
  return {
    ...original,
    createFriendsFamilyContact: vi.fn(),
    listContacts: vi.fn(),
  };
});

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import {
  ContactError,
  createFriendsFamilyContact,
  listContacts,
} from "@/lib/email-campaigns/contacts";
import { GET, POST } from "../route";

const BASE = "http://localhost/api/admin/email-campaigns/contacts";

function asAdmin() {
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "a1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "a1",
    roles: ["ADMIN"],
  } as never);
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest(BASE, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  asAdmin();
  vi.mocked(listContacts).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
  });
});

describe("auth", () => {
  it("returns 401 without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await GET(new NextRequest(BASE));

    expect(res.status).toBe(401);
    expect(listContacts).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "a1",
      roles: ["CLIENT"],
    } as never);

    const res = await POST(postRequest({ email: "x@example.com" }));

    expect(res.status).toBe(403);
    expect(createFriendsFamilyContact).not.toHaveBeenCalled();
  });
});

describe("GET", () => {
  it("passes parsed filters and clamps the limit", async () => {
    const res = await GET(
      new NextRequest(
        `${BASE}?page=2&limit=500&source=FRIENDS_FAMILY&status=UNSUBSCRIBED&segmentId=s1&q=%20ana%20`,
      ),
    );

    expect(res.status).toBe(200);
    expect(listContacts).toHaveBeenCalledWith({
      page: 2,
      limit: 100,
      source: "FRIENDS_FAMILY",
      status: "UNSUBSCRIBED",
      segmentId: "s1",
      q: "ana",
    });
  });

  it("defaults page and limit", async () => {
    await GET(new NextRequest(`${BASE}?page=abc`));

    expect(listContacts).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it("rejects an unknown source with 400", async () => {
    const res = await GET(new NextRequest(`${BASE}?source=USERS`));

    expect(res.status).toBe(400);
  });
});

describe("POST", () => {
  it("creates a friends & family contact with 201", async () => {
    vi.mocked(createFriendsFamilyContact).mockResolvedValue({
      id: "c1",
      email: "tio@example.com",
      source: "FRIENDS_FAMILY",
      status: "SUBSCRIBED",
      locale: "en",
      tags: [],
      segments: [],
      createdAt: "2026-10-01T00:00:00.000Z",
    });

    const res = await POST(
      postRequest({
        email: "tio@example.com",
        locale: "en",
        tags: ["vip"],
        segmentIds: ["s1"],
      }),
    );

    expect(res.status).toBe(201);
    expect(createFriendsFamilyContact).toHaveBeenCalledWith({
      email: "tio@example.com",
      locale: "en",
      tags: ["vip"],
      segmentIds: ["s1"],
    });
    expect((await res.json()).contact.id).toBe("c1");
  });

  it("returns 409 on a duplicate email", async () => {
    vi.mocked(createFriendsFamilyContact).mockRejectedValue(
      new ContactError("duplicate_email"),
    );

    const res = await POST(postRequest({ email: "ana@example.com" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "duplicate_email" });
  });

  it("returns 400 for unknown segment ids", async () => {
    vi.mocked(createFriendsFamilyContact).mockRejectedValue(
      new ContactError("invalid_segment"),
    );

    const res = await POST(postRequest({ email: "tio@example.com", segmentIds: ["nope"] }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_segment" });
  });

  it.each([
    { email: "not-an-email" },
    { email: "ok@example.com", locale: "fr" },
    {},
  ])("returns 400 for invalid input %j", async (body) => {
    const res = await POST(postRequest(body));

    expect(res.status).toBe(400);
    expect(createFriendsFamilyContact).not.toHaveBeenCalled();
  });
});
