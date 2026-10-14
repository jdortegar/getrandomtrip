import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET, PATCH } from "../route";

const getServerSessionMock = getServerSession as ReturnType<typeof vi.fn>;
const findUniqueMock = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const updateMock = prisma.user.update as ReturnType<typeof vi.fn>;

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    idNumber: "123",
    idCountry: "Argentina",
    idExpiry: null,
    passportNumber: "P1",
    passportCountry: "",
    passportExpiry: new Date("2030-05-01T00:00:00.000Z"),
    nationalities: [],
    approvedVisas: [],
    ...overrides,
  };
}

function patchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/user/documents", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
});

describe("GET /api/user/documents", () => {
  it("returns 401 without a session", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns stored nationalities and visa codes", async () => {
    findUniqueMock.mockResolvedValue(
      userRow({ nationalities: ["AR", "IT"], approvedVisas: ["US", "SCHENGEN"] }),
    );
    const body = await (await GET()).json();
    expect(body.user.nationalities).toEqual(["AR", "IT"]);
    expect(body.user.approvedVisas).toEqual(["US", "SCHENGEN"]);
    expect(body.user.passportExpiry).toBe("2030-05-01");
    expect(findUniqueMock.mock.calls[0][0].select.nationalities).toBe(true);
  });

  it("converts legacy visa names on read, drops unresolved ones and never writes back", async () => {
    findUniqueMock.mockResolvedValue(
      userRow({ approvedVisas: ["United States", "Schengena", "Atlantis", "JP"] }),
    );
    const body = await (await GET()).json();
    expect(body.user.approvedVisas).toEqual(["US", "SCHENGEN", "JP"]);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it.each([
    ["Argentina", ["AR"]],
    ["ar", ["AR"]],
    ["Atlantis", []],
    ["", []],
  ])("prefills empty nationalities from passportCountry %j", async (passportCountry, expected) => {
    findUniqueMock.mockResolvedValue(userRow({ passportCountry }));
    const body = await (await GET()).json();
    expect(body.user.nationalities).toEqual(expected);
  });

  it("does not prefill when nationalities are already stored", async () => {
    findUniqueMock.mockResolvedValue(
      userRow({ passportCountry: "Argentina", nationalities: ["IT"] }),
    );
    const body = await (await GET()).json();
    expect(body.user.nationalities).toEqual(["IT"]);
  });
});

describe("PATCH /api/user/documents", () => {
  it("returns 401 without a session", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const response = await PATCH(patchRequest({}));
    expect(response.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("saves normalized, deduped nationality and visa codes", async () => {
    updateMock.mockResolvedValue(
      userRow({ nationalities: ["AR", "IT"], approvedVisas: ["SCHENGEN", "US"] }),
    );
    const response = await PATCH(
      patchRequest({
        passportCountry: "AR",
        nationalities: ["ar", " IT ", "AR"],
        approvedVisas: ["SCHENGEN", "us", "US"],
      }),
    );
    expect(response.status).toBe(200);
    const { data } = updateMock.mock.calls[0][0];
    expect(data.nationalities).toEqual(["AR", "IT"]);
    expect(data.approvedVisas).toEqual(["SCHENGEN", "US"]);
    expect(data.passportCountry).toBe("AR");
    const body = await response.json();
    expect(body.user.nationalities).toEqual(["AR", "IT"]);
    expect(body.user.approvedVisas).toEqual(["SCHENGEN", "US"]);
  });

  it("leaves nationalities and visas untouched when they are omitted", async () => {
    updateMock.mockResolvedValue(userRow());
    await PATCH(patchRequest({ idNumber: "999" }));
    const { data } = updateMock.mock.calls[0][0];
    expect(data.nationalities).toBeUndefined();
    expect(data.approvedVisas).toBeUndefined();
  });

  it.each([
    [{ nationalities: ["SCHENGEN"] }, "Invalid nationalities", ["SCHENGEN"]],
    [{ nationalities: ["Argentina", "AR"] }, "Invalid nationalities", ["Argentina"]],
    [{ nationalities: "AR" }, "Invalid nationalities", []],
    [{ approvedVisas: ["United States"] }, "Invalid approvedVisas", ["United States"]],
    [{ approvedVisas: [42] }, "Invalid approvedVisas", ["42"]],
  ])("rejects %j with 400", async (body, error, invalid) => {
    const response = await PATCH(patchRequest(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error, invalid });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
