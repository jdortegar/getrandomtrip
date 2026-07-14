import React from "react";
import { cn } from "@/lib/utils";

interface BlogArticleProps {
  className?: string;
  content: string | null;
  /** Omit (or pass "") to render nothing when content is empty — used for per-section blocks that shouldn't show the whole-post empty state. */
  emptyMessage?: string;
  /** "h2" for a sub-section title within a longer article body; defaults to "h1" for the whole-post title. */
  headingLevel?: "h1" | "h2";
  /** When false, only body/empty state is shown (e.g. title already in HeaderHero). */
  showTitle?: boolean;
  title: string;
}

const HEADING_CLASSNAME: Record<"h1" | "h2", string> = {
  h1: "mb-8 font-barlow-condensed text-4xl font-bold uppercase leading-tight text-neutral-900 md:text-5xl",
  h2: "mb-6 font-barlow-condensed text-2xl font-bold uppercase leading-tight text-neutral-900 md:text-3xl",
};

export default function BlogArticle({
  className,
  content,
  emptyMessage = "",
  headingLevel = "h1",
  showTitle = true,
  title,
}: BlogArticleProps) {
  const Heading = headingLevel;

  return (
    <article className={cn("text-left", className)}>
      {showTitle ? (
        <Heading className={HEADING_CLASSNAME[headingLevel]}>{title}</Heading>
      ) : title ? (
        <Heading className="sr-only">{title}</Heading>
      ) : null}
      {content ? (
        <div
          className={cn(
            "max-w-none prose prose-a:text-light-blue prose-img:rounded-xl prose-lg prose-neutral prose-p:mb-6 text-left",
            "hover:prose-a:text-light-blue-600",
          )}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : emptyMessage ? (
        <p className="text-neutral-500">{emptyMessage}</p>
      ) : null}
    </article>
  );
}
