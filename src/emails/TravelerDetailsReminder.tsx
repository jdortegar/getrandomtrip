import { Button, Heading, Text } from "@react-email/components";
import EmailLayout from "./components/EmailLayout";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

interface TravelerDetailsReminderProps {
  dashboardUrl: string;
  locale: "en" | "es";
}

export default function TravelerDetailsReminder({
  dashboardUrl,
  locale,
}: TravelerDetailsReminderProps) {
  const copy = (locale === "en" ? en : es).travelerDetailsReminder;
  return (
    <EmailLayout locale={locale} preview={copy.preview}>
      <Heading>{copy.heading}</Heading>
      <Text>{copy.body}</Text>
      <Text>{copy.fillEmpty}</Text>
      <Button
        href={dashboardUrl}
        style={{
          backgroundColor: "#facc15",
          color: "#1f2937",
          padding: "16px 32px",
          borderRadius: "2px",
        }}
      >
        {copy.cta}
      </Button>
    </EmailLayout>
  );
}
