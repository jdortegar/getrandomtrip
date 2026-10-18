import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contact: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    user: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  ContactError,
  createFriendsFamilyContact,
  listContacts,
  unsubscribeContact,
  updateContact,
  upsertWaitlistContact,
} from "../contacts";

const mocked = prisma as unknown as {
  contact: Record<
    "count" | "create" | "findMany" | "findUnique" | "update" | "updateMany",
    ReturnType<typeof vi.fn>
  >;
  user: { findFirst: ReturnType<typeof vi.fn> };
};

function contactRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    email: "ana@example.com",
    name: null,
    source: "WAITLIST",
    status: "SUBSCRIBED",
    locale: "es",
    tags: [],
    userId: null,
    unsubscribedAt: null,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    updatedAt: new Date("2026-10-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocked.user.findFirst.mockResolvedValue(null);
  mocked.contact.create.mockImplementation(async ({ data }) =>
    contactRow({ ...data }),
  );
  mocked.contact.update.mockImplementation(async ({ data }) =>
    contactRow({ ...data }),
  );
});

describe("upsertWaitlistContact", () => {
  it("creates a WAITLIST contact with a normalized email and es locale", async () => {
    mocked.contact.findUnique.mockResolvedValue(null);

    const contact = await upsertWaitlistContact({
      email: "  Ana@Example.COM ",
      name: "Ana",
    });

    expect(mocked.contact.findUnique).toHaveBeenCalledWith({
      where: { email: "ana@example.com" },
    });
    expect(mocked.contact.create).toHaveBeenCalledWith({
      data: {
        email: "ana@example.com",
        locale: "es",
        name: "Ana",
        source: "WAITLIST",
        userId: null,
      },
    });
    expect(contact.email).toBe("ana@example.com");
    expect(contact.createdAt).toBe("2026-10-01T00:00:00.000Z");
  });

  it("links the user whose email matches case-insensitively", async () => {
    mocked.contact.findUnique.mockResolvedValue(null);
    mocked.user.findFirst.mockResolvedValue({ id: "u1" });

    await upsertWaitlistContact({ email: "ana@example.com" });

    expect(mocked.user.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { email: { equals: "ana@example.com", mode: "insensitive" } },
    });
    expect(mocked.contact.create.mock.calls[0][0].data.userId).toBe("u1");
  });

  it("never resubscribes or changes the source/locale of an existing contact", async () => {
    mocked.contact.findUnique.mockResolvedValue(
      contactRow({
        source: "FRIENDS_FAMILY",
        status: "UNSUBSCRIBED",
        locale: "en",
        name: "Existing",
        userId: "u9",
      }),
    );

    const contact = await upsertWaitlistContact({
      email: "ana@example.com",
      name: "Other",
    });

    expect(mocked.contact.create).not.toHaveBeenCalled();
    expect(mocked.contact.update).not.toHaveBeenCalled();
    expect(contact.status).toBe("UNSUBSCRIBED");
    expect(contact.source).toBe("FRIENDS_FAMILY");
    expect(contact.locale).toBe("en");
  });

  it("only fills a missing name and userId on an existing contact", async () => {
    mocked.contact.findUnique.mockResolvedValue(
      contactRow({ status: "BOUNCED", name: null, userId: null }),
    );
    mocked.user.findFirst.mockResolvedValue({ id: "u1" });

    await upsertWaitlistContact({ email: "ana@example.com", name: "Ana" });

    expect(mocked.contact.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { name: "Ana", userId: "u1" },
    });
  });
});

describe("listContacts", () => {
  it("filters, searches and paginates newest first", async () => {
    mocked.contact.findMany.mockResolvedValue([contactRow()]);
    mocked.contact.count.mockResolvedValue(41);

    const result = await listContacts({
      page: 3,
      limit: 20,
      source: "WAITLIST",
      status: "SUBSCRIBED",
      q: "ana",
    });

    const where = {
      source: "WAITLIST",
      status: "SUBSCRIBED",
      OR: [
        { email: { contains: "ana", mode: "insensitive" } },
        { name: { contains: "ana", mode: "insensitive" } },
      ],
    };
    expect(mocked.contact.findMany).toHaveBeenCalledWith({
      where,
      orderBy: { createdAt: "desc" },
      skip: 40,
      take: 20,
    });
    expect(mocked.contact.count).toHaveBeenCalledWith({ where });
    expect(result).toMatchObject({ total: 41, page: 3, limit: 20 });
    expect(result.items).toHaveLength(1);
  });
});

describe("createFriendsFamilyContact", () => {
  it("creates a FRIENDS_FAMILY contact with locale and clean tags", async () => {
    mocked.contact.findUnique.mockResolvedValue(null);

    await createFriendsFamilyContact({
      email: "Tio@Example.com",
      name: "Tío",
      locale: "en",
      tags: [" family ", "family", ""],
    });

    expect(mocked.contact.create).toHaveBeenCalledWith({
      data: {
        email: "tio@example.com",
        locale: "en",
        name: "Tío",
        source: "FRIENDS_FAMILY",
        tags: ["family"],
        userId: null,
      },
    });
  });

  it("throws a duplicate_email ContactError when the email exists", async () => {
    mocked.contact.findUnique.mockResolvedValue(contactRow());

    await expect(
      createFriendsFamilyContact({ email: "ana@example.com" }),
    ).rejects.toMatchObject({ code: "duplicate_email" });
    expect(mocked.contact.create).not.toHaveBeenCalled();
  });

  it("maps a unique-constraint race to duplicate_email", async () => {
    mocked.contact.findUnique.mockResolvedValue(null);
    mocked.contact.create.mockRejectedValue(
      Object.assign(new Error("unique"), { code: "P2002" }),
    );

    await expect(
      createFriendsFamilyContact({ email: "ana@example.com" }),
    ).rejects.toBeInstanceOf(ContactError);
  });
});

describe("updateContact", () => {
  it("resubscribes manually and clears unsubscribedAt", async () => {
    mocked.contact.findUnique.mockResolvedValue(
      contactRow({ status: "UNSUBSCRIBED", unsubscribedAt: new Date() }),
    );

    const contact = await updateContact("c1", { status: "SUBSCRIBED" });

    expect(mocked.contact.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { status: "SUBSCRIBED", unsubscribedAt: null },
    });
    expect(contact.status).toBe("SUBSCRIBED");
  });

  it.each(["UNSUBSCRIBED", "BOUNCED"] as const)(
    "rejects a manual change to %s",
    async (status) => {
      mocked.contact.findUnique.mockResolvedValue(contactRow());

      await expect(updateContact("c1", { status })).rejects.toMatchObject({
        code: "invalid_status_change",
      });
      expect(mocked.contact.update).not.toHaveBeenCalled();
    },
  );

  it("throws not_found for an unknown id", async () => {
    mocked.contact.findUnique.mockResolvedValue(null);

    await expect(updateContact("nope", { name: "X" })).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("updates name, locale and tags", async () => {
    mocked.contact.findUnique.mockResolvedValue(contactRow());

    await updateContact("c1", { name: "Ana", locale: "en", tags: ["vip"] });

    expect(mocked.contact.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { name: "Ana", locale: "en", tags: ["vip"] },
    });
  });
});

describe("unsubscribeContact", () => {
  it("moves a SUBSCRIBED contact to UNSUBSCRIBED with a timestamp", async () => {
    mocked.contact.updateMany.mockResolvedValue({ count: 1 });

    await expect(unsubscribeContact("c1")).resolves.toBe("unsubscribed");

    expect(mocked.contact.updateMany).toHaveBeenCalledWith({
      where: { id: "c1", status: "SUBSCRIBED" },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: expect.any(Date) },
    });
    expect(mocked.contact.findUnique).not.toHaveBeenCalled();
  });

  it("leaves a BOUNCED contact unchanged", async () => {
    mocked.contact.updateMany.mockResolvedValue({ count: 0 });
    mocked.contact.findUnique.mockResolvedValue(
      contactRow({ status: "BOUNCED" }),
    );

    await expect(unsubscribeContact("c1")).resolves.toBe("unchanged");
    expect(mocked.contact.update).not.toHaveBeenCalled();
  });

  it("is idempotent for an already UNSUBSCRIBED contact", async () => {
    mocked.contact.updateMany.mockResolvedValue({ count: 0 });
    mocked.contact.findUnique.mockResolvedValue(
      contactRow({ status: "UNSUBSCRIBED", unsubscribedAt: new Date() }),
    );

    await expect(unsubscribeContact("c1")).resolves.toBe("unchanged");
    expect(mocked.contact.update).not.toHaveBeenCalled();
  });

  it("reports an unknown id as not_found without throwing", async () => {
    mocked.contact.updateMany.mockResolvedValue({ count: 0 });
    mocked.contact.findUnique.mockResolvedValue(null);

    await expect(unsubscribeContact("missing")).resolves.toBe("not_found");
  });
});
