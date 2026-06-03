import { render } from "@react-email/components";
import React from "react";
import fs from "fs";
import path from "path";
import NewsletterGoLive from "../src/emails/NewsletterGoLive";

async function main() {
  const html = await render(React.createElement(NewsletterGoLive), {
    pretty: true,
  });

  const outPath = path.join(process.cwd(), "scripts", "email-preview.html");
  fs.writeFileSync(outPath, html, "utf-8");
  console.log(`Preview written to: ${outPath}`);
}

main().catch(console.error);
