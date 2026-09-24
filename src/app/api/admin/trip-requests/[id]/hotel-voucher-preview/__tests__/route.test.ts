// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/trip-documents/pdf/renderHotelVoucher", () => ({
  renderHotelVoucher: vi.fn(),
}));
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { renderHotelVoucher } from "@/lib/trip-documents/pdf/renderHotelVoucher";
import { MAX_DOCUMENT_REQUEST_BYTES as LIMIT } from "@/lib/trip-documents/validationPrimitives";
import { POST } from "../route";
const document = {
  template: "hotel-voucher",
  templateVersion: 1,
  label: "Hotel Ñandú",
  country: "AR",
  locale: "es",
  data: {
    holder: "Ana Pérez",
    guests: "Ana y José",
    checkInDate: "2026-09-23",
    checkOutDate: "2026-09-25",
    property: { name: "Hotel Río", address: "Calle 12" },
    inclusions: [],
  },
};
const context = { params: Promise.resolve({ id: "trip-1" }) };
function request(body = JSON.stringify(document), headers = {}) {
  return new Request("http://localhost/api/preview", {
    method: "POST",
    body,
    headers,
  }) as NextRequest;
}
function streamed(chunks: Uint8Array[], cancel = vi.fn()) {
  let index = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      else controller.close();
    },
    cancel,
  });
  return new Request("http://localhost/api/preview", {
    method: "POST",
    body,
    duplex: "half",
    headers: { "content-length": "1" },
  } as RequestInit & { duplex: string }) as NextRequest;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN" },
  } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: "admin-1",
    roles: ["ADMIN"],
  } as never);
  vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue({
    id: "trip-1",
  } as never);
  vi.mocked(renderHotelVoucher).mockResolvedValue({
    ok: true,
    buffer: Buffer.from("%PDF-test"),
  });
});
describe("hotel preview POST", () => {
  it("requires authentication before reading the body", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = await POST(request(), context);
    expect(response.status).toBe(401);
    expect(prisma.tripRequest.findUnique).not.toHaveBeenCalled();
    expect(renderHotelVoucher).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("rejects stale admin sessions using live roles", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "admin-1",
      roles: ["TRAVELER"],
    } as never);
    expect((await POST(request(), context)).status).toBe(403);
    expect(renderHotelVoucher).not.toHaveBeenCalled();
  });
  it("requires an existing trip without filtering its status or experience", async () => {
    vi.mocked(prisma.tripRequest.findUnique).mockResolvedValue(null);
    expect((await POST(request(), context)).status).toBe(404);
    expect(prisma.tripRequest.findUnique).toHaveBeenCalledWith({
      where: { id: "trip-1" },
      select: { id: true },
    });
    expect(renderHotelVoucher).not.toHaveBeenCalled();
  });
  it.each(["en", "es"])(
    "returns transient PDF bytes for %s",
    async (locale) => {
      const response = await POST(
        request(JSON.stringify({ ...document, locale })),
        context,
      );
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("%PDF-test");
      expect(response.headers.get("content-type")).toBe("application/pdf");
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("content-disposition")).toBe(
        'inline; filename="hotel-voucher-preview.pdf"',
      );
      expect(renderHotelVoucher).toHaveBeenCalledWith({ ...document, locale });
    },
  );
  it.each([
    { ...document, locale: "fr" },
    { ...document, extra: true },
    { ...document, data: { ...document.data, checkInDate: "2026-02-30" } },
  ])("rejects invalid generation inputs before rendering", async (input) => {
    const response = await POST(request(JSON.stringify(input)), context);
    expect(response.status).toBe(422);
    expect((await response.json()).errors.length).toBeGreaterThan(0);
    expect(renderHotelVoucher).not.toHaveBeenCalled();
  });
  it.each(["", "{", "null"])(
    "rejects malformed or invalid bodies: %s",
    async (body) => {
      expect((await POST(request(body), context)).status).toBe(
        body === "null" ? 422 : 400,
      );
      expect(renderHotelVoucher).not.toHaveBeenCalled();
    },
  );
  it("enforces actual streamed bytes despite a lying Content-Length and cancels", async () => {
    const cancel = vi.fn();
    const response = await POST(
      streamed(
        [new Uint8Array(LIMIT), new Uint8Array(1), new Uint8Array(1)],
        cancel,
      ),
      context,
    );
    expect(response.status).toBe(413);
    expect(cancel).toHaveBeenCalled();
    expect(renderHotelVoucher).not.toHaveBeenCalled();
  });
  it("enforces bytes without Content-Length", async () => {
    expect(
      (await POST(request("ñ".repeat(LIMIT / 2 + 1)), context)).status,
    ).toBe(413);
  });
  it("accepts the exact byte boundary with split UTF-8 codepoints", async () => {
    const bytes = Buffer.from(JSON.stringify(document));
    const padded = Buffer.concat([
      bytes,
      Buffer.alloc(LIMIT - bytes.length, " "),
    ]);
    const split = padded.indexOf(Buffer.from("ñ")) + 1;
    expect(
      (
        await POST(
          streamed([padded.subarray(0, split), padded.subarray(split)]),
          context,
        )
      ).status,
    ).toBe(200);
  });
  it("maps an interrupted request stream to a safe input error", async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.error(new Error("secret"));
      },
    });
    const req = new Request("http://localhost", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit & { duplex: string });
    const response = await POST(req as NextRequest, context);
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("secret");
  });
  it("returns renderer field errors without publishing bytes", async () => {
    vi.mocked(renderHotelVoucher).mockResolvedValue({
      ok: false,
      errors: [{ path: "locale", code: "invalid_locale" }],
    });
    expect((await POST(request(), context)).status).toBe(422);
  });
  it.each([4 * 1024 * 1024, 4 * 1024 * 1024 + 1])(
    "bounds PDF bytes: %d",
    async (size) => {
      vi.mocked(renderHotelVoucher).mockResolvedValue({
        ok: true,
        buffer: Buffer.alloc(size),
      });
      expect((await POST(request(), context)).status).toBe(
        size > 4 * 1024 * 1024 ? 413 : 200,
      );
    },
  );
  it.each([
    ["DOCUMENT_PDF_TOO_LARGE", 413],
    ["private supplier secret", 503],
  ])("maps render failures safely", async (message, status) => {
    vi.mocked(renderHotelVoucher).mockRejectedValue(new Error(String(message)));
    const response = await POST(request(), context);
    expect(response.status).toBe(status);
    expect(await response.text()).not.toContain(message);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});

it.each(["session", "role", "trip"])(
  "contains %s lookup failures",
  async (source) => {
    const failure = new Error("secret database.internal hostname");
    if (source === "session")
      vi.mocked(getServerSession).mockRejectedValue(failure);
    if (source === "role")
      vi.mocked(prisma.user.findUnique).mockRejectedValue(failure);
    if (source === "trip")
      vi.mocked(prisma.tripRequest.findUnique).mockRejectedValue(failure);
    const req = request();
    const read = vi.spyOn(req.body!, "getReader");
    const response = await POST(req, context);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "preview_unavailable" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(read).not.toHaveBeenCalled();
    expect(renderHotelVoucher).not.toHaveBeenCalled();
  },
);
