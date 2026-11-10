import { Suspense } from "react";
import { BlogIndex } from "@/components/blog/BlogIndex";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { BLOG_INDEX_PAGE_SIZE } from "@/lib/constants/blog-filters";
import { listBlogIndexPage } from "@/lib/blog/listBlogIndexPage";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { BlogIndexInitial } from "@/lib/types/BlogIndexPost";

export default async function BlogPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tripperId?: string | string[] }>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const locale: Locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = (locale === "en" ? en : es) as Dictionary;

  // Render the unfiltered first page on the server so crawlers find the post
  // links in the HTML; filtered views (tripperId) keep loading client-side.
  let initial: BlogIndexInitial | undefined;
  if (!searchParams.tripperId) {
    try {
      const { blogs, pagination } = await listBlogIndexPage(
        locale,
        {},
        1,
        BLOG_INDEX_PAGE_SIZE,
      );
      initial = { blogs, hasMore: pagination.hasMore };
    } catch (error) {
      console.error("Error prerendering blog index:", error);
    }
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BlogIndex copy={dict.blogPage} initial={initial} locale={locale} />
    </Suspense>
  );
}
