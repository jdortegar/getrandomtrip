import type { Config } from "@netlify/functions";
// Scheduled functions are platform-only in production (no public URL invocation).
export const config: Config = { schedule: "0 * * * *" };

export default async function handler(): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const site = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  let endpoint: URL;
  try {
    if (!secret || !site) throw new Error("misconfigured");
    const origin = new URL(site);
    if (origin.protocol !== "https:" || origin.username || origin.password)
      throw new Error("misconfigured");
    endpoint = new URL("/api/internal/document-cleanup", origin);
  } catch {
    console.error("[document-cleanup] missing or invalid configuration");
    return new Response("misconfigured", { status: 500 });
  }
  try {
    // Below the scheduled platform's 30s limit. Aborting this request is not
    // proof the worker stopped: durable claim leases recover interrupted runs.
    const response = await fetch(endpoint.href, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      redirect: "error",
      signal: AbortSignal.timeout(25_000),
    });
    await response.body?.cancel();
    if (!response.ok) throw new Error("cleanup_unavailable");
    return new Response("ok", { status: 200 });
  } catch {
    console.error("[document-cleanup] invocation failed");
    return new Response("cleanup_unavailable", { status: 503 });
  }
}
