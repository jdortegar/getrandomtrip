/*
  Warnings:

  - The `role` column on the `users` table will be migrated from TEXT to UserRole enum
  - A unique constraint covering the columns `[tripperSlug]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'TRIPPER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('CUSTOMER', 'TRIPPER', 'ADMIN');

-- AlterTable: Add new columns to trips
ALTER TABLE "trips" ADD COLUMN     "description" TEXT,
ADD COLUMN     "heroImage" TEXT,
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "ownerType" "OwnerType" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "teaser" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable: Add tripper-specific columns to users
ALTER TABLE "users" ADD COLUMN     "availableTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "commission" DOUBLE PRECISION,
ADD COLUMN     "tripperSlug" TEXT;

-- Migrate role column safely (preserve data)
-- Step 1: Add temporary new role column with enum type
ALTER TABLE "users" ADD COLUMN "role_new" "UserRole" NOT NULL DEFAULT 'CLIENT';

-- Step 2: Migrate existing values
UPDATE "users" SET "role_new" = 
  CASE 
    WHEN "role" = 'client' THEN 'CLIENT'::"UserRole"
    WHEN "role" = 'tripper' THEN 'TRIPPER'::"UserRole"
    WHEN "role" = 'admin' THEN 'ADMIN'::"UserRole"
    ELSE 'CLIENT'::"UserRole"
  END;

-- Step 3: Drop old column
ALTER TABLE "users" DROP COLUMN "role";

-- Step 4: Rename new column to role
ALTER TABLE "users" RENAME COLUMN "role_new" TO "role";

-- CreateTable: trip_likes
CREATE TABLE "trip_likes" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_likes_tripId_userId_key" ON "trip_likes"("tripId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_tripperSlug_key" ON "users"("tripperSlug");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_likes" ADD CONSTRAINT "trip_likes_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_likes" ADD CONSTRAINT "trip_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
