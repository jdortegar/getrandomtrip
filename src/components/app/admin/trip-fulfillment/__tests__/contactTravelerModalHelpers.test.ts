import { describe, expect, it } from "vitest";
import {
  buildPrefillBody,
  canSend,
  resolveContactLocale,
} from "../contactTravelerModalHelpers";

describe("resolveContactLocale", () => {
  it("resolves 'en' to 'en'", () => {
    expect(resolveContactLocale("en")).toBe("en");
  });

  it("resolves 'es' to 'es'", () => {
    expect(resolveContactLocale("es")).toBe("es");
  });

  it("falls back to 'es' for null", () => {
    expect(resolveContactLocale(null)).toBe("es");
  });

  it("falls back to 'es' for undefined", () => {
    expect(resolveContactLocale(undefined)).toBe("es");
  });

  it("falls back to 'es' for an unsupported locale", () => {
    expect(resolveContactLocale("pt")).toBe("es");
  });
});

describe("buildPrefillBody", () => {
  it("interpolates {{userName}} into the template", () => {
    expect(buildPrefillBody("Hola {{userName}},\n\nSaludos", "Ana")).toBe(
      "Hola Ana,\n\nSaludos",
    );
  });

  it("replaces every occurrence of {{userName}}", () => {
    expect(buildPrefillBody("{{userName}} {{userName}}", "Ana")).toBe(
      "Ana Ana",
    );
  });
});

describe("canSend", () => {
  it("is false when the subject is blank", () => {
    expect(canSend("", "body", false)).toBe(false);
  });

  it("is false when the subject is whitespace only", () => {
    expect(canSend("   ", "body", false)).toBe(false);
  });

  it("is false when the body is blank", () => {
    expect(canSend("subject", "", false)).toBe(false);
  });

  it("is false when the body is whitespace only", () => {
    expect(canSend("subject", "   ", false)).toBe(false);
  });

  it("is false while sending, even with valid content", () => {
    expect(canSend("subject", "body", true)).toBe(false);
  });

  it("is true with valid non-blank subject and body while not sending", () => {
    expect(canSend("subject", "body", false)).toBe(true);
  });
});
