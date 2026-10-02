import { createSign } from "node:crypto";
import type { Ga4Config } from "@/types/analyticsRecap";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA4_TIMEOUT_MS = 8_000;

export interface Ga4Row {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
}
export interface Ga4Report {
  rows?: Ga4Row[];
}

/** Env values are `\n`-escaped and may carry quotes or padding. */
export function normalizePrivateKey(raw: string): string {
  return raw
    .trim()
    .replace(/^(["'])([\s\S]*)\1$/, "$2")
    .replace(/\\n/g, "\n")
    .trim()
    .concat("\n");
}

const b64url = (value: object | Buffer) =>
  Buffer.from(Buffer.isBuffer(value) ? value : JSON.stringify(value)).toString(
    "base64url",
  );

/**
 * Errors are deliberately generic: never include key material, the service
 * account email, tokens or upstream response bodies.
 */
export async function getGa4AccessToken(
  config: Ga4Config,
  nowMs: number = Date.now(),
): Promise<string> {
  let assertion: string;
  try {
    const iat = Math.floor(nowMs / 1000);
    const unsigned = `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url({
      iss: config.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat,
      exp: iat + 300,
    })}`;
    const signature = createSign("RSA-SHA256")
      .update(unsigned)
      .sign(normalizePrivateKey(config.privateKey));
    assertion = `${unsigned}.${b64url(signature)}`;
  } catch {
    throw new Error("ga4_token_failed");
  }
  let token: unknown;
  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
      redirect: "error",
      signal: AbortSignal.timeout(GA4_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error("rejected");
    token = ((await response.json()) as { access_token?: unknown })
      .access_token;
  } catch {
    throw new Error("ga4_token_failed");
  }
  if (typeof token !== "string" || !token) throw new Error("ga4_token_failed");
  return token;
}

/** GA4 allows at most 5 reports per batch. */
export async function runGa4BatchReports(
  config: Ga4Config,
  accessToken: string,
  requests: object[],
): Promise<Ga4Report[]> {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(config.propertyId)}:batchRunReports`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
        redirect: "error",
        signal: AbortSignal.timeout(GA4_TIMEOUT_MS),
      },
    );
    if (!response.ok) throw new Error("rejected");
    const data = (await response.json()) as { reports?: Ga4Report[] };
    if (!Array.isArray(data.reports)) throw new Error("malformed");
    return data.reports;
  } catch {
    throw new Error("ga4_report_failed");
  }
}
