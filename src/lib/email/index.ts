import BookingConfirmed, {
  subjects as bookingConfirmedSubjects,
} from "@/emails/BookingConfirmed";
import DestinationRevealed, {
  subjects as destinationRevealedSubjects,
} from "@/emails/DestinationRevealed";
import ExperienceSubmitted, {
  subjects as experienceSubmittedSubjects,
} from "@/emails/ExperienceSubmitted";
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
        subject: tripCompletedSubjects[locale],
        content: {
          react: React.createElement(TripCompleted, {
            client: user.name ?? "",
            locale,
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
