"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export interface XsedDropBodyContent {
  id: string;
  title: string;
  content: string;
  images?: { url: string; caption?: string }[];
}

interface XsedDropBodyProps {
  content: XsedDropBodyContent[];
}

function SectionImages({
  images,
}: {
  images: { url: string; caption?: string }[];
}) {
  if (images.length === 0) return null;

  const gridClass =
    images.length === 1
      ? "grid-cols-1"
      : images.length === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <div className={`mt-6 grid gap-3 ${gridClass}`}>
      {images.map((img, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="relative overflow-hidden rounded-xl aspect-video">
            <Image
              alt={img.caption ?? ""}
              className="object-cover aspect-video"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              src={img.url}
            />
          </div>
          {img.caption && (
            <span className="text-xs text-neutral-400">{img.caption}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function XsedDropBody({ content }: XsedDropBodyProps) {
  return (
    <>
      {content.map((section) => (
        <div key={section.id} className="text-left mb-12 container mx-auto">
          <h3 className="mb-2 font-barlow-condensed font-bold uppercase leading-tight text-neutral-900 md:text-3xl">
            {section.title}
          </h3>
          <div
            className={cn(
              "max-w-none prose prose-a:text-light-blue prose-img:rounded-xl prose-lg prose-neutral prose-p:mb-6 text-left",
              "hover:prose-a:text-light-blue-600",
            )}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
          {section.images && section.images.length > 0 && (
            <SectionImages images={section.images} />
          )}
        </div>
      ))}
    </>
  );
}
