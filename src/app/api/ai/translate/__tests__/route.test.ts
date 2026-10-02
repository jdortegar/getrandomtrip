import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiServiceError, aiService } from "@/lib/ai/aiService";
import { prisma } from "@/lib/prisma";
import { POST } from "../route";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/ai/aiService", () => ({
  AiServiceError: class AiServiceError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  aiService: { translate: vi.fn() },
}));

function request(body: unknown) {
  return new NextRequest("http://localhost/api/ai/translate", {
    body: JSON.stringify(body),
    method: "POST",
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "tripper-1" } });
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "tripper-1",
    roles: ["TRIPPER"],
  } as never);
  vi.mocked(aiService.translate).mockResolvedValue(["Hello"]);
});

describe("POST /api/ai/translate", () => {
  it("requires a tripper or admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    expect((await POST(request({ pieces: [{ html: false, text: "Hola" }], target: "en" }))).status).toBe(401);

    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "traveler-1" } });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "traveler-1",
      roles: ["TRAVELER"],
    } as never);
    expect((await POST(request({ pieces: [{ html: false, text: "Hola" }], target: "en" }))).status).toBe(403);
    expect(aiService.translate).not.toHaveBeenCalled();
  });

  it("returns the translated pieces", async () => {
    const response = await POST(request({ pieces: [{ html: false, text: "Hola" }], target: "en" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ texts: ["Hello"] });
    expect(aiService.translate).toHaveBeenCalledWith([{ html: false, text: "Hola" }], "en");
  });

  it("rejects a malformed body and surfaces an upstream failure", async () => {
    expect((await POST(request({ pieces: [], target: "en" }))).status).toBe(400);

    vi.mocked(aiService.translate).mockRejectedValue(new AiServiceError("AI request failed", 502));
    expect((await POST(request({ pieces: [{ html: false, text: "Hola" }], target: "en" }))).status).toBe(502);
  });
});
