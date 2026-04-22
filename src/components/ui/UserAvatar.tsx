"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useUserStore } from "@/store/slices/userStore";

interface UserAvatarProps {
  height: number;
  onAvatarChange?: (file: File) => void;
  showStatus?: boolean;
  width: number;
}

export function UserAvatar({
  height,
  onAvatarChange,
  showStatus = false,
  width,
}: UserAvatarProps) {
  const { user } = useUserStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const name = user?.name;
  const imageUrl = user?.avatar;
  const initial = name?.charAt(0)?.toUpperCase() || "U";
  const fontSize = Math.max(12, Math.round(Math.min(height, width) * 0.4));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onAvatarChange?.(file);
  };

  const avatarContent = (
    <>
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

      {onAvatarChange && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      )}
    </>
  );

  return (
    <div className="relative" style={{ height, width }}>
      {onAvatarChange ? (
        <>
          <input
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={inputRef}
            type="file"
          />
          <button
            className="group relative block h-full w-full cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {avatarContent}
          </button>
        </>
      ) : (
        avatarContent
      )}

      {showStatus && (
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-4 border-white bg-green-500" />
      )}
    </div>
  );
}
