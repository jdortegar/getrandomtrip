import { isProductionDeployment } from "../../src/lib/deployment";
import type { Config } from "@netlify/functions";

// 12:05 UTC = 09:05 America/Argentina/Buenos_Aires (no DST), weekdays only.
// Monday's run reports Fri–Sun. Offset from the GA4 recap to avoid overlap.
// Scheduled functions cannot be invoked publicly through their function URL.
export const config: Config = { schedule: "5 12 * * 1-5" };

export default async function handler(): Promise<Response> {
  if (!isProductionDeployment()) return new Response(null, { status: 204 });
  const secret = process.env.CRON_SECRET;
  const site = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  let endpoint: URL;
  try {
    if (!secret || !site) throw new Error("misconfigured");
    const origin = new URL(site);
    if (origin.protocol !== "https:" || origin.username || origin.password)
      throw new Error("misconfigured");
    endpoint = new URL("/api/internal/instagram-recap", origin);
  } catch {
    console.error(
      "[instagram-recap] missing or invalid scheduled configuration",
    );
    return new Response("misconfigured", { status: 500 });
  }
  try {
    const response = await fetch(endpoint.href, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      redirect: "error",
      signal: AbortSignal.timeout(25_000),
    });
    await response.body?.cancel();
    if (!response.ok) throw new Error("unavailable");
    return new Response("ok");
  } catch {
    console.error("[instagram-recap] scheduled invocation failed");
    return new Response("instagram_unavailable", { status: 503 });
  }
}
