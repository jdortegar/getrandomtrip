import { describe, expect, it } from "vitest";
import {
  isIsoCalendarDate,
  isWallTime,
  isOrderedDateRange,
  isHttpsUrl,
  isBoundedDocumentText,
  isBoundedDocumentArray,
  isBoundedDocumentRequest,
} from "../validationPrimitives";

describe("isIsoCalendarDate", () => {
  it("accepts a real ISO calendar date", () => {
    expect(isIsoCalendarDate("2026-09-23")).toBe(true);
  });
  it.each(["2024-02-29", "2000-02-29", "0096-02-29", "2026-04-30"])(
    "accepts calendar boundary %s",
    (date) => expect(isIsoCalendarDate(date)).toBe(true),
  );
  it.each([
    "2025-02-29",
    "1900-02-29",
    "2100-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-10",
    "2026-01-00",
    "2026-01-32",
    "2026-2-09",
    "26-02-09",
    "2026-09-23T00:00:00Z",
    " 2026-09-23",
    "2026-09-23\n",
    "",
    null,
    undefined,
    20260923,
    new Date("2026-09-23"),
    [],
    {},
  ])("rejects invalid calendar input %j", (date) => {
    expect(isIsoCalendarDate(date)).toBe(false);
  });
});

describe("document bounds", () => {
  it("accepts incomplete text and enforces 4000 characters without trimming", () => {
    expect(isBoundedDocumentText("")).toBe(true);
    expect(isBoundedDocumentText("á".repeat(4000))).toBe(true);
    expect(isBoundedDocumentText("á".repeat(4001))).toBe(false);
    expect(isBoundedDocumentText(" ".repeat(4001))).toBe(false);
    expect(isBoundedDocumentText(["text"])).toBe(false);
  });

  it("accepts incomplete arrays through 50 items without mutating order", () => {
    expect(isBoundedDocumentArray([])).toBe(true);
    const items = Object.freeze(
      Array.from({ length: 50 }, (_, i) => `item-${i}`),
    );
    expect(isBoundedDocumentArray(items)).toBe(true);
    expect(isBoundedDocumentArray([...items, "extra"])).toBe(false);
    expect(isBoundedDocumentArray({ length: 50 })).toBe(false);
    expect(items[0]).toBe("item-0");
    expect(items[49]).toBe("item-49");
  });

  it("measures serialized request text as UTF-8 bytes up to 128 KiB", () => {
    expect(isBoundedDocumentRequest("{}")).toBe(true);
    expect(isBoundedDocumentRequest("a".repeat(131072))).toBe(true);
    expect(isBoundedDocumentRequest("a".repeat(131073))).toBe(false);
    expect(isBoundedDocumentRequest("á".repeat(65536))).toBe(true);
    expect(isBoundedDocumentRequest("á".repeat(65537))).toBe(false);
    expect(isBoundedDocumentRequest("😀".repeat(32768))).toBe(true);
    expect(isBoundedDocumentRequest("😀".repeat(32769))).toBe(false);
    expect(isBoundedDocumentRequest([])).toBe(false);
  });

  it.each([null, undefined, false, 10, {}])(
    "rejects wrong bound input %j",
    (value) => {
      expect(isBoundedDocumentText(value)).toBe(false);
      expect(isBoundedDocumentArray(value)).toBe(false);
      expect(isBoundedDocumentRequest(value)).toBe(false);
    },
  );
});

describe("isHttpsUrl", () => {
  it.each([
    "https://example.com/map?q=Buenos%20Aires#place",
    "HTTPS://example.com",
    "https://example.com:8443/path",
    "https://localhost",
    "https://127.0.0.1",
    "https://[::1]/",
    "https://ejemplo.com/café",
  ])("accepts absolute credential-free HTTPS URL %s", (url) =>
    expect(isHttpsUrl(url)).toBe(true),
  );
  it.each([
    "http://example.com",
    "ftp://example.com",
    "javascript:alert(1)",
    "/place",
    "//example.com",
    "https:example.com",
    "https:///example.com",
    "https://",
    "https://user:pass@example.com",
    "https://user@example.com",
    "https://:pass@example.com",
    "https://example.com:invalid",
    "https://exa mple.com",
    "https://example.com/hello world",
    " https://example.com",
    "https://example.com\n",
    "https://example.com\\path",
    "",
    null,
    undefined,
    {},
    5,
  ])("rejects malformed or unsafe URL %j", (url) =>
    expect(isHttpsUrl(url)).toBe(false),
  );
});

describe("isWallTime", () => {
  it.each(["00:00", "09:05", "23:59", "02:30"])(
    "accepts wall time %s",
    (time) => {
      expect(isWallTime(time)).toBe(true);
    },
  );
  it.each([
    "24:00",
    "23:60",
    "9:05",
    "09:5",
    "09:05:00",
    "09:05Z",
    "09:05+03:00",
    " 09:05",
    "09:05\n",
    "",
    null,
    905,
    {},
  ])("rejects invalid wall time %j", (time) =>
    expect(isWallTime(time)).toBe(false),
  );
});

describe("isOrderedDateRange", () => {
  it.each([
    ["2026-09-23", "2026-09-23", true],
    ["2026-12-31", "2027-01-01", true],
    ["2024-02-29", "2024-03-01", true],
    ["2026-09-24", "2026-09-23", false],
    ["2025-02-29", "2025-03-01", false],
    ["2026-01-01", "2026-13-01", false],
    ["", "2026-09-23", false],
    ["2026-09-23", null, false],
  ])("orders %j through %j as %s", (start, end, expected) => {
    expect(isOrderedDateRange(start, end)).toBe(expected);
  });
});
