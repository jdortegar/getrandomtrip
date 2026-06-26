import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout from "./components/EmailLayout";

interface AdminNewBookingProps {
  clientName: string;
  clientEmail: string;
  tripRequestId: string;
  tripType: string;
  nights: number;
  originCity: string;
  originCountry: string;
  level: string;
  departureDate?: string;
  amount: number;
  currency: string;
}

const BASE_URL = "https://getrandomtrip.com";

export const subject = "Nueva reserva confirmada";

export default function AdminNewBooking({
  clientName,
  clientEmail,
  tripRequestId,
  tripType,
  nights,
  originCity,
  originCountry,
  level,
  departureDate,
  amount,
  currency,
}: AdminNewBookingProps) {
  const ctaHref = `${BASE_URL}/es/admin/trip-requests`;

  return (
    <EmailLayout locale="es" preview={`Nueva reserva de ${clientName} — ${tripType.toUpperCase()}`}>
      <Heading style={heading}>Nueva reserva</Heading>
      <Text style={bodyText}>
        Se acaba de confirmar una nueva reserva. Revisá los detalles a continuación.
      </Text>

      <Section style={summaryPanel}>
        <Text style={summaryRow}>
          <span style={summaryLabel}>Cliente:</span>{" "}
          <span style={summaryValue}>{clientName}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>Email:</span>{" "}
          <span style={summaryValue}>{clientEmail}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>Tipo de viaje:</span>{" "}
          <span style={summaryValue}>{tripType.toUpperCase()}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>Nivel:</span>{" "}
          <span style={summaryValue}>{level}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>Noches:</span>{" "}
          <span style={summaryValue}>{nights}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>Origen:</span>{" "}
          <span style={summaryValue}>{originCity}, {originCountry}</span>
        </Text>
        {departureDate && (
          <Text style={summaryRow}>
            <span style={summaryLabel}>Fecha de salida:</span>{" "}
            <span style={summaryValue}>{departureDate}</span>
          </Text>
        )}
        <Text style={divider} />
        <Text style={summaryRow}>
          <span style={summaryLabel}>Total pagado:</span>{" "}
          <span style={amountValue}>{currency.toUpperCase()} {amount}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>ID reserva:</span>{" "}
          <span style={summaryValue}>{tripRequestId}</span>
        </Text>
      </Section>

      <Button href={ctaHref} style={ctaButton}>
        VER EN ADMIN
      </Button>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "42px",
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

const amountValue: React.CSSProperties = {
  fontWeight: "700",
  color: "#111827",
  fontSize: "15px",
};

const divider: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  margin: "12px 0",
  padding: "0",
  height: "0",
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
