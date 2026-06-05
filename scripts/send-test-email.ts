import "dotenv/config";
import React from "react";
import { sendMail } from "../src/lib/helpers/sendMail";
import NewsletterGoLive from "../src/emails/NewsletterGoLive";
import XsedCampaign from "../src/emails/XsedCampaign";

const templates: Record<string, { component: React.ComponentType; subject: string }> = {
  NewsletterGoLive: {
    component: NewsletterGoLive,
    subject: "Tu próxima aventura te espera — GetRandomTrip",
  },
  XsedCampaign: {
    component: XsedCampaign,
    subject: "Tu próximo XSED te está esperando — GetRandomTrip",
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
      react: React.createElement(template.component),
    },
  });
  console.log("Sent:", data);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
