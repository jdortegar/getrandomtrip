"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "@/hooks/useDictionary";
import { localizeHref } from "@/lib/i18n/localizeHref";

/** URL-authoritative locale routing cannot rely on a previous language cookie. */
export default function LocalizedLink({
  href,
  ...props
}: ComponentProps<typeof Link>) {
  const locale = useLocale();
  const localizedHref =
    typeof href === "string"
      ? localizeHref(locale, href)
      : typeof href.pathname === "string" &&
          !href.protocol &&
          !href.host &&
          !href.hostname
        ? { ...href, pathname: localizeHref(locale, href.pathname) }
        : href;
  return <Link {...props} href={localizedHref} />;
}
