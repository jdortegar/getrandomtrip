import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface DestinationAssignmentReminderProps {
  adminName: string;
  clientName: string;
  tripId: string;
  startDate: string;
  locale: "es" | "en";
  escalated?: boolean;
}

const BASE_URL = "https://getrandomtrip.com";

const copy = {
  es: {
    preview: (clientName: string) =>
      `Acción requerida: asignar destino para el viaje de ${clientName}`,
    escalatedPreview: (clientName: string) =>
      `URGENTE: asignar destino para el viaje de ${clientName} — sale en menos de 48 horas`,
    heading: "Asignación de destino pendiente",
    escalatedHeading: "URGENTE: destino sin asignar",
    body: (adminName: string) =>
      `Hola ${adminName}, hay un viaje que requiere asignación de experiencia antes de la fecha de salida.`,
    tripIdLabel: "ID de reserva:",
    clientLabel: "Cliente:",
    startDateLabel: "Fecha de salida:",
    urgency:
      "Este viaje parte en menos de 72 horas. Por favor, asigná una experiencia lo antes posible.",
    escalatedUrgency:
      "Este viaje parte en menos de 48 horas y AÚN no tiene experiencia asignada. Asigná una experiencia ahora.",
    cta: "IR AL PANEL ADMIN",
  },
  en: {
    preview: (clientName: string) =>
      `Action required: assign destination for ${clientName}'s trip`,
    escalatedPreview: (clientName: string) =>
      `URGENT: assign destination for ${clientName}'s trip — departs in less than 48 hours`,
    heading: "Destination assignment pending",
    escalatedHeading: "URGENT: destination not assigned",
    body: (adminName: string) =>
      `Hi ${adminName}, there is a trip that requires an experience assignment before the departure date.`,
    tripIdLabel: "Booking ID:",
    clientLabel: "Client:",
    startDateLabel: "Departure date:",
    urgency:
      "This trip departs in less than 72 hours. Please assign an experience as soon as possible.",
    escalatedUrgency:
      "This trip departs in less than 48 hours and STILL has no experience assigned. Assign an experience now.",
    cta: "GO TO ADMIN PANEL",
  },
};

export const subjects = {
  es: "Acción requerida: asignar destino antes de la salida",
  en: "Action required: assign destination before departure",
};

export const escalatedSubjects = {
  es: "URGENTE: asignar destino — sale en menos de 48 horas",
  en: "URGENT: assign destination — departs in less than 48 hours",
};

export default function DestinationAssignmentReminder({
  adminName,
  clientName,
  tripId,
  startDate,
  locale,
  escalated = false,
}: DestinationAssignmentReminderProps) {
  const c = copy[locale];
  const ctaHref = `${BASE_URL}/${locale}/dashboard/admin`;
  const preview = escalated ? c.escalatedPreview(clientName) : c.preview(clientName);
  const heading = escalated ? c.escalatedHeading : c.heading;
  const urgency = escalated ? c.escalatedUrgency : c.urgency;

  return (
    <EmailLayout locale={locale} preview={preview}>
      <Heading style={heading_style}>{heading}</Heading>
      <Text style={bodyText}>{c.body(adminName)}</Text>

      <Section style={summaryPanel}>
        <Text style={summaryRow}>
          <span style={summaryLabel}>{c.tripIdLabel}</span>{" "}
          <span style={summaryValue}>{tripId}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>{c.clientLabel}</span>{" "}
          <span style={summaryValue}>{clientName}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>{c.startDateLabel}</span>{" "}
          <span style={summaryValue}>{startDate}</span>
        </Text>
      </Section>

      <Text style={escalated ? urgencyTextEscalated : urgencyText}>{urgency}</Text>

      <Button href={ctaHref} style={ctaButton}>
        {c.cta}
      </Button>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const heading_style: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "38px",
  fontWeight: "800",
  color: "#111827",
  margin: "0 0 24px",
  lineHeight: "1",
  textTransform: "uppercase",
};

const bodyText: React.CSSProperties = {
  color: "#5A5858",
  fontSize: "14px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "400",
  margin: "0 auto 24px",
  lineHeight: "1.7",
  maxWidth: "440px",
  textAlign: "center",
};

const summaryPanel: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px 32px",
  margin: "0 auto 24px",
  maxWidth: "400px",
  textAlign: "left",
};

const summaryRow: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#5A5858",
  fontFamily: "'Barlow', Arial, sans-serif",
};

const summaryLabel: React.CSSProperties = {
  fontWeight: "700",
  color: "#111827",
};

const summaryValue: React.CSSProperties = {
  fontWeight: "400",
};

const urgencyText: React.CSSProperties = {
  color: "#b45309",
  fontSize: "13px",
  fontFamily: "'Barlow', Arial, sans-serif",
  fontWeight: "600",
  margin: "0 auto 32px",
  lineHeight: "1.6",
  maxWidth: "400px",
  textAlign: "center",
};

const urgencyTextEscalated: React.CSSProperties = {
  ...urgencyText,
  color: "#b91c1c",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#facc15",
  color: "#1f2937",
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
