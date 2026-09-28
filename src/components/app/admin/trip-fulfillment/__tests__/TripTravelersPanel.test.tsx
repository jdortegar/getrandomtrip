import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { AdminBookingTraveler } from "@/lib/types/AdminBookingTravelers";
import { TripTravelersPanel } from "../TripTravelersPanel";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: Root;
const buyer: AdminBookingTraveler = {
  id: "buyer",
  kind: "BOOKING_HOLDER",
  name: "Test Buyer",
  idDocument: "DOC-1",
  dateOfBirth: null,
  phone: "+1 555 0100",
  email: "buyer@example.test",
};
const companion: AdminBookingTraveler = {
  id: "companion",
  kind: "ADULT",
  name: "Test Companion",
  idDocument: "DOC-2",
  dateOfBirth: null,
  phone: null,
  email: "companion@example.test",
};
beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
function render(
  travelers = [buyer, companion],
  pax = 2,
  copy = en.adminTripFulfillment.travelers,
) {
  act(() =>
    root.render(
      <TripTravelersPanel
        copy={copy}
        onRefresh={async () => {}}
        pax={pax}
        paxDetails={{}}
        travelers={travelers}
        tripId="trip"
      />,
    ),
  );
}

it.each([en, es])(
  "shows read-only, localized booking holder and companion details",
  (dict) => {
    const copy = dict.adminTripFulfillment.travelers;
    render(undefined, 2, copy);
    for (const text of [
      copy.title,
      copy.bookingHolder,
      copy.adult,
      copy.name,
      copy.idDocument,
      copy.phone,
      copy.email,
      "Test Buyer",
      "DOC-1",
      "+1 555 0100",
      "buyer@example.test",
      "Test Companion",
      "DOC-2",
      "companion@example.test",
    ])
      expect(host.textContent).toContain(text);
    const rows = host.querySelectorAll("li");
    expect(rows).toHaveLength(2);
    expect(rows[1].textContent).toContain(copy.phoneNotCollected);
    expect(rows[1].textContent).not.toContain(buyer.phone);
    expect(host.querySelector("input, button, select, a")).toBeNull();
    expect(host.querySelector('[role="status"]')).toBeNull();
    expect(host.textContent).not.toContain("{{");
  },
);

it("shows missing values for every blank field even for stale COMPLETE records and minors", () => {
  const copy = en.adminTripFulfillment.travelers;
  const stale = {
    ...companion,
    status: "COMPLETE",
    kind: "MINOR" as const,
    name: " ",
    idDocument: "\n",
    email: null,
  };
  render([
    { ...buyer, name: null, idDocument: null, phone: " ", email: "" },
    stale,
  ]);
  const rows = host.querySelectorAll("li");
  expect(rows[0].textContent?.split(copy.notProvided)).toHaveLength(5);
  expect(rows[1].textContent?.split(copy.notProvided)).toHaveLength(5);
  expect(rows[1].textContent).toContain(copy.minor);
  expect(rows[1].textContent).not.toContain("COMPLETE");
});

it("handles solo trips without phantom companions or mismatch warnings", () => {
  render([buyer], 1);
  expect(host.querySelectorAll("li")).toHaveLength(1);
  expect(host.querySelector('[role="status"]')).toBeNull();
});

it.each([1, 3])(
  "warns when %i booked travelers differs from saved records without inventing rows",
  (pax) => {
    const copy = en.adminTripFulfillment.travelers;
    render(undefined, pax);
    expect(host.textContent).toContain(
      (pax === 1 ? copy.extraRecords : copy.missingRecords).replace(
        "{{count}}",
        "1",
      ),
    );
    expect(host.textContent).toContain(
      copy.count
        .replace("{{count}}", String(pax))
        .replace("{{complete}}", String(Math.min(pax, 2))),
    );
    expect(host.querySelectorAll("li")).toHaveLength(2);
  },
);

it("reports an empty placeholder as incomplete, not as a second completed traveler", () => {
  render([buyer, { ...companion, name: null, idDocument: null, email: null }]);
  const copy = en.adminTripFulfillment.travelers;
  expect(host.textContent).toContain(
    copy.count.replace("{{count}}", "2").replace("{{complete}}", "1"),
  );
  expect(host.textContent).toContain(copy.incomplete.replace("{{count}}", "1"));
  expect(host.textContent).toContain(copy.reminder.send);
});
it("requires minor DOB and shows it without a time zone shift", () => {
  render([
    buyer,
    { ...companion, kind: "MINOR", email: null, dateOfBirth: "2015-01-02" },
  ]);
  expect(host.textContent).toContain("2015-01-02");
  expect(host.textContent).not.toContain(
    en.adminTripFulfillment.travelers.reminder.send,
  );
});
it("does not offer a companion reminder when only buyer details are missing", () => {
  render([{ ...buyer, idDocument: null }, companion]);
  expect(host.textContent).not.toContain(
    en.adminTripFulfillment.travelers.reminder.send,
  );
});

it("does not let an extra completed companion hide missing buyer details", () => {
  render([
    { ...buyer, idDocument: null },
    companion,
    { ...companion, id: "extra" },
  ]);
  const copy = en.adminTripFulfillment.travelers;
  expect(host.textContent).toContain(
    copy.count.replace("{{count}}", "2").replace("{{complete}}", "1"),
  );
  expect(host.textContent).toContain(
    copy.extraRecords.replace("{{count}}", "1"),
  );
});
