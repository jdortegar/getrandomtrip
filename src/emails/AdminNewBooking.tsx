import { getApplicationOrigin } from "@/lib/deployment";
import { Link } from "@react-email/components";
import * as React from "react";
import EmailButton from "./components/EmailButton";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";
import { emailColors } from "./components/tokens";

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
  const ctaHref = `${getApplicationOrigin()}/es/dashboard/admin/trip-requests/${encodeURIComponent(tripRequestId)}`;

  return (
    <EmailLayout
      locale="es"
      preview={`Nueva reserva de ${clientName} — ${tripType.toUpperCase()}`}
    >
      <EmailHeading eyebrow="Panel admin">Nueva reserva</EmailHeading>
      <EmailText>
        Se acaba de confirmar una nueva reserva. Revisá los detalles a
        continuación.
      </EmailText>
      <EmailDetailList
        items={[
          { label: "Cliente", value: clientName },
          {
            label: "Email",
            value: (
              <Link href={`mailto:${clientEmail}`} style={emailLink}>
                {clientEmail}
              </Link>
            ),
          },
          { label: "Tipo de viaje", value: tripType.toUpperCase() },
          { label: "Nivel", value: level },
          { label: "Noches", value: nights },
          { label: "Origen", value: `${originCity}, ${originCountry}` },
          ...(departureDate
            ? [{ label: "Fecha de salida", value: departureDate }]
            : []),
          { label: "Total pagado", value: `${currency.toUpperCase()} ${amount}` },
          { label: "ID reserva", value: tripRequestId },
        ]}
      />
      <EmailButton href={ctaHref}>Ver en admin</EmailButton>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const emailLink: React.CSSProperties = {
  color: emailColors.primary,
  textDecoration: "underline",
};
