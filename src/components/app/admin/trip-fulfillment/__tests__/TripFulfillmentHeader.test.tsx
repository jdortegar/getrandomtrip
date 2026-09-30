import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TripFulfillmentHeader } from "@/components/app/admin/trip-fulfillment/TripFulfillmentHeader";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { AdminTripRequest } from "@/lib/admin/types";
import styles from "../fulfillment.module.css";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const copy = en.adminTripFulfillment;

function baseTrip(overrides: Partial<AdminTripRequest> = {}): AdminTripRequest {
  return {
    accommodationType: "any",
    actualDestination: null,
    addons: [],
    arrivePref: "any",
    avoidDestinations: [],
    climate: "any",
    completedAt: null,
    createdAt: new Date().toISOString(),
    customerFeedback: null,
    customerRating: null,
    departPref: "any",
    destinationRevealedAt: null,
    endDate: null,
    experienceId: null,
    experience: null,
    from: "traveler",
    id: "trip-1",
    level: "explorer",
    maxTravelTime: "no-limit",
    nights: 1,
    originCity: "Buenos Aires",
    originCountry: "Argentina",
    pax: 2,
    paxDetails: null,
    payment: null,
    startDate: null,
    status: "CONFIRMED",
    transport: "flight",
    tripperId: null,
    tripPhotos: null,
    type: "couple",
    updatedAt: new Date().toISOString(),
    user: {
      id: "user-1",
      name: "David Ortega",
      email: "david@example.com",
      locale: null,
    },
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;

function render(
  trip: AdminTripRequest,
  onContactTraveler = vi.fn(),
  locale: "en" | "es" = "en",
) {
  const dict = locale === "es" ? es : en;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TripFulfillmentHeader
        copy={dict.adminTripFulfillment}
        locale={locale}
        onContactTraveler={onContactTraveler}
        paymentStatusLabels={dict.dashboard.paymentStatus}
        statusLabel={(status) => dict.adminTripEditModal.tripStatus[status]}
        trip={trip}
      />,
    );
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
});

describe("TripFulfillmentHeader — labeled summary", () => {
  it.each([
    [
      "en",
      ["Trip status", "Trip type", "Experience", "Payment"],
      "Confirmed",
      "Approved",
    ],
    [
      "es",
      ["Estado del viaje", "Tipo de viaje", "Experiencia", "Pago"],
      "Confirmado",
      "Aprobado",
    ],
  ] as const)(
    "associates each %s badge with its own equally styled label",
    (locale, labels, tripStatus, paymentStatus) => {
      render(
        baseTrip({
          type: "xsed",
          level: "family",
          payment: {
            amount: 100,
            currency: "USD",
            paidAt: null,
            status: "APPROVED",
          },
        }),
        vi.fn(),
        locale,
      );

      const fields = Array.from(container.querySelectorAll("dl > div"));
      expect(fields).toHaveLength(4);
      expect(
        fields.map((field) => field.querySelector("dt")?.textContent),
      ).toEqual(labels);
      expect(
        fields.map((field) => field.querySelector("dd")?.textContent),
      ).toEqual([tripStatus, "XSED", "family", paymentStatus]);
      expect(
        fields.every((field) => field.className === styles.summaryField),
      ).toBe(true);
      expect(
        fields.every((field) => field.querySelectorAll("dt").length === 1),
      ).toBe(true);
      expect(
        fields.every((field) => field.querySelectorAll("dd").length === 1),
      ).toBe(true);
    },
  );

  it("keeps standard trip type and level badges inside the shared summary", () => {
    render(baseTrip({ type: "couple", level: "explorer" }));

    const summary = container.querySelector(`.${styles.summaryFields}`);
    const fields = Array.from(container.querySelectorAll("dl > div"));
    expect(summary?.querySelectorAll('[data-component="Badge"]')).toHaveLength(
      2,
    );
    expect(fields[1]?.querySelector("dt")?.textContent).toBe("Trip type");
    expect(fields[1]?.querySelector("dd")?.textContent).toBe("couple");
    expect(fields[2]?.querySelector("dt")?.textContent).toBe("Experience");
    expect(fields[2]?.querySelector("dd")?.textContent).toBe("explorer");
    expect(summary?.nextElementSibling).toBeNull();
  });

  it("omits the payment field entirely when there is no payment", () => {
    render(baseTrip());

    expect(container.querySelectorAll("dl > div")).toHaveLength(3);
    expect(container.querySelector("dt")?.textContent).toBe("Trip status");
    expect(container.querySelector("dd")?.textContent).toBe("Confirmed");
    expect(container.querySelector("dl")?.textContent).not.toContain("Payment");
  });
});

describe("TripFulfillmentHeader — type/level chip dedup", () => {
  it("displays the family category in uppercase without changing its stored value", () => {
    const trip = baseTrip({ type: "xsed", level: "family" });
    render(trip);

    const family = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent === "family",
    );
    expect(family?.classList.contains("uppercase")).toBe(true);
    expect(trip.level).toBe("family");
    expect(container.querySelector(".bg-xsed")?.textContent).toBe("XSED");
  });

  it("renders two distinct chips when type and level differ", () => {
    render(baseTrip({ type: "couple", level: "explorer" }));

    const text = container.textContent ?? "";
    expect(text).toContain("couple");
    expect(text).toContain("explorer");
  });

  it("renders the type/level chip only once when they're the same string (XSED)", () => {
    render(baseTrip({ type: "xsed", level: "xsed" }));

    const chips = Array.from(container.querySelectorAll("span")).filter(
      (el) => el.textContent === "XSED",
    );
    expect(chips).toHaveLength(1);
    expect(chips[0].classList.contains("bg-xsed")).toBe(true);
    expect(chips[0].classList.contains("text-white")).toBe(true);
  });

  it("deduplicates mixed-case XSED markers and brands a distinct XSED level", () => {
    render(baseTrip({ type: "XSED", level: "xsed" }));
    expect(container.querySelectorAll(".bg-xsed")).toHaveLength(1);
    expect(
      Array.from(container.querySelectorAll("dt")).map(
        (field) => field.textContent,
      ),
    ).toEqual(["Trip status", "Trip type"]);
  });

  it("brands XSED when it is the level rather than the traveler type", () => {
    render(baseTrip({ type: "couple", level: "xsed" }));
    expect(container.textContent).toContain("couple");
    expect(container.querySelector(".bg-xsed")?.textContent).toBe("XSED");
  });
});

describe("TripFulfillmentHeader — contact traveler", () => {
  it("renders a button (not a mailto anchor) and invokes onContactTraveler on click", () => {
    const onContactTraveler = vi.fn();
    render(baseTrip(), onContactTraveler);

    const mailtoLink = container.querySelector('a[href^="mailto:"]');
    expect(mailtoLink).toBeNull();

    const contactButton = Array.from(container.querySelectorAll("button")).find(
      (el) => el.textContent?.includes(copy.contactTraveler),
    );
    expect(contactButton).toBeTruthy();

    act(() => {
      contactButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onContactTraveler).toHaveBeenCalledTimes(1);
  });
});
