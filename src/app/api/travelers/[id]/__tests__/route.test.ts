import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripTraveler: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tripRequest: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/travelers/travelerInviteTokens", () => ({
  issueTravelerInvite: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendTravelerInviteEmail: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { issueTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import { sendTravelerInviteEmail } from "@/lib/email";

type RouteModule = typeof import("../route");

// ── Helpers ────────────────────────────────────────────────────────────────
function makeProps(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/travelers/trav-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const futureTrip = {
  id: "trip-1",
  userId: "buyer-1",
  startDate: new Date(Date.now() + 30 * DAY_MS),
  travelersLockedAt: null,
};

const lockedTrip = {
  id: "trip-1",
  userId: "buyer-1",
  startDate: new Date(Date.now() + 2 * DAY_MS),
  endDate: new Date(Date.now() + 4 * DAY_MS),
  travelersLockedAt: null,
};

const endedTrip = {
  id: "trip-1",
  userId: "buyer-1",
  startDate: new Date(Date.now() - 5 * DAY_MS),
  endDate: new Date(Date.now() - 2 * DAY_MS),
  travelersLockedAt: null,
};

function makeAdultRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "trav-1",
    kind: "ADULT" as const,
    status: "PENDING" as const,
    fullName: null,
    email: null,
    idDocument: null,
    dateOfBirth: null,
    invitedAt: null,
    submittedAt: null,
    userId: null,
    tripRequest: futureTrip,
    ...overrides,
  };
}

function makeMinorRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "trav-2",
    kind: "MINOR" as const,
    status: "PENDING" as const,
    fullName: null,
    email: null,
    idDocument: null,
    dateOfBirth: null,
    invitedAt: null,
    submittedAt: null,
    tripRequest: futureTrip,
    ...overrides,
  };
}

describe("PATCH /api/travelers/[id]", () => {
  let PATCH: RouteModule["PATCH"];

  beforeEach(async () => {
    vi.resetAllMocks();
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const mod = await import("../route");
    PATCH = mod.PATCH;
  });

  it("returns 401 when session is missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await PATCH(makeRequest({}), makeProps("trav-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when the traveler row does not exist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const res = await PATCH(makeRequest({}), makeProps("trav-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when the session user has no access to the trip (not buyer or companion)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "someone-else" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow());
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const res = await PATCH(makeRequest({}), makeProps("trav-1"));
    expect(res.status).toBe(403);
  });

  it("allows a companion (non-buyer with trip access) to save a row", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "companion-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow({ userId: "companion-1", email: "companion@example.com" }));
    (prisma.tripRequest.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeAdultRow(),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({
        fullName: "Companion Traveler",
        idDocument: "ID789",
      }),
      makeProps("trav-1"),
    );

    expect(res.status).toBe(200);
  });

  describe("companion edits (T6)", () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: "companion-1" },
      });
      (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({ ...makeAdultRow(), ...data }),
      );
    });

    it("rejects a companion editing another traveler's row", async () => {
      (prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeAdultRow({ userId: "someone-else", email: "x@example.com" }),
      );

      const res = await PATCH(makeRequest({ fullName: "Hacked" }), makeProps("trav-1"));

      expect(res.status).toBe(403);
      expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
    });

    it("rejects a companion editing an unlinked row", async () => {
      (prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeAdultRow());

      const res = await PATCH(makeRequest({ fullName: "Hacked" }), makeProps("trav-1"));

      expect(res.status).toBe(403);
      expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
    });

    it("rejects a companion changing their own row's email (the invite identity)", async () => {
      (prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeAdultRow({ userId: "companion-1", email: "me@example.com" }),
      );

      const res = await PATCH(makeRequest({ email: "other@example.com" }), makeProps("trav-1"));

      expect(res.status).toBe(403);
      expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
    });

    it("lets a companion re-send their unchanged email and fill their own missing ID", async () => {
      (prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeAdultRow({ userId: "companion-1", email: "me@example.com", fullName: "Me" }),
      );

      const res = await PATCH(
        makeRequest({ email: " Me@Example.com ", idDocument: "ID1" }),
        makeProps("trav-1"),
      );

      expect(res.status).toBe(200);
      expect(issueTravelerInvite).not.toHaveBeenCalled();
    });

    it("keeps the cutoff rules for the companion's own row", async () => {
      (prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeAdultRow({ userId: "companion-1", email: "me@example.com", fullName: "Me", tripRequest: lockedTrip }),
      );

      const res = await PATCH(makeRequest({ fullName: "Renamed" }), makeProps("trav-1"));

      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe("locked");
    });

    it("never lets the buyer's behavior change: the buyer can edit any row", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "buyer-1" } });
      (prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeAdultRow({ userId: "someone-else", email: "x@example.com" }),
      );

      const res = await PATCH(makeRequest({ fullName: "Fixed by buyer" }), makeProps("trav-1"));

      expect(res.status).toBe(200);
    });
  });

  it("returns 403 when the roster is locked (past cutoff)", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow({ tripRequest: lockedTrip, fullName: "Saved Name" }));

    const res = await PATCH(
      makeRequest({ fullName: "Bob" }),
      makeProps("trav-1"),
    );
    expect(res.status).toBe(403);
  });

  it("flips an adult row to COMPLETE when name+email+idDocument are all present", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow({ email: "bob@example.com" }));
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeAdultRow({ email: "bob@example.com" }),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({
        fullName: "Bob Companion",
        email: "bob@example.com",
        idDocument: "ID123",
      }),
      makeProps("trav-1"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.traveler.status).toBe("COMPLETE");
    expect(sendTravelerInviteEmail).not.toHaveBeenCalled();

    const args = (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(args.data.status).toBe("COMPLETE");
  });

  it("leaves an adult row's status unchanged (not COMPLETE) when a required field is still missing", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeAdultRow());
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeAdultRow(),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({ fullName: "Bob Companion" }),
      makeProps("trav-1"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.traveler.status).toBe("PENDING");
  });

  it("flips a minor row to COMPLETE when name+dateOfBirth+idDocument are all present", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeMinorRow());
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeMinorRow(),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({
        fullName: "Tiny Traveler",
        dateOfBirth: "2015-01-01",
        idDocument: "ID456",
      }),
      makeProps("trav-2"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.traveler.status).toBe("COMPLETE");
  });

  it("rejects an incomplete minor save with an inline error and does not persist", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(makeMinorRow());

    const res = await PATCH(
      makeRequest({ fullName: "Tiny Traveler", dateOfBirth: "2015-01-01" }),
      makeProps("trav-2"),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });

  it("never downgrades an already-COMPLETE row", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "buyer-1" },
    });
    (
      prisma.tripTraveler.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(
      makeAdultRow({
        status: "COMPLETE",
        fullName: "Bob Companion",
        email: "bob@example.com",
        idDocument: "ID123",
        submittedAt: new Date(),
      }),
    );
    (
      prisma.tripTraveler.update as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...makeAdultRow({ status: "COMPLETE" }),
      ...data,
    }));

    const res = await PATCH(
      makeRequest({ fullName: "Bob Companion Updated" }),
      makeProps("trav-1"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.traveler.status).toBe("COMPLETE");
  });
});

describe("PATCH late completion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "buyer-1" } });
    vi.mocked(prisma.tripRequest.count).mockResolvedValue(1);
  });
  it.each(["xsed", "family"])("fills missing %s fields without overwriting protected values", async (type) => {
    const row = makeAdultRow({ fullName: "Saved Name", email: "saved@example.com", idDocument: "   ", tripRequest: { ...lockedTrip, type } });
    vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue(row as never);
    (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...row, ...data }) as never);
    const { PATCH } = await import("../route");
    const res = await PATCH(makeRequest({ fullName: "Saved Name", idDocument: "ABC" }), makeProps("trav-1"));
    expect(res.status).toBe(200);
    expect((await res.json()).traveler.status).toBe("COMPLETE");
    expect(prisma.tripTraveler.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ fullName: "Saved Name", idDocument: "   ", status: "PENDING" }),
      data: expect.objectContaining({ idDocument: "ABC" }),
    }));
  });
  it("allows a minor to fill the missing date without unlocking saved name/document", async () => {
    const row = makeMinorRow({ fullName: "Child", idDocument: "123", tripRequest: lockedTrip });
    vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue(row as never);
    (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...row, ...data }) as never);
    const { PATCH } = await import("../route");
    expect((await PATCH(makeRequest({ dateOfBirth: "2016-01-01" }), makeProps("trav-2"))).status).toBe(200);
  });
  it("rejects a concurrent fill instead of overwriting it", async () => {
    vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue(makeAdultRow({ tripRequest: lockedTrip }) as never);
    vi.mocked(prisma.tripTraveler.update).mockRejectedValue({ code: "P2025" });
    const { PATCH } = await import("../route");
    expect((await PATCH(makeRequest({ fullName: "Late fill" }), makeProps("trav-1"))).status).toBe(409);
  });
  it.each([{ fullName: 42 }, { dateOfBirth: "not-a-date" }])("rejects invalid fields", async (body) => {
    vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue(makeAdultRow({ tripRequest: lockedTrip }) as never);
    const { PATCH } = await import("../route");
    expect((await PATCH(makeRequest(body), makeProps("trav-1"))).status).toBe(400);
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
  });
});

describe("PATCH auto-send invite (T3)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "buyer-1" } });
    vi.mocked(prisma.tripRequest.count).mockResolvedValue(1);
    vi.mocked(issueTravelerInvite).mockResolvedValue("plain-token");
    (prisma.tripTraveler.update as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({ ...currentRow, ...data }) as never,
    );
  });

  let currentRow: ReturnType<typeof makeAdultRow>;
  async function patch(row: ReturnType<typeof makeAdultRow>, body: Record<string, unknown>) {
    currentRow = row;
    vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue(row as never);
    const { PATCH } = await import("../route");
    return PATCH(makeRequest(body), makeProps("trav-1"));
  }

  it("issues a token and sends one invite when an email is first saved", async () => {
    const res = await patch(makeAdultRow(), { fullName: "Bob", email: "bob@example.com" });

    expect(res.status).toBe(200);
    expect(issueTravelerInvite).toHaveBeenCalledTimes(1);
    expect(issueTravelerInvite).toHaveBeenCalledWith("trav-1", "INVITED");
    expect(sendTravelerInviteEmail).toHaveBeenCalledWith("trav-1", "plain-token");
    const body = await res.json();
    expect(body.invited).toBe(true);
    expect(body.traveler.status).toBe("INVITED");
  });

  it("sends nothing when the same email is re-saved (case/whitespace-insensitive)", async () => {
    const res = await patch(makeAdultRow({ email: "bob@example.com", status: "INVITED" }), {
      email: " Bob@Example.com ",
      fullName: "Bob Renamed",
    });

    expect(res.status).toBe(200);
    expect(issueTravelerInvite).not.toHaveBeenCalled();
    expect(sendTravelerInviteEmail).not.toHaveBeenCalled();
    expect((await res.json()).invited).toBeUndefined();
  });

  it("rotates the token and re-sends when the email changes on an unlinked row", async () => {
    await patch(makeAdultRow({ email: "old@example.com", status: "INVITED" }), {
      email: "new@example.com",
    });

    expect(issueTravelerInvite).toHaveBeenCalledTimes(1);
    expect(sendTravelerInviteEmail).toHaveBeenCalledWith("trav-1", "plain-token");
  });

  it("does not send when the row is already linked to an account", async () => {
    await patch(makeAdultRow({ email: "old@example.com", userId: "companion-1", status: "COMPLETE" }), {
      email: "new@example.com",
    });

    expect(issueTravelerInvite).not.toHaveBeenCalled();
    expect(sendTravelerInviteEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["an invalid email", { email: "not-an-email" }, makeAdultRow()],
    ["no email in the payload", { fullName: "Bob" }, makeAdultRow()],
    ["a cleared email", { email: "" }, makeAdultRow({ email: "old@example.com" })],
  ])("does not send for %s", async (_, body, row) => {
    const res = await patch(row, body);

    expect(res.status).toBe(200);
    expect(issueTravelerInvite).not.toHaveBeenCalled();
    expect(sendTravelerInviteEmail).not.toHaveBeenCalled();
  });

  it("does not send for MINOR rows", async () => {
    await patch(
      makeMinorRow() as never,
      { fullName: "Kid", dateOfBirth: "2016-01-01", idDocument: "1", email: "kid@example.com" },
    );

    expect(issueTravelerInvite).not.toHaveBeenCalled();
  });

  it("does not send once the trip has ended", async () => {
    await patch(makeAdultRow({ tripRequest: endedTrip }), { email: "bob@example.com" });

    expect(issueTravelerInvite).not.toHaveBeenCalled();
  });

  it("sends after the cutoff for a newly saved email while the trip is still running", async () => {
    const res = await patch(
      makeAdultRow({ tripRequest: lockedTrip, fullName: "Saved", idDocument: "ID" }),
      { email: "bob@example.com" },
    );

    expect(res.status).toBe(200);
    expect(sendTravelerInviteEmail).toHaveBeenCalledTimes(1);
  });

  it("keeps a fully populated invited row INVITED (its token must stay usable)", async () => {
    const res = await patch(
      makeAdultRow({ email: "bob@example.com", status: "INVITED", fullName: "Bob" }),
      { idDocument: "ID123" },
    );

    const args = vi.mocked(prisma.tripTraveler.update).mock.calls[0][0] as { data: Record<string, unknown> };
    expect(args.data.status).toBe("INVITED");
    expect((await res.json()).traveler.status).toBe("INVITED");
    expect(issueTravelerInvite).not.toHaveBeenCalled();
  });

  it("still saves and answers 200 when issuing the invite fails", async () => {
    vi.mocked(issueTravelerInvite).mockRejectedValue(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await patch(makeAdultRow(), { email: "bob@example.com" });

    expect(res.status).toBe(200);
    expect(sendTravelerInviteEmail).not.toHaveBeenCalled();
    expect((await res.json()).invited).toBeUndefined();
    spy.mockRestore();
  });
});

describe("PATCH email lock once joined (T10)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "buyer-1" } });
    vi.mocked(prisma.tripRequest.count).mockResolvedValue(1);
    vi.mocked(prisma.tripTraveler.update).mockImplementation(
      (async ({ data }: { data: Record<string, unknown> }) => ({ ...joinedRow(), ...data })) as never,
    );
  });

  const joinedRow = () =>
    makeAdultRow({ userId: "companion-1", status: "COMPLETE", email: "joined@example.com", fullName: "Joined", idDocument: null });

  async function patch(body: Record<string, unknown>, row = joinedRow()) {
    vi.mocked(prisma.tripTraveler.findUnique).mockResolvedValue(row as never);
    const { PATCH } = await import("../route");
    return PATCH(makeRequest(body), makeProps("trav-1"));
  }

  it("rejects the buyer changing a joined row's email, without writing or inviting", async () => {
    const res = await patch({ email: "new@example.com" });

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("email_locked_joined");
    expect(prisma.tripTraveler.update).not.toHaveBeenCalled();
    expect(issueTravelerInvite).not.toHaveBeenCalled();
  });

  it("rejects clearing the email too", async () => {
    expect((await patch({ email: "" })).status).toBe(403);
  });

  it("treats a same-email re-save (case/whitespace) as no change and keeps other edits working", async () => {
    const res = await patch({ email: " Joined@Example.com ", idDocument: "ID9" });

    expect(res.status).toBe(200);
    expect(prisma.tripTraveler.update).toHaveBeenCalledTimes(1);
    expect(issueTravelerInvite).not.toHaveBeenCalled();
  });

  it("allows other edits when no email is sent", async () => {
    expect((await patch({ idDocument: "ID9" })).status).toBe(200);
  });

  it("still lets the buyer change the email of an unlinked row", async () => {
    vi.mocked(issueTravelerInvite).mockResolvedValue("tok");
    const res = await patch({ email: "new@example.com" }, makeAdultRow({ email: "old@example.com", status: "INVITED" }));

    expect(res.status).toBe(200);
  });
});
