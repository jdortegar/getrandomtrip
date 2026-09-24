import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { normalizeXsedDraft } from "@/lib/helpers/xsed-form";
import { XsedDropShell } from "../../XsedDropShell";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../../resolveXsedStepContent", () => ({
  resolveXsedStepContent: () => null,
}));
vi.mock("@/components/journey/JourneyContentNavigation", () => ({
  default: () => null,
}));
vi.mock("@/components/journey/JourneyProgressSidebar", () => ({
  default: () => null,
}));
vi.mock("@/components/journey/JourneyActionBar", () => ({
  JourneyActionBar: ({
    labels,
    onGoToCheckout,
  }: {
    labels: { viewCheckout: string };
    onGoToCheckout: () => void;
  }) => <button onClick={onGoToCheckout}>{labels.viewCheckout}</button>,
}));
vi.mock("@/components/ui/ConfirmModal", () => ({
  ConfirmModal: ({
    open,
    onConfirm,
  }: {
    open: boolean;
    onConfirm: () => void;
  }) => (open ? <button onClick={onConfirm}>Confirm save</button> : null),
}));

it("saves configured review-copy content and returns to review without activating or dropping trailing entries", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  const container = document.createElement("div");
  const root = createRoot(container);
  const activities = ["Dinner", "Hike", "Kayak"].map((name) => ({
    name,
    durationRhythm: null,
    description: name,
    risks: "",
    image: "/activity.jpg",
  }));
  const form = normalizeXsedDraft({
    titleInternal: "Drop",
    tripDate: "2030-10-10",
    destinationCity: "Mendoza",
    destinationCountry: "Argentina",
    activities,
    gallery: ["/extra.jpg"],
  });
  try {
    act(() =>
      root.render(
        <XsedDropShell
          dict={en.adminXsed.form}
          initialDraft={form}
          initialDraftId="copy"
          isReviewCopy
          locale="en"
          returnHref="/en/dashboard/admin/experiences/original"
        />,
      ),
    );
    expect(container.textContent).toContain(en.adminXsed.form.save.submitLabel);
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find(
          (button) => button.textContent === en.adminXsed.form.save.submitLabel,
        )!
        .click();
    });
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "Confirm save")!
        .click();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/xsed/copy");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      status: "DRAFT",
      activities,
      gallery: ["/extra.jpg"],
    });
    expect(push).toHaveBeenCalledWith(
      "/en/dashboard/admin/experiences/original",
    );
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});
