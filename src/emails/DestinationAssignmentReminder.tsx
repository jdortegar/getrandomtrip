import { getApplicationOrigin } from "@/lib/deployment";
import { Text } from "@react-email/components";
import * as React from "react";
import {
  assignmentReminderCopy,
  formatAssignmentReminderText,
} from "@/lib/email/assignmentReminderCopy";
import EmailButton from "./components/EmailButton";
import EmailDetailList from "./components/EmailDetailList";
import EmailHeading from "./components/EmailHeading";
import EmailLayout from "./components/EmailLayout";
import EmailText from "./components/EmailText";
import { emailColors, emailFonts } from "./components/tokens";

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
      <EmailHeading eyebrow={copy.eyebrow}>{copy.heading}</EmailHeading>
      <EmailText>
        {formatAssignmentReminderText(copy.body, { admin: adminName })}
      </EmailText>
      <EmailDetailList
        items={[
          { label: copy.tripIdLabel, value: tripId },
          { label: copy.clientLabel, value: clientName },
          { label: copy.deadlineLabel, value: revealAt },
        ]}
      />
      <Text style={milestoneHours === 24 ? urgencyEscalated : urgencyStyle}>
        {urgency}
      </Text>
      <EmailButton
        href={`${getApplicationOrigin()}/${locale}/dashboard/admin/trip-requests/${encodeURIComponent(tripId)}`}
      >
        {copy.cta}
      </EmailButton>
    </EmailLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const urgencyStyle: React.CSSProperties = {
  color: emailColors.ink,
  fontFamily: emailFonts.body,
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

// Last milestone before the reveal: red, matching the `danger` badge text.
const urgencyEscalated: React.CSSProperties = {
  ...urgencyStyle,
  color: "#991B1B",
};
