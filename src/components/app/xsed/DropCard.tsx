import Link from "next/link";
import Img from "@/components/common/Img";
import { cn } from "@/lib/utils";
import type { DropEntry } from "@/types/core";

interface DropCardProps {
  drop: DropEntry;
  featured?: boolean;
}

export function DropCard({ drop, featured = false }: DropCardProps) {
  return (
    <Link
      className={cn("flex flex-col text-left group", featured && "md:h-full")}
      href={`/xsed/drops/${drop.slug}`}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl",
          featured
            ? "aspect-square md:aspect-auto md:flex-1 md:min-h-0 mb-2"
            : "aspect-square mb-2",
        )}
      >
        <Img
          alt={drop.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          height={600}
          src={drop.image}
          width={800}
        />
        <div className="font-barlow absolute left-6 top-3 flex items-center gap-1 text-base font-semibold text-white drop-shadow">
          <span className="text-xsed">|</span>
          <span className="font-extralight">XSED</span>
          <span className="font-bold text-xsed">Nº{drop.number}</span>
        </div>
        {drop.soldOut && (
          <div className="absolute right-3 top-3 rounded-full bg-xsed px-3 py-1 text-xs text-white">
            <span className="font-bold">SOLD OUT</span>
            {drop.soldOutDetail && (
              <span className="ml-1 font-normal">{drop.soldOutDetail}</span>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 pb-3">
        <p className="font-barlow mb-1 text-xs font-bold uppercase tracking-widest text-xsed">
          {drop.date}
        </p>
        <p className="font-barlow-condensed text-3xl text-neutral-600 font-extralight">
          {drop.title}
        </p>
        <hr className="mt-2 border-xsed" />
      </div>
    </Link>
  );
}
