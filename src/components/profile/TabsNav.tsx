"use client";
import { useState, useEffect } from "react";

const TABS = ["Overview", "Reseñas", "Favoritos", "Bitácoras"] as const;
type Tab = typeof TABS[number];

export default function TabsNav({ onChange }: { onChange: (t: Tab) => void }) {
  const [active, setActive] = useState<Tab>("Overview");
  useEffect(() => onChange(active), [active, onChange]);

  return (
    <div className="sticky top-16 z-10 -mt-2 mb-4 border-b border-neutral-200 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-neutral-900/70">
      <div className="mx-auto flex rt-container gap-4 px-2 py-2">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`rounded-full px-3 py-1 text-sm ${active===tab ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "hover:bg-neutral-100 dark:hover:bg-white/10"}`}
            aria-current={active===tab ? "page" : undefined}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
