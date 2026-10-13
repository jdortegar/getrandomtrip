import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";
import type { BuyerTravelDocuments } from "@/types/documents";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { BuyerTravelDocumentsSection } from "../BuyerTravelDocumentsSection";

let harness: DomHarness;
const fetchMock = vi.fn();

function renderSection(
  value: BuyerTravelDocuments,
  options: { locale?: "en" | "es"; readOnly?: boolean; locked?: boolean } = {},
) {
  const dict = options.locale === "es" ? es : en;
  harness.render(
    <BuyerTravelDocumentsSection
      copy={dict.tripDetail.buyerDocuments}
      errorCopy={dict.journey.checkout.errors}
      initialValue={value}
      locale={options.locale ?? "en"}
      locked={options.locked ?? false}
      readOnly={options.readOnly ?? false}
      tripId="trip-1"
    />,
  );
}

function saveButton() {
  return [...harness.container.querySelectorAll("button")].find((b) =>
    [en.tripDetail.buyerDocuments.saveAction, en.tripDetail.buyerDocuments.savingAction].includes(
      b.textContent ?? "",
    ),
  );
}

async function clickAndSettle(el: Element) {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  harness = createDomHarness();
  fetchMock.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  harness.unmount();
  vi.unstubAllGlobals();
});

describe("BuyerTravelDocumentsSection", () => {
  it("prompts the buyer to complete documents when none were saved", () => {
    renderSection({ nationalities: [], visas: [] });
    const text = harness.container.textContent ?? "";
    expect(text).toContain(en.tripDetail.buyerDocuments.title);
    expect(text).toContain(en.tripDetail.buyerDocuments.missingTitle);
    expect(text).toContain(en.tripDetail.buyerDocuments.missingDescription);
    expect(saveButton()).toBeDefined();
  });

  it("renders Spanish copy for the es locale", () => {
    renderSection({ nationalities: [], visas: [] }, { locale: "es" });
    const text = harness.container.textContent ?? "";
    expect(text).toContain(es.tripDetail.buyerDocuments.title);
    expect(text).toContain(es.tripDetail.buyerDocuments.missingTitle);
  });

  it("hides the prompt once the buyer has a nationality", () => {
    renderSection({ nationalities: ["AR"], visas: [] });
    const text = harness.container.textContent ?? "";
    expect(text).toContain("Argentina");
    expect(text).not.toContain(en.tripDetail.buyerDocuments.missingTitle);
  });

  it("is fully read-only once locked with both lists populated", () => {
    renderSection({ nationalities: ["AR"], visas: ["US"] }, { locked: true });
    expect(saveButton()).toBeUndefined();
    expect(harness.container.querySelector('[aria-label="Remove Argentina"]')).toBeNull();
    expect(harness.container.querySelector('[aria-label="Remove United States"]')).toBeNull();
    expect(harness.container.textContent).toContain(en.tripDetail.buyerDocuments.lockedNote);
  });

  it("is fully read-only for an inactive trip, even with empty lists", () => {
    renderSection({ nationalities: [], visas: [] }, { readOnly: true });
    expect(saveButton()).toBeUndefined();
    const text = harness.container.textContent ?? "";
    expect(text).not.toContain(en.tripDetail.buyerDocuments.missingTitle);
    expect(text).toContain(en.tripDetail.buyerDocuments.lockedNote);
  });

  it("keeps empty lists fillable after the lock and still prompts for nationalities", async () => {
    fetchMock.mockResolvedValue(Response.json({ buyerNationalities: [], buyerVisas: [] }));
    renderSection({ nationalities: [], visas: [] }, { locked: true });
    const text = harness.container.textContent ?? "";
    expect(text).toContain(en.tripDetail.buyerDocuments.missingTitle);
    expect(text).toContain(en.tripDetail.buyerDocuments.partiallyLockedNote);
    expect(saveButton()).toBeDefined();
  });

  it("freezes a populated list after the lock and saves only the editable one", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ buyerNationalities: ["AR"], buyerVisas: [] }),
    );
    renderSection({ nationalities: ["AR"], visas: [] }, { locked: true });
    expect(harness.container.querySelector('[aria-label="Remove Argentina"]')).toBeNull();
    expect(harness.container.textContent).not.toContain(en.tripDetail.buyerDocuments.missingTitle);
    expect(harness.container.textContent).toContain(
      en.tripDetail.buyerDocuments.partiallyLockedNote,
    );
    await clickAndSettle(saveButton()!);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ visas: [] });
    expect(toast.success).toHaveBeenCalled();
  });

  it("saves through the buyer-documents endpoint and confirms with a toast", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ buyerNationalities: ["AR", "IT"], buyerVisas: ["US"] }),
    );
    renderSection({ nationalities: ["AR", "IT"], visas: ["US"] });
    await clickAndSettle(saveButton()!);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/trips/trip-1/buyer-documents");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ nationalities: ["AR", "IT"], visas: ["US"] });
    expect(toast.success).toHaveBeenCalledWith(en.tripDetail.buyerDocuments.savedToast);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows a pending state and ignores duplicate clicks while saving", async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    renderSection({ nationalities: ["AR"], visas: [] });
    await clickAndSettle(saveButton()!);

    const pending = saveButton()!;
    expect(pending.textContent).toBe(en.tripDetail.buyerDocuments.savingAction);
    expect(pending.getAttribute("aria-busy")).toBe("true");
    expect((pending as HTMLButtonElement).disabled).toBe(true);
    await clickAndSettle(pending);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve(Response.json({ buyerNationalities: ["AR"], buyerVisas: [] }));
    });
    expect(saveButton()!.textContent).toBe(en.tripDetail.buyerDocuments.saveAction);
  });

  it("refuses to save without a nationality", async () => {
    renderSection({ nationalities: [], visas: [] });
    await clickAndSettle(saveButton()!);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(en.journey.checkout.errors.nationalitiesRequired);
    expect(harness.container.querySelector('[role="alert"]')?.textContent).toBe(
      en.journey.checkout.errors.nationalitiesRequired,
    );
  });

  it("reports a failed save and allows a retry", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: "Trip is no longer editable" }, { status: 409 }));
    renderSection({ nationalities: ["AR"], visas: [] });
    await clickAndSettle(saveButton()!);
    expect(toast.error).toHaveBeenCalledWith(en.journey.checkout.errors.saveTravelDocumentsFailed);

    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await clickAndSettle(saveButton()!);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenCalledTimes(2);
    expect(toast.success).not.toHaveBeenCalled();
  });
});
