import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { db, sendMailMock } = vi.hoisted(() => ({
  db: {
    user: { findMany: vi.fn(), findUnique: vi.fn() },
    experience: { findUnique: vi.fn() },
    blogPost: { findUnique: vi.fn() },
    tripRequest: { findUnique: vi.fn() },
    tripTraveler: { findUnique: vi.fn() },
    payment: { findUnique: vi.fn() },
  },
  sendMailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: sendMailMock }));

import {
  sendAccessInviteEmail,
  sendAdminNewBooking,
  sendBlogCopyApproved,
  sendBlogCopyRejected,
  sendBlogPendingTripperReview,
  sendBlogSubmitted,
  sendBookingConfirmed,
  sendContactFormSubmission,
  sendDestinationAssignmentReminder,
  sendExperienceCopyApproved,
  sendExperienceCopyRejected,
  sendExperiencePendingTripperReview,
  sendExperienceSubmitted,
  sendPasswordResetEmail,
  sendTravelerInviteEmail,
  sendVerificationEmail,
} from "../index";

const MAIN_EMAIL = "hola@getrandomtrip.com";
const ADMIN = { email: "admin@example.com", name: "Alex", locale: "en" };
const CONTACT = {
  attachments: [{ filename: "details.pdf", content: Buffer.from("details") }],
  email: "visitor@example.com",
  interest: "Travel",
  locale: "en",
  message: "Please contact me",
  name: "Visitor",
};

const adminSenders = [
  ["experience submission", () => sendExperienceSubmitted("content", "user")],
  ["booking", () => sendAdminNewBooking("trip", "user")],
  [
    "experience copy approval",
    () => sendExperienceCopyApproved("content", "user"),
  ],
  [
    "experience copy rejection",
    () => sendExperienceCopyRejected("content", "user"),
  ],
  ["blog submission", () => sendBlogSubmitted("content", "user")],
  ["blog copy approval", () => sendBlogCopyApproved("content", "user")],
  ["blog copy rejection", () => sendBlogCopyRejected("content", "user")],
  ["contact form", () => sendContactFormSubmission(CONTACT)],
] as const;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ADMIN_EMAIL", "configured@example.com");
  db.user.findMany.mockResolvedValue([ADMIN]);
  db.user.findUnique.mockResolvedValue({
    email: "customer@example.com",
    name: "Customer",
    locale: "en",
  });
  db.experience.findUnique.mockResolvedValue({ title: "Experience" });
  db.blogPost.findUnique.mockResolvedValue({ title: "Blog" });
  db.tripRequest.findUnique.mockResolvedValue({
    startDate: new Date("2026-10-10T12:00:00Z"),
    type: "couple",
    level: "essenza",
    nights: 3,
    user: { name: "Customer" },
  });
  db.payment.findUnique.mockResolvedValue({ amount: 700, currency: "USD" });
  db.tripTraveler.findUnique.mockResolvedValue({
    email: "customer@example.com",
    tripRequest: { user: { name: "Buyer", locale: "en" } },
  });
  sendMailMock.mockResolvedValue({ id: "email-id" });
});

afterEach(() => vi.unstubAllEnvs());

describe("admin email recipients", () => {
  it.each(adminSenders)(
    "sends %s to hola, configured email, and all admins",
    async (_, send) => {
      db.user.findMany.mockResolvedValue([
        ADMIN,
        { ...ADMIN, email: "second-admin@example.com" },
      ]);

      await send();

      await vi.waitFor(() => expect(sendMailMock).toHaveBeenCalledTimes(1));
      expect(sendMailMock.mock.calls[0][0].to).toEqual(
        expect.arrayContaining([
          MAIN_EMAIL,
          "configured@example.com",
          ADMIN.email,
          "second-admin@example.com",
        ]),
      );
      expect(sendMailMock.mock.calls[0][0].to).toHaveLength(4);
      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { roles: { has: "ADMIN" } } }),
      );
    },
  );

  it.each([undefined, "", "   "])(
    "keeps hola without DB admins or configured email (%s)",
    async (email) => {
      vi.stubEnv("ADMIN_EMAIL", email);
      db.user.findMany.mockResolvedValue([]);

      await sendContactFormSubmission(CONTACT);

      expect(sendMailMock.mock.calls[0][0].to).toEqual([MAIN_EMAIL]);
    },
  );

  it("keeps both hola and a configured address without DB admins", async () => {
    db.user.findMany.mockResolvedValue([]);

    await sendContactFormSubmission(CONTACT);

    expect(sendMailMock.mock.calls[0][0].to).toEqual([
      MAIN_EMAIL,
      "configured@example.com",
    ]);
  });

  it("trims, deduplicates case-insensitively, and skips blank addresses", async () => {
    vi.stubEnv("ADMIN_EMAIL", " HOLA@GetRandomTrip.com ");
    db.user.findMany.mockResolvedValue([
      ADMIN,
      { ...ADMIN, email: " ADMIN@EXAMPLE.COM " },
      { ...ADMIN, email: MAIN_EMAIL },
      { ...ADMIN, email: " " },
    ]);

    await sendContactFormSubmission(CONTACT);

    expect(sendMailMock.mock.calls[0][0].to).toEqual([MAIN_EMAIL, ADMIN.email]);
  });

  it("preserves contact subject, reply-to, attachments, and failure propagation", async () => {
    await sendContactFormSubmission(CONTACT);

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: CONTACT.attachments,
        replyTo: CONTACT.email,
        subject: "Contact form - Travel",
      }),
    );
    sendMailMock.mockRejectedValueOnce(new Error("Send failed"));
    await expect(sendContactFormSubmission(CONTACT)).rejects.toThrow(
      "Send failed",
    );
  });

  it.each([false, true])(
    "sends one personalized reminder per recipient (escalated: %s)",
    async (escalated) => {
      vi.stubEnv("ADMIN_EMAIL", " ADMIN@EXAMPLE.COM ");
      db.user.findMany.mockResolvedValue([
        ADMIN,
        { email: " HOLA@GetRandomTrip.com ", name: "Team", locale: "es" },
      ]);

      sendDestinationAssignmentReminder("trip", escalated);

      await vi.waitFor(() => expect(sendMailMock).toHaveBeenCalledTimes(2));
      expect(sendMailMock.mock.calls.map(([mail]) => mail.to).sort()).toEqual(
        [MAIN_EMAIL, ADMIN.email].sort(),
      );
      for (const [mail] of sendMailMock.mock.calls) {
        expect(mail.content.react.props).toMatchObject({
          adminName: mail.to === ADMIN.email ? "Alex" : "Team",
          locale: mail.to === ADMIN.email ? "en" : "es",
          escalated,
        });
      }
    },
  );

  it("sends reminders to hola and configured email even with no DB admins", async () => {
    db.user.findMany.mockResolvedValue([]);

    sendDestinationAssignmentReminder("trip");

    await vi.waitFor(() => expect(sendMailMock).toHaveBeenCalledTimes(2));
    expect(sendMailMock.mock.calls.map(([mail]) => mail.to)).toEqual([
      MAIN_EMAIL,
      "configured@example.com",
    ]);
  });
});

describe("private email isolation", () => {
  it.each([
    ["booking confirmation", () => sendBookingConfirmed("trip", "user")],
    ["password reset", () => sendPasswordResetEmail("user", "private-token")],
    ["verification", () => sendVerificationEmail("user", "private-token")],
    [
      "access invite",
      () =>
        sendAccessInviteEmail(
          "customer@example.com",
          "private-token",
          "en",
          "TRIPPER",
        ),
    ],
    [
      "traveler invite",
      () => sendTravelerInviteEmail("traveler", "private-token"),
    ],
    [
      "experience review",
      () => sendExperiencePendingTripperReview("content", "user"),
    ],
    ["blog review", () => sendBlogPendingTripperReview("content", "user", [])],
  ] as const)("keeps %s only with its intended recipient", async (_, send) => {
    send();

    await vi.waitFor(() => expect(sendMailMock).toHaveBeenCalledTimes(1));
    expect(sendMailMock.mock.calls[0][0].to).toBe("customer@example.com");
    expect(db.user.findMany).not.toHaveBeenCalled();
  });
});
