import AdminNewBooking, {
  subject as adminNewBookingSubject,
} from "@/emails/AdminNewBooking";
import ReviewApprovedForTripper, {
  subjects as reviewApprovedSubjects,
} from "@/emails/ReviewApprovedForTripper";
import DestinationAssignmentReminder, {
  subjects as destinationAssignmentReminderSubjects,
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
import { getLevelContent } from "@/lib/data/experience-levels";
import { sendMail } from "@/lib/helpers/sendMail";
import { prisma } from "@/lib/prisma";
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
      const [user, tripRequest] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, locale: true },
        }),
        prisma.tripRequest.findUnique({
          where: { id: tripRequestId },
          select: { type: true, nights: true, startDate: true },
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

      const adminEmail = process.env.ADMIN_EMAIL ?? "hola@getrandomtrip.com";
      const departureDate = tripRequest.startDate
        ? tripRequest.startDate.toLocaleDateString("es-AR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : undefined;

      await sendMail({
        to: adminEmail,
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

export function sendDestinationAssignmentReminder(tripRequestId: string): void {
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
            subject: destinationAssignmentReminderSubjects[locale],
            content: {
              react: React.createElement(DestinationAssignmentReminder, {
                adminName: admin.name ?? "",
                clientName: tripRequest.user?.name ?? "",
                tripId: tripRequestId,
                startDate,
                locale,
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
