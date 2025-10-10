-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'SAVED', 'PENDING_PAYMENT', 'CONFIRMED', 'REVEALED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "travelerType" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dislikes" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "from" TEXT,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "nights" INTEGER NOT NULL DEFAULT 1,
    "pax" INTEGER NOT NULL DEFAULT 1,
    "transport" TEXT NOT NULL DEFAULT 'avion',
    "climate" TEXT NOT NULL DEFAULT 'indistinto',
    "maxTravelTime" TEXT NOT NULL DEFAULT 'sin-limite',
    "departPref" TEXT NOT NULL DEFAULT 'indistinto',
    "arrivePref" TEXT NOT NULL DEFAULT 'indistinto',
    "avoidDestinations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "addons" JSONB,
    "basePriceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "displayPrice" TEXT NOT NULL DEFAULT '',
    "filtersCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "addonsCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPerPaxUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTripUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualDestination" TEXT,
    "destinationRevealedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "customerRating" INTEGER,
    "customerFeedback" TEXT,
    "tripPhotos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "providerPreferenceId" TEXT,
    "providerSessionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tripType" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "payments_tripId_key" ON "payments"("tripId");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
