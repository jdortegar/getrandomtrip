import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { handleI18n } from "../middleware";

describe("canonical locale middleware", () => {
  it("overwrites spoofed request locale/path headers for English", () => {
    const request = new NextRequest("https://getrandomtrip.com/en/blog", {
      headers: { "x-locale": "es", "x-pathname": "/private" },
    });
    const response = handleI18n(request)!;
    expect(response.headers.get("x-middleware-request-x-locale")).toBe("en");
    expect(response.headers.get("x-middleware-request-x-pathname")).toBe(
      "/en/blog",
    );
  });
  it("does not redirect a canonical Spanish URL because of an English cookie", () => {
    const request = new NextRequest("https://getrandomtrip.com/blog", {
      headers: { cookie: "NEXT_LOCALE=en" },
    });
    const response = handleI18n(request)!;
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://getrandomtrip.com/es/blog",
    );
    expect(response.headers.get("x-middleware-request-x-locale")).toBe("es");
  });
  it("permanently redirects the noncanonical Spanish prefix", () => {
    const response = handleI18n(
      new NextRequest("https://getrandomtrip.com/es/blog"),
    )!;
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://getrandomtrip.com/blog",
    );
  });
});
