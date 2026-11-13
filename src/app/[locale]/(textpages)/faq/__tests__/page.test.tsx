import { Children, isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/JsonLd";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import FaqPage from "../page";

type FaqSchema = {
  "@type": string;
  mainEntity: Array<{ acceptedAnswer: { text: string }; name: string }>;
};

async function findFaqSchema(locale: string): Promise<FaqSchema> {
  const page = await FaqPage({ params: Promise.resolve({ locale }) });
  const jsonLd = Children.toArray(page.props.children).find(
    (child) => isValidElement(child) && child.type === JsonLd,
  );
  expect(jsonLd).toBeDefined();
  return (jsonLd as unknown as { props: { schema: FaqSchema } }).props.schema;
}

describe("FAQ page structured data", () => {
  it.each([
    ["es", es.faqPage.block.items],
    ["en", en.faqPage.block.items],
  ])(
    "emits FAQPage JSON-LD with every %s question and answer",
    async (locale, items) => {
      const schema = await findFaqSchema(locale);

      expect(schema["@type"]).toBe("FAQPage");
      expect(schema.mainEntity).toHaveLength(items.length);
      items.forEach((item, i) => {
        expect(schema.mainEntity[i].name).toBe(item.question);
        expect(schema.mainEntity[i].acceptedAnswer.text).toBe(item.answer);
      });
    },
  );

  it.each([
    ["es", "48 horas antes de salir"],
    ["en", "48 hours before departure"],
  ])(
    "states the %s reveal timing as 48 hours before departure",
    async (locale, phrase) => {
      const schema = await findFaqSchema(locale);

      expect(schema.mainEntity[0].acceptedAnswer.text).toContain(phrase);
    },
  );
});
