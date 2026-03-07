import React from 'react';
import { cn } from '@/lib/utils';

interface BlogArticleProps {
  className?: string;
  content: string | null;
  emptyMessage?: string;
  title: string;
}

export default function BlogArticle({
  className,
  content,
  emptyMessage = 'Este post aún no tiene contenido.',
  title,
}: BlogArticleProps) {
  return (
    <article className={cn('text-left', className)}>
      <h1 className="mb-8 font-barlow-condensed text-4xl font-bold uppercase leading-tight text-neutral-900 md:text-5xl">
        {title}
      </h1>
      {content ? (
        <div
          className="prose prose-neutral max-w-none text-left text-lg leading-relaxed prose-p:mb-6 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-neutral-500">{emptyMessage}</p>
      )}
    </article>
  );
}
