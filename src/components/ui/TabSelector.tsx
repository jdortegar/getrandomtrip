"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SPRING_TRANSITION = {
  damping: 30,
  stiffness: 500,
  type: "spring" as const,
};

const VARIANT_STYLES = {
  inline: {
    container: "flex overflow-x-auto border-b border-gray-200",
    indicator:
      "absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-light-blue",
    tab: "relative flex min-w-[8.5rem] flex-1 basis-0 cursor-pointer items-center justify-center gap-2 px-3 py-3 text-center text-sm transition-colors sm:min-w-0",
    tabActive: "font-semibold text-light-blue",
    tabInactive: "text-neutral-500 hover:text-neutral-700",
  },
  marketing: {
    container: "mb-20 flex justify-center gap-8 text-xl text-[#172C36]",
    indicator:
      "absolute -bottom-3 left-0 right-0 m-auto h-[2px] w-1/2 rounded-full bg-light-blue",
    tab: "relative cursor-pointer",
    tabActive: "text-[#172C36]",
    tabInactive: "text-[#858585]",
  },
};

interface TabSelectorTab {
  disabled?: boolean;
  href?: string;
  icon?: LucideIcon;
  id: string;
  label: string;
}

interface TabSelectorProps {
  activeTab: string;
  className?: string;
  indicatorClassName?: string;
  layoutId?: string;
  onTabChange: (tab: string) => void;
  tabClassName?: string;
  tabs: TabSelectorTab[];
  variant?: keyof typeof VARIANT_STYLES;
}

export function TabSelector({
  activeTab,
  className,
  indicatorClassName,
  layoutId = "activeTab",
  onTabChange,
  tabClassName,
  tabs,
  variant = "marketing",
}: TabSelectorProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className={cn(styles.container, className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            className={cn(
              styles.tab,
              tabClassName,
              isActive ? styles.tabActive : styles.tabInactive,
            )}
            disabled={tab.disabled}
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            type="button"
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span className="text-balance leading-tight">{tab.label}</span>
            {isActive && (
              <motion.div
                className={cn(styles.indicator, indicatorClassName)}
                layoutId={layoutId}
                transition={SPRING_TRANSITION}
                {...(variant === "marketing"
                  ? {
                      viewport: { margin: "-100px", once: true },
                      whileInView: { opacity: 1 },
                    }
                  : {})}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
