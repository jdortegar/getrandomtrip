// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { parse } from "pg-connection-string";
import { getDatabaseConnectionString } from "../databaseEnvironment";
const { pool, client } = vi.hoisted(() => ({ pool: vi.fn(), client: vi.fn() }));
vi.mock("pg", () => ({
  Pool: class {
    constructor() {
      pool();
    }
  },
}));
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      client();
    }
  },
}));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: class {} }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});
it.each([undefined, "nonproduction", "unknown"])(
  "refuses mismatched DB before constructing clients for %s",
  async (mode) => {
    vi.stubEnv("RT_DEPLOY_ENV", mode);
    vi.stubEnv("RT_NONPRODUCTION_DATABASE_HOST", "approved.db.test");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://fixture:private@different.db.test/db",
    );
    await expect(import("../prisma")).rejects.toThrow("approved host");
    expect(pool).not.toHaveBeenCalled();
    expect(client).not.toHaveBeenCalled();
  },
);
it.each([
  undefined,
  "",
  "postgresql://fixture@other.db.test/db",
  "https://approved.db.test/db",
])("rejects unavailable or invalid connection %s", (connection) => {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  vi.stubEnv("RT_NONPRODUCTION_DATABASE_HOST", "approved.db.test");
  vi.stubEnv("DATABASE_URL", connection);
  expect(getDatabaseConnectionString).toThrow("approved host");
});
it("requires the explicit host allowlist and never exposes supplied credentials", () => {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  vi.stubEnv("RT_NONPRODUCTION_DATABASE_HOST", undefined);
  vi.stubEnv(
    "DATABASE_URL",
    "postgresql://fixture:private@approved.db.test/db",
  );
  expect(getDatabaseConnectionString).toThrow(
    /^Nonproduction database is not configured for the approved host$/,
  );
});
it("accepts only the configured nonproduction host without connecting", () => {
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  vi.stubEnv("RT_NONPRODUCTION_DATABASE_HOST", "approved.db.test");
  const connection = "postgresql://fixture@approved.db.test/db?sslmode=require";
  vi.stubEnv("DATABASE_URL", connection);
  expect(getDatabaseConnectionString()).toBe(connection);
  expect(pool).not.toHaveBeenCalled();
  expect(client).not.toHaveBeenCalled();
});
it("leaves production connection semantics unchanged", () => {
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.stubEnv("RT_NONPRODUCTION_DATABASE_HOST", "different.db.test");
  vi.stubEnv("DATABASE_URL", "existing-production-connection");
  expect(getDatabaseConnectionString()).toBe("existing-production-connection");
});

it.each([
  ["host=other.db.test", "host", "other.db.test"],
  ["host=approved.db.test&host=other.db.test", "host", "other.db.test"],
  ["%68ost=other.db.test", "host", "other.db.test"],
  ["host=%2Ftmp%2Fsocket", "host", "/tmp/socket"],
  ["hostaddr=127.0.0.1", "hostaddr", "127.0.0.1"],
  ["socket=%2Ftmp%2Fsocket", "socket", "/tmp/socket"],
  ["port=6543", "port", "6543"],
])(
  "rejects driver target parameters before client construction: %s",
  async (query, field, target) => {
    const connection = `postgresql://fixture@approved.db.test/db?${query}`;
    // Use the installed driver's real parser: query parameters override/persist
    // independently of the authority that WHATWG URL.hostname reports.
    expect(new URL(connection).hostname).toBe("approved.db.test");
    expect(parse(connection)[field]).toBe(target);
    vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
    vi.stubEnv("RT_NONPRODUCTION_DATABASE_HOST", "approved.db.test");
    vi.stubEnv("DATABASE_URL", connection);
    await expect(import("../prisma")).rejects.toThrow("approved host");
    expect(pool).not.toHaveBeenCalled();
    expect(client).not.toHaveBeenCalled();
  },
);
it("leaves production DSN parser behavior unchanged", () => {
  const connection =
    "postgresql://fixture@configured.db.test/db?host=selected.db.test";
  vi.stubEnv("RT_DEPLOY_ENV", "production");
  vi.stubEnv("DATABASE_URL", connection);
  expect(getDatabaseConnectionString()).toBe(connection);
  expect(parse(connection).host).toBe("selected.db.test");
});
