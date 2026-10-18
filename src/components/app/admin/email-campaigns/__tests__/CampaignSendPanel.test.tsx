import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { CampaignSendPanel } from "@/components/app/admin/email-campaigns/CampaignSendPanel";
import type { CampaignStatus } from "@/types/emailCampaign";
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
const copy = pageCopy.send;
const API = "/api/admin/email-campaigns/campaigns/camp-1";
const fetchMock = vi.fn();
const onSent = vi.fn();
let view: Mounted | undefined;

function render(status: CampaignStatus) {
  view = mount(
    <CampaignSendPanel
      campaignId="camp-1"
      copy={copy}
      errorsCopy={pageCopy.errors}
      onSent={onSent}
      status={status}
      statusCopy={pageCopy.campaigns.status}
    />,
  );
  return view.container;
}

function sendCalls() {
  return fetchMock.mock.calls.filter(([url]) => url === `${API}/send`);
}

beforeEach(() => {
  fetchMock.mockReset();
  onSent.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  view?.unmount();
  view = undefined;
  vi.unstubAllGlobals();
});

describe("CampaignSendPanel", () => {
  it("counts the audience, asks for an irreversible confirmation, then sends and shows the summary", async () => {
    const container = render("DRAFT");
    const summary = { failed: 1, sent: 7, status: "PARTIAL", total: 8 };
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { count: 8 }))
      .mockResolvedValueOnce(jsonResponse(200, summary));

    await click(buttonByText(container, copy.sendNow));
    await flush();

    expect(fetchMock).toHaveBeenCalledWith(`${API}/audience`);
    expect(sendCalls()).toHaveLength(0);
    expect(container.textContent).toContain(copy.confirmBody.replace("{count}", "8"));

    await click(buttonByText(container, copy.confirm));
    await flush();

    expect(sendCalls()).toEqual([[`${API}/send`, { method: "POST" }]]);
    const status = container.querySelector('[role="status"]')?.textContent ?? "";
    expect(status).toContain(
      copy.summaryTitle.replace("{status}", pageCopy.campaigns.status.PARTIAL),
    );
    expect(status).toContain(
      copy.summary.replace("{sent}", "7").replace("{failed}", "1").replace("{total}", "8"),
    );
    expect(onSent).toHaveBeenCalledWith(summary);
  });

  it("can cancel the confirmation without sending", async () => {
    const container = render("DRAFT");
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { count: 3 }));

    await click(buttonByText(container, copy.sendNow));
    await flush();
    await click(buttonByText(container, copy.cancel));

    expect(container.textContent).not.toContain(copy.confirmBody.replace("{count}", "3"));
    expect(sendCalls()).toHaveLength(0);
  });

  it("notes an empty audience and does not offer to send", async () => {
    const container = render("DRAFT");
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { count: 0 }));

    await click(buttonByText(container, copy.sendNow));
    await flush();

    expect(container.textContent).toContain(copy.emptyAudience);
    expect(buttonByText(container, copy.confirm)).toBeUndefined();
  });

  it("maps a 409 campaign_not_sendable response", async () => {
    const container = render("DRAFT");
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { count: 2 }))
      .mockResolvedValueOnce(jsonResponse(409, { error: "campaign_not_sendable" }));

    await click(buttonByText(container, copy.sendNow));
    await flush();
    await click(buttonByText(container, copy.confirm));
    await flush();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      pageCopy.errors.notSendable,
    );
    expect(onSent).not.toHaveBeenCalled();
    expect(buttonByText(container, copy.sendNow)?.disabled).toBe(false);
  });

  it.each([
    ["campaign_empty_audience", pageCopy.errors.emptyAudience],
    ["invalid_promo_code", pageCopy.errors.invalidPromo],
  ])("maps a 400 %s response", async (code, message) => {
    const container = render("DRAFT");
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { count: 2 }))
      .mockResolvedValueOnce(jsonResponse(400, { error: code }));

    await click(buttonByText(container, copy.sendNow));
    await flush();
    await click(buttonByText(container, copy.confirm));
    await flush();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(message);
  });

  it("shows pending states and guards duplicate sends", async () => {
    const container = render("DRAFT");
    const audience = deferred<ReturnType<typeof jsonResponse>>();
    const send = deferred<ReturnType<typeof jsonResponse>>();
    fetchMock.mockReturnValueOnce(audience.promise).mockReturnValueOnce(send.promise);

    await click(buttonByText(container, copy.sendNow));
    const checking = buttonByText(container, copy.checking);
    expect(checking?.getAttribute("aria-busy")).toBe("true");
    await click(checking);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    audience.resolve(jsonResponse(200, { count: 4 }));
    await flush();
    await click(buttonByText(container, copy.confirm));
    const sending = buttonByText(container, copy.sending);
    expect(sending?.getAttribute("aria-busy")).toBe("true");
    expect(sending?.disabled).toBe(true);
    expect(sending?.querySelector(".animate-spin")).not.toBeNull();
    await click(sending);
    expect(sendCalls()).toHaveLength(1);

    send.reject(new Error("timeout"));
    await flush();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      pageCopy.errors.generic,
    );
    expect(buttonByText(container, copy.sendNow)?.disabled).toBe(false);
  });

  it("offers a retry for PARTIAL campaigns through the same endpoint", async () => {
    const container = render("PARTIAL");
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { count: 8 }))
      .mockResolvedValueOnce(
        jsonResponse(200, { failed: 0, sent: 8, status: "SENT", total: 8 }),
      );

    expect(buttonByText(container, copy.sendNow)).toBeUndefined();
    await click(buttonByText(container, copy.retry));
    await flush();
    expect(container.textContent).toContain(copy.retryBody);

    await click(buttonByText(container, copy.confirm));
    await flush();

    expect(sendCalls()).toHaveLength(1);
    expect(onSent).toHaveBeenCalledWith({ failed: 0, sent: 8, status: "SENT", total: 8 });
  });

  it("explains a send in progress and renders nothing for a sent campaign", () => {
    const sending = render("SENDING");
    expect(sending.textContent).toContain(copy.inProgress);
    expect(buttonByText(sending, copy.sendNow)).toBeUndefined();
    view?.unmount();

    const sent = render("SENT");
    expect(sent.textContent).toBe("");
  });
});
