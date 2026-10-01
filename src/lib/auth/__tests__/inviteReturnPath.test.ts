import { describe, expect, it } from "vitest";
import { inviteReturnPath, safeInviteReturnPath } from "../inviteReturnPath";

describe("safeInviteReturnPath", () => {
  it.each(["/es/invite/abc123", "/en/invite/AbC_-123"])("accepts %s", (path) => {
    expect(safeInviteReturnPath(path)).toBe(path);
  });

  it.each([
    "https://evil.example.com/es/invite/abc",
    "//evil.example.com/es/invite/abc",
    "/\\evil.example.com",
    "/es/dashboard",
    "/fr/invite/abc",
    "/es/invite/",
    "/es/invite/abc/extra",
    "/es/invite/abc?next=https://evil.example.com",
    "/es/invite/abc#frag",
    "/es/invite/ab c",
    "/es/invite/../../login",
    "",
    null,
    undefined,
    42,
    { path: "/es/invite/abc" },
  ])("rejects %j", (value) => {
    expect(safeInviteReturnPath(value)).toBeNull();
  });
});

describe("inviteReturnPath", () => {
  it("builds the locale-prefixed invite path", () => {
    expect(inviteReturnPath("en", "tok123")).toBe("/en/invite/tok123");
  });
});
