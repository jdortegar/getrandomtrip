const TOKEN = /^[A-Za-z0-9_\-.]{20,}$/;

function readToken(value: string | undefined) {
  const token = (value ?? "").trim().replace(/^(["'])(.*)\1$/, "$2");
  return TOKEN.test(token) ? token : null;
}

/**
 * Page token for the Facebook Page linked to the Spanish account. Falls back to
 * the Instagram recap token. The username guard stops a token for another
 * account from announcing its posts.
 */
export function socialSourceConfig() {
  const token = readToken(
    process.env.SOCIAL_SOURCE_PAGE_TOKEN ||
      process.env.INSTAGRAM_PAGE_ACCESS_TOKEN,
  );
  return token ? { token, username: "getrandomtrip.es" } : null;
}

/**
 * Page token for the Facebook Page linked to @getrandomtrip.en, with
 * instagram_content_publish. Publishing also needs the explicit flag; the
 * username guard refuses a token for any other account.
 */
export function socialTargetConfig() {
  const token = readToken(process.env.SOCIAL_TARGET_PAGE_TOKEN);
  if (process.env.SLACK_SOCIAL_PUBLISH_ENABLED !== "true" || !token)
    return null;
  return { token, username: "getrandomtrip.en" };
}

/** Read-only own-account import; never requires or enables the publish flag. */
export function socialImportConfig() {
  const token = readToken(process.env.SOCIAL_TARGET_PAGE_TOKEN);
  return token ? { token, username: "getrandomtrip.en" } : null;
}
