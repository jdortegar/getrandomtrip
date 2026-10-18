import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { NewCampaignPageClient } from "@/components/app/admin/email-campaigns/NewCampaignPageClient";
import {
  buttonByText,
  click,
  deferred,
  draftCampaign,
  field,
  flush,
  jsonResponse,
  mount,
  setValue,
  type Mounted,
} from "./emailCampaignsTestUtils";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "es" }),
  useRouter: () => ({ push }),
}));

const pageCopy = es.adminPages.emailCampaigns;
const copy = pageCopy.editor;
const fetchMock = vi.fn();
let view: Mounted;

function fillRequired(container: HTMLElement) {
  setValue(field(container, "campaign-name"), "Fundadores");
  setValue(field(container, "campaign-subject"), "Tu descuento");
  setValue(field(container, "campaign-title"), "Hola");
  setValue(field(container, "campaign-body"), "Gracias por **esperar**.");
}

function sourceChip(container: HTMLElement, label: string) {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('[data-component="Chip"]'),
  ).find((chip) => chip.textContent === label);
}

function postCalls() {
  return fetchMock.mock.calls.filter(
    ([, init]) => (init as RequestInit | undefined)?.method === "POST",
  );
}

beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  view = mount(<NewCampaignPageClient />);
});

afterEach(() => {
  view.unmount();
  vi.unstubAllGlobals();
});

describe("NewCampaignPageClient", () => {
  it("creates the campaign with the normalized payload and opens its detail page", async () => {
    const { container } = view;
    fetchMock.mockResolvedValue(
      jsonResponse(201, { campaign: draftCampaign({ id: "camp-9" }) }),
    );
    fillRequired(container);
    setValue(field(container, "campaign-preheader"), "  ");
    setValue(field(container, "campaign-cta-label"), " Reservar ");
    setValue(field(container, "campaign-cta-url"), "https://getrandomtrip.com");
    setValue(field(container, "campaign-locale"), "en");
    await click(sourceChip(container, pageCopy.contacts.source.FRIENDS_FAMILY));
    setValue(field(container, "campaign-promo-code"), " fundador30 ");

    await click(buttonByText(container, copy.create));
    await flush();

    expect(postCalls()).toHaveLength(1);
    const [url, init] = postCalls()[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/email-campaigns/campaigns");
    expect(JSON.parse(init.body as string)).toEqual({
      bodyMarkdown: "Gracias por **esperar**.",
      ctaLabel: "Reservar",
      ctaUrl: "https://getrandomtrip.com",
      locale: "en",
      name: "Fundadores",
      preheader: null,
      promoCode: "FUNDADOR30",
      segmentSources: ["WAITLIST", "FRIENDS_FAMILY"],
      subject: "Tu descuento",
      title: "Hola",
    });
    expect(push).toHaveBeenCalledWith("/dashboard/admin/email-campaigns/camp-9");
  });

  it("blocks submission and shows localized field errors", async () => {
    const { container } = view;
    setValue(field(container, "campaign-cta-label"), "Reservar");
    setValue(field(container, "campaign-cta-url"), "http://insecure.example");
    await click(sourceChip(container, pageCopy.contacts.source.WAITLIST));

    await click(buttonByText(container, copy.create));
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    const text = container.textContent ?? "";
    expect(text).toContain(copy.validation.required);
    expect(text).toContain(copy.validation.ctaUrl);
    expect(text).toContain(copy.validation.segment);
    expect(text).toContain(copy.validation.summary);
  });

  it("requires the CTA label and URL together and enforces length limits", async () => {
    const { container } = view;
    fillRequired(container);
    setValue(field(container, "campaign-subject"), "x".repeat(151));
    setValue(field(container, "campaign-cta-url"), "https://getrandomtrip.com");

    await click(buttonByText(container, copy.create));
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain(copy.validation.ctaPair);
    expect(container.textContent).toContain(
      copy.validation.tooLong.replace("{max}", "150"),
    );
  });

  it("maps an invalid promo code API error to localized copy", async () => {
    const { container } = view;
    fetchMock.mockResolvedValue(jsonResponse(400, { error: "invalid_promo_code" }));
    fillRequired(container);
    setValue(field(container, "campaign-promo-code"), "NOPE");

    await click(buttonByText(container, copy.create));
    await flush();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      pageCopy.errors.invalidPromo,
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("maps a 400 validation error to localized copy", async () => {
    const { container } = view;
    fetchMock.mockResolvedValue(jsonResponse(400, { error: "Invalid input" }));
    fillRequired(container);

    await click(buttonByText(container, copy.create));
    await flush();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      pageCopy.errors.validation,
    );
  });

  it("shows a pending state, ignores duplicate submits and recovers after a failure", async () => {
    const { container } = view;
    const pending = deferred<ReturnType<typeof jsonResponse>>();
    fetchMock.mockReturnValueOnce(pending.promise);
    fillRequired(container);

    await click(buttonByText(container, copy.create));
    const busy = buttonByText(container, copy.creating);
    expect(busy?.getAttribute("aria-busy")).toBe("true");
    expect(busy?.disabled).toBe(true);
    expect(busy?.querySelector(".animate-spin")).not.toBeNull();
    await click(busy);
    expect(postCalls()).toHaveLength(1);

    pending.reject(new Error("offline"));
    await flush();

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      pageCopy.errors.generic,
    );
    expect(buttonByText(container, copy.create)?.disabled).toBe(false);
  });

  it("looks up a promo code and shows its rules", async () => {
    const { container } = view;
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        promo: {
          active: true,
          amountOffCents: null,
          code: "FUNDADOR30",
          currency: null,
          expiresAt: "2026-12-31T12:00:00.000Z",
          firstTimeOnly: true,
          id: "promo_1",
          maxRedemptions: 50,
          minimumAmountCents: 10000,
          percentOff: 30,
          redemptionsUsed: 4,
        },
      }),
    );
    setValue(field(container, "campaign-promo-code"), "fundador30");

    await click(buttonByText(container, copy.promo.lookup));
    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/email-campaigns/promo-lookup?code=FUNDADOR30",
    );
    const rules = container.querySelector('[data-component="PromoCodeLookup"]')
      ?.textContent;
    expect(rules).toContain(copy.promo.percentOff.replace("{n}", "30"));
    expect(rules).toContain(
      copy.promo.uses.replace("{used}", "4").replace("{max}", "50"),
    );
    expect(rules).toContain(copy.promo.firstTimeOnly);
    expect(rules).toContain("31 dic 2026");
    expect(rules).toContain("100,00");
  });

  it("shows a not-found message when the promo code does not exist", async () => {
    const { container } = view;
    fetchMock.mockResolvedValue(jsonResponse(404, { error: "Not found" }));
    setValue(field(container, "campaign-promo-code"), "NOPE");

    await click(buttonByText(container, copy.promo.lookup));
    await flush();

    expect(container.textContent).toContain(copy.promo.notFound);
  });

  it("warns when the promo code is inactive", async () => {
    const { container } = view;
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        promo: {
          active: false,
          amountOffCents: 500,
          code: "OLD",
          currency: "usd",
          expiresAt: null,
          firstTimeOnly: false,
          id: "promo_2",
          maxRedemptions: null,
          minimumAmountCents: null,
          percentOff: null,
          redemptionsUsed: 2,
        },
      }),
    );
    setValue(field(container, "campaign-promo-code"), "OLD");

    await click(buttonByText(container, copy.promo.lookup));
    await flush();

    const text = container.textContent ?? "";
    expect(text).toContain(copy.promo.inactive);
    expect(text).toContain(copy.promo.noExpiry);
    expect(text).toContain(copy.promo.usesUnlimited.replace("{used}", "2"));
  });
});
