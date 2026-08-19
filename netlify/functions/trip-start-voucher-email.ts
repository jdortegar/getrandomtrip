import type { Config } from "@netlify/functions";

// Fires every hour at the top of the hour, UTC.
export const config: Config = {
  schedule: "0 * * * *",
};

export default async function handler(): Promise<Response> {
  const siteUrl = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;

  if (!siteUrl || !secret) {
    console.error(
      "[trip-start-voucher-email] Missing URL or CRON_SECRET env vars",
    );
    return new Response("misconfigured", { status: 500 });
  }

  const res = await fetch(`${siteUrl}/api/internal/trip-start-voucher-email`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.text();
  console.log(`[trip-start-voucher-email] status=${res.status} body=${body}`);

  return new Response(body, { status: res.status });
}
