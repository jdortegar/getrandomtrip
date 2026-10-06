import Link from "@/components/common/LocalizedLink";
import Img from "@/components/common/Img";
import { cn } from "@/lib/utils";
import type { DropEntry } from "@/types/core";

interface DropCardProps {
  drop: DropEntry;
  featured?: boolean;
  /** Fill a height-capped mosaic cell so the image can shrink with the grid. */
  fill?: boolean;
}

export function DropCard({
  drop,
  featured = false,
  fill = false,
}: DropCardProps) {
  const fillsCell = featured || fill;

  return (
    <Link
      className={cn(
        "flex flex-col group text-left",
        fillsCell && "h-full min-h-0",
      )}
      href={`/blog/${drop.slug}`}
      data-component="DropCard"
    >
      <div
        className={cn(
          "relative mb-2 min-h-0 overflow-hidden rounded-xl",
          fillsCell
            ? "aspect-square lg:aspect-auto lg:flex-1"
            : "aspect-square",
        )}
      >
        <Img
          alt={drop.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          height={600}
          src={drop.image}
          width={800}
        />
        {drop.label && (
          <div
            className="absolute drop-shadow flex font-barlow gap-2 items-top left-6 text-base text-white top-3 tracking-[0.2em] uppercase"
            data-drop-badge
          >
            <span aria-hidden className="font-semibold text-xsed">
              |
            </span>
            <span className="font-light">XSED</span>
            <span className="font-bold text-xsed">{drop.label}</span>
          </div>
        )}
        {drop.soldOut && (
          <div className="absolute right-3 top-3 rounded-[6px] bg-xsed px-3 py-1 text-xs text-white uppercase">
            <span className="font-bold">SOLD OUT</span>
            {drop.soldOutDetail && (
              <span className="ml-1 font-normal">{drop.soldOutDetail}</span>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 shrink-0 pb-3">
        {/* <p className="font-barlow mb-1 text-xs font-bold uppercase tracking-widest text-xsed">
          {drop.date}
        </p> */}
        <p className="font-barlow-condensed text-3xl text-neutral-600 font-extralight line-clamp-2 min-h-[4.5rem]">
          {drop.title}
        </p>
        <hr className="mt-2 border-xsed" />
      </div>
    </Link>
  );
}
