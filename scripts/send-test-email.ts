import "dotenv/config";
import React from "react";
import { sendMail } from "../src/lib/helpers/sendMail";
import NewsletterGoLive from "../src/emails/NewsletterGoLive";

const to = process.argv[2] ?? "jd.ortega83@gmail.com";
const appUrl = process.env.NEXTAUTH_URL ?? "https://getrandomtrip.netlify.app";

async function main() {
  console.log(`Sending newsletter test to ${to}...`);
  const data = await sendMail({
    to,
    subject: "Tu próxima aventura te espera — GetRandomTrip",
    content: {
      react: React.createElement(NewsletterGoLive, { appUrl }),
    },
  });
  console.log("Sent:", data);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
