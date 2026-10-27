import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import TopUpDue, { getSubject } from "../TopUpDue";

const props = {
  dashboardUrl: "https://getrandomtrip.com/es/dashboard",
  amount: "USD 17.50",
  deadline: "1 de noviembre de 2026 a las 09:00",
  travelers: 2,
  isOrganizer: false,
};

describe("TopUpDue", () => {
  it("names the amount in the subject in both locales", () => {
    expect(getSubject("es", "USD 17.50")).toBe("Tu grupo cambió: falta pagar USD 17.50");
    expect(getSubject("en", "USD 17.50")).toBe("Your group changed: USD 17.50 left to pay");
  });

  it("explains the re-split, the amount, the pay-by time and links to the dashboard", async () => {
    const html = await render(<TopUpDue {...props} locale="es" />);
    expect(html).toContain("Al cerrar el plazo viajan 2 personas, así que los extras compartidos se repartieron de nuevo.");
    expect(html).toContain("USD 17.50");
    expect(html).toContain("Paga la diferencia antes del 1 de noviembre de 2026 a las 09:00 desde tu panel.");
    expect(html).toContain('href="https://getrandomtrip.com/es/dashboard"');
    expect(html).not.toContain("la cubres tú");
  });

  it("tells only the organizer they cover unpaid differences", async () => {
    const html = await render(<TopUpDue {...props} locale="en" travelers={1} isOrganizer />);
    expect(html).toContain("1 person is traveling");
    expect(html).toContain("you cover it.");
  });
});
