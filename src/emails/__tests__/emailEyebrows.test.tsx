import { render } from "@react-email/components";
import * as React from "react";
import { describe, expect, it } from "vitest";
import AdminNewBooking from "../AdminNewBooking";
import AdminTripContactMessage from "../AdminTripContactMessage";
import BlogApproved from "../BlogApproved";
import BlogCopyApproved from "../BlogCopyApproved";
import BlogCopyRejected from "../BlogCopyRejected";
import BlogPendingTripperReview from "../BlogPendingTripperReview";
import BlogRejected from "../BlogRejected";
import BlogSubmitted from "../BlogSubmitted";
import BookingConfirmed from "../BookingConfirmed";
import ContactFormSubmission from "../ContactFormSubmission";
import DestinationAssignmentReminder from "../DestinationAssignmentReminder";
import DestinationRevealed from "../DestinationRevealed";
import ExperienceApproved from "../ExperienceApproved";
import ExperienceCopyApproved from "../ExperienceCopyApproved";
import ExperienceCopyRejected from "../ExperienceCopyRejected";
import ExperiencePendingTripperReview from "../ExperiencePendingTripperReview";
import ExperienceRejected from "../ExperienceRejected";
import ExperienceSubmitted from "../ExperienceSubmitted";
import PasswordReset from "../PasswordReset";
import PaymentFailed from "../PaymentFailed";
import ReviewApprovedForTripper from "../ReviewApprovedForTripper";
import TopUpDue from "../TopUpDue";
import TravelerDetailsReminder from "../TravelerDetailsReminder";
import TravelerInvite from "../TravelerInvite";
import TravelerReminder from "../TravelerReminder";
import TripCancelled from "../TripCancelled";
import TripCompleted from "../TripCompleted";
import TripStartVouchers from "../TripStartVouchers";
import TripperInvite from "../TripperInvite";
import VerifyEmail from "../VerifyEmail";
import WelcomeEmail from "../WelcomeEmail";
import XsedDropNotification from "../XsedDropNotification";

type Locale = "es" | "en";

const url = "https://getrandomtrip.com/x";
const start = new Date("2026-12-12T12:00:00Z");
const end = new Date("2026-12-15T12:00:00Z");

/** Every template that renders an eyebrow, in each copy variant. */
const emails: Record<string, (locale: Locale) => React.ReactElement> = {
  AdminNewBooking: () => (
    <AdminNewBooking amount={890} clientEmail="a@b.co" clientName="Ana" currency="usd" level="Explora" nights={3} originCity="Córdoba" originCountry="AR" tripRequestId="t1" tripType="couple" />
  ),
  AdminTripContactMessage: (locale) => <AdminTripContactMessage body="Hola" locale={locale} subject="Hola" />,
  BlogApproved: (locale) => <BlogApproved blogId="b1" blogTitle="Salta" locale={locale} tripper="Ana" />,
  BlogCopyApproved: (locale) => <BlogCopyApproved adminName="Sofi" blogTitle="Salta" locale={locale} tripperName="Ana" />,
  BlogCopyRejected: (locale) => <BlogCopyRejected adminName="Sofi" blogTitle="Salta" locale={locale} tripperName="Ana" />,
  BlogPendingTripperReview: (locale) => <BlogPendingTripperReview changedFields={["title"]} blogTitle="Salta" locale={locale} reviewUrl={url} tripperName="Ana" />,
  BlogRejected: (locale) => <BlogRejected blogId="b1" blogTitle="Salta" locale={locale} reviewNote="Nota" tripper="Ana" />,
  BlogSubmitted: () => <BlogSubmitted blogId="b1" blogTitle="Salta" tripperName="Ana" />,
  BookingConfirmed: (locale) => <BookingConfirmed client="Ana" locale={locale} nights={3} tripRequestId="t1" tripType="couple" />,
  ContactFormSubmission: (locale) => <ContactFormSubmission email="a@b.co" interest="Grupo" locale={locale} message="Hola" name="Ana" />,
  DestinationAssignmentReminder: (locale) => <DestinationAssignmentReminder adminName="Sofi" clientName="Ana" locale={locale} milestoneHours={24} revealAt="2026-12-10 12:00 UTC" tripId="t1" />,
  DestinationRevealed: (locale) => <DestinationRevealed client="Ana" destination="Salta" locale={locale} tripId="t1" />,
  ExperienceApproved: (locale) => <ExperienceApproved experienceId="e1" experienceTitle="Valles" locale={locale} tripper="Ana" />,
  ExperienceCopyApproved: (locale) => <ExperienceCopyApproved adminName="Sofi" experienceTitle="Valles" locale={locale} tripperName="Ana" />,
  ExperienceCopyRejected: (locale) => <ExperienceCopyRejected adminName="Sofi" experienceTitle="Valles" locale={locale} tripperName="Ana" />,
  ExperiencePendingTripperReview: (locale) => <ExperiencePendingTripperReview changedFields={["title"]} experienceTitle="Valles" locale={locale} reviewUrl={url} tripperName="Ana" />,
  ExperienceRejected: (locale) => <ExperienceRejected experienceId="e1" experienceTitle="Valles" locale={locale} reviewNote="Nota" tripper="Ana" />,
  ExperienceSubmitted: () => <ExperienceSubmitted experienceId="e1" experienceTitle="Valles" tripperName="Ana" />,
  PasswordReset: (locale) => <PasswordReset locale={locale} name="Ana" resetUrl={url} />,
  PaymentFailed: (locale) => <PaymentFailed client="Ana" locale={locale} tripRequestId="t1" />,
  ReviewApprovedForTripper: (locale) => <ReviewApprovedForTripper dashboardUrl={url} excerpt="Genial" locale={locale} rating={5} tripperName="Ana" />,
  TopUpDue: (locale) => <TopUpDue amount="USD 45" dashboardUrl={url} deadline="30 oct" isOrganizer locale={locale} travelers={3} />,
  "TopUpDue (reminder)": (locale) => <TopUpDue amount="USD 45" dashboardUrl={url} deadline="30 oct" isOrganizer={false} locale={locale} reminder travelers={3} />,
  "TopUpDue (remainder)": (locale) => <TopUpDue amount="USD 45" dashboardUrl={url} deadline={null} isOrganizer locale={locale} remainder travelers={3} />,
  TravelerDetailsReminder: (locale) => <TravelerDetailsReminder dashboardUrl={url} locale={locale} />,
  "TravelerDetailsReminder (manual)": (locale) => <TravelerDetailsReminder dashboardUrl={url} locale={locale} variant="MANUAL" />,
  TravelerInvite: (locale) => <TravelerInvite buyerFirstName="Lucía" endDate={end} inviteUrl={url} locale={locale} startDate={start} tripType="group" />,
  TravelerReminder: (locale) => <TravelerReminder buyerFirstName="Lucía" endDate={end} inviteUrl={url} locale={locale} startDate={start} tripType="group" />,
  TripCancelled: (locale) => <TripCancelled client="Ana" locale={locale} tripRequestId="t1" />,
  TripCompleted: (locale) => <TripCompleted client="Ana" locale={locale} reviewToken="r1" />,
  TripStartVouchers: (locale) => <TripStartVouchers client="Ana" documents={[]} endDate={end} locale={locale} nights={3} pax={2} skippedCount={0} startDate={start} tripId="t1" tripType="couple" />,
  "TripperInvite (tripper)": (locale) => <TripperInvite inviteUrl={url} kind="TRIPPER" locale={locale} />,
  "TripperInvite (site access)": (locale) => <TripperInvite inviteUrl={url} kind="SITE_ACCESS" locale={locale} />,
  VerifyEmail: (locale) => <VerifyEmail locale={locale} name="Ana" verifyUrl={url} />,
  WelcomeEmail: (locale) => <WelcomeEmail locale={locale} name="Ana" />,
  XsedDropNotification: (locale) => <XsedDropNotification locale={locale} />,
};

// Words that may repeat without the eyebrow echoing the heading.
const STOPWORDS = new Set([
  "a", "al", "de", "del", "el", "en", "la", "las", "los", "mi", "mis", "para", "su", "sus", "te", "tu", "tus", "un", "una",
  "an", "and", "for", "is", "my", "of", "the", "to", "your",
]);

function text(html: string): string {
  return html
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Lowercase, accent-free stems, so "revisión" and "revisar" collide. */
function stems(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word))
      .map((word) => word.slice(0, 5)),
  );
}

async function eyebrowAndHeading(element: React.ReactElement) {
  const html = await render(element);
  const match = html.match(/<p[^>]*>([^<]*)<\/p>\s*<h1[^>]*>([\s\S]*?)<\/h1>/);
  expect(match, "eyebrow paragraph right before the <h1>").not.toBeNull();
  return { eyebrow: text(match![1]), heading: text(match![2]) };
}

describe("email eyebrows add context instead of repeating the heading", () => {
  const cases = Object.entries(emails).flatMap(([name, build]) =>
    (["es", "en"] as const).map((locale) => ({ name, locale, build })),
  );

  it.each(cases)("$name ($locale)", async ({ build, locale }) => {
    const { eyebrow, heading } = await eyebrowAndHeading(build(locale));
    expect(eyebrow).not.toBe("");
    const shared = [...stems(eyebrow)].filter((stem) => stems(heading).has(stem));
    expect(shared, `"${eyebrow}" repeats "${heading}"`).toEqual([]);
  });
});
