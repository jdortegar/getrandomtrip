/** Shared build/runtime validation; no request Host or production URL fallback. */
function parseNonproductionOrigin(value, siteName = "") {
  try {
    const url = new URL(value || "invalid");
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    if (!siteName)
      return url.origin === "http://localhost:3010" ? url.origin : null;
    if (!/^[a-z0-9-]+$/.test(siteName) || url.protocol !== "https:" || url.port)
      return null;
    const suffix = `--${siteName}.netlify.app`;
    if (!url.hostname.endsWith(suffix)) return null;
    const alias = url.hostname.slice(0, -suffix.length);
    return alias === "develop" ||
      /^deploy-preview-\d+$/.test(alias) ||
      /^[a-f0-9]{24}$/.test(alias)
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

/** Only nonsecret, immutable deployment metadata may enter Next's env bundle. */
function deploymentBuildEnvironment(env) {
  const production = env.RT_DEPLOY_ENV === "production";
  let origin = "";
  let siteName = "";
  if (!production) {
    const hosted = Boolean(
      env.NETLIFY || env.CONTEXT || env.DEPLOY_PRIME_URL || env.DEPLOY_URL,
    );
    if (hosted) {
      siteName = env.SITE_NAME || "";
      origin =
        siteName &&
        parseNonproductionOrigin(
          env.DEPLOY_PRIME_URL || env.DEPLOY_URL,
          siteName,
        );
      if (!origin)
        throw new Error(
          "Nonproduction requires this site's develop or preview origin",
        );
    } else {
      origin = "http://localhost:3010";
    }
  }
  return {
    NEXT_PUBLIC_RT_DEPLOY_ENV: production ? "production" : "nonproduction",
    NEXT_PUBLIC_RT_PUBLIC_ORIGIN: origin,
    NEXT_PUBLIC_RT_SITE_NAME: siteName,
  };
}
module.exports = { deploymentBuildEnvironment, parseNonproductionOrigin };
