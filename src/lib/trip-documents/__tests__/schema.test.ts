// @vitest-environment node
import { readFileSync } from "node:fs";
import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const body = (name: string) =>
  schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
const fields = (name: string) =>
  Object.fromEntries(
    [...body(name).matchAll(/^\s+(\w+)\s+([^\n]+)$/gm)].map(
      ([, name, value]) => [name, value.trim().replace(/\s+/g, " ")],
    ),
  );

describe("generated document schema", () => {
  it("stores authoring content in a separate trip-owned draft model", () => {
    expect(fields("TripDocumentDraft")).toMatchObject({
      id: "String @id @default(cuid())",
      tripRequestId: "String",
      template: "String",
      templateVersion: "Int @default(1)",
      locale: "String",
      label: "String",
      country: "String",
      data: "Json",
      revision: "Int @default(1)",
      tripRequest:
        "TripRequest @relation(fields: [tripRequestId], references: [id], onDelete: Cascade)",
    });
  });
  it("separates optional private preview and published revision identities", () => {
    expect(fields("TripDocumentDraft")).toMatchObject({
      previewId: "String?",
      previewKey: "String?",
      previewRevision: "Int?",
      previewSize: "Int?",
      previewHash: "String?",
      publishedPreviewId: "String?",
      publishedRevision: "Int?",
      createdAt: "DateTime @default(now())",
      updatedAt: "DateTime @updatedAt",
    });
    expect(body("TripDocumentDraft")).toContain(
      "@@index([tripRequestId, createdAt])",
    );
  });
  it("unlinks attachment deletion without deleting the draft or vice versa", () => {
    expect(fields("TripDocumentDraft")).toMatchObject({
      documentId: "String? @unique",
      document:
        "TripDocument? @relation(fields: [documentId], references: [id], onDelete: SetNull)",
    });
    expect(fields("TripDocument").draft).toBe("TripDocumentDraft?");
    expect(fields("TripRequest").documentDrafts).toBe("TripDocumentDraft[]");
    expect(fields("TripDocument").tripRequest).toContain("onDelete: Cascade");
  });
  it("stores durable pre-write candidates, adoption receipts and retryable tombstones", () => {
    expect(fields("TripDocumentCleanupJob")).toEqual({
      id: "String @id @default(cuid())",
      targets: "Json",
      purpose: "String",
      ownerId: "String",
      tripRequestId: "String?",
      draftId: "String?",
      documentId: "String?",
      previewId: "String?",
      revision: "Int?",
      disposition: "TripDocumentCleanupDisposition @default(pending)",
      expiresAt: "DateTime?",
      nextAttemptAt: "DateTime @default(now())",
      attempts: "Int @default(0)",
      lastError: "String?",
      createdAt: "DateTime @default(now())",
    });
    expect(schema).toMatch(
      /enum TripDocumentCleanupDisposition\s*\{\s*pending\s+retained\s+delete\s*\}/,
    );
    expect(body("TripDocumentCleanupJob")).not.toMatch(/@relation|onDelete/);
  });
  it.each([
    "[disposition, nextAttemptAt]",
    "[disposition, expiresAt]",
    "[ownerId, tripRequestId]",
    "[tripRequestId]",
    "[draftId, previewId, purpose, disposition]",
    "[documentId]",
  ])("indexes due work and ownership/receipt lookup %s", (index) => {
    expect(body("TripDocumentCleanupJob")).toContain(`@@index(${index})`);
  });
  it("generates separate draft/outbox models without private published-row scalars", () => {
    const models = Prisma.dmmf.datamodel.models;
    expect(
      models.find((model) => model.name === "TripDocumentDraft")?.dbName,
    ).toBe("trip_document_drafts");
    expect(
      models.find((model) => model.name === "TripDocumentCleanupJob")?.dbName,
    ).toBe("trip_document_cleanup_jobs");
    expect(
      models
        .find((model) => model.name === "TripDocument")
        ?.fields.filter((field) => field.kind === "scalar")
        .map((field) => field.name),
    ).toEqual([
      "id",
      "tripRequestId",
      "label",
      "country",
      "storageKey",
      "mimeType",
      "originalFilename",
      "sizeBytes",
      "uploadedById",
      "createdAt",
    ]);
    expect(Prisma.TripRequestScalarFieldEnum).not.toHaveProperty(
      "documentDrafts",
    );
  });
});
