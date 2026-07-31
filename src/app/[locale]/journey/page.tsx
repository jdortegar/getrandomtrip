import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import JourneyPageClient from "./JourneyPageClient";

export { getAccordionForStep } from "@/lib/helpers/journey";

export async function generateMetadata(props: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const locale = params?.locale;
  const dict = await getDictionary(hasLocale(locale) ? locale! : "es");
  const meta = dict.journey.meta;
  return {
    description: meta.description,
    robots: { follow: false, index: false },
    title: meta.title,
  };
}

export default function JourneyPage(props: {
  params?: Promise<{ locale?: string }>;
}) {
  return <JourneyPageClient params={props.params} />;
}
