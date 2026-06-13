import "dotenv/config";
import React from "react";
import { sendMail } from "../src/lib/helpers/sendMail";
import NewsletterGoLive from "../src/emails/NewsletterGoLive";
import XsedCampaign from "../src/emails/XsedCampaign";
import ExperienceApproved, { subjects as approvedSubjects } from "../src/emails/ExperienceApproved";
import ExperienceRejected, { subjects as rejectedSubjects } from "../src/emails/ExperienceRejected";
import BookingConfirmed, { subjects as bookingConfirmedSubjects } from "../src/emails/BookingConfirmed";
import PaymentFailed, { subjects as paymentFailedSubjects } from "../src/emails/PaymentFailed";
import DestinationRevealed, { subjects as destinationRevealedSubjects } from "../src/emails/DestinationRevealed";
import TripCancelled, { subjects as tripCancelledSubjects } from "../src/emails/TripCancelled";
import TripCompleted, { subjects as tripCompletedSubjects } from "../src/emails/TripCompleted";
import ExperienceSubmitted, { subjects as experienceSubmittedSubjects } from "../src/emails/ExperienceSubmitted";
import WelcomeEmail, { subjects as welcomeEmailSubjects } from "../src/emails/WelcomeEmail";
import AdminNewBooking, { subject as adminNewBookingSubject } from "../src/emails/AdminNewBooking";

const templates: Record<string, { element: React.ReactElement; subject: string }> = {
  NewsletterGoLive: {
    element: React.createElement(NewsletterGoLive),
    subject: "Tu próxima aventura te espera — GetRandomTrip",
  },
  XsedCampaign: {
    element: React.createElement(XsedCampaign),
    subject: "Tu próximo XSED te está esperando — GetRandomTrip",
  },
  ExperienceApproved: {
    element: React.createElement(ExperienceApproved, {
      tripper: "David",
      experienceTitle: "Aventura en Patagonia",
      locale: "es",
    }),
    subject: approvedSubjects.es,
  },
  ExperienceRejected: {
    element: React.createElement(ExperienceRejected, {
      tripper: "David",
      experienceTitle: "Aventura en Patagonia",
      reviewNote: "Falta información sobre el alojamiento y las actividades incluidas. Por favor completá esas secciones antes de volver a enviar.",
      locale: "es",
    }),
    subject: rejectedSubjects.es,
  },
  BookingConfirmed: {
    element: React.createElement(BookingConfirmed, {
      client: "María García",
      tripRequestId: "trip-test-001",
      tripType: "Aventura",
      nights: 7,
      departureDate: "15 de julio de 2026",
      locale: "es",
    }),
    subject: bookingConfirmedSubjects.es,
  },
  PaymentFailed: {
    element: React.createElement(PaymentFailed, {
      client: "María García",
      tripRequestId: "trip-test-001",
      failureReason: "Fondos insuficientes en la tarjeta de crédito.",
      locale: "es",
    }),
    subject: paymentFailedSubjects.es,
  },
  DestinationRevealed: {
    element: React.createElement(DestinationRevealed, {
      client: "María García",
      destination: "Cartagena, Colombia",
      departureDate: "15 de julio de 2026",
      returnDate: "22 de julio de 2026",
      locale: "es",
    }),
    subject: destinationRevealedSubjects.es,
  },
  TripCancelled: {
    element: React.createElement(TripCancelled, {
      client: "María García",
      tripRequestId: "trip-test-001",
      locale: "es",
    }),
    subject: tripCancelledSubjects.es,
  },
  TripCompleted: {
    element: React.createElement(TripCompleted, {
      client: "María García",
      locale: "es",
    }),
    subject: tripCompletedSubjects.es,
  },
  ExperienceSubmitted: {
    element: React.createElement(ExperienceSubmitted, {
      tripperName: "David Ortega",
      experienceTitle: "Aventura en la Patagonia Argentina",
      experienceId: "exp-test-001",
    }),
    subject: experienceSubmittedSubjects.es,
  },
  AdminNewBooking: {
    element: React.createElement(AdminNewBooking, {
      clientName: "David Ortega",
      clientEmail: "jd.ortega83@gmail.com",
      tripRequestId: "trip-test-001",
      tripType: "xsed",
      level: "Aventurero",
      nights: 1,
      originCity: "Buenos Aires",
      originCountry: "Argentina",
      departureDate: "21 de junio de 2026",
      amount: 150,
      currency: "usd",
    }),
    subject: adminNewBookingSubject,
  },
  WelcomeEmail: {
    element: React.createElement(WelcomeEmail, {
      name: "María García",
      locale: "es",
    }),
    subject: welcomeEmailSubjects.es,
  },
};

const templateName = process.argv[2];
const to = process.argv[3] ?? "jd.ortega83@gmail.com";

async function main() {
  if (!templateName) {
    console.log("Available templates:");
    Object.keys(templates).forEach((name) => console.log(`  ${name}`));
    console.log(
      "\nUsage: npx tsx scripts/send-test-email.ts <TemplateName> [to@email.com]"
    );
    process.exit(1);
  }

  const template = templates[templateName];
  if (!template) {
    console.error(`Unknown template: "${templateName}"`);
    console.log("Available:", Object.keys(templates).join(", "));
    process.exit(1);
  }

  console.log(`Sending ${templateName} to ${to}...`);
  const data = await sendMail({
    to,
    subject: template.subject,
    content: {
      react: template.element,
    },
  });
  console.log("Sent:", data);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
