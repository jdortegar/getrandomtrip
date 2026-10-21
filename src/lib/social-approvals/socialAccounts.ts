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
