import { config } from "dotenv";
config({ path: ".env" });

import React from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { sendMail } from "../src/lib/helpers/sendMail";
import TripCompleted, { subjects } from "../src/emails/TripCompleted";
import crypto from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

const paymentIntentId = process.argv[2];
if (!paymentIntentId) {
  console.error("Usage: npx tsx scripts/send-review-email.ts <payment_intent_id>");
  process.exit(1);
}

async function main() {
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: paymentIntentId },
    include: {
      tripRequest: {
        include: { user: true },
      },
    },
  });

  if (!payment?.tripRequest) {
    console.error("No trip request found for payment:", paymentIntentId);
    process.exit(1);
  }

  const trip = payment.tripRequest;
  const user = trip.user;

  console.log(`Found trip: ${trip.id} (status: ${trip.status})`);
  console.log(`User: ${user.name} <${user.email}>`);

  // Generate or reuse existing token
  let reviewToken = trip.reviewToken;
  if (!reviewToken) {
    reviewToken = crypto.randomUUID();
    await prisma.tripRequest.update({
      where: { id: trip.id },
      data: { reviewToken },
    });
    console.log(`Generated new reviewToken: ${reviewToken}`);
  } else {
    console.log(`Reusing existing reviewToken: ${reviewToken}`);
  }

  const locale = (user.locale?.startsWith("en") ? "en" : "es") as "es" | "en";

  await sendMail({
    to: user.email!,
    subject: subjects[locale],
    content: {
      react: React.createElement(TripCompleted, {
        client: user.name ?? "",
        locale,
        reviewToken,
      }),
    },
  });

  console.log(`\n✓ Email sent to ${user.email}`);
  console.log(`  Review link: /review/${reviewToken}`);
}

main()
  .catch((err) => {
    console.error("Failed:", err.message);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
