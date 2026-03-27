-- AlterTable
ALTER TABLE "trip_requests" ADD COLUMN IF NOT EXISTS "paxDetails" JSONB;
