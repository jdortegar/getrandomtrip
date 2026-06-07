import "dotenv/config";
import React from "react";
import { sendMail } from "../src/lib/helpers/sendMail";
import NewsletterGoLive from "../src/emails/NewsletterGoLive";
import XsedCampaign from "../src/emails/XsedCampaign";
import ExperienceApproved, { subjects as approvedSubjects } from "../src/emails/ExperienceApproved";
import ExperienceRejected, { subjects as rejectedSubjects } from "../src/emails/ExperienceRejected";

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
