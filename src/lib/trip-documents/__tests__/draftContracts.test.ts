import { expect, it } from "vitest";
import { createTripDocumentSnapshot } from "../snapshots";
import {
  parseDraftDocument,
  parseDraftPatch,
  toDraftDto,
} from "../draftContracts";
const templates = [
  "hotel-voucher",
  "activity-voucher",
  "dinner-voucher",
  "experience-roadmap",
  "xsed-roadmap",
] as const;
it.each(templates)(
  "accepts incomplete %s draft without generation requirements",
  (template) => {
    const document = createTripDocumentSnapshot(template, {});
    expect(parseDraftDocument(document)).toEqual({ ok: true, value: document });
    expect(parseDraftPatch({ revision: 1, document })).toEqual({
      ok: true,
      value: { revision: 1, document },
    });
  },
);
it.each([
  null,
  [],
  {},
  { template: "unknown" },
  { template: "hotel-voucher", templateVersion: 2 },
])("rejects invalid document discriminator or structure", (input) => {
  expect(parseDraftDocument(input).ok).toBe(false);
});
it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1", null])(
  "requires a positive safe revision: %s",
  (revision) => {
    expect(
      parseDraftPatch({
        revision,
        document: createTripDocumentSnapshot("hotel-voucher", {}),
      }).ok,
    ).toBe(false);
  },
);
it("rejects server-owned envelope fields and nested unknown data", () => {
  const document = createTripDocumentSnapshot("hotel-voucher", {});
  expect(
    parseDraftPatch({ revision: 1, document, previewKey: "private" }).ok,
  ).toBe(false);
  expect(
    parseDraftDocument({
      ...document,
      data: { ...document.data, secret: true },
    }).ok,
  ).toBe(false);
  expect(parseDraftDocument({ ...document, previewId: "fake" }).ok).toBe(false);
});
it("preserves parser paths, metadata normalization and incomplete strings", () => {
  const document = createTripDocumentSnapshot("xsed-roadmap", {});
  expect(
    parseDraftPatch({ revision: 2, document: { ...document, locale: "fr" } }),
  ).toMatchObject({
    ok: false,
    errors: [{ path: "document.locale", code: "invalid_locale" }],
  });
  const result = parseDraftDocument({
    ...document,
    label: "  My draft  ",
    data: { ...document.data, departureTime: "unfinished" },
  });
  expect(result).toMatchObject({
    ok: true,
    value: { label: "My draft", data: { departureTime: "unfinished" } },
  });
});
it("serializes only public draft fields, without storage identity or source refresh", () => {
  const document = createTripDocumentSnapshot("hotel-voucher", {
    user: { name: "Original buyer" },
  });
  const row = {
    ...document,
    id: "draft",
    tripRequestId: "trip",
    revision: 4,
    documentId: "attachment",
    publishedRevision: 2,
    previewId: "preview",
    previewRevision: 4,
    previewKey: "private/key",
    previewHash: "secret",
    previewSize: 42,
    publishedPreviewId: "internal",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-02-01"),
  };
  const dto = toDraftDto(row);
  expect(dto).toEqual({
    id: "draft",
    tripRequestId: "trip",
    revision: 4,
    document,
    documentId: "attachment",
    publishedRevision: 2,
    previewId: "preview",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  });
  expect(JSON.stringify(dto)).not.toContain("private/key");
  expect(toDraftDto({ ...row, previewRevision: 3 }).previewId).toBe(null);
  expect(() => toDraftDto({ ...row, templateVersion: 99 })).toThrow(
    "INVALID_STORED_DOCUMENT_DRAFT",
  );
});
