import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AccountSettingsDocumentsTab } from "../AccountSettingsDocumentsTab";
import en from "@/dictionaries/en.json";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { TravelDocumentsFormState } from "@/types/documents";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";

vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "en" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const copy = (en as unknown as Dictionary).profile;

const documents: TravelDocumentsFormState = {
  idNumber: "",
  idCountry: "",
  idExpiry: "",
  passportNumber: "P1",
  passportCountry: "Argentina",
  passportExpiry: "",
  nationalities: ["AR"],
  approvedVisas: ["SCHENGEN", "US"],
};

let harness: DomHarness;
let fetchMock: ReturnType<typeof vi.fn>;

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function buttonNamed(name: string) {
  return Array.from(harness.container.querySelectorAll("button")).find(
    (button) => button.textContent === name,
  )!;
}

beforeEach(() => {
  fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
    Response.json({
      user: init?.body ? JSON.parse(String(init.body)) : documents,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  harness = createDomHarness();
});

afterEach(async () => {
  harness.unmount();
  await settle();
  vi.unstubAllGlobals();
});

it("shows the prefilled nationalities and localized visas read-only", async () => {
  harness.render(<AccountSettingsDocumentsTab copy={copy} />);
  await settle();
  const text = harness.container.textContent ?? "";
  expect(text).toContain(copy.sections.nationalities);
  expect(text).toContain("Argentina");
  expect(text).toContain(copy.labels.schengenVisa);
  expect(text).toContain("United States");
  expect(harness.container.querySelector('[role="combobox"]')).toBeNull();
});

it("edits with country pickers, localized remove labels, and saves codes", async () => {
  harness.render(<AccountSettingsDocumentsTab copy={copy} />);
  await settle();
  harness.click(buttonNamed(copy.buttons.editDetails));
  expect(harness.container.querySelectorAll('[role="combobox"]')).toHaveLength(2);
  expect(
    harness.container.querySelector(
      `button[aria-label="${copy.labels.removeCountry.replace("{country}", "Argentina")}"]`,
    ),
  ).not.toBeNull();

  harness.click(buttonNamed(copy.buttons.saveChanges));
  await settle();
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  expect(url).toBe("/api/user/documents");
  expect(init.method).toBe("PATCH");
  const body = JSON.parse(init.body);
  expect(body.nationalities).toEqual(["AR"]);
  expect(body.approvedVisas).toEqual(["SCHENGEN", "US"]);
  expect(body.passportCountry).toBe("Argentina");
});

it("shows empty-state copy when no nationalities or visas are on file", async () => {
  fetchMock.mockImplementation(async () =>
    Response.json({ user: { ...documents, nationalities: [], approvedVisas: [] } }),
  );
  harness.render(<AccountSettingsDocumentsTab copy={copy} />);
  await settle();
  const text = harness.container.textContent ?? "";
  expect(text).toContain(copy.labels.noNationalities);
  expect(text).toContain(copy.labels.noVisas);
});
