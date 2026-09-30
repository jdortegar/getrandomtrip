import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  assignmentReminderCopy,
  formatAssignmentReminderText,
} from "@/lib/email/assignmentReminderCopy";
import EmailLayout from "./components/EmailLayout";

interface DestinationAssignmentReminderProps {
  adminName: string;
  clientName: string;
  tripId: string;
  revealAt: string;
  milestoneHours: 24 | 48 | 72;
  locale: "es" | "en";
}

export default function DestinationAssignmentReminder({
  adminName,
  clientName,
  tripId,
  revealAt,
  milestoneHours,
  locale,
}: DestinationAssignmentReminderProps) {
  const copy = assignmentReminderCopy(locale);
  const urgency = formatAssignmentReminderText(copy.urgency, {
    hours: milestoneHours,
    deadline: revealAt,
  });
  return (
    <EmailLayout locale={locale} preview={copy.preview}>
      <Heading style={heading_style}>{copy.heading}</Heading>
      <Text style={bodyText}>
        {formatAssignmentReminderText(copy.body, { admin: adminName })}
      </Text>
      <Section style={summaryPanel}>
        <Text style={summaryRow}>
          <span style={summaryLabel}>{copy.tripIdLabel}</span>{" "}
          <span style={summaryValue}>{tripId}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>{copy.clientLabel}</span>{" "}
          <span style={summaryValue}>{clientName}</span>
        </Text>
        <Text style={summaryRow}>
          <span style={summaryLabel}>{copy.deadlineLabel}</span>{" "}
          <span style={summaryValue}>{revealAt}</span>
        </Text>
      </Section>
      <Text style={milestoneHours === 24 ? urgencyTextEscalated : urgencyText}>
        {urgency}
      </Text>
      <Button
        href={`https://getrandomtrip.com/${locale}/dashboard/admin/trip-requests/${encodeURIComponent(tripId)}`}
        style={ctaButton}
      >
        {copy.cta}
      </Button>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const heading_style: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', Arial, sans-serif",
  fontSize: "38px",
  fontWeight: "800",
  color: "#383838", // Ink (brand text)
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
  color: "#383838", // Ink (brand text)
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
  backgroundColor: "#E5A51C", // Ochre (brand feature/CTA)
  color: "#ffffff",
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
