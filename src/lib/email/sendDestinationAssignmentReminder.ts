import { render } from "@react-email/components";
import { createElement } from "react";
import DestinationAssignmentReminder from "@/emails/DestinationAssignmentReminder";
import {
  assignmentReminderCopy,
  formatAssignmentReminderText,
  formatRevealDeadline,
} from "@/lib/email/assignmentReminderCopy";
import { sendMail } from "@/lib/helpers/sendMail";
import type { AssignmentReminderWindow } from "@/lib/helpers/getAssignmentReminderWindow";

interface ReminderContent {
  tripId: string;
  clientName: string | null;
  window: AssignmentReminderWindow;
}

export async function buildAssignmentReminderEmail({
  tripId,
  clientName,
  recipient,
  window,
}: ReminderContent & {
  recipient: { email: string; name: string | null; locale: string | null };
}) {
  const locale = recipient.locale === "en" ? "en" : "es";
  const copy = assignmentReminderCopy(locale);
  return {
    fromAddress: process.env.EMAIL_FROM || "onboarding@resend.dev",
    recipientEmail: recipient.email,
    subject: formatAssignmentReminderText(copy.subject, {
      hours: window.milestoneHours,
    }),
    html: await render(
      createElement(DestinationAssignmentReminder, {
        adminName: recipient.name ?? "",
        clientName: clientName?.trim() || tripId,
        locale,
        milestoneHours: window.milestoneHours,
        revealAt: formatRevealDeadline(window.revealAt),
        tripId,
      }),
    ),
  };
}

export function getAssignmentReminderNotification({
  tripId,
  clientName,
  locale,
  window,
}: ReminderContent & { locale: string | null }) {
  const copy = assignmentReminderCopy(locale);
  return {
    title: formatAssignmentReminderText(copy.subject, {
      hours: window.milestoneHours,
    }),
    body: formatAssignmentReminderText(copy.notificationBody, {
      client: clientName?.trim() || tripId,
      hours: window.milestoneHours,
      deadline: formatRevealDeadline(window.revealAt),
    }),
  };
}

/** Retries use only this persisted snapshot, never current profile/config/copy. */
export async function sendDestinationAssignmentReminder(payload: {
  id: string;
  fromAddress: string;
  recipientEmail: string;
  subject: string;
  html: string;
}): Promise<string> {
  const delivery = await sendMail({
    from: payload.fromAddress,
    to: payload.recipientEmail,
    subject: payload.subject,
    content: { html: payload.html },
    idempotencyKey: `destination-assignment/${payload.id}`,
  });
  if (!delivery?.id)
    throw new Error("Reminder provider did not confirm acceptance");
  return delivery.id;
}
