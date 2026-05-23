import type { Config } from "@netlify/functions";

// Fires every Sunday at :30 past the hour, 17:30–23:30 UTC.
// Each firing targets a different LATAM timezone group:
//   17:30 → UTC-2 (Noronha)    18:30 → UTC-3 (Argentina)
//   19:30 → UTC-4 (Bolivia)    20:30 → UTC-5 (Colombia/Peru)
//   21:30 → UTC-6 (Mexico)     22:30 → UTC-7 (Hermosillo)
//   23:30 → UTC-8 (Tijuana winter)
export const config: Config = {
  schedule: "30 17-23 * * 0",
};

export default async function handler(): Promise<Response> {
  const siteUrl = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;

  if (!siteUrl || !secret) {
    console.error("[xsed-notify] Missing URL or CRON_SECRET env vars");
    return new Response("misconfigured", { status: 500 });
  }

  const res = await fetch(`${siteUrl}/api/internal/xsed/notify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.text();
  console.log(`[xsed-notify] status=${res.status} body=${body}`);

  return new Response(body, { status: res.status });
}
