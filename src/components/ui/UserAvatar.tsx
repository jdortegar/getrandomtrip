"use client";

import Image from "next/image";
import { useUserStore } from "@/store/slices/userStore";

interface UserAvatarProps {
  height: number;
  showStatus?: boolean;
  width: number;
}

export function UserAvatar({ height, showStatus = false, width }: UserAvatarProps) {
  const { user } = useUserStore();
  const name = user?.name;
  const imageUrl = user?.avatar;
  const initial = name?.charAt(0)?.toUpperCase() || "U";
  const fontSize = Math.max(12, Math.round(Math.min(height, width) * 0.4));

  return (
    <div className="relative" style={{ height, width }}>
      {imageUrl ? (
        <div className="h-full w-full overflow-hidden rounded-full ring-1 ring-gray-200">
          <Image
            alt={name || "User avatar"}
            className="h-full w-full object-cover"
            height={height}
            src={imageUrl}
            width={width}
          />
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white"
          style={{ fontSize }}
        >
          {initial}
        </div>
      )}
      {showStatus ? (
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-4 border-white bg-green-500" />
      ) : null}
    </div>
  );
}
