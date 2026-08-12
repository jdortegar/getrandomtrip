import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/helpers/sendMail", () => ({
  sendMail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { sendMail } from "@/lib/helpers/sendMail";
import { sendAdminTripContactMessage } from "../index";

describe("sendAdminTripContactMessage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (sendMail as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "resend-id" });
  });

  it("sends to the traveler's email with replyTo set to the admin's email", async () => {
    await sendAdminTripContactMessage({
      adminEmail: "admin@example.com",
      body: "Hola, ¿cómo va todo?",
      subject: "Un mensaje",
      traveler: { email: "traveler@example.com", locale: "es", name: "Juana" },
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "traveler@example.com",
        replyTo: "admin@example.com",
        subject: "Un mensaje",
      }),
    );
  });

  it("resolves locale 'en' to an 'en' template element when traveler.locale is 'en'", async () => {
    await sendAdminTripContactMessage({
      adminEmail: "admin@example.com",
      body: "Hi there",
      subject: "A message",
      traveler: { email: "traveler@example.com", locale: "en", name: "Jane" },
    });

    const call = (sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content.react.props.locale).toBe("en");
  });

  it("resolves null locale to 'es' (default fallback)", async () => {
    await sendAdminTripContactMessage({
      adminEmail: "admin@example.com",
      body: "Hola",
      subject: "Asunto",
      traveler: { email: "traveler@example.com", locale: null, name: "Juana" },
    });

    const call = (sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content.react.props.locale).toBe("es");
  });

  it("resolves an unsupported locale (e.g. 'pt') to 'es'", async () => {
    await sendAdminTripContactMessage({
      adminEmail: "admin@example.com",
      body: "Hola",
      subject: "Asunto",
      traveler: { email: "traveler@example.com", locale: "pt", name: "Juana" },
    });

    const call = (sendMail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content.react.props.locale).toBe("es");
  });

  it("rejects when sendMail rejects — proves this diverges from the fire-and-forget siblings", async () => {
    (sendMail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Resend down"));

    await expect(
      sendAdminTripContactMessage({
        adminEmail: "admin@example.com",
        body: "Hola",
        subject: "Asunto",
        traveler: { email: "traveler@example.com", locale: "es", name: "Juana" },
      }),
    ).rejects.toThrow("Resend down");
  });
});
