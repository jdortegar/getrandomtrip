"use client";

import Link from "next/link";

const BASE =
  "flex h-[34px] w-[34px] items-center justify-center rounded-[6px] border border-gray-200 bg-white text-neutral-500 transition-colors";

const TOOLTIP =
  "pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-gray-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100";

const ARROW =
  "absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900";

interface TableIconButtonProps {
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title: string;
}

export function TableIconButton({
  children,
  danger,
  disabled,
  onClick,
  title,
}: TableIconButtonProps) {
  return (
    <div className="group relative">
      <button
        className={`${BASE} disabled:opacity-40 ${
          danger
            ? "hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            : "hover:border-gray-300 hover:bg-neutral-100 hover:text-neutral-900"
        }`}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
      <div className={TOOLTIP}>
        {title}
        <span className={ARROW} />
      </div>
    </div>
  );
}

interface TableIconLinkProps {
  children: React.ReactNode;
  href: string;
  onClick?: () => void;
  title: string;
}

export function TableIconLink({ children, href, onClick, title }: TableIconLinkProps) {
  return (
    <div className="group relative">
      <Link
        className={`${BASE} hover:border-gray-300 hover:bg-neutral-100 hover:text-neutral-900`}
        href={href}
        onClick={onClick}
      >
        {children}
      </Link>
      <div className={TOOLTIP}>
        {title}
        <span className={ARROW} />
      </div>
    </div>
  );
}
