-- Add tripper profile fields to User table
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "heroImage" TEXT;
ALTER TABLE "users" ADD COLUMN "location" TEXT;
ALTER TABLE "users" ADD COLUMN "tierLevel" TEXT;
ALTER TABLE "users" ADD COLUMN "destinations" TEXT[] DEFAULT ARRAY[]::TEXT[];
