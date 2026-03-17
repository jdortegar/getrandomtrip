-- AlterTable: Add accommodationType to trip_requests
ALTER TABLE "trip_requests" ADD COLUMN IF NOT EXISTS "accommodationType" TEXT NOT NULL DEFAULT 'indistinto';
