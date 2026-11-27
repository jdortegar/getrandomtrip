import EmailButton from "./components/EmailButton";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

interface TravelerDetailsReminderProps {
  dashboardUrl: string;
  locale: "en" | "es";
  variant?: "AUTOMATIC" | "MANUAL";
}

export default function TravelerDetailsReminder({
  dashboardUrl,
  locale,
  variant = "AUTOMATIC",
}: TravelerDetailsReminderProps) {
  const dictionary = locale === "en" ? en : es;
  const copy =
    variant === "MANUAL"
      ? dictionary.manualTravelerDetailsReminder
      : dictionary.travelerDetailsReminder;
  return (
    <EmailLayout locale={locale} preview={copy.preview}>
      <EmailHeading eyebrow={copy.eyebrow}>{copy.heading}</EmailHeading>
      <EmailText>{copy.body}</EmailText>
      <EmailText variant="note">{copy.fillEmpty}</EmailText>
      <EmailButton
        href={dashboardUrl}
        variant={variant === "AUTOMATIC" ? "xsed" : "primary"}
      >
        {copy.cta}
      </EmailButton>
    </EmailLayout>
  );
}
