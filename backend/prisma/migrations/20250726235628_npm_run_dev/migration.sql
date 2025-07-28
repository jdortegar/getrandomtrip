/*
  Warnings:

  - You are about to drop the column `addOns` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `addonsCost` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experienceLevel` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filtersCost` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originCity` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `travelType` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `travelerCount` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "travelType" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "travelerCount" INTEGER NOT NULL,
    "basePrice" REAL NOT NULL,
    "filtersCost" REAL NOT NULL,
    "addonsCost" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "premiumFilters" JSONB NOT NULL DEFAULT [],
    "selectedAddons" JSONB NOT NULL DEFAULT [],
    "mercadoPagoPreferenceId" TEXT,
    "revealEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "duration_nights" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("basePrice", "createdAt", "id", "revealEmailSent", "status", "totalPrice", "updatedAt", "userId") SELECT "basePrice", "createdAt", "id", "revealEmailSent", "status", "totalPrice", "updatedAt", "userId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
