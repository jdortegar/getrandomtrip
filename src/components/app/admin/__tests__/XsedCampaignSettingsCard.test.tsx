import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { XsedCampaignSettingsCard } from "../XsedCampaignSettingsCard";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const copy = en.adminPages.features.xsedCampaign;
let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;
const response = () => ({
  ok: true,
  json: async () => ({ xsedCampaignStartDate: "2026-10-04" }),
});

function submit() {
  container
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}
function changeDate(value: string) {
  const input = container.querySelector("input")!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  act(() =>
    root.render(
      <XsedCampaignSettingsCard copy={copy} initialStartDate="2026-09-27" />,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("campaign settings save", () => {
  it("shows pending feedback, prevents rapid duplicate requests and saves only the date", async () => {
    let resolve!: (value: ReturnType<typeof response>) => void;
    fetchMock.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    changeDate("2026-10-04");
    act(() => {
      submit();
      submit();
    });
    const button = container.querySelector("button")!;
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain(copy.saving);
    expect(button.querySelector("svg")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/site-settings",
      expect.objectContaining({
        body: JSON.stringify({ xsedCampaignStartDate: "2026-10-04" }),
        method: "PATCH",
      }),
    );
    await act(async () => {
      resolve(response());
    });
    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      copy.savedNote,
    );
  });

  it("preserves the draft and enables retry after a network failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    changeDate("2026-10-04");
    await act(async () => submit());
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      copy.errorSave,
    );
    expect(container.querySelector("input")?.value).toBe("2026-10-04");
    expect(container.querySelector("button")?.disabled).toBe(false);
    fetchMock.mockResolvedValueOnce(response());
    await act(async () => submit());
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("localizes server validation errors and leaves the form retryable", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "invalid_campaign_date" }),
    });
    changeDate("2026-10-04");
    await act(async () => submit());
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      copy.invalidDate,
    );
    expect(container.querySelector("button")?.disabled).toBe(false);
  });

  it("rejects empty dates without a request", async () => {
    changeDate("");
    await act(async () => submit());
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      copy.invalidDate,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
