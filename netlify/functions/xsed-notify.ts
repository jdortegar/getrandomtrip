import type { Config } from "@netlify/functions";

// Emails each LATAM timezone group at 17:30 local, one hour before the
// 18:00 Sunday drop. That runs Sunday 19:30 UTC through Monday 01:30 UTC:
//   Sun 19:30 → UTC-2 (Noronha)    Sun 20:30 → UTC-3 (Argentina)
//   Sun 21:30 → UTC-4 (Bolivia)    Sun 22:30 → UTC-5 (Colombia/Peru)
//   Sun 23:30 → UTC-6 (Mexico)     Mon 00:30 → UTC-7 (Hermosillo)
//   Mon 01:30 → UTC-8 (Tijuana winter)
// One cron string can't express "Sunday 19-23 + Monday 0-1", so this also
// fires at Sunday 00-01 and Monday 19-23 UTC; the API skips those runs
// (getNotifyTargetUtcOffset returns null).
export const config: Config = {
  schedule: "30 0-1,19-23 * * 0,1",
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
