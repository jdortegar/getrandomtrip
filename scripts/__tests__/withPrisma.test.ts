// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { client, constructClient, constructAdapter, loadEnvironment } =
  vi.hoisted(() => {
    const client = { $disconnect: vi.fn() };
    return {
      client,
      constructClient: vi.fn(function () {
        return client;
      }),
      constructAdapter: vi.fn(function () {
        return { name: "mock adapter" };
      }),
      loadEnvironment: vi.fn(),
    };
  });
vi.mock("@prisma/client", () => ({ PrismaClient: constructClient }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: constructAdapter }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("DATABASE_URL", undefined);
  client.$disconnect.mockResolvedValue(undefined);
  loadEnvironment.mockImplementation(() => {
    process.env.DATABASE_URL = "postgresql://mock.invalid/test";
  });
  vi.doMock("dotenv/config", () => {
    loadEnvironment();
    return {};
  });
});
afterEach(() => vi.unstubAllEnvs());

it("loads environment only when invoked and awaits disconnect before returning", async () => {
  const { withPrisma } = await import("../lib/withPrisma");
  expect(loadEnvironment).not.toHaveBeenCalled();
  expect(constructClient).not.toHaveBeenCalled();
  let finishDisconnect!: () => void;
  client.$disconnect.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finishDisconnect = resolve;
      }),
  );
  const run = vi.fn().mockResolvedValue("result");
  const complete = vi.fn();
  const pending = withPrisma(run).then(complete);
  await vi.waitFor(() => expect(client.$disconnect).toHaveBeenCalledOnce());
  expect(complete).not.toHaveBeenCalled();
  expect(loadEnvironment).toHaveBeenCalledOnce();
  expect(constructAdapter).toHaveBeenCalledWith({
    connectionString: "postgresql://mock.invalid/test",
  });
  expect(constructClient).toHaveBeenCalledWith({
    adapter: { name: "mock adapter" },
    log: ["error"],
  });
  expect(run).toHaveBeenCalledWith(client);
  finishDisconnect();
  await pending;
  expect(complete).toHaveBeenCalledWith("result");
});

it("disconnects and preserves a callback failure", async () => {
  const { withPrisma } = await import("../lib/withPrisma");
  const failure = new Error("backfill failed");
  await expect(withPrisma(vi.fn().mockRejectedValue(failure))).rejects.toBe(
    failure,
  );
  expect(client.$disconnect).toHaveBeenCalledOnce();
});

it("rejects missing database configuration before creating clients or running work", async () => {
  loadEnvironment.mockImplementation(() => undefined);
  const { withPrisma } = await import("../lib/withPrisma");
  const run = vi.fn();
  await expect(withPrisma(run)).rejects.toThrow("DATABASE_URL is required");
  expect(constructAdapter).not.toHaveBeenCalled();
  expect(constructClient).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
});
