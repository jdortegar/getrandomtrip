"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogViewAll } from "@/lib/data/shared/blog-types";
import { Button } from "./ui/Button";

interface BlogViewAllCardProps {
  viewAll: BlogViewAll;
}

export default function BlogViewAllCard({ viewAll }: BlogViewAllCardProps) {
  return (
    <div className="group relative block aspect-3/4 w-full overflow-hidden rounded-2xl text-left shadow-lg transition-transform duration-300 hover:-translate-y-1">
      <Link
        aria-label={viewAll.title}
        className="absolute inset-0 z-0"
        href={viewAll.href}
      />

      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-700" />

      {/* Decorative circle */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-start justify-end p-5 text-white md:p-7">
        <span className="text-amber-300 text-xs font-semibold uppercase tracking-[0.4em]">
          Blog
        </span>
        <h3 className="mt-2 font-barlow-condensed text-xl font-bold leading-tight md:text-2xl">
          {viewAll.title}
        </h3>
        <p className="mt-2 text-sm text-white/70 leading-snug">
          {viewAll.subtitle}
        </p>
        <Button
          variant="outline"
          className="pointer-events-auto relative mt-4 h-9 border-white/50 bg-transparent px-4 text-xs font-medium hover:bg-white/10 mr-auto! w-fit"
        >
          Ver todos
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}
