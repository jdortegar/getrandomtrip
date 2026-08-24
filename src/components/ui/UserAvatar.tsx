"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/slices/userStore";

interface UserAvatarProps {
  height: number;
  onAvatarChange?: (file: File) => void;
  /** Takes priority over `onAvatarChange` when set — click invokes this
   * instead of opening the native file picker (e.g. to open a crop modal
   * that owns its own file selection). */
  onClick?: () => void;
  showStatus?: boolean;
  uploading?: boolean;
  width: number;
}

export function UserAvatar({
  height,
  onAvatarChange,
  onClick,
  showStatus = false,
  uploading = false,
  width,
}: UserAvatarProps) {
  const { user } = useUserStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const name = user?.name;
  const imageUrl = user?.avatar;
  const initial = name?.charAt(0)?.toUpperCase() || "U";
  const fontSize = Math.max(12, Math.round(Math.min(height, width) * 0.4));
  // Status badge scales sub-linearly with avatar size, clamped to a modest
  // 14-28px range — a status dot should stay a small accent at any avatar
  // size, not grow 1:1 with it. Separation from the photo is a `ring`
  // (box-shadow) rather than a `border` — a border eats into the dot's own
  // fill area, a ring sits crisply outside it, matching the same pattern
  // already used for the navbar's unread dot (DashboardUnreadDot.tsx).
  // The photo's own outline shares this exact ring width so the photo and
  // the badge read as one consistent element instead of two mismatched ones.
  const avatarSize = Math.min(height, width);
  const statusSize = Math.min(28, Math.max(14, Math.round(avatarSize * 0.2)));
  const ringWidth = Math.max(1, Math.round(statusSize * 0.12));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onAvatarChange?.(file);
  };

  const avatarContent = (
    <>
      {imageUrl ? (
        <div
          className="h-full w-full overflow-hidden rounded-full"
          style={{ boxShadow: `0 0 0 ${ringWidth}px #e5e7eb` }}
        >
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
          className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 font-bold text-white"
          style={{ boxShadow: `0 0 0 ${ringWidth}px #e5e7eb`, fontSize }}
        >
          {initial}
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      )}

      {(onClick || onAvatarChange) && !uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      )}
    </>
  );

  return (
    <div className="relative" style={{ height, width }}>
      {onClick || onAvatarChange ? (
        <>
          {onAvatarChange && (
            <input
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              ref={inputRef}
              type="file"
            />
          )}
          <button
            className="group relative block h-full w-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed cursor-pointer"
            disabled={uploading}
            onClick={() => (onClick ? onClick() : inputRef.current?.click())}
            type="button"
          >
            {avatarContent}
          </button>
        </>
      ) : (
        avatarContent
      )}

      {showStatus && (
        <div
          className="absolute rounded-full bg-green-500"
          style={{
            bottom: 0,
            right: "4%",
            height: statusSize,
            width: statusSize,
            boxShadow: `0 0 0 ${ringWidth}px white`,
          }}
        />
      )}
    </div>
  );
}
