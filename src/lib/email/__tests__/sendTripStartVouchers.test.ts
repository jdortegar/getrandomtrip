import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn() },
    tripDocument: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/helpers/sendMail", () => ({
  sendMail: vi.fn(),
}));

const storeGetMock = vi.fn();
vi.mock("@/lib/storage/tripDocumentStore", () => ({
  getTripDocumentStore: () => ({ get: storeGetMock }),
}));

// ── Imports ────────────────────────────────────────────────────────────────────
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/helpers/sendMail";
import { sendTripStartVouchers } from "../index";

function makeBlob(bytes: number): { arrayBuffer: () => Promise<ArrayBuffer> } {
  return {
    arrayBuffer: async () => new ArrayBuffer(bytes),
  };
}

const USER = {
  email: "traveler@example.com",
  name: "Juana Pérez",
  locale: "es",
};

const TRIP = {
  startDate: new Date("2026-08-17T00:00:00Z"),
  endDate: new Date("2026-08-21T00:00:00Z"),
  nights: 4,
  pax: 2,
  type: "couple",
};

const DOC_A = {
  label: "Hotel Confirmation",
  storageKey: "trip-1/doc-a",
  mimeType: "application/pdf",
  originalFilename: "hotel.pdf",
  sizeBytes: 1024,
};

const DOC_B = {
  label: "Flight Ticket",
  storageKey: "trip-1/doc-b",
  mimeType: "application/pdf",
  originalFilename: "flight.pdf",
  sizeBytes: 2048,
};

describe("sendTripStartVouchers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(USER);
    (prisma.tripRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      TRIP,
    );
    (prisma.tripDocument.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      DOC_A,
      DOC_B,
    ]);
    storeGetMock.mockImplementation(async (key: string) =>
      makeBlob(key === DOC_A.storageKey ? DOC_A.sizeBytes : DOC_B.sizeBytes),
    );
    (sendMail as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "resend-id" });
  });

  it("returns { sent: false } and does not call sendMail when the user has no email", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      email: null,
      name: "No Email",
      locale: "es",
    });

    const result = await sendTripStartVouchers("trip-1", "user-1");

    expect(result).toEqual({ sent: false });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("returns { sent: false } and does not call sendMail when there are zero documents", async () => {
    (prisma.tripDocument.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await sendTripStartVouchers("trip-1", "user-1");

    expect(result).toEqual({ sent: false });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("attaches every document and reports sent: true", async () => {
    const result = await sendTripStartVouchers("trip-1", "user-1");

    expect(result).toEqual({ sent: true });
    expect(sendMail).toHaveBeenCalledTimes(1);

    const call = (sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.to).toBe(USER.email);
    expect(call.attachments).toHaveLength(2);
    expect(call.attachments[0]).toMatchObject({
      filename: DOC_A.originalFilename,
      contentType: DOC_A.mimeType,
    });
    expect(Buffer.isBuffer(call.attachments[0].content)).toBe(true);

    const props = call.content.react.props;
    expect(props.documents).toEqual([
      { label: DOC_A.label, mimeType: DOC_A.mimeType },
      { label: DOC_B.label, mimeType: DOC_B.mimeType },
    ]);
    expect(props.skippedCount).toBe(0);
    expect(props.locale).toBe("es");
  });

  it("resolves locale 'en' from the user record", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...USER,
      locale: "en",
    });

    await sendTripStartVouchers("trip-1", "user-1");

    const call = (sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content.react.props.locale).toBe("en");
  });

  it("skips a document that would exceed the attachment size budget, without failing the send", async () => {
    const hugeDoc = {
      ...DOC_B,
      storageKey: "trip-1/doc-huge",
      originalFilename: "huge.pdf",
      sizeBytes: 30 * 1024 * 1024, // 30MB — over the 25MB budget
    };
    (prisma.tripDocument.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      DOC_A,
      hugeDoc,
    ]);

    const result = await sendTripStartVouchers("trip-1", "user-1");

    expect(result).toEqual({ sent: true });
    // storageKey for the huge doc is never fetched — skip happens before the blob read
    expect(storeGetMock).not.toHaveBeenCalledWith(
      hugeDoc.storageKey,
      expect.anything(),
    );

    const call = (sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.attachments).toHaveLength(1);
    expect(call.content.react.props.skippedCount).toBe(1);
    expect(call.content.react.props.documents).toEqual([
      { label: DOC_A.label, mimeType: DOC_A.mimeType },
    ]);
  });

  it("still sends (with no attachments) when the blob store returns null for a document", async () => {
    storeGetMock.mockResolvedValue(null);

    const result = await sendTripStartVouchers("trip-1", "user-1");

    expect(result).toEqual({ sent: true });
    const call = (sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.attachments).toBeUndefined();
    expect(call.content.react.props.skippedCount).toBe(2);
  });
});
