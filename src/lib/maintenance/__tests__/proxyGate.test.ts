// @vitest-environment node
// The proxy runs server-side; browser-like environments drop the Cookie header.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import {
  MAINTENANCE_RETRY_AFTER_SECONDS,
  maintenanceResponse,
  resetMaintenanceCache,
  type SiteStatusFetcher,
} from "../proxyGate";

function request(path: string, cookie?: string) {
  return new NextRequest(`https://getrandomtrip.com${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

function fetcher(
  status: { maintenance: boolean; staff?: boolean } | Error,
): SiteStatusFetcher & ReturnType<typeof vi.fn> {
  return vi.fn(async (_url: URL, cookie?: string) => {
    if (status instanceof Error) throw status;
    return {
      maintenance: status.maintenance,
      staff: cookie ? !!status.staff : false,
    };
  });
}

beforeEach(() => resetMaintenanceCache());

describe("maintenanceResponse", () => {
  it("lets every request through while maintenance is off", async () => {
    expect(
      await maintenanceResponse(
        request("/es"),
        fetcher({ maintenance: false }),
      ),
    ).toBeNull();
  });

  it.each([
    ["/", es.maintenance.title, "es"],
    ["/experiences", es.maintenance.title, "es"],
    ["/en/faq", en.maintenance.title, "en"],
  ])(
    "answers %s with the 503 maintenance page in its language",
    async (path, title, lang) => {
      const res = await maintenanceResponse(
        request(path),
        fetcher({ maintenance: true }),
      );

      expect(res?.status).toBe(503);
      expect(res?.headers.get("retry-after")).toBe(
        String(MAINTENANCE_RETRY_AFTER_SECONDS),
      );
      expect(res?.headers.get("content-type")).toContain("text/html");
      expect(res?.headers.get("cache-control")).toBe("no-store");
      const html = await res!.text();
      expect(html).toContain(`<html lang="${lang}">`);
      expect(html).toContain(title);
    },
  );

  it.each([
    "/login",
    "/en/login",
    "/verify-email/x",
    "/reset-password",
    "/invite/t",
    "/tripper-invite/t",
    "/unsubscribe",
  ])("keeps %s reachable so the team can sign in", async (path) => {
    expect(
      await maintenanceResponse(request(path), fetcher({ maintenance: true })),
    ).toBeNull();
  });

  it("lets staff sessions through and forwards their cookie to the status check", async () => {
    const check = fetcher({ maintenance: true, staff: true });
    const res = await maintenanceResponse(
      request("/es", "next-auth.session-token=abc"),
      check,
    );

    expect(res).toBeNull();
    expect(check).toHaveBeenLastCalledWith(
      new URL("https://getrandomtrip.com/api/site-status"),
      "next-auth.session-token=abc",
    );
  });

  it("recognizes the secure and chunked session cookie names", async () => {
    for (const cookie of [
      "__Secure-next-auth.session-token=abc",
      "next-auth.session-token.0=abc",
    ]) {
      resetMaintenanceCache();
      expect(
        await maintenanceResponse(
          request("/es", cookie),
          fetcher({ maintenance: true, staff: true }),
        ),
      ).toBeNull();
    }
  });

  it("shows the maintenance page to a signed-in non-staff visitor", async () => {
    const res = await maintenanceResponse(
      request("/es", "next-auth.session-token=abc"),
      fetcher({ maintenance: true, staff: false }),
    );
    expect(res?.status).toBe(503);
  });

  it("keeps the site up when the status check fails", async () => {
    expect(
      await maintenanceResponse(request("/es"), fetcher(new Error("down"))),
    ).toBeNull();
  });

  it("checks the flag at most once per 30 seconds", async () => {
    const check = fetcher({ maintenance: false });
    await maintenanceResponse(request("/es"), check, 1_000);
    await maintenanceResponse(request("/en"), check, 30_000);
    expect(check).toHaveBeenCalledTimes(1);
    await maintenanceResponse(request("/es"), check, 31_001);
    expect(check).toHaveBeenCalledTimes(2);
  });
});
