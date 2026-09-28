import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
vi.mock("@/lib/helpers/sendMail", () => ({ sendMail: vi.fn() }));
import { sendMail } from "@/lib/helpers/sendMail";
import { sendTravelerDetailsReminder } from "../sendTravelerDetailsReminder";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendMail).mockResolvedValue({ id: "mail" });
});
describe("buyer reminder email", () => {
  it.each(["en", "es"])(
    "renders localized %s copy, protected-fields explanation and buyer-only CTA",
    async (locale) => {
      await sendTravelerDetailsReminder({
        tripId: "trip-1",
        buyer: { email: "buyer@example.com", locale },
      });
      const mail = vi.mocked(sendMail).mock.calls[0][0];
      const copy = (locale === "en" ? en : es).travelerDetailsReminder;
      expect(mail).toMatchObject({
        to: "buyer@example.com",
        subject: copy.subject,
        idempotencyKey: "traveler-details-reminder/trip-1",
      });
      const html = renderToStaticMarkup(mail.content.react!);
      expect(html).toContain(copy.heading);
      expect(html).toContain(copy.body);
      expect(html).toContain(copy.fillEmpty);
      expect(html).toContain(
        `https://getrandomtrip.com/${locale}/dashboard/trips/trip-1`,
      );
    },
  );
  it("falls back to Spanish and propagates provider errors", async () => {
    vi.mocked(sendMail).mockRejectedValue(new Error("provider failure"));
    await expect(
      sendTravelerDetailsReminder({
        tripId: "trip",
        buyer: { email: "buyer@example.com", locale: null },
      }),
    ).rejects.toThrow("provider failure");
    expect(vi.mocked(sendMail).mock.calls[0][0].subject).toBe(
      es.travelerDetailsReminder.subject,
    );
  });
  it("does not acknowledge a missing provider acceptance id", async () => {
    vi.mocked(sendMail).mockResolvedValue(null as never);
    await expect(
      sendTravelerDetailsReminder({
        tripId: "trip",
        buyer: { email: "buyer@example.com", locale: "en" },
      }),
    ).rejects.toThrow("did not confirm");
  });
});

it.each(["en", "es"])(
  "renders generic manual %s reminder without automatic restrictions",
  async (locale) => {
    await sendTravelerDetailsReminder({
      tripId: "trip-1",
      buyer: { email: "buyer@example.test", locale },
      variant: "MANUAL",
      idempotencyKey: "manual-key",
    });
    const mail = vi.mocked(sendMail).mock.calls[0][0];
    const copy = (locale === "en" ? en : es).manualTravelerDetailsReminder;
    expect(mail).toMatchObject({
      to: "buyer@example.test",
      subject: copy.subject,
      idempotencyKey: "manual-key",
    });
    const html = renderToStaticMarkup(mail.content.react!);
    expect(html).toContain(copy.body);
    expect(html).toContain(copy.fillEmpty);
    expect(html).toContain(
      `https://getrandomtrip.com/${locale}/dashboard/trips/trip-1`,
    );
    expect(html).not.toMatch(/XSED|72|locked|bloquead/);
  },
);
it("manual reminder cannot succeed without provider acceptance", async () => {
  vi.mocked(sendMail).mockResolvedValue({} as never);
  await expect(
    sendTravelerDetailsReminder({
      tripId: "trip-1",
      buyer: { email: "buyer@example.test", locale: "en" },
      variant: "MANUAL",
      idempotencyKey: "manual-key",
    }),
  ).rejects.toThrow("did not confirm");
});
