import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface TopUpDueProps {
  dashboardUrl: string;
  locale: "es" | "en";
  /** Pre-formatted, e.g. "USD 17.50". */
  amount: string;
  /** Pre-formatted pay-by time in the trip's time zone. */
  deadline: string;
  /** Headcount after the deadline. */
  travelers: number;
  /** The organizer covers anyone's unpaid difference. */
  isOrganizer: boolean;
  /** Last reminder before the grace period ends. */
  reminder?: boolean;
}

const copy = {
  es: {
    heading: "Tu grupo cambió",
    reminderHeading: "Último aviso: falta pagar la diferencia",
    body: (travelers: number) =>
      `Al cerrar el plazo viajan ${travelers} ${travelers === 1 ? "persona" : "personas"}, así que los extras compartidos se repartieron de nuevo.`,
    amountLabel: "Falta pagar",
    deadline: (deadline: string) => `Paga la diferencia antes del ${deadline} desde tu panel.`,
    organizerNote: "Si alguien no paga su diferencia a tiempo, la cubres tú.",
    cta: "PAGAR LA DIFERENCIA",
  },
  en: {
    heading: "Your group changed",
    reminderHeading: "Last reminder: a difference is left to pay",
    body: (travelers: number) =>
      `When the deadline closed, ${travelers} ${travelers === 1 ? "person is" : "people are"} traveling, so shared extras were split again.`,
    amountLabel: "Left to pay",
    deadline: (deadline: string) => `Pay the difference before ${deadline} from your dashboard.`,
    organizerNote: "If someone doesn't pay their difference in time, you cover it.",
    cta: "PAY THE DIFFERENCE",
  },
};

export function getSubject(locale: "es" | "en", amount: string, reminder = false): string {
  if (reminder) {
    return locale === "en"
      ? `Last reminder: ${amount} left to pay`
      : `Último aviso: falta pagar ${amount}`;
  }
  return locale === "en"
    ? `Your group changed: ${amount} left to pay`
    : `Tu grupo cambió: falta pagar ${amount}`;
}

export default function TopUpDue({
  dashboardUrl,
  locale,
  amount,
  deadline,
  travelers,
  isOrganizer,
  reminder = false,
}: TopUpDueProps) {
  const c = copy[locale];
  return (
    <EmailLayout locale={locale} preview={c.body(travelers)}>
      <Heading style={heading}>{reminder ? c.reminderHeading : c.heading}</Heading>
      <Text style={bodyText}>{c.body(travelers)}</Text>
      <Text style={detailText}>
        <strong>{c.amountLabel}:</strong> {amount}
      </Text>
      <Text style={bodyText}>{c.deadline(deadline)}</Text>
      {isOrganizer && <Text style={subtextStyle}>{c.organizerNote}</Text>}
      <Button href={dashboardUrl} style={ctaButton}>
        {c.cta}
      </Button>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "42px",
  fontWeight: "800",
  color: "#383838", // Ink
  margin: "0 0 24px",
  lineHeight: "1",
  textTransform: "uppercase",
};

const bodyText: React.CSSProperties = {
  color: "#383838", // Ink
  fontSize: "14px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto 16px",
  lineHeight: "1.7",
  maxWidth: "440px",
  textAlign: "center",
};

const detailText: React.CSSProperties = {
  ...bodyText,
  margin: "0 auto 8px",
};

const subtextStyle: React.CSSProperties = {
  color: "#383838", // Ink
  fontSize: "13px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto 32px",
  lineHeight: "1.6",
  maxWidth: "400px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#E5A51C", // Ochre (brand feature/CTA)
  color: "#383838", // Ink
  fontFamily: "'Barlow', Arial, sans-serif",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "1.5px",
  lineHeight: "24px",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "16px 40px",
  borderRadius: "2px",
  display: "inline-block",
};
