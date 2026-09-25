import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { AdminTripFulfillmentPageClient } from "../AdminTripFulfillmentPageClient";
import type { TripDocumentSourceSelection } from "@/lib/types/TripDocumentSource";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/app/admin/TripRequestDetails", () => ({
  TripRequestDetails: () => null,
}));
vi.mock(
  "@/components/app/admin/trip-fulfillment/TripFulfillmentHeader",
  () => ({ TripFulfillmentHeader: () => null }),
);
vi.mock("@/components/app/admin/trip-fulfillment/TripDangerZone", () => ({
  TripDangerZone: () => null,
}));
vi.mock("@/components/app/admin/trip-fulfillment/ContactTravelerModal", () => ({
  ContactTravelerModal: () => null,
}));
vi.mock("@/components/app/admin/trip-fulfillment/AddTripDocumentForm", () => ({
  AddTripDocumentForm: () => null,
}));
vi.mock("@/components/app/admin/trip-fulfillment/TripDocumentsTable", () => ({
  TripDocumentsTable: () => null,
}));
vi.mock("@/components/app/admin/trip-fulfillment/DocumentDraftPanel", () => ({
  DocumentDraftPanel: ({
    source,
  }: {
    source?: TripDocumentSourceSelection;
  }) => {
    const [manual, setManual] = useState("");
    return (
      <div>
        <button onClick={() => setManual("Manual PDF edit")}>Edit PDF</button>
        <span>{manual}</span>
        <span data-candidate>
          {source?.context?.candidates.hotel[0]?.title}
        </span>
      </div>
    );
  },
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const trip = {
  id: "trip",
  experienceId: "A" as string | null,
  status: "PENDING_PAYMENT",
  type: "couple",
  tripperId: null,
  actualDestination: "Saved city",
};
const itinerary = (title: string) => ({
  title,
  itinerary: [{ title: `${title} day`, description: "" }],
  inclusions: [],
  exclusions: [],
});
const context = (id: string | null) => ({
  experienceItinerary: id ? itinerary(id) : null,
  candidates: {
    hotel: id
      ? [{ index: 0, title: `${id} hotel`, provider: {}, role: "hotel" }]
      : [],
    activity: [],
    dinner: [],
  },
});
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });
const fetchMock = vi.fn();
let root: Root;
let host: HTMLDivElement;
let savedTrip = trip;
function page(tripId = "trip") {
  return (
    <AdminTripFulfillmentPageClient
      countryLabels={{ AR: "Argentina" }}
      dict={en.adminTripEditModal}
      fulfillmentDict={en.adminTripFulfillment}
      locale="en"
      paymentStatusLabels={{}}
      tripId={tripId}
    />
  );
}
beforeEach(async () => {
  savedTrip = trip;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.includes("document-source")) {
      const params = new URL(url, "http://local").searchParams;
      return response(
        context(
          params.has("experienceId")
            ? params.get("experienceId") || null
            : savedTrip.experienceId,
        ),
      );
    }
    if (url.includes("/experiences?"))
      return response({
        experiences: ["A", "B"].map((id) => ({
          id,
          title: id,
          destinationCity: id,
          destinationCountry: "AR",
        })),
      });
    if (init?.method === "PATCH") return response({});
    return response({
      tripRequest: savedTrip,
      experienceItinerary: itinerary("A"),
      documents: [],
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  await act(async () => root.render(page()));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
async function select(id: string, value: string) {
  await act(async () => {
    const input = host.querySelector<HTMLSelectElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
function button(text: string) {
  return [...host.querySelectorAll("button")].find(
    (node) => node.textContent === text,
  )!;
}
it("previews local selection and new PDF candidates without PATCH while retaining manual PDF state", async () => {
  act(() => button("Edit PDF").click());
  await select("fulfillment-trip-status", "CONFIRMED");
  await select("fulfillment-trip-experience", "B");
  expect(host.textContent).toContain("B day");
  expect(host.textContent).not.toContain("A day");
  expect(host.querySelector("[data-candidate]")?.textContent).toBe("B hotel");
  expect(host.textContent).toContain("Manual PDF edit");
  expect(
    host.querySelector<HTMLSelectElement>("#fulfillment-trip-status")?.value,
  ).toBe("CONFIRMED");
  expect(
    fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH"),
  ).toBe(false);
  await act(async () => button(en.adminTripFulfillment.discard).click());
  expect(host.textContent).toContain("A day");
  expect(host.querySelector("[data-candidate]")?.textContent).toBe("A hotel");
  expect(host.textContent).toContain("Manual PDF edit");
});
it("clears preview/candidates locally and submits clear only on explicit Save", async () => {
  await select("fulfillment-trip-experience", "");
  expect(host.textContent).not.toContain("A day");
  expect(host.querySelector("[data-candidate]")?.textContent).toBe("");
  expect(
    fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH"),
  ).toBe(false);
  await act(async () => button(en.adminTripFulfillment.save).click());
  const patch = fetchMock.mock.calls.find(
    ([, init]) => init?.method === "PATCH",
  );
  expect(JSON.parse(patch![1].body).experienceId).toBe("");
});
it("keeps PDF editor mounted through explicit trip Save", async () => {
  act(() => button("Edit PDF").click());
  await select("fulfillment-trip-status", "CONFIRMED");
  await act(async () => button(en.adminTripFulfillment.save).click());
  expect(host.textContent).toContain("Manual PDF edit");
});
it.each([null, "A"])(
  "does not rewrite unchanged assignment %s on status-only Save",
  async (experienceId) => {
    savedTrip = {
      ...trip,
      experienceId,
      actualDestination: "Historical destination",
    };
    await act(async () => root.render(page("historical")));
    await select("fulfillment-trip-status", "CONFIRMED");
    await act(async () => button(en.adminTripFulfillment.save).click());
    const patch = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "PATCH",
    );
    expect(JSON.parse(patch![1].body)).toEqual({ status: "CONFIRMED" });
  },
);

it("shows source retry progress, blocks duplicate retries, and recovers without saving", async () => {
  fetchMock.mockRejectedValueOnce(new Error("offline"));
  await select("fulfillment-trip-experience", "B");
  expect(host.textContent).toContain(en.documentWorkflow.sourceError);
  expect(host.textContent).not.toContain("A day");
  let finish!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  const retry = button(en.documentWorkflow.retry);
  const count = fetchMock.mock.calls.length;
  act(() => {
    retry.click();
    retry.click();
  });
  expect(fetchMock.mock.calls.length).toBe(count + 1);
  const pending = button(en.documentWorkflow.sourceLoading);
  expect(pending.getAttribute("aria-busy")).toBe("true");
  expect(pending.disabled).toBe(true);
  expect(pending.querySelector(".animate-spin")).not.toBeNull();
  act(() => pending.click());
  expect(fetchMock.mock.calls.length).toBe(count + 1);
  await act(async () => finish(response(context("B"))));
  expect(host.textContent).toContain("B day");
  expect(
    fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH"),
  ).toBe(false);
});
it("shows Save progress, prevents duplicate writes, and preserves local edits after failure", async () => {
  await select("fulfillment-trip-experience", "B");
  act(() => button("Edit PDF").click());
  let reject!: (error: Error) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((_resolve, fail) => {
      reject = fail;
    }),
  );
  const save = button(en.adminTripFulfillment.save);
  act(() => {
    save.click();
    save.click();
  });
  expect(save.getAttribute("aria-busy")).toBe("true");
  expect(save.textContent).toContain(en.adminTripFulfillment.saving);
  expect(save.querySelector(".animate-spin")).not.toBeNull();
  expect(
    fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH"),
  ).toHaveLength(1);
  await act(async () => reject(new Error("offline")));
  expect(host.textContent).toContain("Manual PDF edit");
  expect(host.textContent).toContain("B day");
  expect(button(en.adminTripFulfillment.save).disabled).toBe(false);
  expect(host.textContent).toContain(en.adminTripFulfillment.errors.generic);
});
