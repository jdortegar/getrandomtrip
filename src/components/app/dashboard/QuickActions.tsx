import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DashboardCopy } from "./types";

interface QuickActionsProps {
  copy: DashboardCopy;
}

export function QuickActions({ copy }: QuickActionsProps) {
  const actions = [
    {
      href: "/journey",
      icon: Plus,
      key: "new-trip",
      label: copy.quickActions.newTrip,
      variant: "default" as const,
    },
    {
      href: "/profile",
      icon: MapPin,
      key: "profile",
      label: copy.quickActions.profile,
      variant: "ghost" as const,
    },
    // {
    //   href: "#historial",
    //   icon: Clock,
    //   key: "history",
    //   label: copy.quickActions.history,
    //   variant: "ghost" as const,
    // },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        {copy.quickActions.title}
      </h3>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              asChild
              className="w-full justify-start"
              key={action.key}
              variant={action.variant}
            >
              <Link href={action.href}>
                <Icon className="w-4 h-4" />
                {action.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
