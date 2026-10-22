import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { CampaignPreviewPanel } from "@/components/app/admin/email-campaigns/CampaignPreviewPanel";
import {
  buttonByText,
  click,
  deferred,
  flush,
  jsonResponse,
  mount,
  type Mounted,
} from "./emailCampaignsTestUtils";

const pageCopy = es.adminPages.emailCampaigns;
const copy = pageCopy.preview;
const fetchMock = vi.fn();
let view: Mounted;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  view = mount(
    <CampaignPreviewPanel
      campaignId="camp-1"
      copy={copy}
      errorsCopy={pageCopy.errors}
      version="2026-06-02T00:00:00.000Z"
    />,
  );
});

afterEach(() => {
  view.unmount();
  vi.unstubAllGlobals();
});

describe("CampaignPreviewPanel", () => {
  it("renders the preview route in a fully sandboxed, titled iframe", () => {
    const frame = view.container.querySelector("iframe");
    expect(frame?.getAttribute("src")).toBe(
      "/api/admin/email-campaigns/campaigns/camp-1/preview?v=2026-06-02T00%3A00%3A00.000Z",
    );
    expect(frame?.getAttribute("sandbox")).toBe("");
    expect(frame?.getAttribute("title")).toBe(copy.frameTitle);
    expect(view.container.textContent).toContain(copy.unsubscribeNote);
  });

  it("sends a test to the admin and shows the destination email", async () => {
    const pending = deferred<ReturnType<typeof jsonResponse>>();
    fetchMock.mockReturnValueOnce(pending.promise);

    await click(buttonByText(view.container, copy.testSend));
    const busy = buttonByText(view.container, copy.testSending);
    expect(busy?.getAttribute("aria-busy")).toBe("true");
    expect(busy?.disabled).toBe(true);
    await click(busy);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/email-campaigns/campaigns/camp-1/test-send",
      { method: "POST" },
    );

    pending.resolve(jsonResponse(200, { ok: true, to: "admin@getrandomtrip.com" }));
    await flush();

    expect(view.container.querySelector('[role="status"]')?.textContent).toBe(
      copy.testSent.replace("{email}", "admin@getrandomtrip.com"),
    );
    expect(buttonByText(view.container, copy.testSend)?.disabled).toBe(false);
  });

  it("localizes a missing admin email error", async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: "admin_email_missing" }));

    await click(buttonByText(view.container, copy.testSend));
    await flush();

    expect(view.container.querySelector('[role="alert"]')?.textContent).toBe(
      pageCopy.errors.adminEmailMissing,
    );
  });

  it("shows a generic error when the request fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    await click(buttonByText(view.container, copy.testSend));
    await flush();

    expect(view.container.querySelector('[role="alert"]')?.textContent).toBe(
      pageCopy.errors.generic,
    );
    expect(buttonByText(view.container, copy.testSend)?.disabled).toBe(false);
  });
});
