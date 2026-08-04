"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** e.g. "Page {page} of {totalPages}" — both placeholders get replaced. */
  pageOfLabel: string;
  previousLabel: string;
  nextLabel: string;
}

/** Reusable prev/next pager. Works for any table driven by page/limit query params. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  pageOfLabel,
  previousLabel,
  nextLabel,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const label = pageOfLabel
    .replace("{page}", String(page))
    .replace("{totalPages}", String(totalPages));

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        className="flex h-11 items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-4 text-[13px] font-medium text-neutral-600 transition-colors hover:border-gray-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {previousLabel}
      </button>
      <span className="text-[13px] text-neutral-400">{label}</span>
      <button
        className="flex h-11 items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-4 text-[13px] font-medium text-neutral-600 transition-colors hover:border-gray-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        {nextLabel}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
