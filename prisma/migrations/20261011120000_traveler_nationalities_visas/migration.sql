-- Additive only. Apply through the deployment database workflow before shipping code.
-- Nationalities and visas are ISO 3166-1 alpha-2 codes. users.nationalities is the
-- profile prefill; trip_requests.buyer* and trip_travelers.* are per-trip snapshots.
ALTER TABLE "users"
  ADD COLUMN "nationalities" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "trip_requests"
  ADD COLUMN "buyerNationalities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "buyerVisas" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "trip_travelers"
  ADD COLUMN "nationalities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "visas" TEXT[] DEFAULT ARRAY[]::TEXT[];
