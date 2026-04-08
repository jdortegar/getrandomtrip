"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useUserStore } from "@/store/slices/userStore";
import { getTrips } from "@/lib/utils/trips";

export interface JourneyUserBadgeLabels {
  guest: string;
  levelLabel: string;
  levels: {
    adventurer: string;
    beginner: string;
    explorer: string;
    nomad: string;
    randomtripper: string;
  };
}

interface JourneyUserBadgeProps {
  labels: JourneyUserBadgeLabels;
}

function getTripLevel(
  count: number,
  levels: JourneyUserBadgeLabels["levels"],
): string {
  if (count === 0) return levels.beginner;
  if (count <= 2) return levels.explorer;
  if (count <= 5) return levels.adventurer;
  if (count <= 10) return levels.nomad;
  return levels.randomtripper;
}

export function JourneyUserBadge({ labels }: JourneyUserBadgeProps) {
  const { data: session } = useSession();
  const { user } = useUserStore();
  const [completedTrips, setCompletedTrips] = useState(0);

  const name = session?.user?.name || user?.name;

  useEffect(() => {
    if (!session?.user?.email) return;
    getTrips()
      .then((trips) => {
        setCompletedTrips(trips.filter((t) => t.status === "COMPLETED").length);
      })
      .catch(() => {});
  }, [session?.user?.email]);

  const level = getTripLevel(completedTrips, labels.levels);

  return (
    <div className="flex items-center gap-3">
      <UserAvatar height={40} width={40} />

      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400 leading-tight">
          {name ?? labels.guest}
        </span>

        <span className="text-sm font-semibold text-neutral-900 leading-tight">
          {level}
        </span>
      </div>
    </div>
  );
}
