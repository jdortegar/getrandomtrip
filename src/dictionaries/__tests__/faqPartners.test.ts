import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { buildLlmsTxt } from "@/lib/seo/llmsTxt";

const PARTNERS = ["Duffel", "Booking.com", "Viator", "GetYourGuide", "Stripe"];

describe("FAQ partners answer", () => {
  it.each([
    ["es", es, "¿Con quién trabajan para armar mi viaje?"],
    ["en", en, "Who do you work with to put my trip together?"],
  ])("names every partner and its role in the %s FAQ", (_, dict, question) => {
    const item = dict.faqPage.block.items.find((i) => i.question === question);

    expect(item).toBeDefined();
    for (const partner of PARTNERS) expect(item!.answer).toContain(partner);
  });

  it.each([
    ["es", es],
    ["en", en],
  ])("keeps the about-us FAQ identical to the FAQ page (%s)", (_, dict) => {
    expect(dict.aboutUs.faq.items).toEqual(dict.faqPage.block.items);
  });

  it("puts every partner in /llms.txt", () => {
    const txt = buildLlmsTxt();
    for (const partner of PARTNERS) expect(txt).toContain(partner);
  });
});
