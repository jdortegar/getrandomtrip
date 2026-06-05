import { render } from "@react-email/components";
import React from "react";
import fs from "fs";
import path from "path";
import NewsletterGoLive from "../src/emails/NewsletterGoLive";
import XsedCampaign from "../src/emails/XsedCampaign";

const templates: Record<string, React.ComponentType> = {
  NewsletterGoLive,
  XsedCampaign,
};

async function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.log("Available templates:");
    Object.keys(templates).forEach((name) => console.log(`  ${name}`));
    console.log("\nUsage: npx tsx scripts/preview-email.ts <TemplateName>");
    process.exit(1);
  }

  const Template = templates[arg];
  if (!Template) {
    console.error(`Unknown template: "${arg}"`);
    console.log("Available:", Object.keys(templates).join(", "));
    process.exit(1);
  }

  const html = await render(React.createElement(Template), { pretty: true });

  const outPath = path.join(process.cwd(), "scripts", "email-preview.html");
  fs.writeFileSync(outPath, html, "utf-8");
  console.log(`Preview written to: ${outPath}`);
}

main().catch(console.error);
