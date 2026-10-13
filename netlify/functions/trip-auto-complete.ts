import { isProductionDeployment } from "../../src/lib/deployment";
import type { Config } from "@netlify/functions";

// Fires every hour at minute 30, UTC.
export const config: Config = {
  schedule: "30 * * * *",
};

export default async function handler(): Promise<Response> {
  if (!isProductionDeployment()) return new Response(null, { status: 204 });
  const siteUrl = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;

  if (!siteUrl || !secret) {
    console.error("[trip-auto-complete] Missing URL or CRON_SECRET env vars");
    return new Response("misconfigured", { status: 500 });
  }

  const res = await fetch(`${siteUrl}/api/internal/trip-auto-complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.text();
  console.log(`[trip-auto-complete] status=${res.status} body=${body}`);

  return new Response(body, { status: res.status });
}
