import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/email", () => ({
  sendDestinationRevealed: vi.fn(),
  sendTripCancelled: vi.fn(),
  sendTripCompleted: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    tripRequest: { findUnique: vi.fn(), update: vi.fn() },
    tripTraveler: { findMany: vi.fn(), createMany: vi.fn(), update: vi.fn() },
    payment: { findUnique: vi.fn() },
    tripDocument: { findMany: vi.fn() },
  },
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET, dynamic } from "../route";

const buyer = {
  id: "buyer",
  name: " Test Buyer ",
  email: " buyer@example.test ",
  locale: "en",
  phone: " +1 555 0100 ",
  address: { idDocument: " CHECKOUT-ID ", street: "PRIVATE-STREET" },
  idNumber: "PROFILE-ID",
  passportNumber: "PROFILE-PASSPORT",
};
const request = () =>
  GET(new NextRequest("http://local/api/admin/trip-requests/trip"), {
    params: Promise.resolve({ id: "trip" }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: "admin", roles: ["ADMIN"] },
  } as never);
  vi.mocked(prisma.user.findUnique)
    .mockResolvedValueOnce({ id: "admin", roles: ["ADMIN"] } as never)
    .mockResolvedValue(buyer as never);
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    id: "trip",
    userId: "buyer",
    experienceId: null,
    status: "CONFIRMED",
    pax: 4,
  } as never);
  vi.mocked(prisma.tripTraveler.findMany).mockResolvedValue([]);
  vi.mocked(prisma.tripDocument.findMany).mockResolvedValue([]);
  vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);
});

it.each(["anonymous", "revoked-admin", "missing-account"])(
  "blocks sensitive reads for %s",
  async (caller) => {
    if (caller === "anonymous")
      vi.mocked(getServerSession).mockResolvedValue(null);
    else
      vi.mocked(prisma.user.findUnique)
        .mockReset()
        .mockResolvedValue(
          caller === "missing-account"
            ? null
            : ({ id: "admin", roles: ["CLIENT"] } as never),
        );
    const response = await request();
    expect(response.status).toBe(caller === "anonymous" ? 401 : 403);
    expect(prisma.tripRequest.findUnique).not.toHaveBeenCalled();
    expect(prisma.tripTraveler.findMany).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(
      caller === "anonymous" ? 0 : 1,
    );
  },
);

it("returns allowlisted booking identity for every status without writes or linked-account fallback", async () => {
  const companions = ["PENDING", "INVITED", "COMPLETE"].map(
    (status, index) => ({
      id: `companion-${index}`,
      kind: index === 2 ? "MINOR" : "ADULT",
      status,
      fullName: index === 2 ? "  " : ` Companion ${index} `,
      email: index === 2 ? null : ` companion${index}@example.test `,
      idDocument: index === 2 ? "" : ` DOC-${index} `,
      user: { phone: "LINKED-PHONE" },
      userId: "LINKED-ID",
      inviteTokenHash: "PRIVATE-TOKEN",
    }),
  );
  vi.mocked(prisma.tripTraveler.findMany).mockResolvedValue(
    companions as never,
  );
  const response = await request();
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(dynamic).toBe("force-dynamic");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(body.bookingTravelers).toEqual([
    {
      id: "buyer",
      kind: "BOOKING_HOLDER",
      name: "Test Buyer",
      email: "buyer@example.test",
      phone: "+1 555 0100",
      dateOfBirth: null,
      idDocument: "CHECKOUT-ID",
    },
    {
      id: "companion-0",
      kind: "ADULT",
      name: "Companion 0",
      email: "companion0@example.test",
      phone: null,
      dateOfBirth: null,
      idDocument: "DOC-0",
    },
    {
      id: "companion-1",
      kind: "ADULT",
      name: "Companion 1",
      email: "companion1@example.test",
      phone: null,
      dateOfBirth: null,
      idDocument: "DOC-1",
    },
    {
      id: "companion-2",
      kind: "MINOR",
      name: null,
      email: null,
      phone: null,
      dateOfBirth: null,
      idDocument: null,
    },
  ]);
  expect(body.tripRequest.user).toEqual({
    id: buyer.id,
    name: buyer.name,
    email: buyer.email,
    locale: buyer.locale,
  });
  expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
    where: { id: "buyer" },
    select: {
      id: true,
      name: true,
      email: true,
      locale: true,
      phone: true,
      address: true,
    },
  });
  expect(prisma.tripTraveler.findMany).toHaveBeenCalledWith({
    where: { tripRequestId: "trip" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      kind: true,
      fullName: true,
      email: true,
      idDocument: true,
      dateOfBirth: true,
    },
  });
  for (const secret of [
    "PRIVATE-STREET",
    "PROFILE-ID",
    "PROFILE-PASSPORT",
    "PRIVATE-TOKEN",
    "LINKED-PHONE",
    "LINKED-ID",
  ])
    expect(JSON.stringify(body)).not.toContain(secret);
  expect(prisma.user.update).not.toHaveBeenCalled();
  expect(prisma.tripRequest.update).not.toHaveBeenCalled();
  expect(prisma.tripTraveler.createMany).not.toHaveBeenCalled();
  expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
});

it.each([null, [], "legacy", { idDocument: " \n " }, { idDocument: 123 }])(
  "keeps missing or malformed checkout document unavailable for address %j",
  async (address) => {
    vi.mocked(prisma.user.findUnique)
      .mockReset()
      .mockResolvedValueOnce({ id: "admin", roles: ["ADMIN"] } as never)
      .mockResolvedValue({
        ...buyer,
        address,
        name: " ",
        phone: "\n",
        email: " ",
      } as never);
    const body = await (await request()).json();
    expect(body.bookingTravelers).toEqual([
      {
        id: "buyer",
        kind: "BOOKING_HOLDER",
        name: null,
        email: null,
        phone: null,
        dateOfBirth: null,
        idDocument: null,
      },
    ]);
  },
);

it("exposes only a minor date of birth as an ISO date without a local timezone shift", async () => {
  vi.mocked(prisma.tripTraveler.findMany).mockResolvedValue([
    {
      id: "minor",
      kind: "MINOR",
      fullName: "Test Minor",
      email: null,
      idDocument: "ID",
      dateOfBirth: new Date("2015-01-02T00:00:00Z"),
    },
    {
      id: "adult",
      kind: "ADULT",
      fullName: "Test Adult",
      email: "test@example.test",
      idDocument: "ID",
      dateOfBirth: new Date("1980-02-03T00:00:00Z"),
    },
  ] as never);
  const body = await (await request()).json();
  expect(body.bookingTravelers[1].dateOfBirth).toBe("2015-01-02");
  expect(body.bookingTravelers[2].dateOfBirth).toBeNull();
});
