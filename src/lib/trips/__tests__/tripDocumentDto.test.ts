import { describe, expect, it } from "vitest";
import { toTripDocumentDTO } from "../tripDocumentDto";

const row = {
  id: "doc-1",
  tripRequestId: "trip-1",
  label: "Hotel Confirmation",
  country: "AR",
  storageKey: "trip-1/abc-def-123",
  mimeType: "application/pdf",
  originalFilename: "hotel-confirmation.pdf",
  sizeBytes: 12345,
  uploadedById: "admin-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("toTripDocumentDTO", () => {
  it("maps the row to the client-safe DTO shape", () => {
    const dto = toTripDocumentDTO(row);
    expect(dto).toEqual({
      id: "doc-1",
      label: "Hotel Confirmation",
      country: "AR",
      mimeType: "application/pdf",
      originalFilename: "hotel-confirmation.pdf",
      sizeBytes: 12345,
      createdAt: "2026-01-01T00:00:00.000Z",
      href: "/api/trips/trip-1/documents/doc-1",
      downloadHref: "/api/trips/trip-1/documents/doc-1?download=1",
    });
  });

  it("output contains no storageKey, fileUrl, or /api/upload substring anywhere", () => {
    const dto = toTripDocumentDTO(row);
    const serialized = JSON.stringify(dto);
    expect(serialized).not.toContain("storageKey");
    expect(serialized).not.toContain(row.storageKey);
    expect(serialized).not.toContain("fileUrl");
    expect(serialized).not.toContain("/api/upload");
  });
});
