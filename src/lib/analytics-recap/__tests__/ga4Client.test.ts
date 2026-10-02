// @vitest-environment node
import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  getGa4AccessToken,
  normalizePrivateKey,
  runGa4BatchReports,
} from "../ga4Client";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const config = {
  propertyId: "522571029",
  clientEmail: "svc@proj.iam.gserviceaccount.com",
  privateKey: pem,
};
const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });

it("normalizes escaped, quoted and padded private keys", () => {
  const escaped = pem.replace(/\n/g, "\\n");
  expect(normalizePrivateKey(`  "${escaped}"  `)).toBe(pem);
  expect(normalizePrivateKey(`'${escaped}'`)).toBe(pem);
  expect(normalizePrivateKey(pem)).toBe(pem);
});

it("exchanges a signed RS256 JWT for an access token", async () => {
  fetchMock.mockResolvedValue(json({ access_token: "tok" }));
  const token = await getGa4AccessToken(config, 1_700_000_000_000);
  expect(token).toBe("tok");
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://oauth2.googleapis.com/token");
  expect(init.method).toBe("POST");
  expect(init.redirect).toBe("error");
  expect(init.signal).toBeInstanceOf(AbortSignal);
  const form = new URLSearchParams(init.body as string);
  expect(form.get("grant_type")).toBe(
    "urn:ietf:params:oauth:grant-type:jwt-bearer",
  );
  const [h, c, s] = (form.get("assertion") as string).split(".");
  expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({
    alg: "RS256",
    typ: "JWT",
  });
  expect(JSON.parse(Buffer.from(c, "base64url").toString())).toEqual({
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: 1_700_000_000,
    exp: 1_700_000_300,
  });
  const verifier = createVerify("RSA-SHA256").update(`${h}.${c}`);
  expect(verifier.verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);
});

it("fails without leaking secrets when the token exchange is rejected", async () => {
  fetchMock.mockResolvedValue(
    json({ error: "invalid_grant", detail: pem }, 400),
  );
  const error = await getGa4AccessToken(config).catch((e: Error) => e);
  expect(error).toBeInstanceOf(Error);
  const message = (error as Error).message;
  expect(message).not.toContain("PRIVATE KEY");
  expect(message).not.toContain(config.clientEmail);
  expect(message).not.toContain("invalid_grant");
});

it("fails without leaking the key when the private key is invalid", async () => {
  const error = await getGa4AccessToken({
    ...config,
    privateKey: "not-a-key-SECRETVALUE",
  }).catch((e: Error) => e);
  expect((error as Error).message).not.toContain("SECRETVALUE");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("fails when the token response has no access token", async () => {
  fetchMock.mockResolvedValue(json({}));
  await expect(getGa4AccessToken(config)).rejects.toThrow("ga4_token_failed");
});

it("posts batchRunReports with the bearer token and returns reports", async () => {
  fetchMock.mockResolvedValue(json({ reports: [{ rows: [] }] }));
  const requests = [{ dimensions: [{ name: "country" }] }];
  const reports = await runGa4BatchReports(config, "tok", requests);
  expect(reports).toEqual([{ rows: [] }]);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe(
    "https://analyticsdata.googleapis.com/v1beta/properties/522571029:batchRunReports",
  );
  expect(init.headers.Authorization).toBe("Bearer tok");
  expect(init.redirect).toBe("error");
  expect(init.signal).toBeInstanceOf(AbortSignal);
  expect(JSON.parse(init.body)).toEqual({ requests });
});

it("throws a generic error on a non-2xx report response", async () => {
  fetchMock.mockResolvedValue(json({ error: { message: "tok-secret" } }, 403));
  const error = await runGa4BatchReports(config, "tok-secret", []).catch(
    (e: Error) => e,
  );
  expect((error as Error).message).toBe("ga4_report_failed");
});

it("throws when reports are missing from a 2xx response", async () => {
  fetchMock.mockResolvedValue(json({}));
  await expect(runGa4BatchReports(config, "tok", [])).rejects.toThrow(
    "ga4_report_failed",
  );
});
