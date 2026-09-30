// @vitest-environment node
import { expect, it } from "vitest";
import { deploymentBuildEnvironment } from "../deployment.cjs";

it("preserves production identity without replacing its auth URLs", () => {
  expect(
    deploymentBuildEnvironment({
      RT_DEPLOY_ENV: "production",
      NEXTAUTH_URL: "https://getrandomtrip.com",
    }),
  ).toEqual({
    NEXT_PUBLIC_RT_DEPLOY_ENV: "production",
    NEXT_PUBLIC_RT_PUBLIC_ORIGIN: "",
    NEXT_PUBLIC_RT_SITE_NAME: "",
  });
});
it.each(["deploy-preview-12--getrandomtrip-1", "develop--getrandomtrip-1"])(
  "bakes the actual %s origin, not inherited production URL",
  (host) => {
    expect(
      deploymentBuildEnvironment({
        RT_DEPLOY_ENV: "nonproduction",
        SITE_NAME: "getrandomtrip-1",
        CONTEXT: "branch-deploy",
        DEPLOY_PRIME_URL: `https://${host}.netlify.app`,
        URL: "https://getrandomtrip.com",
      }).NEXT_PUBLIC_RT_PUBLIC_ORIGIN,
    ).toBe(`https://${host}.netlify.app`);
  },
);
it.each([
  undefined,
  "https://getrandomtrip.com",
  "https://evil.example",
  "http://develop--site.netlify.app",
  "https://user:secret@develop--site.netlify.app",
  "https://develop--site.netlify.app/path",
  "https://develop--site.netlify.app?query=1",
])("rejects unsafe hosted origin %s", (origin) => {
  expect(() =>
    deploymentBuildEnvironment({
      NETLIFY: "true",
      SITE_NAME: "site",
      DEPLOY_PRIME_URL: origin,
    }),
  ).toThrow();
});
it("does not use the production Netlify alias", () => {
  expect(() =>
    deploymentBuildEnvironment({
      NETLIFY: "true",
      SITE_NAME: "site",
      DEPLOY_PRIME_URL: "https://site.netlify.app",
      URL: "https://site.netlify.app",
    }),
  ).toThrow();
});
it("uses localhost only outside Netlify", () => {
  expect(deploymentBuildEnvironment({}).NEXT_PUBLIC_RT_PUBLIC_ORIGIN).toBe(
    "http://localhost:3010",
  );
});
