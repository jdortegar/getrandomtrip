/**
 * One-time backfill: bakes a 16:9 hero crop for every existing tripper who
 * has a stored hero focal point (`heroImagePositionX/Y`), derived from that
 * focal point at zoom level 1 — so nobody sees a visual regression on
 * rollout day without re-editing (proposal Decision #6).
 *
 * Two phases, both non-destructive:
 *   A. Copy `heroImage` -> `heroImageOriginal` for every tripper missing it
 *      (pure copy, idempotent, zero risk).
 *   B. Per tripper with a retained original: read the blob, derive the
 *      16:9 crop from their focal point, bake it, store it as a NEW blob,
 *      then point `heroImage` at the new key. The original blob and
 *      `heroImageOriginal` are never deleted or overwritten — `heroImage`
 *      only ever moves forward to a new key, so rollback is always
 *      `heroImage = heroImageOriginal` (see `--revert` below).
 *
 * Dry-run is the DEFAULT for phase B — the script prints a per-tripper
 * table (slug, source WxH, computed rect, output dims, target key) and
 * writes nothing unless invoked with `--commit`. Forgetting the flag must
 * never silently rewrite every tripper.
 *
 * Run: npm run db:backfill-tripper-hero-crop [-- --commit] [-- --revert]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getStore } from "@netlify/blobs";
import {
  coverCropFromFocalPoint,
  type NormalizedCrop,
} from "../src/lib/images/crop";
import { bakeCrop } from "../src/lib/images/bake";

const HERO_ASPECT = 16 / 9;
const HERO_OUTPUT_DIMS = { width: 1920, height: 1080 };
const DEFAULT_STORE = "user-media";

// Mirrors src/app/api/upload/route.ts's FEATURE_STORE map — "tripper-hero"
// isn't in it, so this already resolves to DEFAULT_STORE today. Kept
// explicit (and the fallback below kept in place) so this script stays
// correct if that map ever gains a "tripper-hero" entry.
const FEATURE_STORE: Record<string, string> = {
  avatar: "user-avatars",
  blog: "blog-media",
  experience: "experience-media",
};

function resolveStoreFeature(feature?: string): string | undefined {
  if (!feature) return feature;
  return feature.endsWith("-original")
    ? feature.slice(0, -"-original".length)
    : feature;
}

function defaultGetBlobStore(feature?: string) {
  const storeName =
    (feature && FEATURE_STORE[resolveStoreFeature(feature) ?? feature]) ??
    DEFAULT_STORE;
  return getStore(storeName, {
    consistency: "strong",
    ...(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? {
          siteID: process.env.NETLIFY_SITE_ID,
          token: process.env.NETLIFY_AUTH_TOKEN,
        }
      : {}),
  });
}

/**
 * Reads a blob by key, falling back to the legacy `user-media` store when
 * the feature-scoped store misses — replicates the same fallback the
 * `GET`/`[...path]` upload handlers already have. Trippers whose `heroImage`
 * predates the feature-store split live there; without this, Phase B would
 * silently skip those rows.
 */
export async function readOriginalBlobWithFallback(
  key: string,
  getBlobStore: (feature?: string) => {
    get: (key: string, opts?: { type: "arrayBuffer" }) => Promise<unknown>;
  } = defaultGetBlobStore,
): Promise<Buffer | null> {
  const feature = key.split("/")[1];
  const primary = getBlobStore(feature);
  let data = await primary.get(key, { type: "arrayBuffer" });

  if (!data && feature !== DEFAULT_STORE) {
    const fallback = getBlobStore(undefined);
    data = await fallback.get(key, { type: "arrayBuffer" });
  }

  return data ? Buffer.from(data as ArrayBuffer) : null;
}

async function defaultWriteBlob(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const store = defaultGetBlobStore("tripper-hero");
  await store.set(key, new Uint8Array(buffer).buffer, {
    metadata: { contentType },
  });
}

async function defaultGetImageDimensions(
  buffer: Buffer,
): Promise<{ width: number; height: number }> {
  const sharp = (await import("sharp")).default;
  const meta = await sharp(buffer).rotate().metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

// ── Phase A ──────────────────────────────────────────────────────────────

type PhaseAClient = {
  user: {
    findMany: (args: {
      where: Record<string, unknown>;
      select: Record<string, boolean>;
    }) => Promise<Array<{ id: string; heroImage: string | null }>>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
};

export async function runPhaseA(
  client: PhaseAClient,
): Promise<{ count: number }> {
  const rows = await client.user.findMany({
    where: { heroImage: { not: null }, heroImageOriginal: null },
    select: { id: true, heroImage: true },
  });

  for (const row of rows) {
    await client.user.update({
      where: { id: row.id },
      data: { heroImageOriginal: row.heroImage },
    });
  }

  console.log(
    `[backfill-tripper-hero-crop] phase A: copied heroImage -> heroImageOriginal for ${rows.length} tripper(s)`,
  );

  return { count: rows.length };
}

// ── Phase B ──────────────────────────────────────────────────────────────

interface HeroCropRow {
  id: string;
  tripperSlug: string | null;
  heroImage: string | null;
  heroImageOriginal: string | null;
  heroImagePositionX: number | null;
  heroImagePositionY: number | null;
}

type PhaseBClient = {
  user: {
    findMany: (args: {
      where: Record<string, unknown>;
      select: Record<string, boolean>;
    }) => Promise<HeroCropRow[]>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
};

export interface PhaseBDeps {
  bake: (
    buffer: Buffer,
    crop: NormalizedCrop,
    outputDims: { width: number; height: number },
  ) => Promise<Buffer>;
  getImageDimensions: (
    buffer: Buffer,
  ) => Promise<{ width: number; height: number }>;
  readBlob: (key: string) => Promise<Buffer | null>;
  writeBlob: (key: string, buffer: Buffer, contentType: string) => Promise<void>;
}

export interface PhaseBRow {
  crop: NormalizedCrop;
  outputDims: { width: number; height: number };
  slug: string;
  sourceHeight: number;
  sourceWidth: number;
  targetKey: string;
}

const defaultPhaseBDeps: PhaseBDeps = {
  bake: bakeCrop,
  getImageDimensions: defaultGetImageDimensions,
  readBlob: (key) => readOriginalBlobWithFallback(key),
  writeBlob: defaultWriteBlob,
};

export async function runPhaseB(
  client: PhaseBClient,
  options: { commit: boolean },
  deps: PhaseBDeps = defaultPhaseBDeps,
): Promise<{ committed: boolean; rows: PhaseBRow[] }> {
  const trippers = await client.user.findMany({
    where: { heroImageOriginal: { not: null } },
    select: {
      id: true,
      tripperSlug: true,
      heroImage: true,
      heroImageOriginal: true,
      heroImagePositionX: true,
      heroImagePositionY: true,
    },
  });

  const rows: PhaseBRow[] = [];

  for (const tripper of trippers) {
    const originalUrl = tripper.heroImageOriginal;
    if (!originalUrl) continue;
    const key = originalUrl.replace(/^\/api\/upload\//, "");

    const buffer = await deps.readBlob(key);
    if (!buffer) {
      console.warn(
        `[backfill-tripper-hero-crop] skipping ${tripper.tripperSlug ?? tripper.id}: original blob not found (${key})`,
      );
      continue;
    }

    const { width, height } = await deps.getImageDimensions(buffer);
    const crop = coverCropFromFocalPoint(
      width,
      height,
      HERO_ASPECT,
      tripper.heroImagePositionX ?? 50,
      tripper.heroImagePositionY ?? 50,
    );
    const targetKey = `${tripper.id}/tripper-hero/backfill-${Date.now()}.webp`;

    rows.push({
      crop,
      outputDims: HERO_OUTPUT_DIMS,
      slug: tripper.tripperSlug ?? tripper.id,
      sourceHeight: height,
      sourceWidth: width,
      targetKey,
    });

    if (options.commit) {
      const baked = await deps.bake(buffer, crop, HERO_OUTPUT_DIMS);
      await deps.writeBlob(targetKey, baked, "image/webp");
      await client.user.update({
        where: { id: tripper.id },
        data: { heroImage: `/api/upload/${targetKey}` },
      });
    }
  }

  console.table(
    rows.map((r) => ({
      slug: r.slug,
      source: `${r.sourceWidth}x${r.sourceHeight}`,
      crop: JSON.stringify(r.crop),
      output: `${r.outputDims.width}x${r.outputDims.height}`,
      targetKey: r.targetKey,
    })),
  );
  console.log(
    options.commit
      ? `[backfill-tripper-hero-crop] phase B: committed ${rows.length} baked hero crop(s)`
      : `[backfill-tripper-hero-crop] phase B: DRY RUN — ${rows.length} tripper(s) would be backfilled. Re-run with --commit to write.`,
  );

  return { committed: options.commit, rows };
}

// ── Revert ───────────────────────────────────────────────────────────────

type RevertClient = {
  $executeRawUnsafe: (query: string) => Promise<number>;
};

export async function runRevert(client: RevertClient): Promise<{ count: number }> {
  const count = await client.$executeRawUnsafe(
    `UPDATE "users" SET "heroImage" = "heroImageOriginal" WHERE "heroImageOriginal" IS NOT NULL`,
  );
  console.log(`[backfill-tripper-hero-crop] revert: restored heroImage for ${count} tripper(s)`);
  return { count };
}

// ── CLI entrypoint ───────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString
  ? new PrismaPg({ connectionString })
  : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ["error"] } : { log: ["error"] }) as object,
);

const isMainModule =
  process.argv[1]?.endsWith("backfill-tripper-hero-crop.ts") ?? false;

if (isMainModule) {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const revert = args.includes("--revert");

  (async () => {
    if (revert) {
      await runRevert(prisma as unknown as RevertClient);
      return;
    }
    await runPhaseA(prisma as unknown as PhaseAClient);
    await runPhaseB(prisma as unknown as PhaseBClient, { commit });
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
