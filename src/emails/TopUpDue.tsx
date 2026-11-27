import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";

interface TopUpDueProps {
  dashboardUrl: string;
  locale: "es" | "en";
  /** Pre-formatted, e.g. "USD 17.50". */
  amount: string;
  /** Pre-formatted pay-by time in the trip's time zone; null for the organizer's remainder. */
  deadline: string | null;
  /** Headcount after the deadline. */
  travelers: number;
  /** The organizer covers anyone's unpaid difference. */
  isOrganizer: boolean;
  /** Last reminder before the grace period ends. */
  reminder?: boolean;
  /** The organizer's remainder: everyone's unpaid differences, due before the reveal. */
  remainder?: boolean;
}

const copy = {
  es: {
    eyebrow: "Tu viaje",
    heading: "Tu grupo cambió",
    reminderHeading: "Último aviso: falta pagar la diferencia",
    body: (travelers: number) =>
      `Al cerrar el plazo viajan ${travelers} ${travelers === 1 ? "persona" : "personas"}, así que los extras compartidos se repartieron de nuevo.`,
    amountLabel: "Falta pagar",
    deadline: (deadline: string) => `Paga la diferencia antes del ${deadline} desde tu panel.`,
    organizerNote: "Si alguien no paga su diferencia a tiempo, la cubres tú.",
    cta: "Pagar la diferencia",
    remainderHeading: "Cubre la diferencia del grupo",
    remainderBody: "Algunas personas no pagaron su diferencia a tiempo. Como organizador, la cubres tú.",
    remainderAction: "Paga desde tu panel para que podamos revelar el destino.",
  },
  en: {
    eyebrow: "Your trip",
    heading: "Your group changed",
    reminderHeading: "Last reminder: a difference is left to pay",
    body: (travelers: number) =>
      `When the deadline closed, ${travelers} ${travelers === 1 ? "person is" : "people are"} traveling, so shared extras were split again.`,
    amountLabel: "Left to pay",
    deadline: (deadline: string) => `Pay the difference before ${deadline} from your dashboard.`,
    organizerNote: "If someone doesn't pay their difference in time, you cover it.",
    cta: "Pay the difference",
    remainderHeading: "Cover your group's difference",
    remainderBody: "Some people didn't pay their difference in time. As the organizer, you cover it.",
    remainderAction: "Pay from your dashboard so we can reveal the destination.",
  },
};

export function getSubject(
  locale: "es" | "en",
  amount: string,
  reminder = false,
  remainder = false,
): string {
  if (remainder) {
    return locale === "en"
      ? `Cover your group's difference: ${amount}`
      : `Cubre la diferencia del grupo: ${amount}`;
  }
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
  remainder = false,
}: TopUpDueProps) {
  const c = copy[locale];
  if (remainder) {
    return (
      <EmailLayout locale={locale} preview={c.remainderBody}>
        <EmailHeading eyebrow={c.eyebrow}>{c.remainderHeading}</EmailHeading>
        <EmailText>{c.remainderBody}</EmailText>
        <EmailDetailList items={[{ label: c.amountLabel, value: amount }]} />
        <EmailText>{c.remainderAction}</EmailText>
        <EmailButton href={dashboardUrl}>{c.cta}</EmailButton>
      </EmailLayout>
    );
  }

  return (
    <EmailLayout locale={locale} preview={c.body(travelers)}>
      <EmailHeading eyebrow={c.eyebrow}>
        {reminder ? c.reminderHeading : c.heading}
      </EmailHeading>
      <EmailText>{c.body(travelers)}</EmailText>
      <EmailDetailList items={[{ label: c.amountLabel, value: amount }]} />
      {deadline && <EmailText>{c.deadline(deadline)}</EmailText>}
      {isOrganizer && <EmailText variant="note">{c.organizerNote}</EmailText>}
      <EmailButton href={dashboardUrl}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}
