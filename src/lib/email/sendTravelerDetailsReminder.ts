import { createElement } from "react";
import TravelerDetailsReminder from "@/emails/TravelerDetailsReminder";
import { sendMail } from "@/lib/helpers/sendMail";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

/** Await provider acceptance; errors must leave the job retryable. */
export async function sendTravelerDetailsReminder(
  params: {
    tripId: string;
    buyer: { email: string; locale: string | null };
  } & (
    | { variant?: "AUTOMATIC"; idempotencyKey?: never }
    | { variant: "MANUAL"; idempotencyKey: string }
  ),
): Promise<void> {
  const locale = params.buyer.locale === "en" ? "en" : "es";
  const dictionary = locale === "en" ? en : es;
  const copy =
    params.variant === "MANUAL"
      ? dictionary.manualTravelerDetailsReminder
      : dictionary.travelerDetailsReminder;
  const delivery = await sendMail({
    content: {
      react: createElement(TravelerDetailsReminder, {
        dashboardUrl: `https://getrandomtrip.com/${locale}/dashboard/trips/${encodeURIComponent(params.tripId)}`,
        locale,
        variant: params.variant,
      }),
    },
    idempotencyKey:
      params.variant === "MANUAL"
        ? params.idempotencyKey
        : `traveler-details-reminder/${params.tripId}`,
    subject: copy.subject,
    to: params.buyer.email,
  });
  if (!delivery?.id)
    throw new Error("Reminder provider did not confirm acceptance");
}
