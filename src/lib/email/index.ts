import type { AccessInviteKind } from "@prisma/client";
import AdminNewBooking, {
  subject as adminNewBookingSubject,
} from "@/emails/AdminNewBooking";
import AdminTripContactMessage from "@/emails/AdminTripContactMessage";
import ReviewApprovedForTripper, {
  subjects as reviewApprovedSubjects,
} from "@/emails/ReviewApprovedForTripper";
import DestinationAssignmentReminder, {
  subjects as destinationAssignmentReminderSubjects,
  escalatedSubjects as destinationAssignmentReminderEscalatedSubjects,
} from "@/emails/DestinationAssignmentReminder";
import ExperiencePendingTripperReview, {
  subjects as pendingTripperReviewSubjects,
} from "@/emails/ExperiencePendingTripperReview";
import ExperienceCopyApproved, {
  subjects as copyApprovedSubjects,
} from "@/emails/ExperienceCopyApproved";
import ExperienceCopyRejected, {
  subjects as copyRejectedSubjects,
} from "@/emails/ExperienceCopyRejected";
import BookingConfirmed, {
  subjects as bookingConfirmedSubjects,
} from "@/emails/BookingConfirmed";
import DestinationRevealed, {
  subjects as destinationRevealedSubjects,
} from "@/emails/DestinationRevealed";
import ExperienceSubmitted, {
  subjects as experienceSubmittedSubjects,
} from "@/emails/ExperienceSubmitted";
import BlogSubmitted, {
  subjects as blogSubmittedSubjects,
} from "@/emails/BlogSubmitted";
import BlogPendingTripperReview, {
  subjects as blogPendingTripperReviewSubjects,
} from "@/emails/BlogPendingTripperReview";
import BlogCopyApproved, {
  subjects as blogCopyApprovedSubjects,
} from "@/emails/BlogCopyApproved";
import BlogCopyRejected, {
  subjects as blogCopyRejectedSubjects,
} from "@/emails/BlogCopyRejected";
import PaymentFailed, {
  subjects as paymentFailedSubjects,
} from "@/emails/PaymentFailed";
import TripCancelled, {
  subjects as tripCancelledSubjects,
} from "@/emails/TripCancelled";
import TripCompleted, {
  subjects as tripCompletedSubjects,
} from "@/emails/TripCompleted";
import WelcomeEmail, {
  subjects as welcomeEmailSubjects,
} from "@/emails/WelcomeEmail";
import VerifyEmail, {
  subjects as verifyEmailSubjects,
} from "@/emails/VerifyEmail";
import PasswordReset, {
  subjects as passwordResetSubjects,
} from "@/emails/PasswordReset";
import TripperInvite, {
  subjects as tripperInviteSubjects,
} from "@/emails/TripperInvite";
import TravelerInvite, {
  subjects as travelerInviteSubjects,
} from "@/emails/TravelerInvite";
import TravelerReminder, {
  subjects as travelerReminderSubjects,
} from "@/emails/TravelerReminder";
import TripStartVouchers, {
  subjects as tripStartVouchersSubjects,
} from "@/emails/TripStartVouchers";
import { getLevelContent } from "@/lib/data/experience-levels";
import type { MailAttachment } from "@/lib/helpers/sendMail";
import { sendMail } from "@/lib/helpers/sendMail";
import { prisma } from "@/lib/prisma";
import { getTripDocumentStore } from "@/lib/storage/tripDocumentStore";
import { getStripe } from "@/lib/stripe";
import React from "react";

function resolveLocale(locale: string | null | undefined): "es" | "en" {
  return locale === "en" ? "en" : "es";
}

export function sendBookingConfirmed(
  tripRequestId: string,
  userId: string,
): void {
  void (async () => {
    try {
      const [user, tripRequest, payment] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, locale: true },
        }),
        prisma.tripRequest.findUnique({
          where: { id: tripRequestId },
          select: { type: true, nights: true, startDate: true },
        }),
        prisma.payment.findUnique({
          where: { tripRequestId },
          select: { stripePaymentIntentId: true },
        }),
      ]);

      if (!user?.email || !tripRequest) return;

      const locale = resolveLocale(user.locale);
      const departureDate = tripRequest.startDate
        ? tripRequest.startDate.toLocaleDateString(
            locale === "en" ? "en-US" : "es-AR",
            { year: "numeric", month: "long", day: "numeric" },
          )
        : undefined;

      let receiptUrl: string | null = null;
      if (payment?.stripePaymentIntentId) {
        try {
          const pi = await getStripe().paymentIntents.retrieve(
            payment.stripePaymentIntentId,
            { expand: ["latest_charge"] },
          );
          const charge = pi.latest_charge;
          if (charge && typeof charge === "object" && "receipt_url" in charge) {
            receiptUrl = (charge as { receipt_url: string | null }).receipt_url;
          }
        } catch (err) {
          console.error("[email] sendBookingConfirmed receiptUrl:", err);
        }
      }

      await sendMail({
        to: user.email,
        subject: bookingConfirmedSubjects[locale],
        content: {
          react: React.createElement(BookingConfirmed, {
            client: user.name ?? "",
            tripRequestId,
            tripType: tripRequest.type,
            nights: tripRequest.nights,
            departureDate,
            receiptUrl,
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendBookingConfirmed:", err);
    }
  })();
}

export function sendPaymentFailed(
  tripRequestId: string,
  userId: string,
): void {
  void (async () => {
    try {
      const [user, payment] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, locale: true },
        }),
        prisma.payment.findUnique({
          where: { tripRequestId },
          select: { failureReason: true },
        }),
      ]);

      if (!user?.email) return;

      const locale = resolveLocale(user.locale);

      await sendMail({
        to: user.email,
        subject: paymentFailedSubjects[locale],
        content: {
          react: React.createElement(PaymentFailed, {
            client: user.name ?? "",
            tripRequestId,
            failureReason: payment?.failureReason ?? undefined,
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendPaymentFailed:", err);
    }
  })();
}

export function sendDestinationRevealed(
  tripRequestId: string,
  userId: string,
): void {
  void (async () => {
    try {
      const [user, tripRequest] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, locale: true },
        }),
        prisma.tripRequest.findUnique({
          where: { id: tripRequestId },
          select: {
            actualDestination: true,
            startDate: true,
            endDate: true,
          },
        }),
      ]);

      if (!user?.email || !tripRequest?.actualDestination) return;

      const locale = resolveLocale(user.locale);
      const fmt = (d: Date | null | undefined) =>
        d
          ? d.toLocaleDateString(locale === "en" ? "en-US" : "es-AR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : undefined;

      await sendMail({
        to: user.email,
        subject: destinationRevealedSubjects[locale],
        content: {
          react: React.createElement(DestinationRevealed, {
            client: user.name ?? "",
            destination: tripRequest.actualDestination,
            departureDate: fmt(tripRequest.startDate),
            returnDate: fmt(tripRequest.endDate),
            locale,
            tripId: tripRequestId,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendDestinationRevealed:", err);
    }
  })();
}

export function sendTripCancelled(
  tripRequestId: string,
  userId: string,
): void {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, locale: true },
      });

      if (!user?.email) return;

      const locale = resolveLocale(user.locale);

      await sendMail({
        to: user.email,
        subject: tripCancelledSubjects[locale],
        content: {
          react: React.createElement(TripCancelled, {
            client: user.name ?? "",
            tripRequestId,
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendTripCancelled:", err);
    }
  })();
}

export function sendTripCompleted(
  _tripRequestId: string,
  userId: string,
  reviewToken: string,
): void {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, locale: true },
      });

      if (!user?.email) return;

      const locale = resolveLocale(user.locale);

      await sendMail({
        to: user.email,
        subject: tripCompletedSubjects[locale],
        content: {
          react: React.createElement(TripCompleted, {
            client: user.name ?? "",
            locale,
            reviewToken,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendTripCompleted:", err);
    }
  })();
}

export function sendExperienceSubmitted(
  experienceId: string,
  tripperId: string,
): void {
  void (async () => {
    try {
      const [experience, tripper] = await Promise.all([
        prisma.experience.findUnique({
          where: { id: experienceId },
          select: { title: true },
        }),
        prisma.user.findUnique({
          where: { id: tripperId },
          select: { name: true },
        }),
      ]);

      if (!experience?.title) return;

      const to =
        process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com";

      await sendMail({
        to,
        subject: experienceSubmittedSubjects.es,
        content: {
          react: React.createElement(ExperienceSubmitted, {
            tripperName: tripper?.name ?? "",
            experienceTitle: experience.title,
            experienceId,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendExperienceSubmitted:", err);
    }
  })();
}

export function sendAdminNewBooking(
  tripRequestId: string,
  userId: string,
): void {
  void (async () => {
    try {
      const [user, tripRequest, payment] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        }),
        prisma.tripRequest.findUnique({
          where: { id: tripRequestId },
          select: {
            type: true,
            level: true,
            nights: true,
            startDate: true,
            originCity: true,
            originCountry: true,
          },
        }),
        prisma.payment.findUnique({
          where: { tripRequestId },
          select: { amount: true, currency: true },
        }),
      ]);

      if (!user?.email || !tripRequest || !payment) return;

      const admins = await prisma.user.findMany({
        where: { roles: { has: "ADMIN" } },
        select: { email: true },
      });
      const adminEmails =
        admins.length > 0
          ? admins.map((a) => a.email)
          : [process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com"];
      const departureDate = tripRequest.startDate
        ? tripRequest.startDate.toLocaleDateString("es-AR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : undefined;

      await sendMail({
        to: adminEmails,
        subject: adminNewBookingSubject,
        content: {
          react: React.createElement(AdminNewBooking, {
            clientName: user.name ?? "",
            clientEmail: user.email,
            tripRequestId,
            tripType: tripRequest.type,
            level: getLevelContent(tripRequest.level, tripRequest.type, "es")?.name ?? tripRequest.level,
            nights: tripRequest.nights,
            originCity: tripRequest.originCity,
            originCountry: tripRequest.originCountry,
            departureDate,
            amount: payment.amount,
            currency: payment.currency,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendAdminNewBooking:", err);
    }
  })();
}

export function sendExperiencePendingTripperReview(
  experienceId: string,
  tripperId: string,
): void {
  void (async () => {
    try {
      const [experience, tripper] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.experience.findUnique as any)({
          where: { id: experienceId },
          select: { title: true, changedFields: true },
        }) as Promise<{ title: string; changedFields: string[] } | null>,
        prisma.user.findUnique({
          where: { id: tripperId },
          select: { email: true, name: true, locale: true },
        }),
      ]);

      if (!experience?.title || !tripper?.email) return;

      const locale = resolveLocale(tripper.locale);
      const BASE_URL = "https://getrandomtrip.com";
      const reviewUrl = `${BASE_URL}/${locale}/dashboard/tripper/experiences/${experienceId}/review-copy`;

      await sendMail({
        to: tripper.email,
        subject: pendingTripperReviewSubjects[locale],
        content: {
          react: React.createElement(ExperiencePendingTripperReview, {
            tripperName: tripper.name ?? "",
            experienceTitle: experience.title,
            changedFields: experience.changedFields ?? [],
            reviewUrl,
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendExperiencePendingTripperReview:", err);
    }
  })();
}

export function sendExperienceCopyApproved(
  experienceId: string,
  tripperId: string,
): void {
  void (async () => {
    try {
      const [experience, tripper] = await Promise.all([
        prisma.experience.findUnique({
          where: { id: experienceId },
          select: { title: true },
        }),
        prisma.user.findUnique({
          where: { id: tripperId },
          select: { name: true },
        }),
      ]);

      if (!experience?.title) return;

      const adminEmail = process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com";
      const adminName = process.env.ADMIN_NAME ?? "Admin";

      await sendMail({
        to: adminEmail,
        subject: copyApprovedSubjects.es,
        content: {
          react: React.createElement(ExperienceCopyApproved, {
            adminName,
            experienceTitle: (experience as { title: string }).title,
            tripperName: tripper?.name ?? "",
            locale: "es",
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendExperienceCopyApproved:", err);
    }
  })();
}

export function sendExperienceCopyRejected(
  experienceId: string,
  tripperId: string,
): void {
  void (async () => {
    try {
      const [experience, tripper] = await Promise.all([
        prisma.experience.findUnique({
          where: { id: experienceId },
          select: { title: true },
        }),
        prisma.user.findUnique({
          where: { id: tripperId },
          select: { name: true },
        }),
      ]);

      if (!experience?.title) return;

      const adminEmail = process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com";
      const adminName = process.env.ADMIN_NAME ?? "Admin";

      await sendMail({
        to: adminEmail,
        subject: copyRejectedSubjects.es,
        content: {
          react: React.createElement(ExperienceCopyRejected, {
            adminName,
            experienceTitle: (experience as { title: string }).title,
            tripperName: tripper?.name ?? "",
            locale: "es",
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendExperienceCopyRejected:", err);
    }
  })();
}

export function sendBlogSubmitted(blogId: string, tripperId: string): void {
  void (async () => {
    try {
      const [blog, tripper, admins] = await Promise.all([
        prisma.blogPost.findUnique({
          where: { id: blogId },
          select: { title: true },
        }),
        prisma.user.findUnique({
          where: { id: tripperId },
          select: { name: true },
        }),
        prisma.user.findMany({
          where: { roles: { has: "ADMIN" } },
          select: { email: true },
        }),
      ]);

      if (!blog?.title) return;

      const adminEmails = admins.map((a) => a.email);
      const to =
        adminEmails.length > 0
          ? adminEmails
          : [process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com"];

      const result = await sendMail({
        to,
        subject: blogSubmittedSubjects.es,
        content: {
          react: React.createElement(BlogSubmitted, {
            tripperName: tripper?.name ?? "",
            blogTitle: blog.title,
            blogId,
          }),
        },
      });
      console.log("[email] sendBlogSubmitted: sent to", to, "id:", result?.id);
    } catch (err) {
      console.error("[email] sendBlogSubmitted:", err);
    }
  })();
}

export function sendBlogPendingTripperReview(
  blogId: string,
  tripperId: string,
  changedFields: string[],
): void {
  void (async () => {
    try {
      const [blog, tripper] = await Promise.all([
        prisma.blogPost.findUnique({
          where: { id: blogId },
          select: { title: true },
        }),
        prisma.user.findUnique({
          where: { id: tripperId },
          select: { email: true, name: true, locale: true },
        }),
      ]);

      if (!blog?.title || !tripper?.email) return;

      const locale = resolveLocale(tripper.locale);
      const BASE_URL = "https://getrandomtrip.com";
      const reviewUrl = `${BASE_URL}/${locale}/dashboard/tripper/blog/${blogId}/review-copy`;

      await sendMail({
        to: tripper.email,
        subject: blogPendingTripperReviewSubjects[locale],
        content: {
          react: React.createElement(BlogPendingTripperReview, {
            tripperName: tripper.name ?? "",
            blogTitle: blog.title,
            changedFields,
            reviewUrl,
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendBlogPendingTripperReview:", err);
    }
  })();
}

export function sendBlogCopyApproved(blogId: string, tripperId: string): void {
  void (async () => {
    try {
      const [blog, tripper] = await Promise.all([
        prisma.blogPost.findUnique({
          where: { id: blogId },
          select: { title: true },
        }),
        prisma.user.findUnique({
          where: { id: tripperId },
          select: { name: true },
        }),
      ]);

      if (!blog?.title) return;

      const adminEmail = process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com";
      const adminName = process.env.ADMIN_NAME ?? "Admin";

      await sendMail({
        to: adminEmail,
        subject: blogCopyApprovedSubjects.es,
        content: {
          react: React.createElement(BlogCopyApproved, {
            adminName,
            blogTitle: blog.title,
            tripperName: tripper?.name ?? "",
            locale: "es",
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendBlogCopyApproved:", err);
    }
  })();
}

export function sendBlogCopyRejected(blogId: string, tripperId: string): void {
  void (async () => {
    try {
      const [blog, tripper] = await Promise.all([
        prisma.blogPost.findUnique({
          where: { id: blogId },
          select: { title: true },
        }),
        prisma.user.findUnique({
          where: { id: tripperId },
          select: { name: true },
        }),
      ]);

      if (!blog?.title) return;

      const adminEmail = process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com";
      const adminName = process.env.ADMIN_NAME ?? "Admin";

      await sendMail({
        to: adminEmail,
        subject: blogCopyRejectedSubjects.es,
        content: {
          react: React.createElement(BlogCopyRejected, {
            adminName,
            blogTitle: blog.title,
            tripperName: tripper?.name ?? "",
            locale: "es",
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendBlogCopyRejected:", err);
    }
  })();
}

export function sendDestinationAssignmentReminder(
  tripRequestId: string,
  escalated = false,
): void {
  void (async () => {
    try {
      const [tripRequest, admins] = await Promise.all([
        prisma.tripRequest.findUnique({
          where: { id: tripRequestId },
          select: {
            startDate: true,
            user: { select: { name: true } },
          },
        }),
        prisma.user.findMany({
          where: { roles: { has: "ADMIN" } },
          select: { email: true, name: true, locale: true },
        }),
      ]);

      if (!tripRequest) return;

      for (const admin of admins) {
        try {
          const locale = resolveLocale(admin.locale);
          const startDate = tripRequest.startDate
            ? tripRequest.startDate.toLocaleDateString(
                locale === "en" ? "en-US" : "es-AR",
                { year: "numeric", month: "long", day: "numeric" },
              )
            : "—";

          await sendMail({
            to: admin.email,
            subject: escalated
              ? destinationAssignmentReminderEscalatedSubjects[locale]
              : destinationAssignmentReminderSubjects[locale],
            content: {
              react: React.createElement(DestinationAssignmentReminder, {
                adminName: admin.name ?? "",
                clientName: tripRequest.user?.name ?? "",
                tripId: tripRequestId,
                startDate,
                locale,
                escalated,
              }),
            },
          });
        } catch (err) {
          console.error(
            `[email] sendDestinationAssignmentReminder admin=${admin.email}:`,
            err,
          );
        }
      }
    } catch (err) {
      console.error("[email] sendDestinationAssignmentReminder:", err);
    }
  })();
}

export function sendReviewApprovedForTripper(
  tripperId: string,
  reviewId: string,
): void {
  void (async () => {
    try {
      const [tripper, review] = await Promise.all([
        prisma.user.findUnique({
          where: { id: tripperId },
          select: { email: true, name: true, locale: true },
        }),
        prisma.review.findUnique({
          where: { id: reviewId },
          select: { rating: true, content: true },
        }),
      ]);

      if (!tripper?.email || !review) return;

      const locale = resolveLocale(tripper.locale);
      const BASE_URL = "https://getrandomtrip.com";
      const dashboardUrl = `${BASE_URL}/${locale}/dashboard/tripper/reviews`;
      const excerpt =
        review.content.length > 200
          ? `${review.content.slice(0, 200)}…`
          : review.content;

      await sendMail({
        to: tripper.email,
        subject: reviewApprovedSubjects[locale],
        content: {
          react: React.createElement(ReviewApprovedForTripper, {
            dashboardUrl,
            excerpt,
            locale,
            rating: review.rating,
            tripperName: tripper.name ?? "",
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendReviewApprovedForTripper:", err);
    }
  })();
}

export function sendVerificationEmail(userId: string, token: string): void {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, locale: true },
      });

      if (!user?.email) return;

      const locale = resolveLocale(user.locale);
      const BASE_URL = "https://getrandomtrip.com";
      const verifyUrl = `${BASE_URL}/${locale}/verify-email?token=${token}`;

      await sendMail({
        to: user.email,
        subject: verifyEmailSubjects[locale],
        content: {
          react: React.createElement(VerifyEmail, {
            name: user.name ?? "",
            verifyUrl,
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendVerificationEmail:", err);
    }
  })();
}

export function sendPasswordResetEmail(userId: string, token: string): void {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, locale: true },
      });

      if (!user?.email) return;

      const locale = resolveLocale(user.locale);
      const BASE_URL = "https://getrandomtrip.com";
      const resetUrl = `${BASE_URL}/${locale}/reset-password?token=${token}`;

      await sendMail({
        to: user.email,
        subject: passwordResetSubjects[locale],
        content: {
          react: React.createElement(PasswordReset, {
            name: user.name ?? "",
            resetUrl,
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendPasswordResetEmail:", err);
    }
  })();
}

/**
 * Sends an access invite email — either a `TRIPPER` invite (become a
 * Tripper) or a `SITE_ACCESS` invite (waitlist-originated, gets the invitee
 * into the site with no role change). Unlike the other senders here, this
 * one takes email/locale as direct args instead of a `userId` — the invitee
 * frequently has no `User` row yet.
 */
export function sendAccessInviteEmail(
  email: string,
  token: string,
  locale: "es" | "en",
  kind: AccessInviteKind,
): void {
  void (async () => {
    try {
      const BASE_URL = "https://getrandomtrip.com";
      const inviteUrl = `${BASE_URL}/${locale}/tripper-invite?token=${token}`;

      await sendMail({
        to: email,
        subject: tripperInviteSubjects[kind][locale],
        content: {
          react: React.createElement(TripperInvite, {
            inviteUrl,
            locale,
            kind,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendAccessInviteEmail:", err);
    }
  })();
}

/**
 * Sends the companion-traveler invite email. Takes the PLAINTEXT token as
 * a second arg because only its SHA-256 hash is persisted on `TripTraveler`
 * — the caller (whichever code path just rotated the token via
 * `issueTravelerInvite`) is the only place the plaintext is ever available.
 */
export function sendTravelerInviteEmail(
  travelerId: string,
  plaintextToken: string,
): void {
  void (async () => {
    try {
      const traveler = await prisma.tripTraveler.findUnique({
        where: { id: travelerId },
        include: { tripRequest: { include: { user: true } } },
      });

      if (!traveler?.email) return;

      const locale = resolveLocale(traveler.tripRequest.user.locale);
      const buyerFirstName = traveler.tripRequest.user.name?.split(" ")[0] ?? "";
      const BASE_URL = "https://getrandomtrip.com";
      const inviteUrl = `${BASE_URL}/${locale}/invite/${plaintextToken}`;

      await sendMail({
        to: traveler.email,
        subject: travelerInviteSubjects[locale],
        content: {
          react: React.createElement(TravelerInvite, {
            inviteUrl,
            buyerFirstName,
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendTravelerInviteEmail:", err);
    }
  })();
}

/**
 * Sends the companion-traveler reminder email. Same plaintext-token
 * requirement as `sendTravelerInviteEmail` — the reminder job
 * (`runPass1` in `api/internal/traveler-reminder`) reissues/rotates the
 * token via `issueTravelerInvite` immediately before calling this, since
 * the original plaintext from the first invite send is never persisted.
 */
export function sendTravelerReminderEmail(
  travelerId: string,
  plaintextToken: string,
): void {
  void (async () => {
    try {
      const traveler = await prisma.tripTraveler.findUnique({
        where: { id: travelerId },
        include: { tripRequest: { include: { user: true } } },
      });

      if (!traveler?.email) return;

      const locale = resolveLocale(traveler.tripRequest.user.locale);
      const buyerFirstName = traveler.tripRequest.user.name?.split(" ")[0] ?? "";
      const BASE_URL = "https://getrandomtrip.com";
      const inviteUrl = `${BASE_URL}/${locale}/invite/${plaintextToken}`;

      await sendMail({
        to: traveler.email,
        subject: travelerReminderSubjects[locale],
        content: {
          react: React.createElement(TravelerReminder, {
            inviteUrl,
            buyerFirstName,
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendTravelerReminderEmail:", err);
    }
  })();
}

/**
 * DIVERGES from every other send* function in this module on purpose: it is
 * `await`-able and it THROWS. A human is watching the modal for a real result
 * (Resolved Decision #6). Do NOT wrap this in `void (async () => …)()`.
 */
export async function sendAdminTripContactMessage(params: {
  /** Sending admin's own address — used as `replyTo` (Decision #5). */
  adminEmail: string;
  /** Admin-authored plain text, verbatim. */
  body: string;
  subject: string;
  traveler: { email: string; locale: string | null; name: string };
}): Promise<void> {
  const locale = resolveLocale(params.traveler.locale);

  await sendMail({
    to: params.traveler.email,
    subject: params.subject,
    replyTo: params.adminEmail,
    content: {
      react: React.createElement(AdminTripContactMessage, {
        body: params.body,
        locale,
        subject: params.subject,
      }),
    },
  });
}

export function sendWelcomeEmail(userId: string): void {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, locale: true },
      });

      if (!user?.email) return;

      const locale = resolveLocale(user.locale);

      await sendMail({
        to: user.email,
        subject: welcomeEmailSubjects[locale],
        content: {
          react: React.createElement(WelcomeEmail, {
            name: user.name ?? "",
            locale,
          }),
        },
      });
    } catch (err) {
      console.error("[email] sendWelcomeEmail:", err);
    }
  })();
}

/**
 * Resend caps the total request payload (rendered email + all attachments,
 * base64-encoded) at 40MB. Budget conservatively against RAW attachment
 * bytes: base64 inflates size by ~33%, and the rendered HTML body adds a
 * little more on top — so cap raw bytes well under the 40MB wire ceiling to
 * leave headroom for that overhead.
 */
const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB raw

/**
 * Sends the trip-start voucher email: every `TripDocument` row for the trip,
 * attached as-is — there is no fixed "voucher" category, documents are
 * free-labeled by admins (see `prisma/schema.prisma` comment on
 * `TripDocument`).
 *
 * DIVERGES from every other `send*` function in this module on purpose: it
 * is `await`-able and returns `{ sent }` instead of firing-and-forgetting.
 * The caller (`runPass1` in `api/internal/trip-start-voucher-email`) needs
 * that result to decide whether to stamp `voucherEmailSentAt` — Resolved
 * Decision: when a trip has zero documents, skip sending AND skip stamping,
 * so the hourly job keeps retrying and sends automatically the moment
 * documents are uploaded, instead of the trip silently never getting a
 * voucher email.
 *
 * Individual documents that would push the email past the size budget are
 * skipped (not the whole send) — `skippedCount` is surfaced in the email so
 * the traveler knows to check the dashboard for anything left out.
 */
export async function sendTripStartVouchers(
  tripRequestId: string,
  userId: string,
): Promise<{ sent: boolean }> {
  const [user, tripRequest, documents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, locale: true },
    }),
    prisma.tripRequest.findUnique({
      where: { id: tripRequestId },
      select: { startDate: true, endDate: true, nights: true, pax: true, type: true },
    }),
    prisma.tripDocument.findMany({
      where: { tripRequestId },
      select: {
        label: true,
        storageKey: true,
        mimeType: true,
        originalFilename: true,
        sizeBytes: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!user?.email || !tripRequest) return { sent: false };

  if (documents.length === 0) {
    console.log(
      `[email] sendTripStartVouchers: trip ${tripRequestId} has no documents yet — skipping (will retry next run)`,
    );
    return { sent: false };
  }

  const locale = resolveLocale(user.locale);
  const store = getTripDocumentStore();

  const attachments: MailAttachment[] = [];
  const attachedDocuments: { label: string; mimeType: string }[] = [];
  let skippedCount = 0;
  let totalBytes = 0;

  for (const doc of documents) {
    if (totalBytes + doc.sizeBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      skippedCount++;
      console.warn(
        `[email] sendTripStartVouchers: skipping "${doc.originalFilename}" (trip ${tripRequestId}) — would exceed the attachment size budget`,
      );
      continue;
    }

    try {
      const blob = await store.get(doc.storageKey, { type: "blob" });
      if (!blob) {
        skippedCount++;
        continue;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      attachments.push({
        filename: doc.originalFilename,
        content: buffer,
        contentType: doc.mimeType,
      });
      attachedDocuments.push({ label: doc.label, mimeType: doc.mimeType });
      totalBytes += doc.sizeBytes;
    } catch (err) {
      skippedCount++;
      console.error(
        `[email] sendTripStartVouchers: failed to fetch "${doc.originalFilename}" (trip ${tripRequestId}):`,
        err,
      );
    }
  }

  await sendMail({
    to: user.email,
    subject: tripStartVouchersSubjects[locale],
    attachments: attachments.length > 0 ? attachments : undefined,
    content: {
      react: React.createElement(TripStartVouchers, {
        client: user.name ?? "",
        documents: attachedDocuments,
        skippedCount,
        startDate: tripRequest.startDate,
        endDate: tripRequest.endDate,
        nights: tripRequest.nights,
        pax: tripRequest.pax,
        tripType: tripRequest.type,
        locale,
        tripId: tripRequestId,
      }),
    },
  });

  return { sent: true };
}
