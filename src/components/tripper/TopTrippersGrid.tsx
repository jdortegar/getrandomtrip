"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import TripperCard from "@/components/TripperCard";
import TripperSearchModal, {
  type TripperSearchItem,
} from "@/components/tripper/TripperSearchModal";
import { useDictionary } from "@/hooks/useDictionary";

interface TopTrippersGridProps {
  trippers: TripperSearchItem[];
}

export default function TopTrippersGrid({ trippers }: TopTrippersGridProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const copy = useDictionary((d) => d.trippers.grid);

  return (
    <div className=" py-16 container mx-auto px-4 md:px-20">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {trippers.map((tripper, i) => (
          <motion.div
            key={tripper.id}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
          >
            <TripperCard
              bio={tripper.bio || ""}
              href={tripper.tripperSlug}
              imageUrl={tripper.avatarUrl ?? ""}
              instagramUrl={tripper.tripperSlug}
              name={tripper.name}
            />
          </motion.div>
        ))}

        {/* Search card */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 30 }}
          transition={{
            duration: 0.5,
            delay: trippers.length * 0.06,
            ease: "easeOut",
          }}
        >
          <button
            className="group flex aspect-269/230 w-full cursor-pointer flex-col justify-between rounded-lg bg-slate-900 p-4 md:p-5 lg:p-6 text-left transition-all hover:bg-slate-800"
            onClick={() => setSearchOpen(true)}
            type="button"
          >
            <h3 className="font-barlow-condensed text-lg font-bold leading-tight text-white md:text-xl lg:text-4xl">
              {copy.searchCardTitle}
            </h3>
            <div>
              {/* Hidden below `lg` — the card follows the same aspect-ratio
                  box as the tripper photo cards beside it, and at 2/3-column
                  widths there isn't room for the description without pushing
                  the card past that shared ratio (min-content height on a
                  flex child can override `aspect-ratio` when content
                  doesn't fit, unlike the sibling cards' absolutely
                  positioned name overlay). */}
              <p className="mb-4 hidden text-sm leading-snug text-white lg:block">
                {copy.searchCardDescription}
              </p>
              <span className="text-right inline-flex items-center justify-end gap-1 text-xs font-medium text-white transition-gap group-hover:gap-2 w-full md:text-sm">
                {copy.searchCardCta}
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </button>
        </motion.div>
      </div>

      <TripperSearchModal
        onClose={() => setSearchOpen(false)}
        open={searchOpen}
        trippers={trippers}
      />
    </div>
  );
}
