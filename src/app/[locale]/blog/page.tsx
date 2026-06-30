import { Suspense, use } from "react";
import { BlogIndex } from "@/components/blog/BlogIndex";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export default function BlogPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = use(props.params);
  const locale: Locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = (locale === "en" ? en : es) as Dictionary;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BlogIndex copy={dict.blogPage} locale={locale} />
    </Suspense>
  );
}
