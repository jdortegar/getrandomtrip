import React from 'react';
import { cn } from '@/lib/utils';

interface BlogArticleProps {
  className?: string;
  content: string | null;
  emptyMessage?: string;
  /** When false, only body/empty state is shown (e.g. title already in HeaderHero). */
  showTitle?: boolean;
  title: string;
}

export default function BlogArticle({
  className,
  content,
  emptyMessage = 'Este post aún no tiene contenido.',
  showTitle = true,
  title,
}: BlogArticleProps) {
  return (
    <article className={cn('text-left', className)}>
      {showTitle ? (
        <h1 className="mb-8 font-barlow-condensed text-4xl font-bold uppercase leading-tight text-neutral-900 md:text-5xl">
          {title}
        </h1>
      ) : title ? (
        <h1 className="sr-only">{title}</h1>
      ) : null}
      {content ? (
        <div
          className={cn(
            'max-w-none prose prose-a:text-light-blue prose-img:rounded-xl prose-lg prose-neutral prose-p:mb-6 text-left',
            'hover:prose-a:text-light-blue-600',
          )}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-neutral-500">{emptyMessage}</p>
      )}
    </article>
  );
}
