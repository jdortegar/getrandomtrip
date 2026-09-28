import type { Config } from "@netlify/functions";

// Scheduled functions cannot be invoked publicly through their function URL.
export const config: Config = { schedule: "*/5 * * * *" };

export default async function handler(): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const site = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  let endpoint: URL;
  try {
    if (!secret || !site) throw new Error("misconfigured");
    const origin = new URL(site);
    if (origin.protocol !== "https:" || origin.username || origin.password)
      throw new Error("misconfigured");
    endpoint = new URL("/api/internal/sales-notifications", origin);
  } catch {
    console.error("[sales] missing or invalid scheduled configuration");
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
    console.error("[sales] scheduled invocation failed");
    return new Response("sales_unavailable", { status: 503 });
  }
}
