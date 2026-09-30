import { isProductionDeployment } from "./deployment";

/** Reject inherited/default production connections before constructing a client. */
export function getDatabaseConnectionString(): string | undefined {
  const connectionString = process.env.DATABASE_URL;
  if (isProductionDeployment()) return connectionString;
  try {
    const expectedHost = process.env.RT_NONPRODUCTION_DATABASE_HOST;
    const url = new URL(connectionString ?? "");
    // pg-connection-string gives decoded query parameters precedence over the
    // URL authority (including repeated/encoded `host` and Unix socket hosts).
    // Keep target selection exclusively in the authority checked below.
    const overridesTarget = [...url.searchParams.keys()].some((key) =>
      /^(host|hostaddr|port|socket|connectionstring)$/i.test(key),
    );
    if (
      !expectedHost ||
      overridesTarget ||
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      url.hostname !== expectedHost
    ) {
      throw new Error("invalid");
    }
    return connectionString;
  } catch {
    // Never include the supplied connection string or credentials in this error.
    throw new Error(
      "Nonproduction database is not configured for the approved host",
    );
  }
}
