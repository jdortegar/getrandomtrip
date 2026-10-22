import type { Metadata } from "next";

import { UnsubscribeClient } from "@/components/app/email-campaigns/UnsubscribeClient";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/** Token-bearing URLs must never be indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ locale?: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function UnsubscribePage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(rawLocale) ? rawLocale : "es";
  const { token } = await searchParams;
  const dict = await getDictionary(locale);

  return (
    <UnsubscribeClient
      copy={dict.emailUnsubscribe}
      locale={locale}
      token={typeof token === "string" && token ? token : null}
    />
  );
}
